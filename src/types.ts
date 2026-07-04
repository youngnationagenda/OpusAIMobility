export type Provider = 'Uber' | 'Bolt' | 'Grab' | 'RoamAir' | 'YnaV1' | 'Ampersand' | 'Kiri EV' | 'Spiro' | 'BasiGo' | 'SolarTaxis';
export type AppMode = 'rides' | 'food' | 'activity' | 'mechanics' | 'delivery' | 'promos' | 'support' | 'notifications' | 'vendor' | 'rider' | 'admin' | 'business' | 'wallet' | 'errands' | 'performance' | 'job_tasks' | 'business_food_hub' | 'energy_hub';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'scheduled' | 'completed' | 'approved' | 'searching' | 'on_ride' | 'active';
export type ParcelCategory = 'Document' | 'Electronics' | 'Food' | 'Fragile' | 'Other';
export type ParcelSize = 'Small' | 'Medium' | 'Large';
export type Language = 'en' | 'es' | 'fr' | 'zh';
export type VendorStatus = 'unregistered' | 'pending' | 'verified' | 'suspended' | 'blacklisted' | 'rejected';
export type RiderGender = 'Male' | 'Female';
export type RiderActivityStatus = 'idle' | 'busy' | 'charging' | 'offline' | 'suspended';

export type BillingMode = 'pay_per_km' | 'dedicated_monthly';
export type PaymentGateway = 'M-Pesa Express' | 'Airtel Money' | 'T-Kash' | 'Stripe' | 'PayPal' | 'OmniWallet' | 'Bank Transfer' | 'Visa/Mastercard' | 'Cash';

export interface SwapStation {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  brand: Provider;
  lat: number;
  lng: number;
  availableSlots: number;
  totalSlots: number;
  isOpen: boolean;
  swapFee: number;
  revenue: number;
}

export interface StationOwnerProfile {
  stations: SwapStation[];
  totalSwaps: number;
  totalRevenue: number;
}

export interface BusinessProfile {
  companyName: string;
  billingMode: BillingMode;
  allocatedRiders: number;
  walletBalance: number;
  inProcessBalance: number; 
  subscriptionExpiry?: number;
  employees: EmployeeProfile[];
  dedicatedRiderList?: { id: string, name: string }[];
  restaurants?: Restaurant[];
  stationOwnerProfile?: StationOwnerProfile;
}

export type AdminRole = 'Super Admin' | 'Fleet Manager' | 'Vendor Liaison' | 'Support Lead' | 'Finance Admin';
export type Permission = 'fleet_read' | 'fleet_write' | 'vendor_read' | 'vendor_write' | 'finance_read' | 'payout_write' | 'audit_read' | 'rbac_write' | 'sys_config_write' | 'wallet_approval' | 'manage_collections';

export interface PlatformSettings {
  deductionTime: string; // e.g., "23:59"
  systemWeeklyFee: number;
  autoSettlementEnabled: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  category: 'rides' | 'food' | 'all' | 'errands';
  expiryDate: number;
  minSpend?: number;
}

export interface InventoryItem {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  category: 'Grocery' | 'Supermarket' | 'Pharmacy' | 'Other';
  price: number;
  unit: 'kg' | 'grams' | 'piece' | 'bunch' | 'litre' | 'packet' | 'tray';
  inStock: boolean;
}

export type ErrandPlan = 'Hourly' | 'Half Day' | 'Full Day';

export interface ErrandOrder {
  id: string;
  customerId: string;
  clientName?: string;
  plan: ErrandPlan;
  durationHours: number;
  type: 'Shopping' | 'Custom';
  status: OrderStatus;
  timestamp: number;
  riderId?: string;
  riderName?: string;
  baseFee: number;
  shoppingTotal: number;
  shoppingList: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    vendorId: string;
    vendorName: string;
  }[];
  customInstructions?: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  distance: number;
  availableSlots: number;
  totalSlots: number;
  type: 'Battery Swap' | 'Fast Charge';
  estTime: string;
  isOpen: boolean;
  lat: number;
  lng: number;
}

export interface TripInsight {
  title: string;
  description: string;
  estimatedTimeAddition: string;
}

export interface Mechanic {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: number;
  image: string;
  isOpen: boolean;
  phone: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'driver' | 'support' | 'admin';
  text: string;
  timestamp: number;
}

export interface WalletTransaction {
  id: string;
  type: 'earn' | 'trade' | 'spend' | 'topup';
  asset: 'CARBON' | 'OMNI' | 'USD';
  amount: number;
  counterValue?: number;
  status: 'confirmed' | 'pending' | 'successful' | 'failed' | 'awaiting_approval';
  timestamp: number;
  hash?: string;
  description?: string;
}

export interface BlockchainEvent {
  id: string;
  blockHeight: number;
  hash: string;
  eventType: 'CONTRACT_SEED' | 'TOKEN_MINT' | 'TRADE_EXECUTED';
  payload: any;
  timestamp: number;
  gasUsed: string;
}

export interface TelemetryData {
  batteryTemp: number;
  motorTemp: number;
  controllerTemp: number;
  cycleCount: number;
  healthPercentage: number;
  efficiencyWhKm: number;
  totalEnergyConsumed: number;
  brakeWearStatus: number; // 0-100
  swapCount: number;
  ecoScore: number; // 0-100
  lastSwapTimestamp: number;
}

export type DashboardType = 'User' | 'Embedded' | 'Custom';

export interface ReportWidget {
  id: string;
  title: string;
  visible: boolean;
  type: 'chart' | 'table';
}

export interface AdminInternalUser {
  id: string;
  name: string;
  role: string;
  permissions: Permission[];
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  totalSpent: number;
  activeTripId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'user' | 'rider' | 'vendor' | 'admin' | 'business';
  employerId?: string;
  status: 'active' | 'pending' | 'suspended' | 'lead';
  joinedAt: number;
  profilePicture?: string;
  rating: number;
  totalTrips: number;
  points: number;
  walletBalance: number;
  favorites: string[];
  language: Language;
  paymentMethods: PaymentMethod[];
  coupons: string[];
  vendorProfile?: VendorProfile;
  riderProfile?: RiderProfile;
  businessProfile?: BusinessProfile;
}

export interface DetailedDeliveryItem {
  id: string;
  description: string;
  category: ParcelCategory;
  weightKg: number;
  size: ParcelSize;
}

export interface DeliveryContact {
  name: string;
  phone: string;
  address: string;
  kycStatus: 'verified' | 'unverified';
  buildingInfo?: string;
}

export interface DeliveryOrder {
  id: string;
  customerId: string;
  type: 'send' | 'request';
  sender: DeliveryContact;
  receiver: DeliveryContact;
  description: string;
  items: DetailedDeliveryItem[];
  fee: number;
  status: OrderStatus;
  timestamp: number;
  scheduledTimestamp?: number;
  riderId?: string;
  riderName?: string;
  isDedicated?: boolean;
  allocatedRiderId?: string;
}

export interface CartItem { menuItemId: string; restaurantId: string; name: string; price: number; quantity: number; }
export interface Order { id: string; customerId: string; clientName?: string; restaurantId: string; restaurantName: string; restaurantImage: string; items: CartItem[]; subtotal: number; deliveryFee: number; total: number; status: OrderStatus; timestamp: number; rating?: number; discount?: number; navigationUrl?: string; riderId?: string; riderName?: string; prepStartTime?: number; }
export interface RideHistoryItem { 
  id: string; 
  customerId: string; 
  passengerName?: string; 
  provider: Provider; 
  type: string; 
  pickup: string; 
  destination: string; 
  price: number; 
  timestamp: number; 
  isScheduled?: boolean; 
  scheduledTimestamp?: number; 
  status?: OrderStatus; 
  navigationUrl?: string; 
  rating?: number; 
  distanceKm?: number;
  durationMinutes?: number;
}
export interface RideOption { id: string; provider: Provider; type: string; price: number; eta: number; capacity: number; icon: string; }
export interface BookingState { 
  pickup: { address: string; lat: number; lng: number } | null; 
  destination: { address: string; lat: number; lng: number } | null; 
  selectedRide: RideOption | null; 
  activeCoupon?: Coupon | null; 
  status: 'searching' | 'selecting' | 'comparing' | 'confirming' | 'on_ride' | 'completed' | 'scheduled'; 
  scheduledFor?: number | null; 
  comparisonRides?: RideOption[];
  calculatedDistanceKm?: number;
  calculatedDurationMinutes?: number;
}
export interface Notification { id: string; title: string; message: string; type: 'order' | 'rider' | 'admin' | 'promo' | 'system'; timestamp: number; read: boolean; }
export interface PaymentHistoryItem { id: string; amount: number; currency: string; status: 'successful' | 'pending' | 'failed' | 'awaiting_approval'; method: string; gateway: PaymentGateway; timestamp: number; description: string; userType: string; direction: 'in' | 'out'; reference?: string; }
export interface Restaurant { id: string; name: string; category: string; rating: number; reviewCount: number; priceLevel: number; windowMinutes?: number; deliveryFee: number; coverImage: string; lat: number; lng: number; status: VendorStatus; menu: MenuItem[]; deliveryTime: number; }

export interface MenuItem { id: string; name: string; description: string; price: number; category: string; prepTime: number; image: string; }
export interface VendorProfile { id: string; businessName: string; ownerName: string; category: string; address: string; phone: string; status: VendorStatus; joinedAt: number; mfaEnabled: boolean; openingTime: string; closingTime: string; paymentModes: string[]; menu: MenuItem[]; reviews: any[]; securityPin: string; lat?: number; lng?: number; servicesRendered: VendorServiceItem[]; }
export interface VendorServiceItem { orderId: string; customerName: string; amount: number; commission: number; timestamp: number; status: OrderStatus; }
export interface RiderJobHistoryItem { id: string; type: 'Ride' | 'Delivery' | 'Errand'; customerName: string; timestamp: number; price: number; status: OrderStatus; distanceKm: number; energyConsumedKwh: number; }
export interface CollectionAccount { totalCollected: number; heldInProcess: number; lastReconciliation: number; }
export interface AuditLog { id: string; userId: string; userName: string; action: string; target: string; timestamp: number; details: string; severity: 'low' | 'medium' | 'high'; }
export interface AuditTrailItem { timestamp: number; action: string; details: string; }
export interface PaymentMethod { id: string; type: 'visa' | 'mastercard' | 'mpesa' | 'paypal' | 'apple_pay'; last4?: string; expiry?: string; phone?: string; isDefault: boolean; }

export interface InsuranceLoan { 
  id: string; 
  type: 'Comprehensive' | 'Third Party';
  totalAmount: number; 
  dailyRepayment: number; 
  monthlyRepayment: number;
  remainingBalance: number; 
  startDate: number; 
  months: number; 
  interestRate: number; 
  autoRenew: boolean;
}

export interface AssetLoan {
  id: string;
  principal: number;
  totalAmount: number;
  monthlyRepayment: number;
  dailyRepayment: number;
  remainingBalance: number;
  interestRate: number;
  months: number;
  startDate: number;
}

export interface LeaderboardRank {
  rank: number;
  name: string;
  rides: number;
  distanceKm: number;
  energySavedKwh: number;
  rating: number;
  earnings: number;
  isCorporatePartner?: boolean;
}

export interface RiderProfile {
  id: string;
  name: string;
  gender: RiderGender;
  vehicleModel: string;
  vehicleRegNo: string;
  batteryStatus: number;
  isVerified: boolean;
  totalEarnings: number;
  rating: number;
  online: boolean;
  activityStatus: RiderActivityStatus;
  carbonBalance: number;
  walletAddress?: string;
  assignedBusinessId?: string;
  insuranceExpiryDate?: number;
  activeInsuranceLoan?: InsuranceLoan;
  activeAssetLoan?: AssetLoan;
  profilePicture?: string;
  transactionHistory: WalletTransaction[];
  telemetry: TelemetryData;
  analytics: any;
  jobHistory: RiderJobHistoryItem[];
  settings: {
    notificationsEnabled: boolean;
  };
  dailyTargetEarnings?: number;
  dailyTargetDistance?: number;
  weeklyTargetEarnings?: number;
  corporateReferrals?: number;
  currentRank?: number;
}