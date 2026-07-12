
import React, { useState, useMemo } from 'react';
import { Search, MapPin, Battery, Zap, Clock, Filter, ChevronLeft, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ChargingStation } from '../types';
import { MOCK_CHARGING_STATIONS } from '../constants';

interface ChargingStationHubProps {
  onClose: () => void;
}

const ChargingStationHub: React.FC<ChargingStationHubProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Battery Swap' | 'Fast Charge'>('All');

  const filteredStations = useMemo(() => {
    return MOCK_CHARGING_STATIONS.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'All' || s.type === filterType;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => a.distance - b.distance);
  }, [searchQuery, filterType]);

  return (
    <div className="absolute inset-0 z-[150] bg-gray-900 flex flex-col text-white animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-black">Energy Network</h2>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Station Status</p>
          </div>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-emerald-500/20">
          {filteredStations.length} Active Points
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-6 bg-gray-800 space-y-4 shadow-xl shrink-0">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search stations or locations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-900 rounded-3xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-bold text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['All', 'Battery Swap', 'Fast Charge'].map((type) => (
            <button 
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-6 py-2 rounded-full border-2 font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${filterType === type ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-gray-700 border-transparent text-gray-400'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Stations List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar bg-gray-900">
        {filteredStations.map(station => (
          <div key={station.id} className="bg-gray-800 rounded-[32px] border border-gray-700 p-5 space-y-4 hover:border-emerald-500/50 transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${station.type === 'Battery Swap' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-blue-600/20 text-blue-400'}`}>
                  {station.type === 'Battery Swap' ? <Zap className="w-8 h-8" /> : <Battery className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="font-black text-lg group-hover:text-emerald-400 transition">{station.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {station.address}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${station.isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {station.isOpen ? 'Available' : 'Closed'}
                </span>
                <p className="text-sm font-black mt-2 text-emerald-400">{station.distance} km</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-900/50 rounded-2xl p-3 flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-xl">
                     <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase">Est. Completion</p>
                    <p className="text-xs font-black">{station.estTime}</p>
                  </div>
               </div>
               <div className="bg-gray-900/50 rounded-2xl p-3 flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-xl">
                     <CheckCircle2 className={`w-4 h-4 ${station.availableSlots > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase">Availability</p>
                    <p className="text-xs font-black">{station.availableSlots}/{station.totalSlots} Slots</p>
                  </div>
               </div>
            </div>

            <button className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
              <Navigation className="w-4 h-4" /> Navigate to Station
            </button>
          </div>
        ))}

        {filteredStations.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-30">
            <AlertCircle className="w-16 h-16 mx-auto" />
            <p className="font-black uppercase tracking-widest text-sm">No stations found in this area</p>
          </div>
        )}
      </div>
      
      {/* Geolocation Mock Footer */}
      <div className="p-4 bg-gray-800 text-center border-t border-gray-700">
         <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse inline-block shrink-0" />
            Using high-precision rider geolocation
         </div>
      </div>
    </div>
  );
};

export default ChargingStationHub;
