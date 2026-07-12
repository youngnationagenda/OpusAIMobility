
import React from 'react';
import { RideOption } from '../types';
import { ChevronLeft, Users, Clock, DollarSign, Zap, Leaf, Sparkles } from 'lucide-react';

interface RideComparisonProps {
  rides: RideOption[];
  onSelect: (ride: RideOption) => void;
  onBack: () => void;
}

const RideComparison: React.FC<RideComparisonProps> = ({ rides, onSelect, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Eco-Intelligence</h2>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Impact & Fare Comparison</p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-emerald-100 shadow-sm">
          {rides.length} EV Nodes
        </div>
      </div>

      <div className="flex-1 overflow-x-auto hide-scrollbar flex p-8 gap-6 items-start">
        {rides.map(ride => (
          <div key={ride.id} className="min-w-[280px] flex flex-col bg-gray-50 border border-gray-100 rounded-[48px] p-8 space-y-8 relative group hover:bg-white hover:shadow-2xl hover:border-black transition-all">
             <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center text-5xl shadow-sm mx-auto group-hover:scale-110 transition-transform">
                   {ride.icon}
                </div>
                <div>
                   <h3 className="text-xl font-black">{ride.type}</h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{ride.provider}</span>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-200/50">
                <div className="flex items-center justify-between p-4 bg-white rounded-3xl">
                   <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-gray-400 uppercase">Fare</span>
                   </div>
                   <span className="text-lg font-black">${ride.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-3xl">
                   <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-black text-gray-400 uppercase">Arrival</span>
                   </div>
                   <span className="text-lg font-black">{ride.eta} min</span>
                </div>
             </div>

             {ride.price === Math.min(...rides.map(r => r.price)) && (
               <div className="bg-emerald-500 text-white py-1.5 px-4 rounded-full text-[9px] font-black uppercase absolute -top-3 left-1/2 -translate-x-1/2 shadow-xl border-2 border-white">
                  Lowest Cost
               </div>
             )}
             
             {ride.eta === Math.min(...rides.map(r => r.eta)) && (
               <div className="bg-blue-500 text-white py-1.5 px-4 rounded-full text-[9px] font-black uppercase absolute -top-3 left-1/2 -translate-x-1/2 translate-y-8 shadow-xl border-2 border-white z-10">
                  Fastest
               </div>
             )}

             <button 
               onClick={() => onSelect(ride)}
               className="w-full py-5 bg-black text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
             >
                <Zap className="w-4 h-4" /> Deploy Mission
             </button>
          </div>
        ))}
      </div>

      <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center gap-6">
         <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
            <Leaf className="w-7 h-7" />
         </div>
         <p className="text-[11px] font-bold text-gray-400 uppercase leading-relaxed max-w-2xl">
            Zero-emission grid aggregation active. We are comparing real-time efficiency and fares from RoamAir, YnaV1, Ampersand, Kiri EV, Spiro, BasiGo, and SolarTaxis. Every trip offsets carbon.
         </p>
      </div>
    </div>
  );
};

export default RideComparison;
