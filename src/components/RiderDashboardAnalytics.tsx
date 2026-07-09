
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Zap, Activity, Battery, Leaf, ShieldCheck, Globe, 
  Timer, ChevronLeft, ArrowUpRight, Info, Smartphone, Cpu, RefreshCw, 
  Award, History, Bike, Package, Clock, CheckCircle2, AlertCircle, Gauge, 
  Thermometer, ShieldAlert, Flame, Wind, MousePointer2, Rocket, Loader2, 
  Sparkles, X, ArrowRight, Link, Target, Trophy, Building2, 
  Users, TrendingDown, Star, MessageSquare, ArrowUp, ZapOff, Search,
  Maximize2, Filter, Calendar
} from 'lucide-react';
import { RiderProfile, TelemetryData, RiderJobHistoryItem, LeaderboardRank } from '../types';
import { iotApi } from '../services/iotService';
import { awsPost } from '../services/awsClient';
import { LAMBDA_ROUTES } from '../services/awsConfig';
import { syncService } from '../services/syncService'; // TERRA-070
import { useRiderNotifications, useEnergyTelemetry } from '../services/wsService'; // TERRA-011

interface RiderDashboardAnalyticsProps {
  profile: RiderProfile;
  onClose: () => void;
  onNavigateToEnergyHub?: () => void;
}

const RiderDashboardAnalytics: React.FC<RiderDashboardAnalyticsProps> = ({ profile, onClose, onNavigateToEnergyHub }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [completedMissions, setCompletedMissions] = useState<any[]>([]);

  // TERRA-011: Live notification toast state
  const [toastQueue, setToastQueue] = useState<{ id: number; title: string; body: string; type: string }[]>([]);
  const toastCounterRef = React.useRef(0);

  // TERRA-011: Real-time notifications via WebSocket
  const { latest: latestNotif, isConnected: wsConnected } = useRiderNotifications(profile.id);

  // Show toast when a new notification arrives
  React.useEffect(() => {
    if (!latestNotif) return;
    const toast = { id: ++toastCounterRef.current, title: latestNotif.title, body: latestNotif.body, type: latestNotif.type };
    setToastQueue(prev => [toast, ...prev].slice(0, 3)); // max 3 visible toasts
    const timer = setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== toast.id));
    }, 5_000);
    return () => clearTimeout(timer);
  }, [latestNotif]);

  // Helpers for time-based filtering
  const isToday = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    return date.getTime() >= startOfWeek.getTime();
  };

  // TERRA-070: Fetch missions from DynamoDB via syncService (with localStorage fallback)
  useEffect(() => {
    const fetchMissions = async () => {
      const [orders, errands, trips] = await Promise.all([
        syncService.getOrders(profile.id),
        syncService.getErrands(profile.id),
        syncService.getTrips(profile.id),
      ]);

      const all = [
        ...(orders as any[]).filter((o) => (o.riderId === profile.id || o.allocatedRiderId === profile.id) && o.status === 'delivered')
          .map((o) => ({ ...o, type: o.restaurantName ? 'Food' : 'Delivery', timestamp: o.timestamp, amount: o.total || o.fee })),
        ...(errands as any[]).filter((e) => e.riderId === profile.id && e.status === 'completed')
          .map((e) => ({ ...e, type: 'Errand', timestamp: e.timestamp, amount: (e.baseFee + e.shoppingTotal) })),
        ...(trips as any[]).filter((t) => t.riderId === profile.id && t.status === 'completed')
          .map((t) => ({ ...t, type: 'Ride', timestamp: t.timestamp, amount: t.price }))
      ].sort((a, b) => b.timestamp - a.timestamp);

      setCompletedMissions(all);
    };

    fetchMissions();
    const interval = setInterval(fetchMissions, 8000); // reduced polling — DynamoDB calls
    return () => clearInterval(interval);
  }, [profile.id]);

  // Daily Cumulative Totals
  const dailyStats = useMemo(() => {
    const todayMissions = completedMissions.filter(m => isToday(m.timestamp));
    return {
      earnings: todayMissions.reduce((sum, m) => sum + (m.amount || 0), 0),
      distance: todayMissions.reduce((sum, m) => sum + (m.distanceKm || (5 + Math.random() * 5)), 0),
      energy: todayMissions.reduce((sum, m) => sum + (m.energyConsumedKwh || (m.distanceKm ? m.distanceKm * 0.045 : 0.25)), 0)
    };
  }, [completedMissions]);

  // Weekly Cumulative Totals
  const weeklyStats = useMemo(() => {
    const weeklyMissions = completedMissions.filter(m => isThisWeek(m.timestamp));
    return {
      earnings: weeklyMissions.reduce((sum, m) => sum + (m.amount || 0), 0),
      distance: weeklyMissions.reduce((sum, m) => sum + (m.distanceKm || (5 + Math.random() * 5)), 0),
      energy: weeklyMissions.reduce((sum, m) => sum + (m.energyConsumedKwh || (m.distanceKm ? m.distanceKm * 0.045 : 0.25)), 0)
    };
  }, [completedMissions]);

  const dailyTarget = 150.00;
  const dailyProgress = Math.min(100, (dailyStats.earnings / dailyTarget) * 100);

  const weeklyTarget = 850.00;
  const weeklyProgress = Math.min(100, (weeklyStats.earnings / weeklyTarget) * 100);

  const userRank = profile.currentRank || 34;

  const filteredLogs = useMemo(() => {
    return completedMissions.filter(log => 
      log.id.toLowerCase().includes(logSearch.toLowerCase()) || 
      log.type.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [completedMissions, logSearch]);

  const leaderboard: LeaderboardRank[] = [
    { rank: 1, name: "Dominic K.", rides: 142, distanceKm: 840, energySavedKwh: 42, rating: 5.0, earnings: 920.50, isCorporatePartner: true },
    { rank: 2, name: "Sarah M.", rides: 138, distanceKm: 790, energySavedKwh: 38, rating: 4.9, earnings: 880.00 },
    { rank: 3, name: "John P.", rides: 125, distanceKm: 760, energySavedKwh: 35, rating: 4.8, earnings: 810.20, isCorporatePartner: true },
    { rank: 4, name: "Grace L.", rides: 118, distanceKm: 710, energySavedKwh: 31, rating: 5.0, earnings: 750.50 },
    { rank: 5, name: "Alex R.", rides: 110, distanceKm: 680, energySavedKwh: 29, rating: 4.7, earnings: 710.00 },
    { rank: 6, name: "Fatuma O.", rides: 105, distanceKm: 650, energySavedKwh: 27, rating: 4.8, earnings: 680.00 },
    { rank: 7, name: "Brian K.", rides: 102, distanceKm: 630, energySavedKwh: 25, rating: 4.6, earnings: 650.00 },
    { rank: 8, name: "Mercy J.", rides: 98, distanceKm: 600, energySavedKwh: 24, rating: 4.9, earnings: 620.00 },
    { rank: 9, name: "David M.", rides: 95, distanceKm: 580, energySavedKwh: 22, rating: 4.7, earnings: 600.00 },
    { rank: 10, name: "Jane D.", rides: 90, distanceKm: 550, energySavedKwh: 20, rating: 5.0, earnings: 580.00 },
  ];

  // TERRA-011: Live IoT energy telemetry via WebSocket (real-time, replaces polling)
  const { frame: energyFrame, isConnected: iotWsConnected } = useEnergyTelemetry(
    profile.vehicleRegNo || profile.id,
    profile.id,
  );

  // Note: energyFrame only carries batteryPct/chargeRateKw/rangeKm/chargingStatus.
  // Full TelemetryData (motorTemp etc.) is still fetched via iotApi REST fallback.

  // REST polling for full TelemetryData (motor temp, brake wear, etc.)
  useEffect(() => {
    const fetchIoT = async () => {
      const data = await iotApi.getLiveTelemetry();
      setTelemetry(data);
    };
    fetchIoT();
    const interval = setInterval(fetchIoT, 8000);
    return () => clearInterval(interval);
  }, []);

  const runGrowthAI = async () => {
    if (!telemetry) return;
    setIsAiRunning(true);
    try {
      // Growth AI — routed via AWS Lambda → Gemini
      const { data, error } = await awsPost<{ text: string }>(LAMBDA_ROUTES.AI_GENERATE, {
        prompt: `Analyze Rider #${userRank}: Daily ${dailyStats.earnings.toFixed(2)}, Weekly ${weeklyStats.earnings.toFixed(2)}, Efficiency ${telemetry.efficiencyWhKm.toFixed(1)} Wh/km. Suggest 3 improvements as bullet points.`,
        responseFormat: 'text',
      });
      if (!error && data?.text) setAiSuggestions(data.text);
      else throw new Error();
    } catch (e) {
      setAiSuggestions("Maximize efficiency by smoothing acceleration. Refer a corporate client for a $50 bounty.");
    } finally {
      setIsAiRunning(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[250] bg-[#020617] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden text-white font-sans">
      {/* TERRA-011: Toast notification overlay */}
      <div className="absolute top-20 right-4 z-[600] space-y-2 pointer-events-none">
        {toastQueue.map(toast => (
          <div key={toast.id} className="bg-slate-800 border border-white/10 rounded-2xl p-3 shadow-2xl w-72 animate-in slide-in-from-right duration-300 pointer-events-auto">
            <div className="flex items-start gap-2.5">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-400' :
                toast.type === 'warning' ? 'bg-amber-400' :
                toast.type === 'error'   ? 'bg-red-400'   : 'bg-cyan-400'
              } animate-pulse`} />
              <div>
                <p className="text-xs font-black text-white leading-tight">{toast.title}</p>
                <p className="text-[10px] font-medium text-gray-400 mt-0.5 leading-tight">{toast.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header - Compact */}
      <div className="p-4 bg-slate-900/50 border-b border-white/5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition border border-white/10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white leading-none">Fleet Telemetry Active</h2>
            <p className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
               <div className={`w-1 h-1 rounded-full ${iotWsConnected ? 'bg-cyan-500 animate-pulse' : 'bg-yellow-500'}`} />
               {iotWsConnected ? 'IoT Live · ' : 'REST · '}Operational Node: {profile.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* TERRA-011: WS connection status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase border ${wsConnected ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-cyan-400 animate-pulse' : 'bg-red-400'}`} />
            {wsConnected ? 'LIVE' : 'Offline'}
          </div>
          <div className="bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 flex items-center gap-1.5">
             <Trophy className="w-3 h-3" /> Rank #{userRank}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pb-24">
        
        {/* ROW 1: HARDWARE INFRASTRUCTURE */}
        <div className="space-y-3">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em]">Hardware Infrastructure</h3>
              <span className="text-[7px] font-black text-emerald-400 uppercase px-2 py-0.5 bg-white/5 rounded-full border border-white/5">Live Grid Sync</span>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DiagnosticCard icon={Thermometer} label="Motor Node" value={`${telemetry?.motorTemp.toFixed(0) || '--'}°`} status="Optimal" color="text-emerald-400" />
              <DiagnosticCard icon={Battery} label="Cell Status" value={`${profile.batteryStatus}%`} status="Active" color="text-blue-400" />
              <DiagnosticCard icon={ShieldAlert} label="Brake Load" value={`${telemetry?.brakeWearStatus || '--'}%`} status="Safe" color="text-indigo-400" />
              <DiagnosticCard icon={Activity} label="Grid Sync" value="Verified" status="Secure" color="text-teal-400" />
           </div>
        </div>

        {/* ROW 2: DAILY & WEEKLY TARGETS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-5 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden group">
              <Target className="absolute -right-3 -top-3 w-24 h-24 opacity-5" />
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                       <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300">Daily Milestone</p>
                       <h3 className="text-base font-black">Earning Path</h3>
                    </div>
                    <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-xs font-black text-white">
                       ${dailyStats.earnings.toFixed(2)}
                    </div>
                 </div>
                 <div className="space-y-2.5">
                    <div className="flex justify-between items-end px-0.5">
                       <span className="text-[7px] font-black text-gray-500 uppercase">Progress to $150</span>
                       <span className="text-[10px] font-black text-indigo-400">{dailyProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
                       <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${dailyProgress}%` }} />
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <MiniMetric label="Path" value={`${dailyStats.distance.toFixed(0)}K`} />
                    <MiniMetric label="Energy" value={`${dailyStats.energy.toFixed(1)}`} />
                    <MiniMetric label="Eco" value={`${telemetry?.ecoScore || '--'}`} />
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-5 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
              <TrendingUp className="absolute -left-3 -bottom-3 w-20 h-20 opacity-5" />
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                       <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">Weekly Growth</p>
                       <h3 className="text-base font-black">Improvement</h3>
                    </div>
                    <div className="p-2 bg-emerald-50/10 text-emerald-500 rounded-lg">
                       <BarChart3 className="w-4 h-4" />
                    </div>
                 </div>
                 <div className="space-y-2.5">
                    <div className="flex justify-between items-end px-0.5">
                       <span className="text-[7px] font-black text-gray-400 uppercase">Total ${weeklyStats.earnings.toFixed(0)}</span>
                       <span className="text-[10px] font-black text-emerald-400">{weeklyProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
                       <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${weeklyProgress}%` }} />
                    </div>
                 </div>
                 <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl border border-white/5">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight">Unlock 2x Carbon multipliers at 100%.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ROW 3: GLOBAL GRID ELITE (TOP 10 FULL) & CORPORATE CATALYST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
           {/* Global Grid Elite - Full Top 10 List */}
           <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4 shadow-lg relative overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 mb-2 shrink-0">
                 <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20"><Trophy className="w-4 h-4" /></div>
                 <div>
                    <h3 className="text-sm font-black">Global Grid Elite</h3>
                    <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Full Sector Top 10 Nodes</p>
                 </div>
              </div>
              <div className="grid gap-2 overflow-y-auto hide-scrollbar flex-1">
                 {leaderboard.map((rider) => (
                   <div key={rider.rank} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5 transition-all group">
                      <div className="flex items-center gap-3">
                         <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[9px] ${
                           rider.rank === 1 ? 'bg-amber-500 text-black' : 
                           rider.rank === 2 ? 'bg-slate-300 text-black' : 
                           rider.rank === 3 ? 'bg-orange-400 text-black' : 
                           'bg-white/10 text-gray-400'
                         }`}>{rider.rank}</div>
                         <div>
                            <p className="font-black text-[11px] leading-none">{rider.name}</p>
                            <div className="flex gap-2 mt-1">
                               <span className="text-[7px] text-gray-500 uppercase">{rider.rides} Rides</span>
                               <span className="text-[7px] text-emerald-500 uppercase">{rider.energySavedKwh} kWh Offset</span>
                            </div>
                         </div>
                      </div>
                      <p className="font-black text-emerald-400 text-[11px]">${rider.earnings.toFixed(2)}</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Growth Protocol Catalyst - Same Length as Top 10 */}
           <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between">
              <Building2 className="absolute -right-3 -bottom-3 w-40 h-40 opacity-10 rotate-12 group-hover:rotate-45 transition-transform" />
              <div className="relative z-10 space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                       <span className="bg-white/20 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest w-fit border border-white/20 backdrop-blur-md">Growth Protocol</span>
                       <h3 className="text-xl font-black text-white leading-none mt-2">Corporate Catalyst</h3>
                    </div>
                    <div className="p-4 bg-white text-blue-700 rounded-2xl shadow-2xl font-black text-xl flex flex-col items-center">
                       <span className="text-[10px] opacity-60 uppercase font-black">Bonus</span>
                       $50
                    </div>
                 </div>
                 <p className="text-sm text-blue-100 font-medium leading-relaxed max-w-[90%]">Accelerate your rank by referring corporate partners. Guaranteed +10 position jump for every verified business onboarded.</p>
                 <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                       <p className="text-[8px] font-black uppercase text-blue-200">Current Referrals</p>
                       <p className="text-lg font-black text-white">08</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black uppercase text-blue-200">Bonus Pool</p>
                       <p className="text-lg font-black text-emerald-300">$400.00</p>
                    </div>
                 </div>
              </div>
              <div className="relative z-10 flex gap-2 mt-6">
                 <button className="flex-1 py-4 bg-white text-blue-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Initialize Hub</button>
                 <button className="p-4 bg-blue-600 text-white rounded-xl font-black active:scale-95 transition-all border border-blue-500 shadow-xl"><Users className="w-4 h-4" /></button>
              </div>
           </div>
        </div>

        {/* ROW 4: MISSION TRACES & AI COACH (Same Size as Above Row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
           {/* Mission Traces - Paired with Coach */}
           <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4 shadow-lg flex flex-col">
              <div className="flex justify-between items-end shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><History className="w-4 h-4" /></div>
                    <div><h3 className="text-sm font-black">Mission Traces</h3><p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Consumption mapping</p></div>
                 </div>
                 <button onClick={() => setShowLogsModal(true)} className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-[7px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Archive</button>
              </div>
              <div className="grid gap-3 flex-1 overflow-y-auto hide-scrollbar">
                 {completedMissions.slice(0, 5).map((mission, idx) => (
                   <div key={idx} className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-3 group hover:bg-white/[0.08] transition-all">
                     <div className="flex items-center gap-2.5">
                         <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-sm shadow-inner">
                           {mission.type === 'Ride' ? '🚗' : mission.type === 'Delivery' ? '📦' : '🏃'}
                         </div>
                         <div className="min-w-0">
                            <h4 className="font-black text-[11px] text-white truncate">{mission.type}</h4>
                            <p className="text-[7px] font-bold text-gray-400 uppercase">{new Date(mission.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2 pt-0.5">
                         <div className="p-1.5 bg-black/40 rounded-lg border border-white/5 text-center">
                            <p className="text-[6px] font-black text-gray-500 uppercase">Path</p>
                            <p className="text-[10px] font-black text-emerald-400">{(mission.distanceKm || 5).toFixed(1)}KM</p>
                         </div>
                         <div className="p-1.5 bg-black/40 rounded-lg border border-white/5 text-center">
                            <p className="text-[6px] font-black text-gray-500 uppercase">Payout</p>
                            <p className="text-[10px] font-black text-blue-400">${mission.amount.toFixed(2)}</p>
                         </div>
                     </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* AI Coach Center */}
           <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 flex flex-col shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles className="w-24 h-24 text-indigo-400" /></div>
              <div className="space-y-6 relative z-10 flex-1 flex flex-col">
                 <div className="flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg border border-indigo-400/20"><Cpu className="w-4 h-4" /></div>
                       <div><h3 className="text-sm font-black leading-none">AI Coach</h3><p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-1.5">Performance Optimizer</p></div>
                    </div>
                    <button onClick={runGrowthAI} disabled={isAiRunning} className="p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/10 shadow-lg">
                       {isAiRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <RefreshCw className="w-3.5 h-3.5 text-white" />}
                    </button>
                 </div>
                 <div className="flex-1 flex flex-col justify-center bg-black/30 p-6 rounded-2xl border border-white/5 mt-4">
                    {aiSuggestions ? (
                      <p className="text-[11px] font-medium text-gray-300 leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-bottom-2 duration-700">{aiSuggestions}</p>
                    ) : (
                      <div className="text-center space-y-3 opacity-40 py-10">
                         <Sparkles className="w-8 h-8 mx-auto text-gray-600" />
                         <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 text-center">Execute audit for Grid Strategy</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* ROW 5: GRID STATUS & AUTONOMY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-indigo-600 p-5 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <Activity className="absolute -right-3 -bottom-3 w-16 h-16 opacity-10 transition-transform group-hover:rotate-45" />
              <div className="relative z-10 space-y-1">
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-200">Your Grid Station</p>
                 <h3 className="text-2xl font-black tracking-tighter">#{userRank}</h3>
                 <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 mt-4">
                    <div className="flex justify-between items-center text-[7px] font-black uppercase text-indigo-100">
                       <span>Trend</span>
                       <div className="flex items-center gap-1 text-emerald-300"><ArrowUp className="w-2.5 h-2.5" /> 2 Positions</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="md:col-span-2 bg-slate-900 p-4 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-emerald-500 cursor-pointer" onClick={onNavigateToEnergyHub}>
              <div className="flex items-center gap-4 px-2">
                 <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                    <Zap className="w-5 h-5 fill-current" />
                 </div>
                 <div>
                    <h4 className="font-black text-sm uppercase tracking-tight text-white">Grid Autonomy Control</h4>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Manage Battery Node Hardware & Swap Sync</p>
                 </div>
              </div>
              <div className="bg-emerald-50 text-black p-2.5 rounded-xl group-hover:translate-x-1 transition-transform">
                 <ArrowRight className="w-4 h-4" />
              </div>
           </div>
        </div>

      </div>

      {/* FOOTER SIGNAL */}
      <div className="p-4 bg-slate-950 border-t border-white/5 flex items-center justify-center gap-6 shrink-0 z-20">
         <div className="flex items-center gap-1.5 opacity-40 group cursor-default">
            <Smartphone className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Firmware v2.4.5</span>
         </div>
         <div className="w-px h-3 bg-white/10" />
         <div className="flex items-center gap-1.5 opacity-40 group cursor-default">
            <ShieldCheck className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Protocol Secure</span>
         </div>
      </div>

      {showLogsModal && (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl shadow-inner border border-blue-500/20"><History className="w-6 h-6" /></div>
                    <div><h3 className="text-2xl font-black text-white tracking-tight">Trace Archive</h3><p className="text-[8px] font-black text-gray-500 uppercase mt-1">Operational Ledger history</p></div>
                 </div>
                 <button onClick={() => setShowLogsModal(false)} className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-all active:scale-95"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 bg-black/10 flex flex-col md:flex-row gap-4 border-b border-white/5">
                 <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input type="text" placeholder="Search mission ID, type, or node..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="w-full pl-11 pr-6 py-4 bg-white/5 rounded-2xl border-2 border-transparent focus:border-blue-500/50 outline-none text-xs font-bold placeholder:text-gray-600 transition-all" />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 hide-scrollbar space-y-3 bg-black/5">
                 {filteredLogs.length === 0 ? (
                   <div className="py-20 text-center opacity-20 italic">
                      <ZapOff className="w-12 h-12 mx-auto mb-3" />
                      <p className="font-black uppercase tracking-widest text-[10px]">No traces matched</p>
                   </div>
                 ) : (
                   filteredLogs.map((log, idx) => (
                      <div key={idx} className="p-4 bg-white/[0.03] rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xl transition-transform group-hover:scale-110 ${log.type === 'Ride' ? 'bg-blue-600/10 text-blue-400' : 'bg-emerald-600/10 text-emerald-400'}`}>{log.type === 'Ride' ? '🚗' : '📦'}</div>
                            <div>
                                <div className="flex items-center gap-2"><h4 className="font-black text-lg text-white">{log.type} Mission</h4><span className="text-[8px] font-black bg-white/5 text-gray-500 px-2 py-0.5 rounded uppercase">{log.id.split('-')[1]}</span></div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1"><Clock className="w-2.5 h-2.5 inline mr-1" /> {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-6">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-gray-600 uppercase mb-0.5">Payload</p>
                                <p className="text-sm font-black text-white">${log.amount.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black text-gray-600 uppercase mb-0.5">Path</p>
                                <p className="text-sm font-black text-emerald-400">{(log.distanceKm || 5).toFixed(1)} <span className="text-[8px] opacity-40 uppercase">KM</span></p>
                            </div>
                          </div>
                      </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const DiagnosticCard = ({ icon: Icon, label, value, status, color }: any) => (
  <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 space-y-2 group hover:border-white/20 transition-all shadow-lg">
     <div className="flex justify-between items-start">
        <div className={`p-2 bg-white/5 rounded-xl ${color} shadow-inner group-hover:rotate-12 transition-transform`}><Icon className="w-4 h-4" /></div>
        <span className={`text-[6px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5 text-gray-500`}>{status}</span>
     </div>
     <div className="pt-0.5">
        <h4 className="text-lg font-black text-white tracking-tighter leading-none">{value}</h4>
        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1.5">{label}</p>
     </div>
  </div>
);

const MiniMetric = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
     <p className="text-[6px] font-black text-gray-500 uppercase">{label}</p>
     <p className="text-[11px] font-black text-emerald-400 uppercase leading-none mt-1">{value}</p>
  </div>
);

export default RiderDashboardAnalytics;
