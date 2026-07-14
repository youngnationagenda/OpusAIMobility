package com.yna.opusaimobilityapp.codeclasses;

import android.app.Application;
import android.content.Context;
import android.os.Build;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatDelegate;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.google.firebase.FirebaseApp;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.activitiesandfragment.CustomErrorActivity;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.aws.AWSManager;
import com.terraai.aimobility.aws.AWSPushService;

import cat.ereza.customactivityoncrash.CustomActivityOnCrash;
import cat.ereza.customactivityoncrash.config.CaocConfig;
import io.paperdb.Paper;

/**
 * OpusAIMobility — Application entry point.
 *
 * Initialisation order:
 *  1. SharedPreferences (MyPreferences) — must be first (others depend on it)
 *  2. Fresco               — image pipeline (food/restaurant images)
 *  3. Firebase             — real-time database + Crashlytics + push
 *  4. AWSManager           — Cognito auth + WebSocket + S3 (primary backend)
 *  5. AWSPushService       — re-register SNS device token on warm start
 *  6. PaperDB              — lightweight local cache
 *  7. Singleton reset      — ensures Retrofit rebuilds with fresh JWT on next call
 *  8. UI / Crash handler
 */
public class OpusAIMobility extends Application {

    private static final String TAG = Constants.TAG + "App";
    private static Context context;

    public static Context getAppContext() {
        return OpusAIMobility.context;
    }

    @RequiresApi(api = Build.VERSION_CODES.N)
    @Override
    public void onCreate() {
        super.onCreate();

        context = getApplicationContext();

        // 1 ── SharedPreferences ──────────────────────────────────────────────
        MyPreferences.mPrefs = getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);

        // 2 ── Fresco (Facebook image pipeline) ───────────────────────────────
        Fresco.initialize(this, ImagePipelineConfigUtils.getDefaultImagePipelineConfig(this));

        // 3 ── Firebase (real-time driver tracking + push + Crashlytics) ──────
        FirebaseApp.initializeApp(this);

        // 4 ── AWSManager (Cognito / API Gateway / S3 / WebSocket) ────────────
        AWSManager awsManager = AWSManager.getInstance(this);
        Log.i(TAG, "AWSManager initialised — BASE_URL: " + Constants.BASE_URL);

        // 5 ── Re-register SNS push token on warm start ────────────────────────
        String userId      = MyPreferences.mPrefs.getString(MyPreferences.USER_ID, "");
        String deviceToken = MyPreferences.mPrefs.getString(MyPreferences.deviceTokon, "");
        if (!userId.isEmpty() && !deviceToken.isEmpty()) {
            AWSPushService.registerToken(this, userId, deviceToken);
            Log.i(TAG, "SNS token re-registered for userId: " + userId);
        }

        // ── If user is logged in start WebSocket for real-time updates ────────
        if (!userId.isEmpty()) {
            awsManager.startWebSocket(userId);
        }

        // 6 ── PaperDB (local cache) ───────────────────────────────────────────
        Paper.init(this);

        // 7 ── Reset Singleton so Retrofit picks up any new JWT on next call ───
        Singleton.reset();

        // 8 ── UI / accessibility ──────────────────────────────────────────────
        AppCompatDelegate.setCompatVectorFromResourcesEnabled(true);

        // 8b ─ Global crash handler ────────────────────────────────────────────
        CaocConfig.Builder.create()
                .backgroundMode(CaocConfig.BACKGROUND_MODE_SILENT)
                .enabled(true)
                .showErrorDetails(true)
                .showRestartButton(true)
                .logErrorOnRestart(true)
                .trackActivities(true)
                .minTimeBetweenCrashesMs(2000)
                .errorDrawable(R.drawable.imagepreview)
                .restartActivity(CustomErrorActivity.class)
                .errorActivity(CustomErrorActivity.class)
                .eventListener(new CustomEventListener())
                .apply();
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        // Release Fresco memory cache
        com.bumptech.glide.Glide.get(this).clearMemory();
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        com.bumptech.glide.Glide.get(this).trimMemory(level);
    }

    private static class CustomEventListener implements CustomActivityOnCrash.EventListener {
        @Override
        public void onLaunchErrorActivity() {
            Log.i(TAG, "onLaunchErrorActivity()");
        }

        @Override
        public void onRestartAppFromErrorActivity() {
            Log.i(TAG, "onRestartAppFromErrorActivity()");
        }

        @Override
        public void onCloseAppFromErrorActivity() {
            Log.i(TAG, "onCloseAppFromErrorActivity()");
        }
    }
}
