package com.terraai.aimobility.aws;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.codeclasses.MyPreferences;

/**
 * WebSocketForegroundService — keeps WebSocket connection alive when app is backgrounded.
 * This ensures real-time notifications are received without Google FCM.
 *
 * Start after login, stop on logout.
 */
public class WebSocketForegroundService extends Service {

    private static final String TAG = "aimobility.WSService";
    private static final String CHANNEL_ID = "aimobility_ws_service";
    private static final int NOTIFICATION_ID = 9001;

    public static final String ACTION_START = "com.terraai.aimobility.WS_START";
    public static final String ACTION_STOP = "com.terraai.aimobility.WS_STOP";
    public static final String EXTRA_USER_ID = "userId";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            WebSocketManager.getInstance(this).disconnect();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        String userId = intent.getStringExtra(EXTRA_USER_ID);
        if (userId == null || userId.isEmpty()) {
            userId = MyPreferences.getSharedPreference(this).getString(MyPreferences.USER_ID, "");
        }

        if (!userId.isEmpty()) {
            startForeground(NOTIFICATION_ID, buildNotification());
            WebSocketManager.getInstance(this).connect(userId);
            Log.i(TAG, "WebSocket service started for user: " + userId);
        } else {
            stopSelf();
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        WebSocketManager.getInstance(this).disconnect();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("aimobility")
                .setContentText("Connected — receiving ride & order updates")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "aimobility Service", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Keeps connection active for real-time updates");
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    public static void start(Context context, String userId) {
        Intent intent = new Intent(context, WebSocketForegroundService.class);
        intent.setAction(ACTION_START);
        intent.putExtra(EXTRA_USER_ID, userId);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        Intent intent = new Intent(context, WebSocketForegroundService.class);
        intent.setAction(ACTION_STOP);
        context.startService(intent);
    }
}
