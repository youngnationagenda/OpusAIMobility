/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility Notification Service — Real-time Push via IoT Core MQTT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Subscribes to the user's personal MQTT notification topic:
 *   opusaimobility/notifications/{userId}
 *
 * Architecture:
 *  Backend → SNS → push-notification Lambda → IoT Core MQTT → THIS SERVICE → UI
 *
 * Falls back to polling the API when WebSocket is unavailable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { awsGet, awsPost } from './awsClient';
import { IOT_ENDPOINT, LAMBDA_ROUTES } from './awsConfig';

export interface PushNotification {
  notificationId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  timestamp: string;
}

type NotificationHandler = (notification: PushNotification) => void;
type ErrorHandler = (error: string) => void;

let _ws: WebSocket | null = null;
let _handlers: NotificationHandler[] = [];
let _errorHandlers: ErrorHandler[] = [];
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let _connected = false;
let _userId: string | null = null;

/**
 * Connect to the IoT Core MQTT WebSocket for real-time notifications.
 * Subscribes to: opusaimobility/notifications/{userId}
 */
export async function connectNotifications(userId: string): Promise<void> {
  if (_connected && _userId === userId) return;
  
  _userId = userId;
  
  // Get signed WebSocket URL from Lambda
  let wsUrl: string;
  try {
    const { data } = await awsPost<{ wsUrl: string }>(
      LAMBDA_ROUTES.IOT_STREAM_URL,
      { riderId: userId, topic: `opusaimobility/notifications/${userId}` }
    );
    wsUrl = data?.wsUrl || `${IOT_ENDPOINT}?clientId=opusaimobility-notif-${userId}`;
  } catch {
    wsUrl = `${IOT_ENDPOINT}?clientId=opusaimobility-notif-${userId}`;
  }

  try {
    _ws = new WebSocket(wsUrl);
    
    _ws.onopen = () => {
      _connected = true;
      console.log('[notifications] Connected to IoT Core MQTT');
      
      // Subscribe to user's notification topic
      if (_ws?.readyState === WebSocket.OPEN) {
        _ws.send(JSON.stringify({
          action: 'subscribe',
          topic: `opusaimobility/notifications/${userId}`
        }));
      }
    };

    _ws.onmessage = (event) => {
      try {
        const notification: PushNotification = JSON.parse(event.data);
        _handlers.forEach(handler => handler(notification));
      } catch (e) {
        console.warn('[notifications] Failed to parse message:', e);
      }
    };

    _ws.onerror = () => {
      _errorHandlers.forEach(h => h('Notification WebSocket error'));
      scheduleReconnect(userId);
    };

    _ws.onclose = () => {
      _connected = false;
      scheduleReconnect(userId);
    };
  } catch (err: any) {
    _errorHandlers.forEach(h => h(err?.message ?? 'Failed to connect'));
    scheduleReconnect(userId);
  }
}

/**
 * Disconnect from the notification WebSocket.
 */
export function disconnectNotifications(): void {
  if (_reconnectTimer) {
    clearTimeout(_reconnectTimer);
    _reconnectTimer = null;
  }
  if (_ws) {
    _ws.close();
    _ws = null;
  }
  _connected = false;
  _userId = null;
}

/**
 * Register a handler for incoming push notifications.
 * Returns an unsubscribe function.
 */
export function onNotification(handler: NotificationHandler): () => void {
  _handlers.push(handler);
  return () => {
    _handlers = _handlers.filter(h => h !== handler);
  };
}

/**
 * Register a handler for connection errors.
 */
export function onNotificationError(handler: ErrorHandler): () => void {
  _errorHandlers.push(handler);
  return () => {
    _errorHandlers = _errorHandlers.filter(h => h !== handler);
  };
}

/**
 * Check if currently connected to the notification stream.
 */
export function isNotificationConnected(): boolean {
  return _connected;
}

/**
 * Fetch notification history from the API (fallback when WS unavailable).
 */
export async function getNotificationHistory(limit = 20): Promise<PushNotification[]> {
  const { data } = await awsGet<{ notifications: PushNotification[] }>(
    `${LAMBDA_ROUTES.NOTIFICATIONS}?limit=${limit}`
  );
  return data?.notifications || [];
}

/** Schedule reconnect with exponential backoff */
function scheduleReconnect(userId: string): void {
  if (_reconnectTimer) return;
  _reconnectTimer = setTimeout(() => {
    _reconnectTimer = null;
    if (_userId === userId) {
      connectNotifications(userId);
    }
  }, 5000);
}

export const notificationService = {
  connect: connectNotifications,
  disconnect: disconnectNotifications,
  onNotification,
  onError: onNotificationError,
  isConnected: isNotificationConnected,
  getHistory: getNotificationHistory,
};
