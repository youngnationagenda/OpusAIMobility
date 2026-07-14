
import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapView from './components/MapView';
import RideSelector from './components/RideSelector';
import RideComparison from './components/RideComparison';
import AuthScreen from './components/AuthScreen';
import ProfileEditor from './components/ProfileEditor';
import FoodDashboard from './components/FoodDashboard';
import RestaurantMenu from './components/RestaurantMenu';
import OrderHistory from './components/OrderHistory';
import DeliveryDashboard from './components/DeliveryDashboard';
import DeliveryTracking from './components/DeliveryTracking';
import SupportCenter from './components/SupportCenter';
import NotificationOverlay, { NotificationType } from './components/NotificationOverlay';
import NotificationTray from './components/NotificationTray';
import VendorPortal from './components/VendorPortal';
import RiderPortal from './components/RiderPortal';
import BusinessPortal from './components/BusinessPortal';
import BookingCheckout from './components/BookingCheckout';
import UserWallet from './components/UserWallet';
import ErrandPortal from './components/ErrandPortal';
import RiderDashboardAnalytics from './components/RiderDashboardAnalytics';
import RiderWalletHub from './components/RiderWalletHub';
import RiderJobTasks from './components/RiderJobTasks';
import AdminInterface from './components/AdminInterface';
import EnergyPortal from './components/EnergyPortal';
import { BookingState, Location, User as UserProfile, AppMode, Restaurant, CartItem, Order, DeliveryOrder, Notification, RiderProfile, RideOption, RideHistoryItem, ErrandOrder } from './types';
import { omniApi } from './services/api';
import { searchLocations, calculateRoadDistance } from './services/geminiService';
import { MOCK_ORDERS, MOCK_RIDE_HISTORY } from './constants';
import { t } from './services/i18n';
import { notificationService, PushNotification } from './services/notificationService';
import { Navigation, History, Settings, ChevronLeft, LogOut, Bike, Package, Bell, ShieldAlert, Building2, Clock, ShieldCheck, RefreshCw, Smartphone, X, Utensils, Wallet, ListChecks, Search, MapPin, Loader2, Zap, Activity, BarChart3, Store, ShoppingBag } from 'lucide-react';
import OpusAIAdminPanel from './components/OpusAIAdminPanel';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('opusaimobility_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [mode, setMode] = useState<AppMode>(user?.role === 'rider' ? 'rider' : 'rides');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<DeliveryOrder | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationTray, setShowNotificationTray] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ message: string; title?: string; type: NotificationType } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showOpusAIAdmin, setShowOpusAIAdmin] = useState(false);
  
  const [booking, setBooking] = useState<BookingState>({
    pickup: { address: "Current Location", lat: 1.2879, lng: 103.8517 },
    destination: null,
    selectedRide: null,
    activeCoupon: null,
    status: 'searching',
    scheduledFor: null,
    comparisonRides: []
  });

  // Location Autocomplete States
  const [pickupInput, setPickupInput] = useState(booking.pickup?.address || '');
  const [destInput, setDestInput] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [activeSearch, setActiveSearch] = useState<'pickup' | 'destination' | null>(null);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    omniApi.initStore();
  }, []);

  useEffect(() => {
    if (!user) return;
    const poll = setInterval(() => {
      const latest = omniApi.getPublicUser(user.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(user)) {
        setUser(latest);
      }
    }, 4000);
    return () => clearInterval(poll);
  }, [user]);

  useEffect(() => {
    if (user) {
      omniApi.syncUser(user);
    } else {
      localStorage.removeItem('opusaimobility_user');
    }
  }, [user]);

  // AI Route Calculation Trigger
  useEffect(() => {
    if (booking.pickup && booking.destination && booking.status === 'selecting') {
       const runCalc = async () => {
          setIsCalculatingRoute(true);
          const result = await calculateRoadDistance(booking.pickup!.address, booking.destination!.address);
          setBooking(prev => ({ 
            ...prev, 
            calculatedDistanceKm: result.distanceKm, 
            calculatedDurationMinutes: result.durationMinutes 
          }));
          setIsCalculatingRoute(false);
       };
       runCalc();
    }
  }, [booking.pickup?.address, booking.destination?.address]);

  const handleLocationUpdate = (type: 'pickup' | 'destination', loc: Location) => {
    if (booking.status === 'searching' || booking.status === 'selecting') {
      setBooking(prev => ({ ...prev, [type]: loc, status: 'selecting' }));
      if (type === 'pickup') setPickupInput(loc.address);
      if (type === 'destination') setDestInput(loc.address);
      setSuggestions([]);
      setActiveSearch(null);
    }
  };

  const handleTextSearch = async (val: string, type: 'pickup' | 'destination') => {
    if (type === 'pickup') setPickupInput(val);
    else setDestInput(val);
    
    setActiveSearch(type);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearchingLoc(true);
      const results = await searchLocations(val);
      setSuggestions(results);
      setIsSearchingLoc(false);
    }, 600);
  };

  const selectSuggestion = (loc: Location) => {
    if (activeSearch === 'pickup') {
      setBooking(prev => ({ ...prev, pickup: loc }));
      setPickupInput(loc.address);
    } else {
      setBooking(prev => ({ ...prev, destination: loc }));
      setDestInput(loc.address);
    }
    setSuggestions([]);
    setActiveSearch(null);
    setBooking(prev => ({ ...prev, status: 'selecting' }));
  };

  const pushNotification = useCallback((title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title, message, type, timestamp: Date.now(), read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setNotificationToast({ title, message, type: type as NotificationType });
  }, []);

  // Connect to real-time push notifications via IoT Core MQTT
  useEffect(() => {
    if (!user?.id) return;

    notificationService.connect(user.id);

    const unsubNotif = notificationService.onNotification((push: PushNotification) => {
      const typeMap: Record<string, Notification['type']> = {
        ride_confirmed: 'rider', ride_cancelled: 'rider', driver_assigned: 'rider',
        driver_arrived: 'rider', order_update: 'order', parcel_update: 'order',
        message: 'admin', payment: 'promo', campaign: 'promo'
      };
      const notifType = typeMap[push.type] || 'admin';
      const newNotif: Notification = {
        id: push.notificationId || Math.random().toString(36).substr(2, 9),
        title: push.title, message: push.body,
        type: notifType, timestamp: Date.now(), read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
      setNotificationToast({ title: push.title, message: push.body, type: notifType as NotificationType });
    });

    return () => {
      unsubNotif();
      notificationService.disconnect();
    };
  }, [user?.id]);

  const handleConfirmBooking = () => {
    if (!booking.selectedRide || !user) return;

    // Billing Logic: $0.37 per KM
    const distanceKm = booking.calculatedDistanceKm || 10;
    const finalPrice = parseFloat((distanceKm * 0.37).toFixed(2));

    if (user.walletBalance < finalPrice && !user.employerId && user.role !== 'business') {
      alert("Insufficient funds for this mission. Please load your wallet.");
      return;
    }
    
    const newRide: RideHistoryItem = {
      id: `TRP-${Math.floor(Math.random()*100000)}`,
      customerId: user.id,
      passengerName: user.name,
      provider: booking.selectedRide.provider,
      type: booking.selectedRide.type,
      pickup: booking.pickup?.address || 'Current Node',
      destination: booking.destination?.address || 'Target Node',
      price: finalPrice,
      distanceKm: distanceKm,
      durationMinutes: booking.calculatedDurationMinutes || 15,
      timestamp: Date.now(),
      status: 'pending' // Rider will accept this
    };

    const updatedUser = omniApi.requestRide(newRide);
    if (updatedUser) setUser(updatedUser);

    setBooking(prev => ({ ...prev, status: 'on_ride' }));
    pushNotification("Mission Engaged", `${booking.selectedRide.provider} unit dispatched. Funds held in Escrow.`, "rider");
  };

  const handleAddToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, restaurantId: selectedRestaurant!.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === id);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.menuItemId === id ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.menuItemId !== id);
    });
  };

  const handlePlaceFoodOrder = (discount: number = 0) => {
    if (!selectedRestaurant || !user) return;
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const total = subtotal + selectedRestaurant.deliveryFee + 1.50 - discount;

    if (user.walletBalance < total && !user.employerId && user.role !== 'business') {
      alert("Insufficient funds in your OmniWallet.");
      return;
    }

    const order: Order = {
      id: `ORD-${Math.floor(Math.random() * 100000)}`,
      customerId: user.id,
      clientName: user.name,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      restaurantImage: selectedRestaurant.coverImage,
      items: cart,
      subtotal,
      deliveryFee: selectedRestaurant.deliveryFee,
      total,
      status: 'pending',
      timestamp: Date.now(),
      discount,
      prepStartTime: Date.now()
    };

    const updatedUser = omniApi.placeGlobalOrder(order);
    if (updatedUser) setUser(updatedUser);

    pushNotification("Order Received", `Preparing your meal. $${total.toFixed(2)} held in escrow.`, "order");
    setCart([]);
    setSelectedRestaurant(null);
    setMode('activity');
  };

  if (!user) return <AuthScreen onLogin={setUser} />;

  if (user.status === 'pending') {
     return (
       <div className="h-screen w-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
          <div className="max-w-md w-full bg-white p-14 rounded-[56px] shadow-2xl border border-gray-100 space-y-10 animate-in zoom-in-95 duration-500">
             <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 bg-blue-100 rounded-[40px] animate-ping opacity-30" />
                <div className="relative w-28 h-28 bg-black rounded-[36px] flex items-center justify-center text-white shadow-2xl border-4 border-white">
                   <ShieldCheck className="w-14 h-14 text-emerald-400" />
                </div>
             </div>
             <div className="space-y-3">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Security Registry</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Node ID: {user.id}</p>
             </div>
             <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 italic">
                <p className="text-gray-600 font-medium leading-relaxed text-sm">
                   "We are currently verifying your KYC credentials against global registries. Platform command will activate your terminal once vetting is complete."
                </p>
             </div>
             <div className="space-y-6">
                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-full w-fit mx-auto border border-emerald-100">
                   <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-[0.1em]">Polling Platform Hub...</span>
                </div>
                <div className="pt-4 border-t border-gray-50">
                  <button onClick={() => omniApi.logout(user.id, user.name)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-all flex items-center justify-center gap-2 mx-auto">
                    Abort Registration Access
                  </button>
                </div>
             </div>
          </div>
       </div>
     );
  }

  const lang = user.language || 'en';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-100 flex flex-col md:flex-row font-sans text-gray-900">
      {notificationToast && (
        <NotificationOverlay 
          title={notificationToast.title}
          message={notificationToast.message} 
          type={notificationToast.type} 
          onClose={() => setNotificationToast(null)} 
        />
      )}

      {trackingOrder && <DeliveryTracking order={trackingOrder} onClose={() => setTrackingOrder(null)} />}
      {showOpusAIAdmin && <OpusAIAdminPanel onClose={() => setShowOpusAIAdmin(false)} />}

      <nav className={`hidden md:flex flex-col w-24 h-full items-center py-10 gap-10 z-50 bg-black text-white border-r border-white/5 shadow-2xl`}>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black font-black text-2xl italic cursor-pointer shadow-xl hover:rotate-6 transition-transform" onClick={() => setMode(user.role === 'rider' ? 'rider' : 'rides')}>O</div>
        <div className="flex flex-col gap-8 flex-1 overflow-y-auto hide-scrollbar py-2">
          {user.role === 'admin' ? (
            <div className="flex flex-col gap-10">
               <ShieldAlert onClick={() => setMode('admin')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'admin' ? 'text-emerald-400 drop-shadow-[0_0_8px_#10b981]' : 'text-gray-500'}`} />
               <ShoppingBag onClick={() => setShowOpusAIAdmin(true)} title="OpusAIMobility Admin" className="w-7 h-7 cursor-pointer hover:scale-110 transition-all text-orange-500 hover:text-orange-400 drop-shadow-[0_0_8px_#f97316]" />
            </div>
          ) : user.role === 'rider' ? (
            <div className="flex flex-col gap-6 items-center">
              {/* Rider Sidebar - Integrated Navigation Order */}
              <button 
                onClick={() => setMode('rider')} 
                title="Protocol Feed"
                className={`p-3 rounded-2xl transition-all duration-300 ${mode === 'rider' ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'hover:bg-white/5'}`}
              >
                <Bike className={`w-7 h-7 transition-all ${mode === 'rider' ? 'text-emerald-400 drop-shadow-[0_0_8px_#10b981]' : 'text-emerald-600/40 hover:text-emerald-500'}`} />
              </button>

              <button 
                onClick={() => setMode('job_tasks')} 
                title="Job Task Hub"
                className={`p-3 rounded-2xl transition-all duration-300 ${mode === 'job_tasks' ? 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'hover:bg-white/5'}`}
              >
                <ListChecks className={`w-7 h-7 transition-all ${mode === 'job_tasks' ? 'text-indigo-400 drop-shadow-[0_0_8px_#6366f1]' : 'text-indigo-600/40 hover:text-indigo-500'}`} />
              </button>

              <button 
                onClick={() => setMode('wallet')} 
                title="Rider Wallet"
                className={`p-3 rounded-2xl transition-all duration-300 ${mode === 'wallet' ? 'bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'hover:bg-white/5'}`}
              >
                <Wallet className={`w-7 h-7 transition-all ${mode === 'wallet' ? 'text-amber-400 drop-shadow-[0_0_8px_#f59e0b]' : 'text-amber-600/40 hover:text-amber-500'}`} />
              </button>

              {/* Performance Hub (Telemetry) */}
              <button 
                onClick={() => setMode('performance')} 
                title="Fleet Telemetry Active"
                className={`p-3 rounded-2xl transition-all duration-300 ${mode === 'performance' ? 'bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'hover:bg-white/5'}`}
              >
                <Activity className={`w-7 h-7 transition-all ${mode === 'performance' ? 'text-cyan-400 drop-shadow-[0_0_8px_#06b6d4]' : 'text-cyan-600/40 hover:text-cyan-500'}`} />
              </button>

              {/* Energy Hub - Next to Performance */}
              <button 
                onClick={() => setMode('energy_hub')} 
                title="Energy Hub"
                className={`p-3 rounded-2xl transition-all duration-300 ${mode === 'energy_hub' ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'hover:bg-white/5'}`}
              >
                <Zap className={`w-7 h-7 transition-all ${mode === 'energy_hub' ? 'text-emerald-400 drop-shadow-[0_0_8px_#10b981]' : 'text-emerald-600/40 hover:text-emerald-500'}`} />
              </button>

              <button 
                onClick={() => setMode('activity')} 
                title="History Hub"
                className={`p-3 rounded-2xl transition-all duration-300 ${mode === 'activity' ? 'bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'hover:bg-white/5'}`}
              >
                <History className={`w-7 h-7 transition-all ${mode === 'activity' ? 'text-orange-400 drop-shadow-[0_0_8px_#f97316]' : 'text-orange-600/40 hover:text-orange-500'}`} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8 items-center">
              <Navigation onClick={() => setMode('rides')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'rides' ? 'text-blue-400 drop-shadow-[0_0_8px_#60a5fa]' : 'text-gray-500'}`} />
              <Utensils onClick={() => setMode('food')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'food' ? 'text-orange-400 drop-shadow-[0_0_8px_#fb923c]' : 'text-gray-500'}`} />
              {user.role === 'business' && <Building2 onClick={() => setMode('business')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'business' ? 'text-indigo-400 drop-shadow-[0_0_8px_#818cf8]' : 'text-gray-500'}`} />}
              <Package onClick={() => setMode('delivery')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'delivery' ? 'text-emerald-400 drop-shadow-[0_0_8px_#34d399]' : 'text-gray-500'}`} />
              <ListChecks onClick={() => setMode('errands')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'errands' ? 'text-indigo-400 drop-shadow-[0_0_8px_#818cf8]' : 'text-gray-500'}`} />
              <Wallet onClick={() => setMode('wallet')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'wallet' ? 'text-indigo-400 drop-shadow-[0_0_8px_#818cf8]' : 'text-gray-500'}`} />
              <History onClick={() => setMode('activity')} className={`w-7 h-7 cursor-pointer hover:scale-110 transition-all ${mode === 'activity' ? 'text-blue-400 drop-shadow-[0_0_8px_#60a5fa]' : 'text-gray-500'}`} />
            </div>
          )}
        </div>
        <button onClick={() => omniApi.logout(user.id, user.name)} className="mb-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition"><LogOut className="w-5 h-5 text-gray-400" /></button>
        <Settings className="w-7 h-7 text-gray-500 cursor-pointer hover:rotate-45 transition-transform shrink-0" onClick={() => setShowProfile(true)} />
      </nav>

      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
        {user.role === 'admin' && mode === 'admin' && <AdminInterface onClose={() => setMode('rides')} adminUser={user} />}
        {user.role === 'rider' && mode === 'rider' && <RiderPortal onClose={() => setMode('activity')} riderProfile={user.riderProfile} onUpdateRider={(p) => setUser({...user, riderProfile: p})} pushNotification={pushNotification} />}
        {user.role === 'rider' && mode === 'job_tasks' && user.riderProfile && <RiderJobTasks profile={user.riderProfile} onClose={() => setMode('rider')} pushNotification={pushNotification} />}

        {user.role === 'rider' && mode === 'energy_hub' && user.riderProfile && (
           <EnergyPortal profile={user.riderProfile} onUpdateRider={(p) => setUser({...user, riderProfile: p})} onClose={() => setMode('rider')} pushNotification={pushNotification} />
        )}

        {user.role === 'rider' && mode === 'activity' && (
           <div className="flex-1 h-full bg-white overflow-hidden animate-in fade-in duration-500">
              <OrderHistory 
                orders={[]} 
                rides={JSON.parse(localStorage.getItem('opusaimobility-trips') || '[]').filter((t: any) => t.riderId === user.riderProfile?.id)}
                deliveries={JSON.parse(localStorage.getItem('opusaimobility-orders') || '[]').filter((o: any) => o.riderId === user.riderProfile?.id)} 
                errands={JSON.parse(localStorage.getItem('opusaimobility-errands') || '[]').filter((e: any) => e.riderId === user.riderProfile?.id)}
                payments={JSON.parse(localStorage.getItem('opusaimobility-transactions') || '[]')} 
                onRate={() => {}} 
                onReorder={() => {}} 
              />
           </div>
        )}

        {user.role === 'rider' && mode === 'wallet' && user.riderProfile && (
           <RiderWalletHub profile={user.riderProfile} onUpdateRider={(p) => setUser({...user, riderProfile: p})} onClose={() => setMode('rider')} />
        )}

        {user.role === 'rider' && mode === 'performance' && user.riderProfile && (
           <RiderDashboardAnalytics profile={user.riderProfile} onClose={() => setMode('rider')} onNavigateToEnergyHub={() => setMode('energy_hub')} />
        )}

        {mode === 'rides' && user.role !== 'rider' && (
          <div className="relative flex-1 flex flex-col md:flex-row">
            <div className="relative flex-1">
              <MapView booking={booking} onLocationUpdate={handleLocationUpdate} />
              
              {booking.status === 'confirming' && booking.selectedRide && (
                <BookingCheckout 
                  user={user} 
                  ride={booking.selectedRide} 
                  distanceKm={booking.calculatedDistanceKm || 0}
                  onConfirm={handleConfirmBooking}
                  onCancel={() => setBooking(prev => ({ ...prev, status: 'selecting', selectedRide: null }))}
                  onUpdateUser={setUser}
                />
              )}

              {booking.status === 'comparing' && (
                <div className="absolute inset-0 z-[100]">
                  <RideComparison 
                    rides={booking.comparisonRides || []} 
                    onSelect={(r) => setBooking({...booking, selectedRide: r, status: 'confirming'})}
                    onBack={() => setBooking({...booking, status: 'selecting'})}
                  />
                </div>
              )}

              {booking.status === 'on_ride' && (
                <div className="absolute inset-x-6 bottom-10 z-[100] animate-in slide-in-from-bottom duration-700">
                  <div className="bg-white p-8 rounded-[48px] shadow-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-emerald-50 text-white rounded-[32px] flex items-center justify-center text-4xl shadow-xl animate-pulse">🚗</div>
                      <div>
                        <h3 className="text-2xl font-black">Trip in Progress</h3>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">En route to {booking.destination?.address}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setBooking({ ...booking, status: 'searching', destination: null, selectedRide: null })}
                      className="p-4 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                    >
                      End Simulation
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-[460px] bg-white shrink-0 shadow-[0_0_60px_rgba(0,0,0,0.1)] p-8 space-y-8 overflow-y-auto hide-scrollbar z-20">
              <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-black tracking-tighter">{t('whereTo', lang)}</h2>
                 <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                   {booking.destination ? (
                     <button onClick={() => {
                        setBooking({ ...booking, status: 'searching', destination: null, selectedRide: null });
                        setDestInput('');
                     }} className="p-2"><X className="w-5 h-5 text-red-400" /></button>
                   ) : (
                     <Navigation className="w-5 h-5" />
                   )}
                 </div>
              </div>

              {/* Location Inputs */}
              <div className="space-y-4 relative">
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" />
                    <input 
                      type="text" 
                      placeholder="Current Location" 
                      value={pickupInput} 
                      onChange={(e) => handleTextSearch(e.target.value, 'pickup')}
                      className="w-full pl-10 pr-10 py-4 bg-gray-50 rounded-[22px] font-bold text-sm border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all" 
                    />
                    {isSearchingLoc && activeSearch === 'pickup' && (
                       <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                 </div>

                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" />
                    <input 
                      type="text" 
                      placeholder="Where to?" 
                      value={destInput} 
                      onChange={(e) => handleTextSearch(e.target.value, 'destination')}
                      className="w-full pl-10 pr-10 py-4 bg-gray-50 rounded-[22px] font-bold text-sm border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all" 
                    />
                    {isSearchingLoc && activeSearch === 'destination' && (
                       <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                 </div>

                 {/* AI Route Calculation Hint */}
                 {isCalculatingRoute && (
                   <div className="p-4 bg-blue-50 rounded-2xl flex items-center justify-center gap-3 border border-blue-100 animate-pulse">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Calculating Road Distance...</p>
                   </div>
                 )}

                 {/* Suggestion Dropdown */}
                 {suggestions.length > 0 && activeSearch && (
                    <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                       <div className="p-2">
                          {suggestions.map((loc, i) => (
                             <button
                                key={i}
                                onClick={() => selectSuggestion(loc)}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all text-left group"
                             >
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                                   <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="font-black text-sm text-gray-900 truncate">{loc.address}</p>
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network Verified Address</p>
                                </div>
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
              
              <RideSelector 
                onSelect={(r) => setBooking({...booking, selectedRide: r, status: 'confirming'})} 
                onCompare={(rides) => setBooking({...booking, comparisonRides: rides, status: 'comparing'})} 
                onCouponSelect={(c) => setBooking({...booking, activeCoupon: c})}
                selectedId={booking.selectedRide?.id}
                activeCoupon={booking.activeCoupon}
                distanceKm={booking.calculatedDistanceKm}
              />
            </div>
          </div>
        )}

        {mode === 'errands' && (
          <ErrandPortal 
            user={user} 
            onClose={() => setMode('rides')} 
            onOrderPlaced={(order) => {
              const updated = omniApi.placeErrandOrder(order);
              if (updated) setUser(updated);
              pushNotification("Dedicated Errand Locked", `Rider hired for ${order.plan} session.`, "rider");
              setMode('activity');
            }} 
          />
        )}

        {mode === 'delivery' && (
          <DeliveryDashboard 
            user={user} 
            onPlaceOrder={(d) => { 
              const updatedUser = omniApi.placeGlobalOrder(d); 
              if (updatedUser) setUser(updatedUser);
              pushNotification("Logistics Lock Engaged", "Funds held in Escrow. Rider dispatched.", "order"); 
              setMode('activity'); 
            }} 
          />
        )}

        {mode === 'food' && (
          <div className="flex-1 relative bg-white h-full overflow-hidden">
             {selectedRestaurant ? (
               <RestaurantMenu 
                 restaurant={selectedRestaurant}
                 onClose={() => setSelectedRestaurant(null)}
                 cart={cart}
                 onAddToCart={handleAddToCart}
                 onRemoveFromCart={handleRemoveFromCart}
                 onPlaceOrder={handlePlaceFoodOrder}
               />
             ) : (
               <FoodDashboard 
                 user={user} 
                 onSelectRestaurant={setSelectedRestaurant} 
                 onToggleFavorite={(id) => {
                   const favs = user.favorites.includes(id) 
                     ? user.favorites.filter(f => f !== id) 
                     : [...user.favorites, id];
                   setUser({...user, favorites: favs});
                 }} 
               />
             )}
          </div>
        )}

        {mode === 'wallet' && user.role !== 'rider' && (
          <UserWallet 
            user={user} 
            onUpdateUser={setUser} 
            onClose={() => setMode('rides')} 
          />
        )}

        {mode === 'business' && user.role === 'business' && <BusinessPortal user={user} onUpdateUser={setUser} onTrackOrder={setTrackingOrder} onClose={() => setMode('rides')} />}
        
        {mode === 'activity' && user.role !== 'rider' && <OrderHistory 
          orders={JSON.parse(localStorage.getItem('opusaimobility-orders') || '[]').filter((o: any) => o.customerId === user.id && !('fee' in o) && !('plan' in o))} 
          rides={JSON.parse(localStorage.getItem('opusaimobility-trips') || '[]').filter((t: any) => t.customerId === user.id)}
          deliveries={JSON.parse(localStorage.getItem('opusaimobility-orders') || '[]').filter((o: any) => o.customerId === user.id && ('fee' in o))} 
          errands={JSON.parse(localStorage.getItem('opusaimobility-errands') || '[]').filter((e: any) => e.customerId === user.id)}
          payments={JSON.parse(localStorage.getItem('opusaimobility-transactions') || '[]')} 
          onRate={() => {}} 
          onReorder={() => {}} 
        />}
      </div>

      {showProfile && user && <ProfileEditor user={user} onClose={() => setShowProfile(false)} onSave={setUser} />}
    </div>
  );
};

export default App;
