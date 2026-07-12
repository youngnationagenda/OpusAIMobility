/**
 * Property tests for TERRA-011 — IoT WebSocket Integration
 *
 * Properties verified:
 *  P-IOT-1: energy frame has required fields (vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus)
 *  P-IOT-2: batteryPct always in [0, 100]
 *  P-IOT-3: chargeRateKw always >= 0
 *  P-IOT-4: notification frame has userId, title, body, type
 *  P-IOT-5: energy topic is correctly formed as opusaimobility/energy/{vehicleId}
 *  P-IOT-6: notification topic is correctly formed as opusaimobility/notifications/{userId}
 *  P-IOT-7: rangeKm is always non-negative
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── Types mirroring wsService.ts ──────────────────────────────────────────────

interface EnergyFrame {
  vehicleId:      string;
  batteryPct:     number;
  chargeRateKw:   number;
  rangeKm:        number;
  chargingStatus: 'charging' | 'discharging' | 'idle' | 'full';
  timestamp:      number;
}

interface NotificationFrame {
  userId:    string;
  title:     string;
  body:      string;
  type:      string;
  data?:     Record<string, string>;
  timestamp: string;
}

// ── Pure helpers extracted from TERRA-011 hook logic ─────────────────────────

/** Build an energy subscribe frame */
function buildEnergySubscribeFrame(vehicleId: string): { action: string; topic: string } {
  return { action: 'subscribe', topic: `opusaimobility/energy/${vehicleId}` };
}

/** Build a notification subscribe frame */
function buildNotificationSubscribeFrame(userId: string): { action: string; topic: string } {
  return { action: 'subscribe', topic: `opusaimobility/notifications/${userId}` };
}

/**
 * Validate and normalize an incoming energy frame.
 * Returns null if the frame is invalid.
 */
function validateEnergyFrame(raw: any): EnergyFrame | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.vehicleId !== 'string' || raw.vehicleId.length === 0) return null;
  if (typeof raw.batteryPct !== 'number')   return null;
  if (typeof raw.chargeRateKw !== 'number') return null;
  if (typeof raw.rangeKm !== 'number')      return null;
  if (!['charging', 'discharging', 'idle', 'full'].includes(raw.chargingStatus)) return null;

  return {
    vehicleId:      raw.vehicleId,
    batteryPct:     Math.min(100, Math.max(0, raw.batteryPct)),
    chargeRateKw:   Math.max(0, raw.chargeRateKw),
    rangeKm:        Math.max(0, raw.rangeKm),
    chargingStatus: raw.chargingStatus,
    timestamp:      typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
  };
}

/** Validate an incoming notification frame */
function validateNotificationFrame(raw: any): NotificationFrame | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.userId !== 'string' || raw.userId.length === 0) return null;
  if (typeof raw.title  !== 'string') return null;
  if (typeof raw.body   !== 'string') return null;
  if (typeof raw.type   !== 'string') return null;
  return {
    userId:    raw.userId,
    title:     raw.title,
    body:      raw.body,
    type:      raw.type,
    data:      typeof raw.data === 'object' ? raw.data : undefined,
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
  };
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

const arbVehicleId    = fc.string({ minLength: 3, maxLength: 24 }).filter(s => s.trim().length > 0);
const arbUserId       = fc.string({ minLength: 4, maxLength: 36 }).filter(s => s.trim().length > 0);
const arbBatteryPct   = fc.float({ min: 0, max: 100, noNaN: true });
const arbChargeRateKw = fc.float({ min: 0, max: 350, noNaN: true });
const arbRangeKm      = fc.float({ min: 0, max: 500, noNaN: true });
const arbChargingStatus = fc.constantFrom<EnergyFrame['chargingStatus']>(
  'charging', 'discharging', 'idle', 'full',
);

const arbEnergyFrame = fc.record({
  vehicleId:      arbVehicleId,
  batteryPct:     arbBatteryPct,
  chargeRateKw:   arbChargeRateKw,
  rangeKm:        arbRangeKm,
  chargingStatus: arbChargingStatus,
  timestamp:      fc.integer({ min: 1_000_000_000_000, max: 2_000_000_000_000 }),
});

const arbNotifFrame = fc.record({
  userId:    arbUserId,
  title:     fc.string({ minLength: 1, maxLength: 100 }),
  body:      fc.string({ minLength: 1, maxLength: 500 }),
  type:      fc.constantFrom('ride_update', 'driver_assigned', 'payment', 'system', 'promo'),
  // Constrain date range: fc.date() can produce NaN dates (Invalid time value)
  timestamp: fc.date({ min: new Date(0), max: new Date('2100-01-01T00:00:00.000Z') }).map(d => d.toISOString()),
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TERRA-011: IoT WebSocket — Property Tests', () => {

  // P-IOT-1: energy frame has required fields
  it('P-IOT-1: energy frame always has vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus', () => {
    fc.assert(
      fc.property(arbEnergyFrame, (raw) => {
        const frame = validateEnergyFrame(raw);
        expect(frame).not.toBeNull();
        expect(typeof frame!.vehicleId).toBe('string');
        expect(frame!.vehicleId.length).toBeGreaterThan(0);
        expect(typeof frame!.batteryPct).toBe('number');
        expect(typeof frame!.chargeRateKw).toBe('number');
        expect(typeof frame!.rangeKm).toBe('number');
        expect(['charging', 'discharging', 'idle', 'full']).toContain(frame!.chargingStatus);
      }),
      { numRuns: 200 }
    );
  });

  // P-IOT-2: batteryPct always in [0, 100]
  it('P-IOT-2: batteryPct is always clamped to [0, 100] after validation', () => {
    fc.assert(
      fc.property(
        arbVehicleId,
        fc.float({ min: -50, max: 150, noNaN: true }),  // intentionally wider range
        arbChargeRateKw,
        arbRangeKm,
        arbChargingStatus,
        (vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus) => {
          const raw = { vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus, timestamp: Date.now() };
          const frame = validateEnergyFrame(raw);
          expect(frame).not.toBeNull();
          expect(frame!.batteryPct).toBeGreaterThanOrEqual(0);
          expect(frame!.batteryPct).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 200 }
    );
  });

  // P-IOT-3: chargeRateKw always >= 0
  it('P-IOT-3: chargeRateKw is always non-negative after validation', () => {
    fc.assert(
      fc.property(
        arbVehicleId,
        arbBatteryPct,
        fc.float({ min: -100, max: 350, noNaN: true }),  // intentionally includes negatives
        arbRangeKm,
        arbChargingStatus,
        (vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus) => {
          const raw = { vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus, timestamp: Date.now() };
          const frame = validateEnergyFrame(raw);
          expect(frame).not.toBeNull();
          expect(frame!.chargeRateKw).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  // P-IOT-4: notification frame has userId, title, body, type
  it('P-IOT-4: notification frame always has userId, title, body, type', () => {
    fc.assert(
      fc.property(arbNotifFrame, (raw) => {
        const frame = validateNotificationFrame(raw);
        expect(frame).not.toBeNull();
        expect(typeof frame!.userId).toBe('string');
        expect(frame!.userId.length).toBeGreaterThan(0);
        expect(typeof frame!.title).toBe('string');
        expect(typeof frame!.body).toBe('string');
        expect(typeof frame!.type).toBe('string');
      }),
      { numRuns: 200 }
    );
  });

  // P-IOT-5: energy topic correctly formed
  it('P-IOT-5: energy subscribe topic is always opusaimobility/energy/{vehicleId}', () => {
    fc.assert(
      fc.property(arbVehicleId, (vehicleId) => {
        const frame = buildEnergySubscribeFrame(vehicleId);
        expect(frame.action).toBe('subscribe');
        expect(frame.topic).toBe(`opusaimobility/energy/${vehicleId}`);
        expect(frame.topic.startsWith('opusaimobility/energy/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // P-IOT-6: notification topic correctly formed
  it('P-IOT-6: notification subscribe topic is always opusaimobility/notifications/{userId}', () => {
    fc.assert(
      fc.property(arbUserId, (userId) => {
        const frame = buildNotificationSubscribeFrame(userId);
        expect(frame.action).toBe('subscribe');
        expect(frame.topic).toBe(`opusaimobility/notifications/${userId}`);
        expect(frame.topic.startsWith('opusaimobility/notifications/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // P-IOT-7: rangeKm is always non-negative
  it('P-IOT-7: rangeKm is always non-negative after validation', () => {
    fc.assert(
      fc.property(
        arbVehicleId,
        arbBatteryPct,
        arbChargeRateKw,
        fc.float({ min: -999, max: 500, noNaN: true }),  // intentionally includes negatives
        arbChargingStatus,
        (vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus) => {
          const raw = { vehicleId, batteryPct, chargeRateKw, rangeKm, chargingStatus, timestamp: Date.now() };
          const frame = validateEnergyFrame(raw);
          expect(frame).not.toBeNull();
          expect(frame!.rangeKm).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Additional: invalid frames are rejected
  it('invalid energy frames without required fields are rejected (return null)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant({}),
          fc.record({ vehicleId: fc.constant('') }),  // empty vehicleId
          fc.record({ batteryPct: fc.float() }),       // missing vehicleId
        ),
        (raw) => {
          const frame = validateEnergyFrame(raw);
          expect(frame).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
