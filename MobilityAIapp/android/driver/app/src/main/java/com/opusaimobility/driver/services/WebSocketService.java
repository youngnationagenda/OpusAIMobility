package com.opusaimobility.driver.services;

import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.neovisionaries.ws.client.WebSocket;
import com.neovisionaries.ws.client.WebSocketAdapter;
import com.neovisionaries.ws.client.WebSocketException;
import com.neovisionaries.ws.client.WebSocketFactory;
import com.opusaimobility.driver.Constants;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * WebSocketService — Maintains persistent WebSocket to AWS API Gateway.
 *
 * Endpoint: wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod
 *
 * Handles messages:
 *  - ride_request   → broadcasts to RideRequestActivity
 *  - delivery_request → broadcasts to DeliveryRequestActivity
 *  - ride_cancel    → cancels pending request dialog
 *  - notification   → local push notification
 *
 * Reconnects automatically on disconnect.
 */
public class WebSocketService extends Service {

    private static final String TAG = Constants.TAG + "WebSocket";

    public static final String ACTION_RIDE_REQUEST     = "com.opusaimobility.driver.RIDE_REQUEST";
    public static final String ACTION_DELIVERY_REQUEST = "com.opusaimobility.driver.DELIVERY_REQUEST";
    public static final String ACTION_RIDE_CANCEL      = "com.opusaimobility.driver.RIDE_CANCEL";
    public static final String ACTION_NOTIFICATION     = "com.opusaimobility.driver.NOTIFICATION";

    private static WebSocket webSocket;
    private String userId;
    private String token;
    private boolean shouldReconnect = true;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            userId = intent.getStringExtra("userId");
        }

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        if (userId == null) userId = prefs.getString(Constants.KEY_USER_ID, "");
        token = prefs.getString(Constants.KEY_TOKEN, "");

        connect();
        return START_STICKY;
    }

    private void connect() {
        if (userId == null || userId.isEmpty() || token == null || token.isEmpty()) {
            Log.w(TAG, "Missing userId or token — WebSocket not started");
            return;
        }

        try {
            String url = Constants.WS_ENDPOINT + "?token=" + token + "&userId=" + userId + "&role=driver";

            webSocket = new WebSocketFactory()
                .setConnectionTimeout(15_000)
                .createSocket(url)
                .addListener(new WebSocketAdapter() {

                    @Override
                    public void onConnected(WebSocket ws, java.util.Map<String, java.util.List<String>> headers) {
                        Log.i(TAG, "WebSocket connected — driver: " + userId);
                        // Announce driver online
                        try {
                            JSONObject msg = new JSONObject();
                            msg.put("action", Constants.WS_ACTION_DRIVER_ONLINE);
                            msg.put("userId", userId);
                            msg.put("role",   Constants.ROLE_DRIVER);
                            ws.sendText(msg.toString());
                        } catch (JSONException e) {
                            Log.e(TAG, "Failed to send online event: " + e.getMessage());
                        }
                    }

                    @Override
                    public void onTextMessage(WebSocket ws, String text) {
                        Log.d(TAG, "WS message: " + text);
                        handleMessage(text);
                    }

                    @Override
                    public void onDisconnected(WebSocket ws,
                        com.neovisionaries.ws.client.WebSocketFrame serverCloseFrame,
                        com.neovisionaries.ws.client.WebSocketFrame clientCloseFrame,
                        boolean closedByServer) {
                        Log.w(TAG, "WebSocket disconnected — closedByServer: " + closedByServer);
                        if (shouldReconnect) {
                            new android.os.Handler(android.os.Looper.getMainLooper())
                                .postDelayed(WebSocketService.this::connect, 5000);
                        }
                    }

                    @Override
                    public void onError(WebSocket ws, WebSocketException cause) {
                        Log.e(TAG, "WebSocket error: " + cause.getMessage());
                    }
                })
                .connectAsynchronously();

        } catch (Exception e) {
            Log.e(TAG, "WebSocket connection failed: " + e.getMessage());
        }
    }

    private void handleMessage(String text) {
        try {
            JSONObject json = new JSONObject(text);
            String action = json.optString("action", json.optString("type", ""));

            Intent broadcast = null;
            switch (action) {
                case "ride_request":
                case Constants.WS_ACTION_RIDE_REQUEST:
                    broadcast = new Intent(ACTION_RIDE_REQUEST);
                    broadcast.putExtra("data", text);
                    break;

                case "delivery_request":
                case Constants.WS_ACTION_DELIVERY_REQ:
                    broadcast = new Intent(ACTION_DELIVERY_REQUEST);
                    broadcast.putExtra("data", text);
                    break;

                case "ride_cancel":
                case Constants.WS_ACTION_RIDE_CANCEL:
                    broadcast = new Intent(ACTION_RIDE_CANCEL);
                    broadcast.putExtra("data", text);
                    break;

                case "notification":
                    broadcast = new Intent(ACTION_NOTIFICATION);
                    broadcast.putExtra("data", text);
                    break;

                default:
                    Log.d(TAG, "Unknown WS action: " + action);
            }

            if (broadcast != null) {
                LocalBroadcastManager.getInstance(this).sendBroadcast(broadcast);
            }

        } catch (JSONException e) {
            Log.e(TAG, "Message parse error: " + e.getMessage());
        }
    }

    /** Called from LocationTrackingService to broadcast driver position */
    public static void broadcastLocation(String userId, double lat, double lng) {
        if (webSocket == null || !webSocket.isOpen()) return;
        try {
            JSONObject msg = new JSONObject();
            msg.put("action", Constants.WS_ACTION_LOCATION_UPDATE);
            msg.put("userId", userId);
            msg.put("lat",    lat);
            msg.put("lng",    lng);
            msg.put("ts",     System.currentTimeMillis());
            webSocket.sendText(msg.toString());
        } catch (JSONException e) {
            Log.e(TAG, "broadcastLocation JSON error: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        shouldReconnect = false;
        if (webSocket != null && webSocket.isOpen()) {
            webSocket.disconnect();
        }
        Log.d(TAG, "WebSocketService destroyed");
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }
}
