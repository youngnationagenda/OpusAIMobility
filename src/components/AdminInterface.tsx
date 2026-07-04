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

interface AdminInterfaceProps {
  onClose: () => void;
  adminUser: UserProfile;
}

type AdminTab = 'dashboard' | 'finance' | 'users' | 'fleet' | 'approvals' | 'audit' | 'settings' | 'settlement';

const AdminInterface: React.FC<AdminInterfaceProps> = ({ onClose, adminUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const collectionAccount = useMemo(() => omniApi.getCollectionAccount(), [activeTab]);

  useEffect(() => {
    const fetchData = () => {
      // AWS cache key — populated by omniApi._warmCaches() on startup
      const users = JSON.parse(localStorage.getItem('omniride-users') || '[]');
      setManagedUsers(users);
      setFleetConfig(omniApi.getFleetConfig());
      setPricingConfig(omniApi.getPricingConfig());
      setPlatformSettings(omniApi.getPlatformSettings());
    };
    fetchData();
  }, [activeTab]);

  const handleApproveUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('omniride-users') || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    if (index > -1) {
       users[index].status = 'active';
       localStorage.setItem('omniride-users', JSON.stringify(users));
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
               {activeTab === 'settings' && renderSettings()}
               {activeTab === 'settlement' && renderSettlement()}
               {activeTab === 'approvals' && renderApprovals()}
               {activeTab === 'audit' && (
                 <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm p-10 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                       <History className="w-6 h-6 text-indigo-600" />
                       <h3 className="text-xl font-black">Platform Audit Log</h3>
                    </div>
                    {auditApi.getLogs().map(log => (
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