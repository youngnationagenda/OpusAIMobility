/**
 * maps.js — Google Maps API integration for aimobility
 *
 * Replaces GoGrab's Utility.php functions:
 *  - getDurationTimeBetweenTwoDistances()    → getDistanceMatrix()
 *  - getDurationTimeAndDistanceBetweenMultipleDistances() → getDirections()
 *  - getCountryCityProvinceFromLatLong()     → reverseGeocode()
 *  - calculateFare()                          → calculateFare()
 *
 * Key stored in: terraai/google-maps.GOOGLE_MAPS_KEY
 * Falls back gracefully when key not configured yet.
 */
'use strict';
const https  = require('https');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const REGION = process.env.AWS_REGION || 'us-east-1';
const sm     = new SecretsManagerClient({ region: REGION });

// Cache Google Maps key for 10 minutes
let _mapsKeyCache = null; let _mapsKeyCacheTs = 0;
async function getMapsKey() {
  if (_mapsKeyCache && Date.now() - _mapsKeyCacheTs < 600000) return _mapsKeyCache;
  try {
    const r  = await sm.send(new GetSecretValueCommand({ SecretId: 'terraai/google-maps' }));
    const s  = JSON.parse(r.SecretString);
    _mapsKeyCache   = s.GOOGLE_MAPS_KEY || '';
    _mapsKeyCacheTs = Date.now();
    return _mapsKeyCache;
  } catch (e) {
    console.warn('[maps] Could not load google-maps secret:', e.message);
    return '';
  }
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    }).on('error', reject);
  });
}

/**
 * Get distance + duration between two lat/lng points.
 * Replaces Utility::getDurationTimeBetweenTwoDistances()
 *
 * @returns {{ distanceKm, durationMinutes, distanceText, durationText, status }}
 */
async function getDistanceMatrix(originLat, originLng, destLat, destLng) {
  const key = await getMapsKey();
  if (!key) {
    // Return estimated values when no key configured
    return { distanceKm: 5.0, durationMinutes: 15, distanceText: '5 km', durationText: '15 mins', status: 'ESTIMATED', error: 'Google Maps key not configured' };
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${key}`;
  try {
    const data = await httpsGet(url);
    if (data.status !== 'OK') return { distanceKm: 5.0, durationMinutes: 15, status: data.status, error: data.error_message };
    const elem = data.rows[0].elements[0];
    if (elem.status !== 'OK') return { distanceKm: 5.0, durationMinutes: 15, status: elem.status };
    return {
      distanceKm:      elem.distance.value / 1000,
      durationMinutes: Math.round(elem.duration.value / 60),
      distanceText:    elem.distance.text,
      durationText:    elem.duration.text,
      status:          'OK',
    };
  } catch (e) {
    console.error('[maps] getDistanceMatrix error:', e.message);
    return { distanceKm: 5.0, durationMinutes: 15, status: 'ERROR', error: e.message };
  }
}

/**
 * Get directions with waypoints (multi-stop parcel orders).
 * Replaces Utility::getDurationTimeAndDistanceBetweenMultipleDistances()
 */
async function getDirections(originLat, originLng, destLat, destLng, waypoints = '') {
  const key = await getMapsKey();
  if (!key) return { totalDistanceKm: 5.0, totalDurationMinutes: 15, status: 'ESTIMATED' };
  const waypointParam = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '';
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}${waypointParam}&key=${key}`;
  try {
    const data = await httpsGet(url);
    if (data.status !== 'OK') return { totalDistanceKm: 5.0, totalDurationMinutes: 15, status: data.status };
    const legs = data.routes[0].legs;
    const totalDist = legs.reduce((a, l) => a + l.distance.value, 0);
    const totalDur  = legs.reduce((a, l) => a + l.duration.value, 0);
    return {
      totalDistanceKm:      totalDist / 1000,
      totalDurationMinutes: Math.round(totalDur / 60),
      legs:                 legs.map(l => ({ distanceKm: l.distance.value / 1000, durationMinutes: Math.round(l.duration.value / 60) })),
      status:               'OK',
    };
  } catch (e) {
    return { totalDistanceKm: 5.0, totalDurationMinutes: 15, status: 'ERROR', error: e.message };
  }
}

/**
 * Reverse geocode lat/lng to country/city/state.
 * Replaces Utility::getCountryCityProvinceFromLatLong()
 */
async function reverseGeocode(lat, lng) {
  const key = await getMapsKey();
  if (!key) return { country: '', city: '', state: '', location_string: '', status: 'NO_KEY' };
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
  try {
    const data = await httpsGet(url);
    if (!data.results || data.results.length === 0) return { country: '', city: '', state: '', location_string: '', status: data.status };
    const info = { country: '', city: '', state: '', location_string: data.results[0].formatted_address };
    data.results[0].address_components.forEach(c => {
      if (c.types.includes('country') && !info.country)                          info.country = c.long_name;
      if (c.types.includes('locality') && !info.city)                            info.city    = c.long_name;
      if (c.types.includes('administrative_area_level_1') && !info.state)        info.state   = c.long_name;
    });
    return { ...info, status: 'OK' };
  } catch (e) {
    return { country: '', city: '', state: '', location_string: '', status: 'ERROR', error: e.message };
  }
}

/**
 * Calculate ride fare.
 * Replaces Utility::calculateFare()
 *
 * @param {object} params
 * @returns {{ fare, estimatedFare, time, distance, distanceKm }}
 */
function calculateFare({ baseFare = 2.0, costPerMinute = 0.25, costPerDistance = 1.5, durationMinutes = 15, distanceKm = 5.0, distanceUnit = 'K', surgeMultiplier = 1.0 } = {}) {
  const dist  = distanceUnit === 'M' ? distanceKm * 0.621371 : distanceKm;
  const fare  = (baseFare + (costPerMinute * durationMinutes) + (costPerDistance * dist)) * surgeMultiplier;
  return {
    fare:          Math.round(fare * 100) / 100,
    estimatedFare: Math.round(fare * 100) / 100,
    time:          Math.round(durationMinutes),
    distance:      `${distanceKm.toFixed(1)} km`,
    distanceKm,
    durationMinutes,
  };
}

/**
 * Full fare estimation: distance matrix + fare calculation.
 * Used by the estimateFare Lambda route.
 */
async function estimateFare({ originLat, originLng, destLat, destLng, rideType = {} } = {}) {
  const distData = await getDistanceMatrix(originLat, originLng, destLat, destLng);
  const fare     = calculateFare({
    baseFare:        parseFloat(rideType.base_fare      || 2.0),
    costPerMinute:   parseFloat(rideType.cost_per_minute || 0.25),
    costPerDistance: parseFloat(rideType.cost_per_distance || 1.5),
    durationMinutes: distData.durationMinutes,
    distanceKm:      distData.distanceKm,
    distanceUnit:    rideType.distance_unit || 'K',
  });
  return { ...fare, ...distData, from: `${originLat},${originLng}`, to: `${destLat},${destLng}` };
}

module.exports = { getMapsKey, getDistanceMatrix, getDirections, reverseGeocode, calculateFare, estimateFare };
