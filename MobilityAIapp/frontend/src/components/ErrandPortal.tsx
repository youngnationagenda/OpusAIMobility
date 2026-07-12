
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, ShoppingCart, User as UserIcon, MapPin, Search, 
  ChevronLeft, CheckCircle2, Zap, Package, Plus, Minus, 
  Trash2, CreditCard, ShieldCheck, Timer, Briefcase, 
  Store, ListChecks, DollarSign, Loader2, Star
} from 'lucide-react';
import { User, ErrandOrder, InventoryItem, ErrandPlan } from '../types';
import { omniApi } from '../services/api';

interface ErrandPortalProps {
  user: User;
  onClose: () => void;
  onOrderPlaced: (order: ErrandOrder) => void;
}

const ErrandPortal: React.FC<ErrandPortalProps> = ({ user, onClose, onOrderPlaced }) => {
  const [step, setStep] = useState<'plan' | 'type' | 'shopping' | 'confirm'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<ErrandPlan>('Hourly');
  const [errandType, setErrandType] = useState<'Shopping' | 'Custom'>('Shopping');
  const [searchQuery, setSearchQuery] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Shopping State
  const [errandCart, setErrandCart] = useState<{ item: InventoryItem; quantity: number }[]>([]);
  const inventory = useMemo(() => omniApi.getInventory(), []);

  const plans = {
    'Hourly': { price: 10, hours: 1, desc: 'Quick local run' },
    'Half Day': { price: 35, hours: 4, desc: 'Multiple stops' },
    'Full Day': { price: 60, hours: 8, desc: 'Complete dedicated day' }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const addToCart = (item: InventoryItem) => {
    setErrandCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setErrandCart(prev => prev.filter(c => c.item.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setErrandCart(prev => prev.map(c => 
      c.item.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
    ));
  };

  const shoppingTotal = errandCart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const hireFee = plans[selectedPlan].price;
  const grandTotal = shoppingTotal + hireFee;

  const totalsByStore = useMemo(() => {
    const stores: Record<string, { name: string; total: number }> = {};
    errandCart.forEach(c => {
      if (!stores[c.item.vendorId]) stores[c.item.vendorId] = { name: c.item.vendorName, total: 0 };
      stores[c.item.vendorId].total += c.item.price * c.quantity;
    });
    return Object.values(stores);
  }, [errandCart]);

  // TERRA-080: Wire errand order to DynamoDB via omniApi.placeErrandOrder
  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    const order: ErrandOrder = {
      id: 'ERR-' + Date.now().toString(36).toUpperCase(),
      customerId: user.id,
      clientName: user.name,
      plan: selectedPlan,
      durationHours: plans[selectedPlan].hours,
      type: errandType,
      status: 'pending',
      timestamp: Date.now(),
      baseFee: hireFee,
      shoppingTotal: shoppingTotal,
      shoppingList: errandCart.map(c => ({
        itemId: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        unit: c.item.unit,
        vendorId: c.item.vendorId,
        vendorName: c.item.vendorName,
      })),
      customInstructions,
    };

    // Persist to DynamoDB + deduct wallet (omniApi handles both)
    await omniApi.placeErrandOrder(order);

    onOrderPlaced(order);
    setIsProcessing(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden animate-in slide-in-from-right">
      <div className="p-6 bg-white border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
           <button onClick={onClose} className="p-2 bg-gray-50 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
           <div>
              <h2 className="text-xl font-black">Dedicated Errand</h2>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Personal Concierge Protocol</p>
           </div>
        </div>
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
           <UserIcon className="w-6 h-6" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        {step === 'plan' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="space-y-2">
                <h3 className="text-2xl font-black">Select Hire Duration</h3>
                <p className="text-sm text-gray-500 font-medium">A professional rider will be dedicated solely to your missions during this window.</p>
             </div>
             <div className="grid gap-4">
                {(Object.keys(plans) as ErrandPlan[]).map(p => (
                  <button 
                    key={p} 
                    onClick={() => { setSelectedPlan(p); setStep('type'); }}
                    className="p-8 bg-white rounded-[40px] border-2 border-gray-100 flex items-center justify-between hover:border-black transition-all group shadow-sm"
                  >
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                           <Clock className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div className="text-left">
                           <h4 className="text-xl font-black">{p}</h4>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{plans[p].desc} • {plans[p].hours}h</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-black">${plans[p].price}</p>
                        <span className="text-[9px] font-black text-indigo-600 uppercase">Hire Fee</span>
                     </div>
                  </button>
                ))}
             </div>
          </div>
        )}

        {step === 'type' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="space-y-2">
                <h3 className="text-2xl font-black">Errand Type</h3>
                <p className="text-sm text-gray-500 font-medium">Define the core mission for your dedicated rider.</p>
             </div>
             <div className="grid gap-4">
                <button 
                  onClick={() => { setErrandType('Shopping'); setStep('shopping'); }}
                  className="p-8 bg-white rounded-[40px] border-2 border-indigo-500 flex items-center gap-6 shadow-xl"
                >
                   <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center"><ShoppingCart className="w-8 h-8 text-indigo-600" /></div>
                   <div className="text-left">
                      <h4 className="text-xl font-black">Shopping Run</h4>
                      <p className="text-xs font-bold text-gray-400">Pick groceries, pharmacy, or supermarket items.</p>
                   </div>
                </button>
                <button 
                  onClick={() => { setErrandType('Custom'); setStep('confirm'); }}
                  className="p-8 bg-white rounded-[40px] border-2 border-gray-100 flex items-center gap-6"
                >
                   <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center"><Briefcase className="w-8 h-8 text-gray-400" /></div>
                   <div className="text-left">
                      <h4 className="text-xl font-black">Custom Task</h4>
                      <p className="text-xs font-bold text-gray-400">Document delivery, key pickup, or general runs.</p>
                   </div>
                </button>
             </div>
          </div>
        )}

        {step === 'shopping' && (
          <div className="space-y-6 animate-in fade-in pb-32">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search groceries, detergents, meat..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 bg-white rounded-[28px] border-2 border-transparent focus:border-black outline-none font-bold shadow-sm"
                />
             </div>

             <div className="grid gap-4">
                {filteredInventory.map(item => {
                  const inCart = errandCart.find(c => c.item.id === item.id);
                  return (
                    <div key={item.id} className="bg-white p-5 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${item.category === 'Grocery' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                             {item.category === 'Grocery' ? '🥬' : '🧴'}
                          </div>
                          <div>
                             <h4 className="font-black text-gray-900">{item.name}</h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase">{item.vendorName} • per {item.unit}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="font-black text-lg">${item.price.toFixed(2)}</p>
                             <p className="text-[9px] font-black text-indigo-500 uppercase">Live Price</p>
                          </div>
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1">
                               <button onClick={() => updateQty(item.id, -1)} className="p-2 hover:bg-white rounded-xl"><Minus className="w-3 h-3" /></button>
                               <span className="font-black text-sm w-4 text-center">{inCart.quantity}</span>
                               <button onClick={() => updateQty(item.id, 1)} className="p-2 hover:bg-white rounded-xl"><Plus className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(item)} className="p-4 bg-black text-white rounded-2xl shadow-lg active:scale-90 transition"><Plus className="w-5 h-5" /></button>
                          )}
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-8 animate-in slide-in-from-bottom">
             <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-xl space-y-6">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black">Order Summary</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{selectedPlan} Hire Plan</p>
                   </div>
                   <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center shadow-inner"><ListChecks className="w-7 h-7" /></div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm font-bold text-gray-500">Dedicated Hire Fee ({selectedPlan})</span>
                      <span className="font-black">${hireFee.toFixed(2)}</span>
                   </div>
                   {errandType === 'Shopping' && (
                     <div className="space-y-4 pt-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Shopping Prorated Breakdown</p>
                        {totalsByStore.map(s => (
                          <div key={s.name} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                             <div className="flex items-center gap-2">
                                <Store className="w-3 h-3 text-indigo-400" />
                                <span className="text-xs font-bold">{s.name}</span>
                             </div>
                             <span className="text-sm font-black">${s.total.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                           <span className="text-sm font-bold text-gray-500">Total Shopping Cost</span>
                           <span className="font-black text-xl">${shoppingTotal.toFixed(2)}</span>
                        </div>
                     </div>
                   )}
                   {errandType === 'Custom' && (
                     <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mission Instructions</p>
                        <textarea 
                          placeholder="Describe where to go and what to do..."
                          value={customInstructions}
                          onChange={e => setCustomInstructions(e.target.value)}
                          className="w-full p-5 bg-gray-50 rounded-[32px] border-2 border-transparent focus:border-black outline-none font-medium text-sm h-32"
                        />
                     </div>
                   )}
                </div>

                <div className="pt-6 bg-gray-900 text-white p-8 rounded-[40px] flex justify-between items-center shadow-2xl">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Grand Total</p>
                      <h2 className="text-4xl font-black">${grandTotal.toFixed(2)}</h2>
                   </div>
                   <ShieldCheck className="w-10 h-10 text-emerald-400" />
                </div>
             </div>
          </div>
        )}
      </div>

      {step === 'shopping' && errandCart.length > 0 && (
        <div className="absolute bottom-6 left-6 right-6 p-6 bg-black text-white rounded-[32px] shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom">
           <div>
              <p className="text-[10px] font-black uppercase opacity-60">Selected: {errandCart.length} Items</p>
              <h4 className="text-xl font-black">${shoppingTotal.toFixed(2)}</h4>
           </div>
           <button onClick={() => setStep('confirm')} className="px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Review Mission</button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="p-6 bg-white border-t border-gray-100">
           <button 
             onClick={handlePlaceOrder}
             disabled={isProcessing || (errandType === 'Shopping' && errandCart.length === 0) || (errandType === 'Custom' && !customInstructions)}
             className="w-full py-6 bg-black text-white rounded-[28px] font-black uppercase text-sm tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
           >
              {isProcessing ? <Loader2 className="animate-spin" /> : <><Zap className="w-5 h-5 text-emerald-400" /> Deploy Dedicated Rider</>}
           </button>
        </div>
      )}
    </div>
  );
};

export default ErrandPortal;
