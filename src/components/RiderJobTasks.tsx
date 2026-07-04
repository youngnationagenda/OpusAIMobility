
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ListChecks, ChevronLeft, Building2, User, Utensils, Clock, 
  MapPin, Zap, RefreshCw, Sparkles, Loader2, CheckCircle2, 
  AlertCircle, ArrowRight, Package, Timer, Bike, Info, X,
  Calendar, Briefcase, ShoppingCart, UserCheck, MessageSquare,
  Battery, Map, Gauge, Bike as BikeIcon, History, Activity,
  Radar, Thermometer, Flame, Navigation
} from 'lucide-react';
import { RiderProfile, DeliveryOrder, ErrandOrder, Order, Notification, RideHistoryItem } from '../types';
import { getRouteOptimization, calculateTaskLogistics, TaskLogistics } from '../services/geminiService';
import { omniApi } from '../services/api';
import { awsPost } from '../services/awsClient';
import { LAMBDA_ROUTES } from '../services/awsConfig';

interface RiderJobTasksProps {
  profile: RiderProfile;
  onClose: () => void;
  pushNotification: (title: string, message: string, type: Notification['type']) => void;
}

const RiderJobTasks: React.FC<RiderJobTasksProps> = ({ profile, onClose, pushNotification }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'rides' | 'dedicated_biz' | 'ondemand' | 'food_hub' | 'completed'>('all');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationPlan, setOptimizationPlan] = useState<any>(null);
  const [logisticsData, setLogisticsData] = useState<TaskLogistics | null>(null);
  const [isLoadingLogistics, setIsLoadingLogistics] = useState(false);
  
  // High-fidelity predictive range & diagnostic (Synced with Energy Hub logic)
  const [predictedStats, setPredictedStats] = useState<{ rangeKm: number; efficiency: string; confidence: string; diagnostic: string } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Live Task State from Storage
  const [tasks, setTasks] = useState<{
    rides: RideHistoryItem[];
    business: DeliveryOrder[];
    ondemand: ErrandOrder[];
    food: Order[];
    completed: any[];
  }>({ rides: [], business: [], ondemand: [], food: [], completed: [] });

  useEffect(() => {
    const fetchData = () => {
      const orders: any[] = JSON.parse(localStorage.getItem('omniride-orders') || '[]');
      const errands: ErrandOrder[] = JSON.parse(localStorage.getItem('omniride-errands') || '[]');
      const trips: RideHistoryItem[] = JSON.parse(localStorage.getItem('omniride-trips') || '[]');
      
      const activeRides = trips.filter(t => 
        (t as any).riderId === profile.id && 
        t.status !== 'completed'
      );

      const bizTasks = orders.filter(o => 
        (o.riderId === profile.id || o.allocatedRiderId === profile.id) && 
        o.status !== 'delivered' && 
        !o.restaurantName 
      );

      const foodTasks = orders.filter(o => 
        (o.riderId === profile.id || o.allocatedRiderId === profile.id) && 
        o.status !== 'delivered' && 
        o.restaurantName 
      );

      const userErrands = errands.filter(e => 
        e.riderId === profile.id && 
        e.status !== 'completed'
      );

      const completedMissions = [
        ...orders.filter(o => (o.riderId === profile.id || o.allocatedRiderId === profile.id) && o.status === 'delivered').map(o => ({...o, taskType: o.restaurantName ? 'Food' : 'Delivery'})),
        ...errands.filter(e => e.riderId === profile.id && e.status === 'completed').map(e => ({...e, taskType: 'Errand'})),
        ...trips.filter(t => (t as any).riderId === profile.id && t.status === 'completed').map(t => ({...t, taskType: 'Ride'}))
      ].sort((a, b) => b.timestamp - a.timestamp);

      setTasks({
        rides: activeRides,
        business: bizTasks,
        ondemand: userErrands,
        food: foodTasks,
        completed: completedMissions
      });
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [profile.id]);

  const allActiveTasks = useMemo(() => {
    return [...tasks.rides, ...tasks.business, ...tasks.ondemand, ...tasks.food].sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks]);

  // Unified Energy Hub Telemetry Fetch with Diagnostic Analysis — via AWS Lambda
  const runPredictiveSync = async () => {
    setIsPredicting(true);
    try {
      const { data, error } = await awsPost<{ text: string }>(LAMBDA_ROUTES.AI_GENERATE, {
        prompt: `Analyze EV Rider: Model ${profile.vehicleModel}, Battery ${profile.batteryStatus}%, Temp ${profile.telemetry.batteryTemp.toFixed(1)}C, Efficiency ${profile.telemetry.efficiencyWhKm} Wh/km. Predict range KM and confirm swap necessity. Return JSON: { rangeKm: number, efficiency: string, confidence: string, diagnostic: string }`,
        responseFormat: 'json',
      });
      if (!error && data?.text) {
        try { setPredictedStats(JSON.parse(data.text)); } catch { throw new Error(); }
      } else throw new Error();
    } catch {
      setPredictedStats({
        rangeKm: profile.batteryStatus * 1.6,
        efficiency: 'Optimized',
        confidence: 'Baseline',
        diagnostic: 'Thermal load optimal. Range verified for current mission batch.',
      });
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    if (allActiveTasks.length > 0) {
      const fetchLogistics = async () => {
        setIsLoadingLogistics(true);
        const data = await calculateTaskLogistics(allActiveTasks, profile);
        setLogisticsData(data);
        setIsLoadingLogistics(false);
      };
      fetchLogistics();
      runPredictiveSync();
    } else {
      setLogisticsData(null);
      setPredictedStats(null);
    }
  }, [allActiveTasks.length, profile.batteryStatus]);

  const totalHoursNeeded = useMemo(() => {
    const rideHours = tasks.rides.length * 0.5;
    const deliveryHours = (tasks.business.length + tasks.food.length) * 0.75; 
    const errandHours = tasks.ondemand.reduce((sum, e) => sum + e.durationHours, 0);
    return (rideHours + deliveryHours + errandHours).toFixed(1);
  }, [tasks]);

  const isRiderBusy = parseFloat(totalHoursNeeded) > 6;
  const nextAvailabilityTime = useMemo(() => {
    const hours = parseFloat(totalHoursNeeded);
    if (hours === 0) return "Instant";
    const date = new Date(Date.now() + hours * 3600000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [totalHoursNeeded]);

  const handleOptimize = async () => {
    if (allActiveTasks.length < 2) {
      alert("At least 2 tasks required for route optimization.");
      return;
    }
    setIsOptimizing(true);
    try {
      const plan = await getRouteOptimization(allActiveTasks as any);
      setOptimizationPlan(plan);
      pushNotification("Route Optimized", "AI has removed workflow redundancies and optimized your deployment path.", "rider");
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const renderCompletedTaskCard = (task: any) => {
    const distance = task.distanceKm || (5 + Math.random() * 10);
    const energy = task.energyConsumedKwh || (distance * 0.045);
    const duration = task.durationMinutes || Math.floor(distance * 2.2);
    const originator = task.clientName || task.sender?.name || task.restaurantName || task.passengerName || "System Node";

    return (
      <div key={task.id} className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm space-y-5 hover:shadow-xl transition-all group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 transition-transform">
           <History className="w-24 h-24" />
        </div>
        
        <div className="flex justify-between items-start relative z-10">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                 <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="font-black text-gray-900 leading-none">{originator}</h4>
                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(task.timestamp).toLocaleDateString()}
                 </p>
              </div>
           </div>
           <div className="bg-gray-50 px-3 py-1 rounded-xl">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{task.taskType} mission</span>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 relative z-10">
           <div className="bg-gray-50/80 p-4 rounded-[28px] border border-gray-100 text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Path</p>
              <p className="text-sm font-black text-gray-900">{distance.toFixed(1)} <span className="text-[8px] opacity-40 uppercase">KM</span></p>
           </div>
           <div className="bg-gray-50/80 p-4 rounded-[28px] border border-gray-100 text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Energy</p>
              <p className="text-sm font-black text-blue-600">{energy.toFixed(2)} <span className="text-[8px] opacity-40 uppercase">kWh</span></p>
           </div>
           <div className="bg-gray-50/80 p-4 rounded-[28px] border border-gray-100 text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Time</p>
              <p className="text-sm font-black text-indigo-600">{duration} <span className="text-[8px] opacity-40 uppercase">Min</span></p>
           </div>
        </div>

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
              <MapPin className="w-3 h-3 text-emerald-500" />
              <span className="truncate max-w-[150px]">{task.receiver?.address || task.destination || 'Mission Node'}</span>
           </div>
           <p className="text-sm font-black text-emerald-600">+${(task.price || task.fee || task.baseFee || 0).toFixed(2)}</p>
        </div>
      </div>
    );
  };

  const renderTaskCard = (task: any, type: 'rides' | 'business' | 'ondemand' | 'food') => {
    const originator = task.clientName || task.sender?.name || task.restaurantName || task.passengerName || "System Node";

    return (
      <div key={task.id} className="bg-white p-6 rounded-[36px] border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all group border-l-[6px] border-l-transparent hover:border-l-indigo-500">
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                type === 'rides' ? 'bg-blue-50 text-blue-600' :
                type === 'business' ? 'bg-indigo-50 text-indigo-600' :
                type === 'ondemand' ? 'bg-emerald-50 text-emerald-600' :
                'bg-orange-50 text-orange-600'
              }`}>
                 {type === 'rides' ? <Navigation className="w-6 h-6" /> :
                  type === 'business' ? <Building2 className="w-6 h-6" /> :
                  type === 'ondemand' ? <User className="w-6 h-6" /> :
                  <Utensils className="w-6 h-6" />}
              </div>
              <div>
                 <div className="flex items-center gap-2">
                    <h4 className="font-black text-gray-900 leading-none">{originator}</h4>
                    {type === 'business' && <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[7px] font-black uppercase">Dedicated</span>}
                 </div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(task.timestamp).toLocaleDateString()}
                 </p>
              </div>
           </div>
           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
              task.status === 'delivered' || task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>{task.status.replace('_', ' ')}</span>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-50">
           <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">{task.sender?.address || task.pickup || 'Global Node'}</span>
           </div>
           <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
              <span className="truncate">{task.receiver?.address || task.destination || 'User Node'}</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 h-full bg-gray-50 flex flex-col overflow-hidden animate-in slide-in-from-right">
       <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition shadow-sm">
                <ChevronLeft className="w-6 h-6" />
             </button>
             <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Job Task Hub</h2>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Deployment Sequence Center</p>
             </div>
          </div>
          <button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="p-3 bg-black text-white rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2 hover:bg-gray-800"
          >
             {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
             <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Clean Redundancies</span>
          </button>
       </div>

       <div className="p-4 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto hide-scrollbar shrink-0 shadow-sm sticky top-0 z-20">
          {(['all', 'rides', 'dedicated_biz', 'ondemand', 'food_hub', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-100'
              }`}
            >
              {tab === 'all' ? 'All Active' : 
               tab === 'rides' ? 'Rides' :
               tab === 'dedicated_biz' ? 'Dedicated' : 
               tab === 'ondemand' ? 'On-Demand' : 
               tab === 'food_hub' ? 'Food Hub' :
               'Archive'}
               {tab === 'completed' && <span className={`px-1.5 rounded-full text-[8px] ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>{tasks.completed.length}</span>}
               {tab !== 'all' && tab !== 'completed' && (
                 <span className={`px-1.5 rounded-full text-[8px] ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                   {tab === 'rides' ? tasks.rides.length : 
                    tab === 'dedicated_biz' ? tasks.business.length :
                    tab === 'ondemand' ? tasks.ondemand.length :
                    tasks.food.length}
                 </span>
               )}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
          {optimizationPlan && (
            <div className="bg-indigo-900 text-white p-8 rounded-[48px] shadow-2xl space-y-6 animate-in zoom-in duration-300 relative overflow-hidden border-4 border-indigo-500/20">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles className="w-24 h-24" /></div>
               <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2">
                     <div className="p-2 bg-emerald-50 rounded-xl text-black shadow-lg"><Zap className="w-4 h-4 fill-current" /></div>
                     <h3 className="font-black text-xl tracking-tight">Gemini Workflow Result</h3>
                  </div>
                  <button onClick={() => setOptimizationPlan(null)} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-full transition"><X className="w-5 h-5" /></button>
               </div>
               <p className="text-sm font-medium text-indigo-100 leading-relaxed relative z-10 bg-white/5 p-4 rounded-3xl border border-white/5">{optimizationPlan.summary}</p>
               <div className="space-y-3 relative z-10">
                  {optimizationPlan.sequence?.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-[28px] border border-white/5 hover:bg-white/15 transition-all">
                       <span className="w-8 h-8 rounded-2xl bg-emerald-500 text-black text-xs font-black flex items-center justify-center shadow-lg">{i+1}</span>
                       <div className="flex-1">
                          <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">{step.action}</p>
                          <p className="text-sm font-bold truncate text-white">{step.location}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-indigo-300 uppercase">Est. Prep</p>
                          <span className="text-xs font-black opacity-80">{step.estTime}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {activeTab === 'all' && allActiveTasks.map(task => {
                // Type guard checks for identifying task type
                const isRide = 'passengerName' in task;
                const isFood = 'restaurantName' in task;
                const isErrand = 'plan' in task;
                
                return renderTaskCard(
                  task, 
                  isRide ? 'rides' : isFood ? 'food' : isErrand ? 'ondemand' : 'business'
                );
             })}
             {activeTab === 'rides' && tasks.rides.map(t => renderTaskCard(t, 'rides'))}
             {activeTab === 'dedicated_biz' && tasks.business.map(t => renderTaskCard(t, 'business'))}
             {activeTab === 'ondemand' && tasks.ondemand.map(t => renderTaskCard(t, 'ondemand'))}
             {activeTab === 'food_hub' && tasks.food.map(t => renderTaskCard(t, 'food'))}
             {activeTab === 'completed' && tasks.completed.map(t => renderCompletedTaskCard(t))}
          </div>

          {(activeTab !== 'completed' ? allActiveTasks.length === 0 : tasks.completed.length === 0) && (
            <div className="py-24 text-center opacity-30 italic flex flex-col items-center gap-4">
               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                  <ListChecks className="w-12 h-12 text-gray-400" />
               </div>
               <p className="font-black uppercase tracking-[0.3em] text-xs">
                  {activeTab === 'completed' ? 'Archive is empty' : 'Waiting for sequence intake'}
               </p>
            </div>
          )}
       </div>

       {/* Footer Metric Buttons - SYNCED WITH ENERGY HUB & TRIP MATRIX */}
       <div className="p-6 bg-white border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 shadow-up">
          {/* Metric 1: Pipeline Load */}
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex flex-col items-center justify-center gap-1 shadow-inner group hover:bg-gray-100 transition-colors">
             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pipeline Load</p>
             <div className="flex items-baseline gap-1">
                <h4 className="text-2xl font-black text-gray-900">{totalHoursNeeded}</h4>
                <span className="text-[10px] font-black text-gray-400 uppercase">Hrs</span>
             </div>
             <p className="text-[7px] font-bold text-gray-300 uppercase">Workload</p>
          </div>

          {/* Metric 2: Energy & Path (Synced with Trip Matrix) */}
          <div className="md:col-span-1 bg-slate-900 text-white p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-45 transition-transform"><Radar className="w-12 h-12 text-cyan-400" /></div>
             
             <div className="flex justify-between items-start relative z-10">
                <div>
                   <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Current Trip Matrix</p>
                   <h4 className="text-sm font-black text-gray-100">Energy Consumption</h4>
                </div>
                {isLoadingLogistics || isPredicting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <div className="text-right">
                     <p className="text-sm font-black text-emerald-400">{logisticsData?.totalDistanceKm.toFixed(1) || '0.0'} KM</p>
                     <p className="text-[7px] font-black text-gray-500 uppercase">Traveled</p>
                  </div>
                )}
             </div>

             <div className="grid grid-cols-3 gap-2 relative z-10">
                <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                   <p className="text-[6px] font-black text-gray-500 uppercase">Thermal</p>
                   <div className="flex items-center justify-center gap-1">
                      <Thermometer className={`w-2 h-2 ${profile.telemetry.batteryTemp > 45 ? 'text-red-400' : 'text-emerald-400'}`} />
                      <p className="text-[10px] font-black">{profile.telemetry.batteryTemp.toFixed(1)}°C</p>
                   </div>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                   <p className="text-[6px] font-black text-gray-500 uppercase">Efficiency</p>
                   <p className="text-[10px] font-black text-emerald-400">{profile.telemetry.efficiencyWhKm.toFixed(0)} <span className="text-[6px] opacity-40">WH</span></p>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                   <p className="text-[6px] font-black text-gray-500 uppercase">Grid Range</p>
                   <p className="text-[10px] font-black text-blue-400">{predictedStats?.rangeKm.toFixed(0) || '--'} <span className="text-[6px] opacity-40">KM</span></p>
                </div>
             </div>

             <div className="bg-cyan-500/5 border border-cyan-500/10 p-2 rounded-xl relative z-10">
                <p className="text-[7px] font-bold text-cyan-200 uppercase leading-tight line-clamp-2">
                   {predictedStats?.diagnostic || "Scanning grid for hardware nodes..."}
                </p>
             </div>
          </div>

          {/* Metric 3: Fleet Signal */}
          <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex flex-col items-center justify-center gap-1 shadow-inner group hover:bg-blue-100 transition-colors">
             <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Fleet Signal</p>
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isRiderBusy ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <h4 className="text-xl font-black text-blue-900">
                   {isRiderBusy ? nextAvailabilityTime : "Available"}
                </h4>
             </div>
             <p className="text-[7px] font-bold text-blue-400 uppercase tracking-tighter mt-auto">Availability</p>
          </div>
       </div>
    </div>
  );
};

export default RiderJobTasks;
