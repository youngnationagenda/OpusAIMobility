
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, MapPin, ArrowRight, User as UserIcon, Phone, Truck, ShieldCheck, 
  Clock, Plus, Trash2, Zap, Star, Search, X, Loader2, AlertTriangle, RefreshCw, CheckCircle2,
  Calendar, ArrowUpRight, ArrowDownLeft, Shield, Info
} from 'lucide-react';
import { DeliveryOrder, User, DetailedDeliveryItem, TripInsight, RiderProfile, DeliveryContact } from '../types';
import { omniApi } from '../services/api';

interface DeliveryDashboardProps {
  user: User;
  onPlaceOrder: (order: DeliveryOrder) => void;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ user, onPlaceOrder }) => {
  const [logisticsMode, setLogisticsMode] = useState<'send' | 'request'>('send');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  
  // Form State
  const [senderInfo, setSenderInfo] = useState<DeliveryContact>({
    name: logisticsMode === 'send' ? user.name : '',
    phone: logisticsMode === 'send' ? user.phone : '',
    address: logisticsMode === 'send' ? 'Omni Node Dispatch Hub' : '',
    kycStatus: 'verified'
  });
  
  const [receiverInfo, setReceiverInfo] = useState<DeliveryContact>({
    name: logisticsMode === 'request' ? user.name : '',
    phone: logisticsMode === 'request' ? user.phone : '',
    address: logisticsMode === 'request' ? 'My Location' : '',
    kycStatus: 'verified'
  });

  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState("12:00");

  const [items, setItems] = useState<DetailedDeliveryItem[]>([
    { id: 'item_1', description: '', category: 'Other', weightKg: 0.5, size: 'Small' }
  ]);

  const [onlineRiders, setOnlineRiders] = useState<User[]>([]);
  const [riderSearch, setRiderSearch] = useState('');

  useEffect(() => {
    // Use AWS-mirrored cache key ('opusaimobility-users' populated by omniApi._warmCaches)
    const users: User[] = JSON.parse(localStorage.getItem('opusaimobility-users') || '[]');
    setOnlineRiders(users.filter(u => u.role === 'rider' && u.riderProfile?.online));
  }, []);

  const filteredRiders = useMemo(() => {
    return onlineRiders.filter(r => r.name.toLowerCase().includes(riderSearch.toLowerCase()));
  }, [onlineRiders, riderSearch]);

  const toggleMode = (mode: 'send' | 'request') => {
    setLogisticsMode(mode);
    // Reset to defaults based on mode
    if (mode === 'send') {
      setSenderInfo({ name: user.name, phone: user.phone, address: 'Current Node', kycStatus: 'verified' });
      setReceiverInfo({ name: '', phone: '', address: '', kycStatus: 'unverified' });
    } else {
      setSenderInfo({ name: '', phone: '', address: '', kycStatus: 'unverified' });
      setReceiverInfo({ name: user.name, phone: user.phone, address: 'My Hub', kycStatus: 'verified' });
    }
  };

  const handlePlaceOrder = (anyRider: boolean = false) => {
    setIsProcessing(true);
    
    if (selectedRiderId && !anyRider && Math.random() > 0.6) {
      setTimeout(() => {
        setIsProcessing(false);
        setShowConflictModal(true);
      }, 1200);
      return;
    }

    const riderIdToUse = anyRider ? undefined : selectedRiderId;
    const chosenRider = onlineRiders.find(r => r.id === riderIdToUse);
    const scheduledTimestamp = isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`).getTime() : undefined;

    const order: DeliveryOrder = {
      id: `DEL-${Math.floor(Math.random() * 100000)}`,
      customerId: user.id,
      type: logisticsMode,
      sender: senderInfo,
      receiver: receiverInfo,
      description: items[0].description || 'Omni Logistics Parcel',
      items: items,
      fee: 12.50 + (items.length * 2), 
      status: isScheduled ? 'scheduled' : 'pending',
      timestamp: Date.now(),
      scheduledTimestamp,
      allocatedRiderId: riderIdToUse,
      riderName: chosenRider ? chosenRider.name : "Auto-Matching System...",
    };

    setTimeout(() => {
      onPlaceOrder(order);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar pb-32 h-full">
      <div className="p-6 space-y-6 max-w-xl mx-auto">
        <div className="flex justify-between items-end">
           <div className="space-y-1">
             <h1 className="text-3xl font-black text-gray-900">EV Logistics</h1>
             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><Zap className="w-3 h-3" /> Grid-Level Dispatching</p>
           </div>
           <div className="bg-white p-1 rounded-2xl flex border border-gray-100 shadow-sm">
              <button 
                onClick={() => toggleMode('send')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${logisticsMode === 'send' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Send Parcel
              </button>
              <button 
                onClick={() => toggleMode('request')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${logisticsMode === 'request' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Request Pickup
              </button>
           </div>
        </div>

        <div className="space-y-6 animate-in slide-in-from-right">
           
           {/* Section 1: Dynamic Contact Logic */}
           <div className="grid gap-6">
              {/* Sender Block */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
                 {logisticsMode === 'send' && <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />}
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
                       <h3 className="font-black text-lg">Sender Details</h3>
                    </div>
                    <button 
                      onClick={() => setSenderInfo({...senderInfo, kycStatus: senderInfo.kycStatus === 'verified' ? 'unverified' : 'verified'})}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border ${senderInfo.kycStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                    >
                       <Shield className="w-2 h-2" /> KYC {senderInfo.kycStatus}
                    </button>
                 </div>

                 <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Contact Name</label>
                          <input 
                             type="text" 
                             value={senderInfo.name} 
                             readOnly={logisticsMode === 'send'}
                             onChange={e => setSenderInfo({...senderInfo, name: e.target.value})}
                             placeholder="Pickup Contact"
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Contact Phone</label>
                          <input 
                             type="tel" 
                             value={senderInfo.phone} 
                             readOnly={logisticsMode === 'send'}
                             onChange={e => setSenderInfo({...senderInfo, phone: e.target.value})}
                             placeholder="+254..."
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" 
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Pickup Address</label>
                       <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                          <input 
                             type="text" 
                             value={senderInfo.address} 
                             readOnly={logisticsMode === 'send'}
                             onChange={e => setSenderInfo({...senderInfo, address: e.target.value})}
                             placeholder="Street, City, Building"
                             className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" 
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Receiver Block */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
                 {logisticsMode === 'request' && <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />}
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ArrowDownLeft className="w-5 h-5" /></div>
                       <h3 className="font-black text-lg">Receiver Details</h3>
                    </div>
                    <button 
                      onClick={() => setReceiverInfo({...receiverInfo, kycStatus: receiverInfo.kycStatus === 'verified' ? 'unverified' : 'verified'})}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border ${receiverInfo.kycStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                    >
                       <Shield className="w-2 h-2" /> KYC {receiverInfo.kycStatus}
                    </button>
                 </div>

                 <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Recipient Name</label>
                          <input 
                             type="text" 
                             value={receiverInfo.name} 
                             readOnly={logisticsMode === 'request'}
                             onChange={e => setReceiverInfo({...receiverInfo, name: e.target.value})}
                             placeholder="Delivery Contact"
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Contact Phone</label>
                          <input 
                             type="tel" 
                             value={receiverInfo.phone} 
                             readOnly={logisticsMode === 'request'}
                             onChange={e => setReceiverInfo({...receiverInfo, phone: e.target.value})}
                             placeholder="+254..."
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" 
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Drop-off Address</label>
                       <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                          <input 
                             type="text" 
                             value={receiverInfo.address} 
                             readOnly={logisticsMode === 'request'}
                             onChange={e => setReceiverInfo({...receiverInfo, address: e.target.value})}
                             placeholder="Street, City, Building"
                             className="w-full pl-11 pr-4 py-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" 
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 2: Parcel Metadata */}
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="font-black text-lg">Parcel Manifest</h3>
                 <Package className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Quick Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Legal Documents, Office Laptop" 
                      value={items[0].description}
                      onChange={e => setItems([{...items[0], description: e.target.value}])}
                      className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black outline-none" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Category</label>
                       <select 
                        value={items[0].category} 
                        onChange={e => setItems([{...items[0], category: e.target.value as any}])}
                        className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none"
                       >
                          <option>Document</option>
                          <option>Electronics</option>
                          <option>Food</option>
                          <option>Fragile</option>
                          <option>Other</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Size Bracket</label>
                       <select 
                        value={items[0].size} 
                        onChange={e => setItems([{...items[0], size: e.target.value as any}])}
                        className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none"
                       >
                          <option>Small</option>
                          <option>Medium</option>
                          <option>Large</option>
                       </select>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 3: Preferred Rider Marketplace */}
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="font-black text-lg">Select Your Rider</h3>
                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{onlineRiders.length} Online</span>
              </div>
              
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                 <input 
                  type="text" 
                  placeholder="Find your favorite rider..." 
                  value={riderSearch}
                  onChange={e => setRiderSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-black transition-all"
                 />
              </div>

              <div className="flex gap-4 overflow-x-auto hide-scrollbar py-2">
                 <button 
                  onClick={() => setSelectedRiderId('')}
                  className={`shrink-0 w-24 h-32 rounded-[28px] border-2 transition-all flex flex-col items-center justify-center gap-2 ${selectedRiderId === '' ? 'border-black bg-gray-50' : 'border-gray-50 bg-white'}`}
                 >
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl">🌐</div>
                    <p className="text-[9px] font-black uppercase text-center leading-tight px-2">Auto Match</p>
                 </button>
                 {filteredRiders.map(rider => (
                    <button 
                      key={rider.id}
                      onClick={() => setSelectedRiderId(rider.id)}
                      className={`shrink-0 w-28 h-32 rounded-[28px] border-2 transition-all flex flex-col items-center justify-center gap-2 relative ${selectedRiderId === rider.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-50 bg-white'}`}
                    >
                       <img src={rider.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.name}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" alt="" />
                       <div className="text-center">
                          <p className="text-[10px] font-black text-gray-900 truncate px-2">{rider.name.split(' ')[0]}</p>
                          <div className="flex items-center justify-center gap-1 text-[8px] font-bold text-yellow-600">
                             <Star className="w-2 h-2 fill-current" /> {rider.rating}
                          </div>
                       </div>
                       {selectedRiderId === rider.id && <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3" /></div>}
                    </button>
                 ))}
              </div>
           </div>

           {/* Section 4: Scheduling */}
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="font-black text-lg">Dispatch Protocol</h3>
                 <button 
                   onClick={() => setIsScheduled(!isScheduled)}
                   className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isScheduled ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
                 >
                    {isScheduled ? 'Scheduled' : 'Instant'}
                 </button>
              </div>

              {isScheduled ? (
                <div className="space-y-4 animate-in slide-in-from-top duration-300">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Mission Date</label>
                         <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl font-bold text-xs border-2 border-transparent focus:border-indigo-500 outline-none" />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Mission Time</label>
                         <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                            <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl font-bold text-xs border-2 border-transparent focus:border-indigo-500 outline-none" />
                         </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <Zap className="w-5 h-5 text-emerald-500" />
                   <p className="text-xs font-bold text-emerald-800 tracking-tight">Rider will be dispatched immediately upon order placement.</p>
                </div>
              )}
           </div>

           <button 
            onClick={() => handlePlaceOrder(false)} 
            disabled={!senderInfo.address || !receiverInfo.address || !receiverInfo.name || isProcessing} 
            className="w-full py-5 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95"
           >
             {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> {isScheduled ? 'Schedule Logistics' : 'Initialize Dispatch Protocol'}</>}
           </button>
        </div>
      </div>

      {/* Rider Availability Conflict Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="bg-white rounded-[48px] p-10 max-sm w-full text-center space-y-8 shadow-[0_32px_80px_rgba(0,0,0,0.3)]">
              <div className="relative w-24 h-24 mx-auto">
                 <div className="absolute inset-0 bg-red-100 rounded-[36px] animate-ping opacity-30" />
                 <div className="relative w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12" />
                 </div>
              </div>
              
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-gray-900 leading-tight">Rider Unavailable</h2>
                 <p className="text-sm font-medium text-gray-500">Your selected rider is currently on another trip or offline. What would you like to do?</p>
              </div>

              <div className="space-y-3">
                 <button 
                  onClick={() => { setShowConflictModal(false); setSelectedRiderId(''); }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                 >
                    <RefreshCw className="w-4 h-4" /> Choose Another Rider
                 </button>
                 <button 
                  onClick={() => { 
                    alert("Order queued. We will notify you once your preferred rider is available."); 
                    setShowConflictModal(false); 
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                 >
                    <Clock className="w-4 h-4" /> Wait Till Available
                 </button>
                 <button 
                  onClick={() => { setShowConflictModal(false); handlePlaceOrder(true); }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                 >
                    <Zap className="w-4 h-4" /> Get Any Available Rider
                 </button>
              </div>
              
              <button onClick={() => setShowConflictModal(false)} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-red-400 transition-colors">Cancel Request</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
