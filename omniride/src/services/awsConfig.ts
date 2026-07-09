/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility AWS Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * All environment variables are injected by Vite at build time from .env.local.
 * In production these values are set in the Lambda/Amplify environment — the
 * frontend never hard-codes keys.
 *
 * AWS Services used:
 *  ┌──────────────────────┬──────────────────────────────────────────────────┐
 *  │ Service              │ Purpose                                          │
 *  ├──────────────────────┼──────────────────────────────────────────────────┤
 *  │ API Gateway          │ REST facade in front of every Lambda             │
 *  │ Lambda               │ Business logic, Gemini AI proxy, payments        │
 *  │ DynamoDB             │ Primary data store (users, trips, orders…)       │
 *  │ Cognito User Pool    │ Auth (sign-up, sign-in, JWT tokens, RBAC)        │
 *  │ S3                   │ Profile pictures, reports, static assets         │
 *  │ IoT Core             │ Real-time vehicle telemetry WebSocket            │
 *  │ CloudWatch           │ Audit logs, structured platform events           │
 *  │ SNS                  │ Push notifications (ride updates, order alerts)  │
 *  └──────────────────────┴──────────────────────────────────────────────────┘
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── API Gateway base URL (all REST calls go here) ────────────────────────────
// Shape:  https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ??
  process.env.VITE_API_BASE_URL ??
  'https://PLACEHOLDER.execute-api.us-east-1.amazonaws.com/prod';

// ── AWS Region ────────────────────────────────────────────────────────────────
export const AWS_REGION: string =
  (import.meta as any).env?.VITE_AWS_REGION ??
  process.env.VITE_AWS_REGION ??
  'us-east-1';

// ── Cognito ───────────────────────────────────────────────────────────────────
// TERRA-001: Updated to unified pool opusaimobility-production
export const COGNITO_USER_POOL_ID: string =
  (import.meta as any).env?.VITE_COGNITO_USER_POOL_ID ??
  process.env.VITE_COGNITO_USER_POOL_ID ??
  'us-east-1_LKa4ElQem';

// TERRA-001: Unified web client ID
export const COGNITO_CLIENT_ID: string =
  (import.meta as any).env?.VITE_COGNITO_CLIENT_ID ??
  process.env.VITE_COGNITO_CLIENT_ID ??
  '3a207uin5o3p4k1ngk334crntl';

// ── S3 ────────────────────────────────────────────────────────────────────────
export const S3_BUCKET_NAME: string =
  (import.meta as any).env?.VITE_S3_BUCKET ??
  process.env.VITE_S3_BUCKET ??
  'opusaimobility-assets-placeholder';

export const S3_BASE_URL: string =
  (import.meta as any).env?.VITE_S3_BASE_URL ??
  process.env.VITE_S3_BASE_URL ??
  `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

// ── IoT Core WebSocket endpoint ───────────────────────────────────────────────
// Shape:  wss://<iot-endpoint>.iot.<region>.amazonaws.com/mqtt
export const IOT_ENDPOINT: string =
  (import.meta as any).env?.VITE_IOT_ENDPOINT ??
  process.env.VITE_IOT_ENDPOINT ??
  'wss://PLACEHOLDER.iot.us-east-1.amazonaws.com/mqtt';

// ── WebSocket endpoint (API Gateway — TERRA-040/041 driver location) ──────────
export const WS_ENDPOINT: string =
  (import.meta as any).env?.VITE_WS_ENDPOINT ??
  process.env.VITE_WS_ENDPOINT ??
  'wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod';

// ── SNS Topic ARN (used by Lambda — here for reference/documentation) ─────────
export const SNS_TOPIC_ARN: string =
  (import.meta as any).env?.VITE_SNS_TOPIC_ARN ??
  process.env.VITE_SNS_TOPIC_ARN ??
  'arn:aws:sns:us-east-1:PLACEHOLDER:opusaimobility-notifications';

// ── Amazon Pinpoint (push notification campaign management + analytics) ────────
export const PINPOINT_APP_ID: string =
  (import.meta as any).env?.VITE_PINPOINT_APP_ID ??
  process.env.VITE_PINPOINT_APP_ID ??
  '20d7e36cc4094a04b63b7fd1e5596fcf';

// ─────────────────────────────────────────────────────────────────────────────
// Lambda route paths  (appended to API_BASE_URL)
// Each entry maps to a dedicated Lambda function behind API Gateway.
// ─────────────────────────────────────────────────────────────────────────────
export const LAMBDA_ROUTES = {
  // ── Gemini AI Proxy ─────────────────────────────────────────────────────────
  AI_GENERATE:          '/ai/generate',           // POST  → gemini generate content
  AI_STREAM:            '/ai/stream',             // POST  → server-sent events stream
  AI_LOCATIONS:         '/ai/locations',          // POST  → location autocomplete
  AI_DISTANCE:          '/ai/distance',           // POST  → road distance & ETA
  AI_TASK_LOGISTICS:    '/ai/task-logistics',     // POST  → multi-stop routing
  AI_RIDER_MATCH:       '/ai/rider-match',        // POST  → best rider suggestion
  AI_ROUTE_OPTIMIZE:    '/ai/route-optimize',     // POST  → delivery sequence
  AI_BUSINESS_STRATEGY: '/ai/business-strategy',  // POST  → corp growth tactics

  // ── Auth (Cognito proxy) ────────────────────────────────────────────────────
  AUTH_SIGNUP:          '/auth/signup',           // POST
  AUTH_SIGNIN:          '/auth/signin',           // POST
  AUTH_SIGNOUT:         '/auth/signout',          // POST
  AUTH_REFRESH:         '/auth/refresh',          // POST
  AUTH_GET_USER:        '/auth/me',               // GET

  // ── Users / Profiles ────────────────────────────────────────────────────────
  USERS_SYNC:           '/users/sync',            // PUT   → upsert user profile
  USERS_GET:            '/users/:id',             // GET
  USERS_LIST:           '/users',                 // GET   → admin only
  USERS_UPDATE_BALANCE: '/users/:id/balance',     // PATCH

  // ── Rides ───────────────────────────────────────────────────────────────────
  RIDES_REQUEST:        '/rides/request',         // POST
  RIDES_LIST:           '/rides',                 // GET
  RIDES_ASSIGN_RIDER:   '/rides/:id/assign',      // PATCH
  RIDES_FLEET_CONFIG:   '/rides/fleet',           // GET | PUT
  RIDES_PRICING:        '/rides/pricing',         // GET | PUT

  // ── Orders (Food + Delivery) ────────────────────────────────────────────────
  ORDERS_PLACE:         '/orders',                // POST
  ORDERS_LIST:          '/orders',                // GET
  ORDERS_STATUS:        '/orders/:id/status',     // PATCH

  // ── Errands ─────────────────────────────────────────────────────────────────
  ERRANDS_PLACE:        '/errands',               // POST
  ERRANDS_LIST:         '/errands',               // GET

  // ── Payments ────────────────────────────────────────────────────────────────
  PAYMENTS_MPESA:       '/payments/mpesa',        // POST → STK Push
  PAYMENTS_STRIPE:      '/payments/stripe',       // POST → payment intent
  PAYMENTS_BANK:        '/payments/bank',         // POST → manual deposit request
  PAYMENTS_APPROVE:     '/payments/bank/approve', // PATCH → admin approval
  PAYMENTS_TRANSFER:    '/payments/transfer',     // POST → P2P wallet transfer
  PAYMENTS_HISTORY:     '/payments/history',      // GET
  PAYMENTS_SWAP:        '/payments/swap',         // POST → battery swap 90/10 split

  // ── Vendors ─────────────────────────────────────────────────────────────────
  VENDORS_LIST:         '/vendors',               // GET
  VENDORS_GET:          '/vendors/:id',           // GET
  VENDORS_STATUS:       '/vendors/:id/status',    // PATCH → admin

  // ── Inventory (Errands) ─────────────────────────────────────────────────────
  INVENTORY_LIST:       '/inventory',             // GET
  INVENTORY_UPDATE:     '/inventory/:id',         // PUT
  INVENTORY_DELETE:     '/inventory/:id',         // DELETE

  // ── Swap Stations ───────────────────────────────────────────────────────────
  STATIONS_LIST:        '/stations',              // GET
  STATIONS_REGISTER:    '/stations',              // POST
  STATIONS_STATUS:      '/stations/:id/status',   // PATCH

  // ── Blockchain / Carbon ─────────────────────────────────────────────────────
  BLOCKCHAIN_SEED:      '/blockchain/seed',       // POST → mint event
  BLOCKCHAIN_LEDGER:    '/blockchain/ledger',     // GET
  CARBON_VALIDATE:      '/carbon/validate',       // POST
  CARBON_RATE:          '/carbon/rate',           // GET

  // ── DeFi ────────────────────────────────────────────────────────────────────
  DEFI_ASSET_LOAN:      '/defi/asset-loan',       // POST
  DEFI_INSURANCE_LOAN:  '/defi/insurance-loan',   // POST

  // ── IoT Telemetry ───────────────────────────────────────────────────────────
  IOT_TELEMETRY:        '/iot/telemetry',         // GET  → latest snapshot
  IOT_FIRMWARE:         '/iot/firmware',          // POST → trigger OTA update
  IOT_STREAM_URL:       '/iot/stream-url',        // GET  → TERRA-012: signed WS URL

  // ── M-Pesa Callback (Daraja webhook) ────────────────────────────────────────
  PAYMENTS_MPESA_CALLBACK: '/payments/mpesa/callback', // POST → Daraja confirms payment

  // ── Stripe Webhook ──────────────────────────────────────────────────────────
  PAYMENTS_STRIPE_WEBHOOK: '/payments/stripe/webhook', // POST → Stripe event

  // ── Platform / Admin ────────────────────────────────────────────────────────
  PLATFORM_SETTINGS:    '/platform/settings',     // GET | PUT
  COLLECTION_ACCOUNT:   '/platform/collection',   // GET | PATCH
  AUDIT_LOGS:           '/audit/logs',            // GET
  AUDIT_LOG_ACTION:     '/audit/log',             // POST
  REPORTING_FINANCIAL:  '/reporting/financial',   // GET

  // ── Notifications ───────────────────────────────────────────────────────────
  NOTIFY_PUSH:          '/notifications/push',    // POST → SNS
  NOTIFICATIONS:        '/notifications',         // GET  → notification history
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DynamoDB Table Names  (used by Lambda — listed here for documentation)
// ─────────────────────────────────────────────────────────────────────────────
export const DYNAMO_TABLES = {
  USERS:             'opusaimobility-users',
  TRIPS:             'opusaimobility-trips',
  ORDERS:            'opusaimobility-orders',
  ERRANDS:           'opusaimobility-errands',
  TRANSACTIONS:      'opusaimobility-transactions',
  SWAP_STATIONS:     'opusaimobility-swap-stations',
  INVENTORY:         'opusaimobility-inventory',
  BLOCKCHAIN_LEDGER: 'opusaimobility-blockchain',
  AUDIT_LOGS:        'opusaimobility-audit-logs',
  PLATFORM_SETTINGS: 'opusaimobility-platform',
} as const;
