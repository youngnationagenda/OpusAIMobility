package com.opusaimobility.driver.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.services.LocationTrackingService;
import com.opusaimobility.driver.services.WebSocketService;

/**
 * BootReceiver — Restarts location tracking and WebSocket after device reboot.
 * Only restarts if driver was previously online.
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = Constants.TAG + "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

        SharedPreferences prefs = context.getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE);
        boolean wasOnline = prefs.getBoolean(Constants.KEY_IS_ONLINE, false);
        String  userId    = prefs.getString(Constants.KEY_USER_ID, "");

        if (!wasOnline || userId.isEmpty()) {
            Log.d(TAG, "Boot received — driver was offline, skipping restart");
            return;
        }

        Log.i(TAG, "Boot received — restarting services for driver: " + userId);

        Intent locationIntent = new Intent(context, LocationTrackingService.class);
        locationIntent.putExtra("userId", userId);
        context.startForegroundService(locationIntent);

        Intent wsIntent = new Intent(context, WebSocketService.class);
        wsIntent.putExtra("userId", userId);
        context.startService(wsIntent);
    }
}
