/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility WebSocket Service  —  TERRA-040 / TERRA-041 / TERRA-011
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Real-time bidirectional communication via API Gateway WebSocket API.
 *
 * WebSocket endpoint: wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod
 * DynamoDB table:     omniride-connections  (connectionId, userId, role, ttl)
 *
 * Message protocol (JSON frames):
 *
 *   Client → Server:
 *     { action: 'sendLocation', rideId, lat, lng, heading, speedKmh, timestamp }
 *     { action: 'subscribe',    rideId }
 *     { action: 'subscribe',    topic }          ← TERRA-011 IoT topic subscription
 *     { action: 'ping' }
 *
 *   Server → Client:
 *     { action: 'driverLocation',  rideId, lat, lng, heading, speedKmh, timestamp, driverId }
 *     { action: 'notification',    type, title, body, data, timestamp }
 *     { action: 'energyUpdate',    vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus, timestamp }
 *     { action: 'pong' }
 *
 * TERRA-040: Customers subscribe to a rideId and receive driverLocation frames.
 * TERRA-041: Drivers (Android) send sendLocation frames every 3s during active ride.
 * TERRA-011: EnergyPortal subscribes to opusaimobility/energy/{vehicleId} topic.
 *            RiderDashboard subscribes to opusaimobility/notifications/{userId} topic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DriverLocation {
  rideId:    string;
  driverId:  string;
  lat:       number;
  lng:       number;
  heading:   number;   // degrees 0-360
  speedKmh:  number;
  timestamp: number;
}

export interface WsLocationUpdate {
  action:    'sendLocation';
  rideId:    string;
  lat:       number;
  lng:       number;
  heading:   number;
  speedKmh:  number;
  timestamp: number;
}

// ── TERRA-011: Energy frame ────────────────────────────────────────────────────
export interface EnergyFrame {
  vehicleId:      string;
  batteryPct:     number;   // 0-100
  chargeRateKw:   number;   // >= 0
  rangeKm:        number;   // >= 0
  chargingStatus: 'charging' | 'discharging' | 'idle' | 'full';
  timestamp:      number;
}

// ── TERRA-011: Notification frame ─────────────────────────────────────────────
export interface NotificationFrame {
  userId:    string;
  title:     string;
  body:      string;
  type:      string;
  data?:     Record<string, string>;
  timestamp: string;
}

export type WsIncomingMessage =
  | { action: 'driverLocation' } & DriverLocation
  | { action: 'notification' } & NotificationFrame
  | { action: 'energyUpdate' }  & EnergyFrame
  | { action: 'pong' };

// ── Config ────────────────────────────────────────────────────────────────────
const WS_ENDPOINT =
  (import.meta as any).env?.VITE_WS_ENDPOINT ??
  'wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod';

const RECONNECT_DELAY_MS  = 3_000;
const MAX_RECONNECT_TRIES = 5;
const PING_INTERVAL_MS    = 30_000;
const LOCATION_INTERVAL_MS = 3_000;

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket singleton manager
// ─────────────────────────────────────────────────────────────────────────────

class WsManager {
  private ws:              WebSocket | null = null;
  private userId:          string | null    = null;
  private reconnectCount   = 0;
  private reconnectTimer:  ReturnType<typeof setTimeout> | null = null;
  private pingTimer:       ReturnType<typeof setInterval> | null = null;
  private messageHandlers: Set<(msg: WsIncomingMessage) => void> = new Set();
  private pendingMessages: string[] = [];

  connect(userId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.userId === userId) return;
    this.userId = userId;
    this._open();
  }

  disconnect(): void {
    this._clearTimers();
    if (this.ws) {
      this.ws.onclose = null;   // prevent auto-reconnect
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
    this.reconnectCount = 0;
  }

  subscribe(handler: (msg: WsIncomingMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  send(payload: object): void {
    const frame = JSON.stringify(payload);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    } else {
      // Queue for when connection reopens
      this.pendingMessages.push(frame);
    }
  }

  /** Subscribe to live location updates for a specific ride. */
  subscribeToRide(rideId: string): void {
    this.send({ action: 'subscribe', rideId });
  }

  /** TERRA-011: Subscribe to an IoT topic (e.g. opusaimobility/energy/{vehicleId}) */
  subscribeToTopic(topic: string): void {
    this.send({ action: 'subscribe', topic });
  }

  /** Send current GPS location (driver → server → customer). */
  sendLocation(update: Omit<WsLocationUpdate, 'action'>): void {
    this.send({ action: 'sendLocation', ...update });
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _open(): void {
    if (!this.userId) return;

    const token = localStorage.getItem('opusaimobility_access_token');
    const url    = token
      ? `${WS_ENDPOINT}?token=${encodeURIComponent(token)}`
      : WS_ENDPOINT;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectCount = 0;
      this._startPing();
      // Drain pending queue
      this.pendingMessages.splice(0).forEach(f => this.ws!.send(f));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsIncomingMessage;
        this.messageHandlers.forEach(h => h(msg));
      } catch { /* skip malformed */ }
    };

    this.ws.onerror = (e) => {
      console.warn('[WS] Error', e);
    };

    this.ws.onclose = (event) => {
      console.log('[WS] Closed', event.code, event.reason);
      this._clearTimers();
      if (event.code !== 1000 && this.reconnectCount < MAX_RECONNECT_TRIES) {
        this.reconnectCount++;
        const delay = RECONNECT_DELAY_MS * this.reconnectCount;
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);
        this.reconnectTimer = setTimeout(() => this._open(), delay);
      }
    };
  }

  private _startPing(): void {
    this._clearTimers();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  }

  private _clearTimers(): void {
    if (this.pingTimer)      { clearInterval(this.pingTimer);      this.pingTimer      = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer);  this.reconnectTimer = null; }
  }
}

// Export a single shared instance
export const wsManager = new WsManager();

// ─────────────────────────────────────────────────────────────────────────────
// TERRA-040: React hook — subscribe to live driver location for a ride
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';

/**
 * useDriverLocation
 *
 * Connects to the WebSocket, subscribes to a rideId, and returns the latest
 * driver GPS position for live map rendering.
 *
 * @param rideId    The active ride ID to track. Pass null/undefined when no ride.
 * @param userId    The current user ID (for WebSocket authentication).
 * @returns         Latest DriverLocation or null if no update received yet.
 *
 * @example
 *   const driverPos = useDriverLocation(booking.rideId, user.id);
 *   // driverPos.lat / driverPos.lng / driverPos.heading
 */
export function useDriverLocation(
  rideId: string | null | undefined,
  userId: string | null | undefined,
): DriverLocation | null {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const subscribed = useRef<string | null>(null);

  useEffect(() => {
    if (!rideId || !userId) {
      setLocation(null);
      return;
    }

    // Connect / reuse existing connection
    wsManager.connect(userId);

    // Subscribe to this ride's location channel
    if (subscribed.current !== rideId) {
      wsManager.subscribeToRide(rideId);
      subscribed.current = rideId;
    }

    // Listen for driverLocation frames
    const unsubscribe = wsManager.subscribe((msg) => {
      if (msg.action === 'driverLocation' && msg.rideId === rideId) {
        setLocation({
          rideId:    msg.rideId,
          driverId:  msg.driverId,
          lat:       msg.lat,
          lng:       msg.lng,
          heading:   msg.heading,
          speedKmh:  msg.speedKmh,
          timestamp: msg.timestamp,
        });
      }
    });

    return () => {
      unsubscribe();
      subscribed.current = null;
    };
  }, [rideId, userId]);

  return location;
}

// ─────────────────────────────────────────────────────────────────────────────
// TERRA-011: Live energy telemetry hook — EnergyPortal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useEnergyTelemetry
 *
 * Connects to the WebSocket and subscribes to the IoT topic
 * `opusaimobility/energy/{vehicleId}`, returning live energy frames.
 *
 * @param vehicleId  Vehicle ID to subscribe to. Pass null to disconnect.
 * @param userId     Current user ID for WebSocket auth.
 * @returns          { frame: latest EnergyFrame | null, isConnected: boolean }
 */
export function useEnergyTelemetry(
  vehicleId: string | null | undefined,
  userId:    string | null | undefined,
): { frame: EnergyFrame | null; isConnected: boolean } {
  const [frame, setFrame]               = useState<EnergyFrame | null>(null);
  const [isConnected, setIsConnected]   = useState(false);
  const subscribedRef                   = useRef<string | null>(null);

  useEffect(() => {
    if (!vehicleId || !userId) {
      setFrame(null);
      setIsConnected(false);
      return;
    }

    wsManager.connect(userId);

    const topic = `opusaimobility/energy/${vehicleId}`;
    if (subscribedRef.current !== topic) {
      wsManager.subscribeToTopic(topic);
      subscribedRef.current = topic;
    }

    const unsubscribe = wsManager.subscribe((msg) => {
      if (msg.action === 'energyUpdate' && msg.vehicleId === vehicleId) {
        setFrame({
          vehicleId:      msg.vehicleId,
          batteryPct:     msg.batteryPct,
          chargeRateKw:   msg.chargeRateKw,
          rangeKm:        msg.rangeKm,
          chargingStatus: msg.chargingStatus,
          timestamp:      msg.timestamp,
        });
        setIsConnected(true);
      }
      if (msg.action === 'pong') {
        setIsConnected(wsManager.isConnected);
      }
    });

    // Track connection state
    const connCheck = setInterval(() => {
      setIsConnected(wsManager.isConnected);
    }, 3_000);

    return () => {
      unsubscribe();
      clearInterval(connCheck);
      subscribedRef.current = null;
    };
  }, [vehicleId, userId]);

  return { frame, isConnected };
}

// ─────────────────────────────────────────────────────────────────────────────
// TERRA-011: Real-time notification hook — RiderDashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useRiderNotifications
 *
 * Subscribes to `opusaimobility/notifications/{userId}` via WebSocket and
 * returns incoming notification frames as they arrive (for toast rendering).
 *
 * @param userId  Current rider user ID.
 * @returns       { latest: NotificationFrame | null, isConnected: boolean }
 */
export function useRiderNotifications(
  userId: string | null | undefined,
): { latest: NotificationFrame | null; isConnected: boolean } {
  const [latest, setLatest]             = useState<NotificationFrame | null>(null);
  const [isConnected, setIsConnected]   = useState(false);
  const subscribedRef                   = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLatest(null);
      setIsConnected(false);
      return;
    }

    wsManager.connect(userId);

    const topic = `opusaimobility/notifications/${userId}`;
    if (subscribedRef.current !== topic) {
      wsManager.subscribeToTopic(topic);
      subscribedRef.current = topic;
    }

    const unsubscribe = wsManager.subscribe((msg) => {
      if (msg.action === 'notification') {
        setLatest({
          userId:    msg.userId,
          title:     msg.title,
          body:      msg.body,
          type:      msg.type,
          data:      msg.data,
          timestamp: msg.timestamp,
        });
        setIsConnected(true);
      }
      if (msg.action === 'pong') {
        setIsConnected(wsManager.isConnected);
      }
    });

    const connCheck = setInterval(() => {
      setIsConnected(wsManager.isConnected);
    }, 3_000);

    return () => {
      unsubscribe();
      clearInterval(connCheck);
      subscribedRef.current = null;
    };
  }, [userId]);

  return { latest, isConnected };
}

// ─────────────────────────────────────────────────────────────────────────────
// TERRA-041: Driver location broadcasting hook (used on the rider/driver side)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useLocationBroadcast
 *
 * For active drivers: reads the browser Geolocation API every 3 seconds and
 * sends the position to the WebSocket server, which fans it out to subscribed
 * customers.
 *
 * @param rideId    Active ride ID. Pass null to stop broadcasting.
 * @param driverId  The rider/driver user ID.
 * @returns         Object with { isActive, lastSent, error }
 *
 * @example
 *   const { isActive } = useLocationBroadcast(activeRideId, rider.id);
 */
export function useLocationBroadcast(
  rideId:   string | null | undefined,
  driverId: string | null | undefined,
): { isActive: boolean; lastSent: number | null; error: string | null } {
  const [isActive, setIsActive]  = useState(false);
  const [lastSent, setLastSent]  = useState<number | null>(null);
  const [error, setError]        = useState<string | null>(null);
  const intervalRef              = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevHeadingRef           = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!rideId || !driverId) {
      setIsActive(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    wsManager.connect(driverId);

    const sendPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, speed } = pos.coords;

          // Compute heading from previous position if available
          let heading = 0;
          if (prevHeadingRef.current) {
            const dLng = lng - prevHeadingRef.current.lng;
            const dLat = lat - prevHeadingRef.current.lat;
            heading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
          }
          prevHeadingRef.current = { lat, lng };

          wsManager.sendLocation({
            rideId,
            lat,
            lng,
            heading,
            speedKmh: speed != null ? speed * 3.6 : 0,
            timestamp: Date.now(),
          });

          setIsActive(true);
          setLastSent(Date.now());
          setError(null);
        },
        (err) => {
          setError(`GPS error: ${err.message}`);
          setIsActive(false);
        },
        { enableHighAccuracy: true, timeout: 5_000, maximumAge: 0 },
      );
    };

    sendPosition(); // send immediately
    intervalRef.current = setInterval(sendPosition, LOCATION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setIsActive(false);
    };
  }, [rideId, driverId]);

  return { isActive, lastSent, error };
}
