
import React, { useState, useEffect } from 'react';
import { Package, Bike, Home, CheckCircle2, MapPin, Phone, MessageSquare, ChevronDown, Clock, List } from 'lucide-react';
import { DeliveryOrder, OrderStatus } from '../types';

interface DeliveryTrackingProps {
  order: DeliveryOrder;
  onClose: () => void;
}

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ order, onClose }) => {
  const [status, setStatus] = useState<OrderStatus>(order.status);

  // Simulation of status updates (skip if scheduled far in future)
  useEffect(() => {
    if (status === 'scheduled') return;

    const sequence: OrderStatus[] = ['pending', 'picked_up', 'delivering', 'delivered'];
    const currentIdx = sequence.indexOf(status);
    
    if (currentIdx !== -1 && currentIdx < sequence.length - 1) {
      const timer = setTimeout(() => {
        setStatus(sequence[currentIdx + 1]);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const stages: { id: OrderStatus; label: string; icon: any }[] = [
    { id: 'pending', label: 'Finding Rider', icon: Bike },
    { id: 'picked_up', label: 'Parcel Picked Up', icon: Package },
    { id: 'delivering', label: 'In Transit', icon: Bike },
    { id: 'delivered', label: 'Delivered', icon: Home },
  ];

  const activeIdx = stages.findIndex(s => s.id === status);

  return (
    <div className="absolute inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <Package className="w-6 h-6 text-blue-500" />
           <div>
             <h2 className="text-xl font-black">Tracking Parcel</h2>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.id}</p>
           </div>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {status === 'scheduled' ? (
          <div className="bg-blue-50 p-8 rounded-[40px] text-center space-y-4 border border-blue-100 animate-in zoom-in duration-300">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-10 h-10 text-blue-600" />
             </div>
             <div className="space-y-1">
                <h3 className="text-xl font-black text-blue-900">Delivery Scheduled</h3>
                <p className="text-sm font-bold text-blue-700">Pickup on {new Date(order.scheduledTimestamp!).toLocaleString()}</p>
             </div>
             <p className="text-xs text-blue-600 opacity-60">A rider will be dispatched 30 mins before your scheduled time.</p>
          </div>
        ) : (
          <div className="flex justify-between items-start px-2">
            {stages.map((stage, idx) => {
              const isDone = idx < activeIdx;
              const isActive = idx === activeIdx;
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="flex flex-col items-center gap-3 flex-1 relative">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative z-10
                    ${isActive ? 'bg-black text-white scale-110 shadow-lg' : isDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'}
                  `}>
                    <Icon className="w-5 h-5" />
                    {isDone && <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 bg-white text-green-500 rounded-full" />}
                  </div>
                  <p className={`text-[9px] font-black uppercase text-center leading-tight ${isActive ? 'text-black' : 'text-gray-400'}`}>
                    {stage.label}
                  </p>
                  {idx < stages.length - 1 && (
                    <div className={`absolute w-[100%] h-0.5 ${isDone ? 'bg-green-500' : 'bg-gray-100'} -z-0 mt-5 left-[50%]`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dispatch Rider Card */}
        <div className="bg-gray-50 p-6 rounded-[32px] flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">🛵</div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dispatch Rider</p>
            <h3 className="text-xl font-black">{order.riderName}</h3>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <span className="flex items-center gap-0.5 text-yellow-500">★ 4.9</span>
              {status !== 'scheduled' && <span>• 2 mins away</span>}
              {order.isDedicated && <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ml-1">Dedicated</span>}
            </div>
          </div>
          <div className="flex gap-2">
             <button className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition"><MessageSquare className="w-5 h-5 text-blue-500" /></button>
             <button className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition"><Phone className="w-5 h-5 text-green-500" /></button>
          </div>
        </div>

        {/* Multi-Item Details */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-4 shadow-sm">
           <div className="flex items-center justify-between">
              <h4 className="font-black text-lg">Shipment Details</h4>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-500">{order.items.length} Items</span>
           </div>
           
           <div className="space-y-2 max-h-48 overflow-y-auto hide-scrollbar pr-1">
              {order.items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                   <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-xs">📦</div>
                   <div className="flex-1">
                      <p className="text-xs font-black leading-tight">{item.description || `Item ${idx+1}`}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{item.category} • {item.size} • {item.weightKg}kg</p>
                   </div>
                </div>
              ))}
           </div>

           <div className="pt-4 border-t border-gray-50 space-y-4">
              <div className="flex items-start gap-3">
                 <div className="w-6 h-6 bg-green-50 rounded flex items-center justify-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Pickup From</p>
                    {/* Fix: Access address through nested sender object. */}
                    <p className="text-sm font-bold truncate max-w-[200px]">{order.sender.address}</p>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <div className="w-6 h-6 bg-red-50 rounded flex items-center justify-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Drop to</p>
                    {/* Fix: Access address through nested receiver object. */}
                    <p className="text-sm font-bold truncate max-w-[200px]">{order.receiver.address}</p>
                 </div>
              </div>
           </div>

           <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="text-right w-full">
                 <p className="text-xl font-black">${order.fee.toFixed(2)}</p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Total Paid</p>
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
         <button onClick={onClose} className="w-full py-4 bg-black text-white rounded-3xl font-black shadow-xl active:scale-95 transition">
            {status === 'scheduled' ? 'Manage Schedule' : 'Close Tracking'}
         </button>
      </div>
    </div>
  );
};

export default DeliveryTracking;
