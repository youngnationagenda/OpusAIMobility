
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BookingState, Location } from '../types';
import { MapPin, Navigation, Crosshair, RefreshCw, Plus, Minus, Leaf } from 'lucide-react';
import { addRoadTiles } from '../services/mapUtils';

interface MapViewProps {
  booking: BookingState;
  onLocationUpdate?: (type: 'pickup' | 'destination', loc: Location) => void;
}

const MapView: React.FC<MapViewProps> = ({ booking, onLocationUpdate }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const pickupMarker = useRef<L.Marker | null>(null);
  const destMarker = useRef<L.Marker | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const fleetMarkers = useRef<L.Marker[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([1.2879, 103.8517], 15);

    addRoadTiles(map);

    leafletMap.current = map;

    // Initial Fleet Load
    spawnFleet(map);

    // Map Click Listener
    map.on('click', (e) => {
      if (onLocationUpdate) {
        const type = booking.destination ? 'pickup' : 'destination';
        onLocationUpdate(type, {
          address: `Pinned Location (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`,
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      }
    });

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  const spawnFleet = (map: L.Map) => {
    fleetMarkers.current.forEach(m => m.remove());
    fleetMarkers.current = [];

    const center = map.getCenter();
    const providers = ['RoamAir', 'YnaV1', 'Ampersand', 'Kiri EV', 'Spiro', 'BasiGo', 'SolarTaxis'];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#fbbf24'];
    const icons = ['🕊️', '🚲', '🏍️', '🔌', '🔋', '🚌', '☀️'];
    
    for (let i = 0; i < 20; i++) {
      const lat = center.lat + (Math.random() - 0.5) * 0.02;
      const lng = center.lng + (Math.random() - 0.5) * 0.02;
      const idx = Math.floor(Math.random() * providers.length);
      
      const carIcon = L.divIcon({
        className: 'custom-car-icon',
        html: `<div style="transform: rotate(${Math.random() * 360}deg); background: white; border: 2px solid ${colors[idx]}; border-radius: 12px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px;">${icons[idx]}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon: carIcon }).addTo(map);
      fleetMarkers.current.push(marker);
    }
  };

  const handleLocateMe = () => {
    if (leafletMap.current) {
      leafletMap.current.setView([1.2879, 103.8517], 16, { animate: true });
    }
  };

  const handleSearchNearby = () => {
    setIsSearching(true);
    setTimeout(() => {
      if (leafletMap.current) spawnFleet(leafletMap.current);
      setIsSearching(false);
    }, 1200);
  };

  const handleZoom = (dir: 'in' | 'out') => {
    if (leafletMap.current) {
      if (dir === 'in') leafletMap.current.zoomIn();
      else leafletMap.current.zoomOut();
    }
  };

  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    const createDraggableMarker = (type: 'pickup' | 'destination', lat: number, lng: number) => {
      const isPickup = type === 'pickup';
      const icon = L.divIcon({
        className: `${type}-icon`,
        html: `<div class="w-10 h-10 ${isPickup ? 'bg-emerald-500' : 'bg-blue-500'} border-4 border-white rounded-full shadow-2xl flex items-center justify-center text-white scale-110 active:scale-125 transition-transform"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        if (onLocationUpdate) {
          onLocationUpdate(type, {
            address: `Updated Pin (${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)})`,
            lat: newPos.lat,
            lng: newPos.lng
          });
        }
      });
      return marker;
    };

    if (booking.pickup) {
      if (pickupMarker.current) pickupMarker.current.setLatLng([booking.pickup.lat, booking.pickup.lng]);
      else pickupMarker.current = createDraggableMarker('pickup', booking.pickup.lat, booking.pickup.lng);
    } else if (pickupMarker.current) {
      pickupMarker.current.remove();
      pickupMarker.current = null;
    }

    if (booking.destination) {
      if (destMarker.current) destMarker.current.setLatLng([booking.destination.lat, booking.destination.lng]);
      else destMarker.current = createDraggableMarker('destination', booking.destination.lat, booking.destination.lng);
    } else if (destMarker.current) {
      destMarker.current.remove();
      destMarker.current = null;
    }

    if (booking.pickup && booking.destination) {
      const points: [number, number][] = [[booking.pickup.lat, booking.pickup.lng], [booking.destination.lat, booking.destination.lng]];
      if (routeLine.current) routeLine.current.setLatLngs(points);
      else routeLine.current = L.polyline(points, { color: '#10b981', weight: 5, dashArray: '10, 15', opacity: 0.5 }).addTo(map);
      map.fitBounds(L.latLngBounds(points), { padding: [100, 100], animate: true });
    } else {
      if (routeLine.current) { routeLine.current.remove(); routeLine.current = null; }
    }
  }, [booking]);

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 pointer-events-none z-10 leaflet-vignette" />
      
      <div className="absolute right-6 top-24 flex flex-col gap-3 z-20">
        <button onClick={() => handleZoom('in')} className="p-4 bg-white rounded-2xl shadow-xl hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"><Plus className="w-5 h-5" /></button>
        <button onClick={() => handleZoom('out')} className="p-4 bg-white rounded-2xl shadow-xl hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"><Minus className="w-5 h-5" /></button>
        <div className="h-4" />
        <button onClick={handleLocateMe} className="p-4 bg-white rounded-2xl shadow-xl hover:bg-gray-50 active:scale-95 transition-all text-emerald-600 border border-gray-100"><Crosshair className="w-5 h-5" /></button>
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <button 
          onClick={handleSearchNearby}
          disabled={isSearching}
          className="px-8 py-4 bg-black text-white rounded-full shadow-2xl flex items-center gap-3 hover:bg-gray-800 active:scale-95 transition-all border border-white/10 disabled:opacity-50"
        >
          {isSearching ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Leaf className="w-4 h-4 text-emerald-400" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scan Zero-Emission Grid</span>
        </button>
      </div>
    </div>
  );
};

export default MapView;
