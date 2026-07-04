
import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, ChevronLeft, ShieldCheck, Clock, MapPin, Camera, ArrowRight, CheckCircle2, 
  ChefHat, LayoutDashboard, ClipboardList, Settings, AlertCircle, Shield, Plus, 
  Trash2, Star, MessageSquare, CreditCard, X, Save, DollarSign, Play, CheckCircle, 
  Truck, Timer, Navigation, ThumbsUp, ThumbsDown, Loader2, User, BarChart3, 
  TrendingUp, Download, Calendar, Zap, Users, LifeBuoy, Bot, Send, Sparkles, 
  Headphones, FileQuestion, AlertTriangle, Lock, KeyRound, Fingerprint, Smartphone,
  Database, RefreshCw, Box
} from 'lucide-react';
import { VendorProfile, VendorStatus, MenuItem, Order, OrderStatus, Message, User as UserProfile, InventoryItem } from '../types';
import VendorSecurity from './VendorSecurity';
import { streamVendorSupportChat } from '../services/geminiService';
import { omniApi } from '../services/api';

interface VendorPortalProps {
  onClose: () => void;
  vendorProfile?: VendorProfile;
  onUpdateProfile: (profile: VendorProfile) => void;
}

type VendorView = 'dashboard' | 'menu' | 'reviews' | 'settings' | 'add_item' | 'orders' | 'analytics' | 'support' | 'inventory';

const VendorPortal: React.FC<VendorPortalProps> = ({ onClose, vendorProfile, onUpdateProfile }) => {
  const [activeView, setActiveView] = useState<VendorView>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [editingInventory, setEditingInventory] = useState<Partial<InventoryItem> | null>(null);
  const [requestingRiderId, setRequestingRiderId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [supportMessages, setSupportMessages] = useState<Message[]>([
    { id: '1', sender: 'support', text: "Welcome to Vendor Care. How can I assist with your business today?", timestamp: Date.now() }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (activeView === 'inventory') {
      setInventory(omniApi.getInventory().filter(i => i.vendorId === vendorProfile?.id));
    }
  }, [activeView, vendorProfile?.id]);

  const [liveOrders, setLiveOrders] = useState<Order[]>(() => {
    // Use the AWS-mirrored cache key
    const saved = localStorage.getItem('omniride-orders');
    const all = saved ? JSON.parse(saved) : [];
    return all.filter((o: Order) => o.restaurantId === vendorProfile?.id);
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [supportMessages, isAiThinking]);

  const handleSyncInventory = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    // Simulate fetching from external stock taking system
    setIsSyncing(false);
  };

  const handleSaveInventory = () => {
    if (!editingInventory?.name || !editingInventory?.price || !vendorProfile) return;
    const item: InventoryItem = {
      id: editingInventory.id || 'inv_' + Math.random().toString(36).substr(2, 9),
      vendorId: vendorProfile.id,
      vendorName: vendorProfile.businessName,
      name: editingInventory.name,
      category: editingInventory.category || 'Grocery',
      price: Number(editingInventory.price),
      unit: editingInventory.unit || 'piece',
      inStock: true
    };
    omniApi.updateInventoryItem(item);
    setInventory(omniApi.getInventory().filter(i => i.vendorId === vendorProfile.id));
    setEditingInventory(null);
  };

  const renderInventory = () => (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
       <div className="p-6 bg-white border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={() => setActiveView('dashboard')} className="p-2 bg-gray-50 rounded-xl"><ChevronLeft className="w-6 h-6" /></button>
             <h2 className="font-black text-xl">Inventory Hub</h2>
          </div>
          <div className="flex gap-2">
             <button onClick={handleSyncInventory} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black uppercase">Sync ERP</span>
             </button>
             <button onClick={() => setEditingInventory({})} className="p-3 bg-black text-white rounded-xl shadow-lg active:scale-95 transition-all">
                <Plus className="w-5 h-5" />
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
          {inventory.length === 0 ? (
            <div className="py-20 text-center opacity-30 italic">
               <Box className="w-16 h-16 mx-auto mb-4" />
               <p className="font-black uppercase tracking-widest text-xs">No Inventory Items Listed</p>
            </div>
          ) : (
            inventory.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
                    <div>
                       <h4 className="font-black text-gray-900">{item.name}</h4>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.category} • Per {item.unit}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="font-black text-lg text-indigo-600">${item.price.toFixed(2)}</p>
                       <p className="text-[8px] font-black text-gray-300 uppercase">Current Unit Price</p>
                    </div>
                    <button onClick={() => {
                       omniApi.removeInventoryItem(item.id);
                       setInventory(prev => prev.filter(i => i.id !== item.id));
                    }} className="p-3 text-red-400 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>
            ))
          )}
       </div>

       {editingInventory && (
         <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
            <div className="bg-white rounded-[48px] p-8 w-full max-w-sm space-y-6 shadow-2xl">
               <h3 className="text-2xl font-black">Stock Item</h3>
               <div className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Item Name</label><input type="text" value={editingInventory.name || ''} onChange={e => setEditingInventory({...editingInventory, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Price ($)</label><input type="number" value={editingInventory.price || ''} onChange={e => setEditingInventory({...editingInventory, price: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Unit</label><select value={editingInventory.unit || 'piece'} onChange={e => setEditingInventory({...editingInventory, unit: e.target.value as any})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold">
                        <option value="kg">kilogram (kg)</option>
                        <option value="grams">grams (g)</option>
                        <option value="piece">piece</option>
                        <option value="bunch">bunch</option>
                        <option value="litre">litre (L)</option>
                        <option value="packet">packet</option>
                        <option value="tray">tray (eggs)</option>
                     </select></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Category</label><select value={editingInventory.category || 'Grocery'} onChange={e => setEditingInventory({...editingInventory, category: e.target.value as any})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold">
                        <option>Grocery</option>
                        <option>Supermarket</option>
                        <option>Pharmacy</option>
                        <option>Other</option>
                     </select></div>
               </div>
               <div className="flex gap-3 pt-4"><button onClick={() => setEditingInventory(null)} className="flex-1 py-4 bg-gray-100 rounded-[20px] font-black uppercase text-xs">Cancel</button><button onClick={handleSaveInventory} className="flex-[2] py-4 bg-black text-white rounded-[20px] font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Add to Stock</button></div>
            </div>
         </div>
       )}
    </div>
  );

  const updateOrderStatusLocally = (orderId: string, status: OrderStatus) => {
    const actor: UserProfile = JSON.parse(localStorage.getItem('omniride_user')!);
    omniApi.updateOrderStatus(orderId, status, actor).then(() => {
       setLiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    });
  };

  const handleRequestRider = (orderId: string) => {
    setRequestingRiderId(orderId);
    setTimeout(() => {
      setRequestingRiderId(null);
      updateOrderStatusLocally(orderId, 'picked_up');
    }, 2000);
  };

  const handleSaveMenuItem = () => {
    if (!editingItem?.name || !editingItem?.price || !vendorProfile) return;
    const newItem: MenuItem = {
      id: editingItem.id || 'm_' + Math.random().toString(36).substr(2, 9),
      name: editingItem.name,
      description: editingItem.description || '',
      price: Number(editingItem.price),
      category: editingItem.category || 'Main',
      prepTime: editingItem.prepTime || 15,
      image: editingItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
    };

    const updatedMenu = editingItem.id 
      ? vendorProfile.menu.map(m => m.id === editingItem.id ? newItem : m)
      : [...vendorProfile.menu, newItem];

    onUpdateProfile({ ...vendorProfile, menu: updatedMenu });
    setEditingItem(null);
    setActiveView('menu');
  };

  const handleSupportSend = async () => {
    if (!supportInput.trim() || isAiThinking) return;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: supportInput, timestamp: Date.now() };
    setSupportMessages(prev => [...prev, userMsg]);
    setSupportInput('');
    setIsAiThinking(true);

    const history = supportMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text }));
    const aiId = (Date.now() + 1).toString();
    setSupportMessages(prev => [...prev, { id: aiId, sender: 'support', text: '', timestamp: Date.now() }]);

    streamVendorSupportChat(
      userMsg.text,
      history,
      (delta) => setSupportMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: m.text + delta } : m)),
      () => setIsAiThinking(false),
      () => setIsAiThinking(false)
    );
  };

  if (vendorProfile && !isAuthenticated) {
    return (
      <VendorSecurity 
        businessName={vendorProfile.businessName}
        requiredPin={vendorProfile.securityPin}
        onAuthenticated={() => setIsAuthenticated(true)}
        onCancel={onClose}
      />
    );
  }

  const renderDashboard = () => (
    <div className="flex-1 flex flex-col bg-gray-50 hide-scrollbar overflow-y-auto">
      <div className="p-8 bg-emerald-800 text-white pb-16">
         <div className="flex justify-between items-center mb-8">
            <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition"><ChevronLeft className="w-6 h-6" /></button>
            <h2 className="font-black text-lg uppercase tracking-widest opacity-60">Merchant Console</h2>
            <button onClick={() => setActiveView('settings')} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition"><Settings className="w-6 h-6" /></button>
         </div>
         <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl backdrop-blur-xl border border-white/10">🏪</div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black leading-tight tracking-tight">{vendorProfile?.businessName}</h1>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                 <p className="text-emerald-200 text-sm font-bold">{vendorProfile?.category} • Open until {vendorProfile?.closingTime}</p>
              </div>
            </div>
         </div>
      </div>

      <div className="px-6 -mt-8 space-y-6 pb-24">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0"><ShieldCheck className="w-6 h-6" /></div>
              <div><h3 className="font-black text-gray-900">Live Status: Active</h3><p className="text-xs font-medium text-gray-400">Visibility synced to consumer apps</p></div>
           </div>
           <button className="bg-gray-50 p-3 rounded-2xl text-gray-400"><LayoutDashboard className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button onClick={() => setActiveView('orders')} className="p-8 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-emerald-500 transition-all text-left group">
              <div className="flex justify-between items-center">
                 <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-100 transition-colors"><ClipboardList className="w-7 h-7 text-blue-600" /></div>
                 <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black">{liveOrders.length}</span>
              </div>
              <span className="font-black text-sm uppercase tracking-widest text-gray-900">Live Orders</span>
           </button>
           <button onClick={() => setActiveView('inventory')} className="p-8 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-indigo-500 transition-all text-left group">
              <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors"><Database className="w-7 h-7 text-indigo-600" /></div>
              <span className="font-black text-sm uppercase tracking-widest text-gray-900">Inventory Hub</span>
           </button>
           <button onClick={() => setActiveView('menu')} className="p-8 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-orange-500 transition-all text-left group">
              <div className="p-3 bg-orange-50 rounded-2xl group-hover:bg-orange-100 transition-colors"><ChefHat className="w-7 h-7 text-orange-600" /></div>
              <span className="font-black text-sm uppercase tracking-widest text-gray-900">Menu Studio</span>
           </button>
           <button onClick={() => setActiveView('analytics')} className="p-8 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-emerald-500 transition-all text-left group">
              <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 transition-colors"><BarChart3 className="w-7 h-7 text-emerald-600" /></div>
              <span className="font-black text-sm uppercase tracking-widest text-gray-900">Analytics</span>
           </button>
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
       <div className="p-6 bg-white border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
          <button onClick={() => setActiveView('dashboard')} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="font-black text-xl">Menu Studio</h2>
          <button onClick={() => setEditingItem({})} className="p-2 bg-black text-white rounded-xl shadow-lg active:scale-95 transition"><Plus className="w-6 h-6" /></button>
       </div>
       <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24 hide-scrollbar">
          {vendorProfile?.menu.length === 0 ? (
            <div className="text-center py-20 opacity-30 italic"><ChefHat className="w-16 h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest">No items listed yet</p></div>
          ) : (
            vendorProfile?.menu.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[32px] border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all group">
                 <img src={item.image} className="w-20 h-20 rounded-2xl object-cover shadow-inner" alt={item.name} />
                 <div className="flex-1">
                    <h4 className="font-black text-gray-900">{item.name}</h4>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">${item.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-1">{item.description}</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setEditingItem(item)} className="p-3 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-all"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => onUpdateProfile({ ...vendorProfile, menu: vendorProfile.menu.filter(m => m.id !== item.id) })} className="p-3 bg-red-50 text-red-400 hover:bg-red-100 rounded-2xl transition-all"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>
            ))
          )}
       </div>

       {editingItem && (
         <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
            <div className="bg-white rounded-[48px] p-8 w-full max-w-sm space-y-6 shadow-2xl">
               <h3 className="text-2xl font-black">{editingItem.id ? 'Edit Item' : 'New Dish'}</h3>
               <div className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Name</label><input type="text" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Price ($)</label><input type="number" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                     <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Prep Min</label><input type="number" value={editingItem.prepTime || ''} onChange={e => setEditingItem({...editingItem, prepTime: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black outline-none font-bold" /></div>
                  </div>
               </div>
               <div className="flex gap-3 pt-4"><button onClick={() => setEditingItem(null)} className="flex-1 py-4 bg-gray-100 rounded-[20px] font-black uppercase text-xs">Cancel</button><button onClick={handleSaveMenuItem} className="flex-[2] py-4 bg-black text-white rounded-[20px] font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Save Changes</button></div>
            </div>
         </div>
       )}
    </div>
  );

  const renderSupport = () => (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
       <div className="p-6 bg-white border-b flex items-center justify-between shrink-0">
          <button onClick={() => setActiveView('dashboard')} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><ChevronLeft className="w-6 h-6" /></button>
          <div className="text-center">
             <h2 className="font-black text-lg">Vendor Liaison</h2>
             <p className="text-[9px] font-black text-emerald-500 uppercase flex items-center justify-center gap-1"><Bot className="w-3 h-3" /> Dedicated AI Node</p>
          </div>
          <div className="w-10" />
       </div>
       <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
          {supportMessages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-4 rounded-[28px] text-sm font-medium shadow-sm ${m.sender === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                  {m.text}
               </div>
            </div>
          ))}
          {isAiThinking && <div className="flex justify-start"><div className="bg-white p-4 rounded-[24px] rounded-tl-none border border-gray-100 flex gap-1"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} /><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} /></div></div>}
       </div>
       <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
          <input type="text" value={supportInput} onChange={e => setSupportInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSupportSend()} placeholder="Ask about payouts, riders..." className="flex-1 bg-gray-100 p-4 rounded-[24px] outline-none font-bold text-sm" />
          <button onClick={handleSupportSend} disabled={!supportInput.trim()} className="w-14 h-14 bg-black text-white rounded-[24px] flex items-center justify-center shadow-xl active:scale-95 disabled:opacity-30 transition-all"><Send className="w-6 h-6" /></button>
       </div>
    </div>
  );

  const renderOrders = () => (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="p-6 bg-white border-b flex items-center justify-between shrink-0">
        <button onClick={() => setActiveView('dashboard')} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="font-black text-xl">Incoming Orders</h2>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24 hide-scrollbar">
        {liveOrders.length === 0 ? (
          <div className="py-20 text-center opacity-30"><ClipboardList className="w-16 h-16 mx-auto mb-4" /><p className="font-black tracking-widest uppercase">Zero Active Orders</p></div>
        ) : (
          liveOrders.map(order => (
            <div key={order.id} className="bg-white p-7 rounded-[40px] border border-gray-100 space-y-5 shadow-sm animate-in fade-in duration-500">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.id}</p>
                    <h4 className="font-black text-xl mt-1">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h4>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    order.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                    order.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {order.status}
                  </span>
              </div>
              <div className="space-y-3 bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50">
                  {order.items.map(item => (
                    <div key={item.menuItemId} className="flex justify-between text-sm font-bold items-center">
                      <div className="flex items-center gap-2"><span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] border border-gray-100 shadow-sm">{item.quantity}x</span><span className="text-gray-700">{item.name}</span></div>
                      <span className="text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
              <div className="pt-2 flex gap-3">
                  {order.status === 'pending' && <button onClick={() => updateOrderStatusLocally(order.id, 'preparing')} className="flex-1 py-4 bg-black text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">Accept Order</button>}
                  {order.status === 'preparing' && <button onClick={() => updateOrderStatusLocally(order.id, 'ready')} className="flex-1 py-4 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">Mark as Ready</button>}
                  {order.status === 'ready' && <button onClick={() => handleRequestRider(order.id)} disabled={requestingRiderId === order.id} className="flex-1 py-4 bg-emerald-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                    {requestingRiderId === order.id ? <><Loader2 className="w-5 h-5 animate-spin" /> Matching...</> : <><Truck className="w-5 h-5" /> Dispatch Rider</>}
                  </button>}
                  {order.status === 'picked_up' && <div className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-[24px] text-center font-black text-[10px] uppercase tracking-widest">Rider en-route</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (activeView === 'menu') return renderMenu();
  if (activeView === 'inventory') return renderInventory();
  if (activeView === 'support') return renderSupport();
  if (activeView === 'orders') return renderOrders();

  return renderDashboard();
};

export default VendorPortal;
