/**
 * OmniRide Service Worker — TERRA-071
 * ─────────────────────────────────────
 * Provides:
 *   1. Offline caching (cache-first for static assets, network-first for API)
 *   2. Background sync for failed API writes
 *   3. Web Push notification display
 *   4. Push subscription management
 *
 * Cache strategy:
 *   - App shell (HTML/JS/CSS/fonts): Cache-first, update in background
 *   - API calls (/prod/*):            Network-first, fall back to cache
 *   - Images:                         Cache-first (long TTL)
 */

const CACHE_NAME       = 'omniride-v1';
const STATIC_CACHE     = 'omniride-static-v1';
const API_CACHE        = 'omniride-api-v1';

// App shell resources to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing OmniRide service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Pre-cache partial failure (non-fatal):', err.message);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating OmniRide service worker');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests (except our API)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin &&
      !url.hostname.endsWith('amazonaws.com') &&
      !url.hostname.endsWith('cloudfront.net')) return;

  // API calls: Network-first with cache fallback
  const isApiCall = url.hostname.endsWith('amazonaws.com') ||
                    url.hostname.endsWith('cloudfront.net') ||
                    url.pathname.startsWith('/prod/');

  if (isApiCall) {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  // Static assets: Cache-first with network update
  event.respondWith(cacheFirstWithUpdate(event.request, STATIC_CACHE));
});

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone()); // update cache
    }
    return response;
  } catch {
    // Offline: serve from cache
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline JSON for API calls
    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are currently offline. Data will sync when reconnected.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirstWithUpdate(request, cacheName) {
  const cached = await caches.match(request);
  // Fetch in background to update cache
  const fetchPromise = fetch(request.clone()).then(response => {
    if (response.ok) {
      caches.open(cacheName).then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let payload = { title: 'OmniRide', body: 'You have a new notification', type: 'general' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch { /* use defaults */ }

  const icon  = '/icons/icon-192.png';
  const badge = '/icons/icon-96.png';

  const notifOptions = {
    body:    payload.body,
    icon,
    badge,
    tag:     payload.type || 'general',
    renotify: true,
    vibrate: [200, 100, 200],
    data:    { url: getNotificationUrl(payload.type), payload },
    actions: [
      { action: 'open',    title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss'  },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notifOptions)
  );
});

function getNotificationUrl(type) {
  switch (type) {
    case 'ride_update':    return '/?mode=rides';
    case 'order_update':   return '/?mode=food';
    case 'food_update':    return '/?mode=food';
    case 'wallet_topup':   return '/?mode=wallet';
    case 'defi_deduction': return '/?mode=wallet';
    default:               return '/';
  }
}

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-pending-writes') {
    event.waitUntil(syncPendingWrites());
  }
});

async function syncPendingWrites() {
  // Attempt to replay any failed API writes stored in IDB by the app
  try {
    const db = await openPendingDB();
    const pending = await db.getAll('pending');
    for (const item of pending) {
      try {
        const res = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body });
        if (res.ok) await db.delete('pending', item.id);
      } catch { /* keep for next sync */ }
    }
  } catch (e) {
    console.warn('[SW] Background sync failed:', e.message);
  }
}

// Minimal IndexedDB wrapper for pending writes
function openPendingDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('omniride-pending', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => {
      const db = e.target.result;
      resolve({
        getAll: store => new Promise((res, rej) => { const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result); r.onerror = rej; }),
        delete: (store, key) => new Promise((res, rej) => { const r = db.transaction(store,'readwrite').objectStore(store).delete(key); r.onsuccess = res; r.onerror = rej; }),
      });
    };
    req.onerror = reject;
  });
}
