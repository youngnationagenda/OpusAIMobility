import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Search, 
  ChevronLeft, 
  Activity, 
  BarChart3, 
  Lock, 
  ShieldCheck, 
  Bike, 
  DollarSign, 
  Zap,
  CheckCircle2, 
  AlertCircle,
  History,
  Truck,
  Calendar,
  UserCheck,
  XCircle,
  Settings,
  Plus,
  RefreshCw,
  Globe,
  Leaf,
  SlidersHorizontal,
  Save,
  Trash2,
  PlusCircle,
  X,
  Cpu,
  Timer,
  Wallet,
  Loader2
} from 'lucide-react';
import { User as UserProfile, CollectionAccount, RideOption, Provider, PlatformSettings } from '../types';
import { auditApi } from '../services/auditService';
import { omniApi, PricingConfig } from '../services/api';
import { awsPost, awsGet } from '../services/awsClient'; // TERRA-061 bulk-action API

interface AdminInterfaceProps {
  onClose: () => void;
  adminUser: UserProfile;
}

type AdminTab = 'dashboard' | 'finance' | 'users' | 'fleet' | 'approvals' | 'audit' | 'settings' | 'settlement';
// TERRA-061: User management filter types
type UserRoleFilter   = 'all' | 'user' | 'rider' | 'vendor' | 'business' | 'admin';
type UserStatusFilter = 'all' | 'active' | 'pending' | 'suspended' | 'lead';

const AdminInterface: React.FC<AdminInterfaceProps> = ({ onClose, adminUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [managedUsers, setManagedUsers]   = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery]     = useState('');
  // TERRA-061: Advanced user management state
  const [roleFilter, setRoleFilter]       = useState<UserRoleFilter>('all');
  const [statusFilter, setStatusFilter]   = useState<UserStatusFilter>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  // TERRA-061: Confirmation modal + user detail drawer
  const [confirmModal, setConfirmModal] = useState<{ action: 'activate' | 'suspend' | 'delete'; userIds: string[] } | null>(null);
  const [detailUser, setDetailUser] = useState<UserProfile | null>(null);
  
  // Fleet & Pricing State
  const [fleetConfig, setFleetConfig] = useState<(RideOption & { active: boolean })[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({ baseFare: 0, perKmRate: 0, demandMultiplier: 1.0 });
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(omniApi.getPlatformSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  
  // New Asset Form
  const [newAsset, setNewAsset] = useState<Partial<RideOption>>({
    provider: 'RoamAir',
    type: '',
    price: 10.00,
    eta: 5,
    capacity: 4,
    icon: '🚗'
  });

  const [collectionAccount, setCollectionAccount] = useState(omniApi.getCollectionAccount());
  const [auditLogs, setAuditLogs] = useState<import('../types').AuditLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // TERRA-061: Pull from DynamoDB via Lambda, fall back to cache
      const { data } = await awsGet<UserProfile[]>('/users').catch(() => ({ data: null, error: null, fromCache: false }));
      const users = data ?? JSON.parse(localStorage.getItem('opusaimobility-users') || '[]');
      setManagedUsers(users);
      setFleetConfig(omniApi.getFleetConfig());
      setPricingConfig(omniApi.getPricingConfig());
      setPlatformSettings(omniApi.getPlatformSettings());
      setCollectionAccount(omniApi.getCollectionAccount());
      // Fetch audit logs async from Lambda/DynamoDB
      const logs = await auditApi.getLogs();
      setAuditLogs(logs);
    };
    fetchData();
  }, [activeTab]);

  // TERRA-061: Filtered + searched user list
  const filteredUsers = useMemo(() => {
    return managedUsers.filter(u => {
      const matchSearch = !searchQuery || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole   = roleFilter   === 'all' || u.role   === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [managedUsers, searchQuery, roleFilter, statusFilter]);

  // TERRA-061: Show confirmation modal before bulk action
  const requestBulkAction = (action: 'activate' | 'suspend' | 'delete') => {
    if (selectedUsers.size === 0) return;
    setConfirmModal({ action, userIds: Array.from(selectedUsers) });
  };

  // TERRA-061: Bulk actions — calls POST /users/bulk-action, updates local state
  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete', userIds: string[]) => {
    setConfirmModal(null);
    if (userIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      // Call POST /users/bulk-action API
      await awsPost('/users/bulk-action', { action, userIds });
    } catch { /* proceed with optimistic local update even if API fails */ }
    const updatedUsers = [...managedUsers];
    for (const userId of userIds) {
      const idx = updatedUsers.findIndex(u => u.id === userId);
      if (idx === -1) continue;
      if (action === 'delete') {
        updatedUsers.splice(idx, 1);
      } else {
        updatedUsers[idx] = { ...updatedUsers[idx], status: action === 'activate' ? 'active' : 'suspended' };
        omniApi.syncUser(updatedUsers[idx]);
        auditApi.logAction({
          userId: adminUser.id, userName: adminUser.name,
          action: action === 'activate' ? 'BULK_USER_ACTIVATED' : 'BULK_USER_SUSPENDED',
          target: userId,
          details: `Bulk ${action} applied to ${userIds.length} users`,
          severity: 'high',
        });
      }
    }
    setManagedUsers(updatedUsers);
    setSelectedUsers(new Set());
    setIsBulkLoading(false);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  // TERRA-061: Full user management tab render
  const renderUsers = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-20">
      {/* Filters bar */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        {/* Role filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all','user','rider','vendor','business','admin'] as UserRoleFilter[]).map(role => (
            <button key={role} onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === role ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
              {role}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-gray-200 hidden md:block" />
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all','active','pending','suspended'] as UserStatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[10px] font-black text-gray-400 uppercase">
          {filteredUsers.length} / {managedUsers.length} users
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedUsers.size > 0 && (
        <div className="bg-indigo-900 text-white p-5 rounded-[28px] flex items-center justify-between animate-in slide-in-from-top duration-300">
          <span className="text-sm font-black">{selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button onClick={() => requestBulkAction('activate')} disabled={isBulkLoading}
              className="px-5 py-2.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
              ✓ Activate All
            </button>
            <button onClick={() => requestBulkAction('suspend')} disabled={isBulkLoading}
              className="px-5 py-2.5 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
              ⏸ Suspend All
            </button>
            <button onClick={() => requestBulkAction('delete')} disabled={isBulkLoading}
              className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
              ✕ Delete All
            </button>
            <button onClick={() => setSelectedUsers(new Set())}
              className="px-5 py-2.5 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* User table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
          <button onClick={toggleSelectAll}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'}`}>
            {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 && <span className="text-white text-[10px]">✓</span>}
          </button>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex-1">User</span>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest w-24 text-center hidden md:block">Role</span>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest w-24 text-center hidden md:block">Status</span>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest w-28 text-center hidden lg:block">Joined</span>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest w-24 text-right">Actions</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="py-24 text-center opacity-30">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-black uppercase tracking-widest text-xs">No users match filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredUsers.map(user => (
              <div key={user.id} className={`px-8 py-5 flex items-center gap-4 hover:bg-gray-50 transition-all group ${selectedUsers.has(user.id) ? 'bg-indigo-50' : ''}`}>
                {/* Checkbox */}
                <button onClick={(e) => { e.stopPropagation(); toggleSelectUser(user.id); }}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${selectedUsers.has(user.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                  {selectedUsers.has(user.id) && <span className="text-white text-[10px]">✓</span>}
                </button>
                {/* Avatar + name — clicking opens detail drawer */}
                <button onClick={() => setDetailUser(user)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <img src={user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0" alt="" />
                  <div className="min-w-0">
                    <p className="font-black text-sm text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{user.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 truncate">{user.email}</p>
                  </div>
                </button>
                {/* Role badge */}
                <div className="w-24 text-center hidden md:block">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                    user.role === 'admin'    ? 'bg-red-100 text-red-600' :
                    user.role === 'rider'    ? 'bg-emerald-100 text-emerald-700' :
                    user.role === 'vendor'   ? 'bg-blue-100 text-blue-700' :
                    user.role === 'business' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{user.role}</span>
                </div>
                {/* Status badge */}
                <div className="w-24 text-center hidden md:block">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                    user.status === 'active'    ? 'bg-emerald-100 text-emerald-700' :
                    user.status === 'pending'   ? 'bg-amber-100 text-amber-700' :
                    user.status === 'suspended' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{user.status}</span>
                </div>
                {/* Joined */}
                <div className="w-28 text-center text-[10px] font-bold text-gray-400 hidden lg:block">
                  {new Date(user.joinedAt).toLocaleDateString()}
                </div>
                {/* Actions */}
                <div className="w-24 flex items-center justify-end gap-2">
                  {user.status === 'pending' && (
                    <button onClick={() => handleApproveUser(user.id)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors" title="Activate">
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {user.status === 'active' && (
                    <button onClick={() => {
                      const idx = managedUsers.findIndex(u => u.id === user.id);
                      if (idx > -1) {
                        const updated = [...managedUsers];
                        updated[idx] = { ...updated[idx], status: 'suspended' };
                        omniApi.syncUser(updated[idx]);
                        setManagedUsers(updated);
                      }
                    }} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors" title="Suspend">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button onClick={() => handleApproveUser(user.id)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Reactivate">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['active','pending','suspended'] as const).map(s => (
          <div key={s} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm text-center">
            <h3 className="text-2xl font-black text-gray-900">{managedUsers.filter(u => u.status === s).length}</h3>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{s}</p>
          </div>
        ))}
        <div className="bg-black text-white p-5 rounded-[28px] shadow-sm text-center">
          <h3 className="text-2xl font-black">{managedUsers.length}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Total Users</p>
        </div>
      </div>
    </div>
  );

  const handleApproveUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('opusaimobility-users') || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    if (index > -1) {
       users[index].status = 'active';
       localStorage.setItem('opusaimobility-users', JSON.stringify(users));
       // Sync approved status to DynamoDB via Lambda
       omniApi.syncUser(users[index]);
       auditApi.logAction({
          userId: adminUser.id,
          userName: adminUser.name,
          action: 'USER_ACTIVATED',
          target: userId,
          details: `Node credentials validated and activated for ${users[index].name}`,
          severity: 'medium'
       });
       setManagedUsers(users);
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      omniApi.updateFleetConfig(fleetConfig);
      omniApi.updatePricingConfig(pricingConfig);
      omniApi.updatePlatformSettings(platformSettings);
      auditApi.logAction({
        userId: adminUser.id,
        userName: adminUser.name,
        action: 'PLATFORM_CONFIG_UPDATED',
        target: 'Grid Settings',
        details: 'Fleet availability, pricing vectors, and settlement logic updated.',
        severity: 'high'
      });
      setIsSaving(false);
    }, 1000);
  };

  const toggleProvider = (id: string) => {
    setFleetConfig(prev => prev.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  const removeAsset = (id: string) => {
    setFleetConfig(prev => prev.filter(item => item.id !== id));
    auditApi.logAction({
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'ASSET_DECOMMISSIONED',
      target: id,
      details: 'Vehicle removed from global registry.',
      severity: 'medium'
    });
  };

  const handleAddAsset = () => {
    if (!newAsset.type || !newAsset.provider) return;
    const asset: RideOption & { active: boolean } = {
      id: 'custom_' + Math.random().toString(36).substr(2, 5),
      provider: newAsset.provider as Provider,
      type: newAsset.type,
      price: newAsset.price || 10,
      eta: newAsset.eta || 5,
      capacity: newAsset.capacity || 4,
      icon: newAsset.icon || '🚗',
      active: true
    };
    setFleetConfig(prev => [...prev, asset]);
    setShowAddAsset(false);
    setNewAsset({ provider: 'RoamAir', type: '', price: 10, eta: 5, capacity: 4, icon: '🚗' });
    auditApi.logAction({
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'NEW_ASSET_REGISTERED',
      target: asset.type,
      details: `Added ${asset.type} by ${asset.provider} to registry.`,
      severity: 'medium'
    });
  };

  const renderSettlement = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
       <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[28px] shadow-sm"><Cpu className="w-8 h-8" /></div>
                <div>
                   <h3 className="text-3xl font-black tracking-tight">Settlement Engine</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Automated First Charge Deductions</p>
                </div>
             </div>
             <button 
               onClick={handleSaveSettings}
               disabled={isSaving}
               className="px-10 py-4 bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
             >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Core Params</>}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                   <Timer className="w-5 h-5 text-orange-500" />
                   <h4 className="font-black text-xl">Deduction Schedule</h4>
                </div>
                <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Daily Settlement Time (24h)</label>
                      <input 
                        type="time" 
                        value={platformSettings.deductionTime} 
                        onChange={e => setPlatformSettings({...platformSettings, deductionTime: e.target.value})}
                        className="w-full p-4 bg-white rounded-2xl font-black text-2xl border-2 border-transparent focus:border-black outline-none" 
                      />
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                      <div>
                         <p className="text-sm font-black">Auto-Deduct Protocol</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">Enforce First Charge Priority</p>
                      </div>
                      <button 
                        onClick={() => setPlatformSettings({...platformSettings, autoSettlementEnabled: !platformSettings.autoSettlementEnabled})}
                        className={`w-14 h-7 rounded-full relative transition-all ${platformSettings.autoSettlementEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                         <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${platformSettings.autoSettlementEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                   <DollarSign className="w-5 h-5 text-emerald-600" />
                   <h4 className="font-black text-xl">Protocol Revenue</h4>
                </div>
                <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-1">System Weekly Subscription ($)</label>
                      <div className="relative">
                         <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                         <input 
                           type="number" 
                           value={platformSettings.systemWeeklyFee} 
                           onChange={e => setPlatformSettings({...platformSettings, systemWeeklyFee: parseFloat(e.target.value)})}
                           className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl font-black text-2xl border-2 border-transparent focus:border-black outline-none" 
                         />
                      </div>
                   </div>
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                         The weekly fee is prorated daily ($${(platformSettings.systemWeeklyFee / 7).toFixed(2)}/day) and added to the prioritized First Charge pool.
                      </p>
                   </div>
                </div>
             </div>
          </div>
       </div>

       <div className="p-8 bg-gray-900 rounded-[48px] text-white space-y-6 relative overflow-hidden">
          <History className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 -rotate-12" />
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-6 h-6 text-emerald-400" />
             <h3 className="text-xl font-black">Escrow Enforcement Node</h3>
          </div>
          <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-2xl">
             By setting the Daily Settlement Time, you authorize the system to sweep all 'Held' prioritized balances from active rider wallets. This ensures Asset Loan health and platform maintenance fees are collected before any withdrawals are permitted.
          </p>
       </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[28px] shadow-sm"><Leaf className="w-8 h-8" /></div>
             <div>
                <h3 className="text-3xl font-black tracking-tight">Grid Configuration</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Green Tech Fleet Management</p>
             </div>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => setShowAddAsset(true)}
               className="px-6 py-4 bg-gray-100 text-black rounded-[24px] font-black uppercase text-xs tracking-widest flex items-center gap-3 active:scale-95 transition-all"
             >
               <PlusCircle className="w-4 h-4" /> Add Asset
             </button>
             <button 
               onClick={handleSaveSettings}
               disabled={isSaving}
               className="px-10 py-4 bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
             >
               {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Grid</>}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
           {/* Pricing Section */}
           <div className="space-y-6">
              <div className="flex items-center gap-2 px-2">
                 <DollarSign className="w-5 h-5 text-indigo-600" />
                 <h4 className="font-black text-xl">Economic Controls</h4>
              </div>
              <div className="grid gap-6 p-8 bg-gray-50 rounded-[40px] border border-gray-100">
                 <div className="space-y-2">
                    <div className="flex justify-between">
                       <label className="text-[10px] font-black uppercase text-gray-400">Base Activation Fee ($)</label>
                       <span className="font-black text-indigo-600">${pricingConfig.baseFare.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" step="0.1" 
                      value={pricingConfig.baseFare} 
                      onChange={e => setPricingConfig({...pricingConfig, baseFare: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-600" 
                    />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between">
                       <label className="text-[10px] font-black uppercase text-gray-400">Per KM Network Rate ($)</label>
                       <span className="font-black text-indigo-600">${pricingConfig.perKmRate.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="5" step="0.05" 
                      value={pricingConfig.perKmRate} 
                      onChange={e => setPricingConfig({...pricingConfig, perKmRate: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-600" 
                    />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between">
                       <label className="text-[10px] font-black uppercase text-gray-400">Demand Multiplier (Surge)</label>
                       <span className="font-black text-indigo-600">{pricingConfig.demandMultiplier}x</span>
                    </div>
                    <input 
                      type="range" min="1" max="3" step="0.1" 
                      value={pricingConfig.demandMultiplier} 
                      onChange={e => setPricingConfig({...pricingConfig, demandMultiplier: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-600" 
                    />
                 </div>
              </div>
           </div>

           {/* Fleet List */}
           <div className="space-y-6">
              <div className="flex items-center gap-2 px-2">
                 <Zap className="w-5 h-5 text-emerald-600" />
                 <h4 className="font-black text-xl">Asset Inventory</h4>
              </div>
              <div className="grid gap-3 h-[400px] overflow-y-auto hide-scrollbar p-2">
                 {fleetConfig.map(ride => (
                   <div key={ride.id} className={`p-6 rounded-[32px] border-2 flex items-center justify-between transition-all ${ride.active ? 'bg-white border-emerald-500 shadow-md' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">{ride.icon}</div>
                         <div>
                            <p className="font-black text-gray-900 leading-none">{ride.type}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{ride.provider}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <button 
                           onClick={() => toggleProvider(ride.id)}
                           className={`w-14 h-7 rounded-full relative transition-all ${ride.active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                         >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${ride.active ? 'right-1' : 'left-1'}`} />
                         </button>
                         <button onClick={() => removeAsset(ride.id)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {showAddAsset && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="bg-white rounded-[48px] p-10 w-full max-w-lg space-y-8 shadow-2xl relative">
              <button onClick={() => setShowAddAsset(false)} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              <div className="space-y-1">
                 <h3 className="text-3xl font-black">Register Node</h3>
                 <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Deploy New Asset to Registry</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Provider Network</label>
                    <select value={newAsset.provider} onChange={e => setNewAsset({...newAsset, provider: e.target.value as Provider})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold">
                       {['RoamAir', 'YnaV1', 'Ampersand', 'Kiri EV', 'Spiro', 'BasiGo', 'SolarTaxis'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Vehicle Type</label>
                    <input type="text" placeholder="e.g. Moto XL" value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Asset Icon (Emoji)</label>
                    <input type="text" placeholder="🚗" value={newAsset.icon} onChange={e => setNewAsset({...newAsset, icon: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold text-center" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Base Price ($)</label>
                    <input type="number" value={newAsset.price} onChange={e => setNewAsset({...newAsset, price: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Capacity (Seats)</label>
                    <input type="number" value={newAsset.capacity} onChange={e => setNewAsset({...newAsset, capacity: parseInt(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" />
                 </div>
              </div>
              
              <button onClick={handleAddAsset} className="w-full py-5 bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Authorize Deployment</button>
           </div>
        </div>
      )}

      <div className="p-8 bg-blue-50 rounded-[40px] border border-blue-100 flex items-start gap-6">
         <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm"><ShieldCheck className="w-6 h-6" /></div>
         <div className="space-y-1">
            <p className="font-black text-blue-900">Governance Protocol</p>
            <p className="text-xs text-blue-700 font-medium leading-relaxed">System updates are propagated to all user terminals instantly upon save. Changes to the Green Tech Fleet inventory affect both the Consumer Map and the Corporate Dispatcher.</p>
         </div>
      </div>
    </div>
  );

  const renderApprovals = () => {
     const pending = managedUsers.filter(u => u.status === 'pending');
     return (
       <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-[28px] shadow-sm"><UserCheck className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Identity Vetting</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Node Authorizations</p>
                </div>
             </div>
             
             <div className="space-y-4">
                {pending.length === 0 ? (
                  <div className="py-24 text-center space-y-4 opacity-30">
                    <ShieldCheck className="w-20 h-20 mx-auto text-emerald-400" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">All network nodes verified</p>
                  </div>
                ) : (
                  pending.map(user => (
                    <div key={user.id} className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                       <div className="flex items-center gap-6">
                          <img src={user.profilePicture} className="w-20 h-20 rounded-[28px] object-cover border-4 border-white shadow-md" alt="" />
                          <div>
                             <h4 className="font-black text-xl text-gray-900 leading-none">{user.name}</h4>
                             <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{user.role}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered {new Date(user.joinedAt).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button className="px-6 py-3 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-500 hover:border-red-100 transition-all active:scale-95">Deny Access</button>
                          <button onClick={() => handleApproveUser(user.id)} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all">Authorize Node</button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
       </div>
     );
  };

  // ── TERRA-061: Confirmation modal for bulk actions ────────────────────────────
  const renderConfirmModal = () => {
    if (!confirmModal) return null;
    const { action, userIds } = confirmModal;
    const actionLabel = action === 'activate' ? 'Activate' : action === 'suspend' ? 'Suspend' : 'Delete';
    const actionColor = action === 'activate' ? 'bg-emerald-600' : action === 'suspend' ? 'bg-amber-500' : 'bg-red-600';
    return (
      <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4">
            <div className={`p-4 ${action === 'delete' ? 'bg-red-50 text-red-600' : action === 'suspend' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'} rounded-[24px]`}>
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Confirm {actionLabel}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Bulk Action Verification</p>
            </div>
          </div>
          <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-sm font-bold text-gray-700 leading-relaxed">
              You are about to <strong className="text-gray-900">{actionLabel.toLowerCase()}</strong> <strong className="text-indigo-700">{userIds.length} user{userIds.length !== 1 ? 's' : ''}</strong>.
              {action === 'delete' && ' This action cannot be undone.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setConfirmModal(null)}
              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all active:scale-95">
              Cancel
            </button>
            <button onClick={() => handleBulkAction(action, userIds)}
              className={`flex-1 py-4 ${actionColor} text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all`}>
              {actionLabel} {userIds.length} User{userIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── TERRA-061: User detail drawer ─────────────────────────────────────────────
  const renderUserDetailDrawer = () => {
    if (!detailUser) return null;
    const u = detailUser;
    return (
      <div className="fixed inset-0 z-[700] flex justify-end animate-in fade-in duration-200" onClick={() => setDetailUser(null)}>
        <div
          className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer header */}
          <div className="p-8 bg-gradient-to-br from-slate-900 to-indigo-900 text-white relative overflow-hidden">
            <button onClick={() => setDetailUser(null)} className="absolute top-6 right-6 p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mt-4">
              <img src={u.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                className="w-16 h-16 rounded-[24px] object-cover border-4 border-white/20 shadow-xl" alt="" />
              <div>
                <h2 className="text-xl font-black leading-none">{u.name}</h2>
                <p className="text-blue-200 text-xs font-bold mt-1">{u.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                    u.role === 'admin'    ? 'bg-red-100/20 text-red-300' :
                    u.role === 'rider'   ? 'bg-emerald-100/20 text-emerald-300' :
                    u.role === 'vendor'  ? 'bg-blue-100/20 text-blue-300' :
                    'bg-white/10 text-white/60'
                  }`}>{u.role}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                    u.status === 'active'    ? 'bg-emerald-100/20 text-emerald-300' :
                    u.status === 'suspended' ? 'bg-red-100/20 text-red-300' :
                    'bg-amber-100/20 text-amber-300'
                  }`}>{u.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer body */}
          <div className="p-8 space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-5 rounded-[28px] border border-gray-100 text-center">
                <p className="text-2xl font-black text-gray-900">{u.totalTrips}</p>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Trip History</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-[28px] border border-gray-100 text-center">
                <p className="text-2xl font-black text-gray-900">${u.walletBalance.toFixed(2)}</p>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Wallet Balance</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-[28px] border border-gray-100 text-center">
                <p className="text-2xl font-black text-gray-900">{u.paymentMethods?.length ?? 0}</p>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Device Tokens</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-[28px] border border-gray-100 text-center">
                <p className="text-2xl font-black text-gray-900">{u.rating.toFixed(1)}</p>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Rating</p>
              </div>
            </div>

            {/* Profile details */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Profile Details</h4>
              {[
                { label: 'User ID', value: u.id },
                { label: 'Phone', value: u.phone },
                { label: 'Joined', value: new Date(u.joinedAt).toLocaleDateString() },
                { label: 'Language', value: u.language?.toUpperCase() ?? 'EN' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-xs font-black text-gray-400 uppercase">{label}</span>
                  <span className="text-xs font-bold text-gray-900 text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                {u.status !== 'active' && (
                  <button onClick={() => { handleApproveUser(u.id); setDetailUser(null); }}
                    className="py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                    Activate User
                  </button>
                )}
                {u.status === 'active' && (
                  <button onClick={() => {
                    requestBulkAction('suspend');
                    setSelectedUsers(new Set([u.id]));
                    setDetailUser(null);
                  }}
                    className="py-3 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                    Suspend
                  </button>
                )}
                <button onClick={() => setDetailUser(null)}
                  className="py-3 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-[500] bg-gray-50 flex flex-col animate-in fade-in duration-300 overflow-hidden text-gray-900">
      <div className="flex h-full">
         <div className="w-80 bg-slate-950 text-white flex flex-col shrink-0 border-r border-white/5">
            <div className="p-10 space-y-1 border-b border-white/5 bg-black/20">
               <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center mb-6 shadow-2xl rotate-3">
                  <Shield className="w-8 h-8 text-white" />
               </div>
               <h1 className="text-2xl font-black tracking-tighter">OmniAdmin</h1>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Platform Command Node</p>
            </div>

            <div className="flex-1 p-8 space-y-2 overflow-y-auto hide-scrollbar">
               <SidebarLink icon={BarChart3} label="Terminal Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
               <SidebarLink icon={Settings} label="Grid Configuration" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
               <SidebarLink icon={Cpu} label="Settlement Engine" active={activeTab === 'settlement'} onClick={() => setActiveTab('settlement')} />
               <SidebarLink icon={UserCheck} label="Vetting Center" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} count={managedUsers.filter(u => u.status === 'pending').length} />
               <SidebarLink icon={Truck} label="Fleet Registry" active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
               <SidebarLink icon={DollarSign} label="Financial Ledger" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
               <SidebarLink icon={Users} label="Identity Hub" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
               <SidebarLink icon={History} label="Audit Protocol" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
            </div>

            <div className="p-8 bg-black border-t border-white/5">
               <button onClick={onClose} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Terminate Console</button>
            </div>
         </div>

         <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-12 py-10 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
               <h2 className="text-4xl font-black tracking-tighter capitalize">{activeTab.replace('_', ' ')}</h2>
               <div className="relative w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-black transition-colors" />
                  <input type="text" placeholder="Search network grid..." className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-black transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
               </div>
            </header>

            <main className="flex-1 overflow-y-auto p-12 bg-gray-50/40 hide-scrollbar">
               {activeTab === 'dashboard' && (
                 <div className="grid grid-cols-4 gap-8">
                    <StatCard icon={DollarSign} label="Net Collections" value={`$${collectionAccount.totalCollected.toFixed(0)}`} trend="+12%" color="text-indigo-600" />
                    <StatCard icon={Zap} label="Held in Escrow" value={`$${collectionAccount.heldInProcess.toFixed(0)}`} trend="Live" color="text-amber-500" />
                    <StatCard icon={Users} label="Network Nodes" value={managedUsers.length} trend="Growing" color="text-blue-600" />
                    <StatCard icon={ShieldCheck} label="System Integrity" value="100%" trend="Secure" color="text-emerald-500" />
                 </div>
               )}
               {activeTab === 'users' && renderUsers()}
               {activeTab === 'settings' && renderSettings()}
               {activeTab === 'settlement' && renderSettlement()}
               {activeTab === 'approvals' && renderApprovals()}
               {activeTab === 'audit' && (
                 <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm p-10 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                       <History className="w-6 h-6 text-indigo-600" />
                       <h3 className="text-xl font-black">Platform Audit Log</h3>
                    </div>
                    {auditLogs.map(log => (
                      <div key={log.id} className="p-6 bg-gray-50 rounded-3xl flex justify-between items-center text-xs border border-transparent hover:border-gray-200 transition-all group">
                         <div className="flex items-center gap-6">
                            <div className={`w-2 h-10 rounded-full ${log.severity === 'high' ? 'bg-red-500' : log.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            <div>
                               <p className="font-black text-sm text-gray-900 uppercase tracking-tighter">{log.action}</p>
                               <p className="text-gray-400 font-bold mt-0.5">{log.userName} • Target: {log.target}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-gray-400 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            <p className="text-[10px] font-black text-gray-300 mt-1 uppercase">NODE: {log.id}</p>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </main>
         </div>
      </div>
      {/* TERRA-061: Confirmation modal + user detail drawer */}
      {renderConfirmModal()}
      {renderUserDetailDrawer()}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, color = "text-black" }: any) => (
  <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-4 group hover:shadow-xl transition-all border-b-[6px] border-b-gray-100 hover:border-b-black">
     <div className="flex justify-between items-start">
        <div className="p-4 bg-gray-50 rounded-[24px] group-hover:scale-110 transition-transform"><Icon className={`w-6 h-6 ${color}`} /></div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{trend}</span>
     </div>
     <div className="pt-2">
        <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{value}</h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">{label}</p>
     </div>
  </div>
);

const SidebarLink = ({ icon: Icon, label, active, onClick, count }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${active ? 'bg-indigo-600 text-white font-black shadow-2xl' : 'text-slate-400 hover:text-white hover:bg-white/5 font-bold'}`}
  >
     <div className="flex items-center gap-4">
        <Icon className="w-5 h-5" />
        <span className="text-xs tracking-tight">{label}</span>
     </div>
     {count > 0 && <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-lg animate-pulse">{count}</span>}
  </button>
);

export default AdminInterface;