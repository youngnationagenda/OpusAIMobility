
import React from 'react';
import { Tag, Ticket, Clock, CheckCircle2, ShoppingBag, Bike } from 'lucide-react';
import { Coupon } from '../types';
import { MOCK_COUPONS } from '../constants';

interface PromoCenterProps {
  userCoupons: string[];
  onSelect?: (coupon: Coupon) => void;
  selectedId?: string;
  category?: 'rides' | 'food' | 'all';
}

const PromoCenter: React.FC<PromoCenterProps> = ({ userCoupons, onSelect, selectedId, category }) => {
  const coupons = MOCK_COUPONS.filter(c => !category || c.category === category || c.category === 'all');

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar">
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900">Promotions</h1>
          <p className="text-gray-500 font-medium">Exclusive offers curated for you.</p>
        </div>

        <div className="grid gap-4">
          {coupons.map(coupon => {
            const isSelected = selectedId === coupon.id;
            const Icon = coupon.category === 'rides' ? Bike : coupon.category === 'food' ? ShoppingBag : Tag;
            
            return (
              <div 
                key={coupon.id}
                onClick={() => onSelect?.(coupon)}
                className={`
                  relative bg-white p-6 rounded-[32px] border-2 transition-all cursor-pointer group
                  ${isSelected ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm
                    ${coupon.category === 'rides' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-lg leading-tight">{coupon.code}</h3>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-black" />}
                    </div>
                    <p className="text-sm font-bold text-gray-500">{coupon.description}</p>
                    <div className="flex items-center gap-3 pt-2">
                       <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          Exp: {new Date(coupon.expiryDate).toLocaleDateString()}
                       </div>
                       {coupon.minSpend && (
                         <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest">
                            Min: ${coupon.minSpend}
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full" />
                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-px h-[60%] border-l-2 border-dashed border-gray-100" />
              </div>
            );
          })}
        </div>

        <div className="bg-black p-8 rounded-[40px] text-white space-y-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
            <Ticket className="w-32 h-32" />
          </div>
          <h2 className="text-2xl font-black leading-tight">Refer a Friend &<br/>Get $10 Credit</h2>
          <p className="text-sm font-bold text-gray-400">Share your referral link and earn credits for every successful signup.</p>
          <button className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition active:scale-95">
            Share Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoCenter;
