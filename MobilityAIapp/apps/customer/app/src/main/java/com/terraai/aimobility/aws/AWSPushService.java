package com.terraai.aimobility.aws;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.terraai.aimobility.R;
import com.terraai.aimobility.activitiesandfragment.HomeActivity;
import com.terraai.aimobility.codeclasses.MyPreferences;

import org.json.JSONObject;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * AWSPushService — end-to-end device token registration + notification display.
 *
 * Responsibilities:
 *  1. registerToken(userId, deviceToken)
 *     → POST to Push Lambda (action=registerToken)
 *     → Lambda creates/updates SNS Platform Endpoint
 *     → Lambda stores endpoint ARN in DynamoDB
 *     → Result: future SNS publishes reach this device
 *
 *  2. onNewToken(context, deviceToken)
 *     → Called by Notification_Receive when the OS issues a new GCM token
 *     → Re-registers with backend automatically
 *
 *  3. handleMessage(context, data)
 *     → Called by Notification_Receive when a push arrives
 *     → Builds and shows a system notification
 *     → Routes deep-link intent based on push type (ride/order/food)
 *
 * Usage from Application.onCreate (after login):
 * <pre>
 *     String userId     = prefs.getString(MyPreferences.USER_ID, "");
 *     String token      = prefs.getString(MyPreferences.deviceTokon, "");
 *     AWSPushService.registerToken(context, userId, token);
 * </pre>
 *
 * On logout:
 * <pre>
 *     AWSPushService.clearRegistration(context);
 * </pre>
 */
public class AWSPushService {

    private static final String TAG = "AWSPushService";

    // ── SharedPreferences keys ────────────────────────────────────────────────
    private static final String PREF_FILE       = "aws_push_prefs";
    private static final String PREF_REGISTERED = "token_registered";
    private static final String PREF_LAST_TOKEN = "last_token";
    private static final String PREF_LAST_USER  = "last_user_id";

    // ── Notification channel ──────────────────────────────────────────────────
    private static final String CHANNEL_ID   = "aimobility_push";
    private static final String CHANNEL_NAME = "aimobility Notifications";
    private static final AtomicBoolean CHANNEL_CREATED = new AtomicBoolean(false);

    // ── Push Lambda URL ───────────────────────────────────────────────────────
    // Auth via Cognito JWT Bearer token — no static API key needed (TERRA-002)
    private static final String PUSH_LAMBDA_URL =
            "https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/notifications/push";

    private static final MediaType JSON_TYPE = MediaType.get("application/json; charset=utf-8");
    private static final OkHttpClient HTTP   = new OkHttpClient();
    private static final ExecutorService BG  = Executors.newSingleThreadExecutor();

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a device token with the Push Lambda.
     *
     * Safe to call multiple times — skips the network call if the same
     * (userId, token) pair was already successfully registered.
     *
     * @param context     any context (Application or Activity)
     * @param userId      logged-in user's ID
     * @param deviceToken GCM/FCM device token from MyPreferences.deviceTokon
     */
    public static void registerToken(@NonNull Context context,
                                     @NonNull String userId,
                                     @NonNull String deviceToken) {
        if (userId.isEmpty() || deviceToken.isEmpty()) {
            Log.w(TAG, "registerToken: skipped — empty userId or token");
            return;
        }

        SharedPreferences prefs = context.getApplicationContext()
                .getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE);

        boolean alreadyDone = prefs.getBoolean(PREF_REGISTERED, false)
                && deviceToken.equals(prefs.getString(PREF_LAST_TOKEN, ""))
                && userId.equals(prefs.getString(PREF_LAST_USER, ""));

        if (alreadyDone) {
            Log.d(TAG, "registerToken: already registered — skipping");
            return;
        }

        BG.execute(() -> doRegister(context.getApplicationContext(), userId, deviceToken, prefs));
        // Also registers via main Lambda /devices/token for Pinpoint/IoT delivery
        // This ensures cross-channel delivery (WebSocket + IoT MQTT)
    }

    /**
     * Called when the OS issues a new GCM token (re-install, token rotation).
     * Clears the cached registration so the next call to registerToken forces
     * a fresh registration with the backend.
     *
     * @param context     any context
     * @param deviceToken the new token
     */
    public static void onNewToken(@NonNull Context context, @NonNull String deviceToken) {
        Log.i(TAG, "onNewToken: new GCM token received");

        // Save new token to prefs
        MyPreferences.getSharedPreference(context)
                     .edit()
                     .putString(MyPreferences.deviceTokon, deviceToken)
                     .apply();

        // Clear old registration so registerToken re-registers with new token
        clearRegistration(context);

        // Re-register immediately if user is already logged in
        String userId = MyPreferences.getSharedPreference(context)
                                     .getString(MyPreferences.USER_ID, "");
        if (!userId.isEmpty()) {
            registerToken(context, userId, deviceToken);
        }
    }

    /**
     * Handle an incoming push notification payload.
     * Builds and displays a system notification with appropriate deep-link intent.
     *
     * @param context the service context
     * @param data    JSONObject containing title, body, type, and optional IDs
     */
    public static void handleMessage(@NonNull Context context, @NonNull JSONObject data) {
        try {
            String title   = data.optString("title",   "aimobility");
            String body    = data.optString("body",    data.optString("message", "You have a new notification"));
            String type    = data.optString("type",    "");
            String rideId  = data.optString("rideId",  "");
            String orderId = data.optString("orderId", "");

            Log.d(TAG, "handleMessage: type=" + type + " title=" + title);

            ensureNotificationChannel(context);

            // ── Build deep-link intent based on push type ─────────────────────
            Intent tapIntent = buildTapIntent(context, type, rideId, orderId);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    (int) System.currentTimeMillis(),
                    tapIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notification_bell)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

            NotificationManager nm = (NotificationManager)
                    context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify((int) System.currentTimeMillis(), builder.build());
                Log.d(TAG, "handleMessage: notification shown");
            }

        } catch (Exception e) {
            Log.e(TAG, "handleMessage: error — " + e.getMessage());
        }
    }

    /**
     * Clear the cached registration state.
     * Call this on logout so the next login re-registers fresh.
     */
    public static void clearRegistration(@NonNull Context context) {
        context.getApplicationContext()
               .getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
               .edit()
               .remove(PREF_REGISTERED)
               .remove(PREF_LAST_TOKEN)
               .remove(PREF_LAST_USER)
               .apply();
        Log.d(TAG, "clearRegistration: push registration cache cleared");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private static void doRegister(Context context,
                                   String userId,
                                   String deviceToken,
                                   SharedPreferences prefs) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("action",      "registerToken");
            payload.put("userId",      userId);
            payload.put("deviceToken", deviceToken);
            payload.put("platform",    "GCM");

            RequestBody reqBody = RequestBody.create(payload.toString(), JSON_TYPE);
            Request request = new Request.Builder()
                    .url(PUSH_LAMBDA_URL)
                    .post(reqBody)
                    .addHeader("Content-Type", "application/json")
                    .build();

            HTTP.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(@NonNull Call call, @NonNull IOException e) {
                    // Network failure — prefs not updated, so we retry next app start
                    Log.e(TAG, "doRegister: network error — " + e.getMessage());
                }

                @Override
                public void onResponse(@NonNull Call call, @NonNull Response response)
                        throws IOException {
                    try {
                        String raw = response.body() != null ? response.body().string() : "";
                        Log.d(TAG, "doRegister: HTTP " + response.code() + " — " + raw);

                        if (response.isSuccessful()) {
                            try {
                                JSONObject json = new JSONObject(raw);
                                if ("200".equals(json.optString("code"))) {
                                    prefs.edit()
                                         .putBoolean(PREF_REGISTERED, true)
                                         .putString(PREF_LAST_TOKEN, deviceToken)
                                         .putString(PREF_LAST_USER, userId)
                                         .apply();
                                    Log.i(TAG, "doRegister: registered successfully for user " + userId);
                                    return;
                                }
                            } catch (Exception parseEx) {
                                Log.w(TAG, "doRegister: parse error — " + parseEx.getMessage());
                            }
                        }
                        Log.w(TAG, "doRegister: registration not confirmed, will retry next launch");
                    }
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "doRegister: exception — " + e.getMessage());
        }
    }

    private static Intent buildTapIntent(Context context, String type,
                                         String rideId, String orderId) {
        // Default: open HomeActivity
        Intent intent = new Intent(context, HomeActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        switch (type) {
            case "ride_update":
                intent.putExtra("open_screen", "active_ride");
                intent.putExtra("ride_id", rideId);
                break;
            case "order_update":
                intent.putExtra("open_screen", "order_details");
                intent.putExtra("order_id", orderId);
                break;
            case "food_update":
                intent.putExtra("open_screen", "track_food");
                intent.putExtra("order_id", orderId);
                break;
            default:
                intent.putExtra("open_screen", "notifications");
                break;
        }
        return intent;
    }

    private static void ensureNotificationChannel(Context context) {
        if (!CHANNEL_CREATED.getAndSet(true) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Real-time ride, food and delivery updates");
            channel.enableLights(true);
            channel.enableVibration(true);
            NotificationManager nm = (NotificationManager)
                    context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }
}
