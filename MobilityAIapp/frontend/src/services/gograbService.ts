/**
 * GoGrab API Service — Frontend Integration
 *
 * Bridges the migrated GoGrab PHP/MySQL backend (now DynamoDB + Lambda)
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
export interface GoGrabUser {
  id: string; email: string; phone: string;
  firstName: string; lastName: string; fullName: string;
  role: string; opusRole: string; authToken: string;
  wallet: number; active: number; image: string;
  deviceToken: string; createdAt: string;
}

export const ggRegister = (p: {
  email?: string; phone?: string; firstName?: string; lastName?: string;
  role?: string; password?: string; socialId?: string; social?: string;
  deviceToken?: string; countryId?: number;
}) => post<GoGrabUser>('/api/register', p);

export const ggLogin = (p: {
  email?: string; phone?: string; password?: string; deviceToken?: string;
}) => post<GoGrabUser>('/api/login', p);

export const ggGetUser = (id: string) => get<GoGrabUser>(`/api/user/${id}`);

export const ggUpdateProfile = (id: string, data: Partial<GoGrabUser>) =>
  post<GoGrabUser>('/api/update_profile', { userId: id, ...data });

// ── Restaurants ───────────────────────────────────────────────────────────────
export interface GoGrabRestaurant {
  id: string; name: string; lat: string; long: string;
  locationString: string; image: string;
  minOrderPrice: number; deliveryFee: number;
  deliveryMinTime: number; deliveryMaxTime: number;
  taxFree: number; block: number; adminCommission: number; view: number;
  menus?: GoGrabMenu[];
}

export interface GoGrabMenu {
  id: string; name: string; description: string;
  restaurantId: string; image: string; active: number;
  items?: GoGrabMenuItem[];
}

export interface GoGrabMenuItem {
  id: string; menuId: string; name: string;
  description: string; price: number; image: string; active: number;
}

export const ggListRestaurants = () => get<GoGrabRestaurant[]>('/api/restaurants');
export const ggGetRestaurant   = (id: string) => get<GoGrabRestaurant>(`/api/restaurant/${id}`);
export const ggGetMenu         = (restaurantId: string) => get<GoGrabMenu[]>('/api/restaurantMenu', { restaurantId });
export const ggCreateRestaurant = (data: Partial<GoGrabRestaurant>) => post<GoGrabRestaurant>('/api/restaurants', data);

// ── Food Orders ───────────────────────────────────────────────────────────────
export interface GoGrabFoodOrder {
  id: string; userId: string; restaurantId: string;
  price: number; subTotal: number; tax: number; deliveryFee: number;
  status: number; statusDatetime: string;
  delivery: number; instructions: string; createdAt: string;
}

export const ggPlaceFoodOrder  = (data: Partial<GoGrabFoodOrder>) => post<GoGrabFoodOrder>('/api/place_food_order', data);
export const ggGetFoodOrders   = (userId: string) => get<GoGrabFoodOrder[]>('/api/food_orders', { userId });
export const ggUpdateFoodOrder = (orderId: string, status: number) => post('/api/food_order_status', { orderId, status });

// ── Parcel Orders ─────────────────────────────────────────────────────────────
export interface GoGrabParcelOrder {
  id: string; userId: string; packageSizeId: string; goodTypeId: string;
  senderName: string; senderPhone: string; receiverName: string; receiverPhone: string;
  senderLocationLat: string; senderLocationLong: string;
  receiverLocationLat: string; receiverLocationLong: string;
  total: number; status: number; createdAt: string;
}

export const ggPlaceParcel    = (data: Partial<GoGrabParcelOrder>) => post<GoGrabParcelOrder>('/api/place_parcel_order', data);
export const ggGetParcelOrders = (userId: string) => get<GoGrabParcelOrder[]>('/api/parcel_orders', { userId });

// ── Rides ─────────────────────────────────────────────────────────────────────
export interface GoGrabRequest {
  id: string; userId: string; vehicleId: string; driverId: string;
  pickupLat: string; pickupLong: string; dropoffLat: string; dropoffLong: string;
  pickupLocation: string; dropoffLocation: string;
  request: number; status: number; paymentType: string;
  estimatedFare: number; createdAt: string;
}

export const ggCreateRequest  = (data: Partial<GoGrabRequest>) => post<GoGrabRequest>('/api/create_request', data);
export const ggGetRequests    = (userId: string) => get<GoGrabRequest[]>('/api/ride_requests', { userId });
export const ggCreateTrip     = (data: object) => post('/api/create_trip', data);
export const ggGetTrips       = (userId: string, role?: string) => get('/api/trips', { userId, ...(role && { role }) });

// ── Catalogue ─────────────────────────────────────────────────────────────────
export interface GoGrabFoodCategory { id: string; title: string; image: string; icon: string; }
export interface GoGrabPackageSize  { id: string; title: string; description: string; image: string; price: number; }
export interface GoGrabGoodType     { id: string; name: string; }
export interface GoGrabVehicleType  { id: string; title: string; description: string; perKmMileCharge: number; image: string; }
export interface GoGrabCoupon       { id: string; couponCode: string; discount: number; expiryDate: string; type: string; }

export const ggGetFoodCategories = () => get<GoGrabFoodCategory[]>('/api/food_categories');
export const ggGetPackageSizes   = () => get<GoGrabPackageSize[]>('/api/package_sizes');
export const ggGetGoodTypes      = () => get<GoGrabGoodType[]>('/api/good_types');
export const ggGetVehicleTypes   = () => get<GoGrabVehicleType[]>('/api/vehicle_types');
export const ggValidateCoupon    = (couponCode: string) => post<GoGrabCoupon>('/api/validate_coupon', { couponCode });
export const ggGetServiceCharges = () => get('/api/service_charges');

// ── Notifications ─────────────────────────────────────────────────────────────
export interface GoGrabNotification { id: string; receiverId: string; title: string; description: string; type: string; createdAt: string; }
export const ggGetNotifications = (userId: string) => get<GoGrabNotification[]>('/api/notifications', { userId });
export const ggSendNotification = (data: Partial<GoGrabNotification>) => post('/api/notifications', data);

// ── Ratings ───────────────────────────────────────────────────────────────────
export const ggRateDriver = (data: { tripId: string; driverId: string; userId: string; star: number; comment?: string }) =>
  post('/api/rate_driver', data);

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const ggCreateVehicle = (data: object) => post('/api/vehicles', data);
export const ggGetVehicles   = (userId: string) => get('/api/vehicles', { userId });

// ── Content ───────────────────────────────────────────────────────────────────
export const ggGetHtmlPage = (name: 'privacyPolicy' | 'termsConditions' | 'privacy_policy') =>
  get('/api/html_page', { name });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const ggAdminStats = () => get<{
  totalUsers: number; totalRestaurants: number; totalFoodOrders: number;
  totalParcelOrders: number; totalTrips: number; activeRiders: number;
  pendingFoodOrders: number; completedTrips: number; totalRevenue: number;
}>('/admin/stats');

export const ggAdminUsers            = () => get<GoGrabUser[]>('/admin/users');
export const ggAdminBlockUser        = (id: string, block: boolean) => post(`/admin/user/${id}/block`, { block });
export const ggAdminRestaurants      = () => get<GoGrabRestaurant[]>('/admin/restaurants');
export const ggAdminBlockRestaurant  = (id: string, block: boolean) => post(`/admin/restaurant/${id}/block`, { block });
export const ggAdminFoodOrders       = () => get<GoGrabFoodOrder[]>('/admin/food_orders');
export const ggAdminParcelOrders     = () => get<GoGrabParcelOrder[]>('/admin/parcel_orders');
export const ggAdminTrips            = () => get('/admin/trips');
export const ggAdminWithdraws        = () => get('/admin/withdraw_requests');
export const ggAdminApproveWithdraw  = (id: string, approve: boolean) => post(`/admin/withdraw/${id}`, { approve });

export default {
  register: ggRegister, login: ggLogin, getUser: ggGetUser, updateProfile: ggUpdateProfile,
  listRestaurants: ggListRestaurants, getRestaurant: ggGetRestaurant, getMenu: ggGetMenu,
  placeFoodOrder: ggPlaceFoodOrder, getFoodOrders: ggGetFoodOrders, updateFoodOrder: ggUpdateFoodOrder,
  placeParcel: ggPlaceParcel, getParcelOrders: ggGetParcelOrders,
  createRequest: ggCreateRequest, getRequests: ggGetRequests, createTrip: ggCreateTrip, getTrips: ggGetTrips,
  getFoodCategories: ggGetFoodCategories, getPackageSizes: ggGetPackageSizes,
  getGoodTypes: ggGetGoodTypes, getVehicleTypes: ggGetVehicleTypes,
  validateCoupon: ggValidateCoupon, getServiceCharges: ggGetServiceCharges,
  getNotifications: ggGetNotifications, sendNotification: ggSendNotification,
  rateDriver: ggRateDriver, createVehicle: ggCreateVehicle, getVehicles: ggGetVehicles,
  getHtmlPage: ggGetHtmlPage,
  admin: { stats: ggAdminStats, users: ggAdminUsers, blockUser: ggAdminBlockUser,
    restaurants: ggAdminRestaurants, blockRestaurant: ggAdminBlockRestaurant,
    foodOrders: ggAdminFoodOrders, parcelOrders: ggAdminParcelOrders,
    trips: ggAdminTrips, withdraws: ggAdminWithdraws, approveWithdraw: ggAdminApproveWithdraw }
};
