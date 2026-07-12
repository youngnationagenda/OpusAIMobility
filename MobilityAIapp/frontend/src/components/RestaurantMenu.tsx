
import React, { useState } from 'react';
import { X, Plus, Star, ChevronLeft, Minus, ShoppingBag, Ticket, Check } from 'lucide-react';
import { Restaurant, CartItem, Coupon } from '../types';
import { MOCK_COUPONS } from '../constants';

interface RestaurantMenuProps {
  restaurant: Restaurant;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart: (item: any) => void;
  onRemoveFromCart: (id: string) => void;
  onPlaceOrder: (discount?: number) => void; 
}

const RestaurantMenu: React.FC<RestaurantMenuProps> = ({ restaurant, onClose, cart, onAddToCart, onRemoveFromCart, onPlaceOrder }) => {
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);

  const getItemQuantity = (id: string) => cart.find(c => c.menuItemId === id)?.quantity || 0;

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const serviceFee = subtotal > 0 ? 1.50 : 0;
  
  let discount = 0;
  if (activeCoupon) {
    if (!activeCoupon.minSpend || subtotal >= activeCoupon.minSpend) {
      if (activeCoupon.discountType === 'percentage') {
        discount = (subtotal * activeCoupon.value) / 100;
      } else {
        discount = activeCoupon.value;
      }
    }
  }

  const total = Math.max(0, subtotal + restaurant.deliveryFee + serviceFee - discount);

  return (
    <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
      {/* Hero Header */}
      <div className="relative h-64 shrink-0">
        <img src={restaurant.coverImage} className="w-full h-full object-cover" alt={restaurant.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h1 className="text-4xl font-black">{restaurant.name}</h1>
          <div className="flex items-center gap-4 mt-2 font-bold text-sm opacity-90">
             <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {restaurant.rating}</span>
             <span>•</span>
             <span>{restaurant.category}</span>
             <span>•</span>
             <span>{restaurant.deliveryTime} min delivery</span>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black">Menu</h2>
            {cart.length > 0 && (
              <button 
                onClick={() => setShowCoupons(!showCoupons)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  activeCoupon ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Ticket className="w-3 h-3" />
                {activeCoupon ? activeCoupon.code : 'Voucher'}
              </button>
            )}
          </div>

          {showCoupons && (
            <div className="grid gap-2 p-4 bg-gray-50 rounded-[32px] border border-gray-100 animate-in slide-in-from-top duration-300">
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Available Vouchers</p>
               {MOCK_COUPONS.filter(c => c.category === 'food' || c.category === 'all').map(coupon => {
                 const spendReqMet = !coupon.minSpend || subtotal >= coupon.minSpend;
                 return (
                   <button
                    key={coupon.id}
                    disabled={!spendReqMet && subtotal > 0}
                    onClick={() => { setActiveCoupon(coupon); setShowCoupons(false); }}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                      activeCoupon?.id === coupon.id ? 'border-green-500 bg-white' : 'border-white bg-white'
                    } ${(!spendReqMet && subtotal > 0) ? 'opacity-40 grayscale' : ''}`}
                   >
                    <div className="text-left">
                      <p className="font-black text-sm">{coupon.code}</p>
                      <p className="text-[10px] font-bold text-gray-400">{coupon.description}</p>
                      {!spendReqMet && subtotal > 0 && <p className="text-[8px] font-black text-red-400 mt-1">Spend ${coupon.minSpend! - subtotal} more to unlock</p>}
                    </div>
                    {activeCoupon?.id === coupon.id && <Check className="w-4 h-4 text-green-500" />}
                   </button>
                 );
               })}
               <button onClick={() => { setActiveCoupon(null); setShowCoupons(false); }} className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Clear Selection</button>
            </div>
          )}

          <div className="grid gap-4">
            {restaurant.menu.map(item => {
              const qty = getItemQuantity(item.id);
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                  <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" alt={item.name} />
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                    <p className="text-lg font-black mt-1">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {qty > 0 && (
                      <button 
                        onClick={() => onRemoveFromCart(item.id)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-black transition"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                    {qty > 0 && <span className="font-black text-lg w-4 text-center">{qty}</span>}
                    <button 
                      onClick={() => onAddToCart(item)}
                      className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 shadow-up animate-in slide-in-from-bottom-2">
          <div className="flex flex-col gap-4">
             <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-black text-green-600 uppercase tracking-widest">
                    <span>Discount ({activeCoupon?.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Delivery Fee</span>
                  <span>${restaurant.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Service Fee</span>
                  <span>${serviceFee.toFixed(2)}</span>
                </div>
             </div>
             <button 
               onClick={() => onPlaceOrder(discount)}
               className="w-full py-5 bg-black text-white rounded-[24px] font-black text-lg flex items-center justify-between px-8 shadow-xl hover:bg-gray-800 transition active:scale-95"
             >
               <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6" />
                  <span>Place Order</span>
               </div>
               <span>${total.toFixed(2)}</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;
