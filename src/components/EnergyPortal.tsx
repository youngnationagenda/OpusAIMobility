
import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { addDarkTiles } from '../services/mapUtils';
import { 
  Zap, Battery, MapPin, ChevronLeft, ArrowRight, Loader2, CheckCircle2, 
  Clock, Navigation, Sparkles, ShieldCheck, Thermometer, Activity,
  Coins, Landmark, Share2, Globe, RefreshCw, AlertTriangle, Flame, Gauge,
  Cpu, X, Target, BarChart2, Radar, ArrowUpRight, Shield, Database,
  ArrowRightCircle, Wallet, Map as MapIcon, ArrowDownCircle, Info,
  Plus, Minus, Crosshair
} from 'lucide-react';
import { RiderProfile, SwapStation, Notification, User, DeliveryOrder, ErrandOrder, Order } from '../types';
import { omniApi } from '../services/api';
import { iotApi } from '../services/iotService';
import { awsPost } from '../services/awsClient';
import { LAMBDA_ROUTES } from '../services/awsConfig';
import { calculateTaskLogistics, TaskLogistics } from '../services/geminiService';

interface EnergyPortalProps {
  profile: RiderProfile;
  onClose: () => void;
  onUpdateRider: (profile: RiderProfile) => void;
  pushNotification: (title: string, message: string, type: Notification['type']) => void;
}

const EnergyPortal: React.FC<EnergyPortalProps> = ({ profile, onClose, onUpdateRider, pushNotification }) => {
  const [stations, setStations] = useState<SwapStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<SwapStation | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [predictedStats, setPredictedStats] = useState<{ rangeKm: number; efficiency: string; confidence: string; diagnostic: string } | null>(null);
  
  const [logisticsData, setLogisticsData] = useState<TaskLogistics | null>(null);
  const [isLoadingLogistics, setIsLoadingLogistics] = useState(false);

  // Map References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stationMarkersRef = useRef<L.Marker[]>([]);

  // Handshake Simulation
  const [handshakeStatus, setHandshakeStatus] = useState<'none' | 'requesting' | 'established'>('none');

  const bms = profile.telemetry;
  const isDedicated = !!profile.assignedBusinessId;

  const riderBrand = useMemo(() => {
    const model = profile.vehicleModel.toLowerCase();
    if (model.includes('roam')) return 'RoamAir';
    if (model.includes('ampersand')) return 'Ampersand';
    if (model.includes('kiri')) return 'Kiri EV';
    if (model.includes('spiro')) return 'Spiro';
    return 'Ampersand' as any;
  }, [profile.vehicleModel]);

  // Map Initialization
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-1.2863, 36.8172], 12);

      addDarkTiles(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Station Markers
  useEffect(() => {
    if (!mapInstanceRef.current || stations.length === 0) return;

    // Clear old markers
    stationMarkersRef.current.forEach(m => m.remove());
    stationMarkersRef.current = [];

    const bounds = L.latLngBounds([]);

    stations.forEach(stn => {
      const stationIcon = L.divIcon({
        className: 'station-node-icon',
        html: `<div class="relative w-8 h-8 group">
                 <div class="absolute inset-0 bg-emerald-500 rounded-lg animate-pulse opacity-20"></div>
                 <div class="relative w-8 h-8 bg-slate-900 border border-emerald-500 rounded-lg flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
                   <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]"></div>
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([stn.lat, stn.lng], { icon: stationIcon }).addTo(mapInstanceRef.current!);
      
      marker.on('click', () => {
        const element = document.getElementById(`station-card-${stn.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          initializeHandshake(stn);
        }
      });

      stationMarkersRef.current.push(marker);
      bounds.extend([stn.lat, stn.lng]);
    });

    if (stations.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stations]);

  useEffect(() => {
    const fetchMissionData = async () => {
      setIsLoadingLogistics(true);
      const orders: any[] = JSON.parse(localStorage.getItem('omniride-orders') || '[]');
      const errands: ErrandOrder[] = JSON.parse(localStorage.getItem('omniride-errands') || '[]');
      
      const activeBiz = orders.filter(o => (o.riderId === profile.id || o.allocatedRiderId === profile.id) && o.status !== 'delivered');
      const activeErrands = errands.filter(e => e.riderId === profile.id && e.status === 'active');

      const allActiveTasks = [...activeBiz, ...activeErrands];

      if (allActiveTasks.length > 0) {
        const data = await calculateTaskLogistics(allActiveTasks, profile);
        setLogisticsData(data);
      } else {
        setLogisticsData({ totalDistanceKm: 0, suggestedStation: "No Active Mission", rangeConfidence: "N/A", estimatedConsumptionKwh: 0 });
      }
      setIsLoadingLogistics(false);
    };
    fetchMissionData();
  }, [profile.id, profile.batteryStatus]);

  useEffect(() => {
    omniApi.getSwapStations().then(all => {
      setStations(all.filter(s => s.brand === riderBrand));
    });
  }, [riderBrand]);

  const nearestStation = useMemo(() => {
    if (stations.length === 0) return null;
    if (logisticsData?.suggestedStation) {
      const match = stations.find(s => s.name.toLowerCase().includes(logisticsData.suggestedStation.toLowerCase()));
      if (match) return match;
    }
    return stations[0]; 
  }, [stations, logisticsData]);

  const runPredictiveRange = async () => {
    setIsAiLoading(true);
    try {
      // Predictive range via AWS Lambda → Gemini
      const { data, error } = await awsPost<{ text: string }>(LAMBDA_ROUTES.AI_GENERATE, {
        prompt: `Analyze EV rider Thermal Matrix: Battery ${profile.batteryStatus}%, Temp ${bms.batteryTemp.toFixed(1)}C. Confirm if hardware swap required. Return JSON: { rangeKm: number, efficiency: string, confidence: string, diagnostic: string }`,
        responseFormat: 'json',
      });
      if (!error && data?.text) {
        try { setPredictedStats(JSON.parse(data.text)); } catch { throw new Error(); }
      } else throw new Error();
    } catch (e) {
      setPredictedStats({ 
        rangeKm: profile.batteryStatus * 1.5, 
        efficiency: "Optimized", 
        confidence: "Baseline",
        diagnostic: `Hardware swap not required at ${profile.batteryStatus}% with stable thermal profile.`
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    runPredictiveRange();
  }, [profile.batteryStatus, bms.batteryTemp]);

  const initializeHandshake = (station: SwapStation) => {
    setSelectedStation(station);
    setHandshakeStatus('requesting');
    setTimeout(() => setHandshakeStatus('established'), 2000);
  };

  const handleSwap = async () => {
    if (!selectedStation) return;
    if (!isDedicated && profile.totalEarnings < selectedStation.swapFee) {
       alert("Insufficient node wallet funds.");
       setHandshakeStatus('none');
       setSelectedStation(null);
       return;
    }
    setIsSwapping(true);
    const result = await omniApi.processSwapPayment(profile.id, selectedStation.id, selectedStation.swapFee, isDedicated);
    if (result.success) {
      setTimeout(() => {
        const updated = {
          ...profile,
          batteryStatus: 100,
          totalEarnings: isDedicated ? profile.totalEarnings : profile.totalEarnings - selectedStation.swapFee,
          telemetry: { ...profile.telemetry, batteryTemp: 26, swapCount: profile.telemetry.swapCount + 1, lastSwapTimestamp: Date.now() }
        };
        onUpdateRider(updated);
        setIsSwapping(false);
        setHandshakeStatus('none');
        setSelectedStation(null);
        pushNotification("Node Reset", "Energy handshake verified. Node at 100%.", "system");
      }, 2000);
    }
  };

  return (
    <div className="absolute inset-0 z-[250] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden text-white font-sans">
      {/* Header - Compact */}
      <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-xl border border-white/10 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white leading-none">Energy Hub</h2>
            <p className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
               <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse" /> Live Supply Chain Node
            </p>
          </div>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-emerald-500/20">
           {isDedicated ? 'Dedicated' : 'Standard'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pb-24">
        
        {/* SECTION 1: GRID MATRIX (MAP) - Compact height */}
        <div className="space-y-3">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em]">Infrastructure Matrix</h3>
              <span className="text-[7px] font-black text-emerald-400 uppercase px-2 py-0.5 bg-white/5 rounded-full">
                 {stations.length} Compatible Nodes
              </span>
           </div>

           <div className="relative h-[280px] md:h-[340px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group">
              <div ref={mapContainerRef} className="absolute inset-0 z-0" />
              <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                 <button onClick={() => mapInstanceRef.current?.zoomIn()} className="p-2.5 bg-black/60 backdrop-blur-xl rounded-lg border border-white/10 hover:bg-black transition"><Plus className="w-4 h-4" /></button>
                 <button onClick={() => mapInstanceRef.current?.zoomOut()} className="p-2.5 bg-black/60 backdrop-blur-xl rounded-lg border border-white/10 hover:bg-black transition"><Minus className="w-4 h-4" /></button>
                 <button onClick={() => nearestStation && mapInstanceRef.current?.setView([nearestStation.lat, nearestStation.lng], 15)} className="p-2.5 bg-emerald-500 rounded-lg shadow-xl text-black mt-1"><Crosshair className="w-4 h-4" /></button>
              </div>
           </div>
        </div>

        {/* SECTION 2: TRIP MATRIX & NEAREST POINT (ROW) - Compact cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-slate-900 p-5 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group">
              <Radar className="absolute -right-3 -top-3 w-20 h-20 text-cyan-400 opacity-5" />
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                       <p className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400">Current Trip Matrix</p>
                       <h3 className="text-base font-black">Consumption</h3>
                    </div>
                    <div className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 text-[10px] font-black">
                       {isLoadingLogistics ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Navigation className="w-3 h-3" />{logisticsData?.totalDistanceKm.toFixed(1)} KM</>}
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/40 p-2 rounded-xl text-center">
                       <p className="text-[6px] font-black text-gray-500 uppercase">Temp</p>
                       <p className="text-[11px] font-black text-white">{bms.batteryTemp.toFixed(0)}°</p>
                    </div>
                    <div className="bg-black/40 p-2 rounded-xl text-center">
                       <p className="text-[6px] font-black text-gray-500 uppercase">Eff.</p>
                       <p className="text-[11px] font-black text-emerald-400">{bms.efficiencyWhKm.toFixed(0)}</p>
                    </div>
                    <div className="bg-black/40 p-2 rounded-xl text-center">
                       <p className="text-[6px] font-black text-gray-500 uppercase">Range</p>
                       <p className="text-[11px] font-black text-blue-400">{predictedStats?.rangeKm.toFixed(0)}K</p>
                    </div>
                 </div>

                 <div className="p-2.5 bg-cyan-400/5 rounded-xl border border-cyan-400/10">
                    <p className="text-[8px] font-bold text-cyan-100 leading-tight uppercase line-clamp-2">
                       {predictedStats?.diagnostic || "Scanning Grid..."}
                    </p>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
              <div className="relative z-10">
                 <div className="flex justify-between items-center mb-4">
                    <div>
                       <h3 className="text-sm font-black text-white uppercase">Nearest Point</h3>
                       <p className="text-[7px] font-black text-gray-400 uppercase mt-1">Locator Active</p>
                    </div>
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10"><MapIcon className="w-4 h-4 text-cyan-400" /></div>
                 </div>

                 {nearestStation ? (
                   <div className="flex items-center gap-3 animate-in slide-in-from-left">
                      <div className="w-12 h-12 bg-emerald-500 text-black rounded-xl flex items-center justify-center shadow-lg shrink-0">
                         <Landmark className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                         <h4 className="font-black text-sm text-white truncate leading-tight">{nearestStation.name}</h4>
                         <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter mt-1 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {nearestStation.address}
                         </p>
                      </div>
                   </div>
                 ) : (
                    <p className="text-[9px] text-gray-500 italic uppercase">Scanning Sector...</p>
                 )}
              </div>
              
              <button 
                onClick={() => nearestStation && initializeHandshake(nearestStation)}
                disabled={handshakeStatus !== 'none' || isLoadingLogistics}
                className="relative z-10 w-full py-3 mt-5 bg-emerald-500 text-black rounded-xl font-black uppercase text-[8px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                 {handshakeStatus === 'none' ? <><Zap className="w-3 h-3 fill-current" /> Initialize Sync</> : <><Loader2 className="w-3 h-3 animate-spin" /> Node Handshake...</>}
              </button>
           </div>
        </div>

        {/* SECTION 3: COMPATIBLE NODES GRID - Compact */}
        <div className="space-y-3">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stations.map(station => (
                <button 
                  key={station.id}
                  id={`station-card-${station.id}`}
                  onClick={() => initializeHandshake(station)}
                  disabled={handshakeStatus !== 'none'}
                  className={`bg-slate-900 p-5 rounded-3xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden ${selectedStation?.id === station.id ? 'border-emerald-500 bg-black' : 'border-white/5 hover:border-white/10'}`}
                >
                   <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 ${station.isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                         <Landmark className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black text-white">${station.swapFee.toFixed(1)}</p>
                         <p className="text-[6px] font-black text-gray-500 uppercase">Fee</p>
                      </div>
                   </div>
                   <div>
                      <h4 className="font-black text-xs text-white truncate">{station.name}</h4>
                      <p className="text-[8px] font-bold text-gray-500 uppercase truncate mt-0.5">{station.address}</p>
                   </div>
                   <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-1">
                         <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                         <span className="text-[7px] font-black text-emerald-400 uppercase">{station.availableSlots} Slots</span>
                      </div>
                      <ArrowRightCircle className="w-3.5 h-3.5 text-gray-700" />
                   </div>
                </button>
              ))}
           </div>
        </div>

      </div>

      {/* FOOTER - Compact */}
      <div className="p-4 bg-slate-900 border-t border-white/5 flex items-center justify-center gap-6 opacity-30 shrink-0">
         <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-cyan-400" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Regional Ledger: Grid-Alpha</span>
         </div>
      </div>

      {/* MODAL (Not requested for change but ensures functionality remains) */}
      {(handshakeStatus === 'requesting' || handshakeStatus === 'established') && selectedStation && (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500">
           <div className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20"><Landmark className="w-5 h-5" /></div>
                    <div><h3 className="text-lg font-black text-white leading-none">Node Sync</h3><p className="text-[8px] font-black text-gray-500 uppercase mt-1">Sequence</p></div>
                 </div>
                 <button onClick={() => setHandshakeStatus('none')} className="p-2 hover:bg-white/5 rounded-full transition"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                 {handshakeStatus === 'requesting' ? (
                   <div className="text-center py-8 space-y-4">
                      <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Pinging {selectedStation.id}...</p>
                   </div>
                 ) : (
                   <div className="space-y-4 animate-in fade-in duration-700">
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2.5">
                        <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl"><p className="text-[9px] font-black text-white uppercase">Base Fee</p><p className="text-base font-black text-white">${(selectedStation.swapFee * 0.9).toFixed(1)}</p></div>
                        <div className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl"><p className="text-[9px] font-black text-white uppercase">Platform Fee</p><p className="text-base font-black text-indigo-400">${(selectedStation.swapFee * 0.1).toFixed(1)}</p></div>
                      </div>
                      <button onClick={handleSwap} disabled={isSwapping} className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                        {isSwapping ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Pay & Execute Swap'}
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EnergyPortal;
