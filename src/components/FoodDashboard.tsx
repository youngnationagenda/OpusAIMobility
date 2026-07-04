
import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Clock, Bike, Heart, MapPin, Navigation, Tag, Sparkles } from 'lucide-react';
import { Restaurant, User } from '../types';
import { vendorApi } from '../services/vendorService';
import { MOCK_COUPONS } from '../constants';

interface FoodDashboardProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  user: User;
  onToggleFavorite: (id: string) => void;
}

const FoodDashboard: React.FC<FoodDashboardProps> = ({ onSelectRestaurant, user, onToggleFavorite }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<{
    price: number | null;
    minRating: number | null;
    maxTime: number | null;
  }>({ price: null, minRating: null, maxTime: null });

  // Simulate user's current coordinates
  const userCoords = { lat: 1.287953, lng: 103.851784 };

  const foodCoupons = useMemo(() => MOCK_COUPONS.filter(c => c.category === 'food' || c.category === 'all'), []);

  const filteredRestaurants = useMemo(() => {
    const vendors = vendorApi.getNearbyRestaurants(userCoords.lat, userCoords.lng);

    return vendors.filter(r => {
      const searchStr = (r.businessName + r.category).toLowerCase();
      const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
      const matchesPrice = filter.price ? 2 <= filter.price : true;
      const matchesRating = filter.minRating ? 4.8 >= filter.minRating : true;
      return matchesSearch && matchesPrice && matchesRating;
    }).sort((a, b) => {
        const aFav = user.favorites.includes(a.id);
        const bFav = user.favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.distance - b.distance;
    });
  }, [searchQuery, filter, user.favorites]);

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar bg-white h-full pb-20">
      <div className="p-6 space-y-8">
        {/* Header & Search */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
               <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Food Hub</h1>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Zero-Emission Delivery Network</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase">Grid Node: 103.85E</span>
            </div>
          </div>
          
          {/* Promos Slider */}
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-2 px-2">
             {foodCoupons.map(coupon => (
               <div key={coupon.id} className="min-w-[280px] bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[32px] text-white space-y-3 relative overflow-hidden shadow-lg shadow-indigo-100">
                  <Tag className="absolute -right-2 -bottom-2 w-20 h-20 opacity-10 rotate-12" />
                  <div className="flex justify-between items-start">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{coupon.code}</span>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  </div>
                  <h3 className="text-xl font-black leading-tight">{coupon.description}</h3>
                  <button className="text-[10px] font-black uppercase underline tracking-widest hover:text-emerald-300 transition-colors">Apply at Checkout</button>
               </div>
             ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search local dishes or restaurants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-5 bg-gray-50 rounded-[28px] border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all font-bold shadow-sm"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2">
          <button 
            onClick={() => setFilter(prev => ({ ...prev, price: prev.price === 1 ? null : 1 }))}
            className={`px-6 py-3 rounded-full border-2 whitespace-nowrap font-black text-xs uppercase tracking-widest transition-all ${filter.price === 1 ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-gray-100 text-gray-500'}`}
          >
            $ Price Range
          </button>
          <button 
             onClick={() => setFilter(prev => ({ ...prev, minRating: prev.minRating === 4.5 ? null : 4.5 }))}
            className={`px-6 py-3 rounded-full border-2 whitespace-nowrap font-black text-xs uppercase tracking-widest transition-all ${filter.minRating ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-gray-100 text-gray-500'}`}
          >
            4.5+ Rating
          </button>
          <button 
            className={`px-6 py-3 rounded-full border-2 whitespace-nowrap font-black text-xs uppercase tracking-widest bg-emerald-500 text-white border-emerald-500 shadow-md flex items-center gap-2`}
          >
            <Navigation className="w-3.5 h-3.5" /> Proximity
          </button>
        </div>

        {/* Restaurant List */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight ml-1">Top Rated Vendors</h2>
          <div className="grid grid-cols-1 gap-8">
            {filteredRestaurants.map(rest => (
              <div 
                key={rest.id} 
                onClick={() => onSelectRestaurant({
                  ...rest,
                  name: rest.businessName,
                  coverImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop',
                  rating: 4.8,
                  reviewCount: 120,
                  priceLevel: 2,
                  deliveryTime: 25,
                  deliveryFee: 2.99,
                  menu: rest.menu || [],
                  lat: rest.lat || 0,
                  lng: rest.lng || 0,
                  status: rest.status
                })}
                className="group relative bg-white rounded-[48px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="relative h-64 overflow-hidden">
                  <img src={'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={rest.businessName} />
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(rest.id); }}
                      className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg hover:scale-110 transition active:scale-90"
                    >
                      <Heart className={`w-5 h-5 ${user.favorites.includes(rest.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-6 flex gap-3">
                    <div className="px-4 py-2 bg-white/95 backdrop-blur rounded-2xl text-xs font-black shadow-lg flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      4.8
                    </div>
                    <div className="px-4 py-2 bg-black/80 backdrop-blur rounded-2xl text-xs font-black text-white shadow-lg flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      {rest.distance} km
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{rest.businessName}</h3>
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{rest.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">$2.99</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Delivery</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                     <div className="flex items-center gap-2 text-xs font-black text-gray-600 uppercase tracking-widest">
                      <Clock className="w-4 h-4 text-blue-500" />
                      25 mins
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black text-gray-600 uppercase tracking-widest">
                      <Bike className="w-4 h-4 text-emerald-500" />
                      Eco-Delivery
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDashboard;
