/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility Vendor Service  —  DynamoDB via API Gateway / Lambda
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Manages restaurant/vendor profiles, menus, and order history.
 * DynamoDB table: opusaimobility-users (vendors are User records with vendorProfile)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { VendorProfile, VendorStatus, User, Restaurant } from '../types';
import { awsGet, awsPatch } from './awsClient';
import { LAMBDA_ROUTES }    from './awsConfig';

const CACHE_KEY = 'opusaimobility-vendors';

// ── Seed records (displayed immediately while Lambda warms up) ────────────────
const SEED_VENDORS: VendorProfile[] = [
  {
    id:           'v_theory',
    businessName: 'Burger Theory',
    ownerName:    'Chef Ramsey',
    category:     'American • Burgers',
    address:      'City Center Hub, S1',
    phone:        '+1 555-FOOD',
    status:       'verified',
    joinedAt:     Date.now() - 31_536_000_000,
    mfaEnabled:   true,
    openingTime:  '10:00',
    closingTime:  '22:00',
    paymentModes: ['OmniWallet', 'Visa'],
    menu: [
      {
        id: 'm1', name: 'Theory Burger',
        description: 'Our signature grass-fed beef burger',
        price: 12.00, category: 'Main', prepTime: 15,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      },
    ],
    reviews:          [],
    securityPin:      '1234',
    lat:              1.290270,
    lng:              103.851959,
    servicesRendered: [
      { orderId: 'ORD-101', customerName: 'Alice W.', amount: 42.50, commission: 6.38, timestamp: Date.now() - 86_400_000, status: 'delivered' },
    ],
  },
  {
    id:           'v_zen',
    businessName: 'Sushi Zen',
    ownerName:    'Hiroshi Tanaka',
    category:     'Japanese • Sushi',
    address:      'East Pier Mall',
    phone:        '+1 555-ZEN',
    status:       'verified',
    joinedAt:     Date.now() - 15_768_000_000,
    mfaEnabled:   true,
    openingTime:  '11:00',
    closingTime:  '23:00',
    paymentModes: ['OmniWallet', 'Apple Pay'],
    menu: [],
    reviews:          [],
    securityPin:      '1234',
    lat:              1.300270,
    lng:              103.861959,
    servicesRendered: [],
  },
];

function readCache(): VendorProfile[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') ?? SEED_VENDORS; }
  catch { return SEED_VENDORS; }
}

export const vendorApi = {

  /**
   * Fetch all vendors.
   * Merges DynamoDB vendors + business-user restaurants.
   * Falls back to cache on network failure.
   */
  getVendors: async (): Promise<VendorProfile[]> => {
    const { data, error } = await awsGet<VendorProfile[]>(
      LAMBDA_ROUTES.VENDORS_LIST,
      CACHE_KEY,
    );

    let base: VendorProfile[];
    if (!error && data) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      base = data;
    } else {
      base = readCache();
    }

    // Merge with business-user restaurant nodes (local only — no extra call)
    const users: User[] = (() => {
      try { return JSON.parse(localStorage.getItem('opusaimobility-users') ?? '[]'); }
      catch { return []; }
    })();

    const bizVendors: VendorProfile[] = users
      .filter(u => u.role === 'business' && u.businessProfile?.restaurants?.length)
      .flatMap(u =>
        (u.businessProfile?.restaurants ?? []).map((r: Restaurant): VendorProfile => ({
          id:           r.id,
          businessName: r.name,
          ownerName:    u.name,
          category:     r.category,
          address:      r.lat ? `Grid: ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}` : 'Global Delivery',
          phone:        u.phone,
          status:       r.status,
          joinedAt:     u.joinedAt,
          mfaEnabled:   false,
          openingTime:  '08:00',
          closingTime:  '21:00',
          paymentModes: ['OmniWallet'],
          menu:         r.menu,
          reviews:      [],
          securityPin:  '0000',
          lat:          r.lat,
          lng:          r.lng,
          servicesRendered: [],
        })),
      );

    return [...base, ...bizVendors];
  },

  updateVendorStatus: async (id: string, status: VendorStatus): Promise<VendorProfile | undefined> => {
    // Optimistic local update
    const vendors = readCache().map(v => v.id === id ? { ...v, status } : v);
    localStorage.setItem(CACHE_KEY, JSON.stringify(vendors));

    // Remote
    const { data } = await awsPatch<VendorProfile>(
      LAMBDA_ROUTES.VENDORS_STATUS.replace(':id', id),
      { status },
    );

    return data ?? vendors.find(v => v.id === id);
  },

  /** Haversine great-circle distance in km. */
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;
    const R    = 6_371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  },

  getNearbyRestaurants: async (userLat: number, userLng: number): Promise<(VendorProfile & { distance: number })[]> => {
    const vendors = await vendorApi.getVendors();
    return vendors
      .filter(v => v.status === 'verified')
      .map(v => ({
        ...v,
        distance: vendorApi.calculateDistance(userLat, userLng, v.lat ?? 1.2879, v.lng ?? 103.8517),
      }))
      .sort((a, b) => a.distance - b.distance);
  },
};
