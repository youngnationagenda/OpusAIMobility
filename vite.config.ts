import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // ─── Root & Public ─────────────────────────────────────────────────────
    root:      'src',
    publicDir: '../public',

    // ─── Dev Server ────────────────────────────────────────────────────────
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    // ─── Plugins ───────────────────────────────────────────────────────────
    plugins: [react()],

    // ─── Env injection ─────────────────────────────────────────────────────
    // VITE_* vars are automatically exposed to import.meta.env by Vite.
    // The process.env shims below are for any legacy code that reads them.
    define: {
      // AWS — exposed to frontend via awsConfig.ts
      'process.env.VITE_API_BASE_URL':          JSON.stringify(env.VITE_API_BASE_URL),
      'process.env.VITE_AWS_REGION':            JSON.stringify(env.VITE_AWS_REGION),
      'process.env.VITE_COGNITO_USER_POOL_ID':  JSON.stringify(env.VITE_COGNITO_USER_POOL_ID),
      'process.env.VITE_COGNITO_CLIENT_ID':     JSON.stringify(env.VITE_COGNITO_CLIENT_ID),
      'process.env.VITE_S3_BUCKET':             JSON.stringify(env.VITE_S3_BUCKET),
      'process.env.VITE_S3_BASE_URL':           JSON.stringify(env.VITE_S3_BASE_URL),
      'process.env.VITE_IOT_ENDPOINT':          JSON.stringify(env.VITE_IOT_ENDPOINT),
      'process.env.VITE_SNS_TOPIC_ARN':         JSON.stringify(env.VITE_SNS_TOPIC_ARN),
      // Legacy Gemini key shim (key now lives in Lambda — this is dev-only)
      'process.env.API_KEY':                    JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY':             JSON.stringify(env.GEMINI_API_KEY),
    },

    // ─── Path Aliases ──────────────────────────────────────────────────────
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    // ─── Build ─────────────────────────────────────────────────────────────
    build: {
      outDir:               '../dist',
      emptyOutDir:          true,
      sourcemap:            false,
      chunkSizeWarningLimit: 600,

      rollupOptions: {
        output: {
          /**
           * Manual Chunks — splits the ~1 MB bundle into lazy-loaded pieces.
           *
           * Chunk map:
           *  vendor-react    → React core (first paint, cached forever)
           *  vendor-ui       → Lucide icons + Leaflet
           *  vendor-ai       → @google/genai (large, rarely changes)
           *  vendor-misc     → all other node_modules
           *  chunk-aws       → awsClient + awsConfig (shared infra layer)
           *  chunk-services  → all /services/* (api, gemini, i18n, …)
           *  chunk-auth      → AuthScreen (shown before app shell loads)
           *  chunk-rides     → MapView, RideSelector, RideComparison, Checkout
           *  chunk-food      → FoodDashboard, RestaurantMenu, OrderTracking
           *  chunk-delivery  → DeliveryDashboard, DeliveryTracking, Errands
           *  chunk-rider     → RiderPortal, JobTasks, WalletHub, Analytics, Energy
           *  chunk-business  → BusinessPortal, AdminInterface, VendorPortal, Reports
           *  chunk-wallet    → UserWallet, PaymentGateways, CarbonWallet, Insurance
           *  chunk-support   → SupportCenter, Chat, Notifications, Promos, Profile
           */
          manualChunks(id: string) {
            // ── Vendor: React core ────────────────────────────────────────
            if (
              id.includes('node_modules/react')   ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')
            ) return 'vendor-react';

            // ── Vendor: UI primitives ─────────────────────────────────────
            if (
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/leaflet')
            ) return 'vendor-ui';

            // ── Vendor: Gemini AI SDK ─────────────────────────────────────
            if (id.includes('node_modules/@google')) return 'vendor-ai';

            // ── Remaining node_modules ────────────────────────────────────
            if (id.includes('node_modules')) return 'vendor-misc';

            // ── AWS infrastructure layer ──────────────────────────────────
            if (id.includes('/services/awsClient') || id.includes('/services/awsConfig')) {
              return 'chunk-aws';
            }

            // ── Services layer ────────────────────────────────────────────
            if (id.includes('/src/services/')) return 'chunk-services';

            // ── Auth ──────────────────────────────────────────────────────
            if (id.includes('AuthScreen')) return 'chunk-auth';

            // ── Rides ─────────────────────────────────────────────────────
            if (
              id.includes('MapView')           ||
              id.includes('RideSelector')      ||
              id.includes('RideComparison')    ||
              id.includes('BookingCheckout')   ||
              id.includes('AssistantPanel')    ||
              id.includes('ChargingStationHub')
            ) return 'chunk-rides';

            // ── Food ──────────────────────────────────────────────────────
            if (
              id.includes('FoodDashboard')  ||
              id.includes('RestaurantMenu') ||
              id.includes('OrderTracking')  ||
              id.includes('OrderHistory')
            ) return 'chunk-food';

            // ── Delivery / Errands ────────────────────────────────────────
            if (
              id.includes('DeliveryDashboard') ||
              id.includes('DeliveryTracking')  ||
              id.includes('ErrandPortal')
            ) return 'chunk-delivery';

            // ── Rider portal ──────────────────────────────────────────────
            if (
              id.includes('RiderPortal')            ||
              id.includes('RiderJobTasks')           ||
              id.includes('RiderWalletHub')          ||
              id.includes('RiderDashboardAnalytics') ||
              id.includes('EnergyPortal')            ||
              id.includes('MechanicDashboard')
            ) return 'chunk-rider';

            // ── Business / Admin / Vendor ─────────────────────────────────
            if (
              id.includes('BusinessPortal')  ||
              id.includes('AdminInterface')  ||
              id.includes('VendorPortal')    ||
              id.includes('VendorSecurity')  ||
              id.includes('ReportingCenter')
            ) return 'chunk-business';

            // ── Wallet / Finance ──────────────────────────────────────────
            if (
              id.includes('UserWallet')      ||
              id.includes('PaymentGateways') ||
              id.includes('CarbonWallet')    ||
              id.includes('InsuranceCenter')
            ) return 'chunk-wallet';

            // ── Support / Notifications / Profile ─────────────────────────
            if (
              id.includes('SupportCenter')      ||
              id.includes('SupportChat')        ||
              id.includes('ChatInterface')      ||
              id.includes('NotificationTray')   ||
              id.includes('NotificationOverlay')||
              id.includes('PromoCenter')        ||
              id.includes('ProfileEditor')
            ) return 'chunk-support';
          },
        },
      },
    },
  };
});
