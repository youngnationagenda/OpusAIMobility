package com.terraai.aimobility.aws;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.terraai.aimobility.Constants;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * CognitoAuthManager — manages Cognito JWT tokens for the aimobility app.
 *
 * Tokens are stored in SharedPreferences and attached to API requests via AuthInterceptor.
 * Login/register go through the Lambda API which handles Cognito server-side and returns tokens.
 */
public class CognitoAuthManager {

    private static final String TAG = "aimobility.CognitoAuth";
    private static final String PREFS_NAME = "aimobility_auth";
    private static final String KEY_ID_TOKEN = "id_token";
    private static final String KEY_ACCESS_TOKEN = "access_token";
    private static final String KEY_REFRESH_TOKEN = "refresh_token";
    private static final String KEY_TOKEN_EXPIRY = "token_expiry";

    public interface AuthCallback {
        void onSuccess(JSONObject userResponse);
        void onError(String error);
    }

    public static void signIn(Context context, String email, String password, AuthCallback callback) {
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("email", email);
                body.put("password", password);
                body.put("device_token", AWSManager.getStoredDeviceToken(context));

                String resp = postToApi("login", body);
                JSONObject json = new JSONObject(resp);

                if (json.optString("code").equals("200")) {
                    JSONObject msg = json.getJSONObject("msg");
                    JSONObject tokens = msg.optJSONObject("tokens");
                    if (tokens != null) {
                        storeTokens(context, tokens);
                    }
                    callback.onSuccess(json);
                } else {
                    callback.onError(json.optString("msg", "Login failed"));
                }
            } catch (Exception e) {
                Log.e(TAG, "signIn error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static void signUp(Context context, String email, String password,
                              String firstName, String lastName, String phone,
                              String countryId, AuthCallback callback) {
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("email", email);
                body.put("password", password);
                body.put("first_name", firstName);
                body.put("last_name", lastName);
                body.put("phone", phone);
                body.put("country_id", countryId);
                body.put("role", "user");
                body.put("device_token", AWSManager.getStoredDeviceToken(context));

                String resp = postToApi("registerUser", body);
                JSONObject json = new JSONObject(resp);

                if (json.optString("code").equals("200")) {
                    JSONObject msg = json.getJSONObject("msg");
                    JSONObject tokens = msg.optJSONObject("tokens");
                    if (tokens != null) {
                        storeTokens(context, tokens);
                    }
                    callback.onSuccess(json);
                } else {
                    callback.onError(json.optString("msg", "Registration failed"));
                }
            } catch (Exception e) {
                Log.e(TAG, "signUp error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static void signOut(Context context) {
        getPrefs(context).edit().clear().apply();
    }

    public static String getIdToken(Context context) {
        return getPrefs(context).getString(KEY_ID_TOKEN, null);
    }

    public static String getRefreshToken(Context context) {
        return getPrefs(context).getString(KEY_REFRESH_TOKEN, null);
    }

    public static String refreshAndGetToken(Context context) {
        String refreshToken = getRefreshToken(context);
        if (refreshToken == null || refreshToken.isEmpty()) return null;

        final AtomicReference<String> result = new AtomicReference<>(null);
        final CountDownLatch latch = new CountDownLatch(1);

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("refresh_token", refreshToken);

                String resp = postToApi("refreshToken", body);
                JSONObject json = new JSONObject(resp);

                if (json.optString("code").equals("200")) {
                    JSONObject msg = json.getJSONObject("msg");
                    JSONObject tokens = msg.optJSONObject("tokens");
                    if (tokens != null) {
                        storeTokens(context, tokens);
                        result.set(tokens.optString("idToken"));
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "refreshToken error: " + e.getMessage());
            } finally {
                latch.countDown();
            }
        }).start();

        try { latch.await(10, TimeUnit.SECONDS); } catch (InterruptedException ignored) {}
        return result.get();
    }

    public static boolean isLoggedIn(Context context) {
        return getIdToken(context) != null;
    }

    private static void storeTokens(Context context, JSONObject tokens) {
        SharedPreferences.Editor editor = getPrefs(context).edit();
        if (tokens.has("idToken"))
            editor.putString(KEY_ID_TOKEN, tokens.optString("idToken"));
        if (tokens.has("accessToken"))
            editor.putString(KEY_ACCESS_TOKEN, tokens.optString("accessToken"));
        if (tokens.has("refreshToken"))
            editor.putString(KEY_REFRESH_TOKEN, tokens.optString("refreshToken"));
        if (tokens.has("expiresIn"))
            editor.putLong(KEY_TOKEN_EXPIRY, System.currentTimeMillis() + tokens.optLong("expiresIn", 3600) * 1000);
        editor.apply();
    }

    private static SharedPreferences getPrefs(Context context) {
        return context.getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static String postToApi(String endpoint, JSONObject body) throws Exception {
        URL url = new URL(Constants.APILINK + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("api-key", Constants.API_KEY);
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(15000);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.toString().getBytes("UTF-8"));
        }

        int code = conn.getResponseCode();
        BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        br.close();
        return sb.toString();
    }
}
