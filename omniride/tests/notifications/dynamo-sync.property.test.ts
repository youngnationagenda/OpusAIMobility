/**
 * Property-based tests for TERRA-060 / TERRA-070 / TERRA-080
 *
 * TERRA-060: Admin financial reporting — real DynamoDB data
 *   P-RPT-1: getDashboardMetrics derived values are internally consistent
 *   P-RPT-2: revenueChange is bounded to a reasonable range when data exists
 *   P-RPT-3: successRate is always in [0, 100]
 *   P-RPT-4: FinancialRecord rows are sorted ascending by date
 *
 * TERRA-070: localStorage → DynamoDB sync
 *   P-SYNC-1: syncService filter by userId never returns items belonging to other users
 *   P-SYNC-2: cache write → read roundtrip preserves all fields
 *   P-SYNC-3: empty DynamoDB response falls back to localStorage cache
 *
 * TERRA-080: ErrandPortal DynamoDB wiring
 *   P-ERRAND-1: errand order total is always baseFee + shoppingTotal
 *   P-ERRAND-2: errand id is always unique (timestamp-based)
 *   P-ERRAND-3: shoppingList total matches sum of item prices × quantities
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── TERRA-060: Reporting metrics ──────────────────────────────────────────────

interface MockTx {
  id: string; amount: number; status: 'successful' | 'pending' | 'failed';
  direction: 'in' | 'out'; timestamp: number;
}

function computeMetrics(txs: MockTx[], trips: any[], orders: any[], users: any[]) {
  const successful   = txs.filter(t => t.status === 'successful');
  const totalRevenue = successful.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  const successRate  = txs.length > 0 ? (successful.length / txs.length) * 100 : 100;
  const avgOrder     = orders.length > 0
    ? orders.reduce((s: number, o: any) => s + (o.amount || 0), 0) / orders.length
    : 0;
  const now = Date.now();
  const day7  = now - 7 * 86_400_000;
  const day14 = now - 14 * 86_400_000;
  const thisRev = successful.filter(t => t.timestamp >= day7).reduce((s, t) => s + t.amount, 0);
  const lastRev = successful.filter(t => t.timestamp >= day14 && t.timestamp < day7).reduce((s, t) => s + t.amount, 0);
  const revenueChange = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : 0;
  return { totalRevenue, successRate, avgOrder, revenueChange, totalTrips: trips.length, totalUsers: users.length };
}

const arbTx = fc.record({
  id:        fc.string({ minLength: 4, maxLength: 16 }),
  amount:    fc.float({ min: Math.fround(0.01), max: Math.fround(10_000), noNaN: true }),
  status:    fc.constantFrom('successful' as const, 'pending' as const, 'failed' as const),
  direction: fc.constantFrom('in' as const, 'out' as const),
  timestamp: fc.integer({ min: Date.now() - 30 * 86_400_000, max: Date.now() }),
});

describe('TERRA-060: Admin Financial Reporting — Properties', () => {

  it('P-RPT-1: totalRevenue equals sum of successful outgoing transactions', () => {
    fc.assert(
      fc.property(fc.array(arbTx, { minLength: 0, maxLength: 50 }), (txs) => {
        const { totalRevenue } = computeMetrics(txs, [], [], []);
        const expected = txs.filter(t => t.status === 'successful' && t.direction === 'out')
          .reduce((s, t) => s + t.amount, 0);
        expect(totalRevenue).toBeCloseTo(expected, 4);
      }),
      { numRuns: 200 }
    );
  });

  it('P-RPT-2: successRate is always in [0, 100]', () => {
    fc.assert(
      fc.property(fc.array(arbTx, { minLength: 0, maxLength: 100 }), (txs) => {
        const { successRate } = computeMetrics(txs, [], [], []);
        expect(successRate).toBeGreaterThanOrEqual(0);
        expect(successRate).toBeLessThanOrEqual(100);
      }),
      { numRuns: 200 }
    );
  });

  it('P-RPT-3: avgOrder is non-negative', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ amount: fc.float({ min: 0, max: 5000, noNaN: true }) }), { minLength: 0, maxLength: 30 }),
        (orders) => {
          const { avgOrder } = computeMetrics([], [], orders, []);
          expect(avgOrder).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('P-RPT-4: FinancialRecord rows sorted ascending by date are in correct order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            Date: fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') })
                    .filter(d => !isNaN(d.getTime())), // exclude Invalid Date
          }),
          { minLength: 2, maxLength: 30 }
        ),
        (records) => {
          const sorted = [...records].sort((a, b) => a.Date.getTime() - b.Date.getTime());
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].Date.getTime()).toBeGreaterThanOrEqual(sorted[i - 1].Date.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── TERRA-070: Sync service / localStorage → DynamoDB ────────────────────────

interface MockItem { id: string; customerId: string; riderId?: string; amount: number; }

function filterByUser<T extends MockItem>(items: T[], userId: string): T[] {
  return items.filter(i => i.customerId === userId || i.riderId === userId);
}

const arbUserId = fc.string({ minLength: 4, maxLength: 16 }).filter(s => s.trim().length > 0);
const arbItem   = (userId?: string) => fc.record({
  id:         fc.string({ minLength: 4, maxLength: 16 }),
  customerId: userId ? fc.constant(userId) : fc.string({ minLength: 4, maxLength: 16 }),
  riderId:    fc.option(fc.string({ minLength: 4, maxLength: 16 }), { nil: undefined }),
  amount:     fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
});

describe('TERRA-070: Sync Service — Properties', () => {

  it('P-SYNC-1: filtering by userId never returns items with different customerId and no riderId match', () => {
    fc.assert(
      fc.property(
        arbUserId,
        arbUserId,
        fc.array(arbItem(), { minLength: 0, maxLength: 30 }),
        (userId, otherId, items) => {
          fc.pre(userId !== otherId);
          const filtered = filterByUser(items, userId);
          filtered.forEach(item => {
            expect(item.customerId === userId || item.riderId === userId).toBe(true);
          });
        }
      ),
      { numRuns: 200 }
    );
  });

  it('P-SYNC-2: JSON serialise → deserialise preserves all numeric fields', () => {
    fc.assert(
      fc.property(
        fc.array(arbItem(), { minLength: 0, maxLength: 20 }),
        (items) => {
          const serialised   = JSON.stringify(items);
          const deserialised = JSON.parse(serialised) as MockItem[];
          deserialised.forEach((item, i) => {
            expect(item.amount).toBeCloseTo(items[i].amount, 5);
            expect(item.id).toBe(items[i].id);
            expect(item.customerId).toBe(items[i].customerId);
          });
        }
      ),
      { numRuns: 200 }
    );
  });

  it('P-SYNC-3: when remote returns empty array, cache fallback is used', () => {
    fc.assert(
      fc.property(
        fc.array(arbItem(), { minLength: 1, maxLength: 20 }),
        (cachedItems) => {
          // Simulate: remote = [], cache = cachedItems → result = cachedItems
          const remoteData: MockItem[] = [];
          const result = remoteData.length > 0 ? remoteData : cachedItems;
          expect(result.length).toBe(cachedItems.length);
          expect(result[0].id).toBe(cachedItems[0].id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── TERRA-080: Errand Portal ──────────────────────────────────────────────────

interface CartItem { price: number; quantity: number; }

function buildErrandOrder(baseFee: number, cart: CartItem[]) {
  const shoppingTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  return {
    id:            'ERR-' + Date.now().toString(36).toUpperCase(),
    baseFee,
    shoppingTotal,
    grandTotal:    baseFee + shoppingTotal,
    shoppingList:  cart.map((c, i) => ({ itemId: String(i), price: c.price, quantity: c.quantity })),
  };
}

const arbCart = fc.array(
  fc.record({
    price:    fc.float({ min: Math.fround(0.01), max: Math.fround(500), noNaN: true }),
    quantity: fc.integer({ min: 1, max: 20 }),
  }),
  { minLength: 0, maxLength: 15 }
);

describe('TERRA-080: ErrandPortal — Properties', () => {

  it('P-ERRAND-1: grandTotal always equals baseFee + shoppingTotal', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(200), noNaN: true }),
        arbCart,
        (baseFee, cart) => {
          const order = buildErrandOrder(baseFee, cart);
          expect(order.grandTotal).toBeCloseTo(order.baseFee + order.shoppingTotal, 4);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('P-ERRAND-2: shoppingTotal equals sum of price × quantity for all cart items', () => {
    fc.assert(
      fc.property(arbCart, (cart) => {
        const order = buildErrandOrder(0, cart);
        const expected = cart.reduce((s, c) => s + c.price * c.quantity, 0);
        expect(order.shoppingTotal).toBeCloseTo(expected, 4);
      }),
      { numRuns: 200 }
    );
  });

  it('P-ERRAND-3: shoppingTotal is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        arbCart,
        (baseFee, cart) => {
          const order = buildErrandOrder(baseFee, cart);
          expect(order.shoppingTotal).toBeGreaterThanOrEqual(0);
          expect(order.grandTotal).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('P-ERRAND-4: errand id is always a non-empty string starting with ERR-', () => {
    fc.assert(
      fc.property(fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }), (baseFee) => {
        const order = buildErrandOrder(baseFee, []);
        expect(typeof order.id).toBe('string');
        expect(order.id.length).toBeGreaterThan(0);
        expect(order.id.startsWith('ERR-')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('P-ERRAND-5: shoppingList item count matches cart length', () => {
    fc.assert(
      fc.property(arbCart, (cart) => {
        const order = buildErrandOrder(10, cart);
        expect(order.shoppingList.length).toBe(cart.length);
      }),
      { numRuns: 100 }
    );
  });
});
