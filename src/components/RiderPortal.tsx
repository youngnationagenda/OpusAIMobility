
import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { 
  Bike, ChevronLeft, ShieldCheck, Zap, Battery, MapPin, Navigation, User, 
  ArrowRight, Phone, CheckCircle2, Navigation2, Moon, Sun, Briefcase, Activity, Package,
  Users, Lock, Unlock, AlertCircle, Wallet, BarChart3, Shield, Star, Award, FileText, 
  Settings, LogOut, MessageSquare, Info, Clock, AlertTriangle, Play, Sparkles, Coins, 
  Landmark, ShoppingCart, ListChecks, ArrowUpRight, ArrowDownLeft,
  Building2, Cpu, Leaf, Smartphone, Globe, Check, Loader2, Crosshair, Plus, Minus,
  RefreshCw, Radar, Map as MapIcon
} from 'lucide-react';
import { RiderProfile, Notification, DeliveryOrder, User as UserProfile, RideHistoryItem, ErrandOrder, OrderStatus } from '../types';
import { omniApi } from '../services/api';
import { getAlternativeRoute } from '../services/geminiService';

interface RiderPortalProps {
  onClose: () => void;
  riderProfile?: RiderProfile;
  onUpdateRider: (profile: RiderProfile) => void;
  pushNotification: (title: string, message: string, type: Notification['type']) => void;
}

const RiderPortal: React.FC<RiderPortalProps> = ({ onClose, riderProfile, onUpdateRider, pushNotification }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'active_trip'>('dashboard');
  const [isOnline, setIsOnline] = useState(riderProfile?.online || false);
  const [pendingJob, setPendingJob] = useState<any | null>(null);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRoute, setAiRoute] = useState<{ routeName: string, reason: string, timeSaved: string } | null>(null);
  
  // Map State
  const [isScanning, setIsScanning] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const missionMarkersRef = useRef<L.Marker[]>([]);

  // Tracking errand checklist items
  const [acquiredItems, setAcquiredItems] = useState<string[]>([]);

  // Initialize Map for Dashboard (Matches User Portal MapView)
  useEffect(() => {
    if (currentView === 'dashboard' && isOnline && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-1.2863, 36.8172], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      const riderIcon = L.divIcon({
        className: 'rider-node-icon',
        html: `<div class="relative w-8 h-8">
                 <div class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                 <div class="relative w-8 h-8 bg-black border-4 border-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                   <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      riderMarkerRef.current = L.marker([-1.2863, 36.8172], { icon: riderIcon }).addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentView, isOnline]);

  // Sync Mission Markers to Map with specific logic for feed items
  useEffect(() => {
    if (!mapInstanceRef.current || !isOnline) return;

    // Clear old markers
    missionMarkersRef.current.forEach(m => m.remove());
    missionMarkersRef.current = [];

    if (pendingJob) {
      const isDedicated = pendingJob.type === 'dedicated';
      const color = isDedicated ? '#6366f1' : '#3b82f6';
      
      const missionIcon = L.divIcon({
        className: 'mission-marker',
        html: `<div class="relative w-12 h-12 group">
                 <div class="absolute inset-0 bg-blue-500 rounded-[14px] animate-pulse opacity-20"></div>
                 <div class="relative w-12 h-12 bg-white border-2 border-[${color}] rounded-[18px] flex items-center justify-center shadow-xl rotate-45 group-hover:scale-110 transition-transform">
                   <div class="rotate-[-45deg] font-black text-xs" style="color: ${color}">$</div>
                 </div>
               </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      // Simulation: Place mission node slightly offset from rider
      const lat = -1.2863 + (Math.random() - 0.5) * 0.015;
      const lng = 36.8172 + (Math.random() - 0.5) * 0.015;
      
      const marker = L.marker([lat, lng], { icon: missionIcon }).addTo(mapInstanceRef.current);
      
      marker.on('click', () => {
        // Focus the feed on this job if user clicks map node
        pushNotification("Node Selected", "Mission data synced to terminal.", "system");
      });

      missionMarkersRef.current.push(marker);
      mapInstanceRef.current.panTo([lat, lng], { animate: true });
    }
  }, [pendingJob, isOnline]);

  const handleScanGrid = () => {
    if (!isOnline) return;
    setIsScanning(true);
    // Simulate searching through the grid
    setTimeout(() => {
      setIsScanning(false);
      pushNotification("Grid Scan Complete", "No additional mission nodes detected in your sector.", "system");
    }, 2000);
  };

  const handleLocateMe = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-1.2863, 36.8172], 15, { animate: true });
    }
  };

  // Synchronize online status
  useEffect(() => {
    if (riderProfile) {
      const updatedProfile = { ...riderProfile, online: isOnline };
      const actorStr = localStorage.getItem('omniride_user');
      if (actorStr) {
        const actor = JSON.parse(actorStr);
        omniApi.syncUser({ ...actor, riderProfile: updatedProfile });
        onUpdateRider(updatedProfile);
      }
    }
  }, [isOnline]);

  // MISSION RECOVERY
  useEffect(() => {
    if (!riderProfile?.id) return;

    const errands = JSON.parse(localStorage.getItem('omniride-errands') || '[]');
    const activeErrand = errands.find((e: ErrandOrder) => e.riderId === riderProfile.id && (e.status === 'active' || e.status === 'pending'));
    if (activeErrand) {
      const customer = omniApi.getPublicUser(activeErrand.customerId);
      setActiveJob({ ...activeErrand, type: 'errand', clientName: customer?.name || 'User' });
      setCurrentView('active_trip');
      return;
    }

    const orders = JSON.parse(localStorage.getItem('omniride-orders') || '[]');
    const activeOrder = orders.find((o: DeliveryOrder) => (o.riderId === riderProfile.id || o.allocatedRiderId === riderProfile.id) && o.status === 'picked_up');
    if (activeOrder) {
      setActiveJob({ ...activeOrder, type: 'delivery', clientName: activeOrder.sender.name });
      setCurrentView('active_trip');
    }
  }, [riderProfile?.id]);

  // Polling for missions
  useEffect(() => {
    if (!isOnline || activeJob || pendingJob) return;
    
    const poll = setInterval(() => {
      const orders = JSON.parse(localStorage.getItem('omniride-orders') || '[]');
      const errands = JSON.parse(localStorage.getItem('omniride-errands') || '[]');
      const trips = JSON.parse(localStorage.getItem('omniride-trips') || '[]');

      const dedicatedTask = orders.find((o: DeliveryOrder) => 
        o.allocatedRiderId === riderProfile?.id && o.status === 'pending'
      );
      if (dedicatedTask) {
        setPendingJob({ ...dedicatedTask, type: 'dedicated', clientName: dedicatedTask.sender.name });
        return;
      }

      const matchErrand = errands.find((e: ErrandOrder) => e.status === 'pending' && !e.riderId);
      if (matchErrand) {
        const customer = omniApi.getPublicUser(matchErrand.customerId);
        setPendingJob({ ...matchErrand, type: 'errand', clientName: customer?.name || 'User' });
        return;
      }

      const matchTrip = trips.find((t: RideHistoryItem) => t.status === 'pending' || t.status === 'searching');
      if (matchTrip) {
        setPendingJob({ ...matchTrip, type: 'ride', clientName: matchTrip.passengerName });
        return;
      }

      const matchDelivery = orders.find((o: DeliveryOrder) => o.status === 'pending' && !o.allocatedRiderId);
      if (matchDelivery) {
        setPendingJob({ ...matchDelivery, type: 'delivery', clientName: matchDelivery.sender.name });
      }
    }, 4000);

    return () => clearInterval(poll);
  }, [isOnline, activeJob, pendingJob, riderProfile?.id]);

  // AI Route Analysis
  useEffect(() => {
    if (activeJob) {
      setIsAiLoading(true);
      const destination = activeJob.receiver?.address || activeJob.destination || "Return to Hub";
      getAlternativeRoute("Current Node", destination)
        .then(route => setAiRoute(route))
        .finally(() => setIsAiLoading(false));
    }
  }, [activeJob]);

  const toggleItemAcquired = (itemId: string) => {
    setAcquiredItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleAcceptMission = (job: any) => {
    if (!riderProfile?.id) return;
    omniApi.assignRiderToMission(job.id, job.type === 'dedicated' ? 'delivery' : job.type, riderProfile.id, riderProfile.name);
    setActiveJob(job);
    setPendingJob(null);
    setAcquiredItems([]);
    setCurrentView('active_trip');
    pushNotification("Mission Confirmed", "Protocol tracking active.", "rider");
  };

  const handleCompleteMission = () => {
    if (!activeJob) return;
    const actor: any = JSON.parse(localStorage.getItem('omniride_user') || 'null') ?? {};

    if (activeJob.type === 'errand') {
      const errands = JSON.parse(localStorage.getItem('omniride-errands') || '[]');
      const idx = errands.findIndex((e: any) => e.id === activeJob.id);
      if (idx > -1) {
        errands[idx].status = 'completed';
        localStorage.setItem('omniride-errands', JSON.stringify(errands));
      }
      // Also update in DynamoDB via Lambda
      omniApi.updateOrderStatus(activeJob.id, 'completed', actor);
    } else if (activeJob.type === 'ride') {
      const trips = JSON.parse(localStorage.getItem('omniride-trips') || '[]');
      const idx = trips.findIndex((t: any) => t.id === activeJob.id);
      if (idx > -1) {
        trips[idx].status = 'completed';
        localStorage.setItem('omniride-trips', JSON.stringify(trips));
      }
      omniApi.updateOrderStatus(activeJob.id, 'completed', actor);
    } else {
      omniApi.updateOrderStatus(activeJob.id, 'delivered', actor);
    }

    setActiveJob(null);
    setCurrentView('dashboard');
    pushNotification("Mission Success", "Reward tokens distributed to your vault.", "system");
  };

  const dedicatedBusiness = useMemo(() => {
    if (!riderProfile?.assignedBusinessId) return null;
    return omniApi.getPublicUser(riderProfile.assignedBusinessId);
  }, [riderProfile?.assignedBusinessId]);

  if (currentView === 'active_trip' && activeJob) {
    const isShopping = activeJob.type === 'errand' && activeJob.shoppingList?.length > 0;
    const allAcquired = isShopping && acquiredItems.length === activeJob.shoppingList.length;

    return (
      <div className="flex-1 flex flex-col bg-gray-900 text-white h-full relative overflow-hidden animate-in fade-in duration-500 font-sans">
        <div className="p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between shrink-0">
          <button onClick={() => setCurrentView('dashboard')} className="p-2 bg-gray-700 rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
          <div className="text-center">
            <h2 className="text-xl font-black">{activeJob.clientName || 'Mission Node'}</h2>
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Deployment
            </p>
          </div>
          <button className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-400/20"><Phone className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar pb-32">
           <div className="bg-white/5 border border-white/10 p-8 rounded-[48px] space-y-6 shadow-2xl">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{activeJob.type} mission</span>
                    <h3 className="text-2xl font-black">{activeJob.id}</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400">${(activeJob.price || activeJob.fee || activeJob.baseFee || 0).toFixed(2)}</p>
                    <p className="text-[8px] font-black text-gray-500 uppercase">Payout Node</p>
                 </div>
              </div>

              {isShopping && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[32px] p-6 space-y-4 shadow-inner">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Shopping Manifest</span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-500 bg-white/5 px-2 py-1 rounded">{acquiredItems.length}/{activeJob.shoppingList.length} Picked</span>
                   </div>
                   <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {activeJob.shoppingList.map((item: any) => {
                        const isPicked = acquiredItems.includes(item.itemId);
                        return (
                          <button 
                            key={item.itemId} 
                            onClick={() => toggleItemAcquired(item.itemId)}
                            className={`w-full flex justify-between items-center p-3 rounded-2xl border transition-all ${isPicked ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                          >
                             <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isPicked ? 'bg-indigo-500' : 'bg-white/10'}`}>
                                   {isPicked ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-[10px] font-black text-gray-400">{item.quantity}x</span>}
                                </div>
                                <div className="text-left">
                                   <p className={`text-xs font-bold ${isPicked ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{item.name}</p>
                                   <p className="text-[8px] font-black text-gray-500 uppercase">{item.vendorName}</p>
                                </div>
                             </div>
                             <span className="text-[10px] font-black text-indigo-400">${(item.price * item.quantity).toFixed(2)}</span>
                          </button>
                        );
                      })}
                   </div>
                </div>
              )}

              <div className="space-y-6 pt-4 border-t border-white/5">
                 <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mt-1 shrink-0"><MapPin className="w-4 h-4" /></div>
                    <div>
                       <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Pickup Location</p>
                       <p className="text-sm font-bold leading-tight mt-0.5">{activeJob.pickup || activeJob.sender?.address || 'Multiple Store Hubs'}</p>
                    </div>
                 </div>
                 <div className="w-px h-6 bg-gray-700 ml-4" />
                 <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mt-1 shrink-0"><Navigation className="w-4 h-4" /></div>
                    <div>
                       <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Deployment Destination</p>
                       <p className="text-sm font-bold leading-tight mt-0.5">{activeJob.destination || activeJob.receiver?.address || 'Node Access Point'}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[40px] space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Live Optimization</span>
                 </div>
              </div>
              {aiRoute ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                   <h4 className="text-sm font-black text-white">{aiRoute.routeName}</h4>
                   <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{aiRoute.reason}</p>
                   <div className="mt-4 flex items-center gap-2">
                      <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase">Save {aiRoute.timeSaved} Battery</span>
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] italic text-emerald-300 opacity-50">
                  <Loader2 className="w-3 h-3 animate-spin" /> Calculating road efficiency...
                </div>
              )}
           </div>
        </div>

        <div className="p-8 bg-gray-950 border-t border-white/5 shrink-0 shadow-up">
           <button 
             onClick={handleCompleteMission} 
             disabled={isShopping && !allAcquired}
             className={`w-full py-5 rounded-[32px] font-black uppercase text-xs shadow-2xl transition-all ${
               (isShopping && !allAcquired) 
                 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                 : 'bg-white text-black hover:scale-[1.02] active:scale-95'
             }`}
           >
              {isShopping && !allAcquired ? 'Complete Checklist First' : 'Confirm Mission Handover'}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 text-white h-full overflow-hidden animate-in fade-in font-sans">
      <div className="p-6 bg-gray-900 border-b border-white/5 flex items-center justify-between shrink-0 shadow-2xl z-20">
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition border border-white/10 shadow-lg"><ChevronLeft className="w-6 h-6" /></button>
        
        <div className="flex flex-col items-center">
          <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
            {isOnline ? 'Grid Online' : 'Node Locked'}
          </span>
          <button 
            onClick={() => setIsOnline(!isOnline)} 
            className={`mt-2 w-14 h-7 rounded-full relative transition-all duration-500 ${isOnline ? 'bg-emerald-600' : 'bg-gray-800'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${isOnline ? 'right-1' : 'left-1'} shadow-lg`} />
          </button>
        </div>

        <div className="relative group">
           <img src={riderProfile?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${riderProfile?.name}`} className="w-12 h-12 rounded-[18px] object-cover border-2 border-white/10 shadow-xl" alt="Profile" />
           <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-gray-950 shadow-sm ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar pb-24">
        {dedicatedBusiness && (
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[48px] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover:rotate-45">
                <Building2 className="w-32 h-32" />
             </div>
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                      <Briefcase className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Enterprise Link Active</p>
                      <h3 className="text-xl font-black tracking-tight">{dedicatedBusiness.businessProfile?.companyName}</h3>
                   </div>
                </div>
                <p className="text-xs font-medium text-indigo-100/70 leading-relaxed">Allocated for priority corporate logistics. Manual node override active.</p>
             </div>
          </div>
        )}

        {/* REGIONAL GRID VISUALIZER (Matches User Map aesthetic) */}
        {isOnline && (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-[0.3em]">Regional Grid Visualizer</h3>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                   <span className="text-[9px] font-black text-blue-500 uppercase">Live Sector mapping</span>
                </div>
             </div>
             
             <div className="relative h-[360px] rounded-[56px] overflow-hidden border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] bg-slate-900 group">
                <div ref={mapContainerRef} className="absolute inset-0 z-0" />
                
                {/* Map Vignette Overlay */}
                <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]" />

                {/* Scan Control Button (Floating) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                  <button 
                    onClick={handleScanGrid}
                    disabled={isScanning}
                    className="px-8 py-4 bg-black/80 backdrop-blur-xl text-white rounded-full shadow-2xl flex items-center gap-3 hover:bg-black transition-all border border-white/10 active:scale-95 disabled:opacity-50"
                  >
                    {isScanning ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Leaf className="w-4 h-4 text-emerald-400" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scan Zero-Emission Grid</span>
                  </button>
                </div>

                {/* Map Controls (Right Sidebar) */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                   <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-black transition shadow-2xl"><Plus className="w-5 h-5 text-white" /></button>
                   <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-black transition shadow-2xl"><Minus className="w-5 h-5 text-white" /></button>
                   <div className="h-4" />
                   <button onClick={handleLocateMe} className="p-4 bg-emerald-500 rounded-2xl border border-emerald-400/50 hover:bg-emerald-600 transition shadow-2xl text-black shadow-emerald-500/20"><Crosshair className="w-5 h-5" /></button>
                </div>

                {/* Lat/Lng Signal Overlay */}
                <div className="absolute bottom-6 left-8 z-20 px-4 py-2 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      Sector 14-B Grid Node Verified
                   </p>
                </div>
             </div>
          </div>
        )}

        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black uppercase text-gray-500 tracking-[0.3em]">Protocol Feed</h3>
              {isOnline && !pendingJob && <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Scanning Grid...</span></div>}
           </div>

           {isOnline && pendingJob ? (
             <div className="bg-white text-black p-8 rounded-[48px] space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-500 border-b-[8px] border-indigo-100">
                <div className="flex justify-between items-start">
                   <div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        pendingJob.type === 'dedicated' ? 'bg-indigo-100 text-indigo-600' :
                        pendingJob.type === 'errand' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                      }`}>{pendingJob.type} request</span>
                      <h4 className="text-3xl font-black mt-2 tracking-tight">{pendingJob.clientName}</h4>
                   </div>
                   <div className="text-right">
                      <p className="text-3xl font-black text-indigo-600">${(pendingJob.price || pendingJob.fee || pendingJob.baseFee || 0).toFixed(2)}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Payout Node</p>
                   </div>
                </div>

                <div className="bg-gray-50 p-7 rounded-[36px] space-y-5 border border-gray-100 shadow-inner">
                   <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5"><MapPin className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pickup From</p>
                        <p className="text-xs font-bold text-gray-600 line-clamp-2 mt-0.5">{pendingJob.pickup || pendingJob.sender?.address || 'Multiple Store Stops'}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4 border-t border-gray-200/60 pt-4">
                      <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5"><Navigation className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Deliver To</p>
                        <p className="text-xs font-bold text-gray-600 line-clamp-2 mt-0.5">{pendingJob.destination || pendingJob.receiver?.address}</p>
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-2">
                   <button onClick={() => setPendingJob(null)} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-[28px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all hover:bg-gray-200">Decline</button>
                   <button onClick={() => handleAcceptMission(pendingJob)} className="flex-[2] py-5 bg-black text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all hover:scale-[1.02] shadow-indigo-200">Accept Mission</button>
                </div>
             </div>
           ) : isOnline ? (
             <div className="py-24 text-center opacity-30 italic flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/5 animate-pulse shadow-inner">
                   <Radar className="w-10 h-10 text-gray-500" />
                </div>
                <p className="font-black uppercase tracking-[0.4em] text-[10px] text-gray-400">Searching active grid for available missions</p>
             </div>
           ) : (
             <div className="bg-gray-900 p-12 rounded-[56px] text-center border-2 border-dashed border-white/5 shadow-inner">
                <Lock className="w-12 h-12 mx-auto mb-6 text-gray-700" />
                <h4 className="font-black text-lg text-gray-400 tracking-tight">System Offline</h4>
                <p className="font-bold text-xs text-gray-600 mt-2">Connect to Grid to access live protocol missions.</p>
                <button onClick={() => setIsOnline(true)} className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-500 transition-all active:scale-95">Connect Grid Node</button>
             </div>
           )}
        </div>
      </div>

      <div className="p-6 bg-gray-900 border-t border-white/5 flex items-center justify-center gap-8 opacity-40 shrink-0">
         <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[8px] font-black uppercase tracking-widest">Protocol v4.6.0-stable</span>
         </div>
         <div className="w-1 h-1 bg-gray-700 rounded-full" />
         <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[8px] font-black uppercase tracking-widest">Regional Node Verified</span>
         </div>
      </div>
    </div>
  );
};

export default RiderPortal;
