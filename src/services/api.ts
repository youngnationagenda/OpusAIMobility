/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OmniRide Core API  —  DynamoDB via API Gateway / Lambda
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Primary store   →  DynamoDB (via Lambda + API Gateway)
 * Offline cache   →  localStorage (used as fallback when network unavailable)
 * Session store   →  localStorage (JWT tokens + active user object)
 *
 * Every write-through also updates localStorage so the UI stays reactive
 * even when the Lambda round-trip hasn't resolved yet (optimistic update).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  User, Order, OrderStatus, DeliveryOrder, RideHistoryItem,
  CollectionAccount, RideOption, PaymentHistoryItem,
  ErrandOrder, InventoryItem, PlatformSettings, SwapStation, WalletTransaction,
} from '../types';
import { auditApi }   from './auditService';
import { awsGet, awsPost, awsPut, awsPatch, awsDelete } from './awsClient';
import { tokenStore } from './awsClient';
import { LAMBDA_ROUTES, DYNAMO_TABLES } from './awsConfig';
import { MOCK_RIDE_OPTIONS, MOCK_ERRAND_INVENTORY } from '../constants';

// ─────────────────────────────────────────────────────────────────────────────
// localStorage cache keys  (offline fallback mirrors)
// ─────────────────────────────────────────────────────────────────────────────
const CACHE = {
  USERS:             DYNAMO_TABLES.USERS,
  ORDERS:            DYNAMO_TABLES.ORDERS,
  TRIPS:             DYNAMO_TABLES.TRIPS,
  TRANSACTIONS:      DYNAMO_TABLES.TRANSACTIONS,
  FINANCE_RESERVE:   'omniride-collection',
  FLEET_CONFIG:      'omniride-fleet-config',
  PRICING_CONFIG:    'omniride-pricing-config',
  ERRANDS:           DYNAMO_TABLES.ERRANDS,
  INVENTORY:         DYNAMO_TABLES.INVENTORY,
  PLATFORM_SETTINGS: DYNAMO_TABLES.PLATFORM_SETTINGS,
  SWAP_STATIONS:     DYNAMO_TABLES.SWAP_STATIONS,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pricing config interface
// ─────────────────────────────────────────────────────────────────────────────
export interface PricingConfig {
  baseFare:          number;
  perKmRate:         number;
  demandMultiplier:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Read from localStorage cache, return typed array. */
function readCache<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}

/** Write to localStorage cache. */
function writeCache(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

/** Generate a short random ID with a prefix. */
function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// OmniAPI
// ─────────────────────────────────────────────────────────────────────────────
export const omniApi = {

  // ───────────────────────────────────────────────────────────────────────────
  // Bootstrap — seed localStorage caches on first load so UI has data
  // immediately while Lambda calls warm up.
  // ───────────────────────────────────────────────────────────────────────────
  initStore: async (): Promise<void> => {
    // Seed defaults into cache if empty
    if (!localStorage.getItem(CACHE.FLEET_CONFIG)) {
      writeCache(CACHE.FLEET_CONFIG, MOCK_RIDE_OPTIONS.map(r => ({ ...r, active: true })));
    }
    if (!localStorage.getItem(CACHE.INVENTORY)) {
      writeCache(CACHE.INVENTORY, MOCK_ERRAND_INVENTORY);
    }
    if (!localStorage.getItem(CACHE.PRICING_CONFIG)) {
      writeCache(CACHE.PRICING_CONFIG, { baseFare: 2.50, perKmRate: 0.85, demandMultiplier: 1.0 });
    }
    if (!localStorage.getItem(CACHE.FINANCE_RESERVE)) {
      writeCache(CACHE.FINANCE_RESERVE, { totalCollected: 0, heldInProcess: 0, lastReconciliation: Date.now() });
    }
    if (!localStorage.getItem(CACHE.PLATFORM_SETTINGS)) {
      writeCache(CACHE.PLATFORM_SETTINGS, { deductionTime: '23:59', systemWeeklyFee: 10.00, autoSettlementEnabled: true });
    }

    // Warm up remote caches in background (no await — non-blocking)
    omniApi._warmCaches().catch(() => {/* offline — cache already seeded */});
  },

  _warmCaches: async (): Promise<void> => {
    // Pull platform settings from DynamoDB
    const { data: ps } = await awsGet(LAMBDA_ROUTES.PLATFORM_SETTINGS, CACHE.PLATFORM_SETTINGS);
    if (ps) writeCache(CACHE.PLATFORM_SETTINGS, ps);

    // Pull fleet config
    const { data: fleet } = await awsGet(LAMBDA_ROUTES.RIDES_FLEET_CONFIG, CACHE.FLEET_CONFIG);
    if (fleet) writeCache(CACHE.FLEET_CONFIG, fleet);

    // Pull pricing
    const { data: pricing } = await awsGet(LAMBDA_ROUTES.RIDES_PRICING, CACHE.PRICING_CONFIG);
    if (pricing) writeCache(CACHE.PRICING_CONFIG, pricing);

    // Pull collection account
    const { data: col } = await awsGet(LAMBDA_ROUTES.COLLECTION_ACCOUNT, CACHE.FINANCE_RESERVE);
    if (col) writeCache(CACHE.FINANCE_RESERVE, col);

    // Pull inventory
    const { data: inv } = await awsGet(LAMBDA_ROUTES.INVENTORY_LIST, CACHE.INVENTORY);
    if (inv) writeCache(CACHE.INVENTORY, inv);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Swap Stations  →  DynamoDB: omniride-swap-stations
  // ───────────────────────────────────────────────────────────────────────────
  getSwapStations: async (): Promise<SwapStation[]> => {
    const { data, fromCache } = await awsGet<SwapStation[]>(
      LAMBDA_ROUTES.STATIONS_LIST,
      CACHE.SWAP_STATIONS,
    );
    const stations = data ?? readCache<SwapStation>(CACHE.SWAP_STATIONS);
    if (!fromCache && data) writeCache(CACHE.SWAP_STATIONS, data);
    return stations;
  },

  registerSwapStation: async (station: SwapStation): Promise<void> => {
    // Optimistic local update
    const stations = readCache<SwapStation>(CACHE.SWAP_STATIONS);
    writeCache(CACHE.SWAP_STATIONS, [...stations, station]);
    // Persist to DynamoDB
    await awsPost(LAMBDA_ROUTES.STATIONS_REGISTER, station);
  },

  updateStationStatus: async (id: string, isOpen: boolean): Promise<void> => {
    const stations = readCache<SwapStation>(CACHE.SWAP_STATIONS);
    writeCache(CACHE.SWAP_STATIONS, stations.map(s => s.id === id ? { ...s, isOpen } : s));
    await awsPatch(LAMBDA_ROUTES.STATIONS_STATUS.replace(':id', id), { isOpen });
  },

  /**
   * CORE PAYMENT PROTOCOL — 90 / 10 split.
   * Routed through Lambda which handles atomic DynamoDB updates.
   */
  processSwapPayment: async (
    riderId:     string,
    stationId:   string,
    amount:      number,
    isDedicated: boolean = false,
  ): Promise<{ success: boolean; rider?: User }> => {
    const { data, error } = await awsPost<{ success: boolean; rider: User }>(
      LAMBDA_ROUTES.PAYMENTS_SWAP,
      { riderId, stationId, amount, isDedicated },
    );

    if (error || !data?.success) {
      console.error('[API] processSwapPayment failed:', error?.message);
      return { success: false };
    }

    // Sync rider object into local cache
    if (data.rider) omniApi.syncUser(data.rider);
    return { success: true, rider: data.rider };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Platform Settings  →  DynamoDB: omniride-platform
  // ───────────────────────────────────────────────────────────────────────────
  getPlatformSettings: (): PlatformSettings => {
    return (
      JSON.parse(localStorage.getItem(CACHE.PLATFORM_SETTINGS) ?? 'null') ??
      { deductionTime: '23:59', systemWeeklyFee: 10.0, autoSettlementEnabled: true }
    );
  },

  updatePlatformSettings: async (settings: PlatformSettings): Promise<void> => {
    writeCache(CACHE.PLATFORM_SETTINGS, settings);
    await awsPut(LAMBDA_ROUTES.PLATFORM_SETTINGS, settings);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Inventory  →  DynamoDB: omniride-inventory
  // ───────────────────────────────────────────────────────────────────────────
  getInventory: (): InventoryItem[] => readCache<InventoryItem>(CACHE.INVENTORY),

  updateInventoryItem: async (item: InventoryItem): Promise<void> => {
    const items  = omniApi.getInventory();
    const idx    = items.findIndex(i => i.id === item.id);
    const updated = idx > -1
      ? items.map(i => i.id === item.id ? item : i)
      : [...items, item];
    writeCache(CACHE.INVENTORY, updated);
    await awsPut(LAMBDA_ROUTES.INVENTORY_UPDATE.replace(':id', item.id), item);
  },

  removeInventoryItem: async (id: string): Promise<void> => {
    writeCache(CACHE.INVENTORY, omniApi.getInventory().filter(i => i.id !== id));
    await awsDelete(LAMBDA_ROUTES.INVENTORY_DELETE.replace(':id', id));
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Errands  →  DynamoDB: omniride-errands
  // ───────────────────────────────────────────────────────────────────────────
  getErrands: (): ErrandOrder[] => readCache<ErrandOrder>(CACHE.ERRANDS),

  placeErrandOrder: async (errand: ErrandOrder): Promise<User | null> => {
    // Optimistic cache
    writeCache(CACHE.ERRANDS, [...omniApi.getErrands(), errand]);

    const totalCost = errand.baseFee + errand.shoppingTotal;
    const { data, error } = await awsPost<{ user: User }>(LAMBDA_ROUTES.ERRANDS_PLACE, errand);

    if (error || !data?.user) {
      // Offline fallback: mutate local user
      const users = readCache<User>(CACHE.USERS);
      const userIdx = users.findIndex(u => u.id === errand.customerId);
      if (userIdx > -1) {
        const user = { ...users[userIdx] };
        if (!user.employerId && user.role !== 'business') {
          user.walletBalance = Math.max(0, (user.walletBalance ?? 0) - totalCost);
          const tx: PaymentHistoryItem = {
            id: genId('ERN'), amount: totalCost, currency: 'USD',
            status: 'successful', method: 'OmniWallet', gateway: 'OmniWallet',
            timestamp: Date.now(), description: `Dedicated Errand: ${errand.plan} plan`,
            userType: user.role, direction: 'out',
          };
          writeCache(CACHE.TRANSACTIONS, [...readCache(CACHE.TRANSACTIONS), tx]);
        }
        omniApi.syncUser(user);
        omniApi._updateCollectionAccount(totalCost, true);
        return user;
      }
      return null;
    }

    omniApi.syncUser(data.user);
    return data.user;
  },

  assignRiderToMission: async (
    missionId:   string,
    missionType: 'ride' | 'delivery' | 'errand',
    riderId:     string,
    riderName:   string,
  ): Promise<void> => {
    // Optimistic local update
    const routeMap = {
      ride:     CACHE.TRIPS,
      delivery: CACHE.ORDERS,
      errand:   CACHE.ERRANDS,
    };
    const cacheKey  = routeMap[missionType];
    const items     = readCache<any>(cacheKey);
    const statusMap = { ride: 'on_ride', delivery: 'picked_up', errand: 'active' };
    writeCache(cacheKey, items.map((item: any) =>
      item.id === missionId
        ? { ...item, status: statusMap[missionType], riderId, riderName }
        : item,
    ));

    // Lambda route
    const routePathMap = {
      ride:     LAMBDA_ROUTES.RIDES_ASSIGN_RIDER.replace(':id', missionId),
      delivery: LAMBDA_ROUTES.ORDERS_STATUS.replace(':id', missionId),
      errand:   LAMBDA_ROUTES.ERRANDS_LIST,
    };
    await awsPatch(routePathMap[missionType], { riderId, riderName });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Fleet / Pricing Config  →  DynamoDB via Lambda
  // ───────────────────────────────────────────────────────────────────────────
  getFleetConfig: (): (RideOption & { active: boolean })[] =>
    readCache<RideOption & { active: boolean }>(CACHE.FLEET_CONFIG),

  updateFleetConfig: async (config: (RideOption & { active: boolean })[]): Promise<void> => {
    writeCache(CACHE.FLEET_CONFIG, config);
    await awsPut(LAMBDA_ROUTES.RIDES_FLEET_CONFIG, config);
  },

  getPricingConfig: (): PricingConfig =>
    JSON.parse(localStorage.getItem(CACHE.PRICING_CONFIG) ?? 'null') ??
    { baseFare: 2.5, perKmRate: 0.85, demandMultiplier: 1.0 },

  updatePricingConfig: async (config: PricingConfig): Promise<void> => {
    writeCache(CACHE.PRICING_CONFIG, config);
    await awsPut(LAMBDA_ROUTES.RIDES_PRICING, config);
  },

  getActiveRides: (): RideOption[] => {
    const fleet   = omniApi.getFleetConfig();
    const pricing = omniApi.getPricingConfig();
    return fleet
      .filter(f => f.active)
      .map(ride => ({
        ...ride,
        price: parseFloat((pricing.baseFare + ride.price * pricing.demandMultiplier).toFixed(2)),
      }));
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Collection Account  →  DynamoDB: omniride-platform
  // ───────────────────────────────────────────────────────────────────────────
  getCollectionAccount: (): CollectionAccount =>
    JSON.parse(localStorage.getItem(CACHE.FINANCE_RESERVE) ?? 'null') ??
    { totalCollected: 0, heldInProcess: 0, lastReconciliation: 0 },

  _updateCollectionAccount: (amount: number, isEnteringProcess: boolean): void => {
    const acct = omniApi.getCollectionAccount();
    if (isEnteringProcess) {
      acct.heldInProcess += amount;
    } else {
      acct.heldInProcess  -= amount;
      acct.totalCollected += amount;
    }
    writeCache(CACHE.FINANCE_RESERVE, acct);
    // Fire-and-forget persist
    awsPatch(LAMBDA_ROUTES.COLLECTION_ACCOUNT, acct).catch(() => {/* offline */});
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Users  →  DynamoDB: omniride-users
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Upsert a user both locally AND in DynamoDB.
   * Called after every mutation (booking, top-up, profile edit…).
   */
  syncUser: (user: User): void => {
    // Local cache
    const users = readCache<User>(CACHE.USERS);
    const idx   = users.findIndex(u => u.id === user.id);
    const next  = idx > -1 ? users.map(u => u.id === user.id ? user : u) : [...users, user];
    writeCache(CACHE.USERS, next);

    // Update active session
    const session = localStorage.getItem('omniride_user');
    if (session) {
      try {
        const s = JSON.parse(session);
        if (s.id === user.id) localStorage.setItem('omniride_user', JSON.stringify(user));
      } catch { /* ignore */ }
    }

    // Remote persist (fire-and-forget, no blocking the UI)
    awsPut(LAMBDA_ROUTES.USERS_SYNC, user).catch(() => {/* offline — cache is source of truth */});
  },

  getPublicUser: (id: string): User | null => {
    return readCache<User>(CACHE.USERS).find(u => u.id === id) ?? null;
  },

  findBusinessByInviteId: (inviteId: string): User | null => {
    return readCache<User>(CACHE.USERS).find(u => u.role === 'business' && u.id === inviteId) ?? null;
  },

  getDedicatedRiders: (businessId: string): User[] => {
    return readCache<User>(CACHE.USERS).filter(
      u => u.role === 'rider' && u.riderProfile?.assignedBusinessId === businessId,
    );
  },

  updateBalance: async (userId: string, amount: number, isBusiness = false): Promise<boolean> => {
    const users   = readCache<User>(CACHE.USERS);
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) return false;

    const user = { ...users[userIdx] };
    if (isBusiness && user.businessProfile) {
      user.businessProfile = { ...user.businessProfile, walletBalance: user.businessProfile.walletBalance + amount };
    } else {
      user.walletBalance = (user.walletBalance ?? 0) + amount;
    }

    const tx: PaymentHistoryItem = {
      id: genId('TOP'), amount, currency: 'USD', status: 'successful',
      method: 'External', gateway: 'Visa/Mastercard',
      timestamp: Date.now(), description: 'Wallet Top-up',
      userType: user.role, direction: 'in',
    };
    writeCache(CACHE.TRANSACTIONS, [...readCache(CACHE.TRANSACTIONS), tx]);

    omniApi.syncUser(user);

    // Remote
    const { error } = await awsPatch(
      LAMBDA_ROUTES.USERS_UPDATE_BALANCE.replace(':id', userId),
      { amount, isBusiness },
    );
    return !error;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Rides  →  DynamoDB: omniride-trips
  // ───────────────────────────────────────────────────────────────────────────
  requestRide: async (ride: RideHistoryItem): Promise<User | null> => {
    // Optimistic: add trip to local cache immediately
    writeCache(CACHE.TRIPS, [...readCache(CACHE.TRIPS), ride]);

    const { data, error } = await awsPost<{ user: User }>(LAMBDA_ROUTES.RIDES_REQUEST, ride);

    if (error || !data?.user) {
      // Offline fallback: deduct locally
      const users   = readCache<User>(CACHE.USERS);
      const userIdx = users.findIndex(u => u.id === ride.customerId);
      if (userIdx > -1) {
        const user = { ...users[userIdx] };
        if (!user.employerId && user.role !== 'business') {
          user.walletBalance = Math.max(0, (user.walletBalance ?? 0) - ride.price);
          const tx: PaymentHistoryItem = {
            id: genId('TRP'), amount: ride.price, currency: 'USD',
            status: 'successful', method: 'OmniWallet', gateway: 'OmniWallet',
            timestamp: Date.now(), description: `Ride: ${ride.provider} ${ride.type}`,
            userType: user.role, direction: 'out',
          };
          writeCache(CACHE.TRANSACTIONS, [...readCache(CACHE.TRANSACTIONS), tx]);
        }
        omniApi.syncUser(user);
        omniApi._updateCollectionAccount(ride.price, true);
        return user;
      }
      return null;
    }

    omniApi.syncUser(data.user);
    return data.user;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Orders (Food + Delivery)  →  DynamoDB: omniride-orders
  // ───────────────────────────────────────────────────────────────────────────
  placeGlobalOrder: async (order: Order | DeliveryOrder): Promise<User | null> => {
    writeCache(CACHE.ORDERS, [...readCache(CACHE.ORDERS), order]);

    const { data, error } = await awsPost<{ user: User }>(LAMBDA_ROUTES.ORDERS_PLACE, order);

    if (error || !data?.user) {
      // Offline fallback
      const fee     = 'fee' in order ? order.fee : (order as Order).total;
      const users   = readCache<User>(CACHE.USERS);
      const userIdx = users.findIndex(u => u.id === order.customerId);
      if (userIdx > -1) {
        const user = { ...users[userIdx] };
        if (!user.employerId && user.role !== 'business') {
          user.walletBalance = Math.max(0, (user.walletBalance ?? 0) - fee);
          const tx: PaymentHistoryItem = {
            id: genId('ORD'), amount: fee, currency: 'USD',
            status: 'successful', method: 'OmniWallet', gateway: 'OmniWallet',
            timestamp: Date.now(),
            description: `Payment: ${'restaurantName' in order ? 'Food Order' : 'Logistics'}`,
            userType: user.role, direction: 'out',
          };
          writeCache(CACHE.TRANSACTIONS, [...readCache(CACHE.TRANSACTIONS), tx]);
        }
        omniApi.syncUser(user);
        omniApi._updateCollectionAccount(fee, true);
        return user;
      }
      return null;
    }

    omniApi.syncUser(data.user);
    return data.user;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, actor: User): Promise<boolean> => {
    const orders = readCache<any>(CACHE.ORDERS);
    const idx    = orders.findIndex((o: any) => o.id === orderId);
    if (idx === -1) return false;

    const prev = orders[idx];
    writeCache(CACHE.ORDERS, orders.map((o: any) => o.id === orderId ? { ...o, status } : o));

    if (status === 'delivered' && prev.status !== 'delivered') {
      const fee = 'fee' in prev ? prev.fee : prev.total;
      omniApi._updateCollectionAccount(fee, false);
    }

    const { error } = await awsPatch(
      LAMBDA_ROUTES.ORDERS_STATUS.replace(':id', orderId),
      { status, actorId: actor.id },
    );
    return !error;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Errand placeErrandOrder already handled above
  // ───────────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────────
  // Auth helpers
  // ───────────────────────────────────────────────────────────────────────────
  logout: (_userId: string, _userName: string): void => {
    tokenStore.clearTokens();
    localStorage.removeItem('omniride_user');
    window.location.reload();
  },

  generateMapLink: (address: string): string =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
};
