/**
 * OmniRide Service Worker  v2.0 — TERRA-071
 * ────────────────────────────────────────────
 * Workbox-inspired caching strategy:
 *
 *  Cache Shell:
 *    - index.html              → Network-first (always fresh)
 *    - JS/CSS assets           → Cache-first (content-hashed, immutable)
 *
 *  API Cache:
 *    - /rides/pricing          → Stale-while-revalidate (30 min TTL)
 *    - /platform/settings      → Stale-while-revalidate (30 min TTL)
 *    - /iot/telemetry          → Network-first (real-time data)
 *    - /rides/fleet            → Stale-while-revalidate (1 hour TTL)
 *
 *  Background Sync:
 *    - Failed ride requests    → queued, retried on reconnect
 *    - Failed food orders      → queued, retried on reconnect
 *
 *  Web Push:
 *    - Ride updates, order notifications, wallet alerts
 *
 *  Offline fallback:
 *    - /                       → cached index.html
 */

const CACHE_SHELL   = 'omniride-shell-v2';
const CACHE_API     = 'omniride-api-v2';
const CACHE_ASSETS  = 'omniride-assets-v2';
const SYNC_RIDES    = 'sync-ride-request';
const SYNC_ORDERS   = 'sync-food-order';

const SHELL_URLS = ['/', '/index.html'];
const STATIC_EXTENSIONS = ['.js', '.css', '.woff2', '.woff', '.ttf', '.png', '.jpg', '.svg', '.ico'];

const API_CACHE_ROUTES = [
  { pattern: '/rides/pricing',     ttl: 30 * 60 * 1000,  strategy: 'swr' },
  { pattern: '/platform/settings', ttl: 30 * 60 * 1000,  strategy: 'swr' },
  { pattern: '/rides/fleet',       ttl: 60 * 60 * 1000,  strategy: 'swr' },
  { pattern: '/iot/telemetry',     ttl: 10 * 1000,        strategy: 'network-first' },
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  event.waitUntil(
    caches.open(CACHE_SHELL).then(cache => {
      return cache.addAll(SHELL_URLS).catch(e => console.warn('[SW] Shell cache partial:', e.message));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => ![CACHE_SHELL, CACHE_API, CACHE_ASSETS].includes(k))
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch intercept ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET for caching (POST rides/orders go to background sync)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s)
  if (!url.protocol.startsWith('http')) return;

  // Static assets (content-hashed JS/CSS) → cache-first
  const isStatic = STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
  if (isStatic) {
    event.respondWith(cacheFirst(request, CACHE_ASSETS));
    return;
  }

  // API routes
  const apiRoute = API_CACHE_ROUTES.find(r => url.pathname.includes(r.pattern));
  if (apiRoute) {
    if (apiRoute.strategy === 'swr') {
      event.respondWith(staleWhileRevalidate(request, CACHE_API, apiRoute.ttl));
    } else {
      event.respondWith(networkFirst(request, CACHE_API, 5000));
    }
    return;
  }

  // Navigation requests (SPA) → network-first, fallback to shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html') || caches.match('/')
      )
    );
    return;
  }

  // Everything else → network, no cache
});

// ── Cache strategies ────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName, ttlMs) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      // Tag with timestamp for TTL check
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      cache.put(request, new Response(clone.body, { status: clone.status, headers }));
    }
    return response;
  }).catch(() => null);

  if (cached) {
    const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10);
    if (Date.now() - cachedAt < ttlMs) {
      // Still fresh — return cached immediately, update in background
      fetchPromise; // fire and forget
      return cached;
    }
  }

  // Stale or missing — wait for network
  const fresh = await fetchPromise;
  return fresh || cached || new Response('{"error":"Offline"}', {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    return cached || new Response('{"error":"Offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Background Sync ────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === SYNC_RIDES) {
    event.waitUntil(replayQueuedRequests('omniride-pending-rides'));
  }
  if (event.tag === SYNC_ORDERS) {
    event.waitUntil(replayQueuedRequests('omniride-pending-orders'));
  }
});

async function replayQueuedRequests(storeKey) {
  let pending = [];
  try { pending = JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch (_) {}
  if (!pending.length) return;

  const replayed = [];
  for (const req of pending) {
    try {
      const response = await fetch(req.url, {
        method:  req.method || 'POST',
        headers: req.headers || { 'Content-Type': 'application/json' },
        body:    req.body,
      });
      if (response.ok) replayed.push(req.id);
    } catch (_) { /* still offline — leave in queue */ }
  }

  const remaining = pending.filter(r => !replayed.includes(r.id));
  try { localStorage.setItem(storeKey, JSON.stringify(remaining)); } catch (_) {}
  console.log(`[SW] Replayed ${replayed.length}/${pending.length} queued ${storeKey} requests`);
}

// ── Web Push Notifications ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'OmniRide', message: event.data.text() }; }

  const title   = data.title   || 'OmniRide Notification';
  const message = data.message || data.body || '';
  const type    = data.type    || 'system';

  const iconMap = {
    'ride_update':       '/icons/icon-ride-96.png',
    'order_update':      '/icons/icon-food-96.png',
    'wallet_topup':      '/icons/icon-wallet-96.png',
    'wallet_topup_failed':'/icons/icon-wallet-96.png',
    'payment_success':   '/icons/icon-wallet-96.png',
    'defi_deduction':    '/icons/icon-wallet-96.png',
    'system':            '/icons/icon-192.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, {
      body:    message,
      icon:    iconMap[type] || '/icons/icon-192.png',
      badge:   '/icons/badge-72.png',
      tag:     type,
      data:    data,
      actions: type.includes('ride') ? [
        { action: 'track', title: '📍 Track Ride' },
        { action: 'dismiss', title: 'Dismiss' },
      ] : [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data   = event.notification.data || {};

  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification_click', action, data });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
