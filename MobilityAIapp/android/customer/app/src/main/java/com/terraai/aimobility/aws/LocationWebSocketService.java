package com.terraai.aimobility.aws;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.HandlerThread;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.terraai.aimobility.codeclasses.MyPreferences;

import org.json.JSONObject;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/**
 * LocationWebSocketService — TERRA-041
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends driver GPS location to the API Gateway WebSocket every 3 seconds
 * during an active ride so the customer's map can show live driver position.
 *
 * Architecture:
 *   Android GPS  ──3s──►  LocationWebSocketService  ──WS──►  API Gateway
 *                                                               ↓
 *                                    omniride-connections  (DynamoDB)
 *                                               ↓
 *                         Customer MapView  ◄── driverLocation frame
 *
 * Usage (from RiderPortal / active ride screen):
 * <pre>
 *   LocationWebSocketService.start(context, rideId, userId);
 *   // ... on ride end:
 *   LocationWebSocketService.stop();
 * </pre>
 *
 * Requires permission: ACCESS_FINE_LOCATION
 * ─────────────────────────────────────────────────────────────────────────────
 */
public class LocationWebSocketService {

    private static final String TAG = "LocationWS";

    // ── WebSocket endpoint ────────────────────────────────────────────────────
    private static final String WS_URL =
            "wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod";

    // ── Location update interval ──────────────────────────────────────────────
    private static final long LOCATION_INTERVAL_MS  = 3_000L;
    private static final long LOCATION_FASTEST_MS   = 1_500L;

    // ── Reconnect config ──────────────────────────────────────────────────────
    private static final int  MAX_RECONNECT_TRIES   = 5;
    private static final long RECONNECT_DELAY_MS    = 3_000L;
    private static final long PING_INTERVAL_MS      = 30_000L;

    // ── Singleton state ───────────────────────────────────────────────────────
    private static LocationWebSocketService sInstance;

    private final Context                   appContext;
    private final String                    rideId;
    private final String                    driverId;

    private WebSocket                       ws;
    private final OkHttpClient              httpClient;
    private FusedLocationProviderClient     fusedClient;
    private LocationCallback                locationCallback;
    private HandlerThread                   locationThread;

    private Location                        lastLocation;
    private final AtomicBoolean             running   = new AtomicBoolean(false);
    private int                             reconnects = 0;
    private long                            lastPingAt = 0;

    // ── Constructor ───────────────────────────────────────────────────────────

    private LocationWebSocketService(@NonNull Context context,
                                     @NonNull String  rideId,
                                     @NonNull String  driverId) {
        this.appContext = context.getApplicationContext();
        this.rideId     = rideId;
        this.driverId   = driverId;
        this.httpClient = new OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS)   // keep-alive
                .build();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Start broadcasting GPS location for an active ride.
     * Safe to call multiple times — stops any existing session first.
     *
     * @param context   Any context
     * @param rideId    The active ride ID
     * @param driverId  The driver/rider user ID
     */
    public static synchronized void start(@NonNull Context context,
                                          @NonNull String  rideId,
                                          @NonNull String  driverId) {
        stop(); // clean up any existing session

        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "start: ACCESS_FINE_LOCATION permission not granted — skipping");
            return;
        }

        sInstance = new LocationWebSocketService(context, rideId, driverId);
        sInstance.running.set(true);
        sInstance.openWebSocket();
        sInstance.startLocationUpdates();
        Log.i(TAG, "start: broadcasting for ride=" + rideId + " driver=" + driverId);
    }

    /**
     * Stop broadcasting and clean up all resources.
     * Safe to call even if not started.
     */
    public static synchronized void stop() {
        if (sInstance != null) {
            sInstance._stop();
            sInstance = null;
            Log.i(TAG, "stop: location broadcasting stopped");
        }
    }

    /** @return true if currently broadcasting */
    public static synchronized boolean isRunning() {
        return sInstance != null && sInstance.running.get();
    }

    // ── Private: WebSocket ────────────────────────────────────────────────────

    private void openWebSocket() {
        // uToken holds the Cognito JWT / auth token
        final String token = MyPreferences.getSharedPreference(appContext)
                .getString(MyPreferences.uToken, "");

        String url = token.isEmpty() ? WS_URL : WS_URL + "?token=" + token;

        Request request = new Request.Builder().url(url).build();
        ws = httpClient.newWebSocket(request, new WsListener());
    }

    private class WsListener extends WebSocketListener {

        @Override
        public void onOpen(@NonNull WebSocket webSocket, @NonNull Response response) {
            Log.d(TAG, "WS onOpen");
            reconnects = 0;
            // Send initial subscribe frame so server can route properly
            sendFrame(buildSubscribeFrame());
        }

        @Override
        public void onMessage(@NonNull WebSocket webSocket, @NonNull String text) {
            try {
                JSONObject msg = new JSONObject(text);
                String action  = msg.optString("action", "");
                if ("pong".equals(action)) {
                    Log.v(TAG, "WS pong received");
                }
            } catch (Exception e) {
                Log.w(TAG, "WS message parse error: " + e.getMessage());
            }
        }

        @Override
        public void onClosing(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
            webSocket.close(1000, null);
        }

        @Override
        public void onClosed(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
            Log.d(TAG, "WS closed code=" + code + " reason=" + reason);
            if (running.get() && code != 1000) {
                scheduleReconnect();
            }
        }

        @Override
        public void onFailure(@NonNull WebSocket webSocket, @NonNull Throwable t,
                              Response response) {
            Log.w(TAG, "WS failure: " + t.getMessage());
            if (running.get()) {
                scheduleReconnect();
            }
        }
    }

    private void scheduleReconnect() {
        if (reconnects >= MAX_RECONNECT_TRIES) {
            Log.w(TAG, "scheduleReconnect: max retries reached, giving up");
            return;
        }
        reconnects++;
        long delay = RECONNECT_DELAY_MS * reconnects;
        Log.d(TAG, "scheduleReconnect: attempt " + reconnects + " in " + delay + "ms");
        android.os.Handler handler = new android.os.Handler(Looper.getMainLooper());
        handler.postDelayed(() -> {
            if (running.get()) {
                openWebSocket();
            }
        }, delay);
    }

    private void sendFrame(@NonNull JSONObject frame) {
        if (ws != null) {
            ws.send(frame.toString());
        }
    }

    // ── Private: Location ─────────────────────────────────────────────────────

    private void startLocationUpdates() {
        locationThread = new HandlerThread("location-ws-thread");
        locationThread.start();
        android.os.Handler locationHandler = new android.os.Handler(locationThread.getLooper());

        fusedClient = LocationServices.getFusedLocationProviderClient(appContext);

        LocationRequest locationRequest = new LocationRequest.Builder(
                Priority.PRIORITY_HIGH_ACCURACY, LOCATION_INTERVAL_MS)
                .setMinUpdateIntervalMillis(LOCATION_FASTEST_MS)
                .build();

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(@NonNull LocationResult result) {
                Location loc = result.getLastLocation();
                if (loc == null || !running.get()) return;

                float heading = computeHeading(lastLocation, loc);
                lastLocation  = loc;

                // Periodic ping to keep WebSocket alive
                long now = System.currentTimeMillis();
                if (now - lastPingAt > PING_INTERVAL_MS) {
                    sendFrame(buildPingFrame());
                    lastPingAt = now;
                }

                sendFrame(buildLocationFrame(loc, heading));
            }
        };

        try {
            fusedClient.requestLocationUpdates(locationRequest, locationCallback, locationHandler);
            Log.d(TAG, "startLocationUpdates: GPS updates started at " + LOCATION_INTERVAL_MS + "ms intervals");
        } catch (SecurityException e) {
            Log.e(TAG, "startLocationUpdates: security exception — " + e.getMessage());
        }
    }

    private void stopLocationUpdates() {
        if (fusedClient != null && locationCallback != null) {
            fusedClient.removeLocationUpdates(locationCallback);
        }
        if (locationThread != null) {
            locationThread.quitSafely();
            locationThread = null;
        }
    }

    // ── Private: JSON builders ────────────────────────────────────────────────

    private JSONObject buildLocationFrame(@NonNull Location loc, float heading) {
        try {
            JSONObject j = new JSONObject();
            j.put("action",    "sendLocation");
            j.put("rideId",    rideId);
            j.put("lat",       loc.getLatitude());
            j.put("lng",       loc.getLongitude());
            j.put("heading",   (double) heading);
            j.put("speedKmh",  loc.hasSpeed() ? loc.getSpeed() * 3.6 : 0.0);
            j.put("timestamp", System.currentTimeMillis());
            return j;
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private JSONObject buildSubscribeFrame() {
        try {
            JSONObject j = new JSONObject();
            j.put("action", "subscribe");
            j.put("rideId", rideId);
            return j;
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private JSONObject buildPingFrame() {
        try {
            JSONObject j = new JSONObject();
            j.put("action", "ping");
            return j;
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    // ── Private: Helpers ──────────────────────────────────────────────────────

    /**
     * Compute approximate heading from previous to current location (degrees 0-360).
     * Falls back to 0 if no previous location is available.
     */
    private static float computeHeading(Location prev, @NonNull Location curr) {
        if (prev == null) return 0f;

        double dLng = curr.getLongitude() - prev.getLongitude();
        double dLat = curr.getLatitude()  - prev.getLatitude();
        double angle = Math.toDegrees(Math.atan2(dLng, dLat));
        return (float) ((angle + 360.0) % 360.0);
    }

    private void _stop() {
        running.set(false);
        stopLocationUpdates();
        if (ws != null) {
            ws.close(1000, "Ride ended");
            ws = null;
        }
        httpClient.dispatcher().executorService().shutdown();
    }
}
