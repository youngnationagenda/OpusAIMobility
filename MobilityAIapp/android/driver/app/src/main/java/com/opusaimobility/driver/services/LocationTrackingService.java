package com.opusaimobility.driver.services;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
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
import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.ui.home.HomeActivity;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * LocationTrackingService — Foreground service that continuously tracks driver GPS.
 *
 * Posts location to:
 *  1. Lambda API (POST /api/editProfile) — persists to DynamoDB aimobility-users
 *  2. WebSocketService (broadcasts to rider via AWS WebSocket API Gateway)
 *  3. AWS IoT Core MQTT (for real-time map tracking)
 *
 * Update interval: 5 seconds (LOCATION_UPDATE_INTERVAL_MS)
 * Minimum distance: 10m (LOCATION_MIN_DISTANCE_METERS)
 */
public class LocationTrackingService extends Service {

    private static final String TAG = Constants.TAG + "LocationService";

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private String userId;

    @Override
    public void onCreate() {
        super.onCreate();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            userId = intent.getStringExtra("userId");
        }

        startForeground(Constants.LOCATION_TRACKING_NOTIFICATION_ID, buildNotification());
        startLocationUpdates();

        return START_STICKY;
    }

    private void startLocationUpdates() {
        LocationRequest request = new LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            Constants.LOCATION_UPDATE_INTERVAL_MS)
            .setMinUpdateIntervalMillis(Constants.LOCATION_FASTEST_INTERVAL_MS)
            .setMinUpdateDistanceMeters(Constants.LOCATION_MIN_DISTANCE_METERS)
            .build();

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult result) {
                if (result == null) return;
                Location location = result.getLastLocation();
                if (location != null) {
                    onNewLocation(location);
                }
            }
        };

        try {
            fusedLocationClient.requestLocationUpdates(
                request, locationCallback, Looper.getMainLooper());
            Log.d(TAG, "Location updates started for driver: " + userId);
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied: " + e.getMessage());
        }
    }

    private void onNewLocation(Location location) {
        double lat = location.getLatitude();
        double lng = location.getLongitude();
        float  accuracy = location.getAccuracy();

        Log.v(TAG, String.format("Location: lat=%.6f lng=%.6f acc=%.1fm", lat, lng, accuracy));

        // 1. Post to Lambda API to update driver's stored location in DynamoDB
        postLocationToApi(lat, lng);

        // 2. Broadcast via WebSocket for real-time rider map updates
        WebSocketService.broadcastLocation(userId, lat, lng);
    }

    private void postLocationToApi(double lat, double lng) {
        if (userId == null || userId.isEmpty()) return;
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);
            body.put("lat",     String.valueOf(lat));
            body.put("long",    String.valueOf(lng));
            body.put("active",  1);

            NetworkSingleton.getInstance().getApiService()
                .updateProfile(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {
                        // Silently update
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Log.w(TAG, "Location update failed: " + t.getMessage());
                    }
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error posting location: " + e.getMessage());
        }
    }

    private Notification buildNotification() {
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0,
            new Intent(this, HomeActivity.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, Constants.CHANNEL_TRACKING)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.location_tracking_active))
            .setSmallIcon(R.drawable.ic_location)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
        Log.d(TAG, "Location tracking stopped");
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
