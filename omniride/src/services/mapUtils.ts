/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility — Map Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Central helper for all Leaflet map tile configuration.
 * Switches between Google Maps tiles (when key is available) and
 * CartoCDN tiles (fallback for dev/offline use).
 *
 * Google Maps key is injected via:
 *   - VITE_GOOGLE_MAPS_KEY in .env.local  (local dev)
 *   - window.__GOOGLE_MAPS_KEY__           (runtime, set in index.html)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import L from 'leaflet';

// ── Key resolution ────────────────────────────────────────────────────────────
export function getGoogleMapsKey(): string | null {
  // 1. Vite build-time injection
  const viteKey = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;
  if (viteKey && viteKey !== '%VITE_GOOGLE_MAPS_KEY%') return viteKey;

  // 2. Runtime window global (set in index.html)
  const winKey = (window as any).__GOOGLE_MAPS_KEY__ as string | undefined;
  if (winKey && winKey !== '%VITE_GOOGLE_MAPS_KEY%') return winKey;

  return null;
}

// ── Tile layer factory ────────────────────────────────────────────────────────

/** Standard road map — used in MapView (customer ride booking) */
export function addRoadTiles(map: L.Map): L.TileLayer {
  const key = getGoogleMapsKey();
  if (key) {
    return L.tileLayer(
      `https://maps.googleapis.com/maps/vt?lyrs=m&x={x}&y={y}&z={z}&key=${key}`,
      { maxZoom: 20, tileSize: 256 }
    ).addTo(map);
  }
  return L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    { maxZoom: 20 }
  ).addTo(map);
}

/** Dark road map — used in RiderPortal & EnergyPortal (dark UI) */
export function addDarkTiles(map: L.Map): L.TileLayer {
  const key = getGoogleMapsKey();
  if (key) {
    // Google Maps dark style
    return L.tileLayer(
      `https://maps.googleapis.com/maps/vt?lyrs=m&x={x}&y={y}&z={z}&key=${key}&style=feature:all|element:geometry|color:0x1a1a2e&style=feature:all|element:labels.text.fill|color:0x9e9e9e`,
      { maxZoom: 20, tileSize: 256 }
    ).addTo(map);
  }
  // CartoCDN dark fallback
  return L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { maxZoom: 20 }
  ).addTo(map);
}

// ── Google Places autocomplete ─────────────────────────────────────────────────

/**
 * Attach Google Places Autocomplete to an input element.
 * Falls back to no-op if the Google Maps JS API is not loaded.
 *
 * @param inputEl  The <input> element to attach autocomplete to
 * @param onPlace  Callback fired when user selects a place
 */
export function attachPlacesAutocomplete(
  inputEl: HTMLInputElement,
  onPlace: (place: { address: string; lat: number; lng: number }) => void,
): (() => void) | null {
  const google = (window as any).google;
  if (!google?.maps?.places) {
    console.warn('[Maps] Google Places API not loaded — autocomplete unavailable');
    return null;
  }

  const autocomplete = new google.maps.places.Autocomplete(inputEl, {
    types: ['geocode', 'establishment'],
    fields: ['formatted_address', 'geometry', 'name'],
  });

  const listener = autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry?.location) return;
    onPlace({
      address: place.formatted_address || place.name || inputEl.value,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  });

  // Return cleanup fn
  return () => {
    if ((window as any).google?.maps?.event) {
      (window as any).google.maps.event.removeListener(listener);
    }
  };
}

// ── Static map thumbnail URL ──────────────────────────────────────────────────

/**
 * Returns a Google Static Maps URL for a given lat/lng.
 * Useful for order tracking thumbnails, receipts, etc.
 */
export function staticMapUrl(
  lat: number,
  lng: number,
  zoom = 15,
  size = '400x200',
): string {
  const key = getGoogleMapsKey();
  if (!key) return '';
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&maptype=roadmap&markers=color:green%7C${lat},${lng}&key=${key}`;
}

// ── Deep link to Google Maps ───────────────────────────────────────────────────

/** Opens the address in Google Maps (works without a key) */
export function googleMapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
