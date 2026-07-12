package com.terraai.aimobility.aws;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.terraai.aimobility.codeclasses.MyPreferences;

import org.json.JSONObject;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

/**
 * WebSocketManager — manages persistent WebSocket connection to AWS API Gateway.
 * Replaces FCM/Google push notifications with a 100% AWS solution.
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Ping/pong keepalive
 * - Notification delivery via AWSPushService.handleMessage()
 */
public class WebSocketManager {

    private static final String TAG = "aimobility.WS";
    private static final long PING_INTERVAL_MS = 30_000;
    private static final long[] BACKOFF_MS = {5_000, 10_000, 30_000, 60_000};

    private static WebSocketManager instance;

    private final Context context;
    private final OkHttpClient httpClient;
    private final Handler handler;

    private WebSocket webSocket;
    private String userId;
    private int reconnectAttempt = 0;
    private boolean shouldConnect = false;
    private boolean connected = false;
    private boolean reconnecting = false;
    private Runnable pingRunnable;

    private WebSocketManager(Context context) {
        this.context = context.getApplicationContext();
        this.httpClient = new OkHttpClient.Builder().build();
        this.handler = new Handler(Looper.getMainLooper());
    }

    public static synchronized WebSocketManager getInstance(Context context) {
        if (instance == null) instance = new WebSocketManager(context);
        return instance;
    }

    public void connect(String userId) {
        this.userId = userId;
        this.shouldConnect = true;
        this.reconnectAttempt = 0;
        doConnect();
    }

    public void disconnect() {
        shouldConnect = false;
        handler.removeCallbacksAndMessages(null);
        if (webSocket != null) {
            webSocket.close(1000, "User logout");
            webSocket = null;
        }
        connected = false;
        Log.i(TAG, "Disconnected");
    }

    public boolean isConnected() {
        return connected;
    }

    public void sendPing() {
        WebSocket ws = webSocket;
        if (ws != null && connected) {
            try {
                JSONObject ping = new JSONObject();
                ping.put("action", "ping");
                ws.send(ping.toString());
            } catch (Exception e) {
                Log.e(TAG, "sendPing error: " + e.getMessage());
            }
        }
    }

    private void doConnect() {
        if (!shouldConnect || userId == null || userId.isEmpty()) return;

        String token = CognitoAuthManager.getIdToken(context);
        String wsUrl = AWSManager.WS_ENDPOINT;

        // Auth via Cognito JWT — no static API key fallback (TERRA-002)
        if (token != null && !token.isEmpty()) {
            wsUrl += "?token=" + token + "&userId=" + userId;
        } else {
            // No token yet — connect with userId only; server will reject unauthenticated WS
            wsUrl += "?userId=" + userId;
        }

        Log.i(TAG, "Connecting to WebSocket...");

        Request request = new Request.Builder().url(wsUrl).build();
        webSocket = httpClient.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                Log.i(TAG, "Connected!");
                connected = true;
                reconnectAttempt = 0;
                schedulePing();
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                handleMessage(text);
            }

            @Override
            public void onClosing(WebSocket ws, int code, String reason) {
                Log.i(TAG, "Closing: " + code + " " + reason);
                connected = false;
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                Log.i(TAG, "Closed: " + code + " " + reason);
                connected = false;
                scheduleReconnect();
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                String errorMsg = (t != null && t.getMessage() != null) ? t.getMessage() : "Unknown error";
                Log.e(TAG, "Failure: " + errorMsg);
                connected = false;
                scheduleReconnect();
            }
        });
    }

    private void handleMessage(String text) {
        try {
            JSONObject msg = new JSONObject(text);
            String action = msg.optString("action", "");

            if ("pong".equals(action)) return;

            if ("notification".equals(action)) {
                JSONObject data = msg.optJSONObject("data");
                if (data == null) data = msg;

                String type = msg.optString("type", data.optString("type", ""));
                String title = data.optString("title", "aimobility");
                String body = data.optString("body", data.optString("message", ""));

                if (title.isEmpty() && !type.isEmpty()) {
                    title = formatTypeAsTitle(type);
                }
                if (body.isEmpty()) {
                    body = data.optString("status", "Update received");
                }

                data.put("title", title);
                data.put("body", body);
                data.put("type", type);

                AWSPushService.handleMessage(context, data);
            }
        } catch (Exception e) {
            Log.e(TAG, "handleMessage error: " + e.getMessage());
        }
    }

    private String formatTypeAsTitle(String type) {
        switch (type) {
            case "ride_confirmed": return "Ride Confirmed";
            case "ride_cancelled": return "Ride Cancelled";
            case "order_update": return "Order Update";
            case "parcel_update": return "Parcel Update";
            case "message": return "New Message";
            default: return "aimobility";
        }
    }

    private void schedulePing() {
        if (pingRunnable != null) {
            handler.removeCallbacks(pingRunnable);
        }
        pingRunnable = () -> {
            if (connected && shouldConnect) {
                sendPing();
                schedulePing();
            }
        };
        handler.postDelayed(pingRunnable, PING_INTERVAL_MS);
    }

    private void scheduleReconnect() {
        if (!shouldConnect || reconnecting) return;
        reconnecting = true;
        long delay = BACKOFF_MS[Math.min(reconnectAttempt, BACKOFF_MS.length - 1)];
        reconnectAttempt++;
        Log.i(TAG, "Reconnecting in " + delay + "ms (attempt " + reconnectAttempt + ")");
        handler.postDelayed(() -> {
            reconnecting = false;
            doConnect();
        }, delay);
    }
}
