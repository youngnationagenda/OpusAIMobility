package com.opusaimobility.driver;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.util.Log;

import androidx.multidex.MultiDexApplication;

import com.amplifyframework.AmplifyException;
import com.amplifyframework.auth.cognito.AWSCognitoAuthPlugin;
import com.amplifyframework.core.Amplify;
import com.amplifyframework.storage.s3.AWSS3StoragePlugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

import io.paperdb.Paper;

/**
 * DriverApp — Application class for OpusAIMobility Driver App
 *
 * Initialises:
 *  1. AWS Amplify (Cognito Auth + S3 Storage)
 *  2. Firebase (Crashlytics, Analytics, FCM)
 *  3. Notification channels
 *  4. PaperDB local key-value store
 *  5. Network singleton (Retrofit + OkHttp + JWT interceptor)
 */
public class DriverApp extends MultiDexApplication {

    private static final String TAG = Constants.TAG + "App";
    private static DriverApp instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        initAmplify();
        initFirebase();
        createNotificationChannels();
        Paper.init(this);
        NetworkSingleton.init(this);

        Log.i(TAG, "DriverApp initialised — role: " + Constants.APP_ROLE);
    }

    public static DriverApp getInstance() {
        return instance;
    }

    // ── AWS Amplify ─────────────────────────────────────────────────────────
    private void initAmplify() {
        try {
            Amplify.addPlugin(new AWSCognitoAuthPlugin());
            Amplify.addPlugin(new AWSS3StoragePlugin());
            Amplify.configure(getApplicationContext());
            Log.i(TAG, "Amplify configured (Cognito + S3)");
        } catch (AmplifyException e) {
            if (e.getMessage() != null && e.getMessage().contains("already configured")) {
                Log.w(TAG, "Amplify already configured");
            } else {
                Log.e(TAG, "Amplify configuration failed: " + e.getMessage(), e);
            }
        }
    }

    // ── Firebase ────────────────────────────────────────────────────────────
    private void initFirebase() {
        try {
            FirebaseApp.initializeApp(this);
            FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(!BuildConfig.IS_DEBUG);
            Log.i(TAG, "Firebase initialised (project: opusaimobility)");
        } catch (Exception e) {
            Log.e(TAG, "Firebase init failed: " + e.getMessage());
        }
    }

    // ── Notification Channels ───────────────────────────────────────────────
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm = getSystemService(NotificationManager.class);

        nm.createNotificationChannel(new NotificationChannel(
            Constants.CHANNEL_RIDES, "Ride Requests",
            NotificationManager.IMPORTANCE_HIGH));

        nm.createNotificationChannel(new NotificationChannel(
            Constants.CHANNEL_DELIVERIES, "Delivery Requests",
            NotificationManager.IMPORTANCE_HIGH));

        nm.createNotificationChannel(new NotificationChannel(
            Constants.CHANNEL_GENERAL, "General Notifications",
            NotificationManager.IMPORTANCE_DEFAULT));

        nm.createNotificationChannel(new NotificationChannel(
            Constants.CHANNEL_TRACKING, "Location Tracking",
            NotificationManager.IMPORTANCE_LOW));

        Log.i(TAG, "Notification channels created");
    }
}
