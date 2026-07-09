
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Wallet, Users, Plus, Trash2, MapPin, Phone, 
  ChevronLeft, Package, ClipboardList, User as UserIcon,
  Navigation, Zap, CheckCircle2, Clock, Smartphone,
  Search, ShieldCheck, CreditCard, Send, PlusCircle, Target, 
  ArrowRight, Loader2, Copy, Share, Bike, ExternalLink,
  Star, Utensils, Store, ShoppingBag, Edit3, X, Box, ListPlus,
  Landmark, RefreshCw, Activity, Power, History, DollarSign,
  ArrowUpRight, BarChart3, Database, ZapOff, Sparkles, Cpu,
  Scale, ShieldAlert, TrendingUp, Gauge, Battery, RefreshCcw,
  Truck, LayoutDashboard, Layers, Filter, Info, Download, 
  Leaf, AlertTriangle, MessageSquare
} from 'lucide-react';
import { User, DeliveryOrder, EmployeeProfile, RideHistoryItem, Restaurant, MenuItem, SwapStation, Provider, PaymentHistoryItem } from '../types';
import { omniApi } from '../services/api';
import { getBusinessStrategy } from '../services/geminiService';

interface BusinessPortalProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onTrackOrder: (order: DeliveryOrder) => void;
  onClose: () => void;
}

type BusinessTab = 'overview' | 'energy_mgmt' | 'food_hub' | 'fleet' | 'team' | 'dispatcher' | 'ledger';

const BusinessPortal: React.FC<BusinessPortalProps> = ({ user, onUpdateUser, onTrackOrder, onClose }) => {
  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', role: 'Operations' });
  const [dispatchDest, setDispatchDest] = useState('');
  const [dispatchProvider, setDispatchProvider] = useState<Provider>('Uber');
  const [dispatchCount, setDispatchCount] = useState(1);
  const [isDispatching, setIsDispatching] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Strategy Engine
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [bizStrategy, setBizStrategy] = useState<string | null>(null);

  // Energy Management State
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStation, setNewStation] = useState<Partial<SwapStation>>({
    name: '',
    address: '',
    brand: 'RoamAir',
    totalSlots: 10,
    swapFee: 2.50
  });

  const dedicatedFleet = useMemo(() => {
    return omniApi.getDedicatedRiders(user.id);
  }, [activeTab, user.id]);

  const runStrategyEngine = async () => {
    setIsAiThinking(true);
    const strategy = await getBusinessStrategy(user, dedicatedFleet);
    setBizStrategy(strategy);
    setIsAiThinking(false);
  };

  useEffect(() => {
    if (activeTab === 'overview' && !bizStrategy) {
      runStrategyEngine();
    }
  }, [activeTab]);

  const [myStations, setMyStations] = React.useState<any[]>([]);
  useEffect(() => {
    omniApi.getSwapStations().then(all => setMyStations(all.filter((s: any) => s.ownerId === user.id)));
  }, [activeTab, user.id, showAddStation]);

  const recentSwaps = useMemo(() => {
    const txs: PaymentHistoryItem[] = JSON.parse(localStorage.getItem('opusaimobility-transactions') || '[]');
    return txs.filter(t => t.id.endsWith('-OWN') && t.description?.toLowerCase().includes('revenue node share'))
              .sort((a, b) => b.timestamp - a.timestamp);
  }, [activeTab]);

  const businessOrders = useMemo(() => {
    const all: DeliveryOrder[] = JSON.parse(localStorage.getItem('opusaimobility-orders') || '[]');
    return all.filter(o => o.customerId === user.id).sort((a, b) => b.timestamp - a.timestamp);
  }, [activeTab, user.id]);

  const activeCorporateTrips = useMemo(() => {
    const all: RideHistoryItem[] = JSON.parse(localStorage.getItem('opusaimobility-trips') || '[]');
    return all.filter(t => t.customerId === user.id && t.status !== 'completed');
  }, [activeTab, user.id]);

  const fleetMetrics = useMemo(() => {
    const totalSize = dedicatedFleet.length;
    const activeRiders = dedicatedFleet.filter(r => r.riderProfile?.online).length;
    const totalEnergy = dedicatedFleet.reduce((acc, r) => acc + (r.riderProfile?.telemetry.totalEnergyConsumed || 0), 0);
    const co2Saved = dedicatedFleet.reduce((acc, r) => acc + ((r.riderProfile?.analytics.totalDistance || 0) * 0.4), 0);
    const lowBatteryAlerts = dedicatedFleet.filter(r => (r.riderProfile?.batteryStatus || 100) < 20);
    
    return {
      totalSize,
      activeRiders,
      totalEnergy: Math.round(totalEnergy),
      co2Saved: Math.round(co2Saved),
      swapCount: recentSwaps.length,
      revenue: user.businessProfile?.walletBalance || 0,
      activeMissions: activeCorporateTrips.length + businessOrders.filter(o => o.status !== 'delivered').length,
      alerts: lowBatteryAlerts.length
    };
  }, [dedicatedFleet, recentSwaps, user.businessProfile?.walletBalance, activeCorporateTrips, businessOrders]);

  const handleBulkDispatch = async () => {
    if (!dispatchDest || isDispatching) return;
    setIsDispatching(true);
    const farePerRide = 15.50;
    const totalCost = farePerRide * dispatchCount;
    
    if (user.businessProfile!.walletBalance < totalCost) {
      alert("Insufficient corporate funds.");
      setIsDispatching(false);
      return;
    }

    for (let i = 0; i < dispatchCount; i++) {
      const trip: RideHistoryItem = {
        id: `CORP-${Math.floor(Math.random()*100000)}`,
        customerId: user.id,
        passengerName: `Guest ${i+1}`,
        provider: dispatchProvider,
        type: `${dispatchProvider} Business`,
        pickup: 'Logistics Center Hub',
        destination: dispatchDest,
        price: farePerRide,
        timestamp: Date.now(),
        status: 'searching'
      };
      omniApi.requestRide(trip);
    }

    const updatedUser: User = {
      ...user,
      businessProfile: {
        ...user.businessProfile!,
        walletBalance: user.businessProfile!.walletBalance - totalCost
      }
    };
    omniApi.syncUser(updatedUser);
    onUpdateUser(updatedUser);

    setTimeout(() => {
      setIsDispatching(false);
      setActiveTab('overview');
      setDispatchDest('');
    }, 2000);
  };

  const handleAddStation = () => {
    if (!newStation.name || !newStation.address) return;
    const station: SwapStation = {
      id: 'STN-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      ownerId: user.id,
      name: newStation.name,
      address: newStation.address,
      brand: newStation.brand as Provider,
      lat: -1.2833 + (Math.random() - 0.5) * 0.05,
      lng: 36.8219 + (Math.random() - 0.5) * 0.05,
      availableSlots: newStation.totalSlots || 10,
      totalSlots: newStation.totalSlots || 10,
      isOpen: true,
      swapFee: newStation.swapFee || 2.50,
      revenue: 0
    };
    omniApi.registerSwapStation(station);
    setShowAddStation(false);
    setNewStation({ brand: 'RoamAir', totalSlots: 10, swapFee: 2.50 });
  };

  const toggleStation = (id: string, current: boolean) => {
    omniApi.updateStationStatus(id, !current);
    setActiveTab(prev => prev);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.phone) return;
    const emp: EmployeeProfile = {
      id: 'emp_' + Math.random().toString(36).substr(2, 5),
      name: newEmployee.name,
      phone: newEmployee.phone,
      role: newEmployee.role,
      totalSpent: 0
    };
    const updatedUser: User = {
      ...user,
      businessProfile: {
        ...user.businessProfile!,
        employees: [...(user.businessProfile?.employees || []), emp]
      }
    };
    omniApi.syncUser(updatedUser);
    onUpdateUser(updatedUser);
    setNewEmployee({ name: '', phone: '', role: 'Operations' });
    setShowAddEmployee(false);
  };

  const handleRemoveEmployee = (empId: string) => {
    if (!user.businessProfile) return;
    const updatedUser: User = {
      ...user,
      businessProfile: {
        ...user.businessProfile,
        employees: user.businessProfile.employees.filter(e => e.id !== empId)
      }
    };
    omniApi.syncUser(updatedUser);
    onUpdateUser(updatedUser);
  };

  const [editingRestaurant, setEditingRestaurant] = useState<Partial<Restaurant> | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<Partial<MenuItem> | null>(null);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  const handleSaveRestaurant = () => {
    if (!editingRestaurant?.name) return;
    const rest: Restaurant = {
      id: editingRestaurant.id || 'brest_' + Math.random().toString(36).substr(2, 9),
      name: editingRestaurant.name,
      category: editingRestaurant.category || 'Food & Service',
      rating: 5.0,
      reviewCount: 0,
      priceLevel: 2,
      deliveryTime: 25,
      deliveryFee: 2.50,
      coverImage: editingRestaurant.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      lat: -1.2833,
      lng: 36.8219,
      status: 'verified',
      menu: editingRestaurant.menu || []
    };

    const updatedRestaurants = editingRestaurant.id 
      ? (user.businessProfile?.restaurants || []).map(r => r.id === editingRestaurant.id ? rest : r)
      : [...(user.businessProfile?.restaurants || []), rest];

    const updatedUser: User = {
      ...user,
      businessProfile: {
        ...user.businessProfile!,
        restaurants: updatedRestaurants
      }
    };
    omniApi.syncUser(updatedUser);
    onUpdateUser(updatedUser);
    setEditingRestaurant(null);
  };

  const handleSaveProduct = () => {
    if (!editingMenuItem?.name || !activeRestaurantId) return;
    const item: MenuItem = {
      id: editingMenuItem.id || 'prod_' + Math.random().toString(36).substr(2, 9),
      name: editingMenuItem.name,
      description: editingMenuItem.description || '',
      price: Number(editingMenuItem.price || 0),
      category: editingMenuItem.category || 'General',
      prepTime: Number(editingMenuItem.prepTime || 15),
      image: editingMenuItem.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
    };

    const updatedRestaurants = (user.businessProfile?.restaurants || []).map(r => {
      if (r.id === activeRestaurantId) {
        const updatedMenu = editingMenuItem.id 
          ? r.menu.map(m => m.id === editingMenuItem.id ? item : m)
          : [...r.menu, item];
        return { ...r, menu: updatedMenu };
      }
      return r;
    });

    const updatedUser: User = {
      ...user,
      businessProfile: {
        ...user.businessProfile!,
        restaurants: updatedRestaurants
      }
    };
    omniApi.syncUser(updatedUser);
    onUpdateUser(updatedUser);
    setEditingMenuItem(null);
  };

  const renderEnergyMgmt = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-32">
       <div className="flex justify-between items-center px-1">
          <div>
             <h3 className="text-lg font-black text-gray-900">Station Grid</h3>
             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Hardware Supply Node Control</p>
          </div>
          <button onClick={() => setShowAddStation(true)} className="p-2 bg-black text-white rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-emerald-600">
             <Plus className="w-4 h-4" />
             <span className="text-[8px] font-black uppercase tracking-widest">Add Node</span>
          </button>
       </div>
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-3">
             <div className="grid gap-3">
                {myStations.map(stn => (
                  <div key={stn.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3 group hover:border-emerald-500 transition-all">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Landmark className="w-5 h-5" /></div>
                           <div>
                              <h4 className="font-black text-sm text-gray-900 leading-none">{stn.name}</h4>
                              <p className="text-[7px] font-black text-indigo-600 uppercase mt-1">{stn.brand}</p>
                           </div>
                        </div>
                        <button onClick={() => toggleStation(stn.id, stn.isOpen)} className={`p-1.5 rounded-lg transition-all ${stn.isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                           <Power className="w-3.5 h-3.5" />
                        </button>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 p-2 rounded-xl text-center"><p className="text-[6px] font-black text-gray-400 uppercase">Load</p><p className="text-xs font-black text-emerald-600">{stn.availableSlots}/{stn.totalSlots}</p></div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center"><p className="text-[6px] font-black text-gray-400 uppercase">Fee</p><p className="text-xs font-black">${stn.swapFee.toFixed(1)}</p></div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center"><p className="text-[6px] font-black text-gray-400 uppercase">Total</p><p className="text-xs font-black text-indigo-600">${stn.revenue.toFixed(1)}</p></div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[350px]">
             <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Revenue Ledger</p>
                <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-2 hide-scrollbar">
                {recentSwaps.map(tx => (
                  <div key={tx.id} className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-white transition-all">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-emerald-600 shadow-sm"><Zap className="w-3.5 h-3.5" /></div>
                        <p className="font-black text-[9px] text-gray-900">{tx.id.split('-')[1]}</p>
                     </div>
                     <p className="font-black text-[10px] text-emerald-600">+${tx.amount.toFixed(1)}</p>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );

  const renderFoodHub = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-32">
       <div className="flex justify-between items-center px-1">
          <div>
             <h3 className="text-lg font-black text-gray-900">Hub Catalog</h3>
             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Service Entities Control</p>
          </div>
          <button onClick={() => setEditingRestaurant({})} className="p-2 bg-black text-white rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-indigo-600">
             <Plus className="w-4 h-4" />
             <span className="text-[8px] font-black uppercase tracking-widest">New Entity</span>
          </button>
       </div>
       <div className="grid gap-4">
          {(user.businessProfile?.restaurants || []).map(rest => (
            <div key={rest.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3 group hover:border-indigo-500 transition-all">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <img src={rest.coverImage} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md" alt="" />
                     <div>
                        <h4 className="font-black text-base text-gray-900 leading-none">{rest.name}</h4>
                        <p className="text-[8px] font-black text-indigo-600 uppercase mt-1">{rest.category} • {rest.menu.length} Items</p>
                     </div>
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => setEditingRestaurant(rest)} className="p-1.5 bg-gray-50 text-gray-400 hover:text-black rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                     <button onClick={() => {
                        const updated = (user.businessProfile?.restaurants || []).filter(r => r.id !== rest.id);
                        onUpdateUser({...user, businessProfile: {...user.businessProfile!, restaurants: updated}});
                     }} className="p-1.5 bg-red-50 text-red-400 hover:bg-red-100 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-2xl text-[9px] font-bold text-gray-600">
                     {rest.menu.slice(0, 1).map(m => <div key={m.id} className="flex justify-between"><span>{m.name}</span><span className="text-indigo-600">${m.price.toFixed(1)}</span></div>)}
                  </div>
                  <button onClick={() => setActiveRestaurantId(rest.id)} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition-all border border-indigo-100 border-dashed">
                     <ListPlus className="w-4 h-4" />
                     <span className="text-[8px] font-black uppercase">Manage List</span>
                  </button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-32">
      <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-3">
         <div className="flex justify-between items-center">
            <h3 className="text-base font-black">Invite Nodes</h3>
            <button onClick={handleCopyInvite} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
               <Copy className="w-3 h-3" /> {copied ? 'Copied' : 'Share ID'}
            </button>
         </div>
         <div className="py-3 px-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xl tracking-[0.2em] text-center border-2 border-white shadow-inner">{user.id}</div>
      </div>
      <div className="flex justify-between items-center px-1">
        <div><h3 className="text-lg font-black text-gray-900">Staff Nodes</h3><p className="text-[8px] font-bold text-gray-400 uppercase">{user.businessProfile?.employees.length || 0} Members</p></div>
        <button onClick={() => setShowAddEmployee(true)} className="p-2 bg-black text-white rounded-xl shadow-lg active:scale-95 transition-all"><PlusCircle className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {user.businessProfile?.employees.map(emp => (
          <div key={emp.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black text-sm shadow-inner">{emp.name[0]}</div>
              <div><h4 className="font-black text-sm text-gray-900 leading-none">{emp.name}</h4><p className="text-[8px] font-bold text-gray-400 uppercase mt-1">{emp.role}</p></div>
            </div>
            <div className="flex items-center gap-3">
               <span className="font-black text-[10px] text-indigo-600">${emp.totalSpent.toFixed(1)}</span>
               <button onClick={() => handleRemoveEmployee(emp.id)} className="p-1 text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFleet = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-32">
      <div className="flex justify-between items-center px-1">
        <div><h3 className="text-lg font-black text-gray-900">Fleet Assets</h3><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{dedicatedFleet.length} Nodes</p></div>
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-inner"><Bike className="w-6 h-6" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-slate-900 p-4 rounded-3xl text-white space-y-1"><p className="text-[7px] font-black uppercase text-gray-500">Collective Load</p><h4 className="text-2xl font-black">{fleetMetrics.totalEnergy.toLocaleString()} <span className="text-[10px] opacity-40">kWh</span></h4></div>
         <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-1"><p className="text-[7px] font-black uppercase text-gray-400">Environment</p><h4 className="text-2xl font-black text-indigo-600">{fleetMetrics.co2Saved} <span className="text-[10px] opacity-40">kg Saved</span></h4></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {dedicatedFleet.map(rider => (
            <div key={rider.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all group">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="relative">
                        <img src={rider.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.name}`} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-md" alt="" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${rider.riderProfile?.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                     </div>
                     <div><h4 className="font-black text-sm text-gray-900 leading-none">{rider.name}</h4><p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mt-1 truncate max-w-[100px]">{rider.riderProfile?.vehicleModel}</p></div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500"><Star className="w-2.5 h-2.5 fill-current" /><span className="text-[9px] font-black">{rider.riderProfile?.rating || 5.0}</span></div>
                    <p className={`text-[7px] font-black uppercase mt-1 ${rider.riderProfile?.batteryStatus! < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>Node: {rider.riderProfile?.batteryStatus}%</p>
                  </div>
               </div>
            </div>
        ))}
      </div>
    </div>
  );

  const renderDispatcher = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-32">
      <div className="bg-indigo-900 text-white p-6 rounded-[40px] shadow-xl space-y-6 relative overflow-hidden">
        <Target className="absolute -right-6 -bottom-6 w-24 h-24 opacity-10 rotate-12" />
        <div className="space-y-0.5 relative z-10"><p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300">Fleet Multi-Dispatcher</p><h2 className="text-2xl font-black">Entity Hub Launch</h2></div>
        <div className="grid gap-3 relative z-10">
          <div className="space-y-1">
             <label className="text-[8px] font-black uppercase text-indigo-200 ml-1">Drop-off Node</label>
             <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                <input type="text" placeholder="Mission Target" value={dispatchDest} onChange={e => setDispatchDest(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white/10 rounded-2xl border-2 border-transparent focus:border-white outline-none font-bold text-sm" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1"><label className="text-[8px] font-black uppercase text-indigo-200 ml-1">Provider</label><select value={dispatchProvider} onChange={e => setDispatchProvider(e.target.value as Provider)} className="w-full p-3 bg-white/10 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-white"><option value="Uber">Uber</option><option value="Bolt">Bolt</option><option value="Grab">Grab</option></select></div>
             <div className="space-y-1"><label className="text-[8px] font-black uppercase text-indigo-200 ml-1">Fleet Count</label><select value={dispatchCount} onChange={e => setDispatchCount(parseInt(e.target.value))} className="w-full p-3 bg-white/10 rounded-xl font-bold text-[10px] outline-none border-2 border-transparent focus:border-white">{[1, 2, 5, 10].map(n => <option key={n} value={n}>{n} Nodes</option>)}</select></div>
          </div>
        </div>
        <button onClick={handleBulkDispatch} disabled={!dispatchDest || isDispatching} className="relative z-10 w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all hover:bg-indigo-50">{isDispatching ? <Loader2 className="animate-spin w-4 h-4" /> : <><Truck fill="currentColor" className="w-4 h-4" /> Initialize Launch</>}</button>
      </div>
    </div>
  );

  const renderLedger = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-32">
       <div className="flex justify-between items-center px-1">
          <div><h3 className="text-lg font-black text-gray-900">Mission Ledger</h3><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Operational History Trace</p></div>
          <button className="p-2 bg-black text-white rounded-xl shadow-lg"><Download className="w-4 h-4" /></button>
       </div>
       <div className="grid gap-3">
           {activeCorporateTrips.map(trip => (
              <div key={trip.id} className="bg-indigo-900 text-white p-4 rounded-3xl border-2 border-indigo-800 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow-inner backdrop-blur-md">🚗</div>
                   <div><h4 className="text-sm font-black leading-none">{trip.passengerName || 'Active'}</h4><p className="text-[8px] font-bold text-indigo-300 uppercase tracking-tighter truncate max-w-[120px] mt-1">{trip.destination}</p></div>
                </div>
                <span className="px-3 py-1.5 bg-white text-indigo-900 rounded-lg text-[8px] font-black uppercase tracking-widest">{trip.status}</span>
              </div>
           ))}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {businessOrders.map(order => (
                <div key={order.id} className="bg-white border border-gray-100 rounded-3xl p-4 space-y-3 shadow-sm hover:border-black transition-all">
                  <div className="flex justify-between items-start"><h4 className="font-black text-sm text-gray-900">{order.receiver.name}</h4><span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase border ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{order.status}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[6px] font-black text-gray-400 uppercase">Node</p><p className="text-[9px] font-black truncate">{order.receiver.buildingInfo || 'Main Hub'}</p></div>
                     <div className="p-2 bg-gray-50 rounded-lg text-right"><p className="text-[6px] font-black text-gray-400 uppercase">Payout</p><p className="text-[9px] font-black text-indigo-600">${order.fee.toFixed(1)}</p></div>
                  </div>
                  <button onClick={() => onTrackOrder(order)} className="w-full py-2 bg-gray-50 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Trace Link</button>
                </div>
              ))}
           </div>
       </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[120] bg-gray-50 flex flex-col animate-in slide-in-from-right font-sans overflow-hidden">
      <div className="p-4 md:p-5 bg-white border-b flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-[14px] flex items-center justify-center text-white shadow-lg rotate-3"><Building2 className="w-6 h-6" /></div>
          <div>
             <h2 className="text-lg font-black text-gray-900 tracking-tighter leading-none">{user.businessProfile?.companyName}</h2>
             <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Enterprise Reserve Hub</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 hide-scrollbar">
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[40px] shadow-xl relative overflow-hidden border-2 border-white/5">
           <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.03] rotate-12" />
           <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400">Liquid Enterprise Reserve</p>
           </div>
           <h2 className="text-4xl md:text-5xl font-black tracking-tighter">${user.businessProfile?.walletBalance.toFixed(2)}</h2>
           
           <div className="mt-6 flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {[
                { id: 'overview', label: 'Console Overview' },
                { id: 'energy_mgmt', label: 'Station Grid' },
                { id: 'food_hub', label: 'Hub Catalog' },
                { id: 'fleet', label: 'Fleet Assets' },
                { id: 'team', label: 'Staff Nodes' },
                { id: 'dispatcher', label: 'Multi‑Dispatcher' },
                { id: 'ledger', label: 'Mission Ledger' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as BusinessTab)} 
                  className={`px-3 py-2.5 rounded-[14px] text-[7px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${activeTab === tab.id ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'}`}
                >
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
        
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-700">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <OverviewStat icon={Bike} label="Fleet Size" value={fleetMetrics.totalSize} color="text-indigo-600" bg="bg-indigo-50" />
                <OverviewStat icon={Activity} label="Active Riders" value={fleetMetrics.activeRiders} color="text-emerald-600" bg="bg-emerald-50" />
                <OverviewStat icon={Target} label="Missions Today" value={fleetMetrics.activeMissions} color="text-blue-600" bg="bg-blue-50" />
                <OverviewStat icon={DollarSign} label="Net Revenue" value={`$${fleetMetrics.revenue.toFixed(0)}`} color="text-amber-600" bg="bg-amber-50" />
                <OverviewStat icon={Zap} label="Consumption" value={`${fleetMetrics.totalEnergy} kWh`} color="text-cyan-600" bg="bg-cyan-50" />
                <OverviewStat icon={RefreshCw} label="Swap Count" value={fleetMetrics.swapCount} color="text-orange-600" bg="bg-orange-50" />
                <OverviewStat icon={Leaf} label="CO₂ Saved" value={`${fleetMetrics.co2Saved} kg`} color="text-green-600" bg="bg-green-50" />
                <OverviewStat icon={AlertTriangle} label="System Alerts" value={fleetMetrics.alerts} color="text-red-600" bg="bg-red-50" />
             </div>

             {/* Alerts & Insights Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                   <div className="flex justify-between items-center px-1"><h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Active System Alerts</h4><ShieldAlert className="w-3.5 h-3.5 text-red-500" /></div>
                   <div className="space-y-2">
                      {fleetMetrics.alerts > 0 ? (
                        <div className="p-3 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                           <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                           <p className="text-[10px] font-bold text-red-700 uppercase">{fleetMetrics.alerts} Riders approaching 20% battery threshold</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 opacity-60">
                           <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                           <p className="text-[10px] font-bold text-emerald-700 uppercase">Operational parameters optimal</p>
                        </div>
                      )}
                      <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                         <Info className="w-3.5 h-3.5 text-blue-500" />
                         <p className="text-[10px] font-bold text-blue-700 uppercase">System wide weekly deduction: $10.00 applied</p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:rotate-12 transition-transform"><Cpu className="w-32 h-32" /></div>
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg border border-indigo-400/20"><Sparkles className="w-5 h-5" /></div>
                            <div><h3 className="text-base font-black text-white leading-tight">Strategy Engine</h3><p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Enterprise Catalyst</p></div>
                         </div>
                         <button onClick={runStrategyEngine} disabled={isAiThinking} className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition active:scale-95 border border-white/10 shadow-lg">
                            {isAiThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <RefreshCcw className="w-3.5 h-3.5 text-white" />}
                         </button>
                      </div>
                      <div className="min-h-[100px] bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col justify-center">
                         {bizStrategy ? (
                            <p className="text-[10px] font-medium text-gray-300 leading-relaxed whitespace-pre-line animate-in fade-in duration-1000">{bizStrategy}</p>
                         ) : (
                            <div className="text-center space-y-2 opacity-30"><Sparkles className="w-6 h-6 mx-auto text-indigo-400" /><p className="text-[8px] font-black uppercase tracking-widest">Execute AI Audit</p></div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'energy_mgmt' && renderEnergyMgmt()}
        {activeTab === 'food_hub' && renderFoodHub()}
        {activeTab === 'fleet' && renderFleet()}
        {activeTab === 'team' && renderTeam()}
        {activeTab === 'dispatcher' && renderDispatcher()}
        {activeTab === 'ledger' && renderLedger()}
      </div>
    </div>
  );
};

const OverviewStat = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-1.5 hover:shadow-md transition-all group border-b-4 hover:border-black">
     <div className={`p-2 ${bg} ${color} rounded-lg group-hover:scale-110 transition-transform shadow-inner`}><Icon className="w-4 h-4" /></div>
     <div className="space-y-0.5">
        <h4 className="text-base font-black text-gray-900 leading-none">{value}</h4>
        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
     </div>
  </div>
);

export default BusinessPortal;
