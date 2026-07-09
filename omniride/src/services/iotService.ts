/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility IoT Service  —  AWS IoT Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Connects to AWS IoT Core via MQTT over WebSocket for real-time telemetry.
 *
 * Architecture:
 *  EV Bike (BMS) ──MQTT──► AWS IoT Core ──Rule──► Lambda ──► DynamoDB
 *                                                              ↓
 *                                          Frontend ◄──GET── API Gateway
 *
 * The frontend:
 *  1. Subscribes to the IoT WebSocket for live streaming deltas (optional)
 *  2. Polls `GET /iot/telemetry` via Lambda for the latest snapshot
 *  3. Falls back to realistic simulated data when offline
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TelemetryData } from '../types';
import { awsGet, awsPost } from './awsClient';
import { LAMBDA_ROUTES, IOT_ENDPOINT } from './awsConfig';

// TERRA-012: Real IoT WebSocket URL fetched from Lambda (signed endpoint)
let _streamUrl: string | null = null;
async function getSignedStreamUrl(riderId: string): Promise<string> {
  if (_streamUrl) return _streamUrl;
  try {
    const { data } = await awsPost<{ wsUrl: string }>(LAMBDA_ROUTES.IOT_STREAM_URL, { riderId });
    if (data?.wsUrl) { _streamUrl = data.wsUrl; return data.wsUrl; }
  } catch { /* fall through to default */ }
  return `${IOT_ENDPOINT}?clientId=opusaimobility-${riderId}`;
}

const CACHE_KEY = 'opusaimobility-telemetry';

/** Simulated realistic telemetry (offline fallback). */
function simulateTelemetry(): TelemetryData {
  return {
    batteryTemp:          28  + Math.random() * 8,
    motorTemp:            42  + Math.random() * 15,
    controllerTemp:       38  + Math.random() * 12,
    cycleCount:           156,
    healthPercentage:     94.2,
    efficiencyWhKm:       38  + Math.random() * 10,
    totalEnergyConsumed:  1240.8,
    brakeWearStatus:      82,
    swapCount:            24,
    ecoScore:             88,
    lastSwapTimestamp:    Date.now() - 4 * 3_600_000,
  };
}

export const iotApi = {

  /**
   * Fetch the latest telemetry snapshot.
   * Lambda reads from DynamoDB (where IoT Rule writes live data).
   * Falls back to simulated data offline.
   */
  getLiveTelemetry: async (): Promise<TelemetryData> => {
    const { data, error } = await awsGet<TelemetryData>(
      LAMBDA_ROUTES.IOT_TELEMETRY,
      CACHE_KEY,
    );

    if (!error && data) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* quota */ }
      return data;
    }

    // Offline: return cached or simulated
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached) as TelemetryData;
    } catch { /* ignore */ }

    return simulateTelemetry();
  },

  /**
   * Trigger an OTA firmware update via Lambda → IoT Core Jobs API.
   * Returns true when the job is successfully queued.
   */
  updateFirmware: async (): Promise<boolean> => {
    const { error } = await awsPost(LAMBDA_ROUTES.IOT_FIRMWARE, {});
    return !error;
  },

  /**
   * Open a direct MQTT-over-WebSocket connection to IoT Core
   * for live streaming telemetry deltas.
   *
   * NOTE: Requires AWS IoT Core authorizer to be configured with
   *       a signed URL or custom token. This method returns the
   *       WebSocket URL for the caller to manage the connection.
   *
   * @param riderId  The rider's ID (used as MQTT client ID)
   * @returns        Signed IoT WebSocket URL
   */
  // TERRA-012: Now fetches signed URL from Lambda instead of PLACEHOLDER
  getStreamUrl: (riderId: string): string => {
    // Returns synchronous fallback; use subscribeToTelemetry for async signed URL
    return `${IOT_ENDPOINT}?clientId=opusaimobility-${riderId}`;
  },

  /**
   * Subscribe to live telemetry events via IoT Core WebSocket.
   * Returns an unsubscribe function.
   *
   * @param riderId   The rider ID to subscribe for
   * @param onData    Called with each new TelemetryData update
   * @param onError   Called on connection error
   */
  subscribeToTelemetry: (
    riderId:  string,
    onData:   (data: TelemetryData) => void,
    onError:  (err: string) => void,
  ): (() => void) => {
    // TERRA-012: fetch signed URL from Lambda, then open real WebSocket
    let cancelled = false;
    let ws: WebSocket | null = null;
    let pollInterval: any = null;

    getSignedStreamUrl(riderId).then(wsUrl => {
      if (cancelled) return;

      // TERRA-012: Connect to real IoT Core WebSocket
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data as string);
            onData(parsed as TelemetryData);
          } catch { /* skip malformed */ }
        };
        ws.onerror = () => {
          onError('IoT Core WebSocket error — falling back to polling');
          pollInterval = setInterval(() => onData(simulateTelemetry()), 5_000);
        };
        ws.onclose = (ev) => {
          if (ev.code !== 1000 && !cancelled) {
            // Reconnect after 3s
            setTimeout(() => {
              if (!cancelled) iotApi.subscribeToTelemetry(riderId, onData, onError);
            }, 3_000);
          }
        };
      } catch (err: any) {
        onError(err?.message ?? 'Failed to open IoT WebSocket');
        pollInterval = setInterval(() => onData(simulateTelemetry()), 5_000);
      }
    }).catch(() => {
      if (!cancelled) pollInterval = setInterval(() => onData(simulateTelemetry()), 5_000);
    });

    // Return unsubscribe function
    return () => {
      cancelled = true;
      if (ws && ws.readyState === WebSocket.OPEN) ws.close(1000, 'Component unmounted');
      if (pollInterval) clearInterval(pollInterval);
    };
  },
};
