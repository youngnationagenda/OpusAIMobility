package com.terraai.aimobility.codeclasses;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import androidx.appcompat.app.AppCompatDelegate;

import com.bumptech.glide.Glide;
import com.terraai.aimobility.activitiesandfragment.CustomErrorActivity;
import com.terraai.aimobility.R;
import com.terraai.aimobility.aws.AWSManager;
import com.terraai.aimobility.aws.AWSPushService;

import cat.ereza.customactivityoncrash.CustomActivityOnCrash;
import cat.ereza.customactivityoncrash.config.CaocConfig;

/**
 * AiMobilityApp — Application entry point.
 *
 * AWS services used (replaces Firebase):
 *  - AWSManager       : REST API gateway helper (Cognito auth, SNS push, S3)
 *  - Glide            : Image loading (replaces Fresco)
 *  - SharedPreferences: Lightweight local storage (replaces PaperDB)
 *
 * NO Firebase SDK, NO google-services.json required.
 */
public class AiMobilityApp extends Application {

    private static final String TAG = "aimobility";
    private static Context context;

    public static Context getAppContext() {
        return AiMobilityApp.context;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        AiMobilityApp.context = getApplicationContext();

        // ── SharedPreferences (replaces PaperDB) ─────────────────────────────
        MyPreferences.mPrefs = getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);

        // ── AWS Manager init ──────────────────────────────────────────────────
        AWSManager.getInstance(this);
        Log.i(TAG, "AWSManager initialized — endpoint: " + com.terraai.aimobility.Constants.BASE_URL);

        // ── Push token registration ───────────────────────────────────────────
        // If the user is already logged in (returning launch), re-register the
        // device token with the Push Lambda so SNS endpoints stay fresh.
        // On first-launch (no userId) this is a no-op.
        String userId      = MyPreferences.mPrefs.getString(MyPreferences.USER_ID, "");
        String deviceToken = MyPreferences.mPrefs.getString(MyPreferences.deviceTokon, "");
        if (!userId.isEmpty() && !deviceToken.isEmpty()) {
            AWSPushService.registerToken(this, userId, deviceToken);
        }

        // ── UI / Theme ────────────────────────────────────────────────────────
        AppCompatDelegate.setCompatVectorFromResourcesEnabled(true);

        // ── Crash handler ─────────────────────────────────────────────────────
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
        // Free Glide memory cache on low memory
        Glide.get(this).clearMemory();
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        Glide.get(this).trimMemory(level);
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
