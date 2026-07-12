
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_COUPONS } from '../constants';
import { Provider, RideOption, Coupon } from '../types';
import { Ticket, X, Check, BarChart2, MousePointer2, Leaf, Zap, Globe, Sparkles, Navigation, Timer } from 'lucide-react';
import { omniApi } from '../services/api';

interface RideSelectorProps {
  onSelect: (ride: RideOption) => void;
  onCompare: (rides: RideOption[]) => void;
  selectedId?: string;
  activeCoupon?: Coupon | null;
  onCouponSelect: (coupon: Coupon | null) => void;
  distanceKm?: number;
}

const RideSelector: React.FC<RideSelectorProps> = ({ onSelect, onCompare, selectedId, activeCoupon, onCouponSelect, distanceKm }) => {
  const [showCoupons, setShowCoupons] = useState(false);
  const [activeRides, setActiveRides] = useState<RideOption[]>([]);

  useEffect(() => {
    setActiveRides(omniApi.getActiveRides());
  }, [selectedId]);

  // Pricing Rule: $0.37 per KM
  const PER_KM_RATE = 0.37;

  const calculateFinalPrice = (basePrice: number) => {
    // If we have AI-calculated distance, use the $0.37/km rate
    // We can also apply a small weight based on the vehicle type (basePrice from mock)
    // for realism, or use a flat rate as requested. 
    // Here we use the calculated distance * rate, adjusted slightly by capacity.
    if (!distanceKm) return basePrice;
    
    const calculatedFare = distanceKm * PER_KM_RATE;
    let discountedPrice = calculatedFare;

    if (activeCoupon) {
      if (activeCoupon.discountType === 'percentage') {
        const discount = (discountedPrice * activeCoupon.value) / 100;
        discountedPrice = Math.max(0, discountedPrice - Math.min(discount, 10));
      } else {
        discountedPrice = Math.max(0, discountedPrice - activeCoupon.value);
      }
    }
    return parseFloat(discountedPrice.toFixed(2));
  };

  // Find the ride with the minimum ETA
  const closestRide = useMemo(() => {
    if (activeRides.length === 0) return null;
    return activeRides.reduce((prev, curr) => (prev.eta < curr.eta ? prev : curr));
  }, [activeRides]);

  const handleRequestClosest = () => {
    if (closestRide) {
      const price = calculateFinalPrice(closestRide.price);
      onSelect({ ...closestRide, price });
    }
  };

  const handleCompareAll = () => {
    const pricedRides = activeRides.map(r => ({
      ...r,
      price: calculateFinalPrice(r.price)
    }));
    onCompare(pricedRides);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Smart Actions Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="space-y-0.5">
            <h2 className="text-xl font-black text-gray-900 tracking-tighter">Instant Dispatch</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3 fill-current" /> Active Grid matching
            </p>
          </div>
          <button 
            onClick={() => setShowCoupons(!showCoupons)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeCoupon ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Ticket className="w-3 h-3" />
            {activeCoupon ? activeCoupon.code : 'Promo'}
          </button>
        </div>

        {/* Primary Action Block */}
        <div className="grid gap-3">
          <button 
            onClick={handleRequestClosest}
            className="group relative w-full bg-black text-white p-8 rounded-[40px] shadow-2xl overflow-hidden hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover:rotate-45">
               <Navigation className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex justify-between items-center">
              <div className="text-left space-y-1">
                <h3 className="text-2xl font-black tracking-tight">Request Closest EV</h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {closestRide ? `Auto-match: ${closestRide.provider} (${closestRide.eta}m away)` : 'Scanning for nearest unit...'}
                </p>
              </div>
              <div className="text-right">
                 {distanceKm ? (
                    <div className="bg-emerald-500/20 px-3 py-1 rounded-full mb-2">
                       <p className="text-[14px] font-black text-emerald-400">${calculateFinalPrice(closestRide?.price || 0).toFixed(2)}</p>
                    </div>
                 ) : (
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-2">
                       <Zap className="w-8 h-8 text-emerald-400 fill-current" />
                    </div>
                 )}
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Closest unit</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleCompareAll}
            className="w-full py-5 bg-white border-2 border-gray-100 text-black rounded-[28px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            <BarChart2 className="w-4 h-4" /> Compare EV Fleet Specs
          </button>
        </div>
      </div>

      {/* Manual Selection List */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Choose Specific Model</h3>
           {distanceKm && <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Rate: $0.37/KM</span>}
        </div>
        <div className="grid gap-3">
          {activeRides.map(ride => {
            const finalPrice = calculateFinalPrice(ride.price);
            const isSelected = selectedId === ride.id;

            return (
              <button
                key={ride.id}
                onClick={() => onSelect({ ...ride, price: finalPrice })}
                className={`relative flex items-center justify-between p-5 rounded-[32px] border-2 transition-all ${
                  isSelected
                    ? 'border-black bg-gray-50 shadow-md scale-[1.02]' 
                    : 'border-gray-50 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-gray-50">{ride.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900 leading-none">{ride.type}</p>
                      <span className="text-[8px] font-black text-emerald-500 uppercase">{ride.provider}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Timer className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold text-gray-400">{ride.eta} min away</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 text-lg">${finalPrice.toFixed(2)}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">{distanceKm ? 'Est. Fare' : 'Base Fare'}</p>
                </div>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                     <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {showCoupons && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] p-10 max-w-sm w-full space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">Carbon Rewards</h3>
                 <button onClick={() => setShowCoupons(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-3">
                 {MOCK_COUPONS.map(c => (
                   <button 
                    key={c.id} 
                    onClick={() => { onCouponSelect(c); setShowCoupons(false); }}
                    className={`w-full p-6 rounded-[32px] border-2 flex items-center justify-between group transition-all ${activeCoupon?.id === c.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-black'}`}
                   >
                      <div className="text-left">
                        <p className="font-black text-gray-900">{c.code}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{c.description}</p>
                      </div>
                      {activeCoupon?.id === c.id && <Check className="w-5 h-5 text-emerald-500" />}
                   </button>
                 ))}
                 <button onClick={() => { onCouponSelect(null); setShowCoupons(false); }} className="w-full py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-red-500">Remove Active Reward</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RideSelector;
