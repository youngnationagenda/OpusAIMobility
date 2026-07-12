
import React, { useState } from 'react';
import { Search, MapPin, Star, Phone, Wrench } from 'lucide-react';
import { MOCK_MECHANICS } from '../constants';
import { Mechanic } from '../types';

const MechanicDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_MECHANICS.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.distance - b.distance);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-gray-900">Nearby Mechanics</h1>
            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Live Geolocation
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search services (oil change, brakes...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-3xl border-2 border-transparent focus:border-black shadow-sm outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map(mech => (
            <div key={mech.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex gap-4 hover:shadow-md transition cursor-pointer group">
              <img src={mech.image} className="w-24 h-24 rounded-2xl object-cover" alt={mech.name} />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-lg group-hover:text-blue-600 transition">{mech.name}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${mech.isOpen ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {mech.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-500">{mech.specialty}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {mech.rating}
                  </div>
                  <span>•</span>
                  <span>{mech.distance} km away</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <a href={`tel:${mech.phone}`} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-center text-xs flex items-center justify-center gap-2 hover:bg-blue-100 transition">
                    <Phone className="w-3 h-3" /> Call Shop
                  </a>
                  <button className="flex-1 py-2 bg-black text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition">
                    <MapPin className="w-3 h-3" /> Directions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;
