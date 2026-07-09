
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Filter, 
  PieChart as PieIcon, 
  LineChart as LineIcon, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Activity,
  Layers,
  Zap,
  DollarSign,
  Maximize2,
  Settings2,
  RefreshCw,
  Database
} from 'lucide-react';
import { DashboardType, ReportWidget, AdminInternalUser } from '../types';
import { reportingApi, DashboardMetrics, FinancialRecord } from '../services/reportingService';

interface ReportingCenterProps {
  adminRole: string;
}

const ReportingCenter: React.FC<ReportingCenterProps> = ({ adminRole }) => {
  const [activeType, setActiveType] = useState<DashboardType>('User');
  const [isSpooling, setIsSpooling] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // TERRA-060: Live metrics from DynamoDB
  const [metrics, setMetrics]         = useState<DashboardMetrics | null>(null);
  const [financials, setFinancials]   = useState<FinancialRecord[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Custom Dashboard Widgets
  const [widgets, setWidgets] = useState<ReportWidget[]>([
    { id: '1', title: 'Live Fleet Utilization', visible: true, type: 'chart' },
    { id: '2', title: 'Carbon Offset vs Target', visible: true, type: 'chart' },
    { id: '3', title: 'Hourly Revenue Heatmap', visible: false, type: 'chart' },
    { id: '4', title: 'Top Performing Vendors', visible: true, type: 'table' }
  ]);

  // TERRA-060: Load live metrics on mount + refresh every 60s
  useEffect(() => {
    const load = async () => {
      setIsLoadingMetrics(true);
      const [m, f] = await Promise.all([
        reportingApi.getLiveDashboardMetrics(),
        reportingApi.spoolFinancialData('30d'),
      ]);
      setMetrics(m);
      setFinancials(f);
      setIsLoadingMetrics(false);
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = async () => {
    setIsSpooling(true);
    const data = await reportingApi.spoolFinancialData('current');
    reportingApi.generateCSV(data as unknown as Record<string, unknown>[], 'OpusAIMobility_Financial_Report');
    setIsSpooling(false);
  };

  const handleRefresh = async () => {
    setIsLoadingMetrics(true);
    const [m, f] = await Promise.all([
      reportingApi.getLiveDashboardMetrics(),
      reportingApi.spoolFinancialData('30d'),
    ]);
    setMetrics(m);
    setFinancials(f);
    setIsLoadingMetrics(false);
  };

  // TERRA-060: Render operational dashboard with real DynamoDB data
  const renderOperational = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Live / Cached indicator */}
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full ${metrics?.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {metrics?.isLive ? 'Live DynamoDB Data' : 'Cached Data'}
          {metrics?.lastRefreshed ? ` · Refreshed ${new Date(metrics.lastRefreshed).toLocaleTimeString()}` : ''}
        </span>
        <button onClick={handleRefresh} disabled={isLoadingMetrics} className="ml-auto p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoadingMetrics ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm h-28 animate-pulse bg-gray-50" />
          ))
        ) : (
          <>
            <MetricCard
              label="Total Revenue (All Time)"
              value={`${(metrics?.totalRevenue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              trend={`${(metrics?.revenueChange ?? 0) >= 0 ? '+' : ''}${(metrics?.revenueChange ?? 0).toFixed(1)}%`}
            />
            <MetricCard
              label="Total Trips"
              value={(metrics?.totalTrips ?? 0).toLocaleString()}
              trend={`${(metrics?.tripsChange ?? 0) >= 0 ? '+' : ''}${(metrics?.tripsChange ?? 0).toFixed(1)}%`}
            />
            <MetricCard
              label="Transaction Success Rate"
              value={`${(metrics?.successRate ?? 100).toFixed(2)}%`}
              trend={metrics?.successRate && metrics.successRate >= 95 ? '+Healthy' : '-Degraded'}
            />
          </>
        )}
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallMetric label="Total Orders"   value={isLoadingMetrics ? '—' : (metrics?.totalOrders ?? 0).toLocaleString()} icon={<Activity className="w-4 h-4 text-blue-500" />} />
        <SmallMetric label="Registered Users" value={isLoadingMetrics ? '—' : (metrics?.totalUsers ?? 0).toLocaleString()} icon={<Database className="w-4 h-4 text-indigo-500" />} />
        <SmallMetric label="Avg Order Value" value={isLoadingMetrics ? '—' : `${(metrics?.avgOrderValue ?? 0).toFixed(2)}`} icon={<DollarSign className="w-4 h-4 text-emerald-500" />} />
        <SmallMetric label="Data Source" value={metrics?.isLive ? 'DynamoDB' : 'Cache'} icon={<Zap className={`w-4 h-4 ${metrics?.isLive ? 'text-emerald-500' : 'text-yellow-500'}`} />} />
      </div>

      {/* TERRA-060: Real revenue chart from DynamoDB via terraai-reporting Lambda */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-black">Daily Revenue — DynamoDB Live</h3>
            <p className="text-xs font-bold text-gray-400 uppercase">
              {financials.length > 0
                ? `${financials[0].Date} → ${financials[financials.length - 1].Date} · ${financials.length} days`
                : 'Loading from omniride-transactions...'}
            </p>
          </div>
          <button className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition"><Maximize2 className="w-5 h-5 text-gray-400" /></button>
        </div>
        {isLoadingMetrics ? (
          <div className="h-64 bg-gray-50 rounded-3xl animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : (
          <div className="h-64 flex items-end gap-2 px-2">
            {(financials.length > 0 ? financials : Array.from({ length: 7 }, (_, i) => ({ Date: '', Gross: 10 + i * 5, Net: 0, Fees: 0, Carbon_Credits: 0 }))).map((rec, i) => {
              const maxGross = Math.max(...financials.map(r => r.Gross), 1);
              const pct = Math.round((rec.Gross / maxGross) * 100);
              return (
                <div key={i} className="flex-1 group relative cursor-pointer">
                  {/* Net bar (inner) */}
                  <div className="absolute bottom-0 w-full bg-emerald-400 rounded-t-lg opacity-70 transition-all"
                    style={{ height: `${Math.round((rec.Net / maxGross) * 100)}%` }} />
                  {/* Gross bar (outer) */}
                  <div className="relative w-full bg-blue-500 rounded-t-xl hover:bg-blue-600 transition-all" style={{ height: `${pct}%` }}>
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                      <p>${rec.Gross.toLocaleString()} gross</p>
                      <p className="text-emerald-400">${rec.Net.toLocaleString()} net</p>
                      <p className="text-gray-400">{rec.Date}</p>
                    </div>
                  </div>
                  <p className="text-[7px] text-center font-black text-gray-400 mt-1 truncate">{rec.Date?.slice(5) || ''}</p>
                </div>
              );
            })}
          </div>
        )}
        {/* Legend */}
        <div className="flex gap-6 mt-4 px-2">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /><span className="text-[10px] font-black text-gray-500 uppercase">Gross Revenue</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[10px] font-black text-gray-500 uppercase">Net Revenue</span></div>
        </div>
      </div>
    </div>
  );

  const renderEmbedded = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="bg-emerald-950 text-white p-8 rounded-[48px] shadow-xl relative overflow-hidden">
          <Zap className="absolute -right-8 -top-8 w-48 h-48 opacity-10 rotate-12" />
          <div className="relative z-10 space-y-6">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Environmental KPI</p>
                   <h2 className="text-3xl font-black mt-1">Impact Coefficient</h2>
                </div>
                <div className="px-4 py-2 bg-emerald-400/20 rounded-full border border-emerald-400/30 text-emerald-400 text-[10px] font-black">
                   OFF-SET SYNCED
                </div>
             </div>
             <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="space-y-1">
                   <p className="text-[10px] font-black opacity-60 uppercase">Carbon Neutrality</p>
                   <p className="text-2xl font-black">84.2%</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black opacity-60 uppercase">EV Adoption Rate</p>
                   <p className="text-2xl font-black">68.5%</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black opacity-60 uppercase">Grid Efficiency</p>
                   <p className="text-2xl font-black">92.1%</p>
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
             <h3 className="font-black text-lg flex items-center gap-2"><PieIcon className="w-5 h-5 text-emerald-600" /> Emission Distribution</h3>
             <div className="flex items-center justify-center py-8">
                <div className="w-40 h-40 rounded-full border-[12px] border-emerald-500 border-r-blue-500 border-b-gray-100 rotate-45 relative flex items-center justify-center">
                   <div className="rotate-[-45deg] text-center">
                      <p className="text-xl font-black">72%</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase">Green</p>
                   </div>
                </div>
             </div>
             <div className="space-y-2">
                <LegendRow color="bg-emerald-500" label="Renewable Electric" value="72%" />
                <LegendRow color="bg-blue-500" label="Hybrid Support" value="18%" />
                <LegendRow color="bg-gray-200" label="Third Party Fleet" value="10%" />
             </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
             <h3 className="font-black text-lg flex items-center gap-2"><LineIcon className="w-5 h-5 text-blue-600" /> Statistical Trajectory</h3>
             <div className="h-48 w-full">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                   <path d="M0,80 Q25,40 50,60 T100,20" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                   <path d="M0,80 Q25,40 50,60 T100,20 L100,100 L0,100 Z" fill="rgba(59, 130, 246, 0.1)" />
                </svg>
             </div>
             <p className="text-sm text-gray-500 font-medium italic">"Predictive analysis suggests a 12% increase in offset by Q3."</p>
          </div>
       </div>
    </div>
  );

  const renderCustom = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Settings2 className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-black text-indigo-900">Custom Workspace</h3>
                <p className="text-xs text-indigo-700 font-bold">Design your strategic overview</p>
             </div>
          </div>
          <button 
            onClick={() => setShowCustomizer(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            Manage Widgets
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {widgets.filter(w => w.visible).map(widget => (
            <div key={widget.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm min-h-[300px] flex flex-col group relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <h4 className="font-black text-lg">{widget.title}</h4>
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-black"><ChevronDown className="w-5 h-5" /></button>
               </div>
               <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-[32px]">
                  <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Render Module {widget.id}</p>
               </div>
               <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Navigation & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="flex bg-gray-100 p-1.5 rounded-[24px]">
          {(['User', 'Embedded', 'Custom'] as DashboardType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeType === type ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {type} Dashboard
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {adminRole === 'Super Admin' && (
            <button 
              onClick={handleExport}
              disabled={isSpooling}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {isSpooling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isSpooling ? 'Spooling...' : 'Export CSV'}
            </button>
          )}
          <button className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition"><Filter className="w-5 h-5 text-gray-400" /></button>
        </div>
      </div>

      {/* Main Reporting Area */}
      <div className="pb-32">
        {activeType === 'User' && renderOperational()}
        {activeType === 'Embedded' && renderEmbedded()}
        {activeType === 'Custom' && renderCustom()}
      </div>

      {/* Customizer Drawer Simulation */}
      {showCustomizer && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex justify-end animate-in fade-in duration-300">
           <div className="w-full max-w-md bg-white p-10 space-y-10 animate-in slide-in-from-right duration-500 h-full flex flex-col">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">Widget Library</h3>
                 <button onClick={() => setShowCustomizer(false)} className="p-2 hover:bg-gray-50 rounded-full transition"><ChevronDown className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto hide-scrollbar">
                 {widgets.map(w => (
                   <button 
                    key={w.id} 
                    onClick={() => setWidgets(prev => prev.map(item => item.id === w.id ? {...item, visible: !item.visible} : item))}
                    className={`w-full p-6 rounded-[32px] border-2 flex items-center justify-between transition-all ${w.visible ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                   >
                      <div className="text-left">
                         <p className={`font-black text-sm ${w.visible ? 'text-indigo-900' : 'text-gray-400'}`}>{w.title}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{w.type} module</p>
                      </div>
                      {w.visible ? <CheckCircle2 className="w-6 h-6 text-indigo-600" /> : <Layers className="w-6 h-6 text-gray-200" />}
                   </button>
                 ))}
              </div>
              <button onClick={() => setShowCustomizer(false)} className="w-full py-5 bg-black text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Update Workspace</button>
           </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, trend, invert = false }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-2 group hover:shadow-md transition-all">
     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
     <div className="flex justify-between items-baseline">
        <h4 className="text-3xl font-black text-gray-900">{value}</h4>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
          trend.startsWith('+') 
            ? (invert ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')
            : (invert ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')
        }`}>
           {trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
           {trend}
        </div>
     </div>
  </div>
);

// TERRA-060: Small metric tile for secondary stats row
const SmallMetric = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-base font-black text-gray-900">{value}</h4>
    </div>
  </div>
);

const LegendRow = ({ color, label, value }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
     <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-xs font-bold text-gray-700">{label}</span>
     </div>
     <span className="text-xs font-black text-gray-900">{value}</span>
  </div>
);

export default ReportingCenter;
