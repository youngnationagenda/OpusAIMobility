package com.terraai.aimobility.firebasenotification;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;

import com.terraai.aimobility.aws.AWSPushService;

import org.json.JSONObject;

/**
 * Notification_Receive — AWS SNS push notification receiver.
 *
 * MIGRATION NOTE:
 * Previously extended FirebaseMessagingService.
 * Now all notification logic lives in AWSPushService.
 *
 * Push delivery path:
 *   AWS Lambda → AWS SNS → FCM (using play-services-gcm token) → Android System
 *
 * The Android system delivers the push directly to the notification tray.
 * For data-only messages, use a BroadcastReceiver instead (see AWSPushReceiver).
 *
 * Token management is handled by AWSPushService.onNewToken() which registers
 * the GCM/FCM device token with your Lambda backend, which then creates an
 * SNS endpoint subscription — no Firebase SDK needed.
 */
public class Notification_Receive extends Service {

    private static final String TAG = "aimobility.PushReceiver";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getExtras() != null) {
            try {
                JSONObject data = new JSONObject();
                for (String key : intent.getExtras().keySet()) {
                    data.put(key, intent.getExtras().get(key));
                }
                Log.d(TAG, "Push received: " + data.toString());
                AWSPushService.handleMessage(this, data);
            } catch (Exception e) {
                Log.e(TAG, "Error handling push: " + e.getMessage());
            }
        }
        return START_NOT_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
