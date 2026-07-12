package com.terraai.aimobility.aws;

import android.content.Context;
import android.util.Log;

import com.terraai.aimobility.Constants;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * AWSManager — central helper for AWS Amplify / Cognito / API Gateway operations.
 *
 * Replaces Firebase SDK calls throughout the app:
 *  - Auth:         Cognito User Pools  (sign-in / sign-up / social)
 *  - Push tokens:  AWS SNS via Lambda API
 *  - Real-time:    AWS API Gateway WebSocket (driver tracking / chat)
 *  - Storage:      AWS S3 via Lambda pre-signed URLs
 */
public class AWSManager {

    private static final String TAG = "aimobility.AWSManager";
    private static final ExecutorService executor = Executors.newCachedThreadPool();

    // ─── Cognito Config (fill from AWS Console > Cognito > User Pool) ─────────
    // ── Provisioned by AWS CLI 2026-07-05 ─────────────────────────────────────
    public static final String COGNITO_REGION        = "us-east-1";
    public static final String COGNITO_USER_POOL_ID  = "us-east-1_LKa4ElQem";
    public static final String COGNITO_APP_CLIENT_ID = "3a207uin5o3p4k1ngk334crntl";
    public static final String COGNITO_IDENTITY_POOL = "us-east-1:a89c4453-5965-4a4e-97c7-3ba1a99cdd38";

    // ─── Real-time notifications via WebSocket (replaces FCM/SNS) ──────────────
    // No Google/Firebase dependency — 100% AWS

    // ─── S3 Uploads bucket ────────────────────────────────────────────────────
    public static final String S3_BUCKET = "aimobility-uploads-683541453923";
    public static final String S3_REGION = "us-east-1";

    // ─── WebSocket (real-time notifications — replaces FCM) ─────────────────────
    public static final String WS_ENDPOINT = "wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod";

    // ─── Amazon Pinpoint (push analytics, C1 fix — 2026-07-07) ──────────────────
    public static final String PINPOINT_APP_ID = "20d7e36cc4094a04b63b7fd1e5596fcf";
    // ─── SNS notifications topic ──────────────────────────────────────────────────
    public static final String SNS_NOTIFICATIONS_TOPIC = "arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications";

    // ─── Singleton ────────────────────────────────────────────────────────────
    private static AWSManager instance;
    private final Context context;

    private AWSManager(Context context) {
        this.context = context.getApplicationContext();
    }

    public static synchronized AWSManager getInstance(Context context) {
        if (instance == null) instance = new AWSManager(context);
        return instance;
    }

    // ─── Generic POST to Lambda API ───────────────────────────────────────────
    public interface ApiCallback {
        void onSuccess(String response);
        void onError(String error);
    }

    public void post(String endpoint, JSONObject params, ApiCallback callback) {
        executor.execute(() -> {
            try {
                URL url = new URL(Constants.BASE_URL + "api/" + endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(params.toString().getBytes("UTF-8"));
                }

                int code = conn.getResponseCode();
                BufferedReader br = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                br.close();

                if (code >= 200 && code < 300) {
                    callback.onSuccess(sb.toString());
                } else {
                    callback.onError("HTTP " + code + ": " + sb);
                }
            } catch (Exception e) {
                Log.e(TAG, "post error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        });
    }

    // ─── WebSocket real-time notifications ──────────────────────────────────────

    /**
     * Start WebSocket connection for real-time push notifications.
     * Call after successful login.
     */
    public void startWebSocket(String userId) {
        WebSocketForegroundService.start(context, userId);
        Log.i(TAG, "WebSocket service started for user: " + userId);
    }

    /**
     * Stop WebSocket connection. Call on logout.
     */
    public void stopWebSocket() {
        WebSocketForegroundService.stop(context);
        Log.i(TAG, "WebSocket service stopped");
    }

    // ─── Social Login via Cognito Federated Identity ──────────────────────────
    /**
     * Called after Google/Apple sign-in with the identity token.
     * Exchanges the social token with your Lambda API.
     */
    public void socialLogin(String socialType, String socialId, String authToken,
                            String email, String firstName, String lastName,
                            ApiCallback callback) {
        try {
            JSONObject params = new JSONObject();
            params.put("social", socialType);
            params.put("social_id", socialId);
            params.put("auth_token", authToken);
            params.put("email", email);
            params.put("first_name", firstName);
            params.put("last_name", lastName);
            params.put("role", "customer");
            post("socialLogin", params, callback);
        } catch (Exception e) {
            Log.e(TAG, "socialLogin: " + e.getMessage());
        }
    }

    // ─── Email / Password Login via Cognito ───────────────────────────────────
    public void emailLogin(String email, String password, String deviceToken,
                           ApiCallback callback) {
        try {
            JSONObject params = new JSONObject();
            params.put("email", email);
            params.put("password", password);
            params.put("device_token", deviceToken);
            params.put("role", "customer");
            post("login", params, callback);
        } catch (Exception e) {
            Log.e(TAG, "emailLogin: " + e.getMessage());
        }
    }

    // ─── Registration via Cognito ─────────────────────────────────────────────
    public void register(JSONObject params, ApiCallback callback) {
        post("registerUser", params, callback);
    }

    // ─── Get fresh device token (AWS SNS compatible) ──────────────────────────
    /**
     * Returns the device token stored in SharedPreferences.
     * Token is written by AWSPushManager when the app registers with SNS.
     */
    public static String getStoredDeviceToken(Context context) {
        return context.getSharedPreferences("aimobility_prefs", Context.MODE_PRIVATE)
                .getString("device_token", "");
    }

    public static void storeDeviceToken(Context context, String token) {
        context.getSharedPreferences("aimobility_prefs", Context.MODE_PRIVATE)
                .edit().putString("device_token", token).apply();
        Log.i(TAG, "Device token stored: " + token);
    }
}
