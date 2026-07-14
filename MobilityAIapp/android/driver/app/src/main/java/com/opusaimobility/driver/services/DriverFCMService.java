package com.opusaimobility.driver.services;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
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
 * DriverFCMService — Firebase Cloud Messaging handler.
 *
 * Handles:
 *  1. New FCM token registration → saved to SharedPreferences + posted to API
 *  2. Push notifications:
 *     - ride_request   → plays alert, shows actionable notification
 *     - delivery_request → plays alert, shows notification
 *     - general        → standard notification
 *
 * FCM token is registered with:
 *  - Lambda: POST /api/updateFcmToken (stores in DynamoDB aimobility-users)
 *  - AWS SNS: used by aimobility-push Lambda for delivery
 */
public class DriverFCMService extends FirebaseMessagingService {

    private static final String TAG = Constants.TAG + "FCM";
    private static int notifId = 2000;

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.i(TAG, "New FCM token received");

        // Save token locally
        getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE)
            .edit().putString(Constants.KEY_FCM_TOKEN, token).apply();

        // Register with backend
        registerTokenWithBackend(token);
    }

    private void registerTokenWithBackend(String fcmToken) {
        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        String userId = prefs.getString(Constants.KEY_USER_ID, "");
        if (userId.isEmpty()) return;

        try {
            JSONObject body = new JSONObject();
            body.put("user_id",      userId);
            body.put("device_token", fcmToken);
            body.put("device",       "android");
            body.put("app_role",     Constants.APP_ROLE);

            NetworkSingleton.getInstance().getApiService()
                .updateFcmToken(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {
                        Log.i(TAG, "FCM token registered with backend");
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Log.w(TAG, "FCM token registration failed: " + t.getMessage());
                    }
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM message received from: " + remoteMessage.getFrom());

        String title = "";
        String body  = "";

        // Extract from notification payload
        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle() != null
                ? remoteMessage.getNotification().getTitle() : "";
            body = remoteMessage.getNotification().getBody() != null
                ? remoteMessage.getNotification().getBody() : "";
        }

        // Override with data payload if present
        if (!remoteMessage.getData().isEmpty()) {
            if (remoteMessage.getData().containsKey("title")) title = remoteMessage.getData().get("title");
            if (remoteMessage.getData().containsKey("body"))  body  = remoteMessage.getData().get("body");
            String type = remoteMessage.getData().getOrDefault("type", "general");
            handleTypedNotification(type, title, body, remoteMessage.getData());
            return;
        }

        showNotification(title, body, Constants.CHANNEL_GENERAL);
    }

    private void handleTypedNotification(String type, String title, String body,
            java.util.Map<String, String> data) {
        switch (type) {
            case "ride_request":
            case "ride_confirmed":
                showNotification(title.isEmpty() ? "New Ride Request" : title,
                    body, Constants.CHANNEL_RIDES);
                break;

            case "delivery_request":
            case "order_update":
                showNotification(title.isEmpty() ? "New Delivery Request" : title,
                    body, Constants.CHANNEL_DELIVERIES);
                break;

            default:
                showNotification(title, body, Constants.CHANNEL_GENERAL);
        }
    }

    private void showNotification(String title, String body, String channelId) {
        PendingIntent intent = PendingIntent.getActivity(
            this, 0,
            new Intent(this, HomeActivity.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setContentTitle(title.isEmpty() ? getString(R.string.app_name) : title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(intent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH);

        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.notify(notifId++, builder.build());
    }
}
