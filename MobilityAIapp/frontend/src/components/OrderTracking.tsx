
import React from 'react';
import { ChefHat, Bike, Home, CheckCircle2, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { omniApi } from '../services/api';

interface OrderTrackingProps {
  order: Order;
  onClose: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ order, onClose }) => {
  const stages: { status: OrderStatus; label: string; icon: any; color: string }[] = [
    { status: 'preparing', label: 'Preparing Meal', icon: ChefHat, color: 'text-orange-500' },
    { status: 'picked_up', label: 'Order Picked Up', icon: CheckCircle2, color: 'text-blue-500' },
    { status: 'delivering', label: 'On the Way', icon: Bike, color: 'text-purple-500' },
    { status: 'delivered', label: 'Arrived', icon: Home, color: 'text-green-500' },
  ];

  const currentIdx = stages.findIndex(s => s.status === order.status);

  // Generate a live link if none exists in backend
  const navUrl = order.navigationUrl || omniApi.generateMapLink(order.restaurantName);

  return (
    <div className="absolute inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Tracking Order</h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{order.id}</p>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-full font-bold text-sm">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Progress Stepper */}
        <div className="space-y-12 py-6">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const Icon = stage.icon;

            return (
              <div key={stage.status} className="relative flex items-center gap-6">
                {/* Connector Line */}
                {idx !== stages.length - 1 && (
                  <div className={`absolute left-5 top-10 w-0.5 h-12 ${isCompleted ? 'bg-black' : 'bg-gray-100'}`} />
                )}
                
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500
                  ${isCurrent ? 'bg-black text-white scale-125 shadow-xl' : isCompleted ? 'bg-black text-white' : 'bg-gray-100 text-gray-300'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <p className={`font-black ${isCurrent ? 'text-xl text-black' : isCompleted ? 'text-black' : 'text-gray-300'}`}>
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-gray-500 font-medium">Approx. {Math.max(2, 20 - (idx * 5))} mins remaining</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Destination Link */}
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] space-y-4">
           <div className="flex justify-between items-center">
              <h3 className="font-black text-blue-900">Destination Hub</h3>
              <a 
                href={navUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-full text-blue-600 shadow-sm hover:scale-110 transition active:scale-95"
              >
                 <ExternalLink className="w-4 h-4" />
              </a>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                 <MapPin className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                 <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Delivery Address</p>
                 <p className="text-sm font-bold text-blue-900 truncate">Registered Home Address</p>
              </div>
           </div>
        </div>

        {/* Courier Info */}
        <div className="bg-gray-50 p-6 rounded-[32px] flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">🚴</div>
          <div className="flex-1">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Courier</p>
            <p className="font-black text-lg">Alex R.</p>
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Traveling by Electric Bike</span>
            </div>
          </div>
          <button className="p-3 bg-white rounded-full shadow-sm hover:shadow-md active:scale-95 transition">
            <Clock className="w-5 h-5 text-blue-500" />
          </button>
        </div>

        {/* Order Details Summary */}
        <div className="space-y-4 pb-12">
          <h3 className="font-black text-lg">Order Summary</h3>
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 space-y-3">
             {order.items.map(item => (
               <div key={item.menuItemId} className="flex justify-between font-bold text-sm">
                 <span className="text-gray-500">{item.quantity}x {item.name}</span>
                 <span>${(item.price * item.quantity).toFixed(2)}</span>
               </div>
             ))}
             <div className="pt-3 border-t border-gray-50 flex justify-between font-black text-lg">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
