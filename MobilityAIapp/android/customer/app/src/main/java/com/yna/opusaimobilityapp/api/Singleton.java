package com.yna.opusaimobilityapp.api;

import android.content.Context;
import android.content.SharedPreferences;

import com.yna.opusaimobilityapp.Constants;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.converter.scalars.ScalarsConverterFactory;

/**
 * Singleton — Retrofit API client wired to the AWS CloudFront endpoint.
 *
 * Authentication: Cognito JWT bearer token (stored in SharedPreferences under
 * key "u_token").  Every request automatically includes:
 *   Authorization: Bearer <jwt>
 *   X-App-Version: 1.7
 *   X-Platform: android
 *
 * Replaces: retrofit-plus ApiClient (which required a plain API key).
 * Backend:  AWS Lambda via API Gateway behind CloudFront WAF.
 */
public class Singleton {

    private static final String PREF_NAME    = "login_detail";
    private static final String KEY_TOKEN    = "u_token";
    private static final int    TIMEOUT_SECS = 30;

    private static ApiInterface apiInterface = null;
    private static String       lastToken    = null;

    /** Returns a cached ApiInterface, or rebuilds if the JWT token has changed. */
    public static synchronized ApiInterface getApiCall(Context context) {
        String token = getToken(context);
        if (apiInterface == null || !token.equals(lastToken)) {
            apiInterface = build(token);
            lastToken    = token;
        }
        return apiInterface;
    }

    /** Force-rebuild the client (e.g. after login / token refresh). */
    public static synchronized void reset() {
        apiInterface = null;
        lastToken    = null;
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private static String getToken(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_TOKEN, "");
    }

    private static ApiInterface build(String token) {

        // ── Auth interceptor — Cognito JWT bearer ────────────────────────────
        Interceptor authInterceptor = chain -> {
            Request.Builder rb = chain.request().newBuilder();
            if (token != null && !token.isEmpty()) {
                rb.addHeader("Authorization", "Bearer " + token);
            }
            rb.addHeader("X-App-Version", "1.7");
            rb.addHeader("X-Platform",    "android");
            return chain.proceed(rb.build());
        };

        // ── Logging (debug only) ─────────────────────────────────────────────
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        // ── OkHttp client ────────────────────────────────────────────────────
        OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(logging)
                .connectTimeout(TIMEOUT_SECS, TimeUnit.SECONDS)
                .readTimeout(TIMEOUT_SECS,    TimeUnit.SECONDS)
                .writeTimeout(TIMEOUT_SECS,   TimeUnit.SECONDS)
                .build();

        // ── Retrofit ─────────────────────────────────────────────────────────
        return new Retrofit.Builder()
                .baseUrl(Constants.APILINK)
                .client(client)
                .addConverterFactory(ScalarsConverterFactory.create())
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiInterface.class);
    }
}
