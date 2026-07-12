/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility Sync Service  —  TERRA-070
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Replaces raw localStorage reads with a DynamoDB-first approach:
 *   1. Try to fetch from Lambda/DynamoDB (awsGet)
 *   2. On success: write to localStorage cache + return data
 *   3. On failure: return localStorage cache as fallback
 *
 * Provides typed helpers for every entity type used across components.
 * All writes go through omniApi (which already does DynamoDB + localStorage).
 *
 * Usage (replaces direct localStorage.getItem):
 *   // OLD: JSON.parse(localStorage.getItem('opusaimobility-trips') || '[]')
 *   // NEW: await syncService.getTrips(userId)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { awsGet }                     from './awsClient';
import { LAMBDA_ROUTES }              from './awsConfig';
import type {
  RideHistoryItem, Order, DeliveryOrder, ErrandOrder,
  PaymentHistoryItem, User,
} from '../types';

// ── Cache helpers ─────────────────────────────────────────────────────────────

function readLocal<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}

function writeLocal(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

// ── Sync helpers ──────────────────────────────────────────────────────────────

/**
 * Fetch a list resource: try Lambda/DynamoDB, fall back to localStorage.
 * Writes fresh data into localStorage on success for offline resilience.
 */
async function syncList<T>(
  lambdaPath: string,
  cacheKey:   string,
  userFilter?: (item: T & { customerId?: string; riderId?: string; allocatedRiderId?: string }) => boolean,
): Promise<T[]> {
  try {
    const { data, error } = await awsGet<T[]>(lambdaPath);
    if (!error && data && Array.isArray(data)) {
      writeLocal(cacheKey, data);
      return userFilter ? data.filter(userFilter as any) : data;
    }
  } catch { /* fall through */ }
  // Offline fallback
  const cached = readLocal<T>(cacheKey);
  return userFilter ? cached.filter(userFilter as any) : cached;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public sync API
// ─────────────────────────────────────────────────────────────────────────────

export const syncService = {

  /**
   * Get trips (rides) for a specific user or all trips (admin).
   * DynamoDB-first, localStorage fallback.
   */
  getTrips: async (userId?: string): Promise<RideHistoryItem[]> => {
    const path = userId
      ? `${LAMBDA_ROUTES.RIDES_LIST}?userId=${userId}`
      : LAMBDA_ROUTES.RIDES_LIST;
    return syncList<RideHistoryItem>(
      path,
      'opusaimobility-trips',
      userId ? (t) => t.customerId === userId || (t as any).riderId === userId : undefined,
    );
  },

  /**
   * Get orders (food + delivery) for a user or all (admin).
   */
  getOrders: async (userId?: string): Promise<(Order | DeliveryOrder)[]> => {
    const path = userId
      ? `${LAMBDA_ROUTES.ORDERS_LIST}?userId=${userId}`
      : LAMBDA_ROUTES.ORDERS_LIST;
    return syncList<Order | DeliveryOrder>(
      path,
      'opusaimobility-orders',
      userId
        ? (o) => (o as any).customerId === userId || (o as any).riderId === userId || (o as any).allocatedRiderId === userId
        : undefined,
    );
  },

  /**
   * Get errands for a user or all (admin).
   */
  getErrands: async (userId?: string): Promise<ErrandOrder[]> => {
    const path = userId
      ? `${LAMBDA_ROUTES.ERRANDS_LIST}?userId=${userId}`
      : LAMBDA_ROUTES.ERRANDS_LIST;
    return syncList<ErrandOrder>(
      path,
      'opusaimobility-errands',
      userId ? (e) => e.customerId === userId || (e as any).riderId === userId : undefined,
    );
  },

  /**
   * Get payment transactions for a user or all (admin).
   */
  getTransactions: async (userId?: string): Promise<PaymentHistoryItem[]> => {
    const path = userId
      ? `${LAMBDA_ROUTES.PAYMENTS_HISTORY}?userId=${userId}`
      : LAMBDA_ROUTES.PAYMENTS_HISTORY;
    return syncList<PaymentHistoryItem>(path, 'opusaimobility-transactions');
  },

  /**
   * Get users list (admin only).
   */
  getUsers: async (): Promise<User[]> => {
    return syncList<User>(LAMBDA_ROUTES.USERS_LIST, 'opusaimobility-users');
  },

  /**
   * Synchronous read from localStorage cache (for components that can't await).
   * Use after an async prefetch has already populated the cache.
   */
  getCachedTrips:        (userId?: string): RideHistoryItem[]          => {
    const all = readLocal<RideHistoryItem>('opusaimobility-trips');
    return userId ? all.filter(t => (t as any).customerId === userId || (t as any).riderId === userId) : all;
  },
  getCachedOrders:       (userId?: string): (Order | DeliveryOrder)[] => {
    const all = readLocal<Order | DeliveryOrder>('opusaimobility-orders');
    return userId ? all.filter((o: any) => o.customerId === userId || o.riderId === userId || o.allocatedRiderId === userId) : all;
  },
  getCachedErrands:      (userId?: string): ErrandOrder[]             => {
    const all = readLocal<ErrandOrder>('opusaimobility-errands');
    return userId ? all.filter(e => (e as any).customerId === userId || (e as any).riderId === userId) : all;
  },
  getCachedTransactions: (): PaymentHistoryItem[]                      => readLocal<PaymentHistoryItem>('opusaimobility-transactions'),
  getCachedUsers:        (): User[]                                    => readLocal<User>('opusaimobility-users'),

  /**
   * Prefetch all data for a user and warm up localStorage cache.
   * Call this after login so all subsequent sync reads are fast.
   */
  prefetchForUser: async (userId: string): Promise<void> => {
    await Promise.allSettled([
      syncService.getTrips(userId),
      syncService.getOrders(userId),
      syncService.getErrands(userId),
      syncService.getTransactions(userId),
    ]);
  },

  /**
   * Prefetch all platform data (admin).
   */
  prefetchAll: async (): Promise<void> => {
    await Promise.allSettled([
      syncService.getTrips(),
      syncService.getOrders(),
      syncService.getErrands(),
      syncService.getTransactions(),
      syncService.getUsers(),
    ]);
  },
};
