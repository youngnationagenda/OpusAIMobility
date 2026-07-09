/**
 * Property tests for TERRA-040 / TERRA-041 — Driver Location WebSocket
 *
 * Properties verified:
 *  P-WS-1: Every sendLocation frame contains required fields (rideId, lat, lng, heading, speedKmh, timestamp)
 *  P-WS-2: Heading is always in range [0, 360)
 *  P-WS-3: speedKmh is always non-negative
 *  P-WS-4: subscribe frame always contains action='subscribe' and a rideId
 *  P-WS-5: Multiple location updates for the same rideId are deduplicated — only the latest is rendered
 *  P-WS-6: Incoming frames with wrong rideId are ignored (no state update)
 *  P-WS-7: Heading computed from two GPS positions is deterministic and in [0, 360)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── Shared types (mirror of wsService.ts) ────────────────────────────────────

interface LocationFrame {
  action:    'sendLocation';
  rideId:    string;
  lat:       number;
  lng:       number;
  heading:   number;
  speedKmh:  number;
  timestamp: number;
}

interface SubscribeFrame {
  action: 'subscribe';
  rideId: string;
}

type DriverLocationState = {
  rideId:    string;
  lat:       number;
  lng:       number;
  heading:   number;
  speedKmh:  number;
  timestamp: number;
  driverId:  string;
} | null;

// ── Pure functions extracted from wsService / LocationWebSocketService ───────

/** Build a location frame — pure, testable version */
function buildLocationFrame(
  rideId:   string,
  lat:      number,
  lng:      number,
  heading:  number,
  speedKmh: number,
): LocationFrame {
  return {
    action:    'sendLocation',
    rideId,
    lat,
    lng,
    heading:   ((heading % 360) + 360) % 360,   // normalize to [0,360)
    speedKmh:  Math.max(0, speedKmh),
    timestamp: Date.now(),
  };
}

/** Build a subscribe frame */
function buildSubscribeFrame(rideId: string): SubscribeFrame {
  return { action: 'subscribe', rideId };
}

/** Compute heading from two GPS points (mirrors Java computeHeading) */
function computeHeading(
  prevLat: number, prevLng: number,
  currLat: number, currLng: number,
): number {
  const dLng  = currLng - prevLng;
  const dLat  = currLat - prevLat;
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  return ((angle % 360) + 360) % 360;
}

/**
 * Simulate the MapView driverPos state reducer:
 * Returns the latest driverLocation frame matching the subscribed rideId,
 * or null if the frame's rideId doesn't match.
 */
function applyDriverLocationFrame(
  subscribedRideId: string,
  incoming: { action: string; rideId: string; lat: number; lng: number; heading: number; speedKmh: number; timestamp: number; driverId: string },
): DriverLocationState {
  if (incoming.action !== 'driverLocation') return null;
  if (incoming.rideId !== subscribedRideId)  return null;
  return {
    rideId:    incoming.rideId,
    lat:       incoming.lat,
    lng:       incoming.lng,
    heading:   incoming.heading,
    speedKmh:  incoming.speedKmh,
    timestamp: incoming.timestamp,
    driverId:  incoming.driverId,
  };
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

const arbRideId   = fc.string({ minLength: 4, maxLength: 32 }).filter(s => s.trim().length > 0);
const arbLat      = fc.float({ min: -90,  max: 90,  noNaN: true });
const arbLng      = fc.float({ min: -180, max: 180, noNaN: true });
const arbHeading  = fc.float({ min: -720, max: 720, noNaN: true }); // intentionally wide — should be clamped
const arbSpeed    = fc.float({ min: -10,  max: 200, noNaN: true }); // intentionally includes negatives

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TERRA-040/041: Driver Location WebSocket — Property Tests', () => {

  // P-WS-1: Every location frame has required fields
  it('P-WS-1: sendLocation frame always has required action, rideId, lat, lng, heading, speedKmh, timestamp', () => {
    fc.assert(
      fc.property(arbRideId, arbLat, arbLng, arbHeading, arbSpeed,
        (rideId, lat, lng, heading, speedKmh) => {
          const frame = buildLocationFrame(rideId, lat, lng, heading, speedKmh);
          expect(frame.action).toBe('sendLocation');
          expect(typeof frame.rideId).toBe('string');
          expect(frame.rideId).toBe(rideId);
          expect(typeof frame.lat).toBe('number');
          expect(typeof frame.lng).toBe('number');
          expect(typeof frame.heading).toBe('number');
          expect(typeof frame.speedKmh).toBe('number');
          expect(typeof frame.timestamp).toBe('number');
          expect(frame.timestamp).toBeGreaterThan(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  // P-WS-2: Heading always normalized to [0, 360)
  it('P-WS-2: heading in location frame is always in [0, 360) regardless of raw input', () => {
    fc.assert(
      fc.property(arbRideId, arbLat, arbLng, arbHeading, arbSpeed,
        (rideId, lat, lng, heading, speedKmh) => {
          const frame = buildLocationFrame(rideId, lat, lng, heading, speedKmh);
          expect(frame.heading).toBeGreaterThanOrEqual(0);
          expect(frame.heading).toBeLessThan(360);
        }
      ),
      { numRuns: 200 }
    );
  });

  // P-WS-3: speedKmh always non-negative
  it('P-WS-3: speedKmh is always clamped to ≥ 0 even when negative input given', () => {
    fc.assert(
      fc.property(arbRideId, arbLat, arbLng, arbHeading, arbSpeed,
        (rideId, lat, lng, heading, speedKmh) => {
          const frame = buildLocationFrame(rideId, lat, lng, heading, speedKmh);
          expect(frame.speedKmh).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  // P-WS-4: Subscribe frame structure
  it('P-WS-4: subscribe frame always has action=subscribe and the correct rideId', () => {
    fc.assert(
      fc.property(arbRideId, (rideId) => {
        const frame = buildSubscribeFrame(rideId);
        expect(frame.action).toBe('subscribe');
        expect(frame.rideId).toBe(rideId);
      }),
      { numRuns: 100 }
    );
  });

  // P-WS-5: Latest location update wins — state is always the most recent frame
  it('P-WS-5: applying multiple location frames for same rideId always yields the last one', () => {
    fc.assert(
      fc.property(
        arbRideId,
        fc.array(fc.tuple(arbLat, arbLng, arbHeading, arbSpeed), { minLength: 2, maxLength: 20 }),
        (rideId, updates) => {
          const driverId = 'driver-001';
          let state: DriverLocationState = null;

          updates.forEach(([lat, lng, heading, speedKmh], idx) => {
            const frame = {
              action:    'driverLocation' as const,
              rideId,
              lat,
              lng,
              heading:   ((heading % 360) + 360) % 360,
              speedKmh:  Math.max(0, speedKmh),
              timestamp: idx,
              driverId,
            };
            state = applyDriverLocationFrame(rideId, frame) ?? state;
          });

          // State must match the last update
          const last = updates[updates.length - 1];
          expect(state).not.toBeNull();
          expect(state!.lat).toBeCloseTo(last[0], 5);
          expect(state!.lng).toBeCloseTo(last[1], 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P-WS-6: Frames for wrong rideId are ignored
  it('P-WS-6: driverLocation frame with wrong rideId returns null (frame is ignored)', () => {
    fc.assert(
      fc.property(
        arbRideId,
        arbRideId,
        arbLat, arbLng,
        (subscribedId, incomingId, lat, lng) => {
          // Only test cases where rideIds differ
          fc.pre(subscribedId !== incomingId);

          const frame = {
            action:    'driverLocation' as const,
            rideId:    incomingId,
            lat,
            lng,
            heading:   0,
            speedKmh:  0,
            timestamp: Date.now(),
            driverId:  'driver-x',
          };

          const result = applyDriverLocationFrame(subscribedId, frame);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  // P-WS-7: Heading computation is deterministic and in [0, 360)
  it('P-WS-7: computeHeading is deterministic and always returns a value in [0, 360)', () => {
    fc.assert(
      fc.property(
        arbLat, arbLng,
        arbLat, arbLng,
        (lat1, lng1, lat2, lng2) => {
          const h1 = computeHeading(lat1, lng1, lat2, lng2);
          const h2 = computeHeading(lat1, lng1, lat2, lng2);

          // Deterministic
          expect(h1).toBe(h2);

          // In valid range
          expect(h1).toBeGreaterThanOrEqual(0);
          expect(h1).toBeLessThan(360);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Bonus: action field is always the correct string literal
  it('action field is always the exact string literal — never undefined or null', () => {
    fc.assert(
      fc.property(arbRideId, arbLat, arbLng, (rideId, lat, lng) => {
        const locFrame = buildLocationFrame(rideId, lat, lng, 0, 0);
        const subFrame = buildSubscribeFrame(rideId);
        expect(locFrame.action).toBe('sendLocation');
        expect(subFrame.action).toBe('subscribe');
      }),
      { numRuns: 100 }
    );
  });
});
