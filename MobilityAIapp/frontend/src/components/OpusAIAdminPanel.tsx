import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ShoppingBag, Package, Car, UtensilsCrossed, Bell, Settings,
  TrendingUp, DollarSign, Star, AlertCircle, CheckCircle, XCircle,
  Eye, EyeOff, RefreshCw, Search, ChevronDown, ChevronRight, BarChart2,
  Map, Truck, Bike, Clock, Shield, FileText, Download, Plus, Trash2, Edit
} from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
const OPUSAI_BASE = API_BASE + '/gograb';

// ── API helpers ────────────────────────────────────────────────────────────────
async function oaGet(path: string) {
  const r = await fetch(OPUSAI_BASE + path);
  const j = await r.json();
  return j.msg ?? j;
}
async function oaPost(path: string, body: object) {
  const r = await fetch(OPUSAI_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  return j.msg ?? j;
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Stats {
  totalUsers: number; totalRestaurants: number;
  totalFoodOrders: number; totalParcelOrders: number; totalTrips: number;
  activeRiders: number; pendingFoodOrders: number; completedTrips: number;
  totalRevenue: number;
}

type Tab = 'dashboard' | 'users' | 'restaurants' | 'food-orders' |
           'parcel-orders' | 'trips' | 'vehicles' | 'coupons' |
           'notifications' | 'settings' | 'content' | 'withdraw';

// ── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string; }> =
  ({ icon, label, value, color }) => (
  <div className={`bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4`}>
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  </div>
);

// ── Status Badge ───────────────────────────────────────────────────────────────
const Badge: React.FC<{ status: number | string }> = ({ status }) => {
  const map: Record<string | number, [string, string]> = {
    0: ['bg-yellow-900 text-yellow-300', 'Processing'],
    1: ['bg-blue-900 text-blue-300', 'Accepted'],
    2: ['bg-green-900 text-green-300', 'Completed'],
    3: ['bg-red-900 text-red-300', 'Cancelled'],
    active: ['bg-green-900 text-green-300', 'Active'],
    pending: ['bg-yellow-900 text-yellow-300', 'Pending'],
    approved: ['bg-green-900 text-green-300', 'Approved'],
    rejected: ['bg-red-900 text-red-300', 'Rejected'],
  };
  const [cls, label] = map[status] ?? ['bg-gray-700 text-gray-300', String(status)];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
};

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
const Dashboard: React.FC<{ stats: Stats | null; loading: boolean }> = ({ stats, loading }) => {
  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-green-400" size={32} /></div>;
  if (!stats) return <div className="text-gray-400 text-center py-16">Failed to load stats</div>;
  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-6">OpusAIMobility Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users size={20} className="text-white"/>} label="Total Users" value={stats.totalUsers} color="bg-blue-600"/>
        <StatCard icon={<UtensilsCrossed size={20} className="text-white"/>} label="Restaurants" value={stats.totalRestaurants} color="bg-orange-600"/>
        <StatCard icon={<ShoppingBag size={20} className="text-white"/>} label="Food Orders" value={stats.totalFoodOrders} color="bg-green-600"/>
        <StatCard icon={<Package size={20} className="text-white"/>} label="Parcel Orders" value={stats.totalParcelOrders} color="bg-purple-600"/>
        <StatCard icon={<Car size={20} className="text-white"/>} label="Total Trips" value={stats.totalTrips} color="bg-yellow-600"/>
        <StatCard icon={<Bike size={20} className="text-white"/>} label="Active Riders" value={stats.activeRiders} color="bg-cyan-600"/>
        <StatCard icon={<Clock size={20} className="text-white"/>} label="Pending Orders" value={stats.pendingFoodOrders} color="bg-red-600"/>
        <StatCard icon={<DollarSign size={20} className="text-white"/>} label="Total Revenue" value={"$" + stats.totalRevenue.toFixed(2)} color="bg-emerald-600"/>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><BarChart2 size={16} className="text-green-400"/> Platform Health</h3>
        <div className="space-y-2">
          {[
            { label: 'Order Completion Rate', value: stats.totalFoodOrders > 0 ? Math.round((stats.totalFoodOrders - stats.pendingFoodOrders) / stats.totalFoodOrders * 100) : 0 },
            { label: 'Trip Completion Rate', value: stats.totalTrips > 0 ? Math.round(stats.completedTrips / stats.totalTrips * 100) : 0 },
            { label: 'Rider Utilization', value: stats.activeRiders > 0 && stats.totalUsers > 0 ? Math.round(stats.activeRiders / stats.totalUsers * 100 * 10) : 0 },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="flex justify-between text-sm text-gray-400 mb-1"><span>{label}</span><span>{value}%</span></div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: value + '%' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Generic Table Tab ──────────────────────────────────────────────────────────
function TableTab<T extends Record<string, any>>({
  data, loading, columns, onAction, actionLabel, search
}: {
  data: T[]; loading: boolean;
  columns: { key: string; label: string; render?: (v: any, row: T) => React.ReactNode }[];
  onAction?: (row: T) => void; actionLabel?: string; search?: boolean;
}) {
  const [q, setQ] = useState('');
  const filtered = q ? data.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) : data;
  if (loading) return <div className="flex items-center justify-center h-48"><RefreshCw className="animate-spin text-green-400" size={24}/></div>;
  return (
    <div>
      {search !== false && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-green-500"/>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>{columns.map(c => <th key={c.key} className="px-4 py-3 text-left text-gray-400 font-medium">{c.label}</th>)}
            {onAction && <th className="px-4 py-3 text-left text-gray-400">Action</th>}</tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.slice(0, 100).map((row, i) => (
              <tr key={i} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3 text-gray-300 max-w-xs truncate">
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '—')}
                  </td>
                ))}
                {onAction && (
                  <td className="px-4 py-3">
                    <button onClick={() => onAction(row)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-500 transition-colors">
                      {actionLabel || 'Action'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={columns.length + (onAction ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">No data found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs mt-2">{filtered.length} records</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface Props { onClose: () => void; }

export default function OpusAIAdminPanel({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchStats = useCallback(async () => {
    setLoading(l => ({ ...l, dashboard: true }));
    try { setStats(await oaGet('/admin/stats')); } catch {}
    setLoading(l => ({ ...l, dashboard: false }));
  }, []);

  const fetchTab = useCallback(async (tab: Tab) => {
    const endpoints: Partial<Record<Tab, string>> = {
      users:          '/admin/users',
      restaurants:    '/admin/restaurants',
      'food-orders':  '/admin/food_orders',
      'parcel-orders':'/admin/parcel_orders',
      trips:          '/admin/trips',
      withdraw:       '/admin/withdraw_requests',
    };
    const ep = endpoints[tab];
    if (!ep || data[tab]) return;
    setLoading(l => ({ ...l, [tab]: true }));
    try {
      const result = await oaGet(ep);
      setData(d => ({ ...d, [tab]: Array.isArray(result) ? result : [] }));
    } catch {}
    setLoading(l => ({ ...l, [tab]: false }));
  }, [data]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (activeTab !== 'dashboard') fetchTab(activeTab); }, [activeTab, fetchTab]);

  const handleBlockUser = async (user: any) => {
    if (!window.confirm(`${user.active > 1 ? 'Unblock' : 'Block'} ${user.email}?`)) return;
    await oaPost(`/admin/user/${user.id}/block`, { block: user.active === 1 });
    setData(d => ({ ...d, users: [] }));
    fetchTab('users');
  };

  const handleBlockRestaurant = async (r: any) => {
    if (!window.confirm(`${r.block ? 'Unblock' : 'Block'} ${r.name}?`)) return;
    await oaPost(`/admin/restaurant/${r.id}/block`, { block: !r.block });
    setData(d => ({ ...d, restaurants: [] }));
    fetchTab('restaurants');
  };

  const handleApproveWithdraw = async (w: any) => {
    const approve = window.confirm(`Approve withdraw request of $${w.amount}?`);
    await oaPost(`/admin/withdraw/${w.id}`, { approve });
    setData(d => ({ ...d, withdraw: [] }));
    fetchTab('withdraw');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard',     label: 'Dashboard',     icon: <BarChart2 size={16}/> },
    { id: 'users',         label: 'Users',         icon: <Users size={16}/> },
    { id: 'restaurants',   label: 'Restaurants',   icon: <UtensilsCrossed size={16}/> },
    { id: 'food-orders',   label: 'Food Orders',   icon: <ShoppingBag size={16}/> },
    { id: 'parcel-orders', label: 'Parcel Orders', icon: <Package size={16}/> },
    { id: 'trips',         label: 'Trips',         icon: <Car size={16}/> },
    { id: 'withdraw',      label: 'Withdrawals',   icon: <DollarSign size={16}/> },
    { id: 'settings',      label: 'Settings',      icon: <Settings size={16}/> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} loading={!!loading.dashboard}/>;
      case 'users':
        return <TableTab
          data={data.users || []} loading={!!loading.users}
          columns={[
            { key: 'id',        label: 'ID',    render: v => <span className="font-mono text-xs">{String(v).slice(0,12)}…</span> },
            { key: 'firstName', label: 'Name',  render: (_,r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName || '—' },
            { key: 'email',     label: 'Email'  },
            { key: 'phone',     label: 'Phone'  },
            { key: 'role',      label: 'Role',  render: v => <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full text-xs">{v}</span> },
            { key: 'active',    label: 'Status',render: v => v > 1 ? <Badge status="rejected"/> : <Badge status="active"/> },
            { key: 'wallet',    label: 'Wallet',render: v => `$${parseFloat(v || 0).toFixed(2)}` },
            { key: 'createdAt', label: 'Joined',render: v => v ? new Date(v).toLocaleDateString() : '—' },
          ]}
          onAction={handleBlockUser}
          actionLabel="Toggle Block"
        />;
      case 'restaurants':
        return <TableTab
          data={data.restaurants || []} loading={!!loading.restaurants}
          columns={[
            { key: 'id',           label: 'ID',        render: v => <span className="font-mono text-xs">{String(v).slice(0,12)}…</span> },
            { key: 'name',         label: 'Name'       },
            { key: 'deliveryFee',  label: 'Del. Fee',  render: v => `$${v || 0}` },
            { key: 'minOrderPrice',label: 'Min Order', render: v => `$${v || 0}` },
            { key: 'adminCommission',label:'Commission',render: v => `${v || 0}%` },
            { key: 'block',        label: 'Status',    render: v => v ? <Badge status={3}/> : <Badge status="active"/> },
            { key: 'view',         label: 'Views'      },
          ]}
          onAction={handleBlockRestaurant}
          actionLabel="Toggle Block"
        />;
      case 'food-orders':
        return <TableTab
          data={data['food-orders'] || []} loading={!!loading['food-orders']}
          columns={[
            { key: 'id',           label: 'Order ID',  render: v => <span className="font-mono text-xs">{String(v).slice(0,14)}…</span> },
            { key: 'userId',       label: 'User'       },
            { key: 'restaurantId', label: 'Restaurant' },
            { key: 'price',        label: 'Price',     render: v => `$${parseFloat(v||0).toFixed(2)}` },
            { key: 'status',       label: 'Status',    render: v => <Badge status={v}/> },
            { key: 'delivery',     label: 'Type',      render: v => v ? 'Delivery' : 'Pickup' },
            { key: 'createdAt',    label: 'Date',      render: v => v ? new Date(v).toLocaleDateString() : '—' },
          ]}
        />;
      case 'parcel-orders':
        return <TableTab
          data={data['parcel-orders'] || []} loading={!!loading['parcel-orders']}
          columns={[
            { key: 'id',          label: 'Order ID',  render: v => <span className="font-mono text-xs">{String(v).slice(0,14)}…</span> },
            { key: 'userId',      label: 'User'       },
            { key: 'senderName',  label: 'Sender'     },
            { key: 'receiverName',label: 'Receiver'   },
            { key: 'total',       label: 'Total',     render: v => `$${parseFloat(v||0).toFixed(2)}` },
            { key: 'status',      label: 'Status',    render: v => <Badge status={v}/> },
            { key: 'createdAt',   label: 'Date',      render: v => v ? new Date(v).toLocaleDateString() : '—' },
          ]}
        />;
      case 'trips':
        return <TableTab
          data={data.trips || []} loading={!!loading.trips}
          columns={[
            { key: 'id',             label: 'Trip ID',  render: v => <span className="font-mono text-xs">{String(v).slice(0,14)}…</span> },
            { key: 'userId',         label: 'Rider'     },
            { key: 'driverId',       label: 'Driver'    },
            { key: 'pickupLocation', label: 'Pickup',   render: v => <span className="max-w-[120px] truncate block">{v||'—'}</span> },
            { key: 'endRide',        label: 'Complete', render: v => v ? <CheckCircle size={14} className="text-green-400"/> : <Clock size={14} className="text-yellow-400"/> },
            { key: 'createdAt',      label: 'Date',     render: v => v ? new Date(v).toLocaleDateString() : '—' },
          ]}
        />;
      case 'withdraw':
        return <TableTab
          data={data.withdraw || []} loading={!!loading.withdraw}
          columns={[
            { key: 'id',        label: 'ID',     render: v => <span className="font-mono text-xs">{String(v).slice(0,14)}…</span> },
            { key: 'userId',    label: 'User'    },
            { key: 'amount',    label: 'Amount', render: v => `$${parseFloat(v||0).toFixed(2)}` },
            { key: 'status',    label: 'Status', render: v => <Badge status={v}/> },
            { key: 'createdAt', label: 'Date',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
          ]}
          onAction={handleApproveWithdraw}
          actionLabel="Approve/Reject"
        />;
      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg">OpusAIMobility Platform Settings</h2>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">OpusAIMobility API Base</span>
                <span className="text-green-400 text-sm font-mono">{OPUSAI_BASE}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">DynamoDB Tables</span>
                <span className="text-blue-400 text-sm">23 tables migrated</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Source Database</span>
                <span className="text-gray-400 text-sm">qboxus_gograb (MySQL 5.7)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Migration Status</span>
                <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle size={14}/> Complete</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-3">Migrated Tables</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                {['gograb-users','gograb-restaurants','gograb-restaurant-menus',
                  'gograb-restaurant-menu-items','gograb-food-orders','gograb-parcel-orders',
                  'gograb-trips','gograb-requests','gograb-vehicles','gograb-vehicle-types',
                  'gograb-ride-types','gograb-coupons','gograb-food-categories',
                  'gograb-package-sizes','gograb-good-types','gograb-notifications',
                  'gograb-driver-ratings','gograb-transactions','gograb-user-documents',
                  'gograb-service-charges','gograb-html-pages','gograb-withdraw-requests',
                  'gograb-app-config'].map(t => (
                  <div key={t} className="flex items-center gap-1">
                    <CheckCircle size={10} className="text-green-400 flex-shrink-0"/>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <div className="text-gray-400 text-center py-16">Coming soon</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-white"/>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">OpusAIMobility Admin Portal</h1>
              <p className="text-gray-400 text-xs">Migrated from PHP/MySQL → DynamoDB · OpusAIMobility Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <XCircle size={20}/>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-52 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
            <nav className="p-3 space-y-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    activeTab === t.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}>
                  {t.icon}<span>{t.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
