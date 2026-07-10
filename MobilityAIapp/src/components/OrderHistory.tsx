
import React, { useState, useMemo } from 'react';
import { Search, Star, ChevronRight, ShoppingBag, Calendar, MapPin, Package, Bike, CreditCard, Receipt, Filter, Clock, Briefcase, ListChecks } from 'lucide-react';
import { Order, RideHistoryItem, DeliveryOrder, PaymentHistoryItem, ErrandOrder } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  rides: RideHistoryItem[];
  deliveries: DeliveryOrder[];
  errands: ErrandOrder[];
  payments: PaymentHistoryItem[];
  onRate: (orderId: string, rating: number) => void;
  onReorder: (order: Order) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, rides, deliveries, errands, payments, onRate, onReorder }) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'payments'>('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rides' | 'food' | 'delivery' | 'errands'>('all');

  const filteredActivity = useMemo(() => {
    const all = [
      ...orders.map(o => ({ ...o, type: 'food' as const })),
      ...rides.map(r => ({ ...r, type: 'ride' as const })),
      ...deliveries.map(d => ({ ...d, type: 'delivery' as const })),
      ...errands.map(e => ({ ...e, type: 'errand' as const }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    return all.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ('restaurantName' in item ? item.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) : 
         'provider' in item ? item.provider.toLowerCase().includes(searchQuery.toLowerCase()) : 
         'plan' in item ? item.plan.toLowerCase().includes(searchQuery.toLowerCase()) : true);
      
      const matchesFilter = filterType === 'all' || 
        (filterType === 'food' && item.type === 'food') ||
        (filterType === 'rides' && item.type === 'ride') ||
        (filterType === 'delivery' && item.type === 'delivery') ||
        (filterType === 'errands' && item.type === 'errand');

      return matchesSearch && matchesFilter;
    });
  }, [orders, rides, deliveries, errands, searchQuery, filterType]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [payments, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-gray-900">History Hub</h1>
          
          <div className="bg-gray-200 p-1 rounded-2xl flex gap-1">
             <button 
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
             >
               Activity
             </button>
             <button 
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
             >
               Payments
             </button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder={activeTab === 'activity' ? "Search trips, food, errands..." : "Search transactions..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-3xl border-2 border-transparent focus:border-black shadow-sm outline-none transition-all font-medium"
              />
            </div>
            {activeTab === 'activity' && (
              <div className="relative">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="appearance-none bg-white px-6 py-4 rounded-3xl border-2 border-transparent focus:border-black shadow-sm font-black text-xs uppercase tracking-widest outline-none pr-10"
                >
                  <option value="all">All</option>
                  <option value="rides">Rides</option>
                  <option value="food">Food</option>
                  <option value="delivery">Parcels</option>
                  <option value="errands">Errands</option>
                </select>
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {activeTab === 'activity' ? (
          <div className="space-y-4">
            {filteredActivity.length === 0 ? (
              <EmptyState message="No activity found matching your search." />
            ) : (
              filteredActivity.map((item: any) => (
                <div key={item.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4 group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {item.type === 'food' ? '🍱' : item.type === 'ride' ? (item.isScheduled ? '📅' : '🚗') : item.type === 'delivery' ? '📦' : '🏃'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-lg">
                          {item.type === 'food' ? item.restaurantName : 
                           item.type === 'ride' ? `${item.provider} ${item.type}` : 
                           item.type === 'delivery' ? `${item.items?.[0]?.size || 'Standard'} Parcel` : 
                           `${item.plan} Dedicated Errand`}
                        </h3>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          (item.status === 'delivered' || item.status === 'completed' || item.isScheduled) ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {item.isScheduled ? 'Scheduled' : (item.status || 'completed')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-bold mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.scheduledTimestamp || item.timestamp).toLocaleDateString()}
                        </div>
                        <span>•</span>
                        <span>${(item.total || item.price || item.fee || (item.baseFee + item.shoppingTotal)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {item.type === 'errand' && (
                    <div className="bg-gray-50 p-4 rounded-3xl space-y-3">
                       <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Manifest: {item.shoppingList?.length || 0} items</span>
                       </div>
                       <div className="grid gap-1 px-1">
                          {item.shoppingList?.slice(0, 2).map((s: any, idx: number) => (
                             <div key={idx} className="flex justify-between text-[10px] font-bold text-gray-400">
                                <span>{s.quantity}x {s.name}</span>
                                <span>${(s.price * s.quantity).toFixed(2)}</span>
                             </div>
                          ))}
                          {item.shoppingList?.length > 2 && (
                             <p className="text-[9px] font-black text-indigo-400 mt-1 uppercase">+ {item.shoppingList.length - 2} more items</p>
                          )}
                       </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1">
                      {!item.isScheduled && [1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => onRate(item.id, star)}
                          className={`transition-all hover:scale-125 ${item.rating && star <= item.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                        >
                          <Star className={`w-4 h-4 ${item.rating && star <= item.rating ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition">Log</button>
                      <button 
                        onClick={() => item.type === 'food' && onReorder(item)}
                        className="px-6 py-2 bg-black text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition active:scale-95"
                      >
                        {item.type === 'food' ? 'Reorder' : item.type === 'errand' ? 'Hire Again' : 'Book Again'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <EmptyState message="No transactions found." />
            ) : (
              filteredPayments.map(payment => (
                <div key={payment.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${payment.status === 'successful' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-sm">{payment.description}</h3>
                      <p className={`font-black ${payment.status === 'successful' ? (payment.direction === 'in' ? 'text-emerald-600' : 'text-black') : 'text-red-500'}`}>
                        {payment.direction === 'in' ? '+' : '-'}${payment.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold mt-1">
                      <span>{payment.method}</span>
                      <span>•</span>
                      <span>{new Date(payment.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 space-y-4">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
      <ShoppingBag className="w-10 h-10 text-gray-300" />
    </div>
    <p className="text-gray-400 font-bold">{message}</p>
  </div>
);

export default OrderHistory;
