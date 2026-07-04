import { RideOption, Restaurant, Order, RideHistoryItem, PaymentHistoryItem, Coupon, ChargingStation, Mechanic, InventoryItem } from './types';

export const MOCK_CHARGING_STATIONS: ChargingStation[] = [
  { id: 'cs1', name: 'Ampersand Hub Central', address: '4th Avenue, City Center', distance: 0.8, availableSlots: 12, totalSlots: 15, type: 'Battery Swap', estTime: '< 2 mins', isOpen: true, lat: 1.290270, lng: 103.851959 },
  { id: 'cs2', name: 'Roam Energy Fast Point', address: 'Westlands Mall B2', distance: 2.1, availableSlots: 4, totalSlots: 8, type: 'Fast Charge', estTime: '45 mins', isOpen: true, lat: 1.300270, lng: 103.861959 },
];

export const MOCK_RIDE_OPTIONS: RideOption[] = [
  { id: 'u1', provider: 'Uber', type: 'Uber Electric', price: 12.50, eta: 4, capacity: 4, icon: '🚗' },
  { id: 'bo1', provider: 'Bolt', type: 'Bolt Green', price: 11.20, eta: 5, capacity: 4, icon: '🟢' },
  { id: 'gr1', provider: 'Grab', type: 'GrabEV', price: 13.00, eta: 3, capacity: 4, icon: '💚' },
  { id: 'r1', provider: 'RoamAir', type: 'Air One', price: 11.50, eta: 3, capacity: 4, icon: '🕊️' },
  { id: 'y1', provider: 'YnaV1', type: 'City Glide', price: 10.20, eta: 4, capacity: 4, icon: '🚲' },
  { id: 'a1', provider: 'Ampersand', type: 'Volt Moto', price: 6.80, eta: 2, capacity: 1, icon: '🏍️' },
  { id: 'k1', provider: 'Kiri EV', type: 'Kiri Classic', price: 11.80, eta: 4, capacity: 4, icon: '🔌' },
  { id: 's1', provider: 'Spiro', type: 'Spiro Commute', price: 7.20, eta: 3, capacity: 2, icon: '🔋' },
  { id: 'b1', provider: 'BasiGo', type: 'BasiGo Express', price: 15.50, eta: 8, capacity: 22, icon: '🚌' },
  { id: 'st1', provider: 'SolarTaxis', type: 'Solar Sedan', price: 12.40, eta: 5, capacity: 4, icon: '☀️' },
];

export const MOCK_COUPONS: Coupon[] = [
  { id: 'cp1', code: 'OMNI_SAVE', description: '50% off any EV ride source', discountType: 'percentage', value: 50, category: 'rides', expiryDate: Date.now() + 604800000 },
];

export const MOCK_RIDE_HISTORY: RideHistoryItem[] = [
  { id: 'TRP-90210', customerId: 'usr_guest', provider: 'RoamAir', type: 'Air One', pickup: 'Central Park West', destination: 'Times Square', price: 11.40, timestamp: Date.now() - 172800000, rating: 5 },
];

export const MOCK_ERRAND_INVENTORY: InventoryItem[] = [
  // Greenway Grocers
  { id: 'i1', vendorId: 'v_greenway', vendorName: 'Greenway Grocers', name: 'Organic Tomatoes', category: 'Grocery', price: 2.50, unit: 'kg', inStock: true },
  { id: 'i2', vendorId: 'v_greenway', vendorName: 'Greenway Grocers', name: 'Red Onions', category: 'Grocery', price: 1.20, unit: 'kg', inStock: true },
  { id: 'i3', vendorId: 'v_greenway', vendorName: 'Greenway Grocers', name: 'Fresh Spinach', category: 'Grocery', price: 0.80, unit: 'bunch', inStock: true },
  { id: 'i4', vendorId: 'v_greenway', vendorName: 'Greenway Grocers', name: 'Avocado (Large)', category: 'Grocery', price: 1.50, unit: 'piece', inStock: true },
  { id: 'i5', vendorId: 'v_greenway', vendorName: 'Greenway Grocers', name: 'Banana Cluster', category: 'Grocery', price: 2.00, unit: 'bunch', inStock: true },
  
  // SuperMart Prime
  { id: 'i6', vendorId: 'v_supermart', vendorName: 'SuperMart Prime', name: 'Basmati Rice 5kg', category: 'Supermarket', price: 12.00, unit: 'packet', inStock: true },
  { id: 'i7', vendorId: 'v_supermart', vendorName: 'SuperMart Prime', name: 'Cooking Oil 2L', category: 'Supermarket', price: 5.50, unit: 'litre', inStock: true },
  { id: 'i8', vendorId: 'v_supermart', vendorName: 'SuperMart Prime', name: 'Detergent Powder', category: 'Supermarket', price: 8.90, unit: 'packet', inStock: true },
  { id: 'i9', vendorId: 'v_supermart', vendorName: 'SuperMart Prime', name: 'Milk (Fresh)', category: 'Supermarket', price: 1.10, unit: 'litre', inStock: true },
  { id: 'i10', vendorId: 'v_supermart', vendorName: 'SuperMart Prime', name: 'Whole Wheat Bread', category: 'Supermarket', price: 1.50, unit: 'piece', inStock: true },
  { id: 'i11', vendorId: 'v_supermart', vendorName: 'SuperMart Prime', name: 'Eggs (30 Pack)', category: 'Supermarket', price: 4.50, unit: 'tray', inStock: true },

  // Fresh Catch Deli
  { id: 'i12', vendorId: 'v_freshcatch', vendorName: 'Fresh Catch Deli', name: 'Chicken Breast', category: 'Grocery', price: 6.50, unit: 'kg', inStock: true },
  { id: 'i13', vendorId: 'v_freshcatch', vendorName: 'Fresh Catch Deli', name: 'Beef Mince', category: 'Grocery', price: 8.00, unit: 'kg', inStock: true },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-777',
    customerId: 'usr_guest',
    restaurantId: 'v_theory',
    restaurantName: 'Burger Theory',
    restaurantImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop',
    items: [{ menuItemId: 'm1', restaurantId: 'v_theory', name: 'Theory Burger', price: 12.00, quantity: 2 }],
    subtotal: 24.00,
    deliveryFee: 2.99,
    total: 26.99,
    status: 'delivered',
    timestamp: Date.now() - 3600000
  }
];

export const MOCK_MECHANICS: Mechanic[] = [
  { id: 'm1', name: 'Speedy EV Repairs', specialty: 'Motor & Battery', rating: 4.8, distance: 1.2, image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=400', isOpen: true, phone: '+254700000001' },
  { id: 'm2', name: 'Legacy Auto Care', specialty: 'General Engine', rating: 4.5, distance: 3.4, image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400', isOpen: false, phone: '+254700000002' }
];