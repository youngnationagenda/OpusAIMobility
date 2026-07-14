/**
 * OpusAIMobility API Service — Frontend Integration
 *
 * Bridges the migrated legacy PHP/MySQL backend (now DynamoDB + Lambda)
 * with the OpusAIMobility React frontend.
 *
 * Original: CakePHP mobileapp_api → PHP MVC → MySQL (gograb.sql)
 * Current:  Lambda (gograb-handler.js) → DynamoDB (23 tables)
 */

const BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
const GG   = BASE + '/gograb';

async function post<T>(path: string, body: object): Promise<T> {
  const r = await fetch(GG + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const j = await r.json();
  return j.msg ?? j;
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(GG + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  const j = await r.json();
  return j.msg ?? j;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface OpusAIUser {
  id: string; email: string; phone: string;
  firstName: string; lastName: string; fullName: string;
  role: string; opusRole: string; authToken: string;
  wallet: number; active: number; image: string;
  deviceToken: string; createdAt: string;
}

export const oaRegister = (p: {
  email?: string; phone?: string; firstName?: string; lastName?: string;
  role?: string; password?: string; socialId?: string; social?: string;
  deviceToken?: string; countryId?: number;
}) => post<OpusAIUser>('/api/register', p);

export const oaLogin = (p: {
  email?: string; phone?: string; password?: string; deviceToken?: string;
}) => post<OpusAIUser>('/api/login', p);

export const oaGetUser = (id: string) => get<OpusAIUser>(`/api/user/${id}`);

export const oaUpdateProfile = (id: string, data: Partial<OpusAIUser>) =>
  post<OpusAIUser>('/api/update_profile', { userId: id, ...data });

// ── Restaurants ───────────────────────────────────────────────────────────────
export interface OpusAIRestaurant {
  id: string; name: string; lat: string; long: string;
  locationString: string; image: string;
  minOrderPrice: number; deliveryFee: number;
  deliveryMinTime: number; deliveryMaxTime: number;
  taxFree: number; block: number; adminCommission: number; view: number;
  menus?: OpusAIMenu[];
}

export interface OpusAIMenu {
  id: string; name: string; description: string;
  restaurantId: string; image: string; active: number;
  items?: OpusAIMenuItem[];
}

export interface OpusAIMenuItem {
  id: string; menuId: string; name: string;
  description: string; price: number; image: string; active: number;
}

export const oaListRestaurants  = () => get<OpusAIRestaurant[]>('/api/restaurants');
export const oaGetRestaurant    = (id: string) => get<OpusAIRestaurant>(`/api/restaurant/${id}`);
export const oaGetMenu          = (restaurantId: string) => get<OpusAIMenu[]>('/api/restaurantMenu', { restaurantId });
export const oaCreateRestaurant = (data: Partial<OpusAIRestaurant>) => post<OpusAIRestaurant>('/api/restaurants', data);

// ── Food Orders ───────────────────────────────────────────────────────────────
export interface OpusAIFoodOrder {
  id: string; userId: string; restaurantId: string;
  price: number; subTotal: number; tax: number; deliveryFee: number;
  status: number; statusDatetime: string;
  delivery: number; instructions: string; createdAt: string;
}

export const oaPlaceFoodOrder  = (data: Partial<OpusAIFoodOrder>) => post<OpusAIFoodOrder>('/api/place_food_order', data);
export const oaGetFoodOrders   = (userId: string) => get<OpusAIFoodOrder[]>('/api/food_orders', { userId });
export const oaUpdateFoodOrder = (orderId: string, status: number) => post('/api/food_order_status', { orderId, status });

// ── Parcel Orders ─────────────────────────────────────────────────────────────
export interface OpusAIParcelOrder {
  id: string; userId: string; packageSizeId: string; goodTypeId: string;
  senderName: string; senderPhone: string; receiverName: string; receiverPhone: string;
  senderLocationLat: string; senderLocationLong: string;
  receiverLocationLat: string; receiverLocationLong: string;
  total: number; status: number; createdAt: string;
}

export const oaPlaceParcel     = (data: Partial<OpusAIParcelOrder>) => post<OpusAIParcelOrder>('/api/place_parcel_order', data);
export const oaGetParcelOrders = (userId: string) => get<OpusAIParcelOrder[]>('/api/parcel_orders', { userId });

// ── Rides ─────────────────────────────────────────────────────────────────────
export interface OpusAIRequest {
  id: string; userId: string; vehicleId: string; driverId: string;
  pickupLat: string; pickupLong: string; dropoffLat: string; dropoffLong: string;
  pickupLocation: string; dropoffLocation: string;
  request: number; status: number; paymentType: string;
  estimatedFare: number; createdAt: string;
}

export const oaCreateRequest = (data: Partial<OpusAIRequest>) => post<OpusAIRequest>('/api/create_request', data);
export const oaGetRequests   = (userId: string) => get<OpusAIRequest[]>('/api/ride_requests', { userId });
export const oaCreateTrip    = (data: object) => post('/api/create_trip', data);
export const oaGetTrips      = (userId: string, role?: string) => get('/api/trips', { userId, ...(role && { role }) });

// ── Catalogue ─────────────────────────────────────────────────────────────────
export interface OpusAIFoodCategory { id: string; title: string; image: string; icon: string; }
export interface OpusAIPackageSize  { id: string; title: string; description: string; image: string; price: number; }
export interface OpusAIGoodType     { id: string; name: string; }
export interface OpusAIVehicleType  { id: string; title: string; description: string; perKmMileCharge: number; image: string; }
export interface OpusAICoupon       { id: string; couponCode: string; discount: number; expiryDate: string; type: string; }

export const oaGetFoodCategories = () => get<OpusAIFoodCategory[]>('/api/food_categories');
export const oaGetPackageSizes   = () => get<OpusAIPackageSize[]>('/api/package_sizes');
export const oaGetGoodTypes      = () => get<OpusAIGoodType[]>('/api/good_types');
export const oaGetVehicleTypes   = () => get<OpusAIVehicleType[]>('/api/vehicle_types');
export const oaValidateCoupon    = (couponCode: string) => post<OpusAICoupon>('/api/validate_coupon', { couponCode });
export const oaGetServiceCharges = () => get('/api/service_charges');

// ── Notifications ─────────────────────────────────────────────────────────────
export interface OpusAINotification { id: string; receiverId: string; title: string; description: string; type: string; createdAt: string; }
export const oaGetNotifications = (userId: string) => get<OpusAINotification[]>('/api/notifications', { userId });
export const oaSendNotification = (data: Partial<OpusAINotification>) => post('/api/notifications', data);

// ── Ratings ───────────────────────────────────────────────────────────────────
export const oaRateDriver = (data: { tripId: string; driverId: string; userId: string; star: number; comment?: string }) =>
  post('/api/rate_driver', data);

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const oaCreateVehicle = (data: object) => post('/api/vehicles', data);
export const oaGetVehicles   = (userId: string) => get('/api/vehicles', { userId });

// ── Content ───────────────────────────────────────────────────────────────────
export const oaGetHtmlPage = (name: 'privacyPolicy' | 'termsConditions' | 'privacy_policy') =>
  get('/api/html_page', { name });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const oaAdminStats = () => get<{
  totalUsers: number; totalRestaurants: number; totalFoodOrders: number;
  totalParcelOrders: number; totalTrips: number; activeRiders: number;
  pendingFoodOrders: number; completedTrips: number; totalRevenue: number;
}>('/admin/stats');

export const oaAdminUsers            = () => get<OpusAIUser[]>('/admin/users');
export const oaAdminBlockUser        = (id: string, block: boolean) => post(`/admin/user/${id}/block`, { block });
export const oaAdminRestaurants      = () => get<OpusAIRestaurant[]>('/admin/restaurants');
export const oaAdminBlockRestaurant  = (id: string, block: boolean) => post(`/admin/restaurant/${id}/block`, { block });
export const oaAdminFoodOrders       = () => get<OpusAIFoodOrder[]>('/admin/food_orders');
export const oaAdminParcelOrders     = () => get<OpusAIParcelOrder[]>('/admin/parcel_orders');
export const oaAdminTrips            = () => get('/admin/trips');
export const oaAdminWithdraws        = () => get('/admin/withdraw_requests');
export const oaAdminApproveWithdraw  = (id: string, approve: boolean) => post(`/admin/withdraw/${id}`, { approve });

// ── Backward-compat aliases (GoGrab prefix → oa prefix) ─────────────────────
/** @deprecated use oaRegister */
export const ggRegister           = oaRegister;
/** @deprecated use oaLogin */
export const ggLogin              = oaLogin;
/** @deprecated use oaGetUser */
export const ggGetUser            = oaGetUser;
/** @deprecated use oaUpdateProfile */
export const ggUpdateProfile      = oaUpdateProfile;
/** @deprecated use oaListRestaurants */
export const ggListRestaurants    = oaListRestaurants;
/** @deprecated use oaGetRestaurant */
export const ggGetRestaurant      = oaGetRestaurant;
/** @deprecated use oaGetMenu */
export const ggGetMenu            = oaGetMenu;
/** @deprecated use oaPlaceFoodOrder */
export const ggPlaceFoodOrder     = oaPlaceFoodOrder;
/** @deprecated use oaGetFoodOrders */
export const ggGetFoodOrders      = oaGetFoodOrders;
/** @deprecated use oaUpdateFoodOrder */
export const ggUpdateFoodOrder    = oaUpdateFoodOrder;

// Re-export GoGrab types under their new names for backward compat
/** @deprecated use OpusAIUser */
export type GoGrabUser         = OpusAIUser;
/** @deprecated use OpusAIRestaurant */
export type GoGrabRestaurant   = OpusAIRestaurant;
/** @deprecated use OpusAIMenu */
export type GoGrabMenu         = OpusAIMenu;
/** @deprecated use OpusAIMenuItem */
export type GoGrabMenuItem     = OpusAIMenuItem;
/** @deprecated use OpusAIFoodOrder */
export type GoGrabFoodOrder    = OpusAIFoodOrder;
/** @deprecated use OpusAIParcelOrder */
export type GoGrabParcelOrder  = OpusAIParcelOrder;
/** @deprecated use OpusAIRequest */
export type GoGrabRequest      = OpusAIRequest;
/** @deprecated use OpusAINotification */
export type GoGrabNotification = OpusAINotification;
/** @deprecated use OpusAIFoodCategory */
export type GoGrabFoodCategory = OpusAIFoodCategory;
/** @deprecated use OpusAIPackageSize */
export type GoGrabPackageSize  = OpusAIPackageSize;
/** @deprecated use OpusAIGoodType */
export type GoGrabGoodType     = OpusAIGoodType;
/** @deprecated use OpusAIVehicleType */
export type GoGrabVehicleType  = OpusAIVehicleType;
/** @deprecated use OpusAICoupon */
export type GoGrabCoupon       = OpusAICoupon;

export default {
  register: oaRegister, login: oaLogin, getUser: oaGetUser, updateProfile: oaUpdateProfile,
  listRestaurants: oaListRestaurants, getRestaurant: oaGetRestaurant, getMenu: oaGetMenu,
  placeFoodOrder: oaPlaceFoodOrder, getFoodOrders: oaGetFoodOrders, updateFoodOrder: oaUpdateFoodOrder,
  placeParcel: oaPlaceParcel, getParcelOrders: oaGetParcelOrders,
  createRequest: oaCreateRequest, getRequests: oaGetRequests, createTrip: oaCreateTrip, getTrips: oaGetTrips,
  getFoodCategories: oaGetFoodCategories, getPackageSizes: oaGetPackageSizes,
  getGoodTypes: oaGetGoodTypes, getVehicleTypes: oaGetVehicleTypes,
  validateCoupon: oaValidateCoupon, getServiceCharges: oaGetServiceCharges,
  getNotifications: oaGetNotifications, sendNotification: oaSendNotification,
  rateDriver: oaRateDriver, createVehicle: oaCreateVehicle, getVehicles: oaGetVehicles,
  getHtmlPage: oaGetHtmlPage,
  admin: {
    stats: oaAdminStats, users: oaAdminUsers, blockUser: oaAdminBlockUser,
    restaurants: oaAdminRestaurants, blockRestaurant: oaAdminBlockRestaurant,
    foodOrders: oaAdminFoodOrders, parcelOrders: oaAdminParcelOrders,
    trips: oaAdminTrips, withdraws: oaAdminWithdraws, approveWithdraw: oaAdminApproveWithdraw,
  },
};
