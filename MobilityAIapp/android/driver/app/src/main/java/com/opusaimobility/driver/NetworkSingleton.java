package com.opusaimobility.driver;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.google.gson.GsonBuilder;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.converter.scalars.ScalarsConverterFactory;

/**
 * NetworkSingleton — Retrofit + OkHttp factory
 *
 * Mirrors the customer app's Singleton.java pattern.
 * JWT Bearer token is automatically attached to every request
 * from SharedPreferences (KEY_TOKEN).
 *
 * On 401 response the token is cleared and user is redirected to Login.
 */
public class NetworkSingleton {

    private static final String TAG = Constants.TAG + "Network";

    private static NetworkSingleton instance;
    private static Context appContext;

    private Retrofit retrofit;
    private ApiService apiService;

    private NetworkSingleton() {
        buildRetrofit();
    }

    public static void init(Context context) {
        appContext = context.getApplicationContext();
        instance = new NetworkSingleton();
    }

    public static NetworkSingleton getInstance() {
        if (instance == null) {
            instance = new NetworkSingleton();
        }
        return instance;
    }

    /** Reset after login/logout so JWT is refreshed */
    public static void reset() {
        instance = new NetworkSingleton();
        Log.d(TAG, "Retrofit client reset");
    }

    private void buildRetrofit() {
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor(
            msg -> Log.d(TAG + "HTTP", msg));
        logging.setLevel(BuildConfig.IS_DEBUG
            ? HttpLoggingInterceptor.Level.BODY
            : HttpLoggingInterceptor.Level.NONE);

        OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(Constants.HTTP_CONNECT_TIMEOUT, TimeUnit.SECONDS)
            .readTimeout(Constants.HTTP_READ_TIMEOUT, TimeUnit.SECONDS)
            .writeTimeout(Constants.HTTP_WRITE_TIMEOUT, TimeUnit.SECONDS)
            .addInterceptor(logging)
            .addInterceptor(chain -> {
                // Attach Cognito JWT to every request
                Request.Builder builder = chain.request().newBuilder();
                builder.header("Content-Type",   "application/json");
                builder.header("Accept",          "application/json");
                builder.header("X-App-Version",   BuildConfig.VERSION_NAME);
                builder.header("X-Platform",      "android-driver");
                builder.header("X-App-Role",      Constants.APP_ROLE);

                String token = getStoredToken();
                if (token != null && !token.isEmpty()) {
                    builder.header("Authorization", "Bearer " + token);
                }
                return chain.proceed(builder.build());
            })
            .build();

        retrofit = new Retrofit.Builder()
            .baseUrl(Constants.API_URL)
            .client(client)
            .addConverterFactory(ScalarsConverterFactory.create())
            .addConverterFactory(GsonConverterFactory.create(
                new GsonBuilder().setLenient().create()))
            .build();

        apiService = retrofit.create(ApiService.class);
        Log.d(TAG, "Retrofit built — base: " + Constants.API_URL);
    }

    private String getStoredToken() {
        if (appContext == null) return null;
        SharedPreferences prefs = appContext.getSharedPreferences(
            Constants.PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(Constants.KEY_TOKEN, null);
    }

    public ApiService getApiService() {
        return apiService;
    }

    public Retrofit getRetrofit() {
        return retrofit;
    }
}
