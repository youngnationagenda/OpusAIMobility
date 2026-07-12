/**
 * OmniRide PWA Service — TERRA-071
 * ──────────────────────────────────
 * Handles:
 *   1. Service worker registration
 *   2. Web Push subscription (subscribe / unsubscribe)
 *   3. Push permission request
 *   4. Background sync registration
 *
 * Usage (call once from App.tsx after user logs in):
 *   await pwaService.init(userId);
 */

import { awsPost } from './awsClient';
import { LAMBDA_ROUTES } from './awsConfig';

// VAPID public key for Web Push (static — not secret)
// Generated from a VAPID key pair; the private key lives in Lambda env
const VAPID_PUBLIC_KEY = 'BK9vK5VdRqZ8QhP2mL3nN4wXtYzA1fE6hJ7uC8kM0sQ2pRbVeWxDyGiFjToUcHlOdSn9aMvLgBqIrZwPuEx5';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export const pwaService = {

  /**
   * Register service worker + request push permission + subscribe.
   * Call once after successful login.
   */
  init: async (userId: string): Promise<void> => {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service workers not supported');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[PWA] Service worker registered, scope:', reg.scope);

      // Request push permission
      if ('PushManager' in window) {
        await pwaService.subscribeToPush(reg, userId);
      }

      // Register background sync
      if ('sync' in reg) {
        await (reg as any).sync.register('sync-pending-writes');
        console.log('[PWA] Background sync registered');
      }
    } catch (err: any) {
      console.warn('[PWA] SW registration failed (non-fatal):', err.message);
    }
  },

  /**
   * Subscribe user to Web Push and register endpoint with backend.
   */
  subscribeToPush: async (reg: ServiceWorkerRegistration, userId: string): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[PWA] Push permission denied');
        return false;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Register with backend (store in omniride-push-endpoints via /devices/token)
      await awsPost(LAMBDA_ROUTES.NOTIFY_PUSH.replace('/notifications/push', '/devices/token'), {
        userId,
        deviceToken: JSON.stringify(subscription),
        platform:    'web-push',
        deviceId:    `web-${navigator.userAgent.slice(0, 30)}`,
      });

      console.log('[PWA] Push subscription registered for user:', userId);
      return true;
    } catch (err: any) {
      console.warn('[PWA] Push subscription failed (non-fatal):', err.message);
      return false;
    }
  },

  /**
   * Unsubscribe from Web Push (call on logout).
   */
  unsubscribe: async (userId: string): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await awsPost('/devices/token', { userId, deviceToken: JSON.stringify(sub), action: 'remove' });
        console.log('[PWA] Push unsubscribed');
      }
    } catch (err: any) {
      console.warn('[PWA] Unsubscribe failed:', err.message);
    }
  },

  /**
   * Show a local notification (no push — immediate, used for in-app events).
   */
  showLocalNotification: async (title: string, body: string, url = '/'): Promise<void> => {
    if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      data:  { url },
    });
  },

  /**
   * Check if app is running in standalone (installed PWA) mode.
   */
  isInstalled: (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (navigator as any).standalone === true;
  },

  /**
   * Check if push notifications are supported and permitted.
   */
  isPushSupported: (): boolean => {
    return 'PushManager' in window && 'serviceWorker' in navigator;
  },

  /**
   * Get current push permission state.
   */
  getPushPermission: (): NotificationPermission => {
    return 'Notification' in window ? Notification.permission : 'denied';
  },
};
