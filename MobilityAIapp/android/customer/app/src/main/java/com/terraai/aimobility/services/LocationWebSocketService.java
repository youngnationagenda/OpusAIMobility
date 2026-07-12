package com.terraai.aimobility.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/**
 * LocationWebSocketService — TERRA-041
 * ──────────────────────────────────────
 * Foreground service that:
 *  1. Requests ACCESS_FINE_LOCATION every 10 seconds
 *  2. Sends lat/lng updates via WebSocket to aimobility-ws API Gateway
 *  3. Lambda broadcasts location to customer tracking the active ride
 *  4. Stops automatically when ride completes
 *
 * Usage:
 *   Intent intent = new Intent(context, LocationWebSocketService.class);
 *   intent.putExtra("rideId", "TRP-XXXX");
 *   intent.putExtra("riderId", "usr_abc");
 *   intent.putExtra("wsToken", cognito_id_token);
 *   startForegroundService(intent);
 *
 * Stop:
 *   stopService(new Intent(context, LocationWebSocketService.class));
 */
public class LocationWebSocketService extends Service {

    private static final String TAG              = "LocationWS";
    private static final String CHANNEL_ID       = "terraai_location";
    private static final String WS_BASE_URL      = "wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod";
    private static final long   LOCATION_INTERVAL_MS  = 10_000L; // 10 seconds
    private static final long   LOCATION_FASTEST_MS   = 5_000L;
    private static final int    NOTIFICATION_ID  = 1001;

    private FusedLocationProviderClient fusedClient;
    private LocationCallback            locationCallback;
    private OkHttpClient                httpClient;
    private WebSocket                   webSocket;

    private String rideId;
    private String riderId;
    private String wsToken;
    private boolean wsConnected = false;

    // ── Lifecycle ─────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        fusedClient = LocationServices.getFusedLocationProviderClient(this);
        httpClient  = new OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .build();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) { stopSelf(); return START_NOT_STICKY; }

        rideId  = intent.getStringExtra("rideId");
        riderId = intent.getStringExtra("riderId");
        wsToken = intent.getStringExtra("wsToken");

        if (rideId == null || riderId == null || wsToken == null) {
            Log.e(TAG, "Missing required extras: rideId, riderId, wsToken");
            stopSelf();
            return START_NOT_STICKY;
        }

        Log.d(TAG, "Starting location service for ride=" + rideId);

        // Start foreground with persistent notification
        startForeground(NOTIFICATION_ID, buildNotification("Sharing location for ride " + rideId));

        // Connect WebSocket
        connectWebSocket();

        // Start location updates
        startLocationUpdates();

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopLocationUpdates();
        if (webSocket != null) {
            webSocket.close(1000, "Ride completed");
        }
        Log.d(TAG, "LocationWebSocketService stopped");
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

    // ── WebSocket ─────────────────────────────────────────────────────────

    private void connectWebSocket() {
        // Authenticate via JWT token in query param
        String url = WS_BASE_URL + "?token=" + wsToken + "&type=rider&userId=" + riderId;

        Request request = new Request.Builder().url(url).build();
        webSocket = httpClient.newWebSocket(request, new WebSocketListener() {

            @Override
            public void onOpen(WebSocket ws, Response response) {
                wsConnected = true;
                Log.d(TAG, "WebSocket connected for rider=" + riderId);
                updateNotification("Connected — sharing live location");
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                Log.d(TAG, "WS message: " + text);
                try {
                    JSONObject msg = new JSONObject(text);
                    String type   = msg.optString("type");
                    // rideCompleted event from server → stop service
                    if ("rideCompleted".equals(type) || "rideEnded".equals(type)) {
                        Log.d(TAG, "Ride completed — stopping location service");
                        stopSelf();
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Could not parse WS message", e);
                }
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, @Nullable Response response) {
                wsConnected = false;
                Log.e(TAG, "WebSocket failure: " + t.getMessage());
                updateNotification("Connection lost — retrying...");
                // Reconnect after 3 seconds
                new android.os.Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (rideId != null) connectWebSocket();
                }, 3000);
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                wsConnected = false;
                Log.d(TAG, "WebSocket closed: " + reason);
            }
        });
    }

    private void sendLocationUpdate(double lat, double lng) {
        if (!wsConnected || webSocket == null) return;
        try {
            JSONObject payload = new JSONObject();
            payload.put("action", "updateLocation");
            payload.put("lat",    lat);
            payload.put("lng",    lng);
            payload.put("rideId", rideId);
            payload.put("eta",    "Calculating...");
            boolean sent = webSocket.send(payload.toString());
            if (!sent) Log.w(TAG, "WebSocket send queue full — location dropped");
        } catch (Exception e) {
            Log.e(TAG, "Failed to send location update", e);
        }
    }

    // ── Location Updates ──────────────────────────────────────────────────

    private void startLocationUpdates() {
        LocationRequest request = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, LOCATION_INTERVAL_MS)
                .setMinUpdateIntervalMillis(LOCATION_FASTEST_MS)
                .build();

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                if (result == null) return;
                Location loc = result.getLastLocation();
                if (loc == null) return;
                Log.d(TAG, "Location update: " + loc.getLatitude() + "," + loc.getLongitude());
                sendLocationUpdate(loc.getLatitude(), loc.getLongitude());
            }
        };

        try {
            fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper());
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied", e);
            stopSelf();
        }
    }

    private void stopLocationUpdates() {
        if (locationCallback != null) {
            fusedClient.removeLocationUpdates(locationCallback);
        }
    }

    // ── Notifications ─────────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "TerraAI Location Sharing",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Active while sharing location during a ride");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(String message) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("TerraAI — Active Ride")
                .setContentText(message)
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();
    }

    private void updateNotification(String message) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(NOTIFICATION_ID, buildNotification(message));
    }
}
