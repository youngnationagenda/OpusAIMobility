# OpusAIMobility — 100% Zero-Emission Mobility Platform

> An AI-powered, full-stack ride-hailing & logistics dashboard aggregating electric-only mobility providers (RoamAir, Spiro, BasiGo, Ampersand, Kiri EV, SolarTaxis & more) with blockchain carbon tracking, DeFi wallet, IoT telemetry and Gemini AI integration.

---

## 📁 Enterprise Monorepo Structure

```
MobilityAIapp/
│
├── frontend/                         # React 19 + TypeScript SPA (Vite 6)
│   ├── src/
│   │   ├── components/               # 36 UI components
│   │   ├── services/                 # 12 business logic services
│   │   ├── App.tsx / index.tsx       # Entry points
│   │   ├── types.ts                  # TypeScript definitions
│   │   └── constants.tsx             # Mock data & constants
│   └── public/                       # Static assets (manifest, sw.js)
│
├── backend/
│   └── lambda/                       # All AWS Lambda functions
│       ├── index.js                  # terraaimobility-api  ★ PRIMARY (v3.1, JWT Auth)
│       ├── user-migration/           # Cognito migration trigger (bcrypt + RDS)
│       ├── push-notification/        # FCM + IoT + WebSocket fanout
│       ├── reporting/                # Financial reporting (terraai-reporting)
│       ├── terraaimobility-api/      # Versioned API source
│       ├── stripe/                   # Stripe payment integration
│       ├── mpesa/                    # M-Pesa Daraja integration
│       ├── airtel/                   # Airtel Money integration
│       ├── blockchain/               # Carbon ledger (TCRBN)
│       ├── celo-deploy/              # TerraCarbon Celo contract deployment
│       ├── defi-settlement/          # DeFi settlement engine
│       ├── telemetry-ingest/         # IoT telemetry pipeline
│       └── secrets-rotation/         # Secrets Manager rotation
│
├── shared/                           # @opusaimobility/common — shared package
│   └── src/
│       ├── auth/                     # JWT decode, RBAC, Cognito config types
│       ├── constants/                # Error codes, HTTP status, env var names
│       ├── types/                    # Migration, user, file interfaces
│       ├── routing.ts                # API Gateway path routing (terra/ prefix)
│       ├── cors.ts                   # CORS header middleware
│       ├── device-tokens.ts          # Push notification token management
│       ├── file-retrieval.ts         # Pre-signed URL resolution
│       ├── file-validation.ts        # File upload size validation
│       ├── env-validation.ts         # Env var bootstrap validation
│       ├── ci-path-filter.ts         # CI/CD job trigger logic
│       └── i18n.ts                   # i18n helpers
│
├── tests/                            # 29 test suites — property-based (fast-check)
│   ├── auth/                         # JWT, RBAC, user migration (3 suites)
│   ├── ci/                           # Path filter, APK upload (2 suites)
│   ├── migration/                    # DB export/import/verify (8 suites)
│   ├── notifications/                # Token limit, rotation, sync (4 suites)
│   ├── routing/                      # CORS, routing, IoT WS (6 suites)
│   └── terra-api/                    # File upload, env, admin (5 suites)
│
├── scripts/
│   ├── ci/                           # @opusaimobility/ci — APK S3 upload
│   ├── migrate/                      # @opusaimobility/migrate — DB migration tools
│   └── setup/                        # FCM/SNS, Lambda attachment scripts
│
├── server/                           # Node.js Express proxy server
│   ├── server.js                     # Gemini API proxy + WebSocket relay
│   └── public/                       # Service worker, WS interceptor
│
├── android/
│   ├── customer/                     # Customer Android app (Gradle)
│   └── driver/                       # Driver Android app (Gradle)
│
├── infrastructure/                   # AWS infrastructure configs
│   ├── iam/                          # IAM roles & policies
│   ├── dynamodb/                     # Table definitions (11 tables)
│   ├── iot/                          # IoT rules & policies
│   ├── cloudfront/                   # CDN distribution configs
│   ├── ecs/                          # ECS task definitions
│   ├── vpc/                          # RDS network & security groups
│   └── monitoring/                   # CloudWatch, GuardDuty
│
├── blockchain/                       # Solidity contracts (TerraCarbon)
│
├── package.json                      # Root workspace (npm workspaces)
├── vite.config.ts                    # Vite build (14 manual chunks)
├── vitest.config.ts                  # Test runner configuration
├── tsconfig.json                     # Root TypeScript config
├── buildspec.yml                     # AWS CodeBuild CI/CD spec
└── Dockerfile                        # Multi-stage production build
```

---

## 🧪 Test Suite

```bash
npm test
```

**29 test files | 224 tests | 100% passing**

| Domain | Suites | Tests | Coverage |
|--------|--------|-------|----------|
| Auth / RBAC / Migration | 3 | 39 | JWT, bcrypt, Cognito trigger |
| CI Path Filter + APK | 2 | 19 | Build job routing, S3 upload |
| DB Migration | 8 | 62 | Export, import, verify, row-count |
| Notifications | 4 | 12 | Token limit, rotation, stale removal |
| API Routing / CORS | 6 | 22 | Terra prefix, CORS, IoT WS, i18n |
| TerraAPI | 5 | 30 | File upload, env-validation, admin |
| Reporting / Sync / Errands | 1 | 40 | Financial calc, errand totals |

All tests use **property-based testing** via [fast-check](https://fast-check.dev/) — hundreds of random inputs per assertion.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org))
- **Gemini API Key** ([get one free](https://aistudio.google.com/app/apikey))

### 1. Install Dependencies

```bash
npm install
cd server && npm install && cd ..
```

### 2. Configure Environment

```env
# .env.local
GEMINI_API_KEY=your_actual_gemini_api_key_here
VITE_API_BASE_URL=https://your-api-gateway-url/prod
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXX
VITE_COGNITO_CLIENT_ID=your_client_id
```

### 3. Run Development Server

```bash
npm run dev         # → http://localhost:3000
```

### 4. Build for Production

```bash
npm run build       # → dist/
npm run server      # Serve via Express proxy
```

---

## ☁️ Live AWS Infrastructure

| Service | Resource | Description |
|---------|----------|-------------|
| **Lambda** | `terraaimobility-api` | Primary API (v3.1, Node 22, JWT Auth, 30s timeout) |
| **Lambda** | `opusaimobility-push-notification` | FCM + IoT + WebSocket push fanout |
| **Lambda** | `opusaimobility-user-migration` | Cognito trigger — bcrypt + RDS validation |
| **Lambda** | `terraai-reporting` | Financial analytics reporting |
| **Lambda** | `opusaimobility-celo-deploy` | TerraCarbon Celo contract deployment |
| **Lambda** | `terraai-stripe` / `terraai-mpesa` / `terraai-airtel` | Payment integrations |
| **Lambda** | `terraai-blockchain` / `terraai-defi-settlement` | Carbon ledger + DeFi |
| **DynamoDB** | 11 tables | Users, trips, orders, errands, transactions, stations, ... |
| **Cognito** | User Pool | Auth + user migration trigger attached |
| **API Gateway** | HTTP API | JWT authorizer, CORS, `/terra/*` routing |
| **S3** | `aimobility-uploads-683541453923` | File uploads (pre-signed URLs) |
| **SNS** | `opusaimobility-notifications` | Push notification fanout topic |
| **IoT Core** | ATS endpoint | MQTT telemetry for rider devices |
| **CloudFront** | CDN | Frontend delivery + API distribution |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS (CDN), Custom CSS |
| Maps | Leaflet.js 1.9.4 |
| Icons | Lucide React |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| State | React useState/useEffect (localStorage + DynamoDB sync) |
| Server | Node.js, Express 4, WebSocket (`ws`) |
| Backend | AWS Lambda (Node 22), DynamoDB, Cognito, SNS, IoT Core |
| Auth | AWS Cognito (RS256 JWT, RBAC, user migration) |
| Payments | M-Pesa Daraja, Stripe, Airtel Money |
| Blockchain | Celo (TerraCarbon TCRBN token), VCS carbon registry |
| CI/CD | AWS CodeBuild, buildspec.yml, GitHub Actions (OIDC) |
| Testing | Vitest 4, fast-check (property-based) |
| Deployment | Docker, CodeBuild, S3 + CloudFront |

---

## 🌍 Features

| Module | Description |
|--------|-------------|
| 🚗 **Ride Booking** | Book EV rides from 10 providers with AI routing |
| 🤖 **AI Routing** | Gemini AI calculates distances, suggests routes, matches riders |
| 🗺️ **Live Map** | Leaflet.js interactive map with pickup/destination markers |
| 🍔 **Food Delivery** | Browse restaurants, cart, place & track food orders |
| 📦 **Parcel Delivery** | Send/receive parcels with KYC-verified contacts |
| 🛒 **Errand Service** | Hire dedicated riders for hourly/half-day/full-day errands |
| 🔋 **Energy Hub** | Battery swap station discovery, booking & payment |
| 🏍️ **Rider Dashboard** | Mission feed, job tasks, telemetry analytics, earnings wallet |
| 🏢 **Business Portal** | Corporate fleet management, employee accounts, dedicated riders |
| 🛒 **Vendor Portal** | Restaurant menu management, order fulfilment, revenue tracking |
| 🛡️ **Admin Interface** | Full RBAC, fleet config, pricing control, audit logs, finance reserve |
| 💰 **OmniWallet** | Multi-currency wallet with M-Pesa, Stripe, PayPal, Visa/MC top-up |
| 🌱 **Carbon Wallet** | Blockchain carbon credit tracking, DeFi trading |
| 📊 **Analytics** | Rider performance, business KPIs, reporting centre |
| 🌐 **i18n** | English, Spanish, French, Chinese |

---

## 🐳 Docker Deployment

```bash
docker build -t opusaimobility .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key opusaimobility
```

---

## 🔄 GoGrab Legacy Migration (December 2022 → July 2026)

### Source
`Go Grab Customer 6 December 2022/` — Android ride-hailing app with PHP/MySQL backend

### What Was Migrated

| Source | Destination | Status |
|--------|-------------|--------|
| `PHP API/Database/gograb.sql` (110 KB, 56 tables) | 23 DynamoDB tables | ✅ **LIVE** |
| `PHP API/mobileapp_api/` (CakePHP) | `backend/lambda/gograb-api/gograb-handler.js` | ✅ **LIVE** |
| `Admin panel/restaurant/` (PHP dashboard) | `frontend/src/components/GoGrabRestaurantPanel.tsx` | ✅ React |
| `Admin panel/portal/` (assets) | `legacy/admin-panel/portal/assets/` | ✅ Archived |
| GoGrab Admin Portal | `frontend/src/components/GoGrabAdminPanel.tsx` | ✅ React |
| PHP API routes | `/gograb/api/*` and `/gograb/admin/*` | ✅ Lambda |

### Database Migration: MySQL 56 Tables → 23 DynamoDB Tables

| MySQL Table(s) | DynamoDB Table | Seeded Rows |
|----------------|----------------|-------------|
| `user` | `gograb-users` | 0 (empty in source) |
| `restaurant` | `gograb-restaurants` | **5** (Gril Hub, Zook, Planet Pizza, Coffee Bar, Buzuka) |
| `restaurant_menu` | `gograb-restaurant-menus` | 0 |
| `restaurant_menu_item` | `gograb-restaurant-menu-items` | 0 |
| `food_order` | `gograb-food-orders` | 0 |
| `parcel_order + parcel_order_multi_stop` | `gograb-parcel-orders` | 0 |
| `trip + trip_history` | `gograb-trips` | 0 |
| `request` | `gograb-requests` | 0 |
| `vehicle` | `gograb-vehicles` | 0 |
| `vehicle_type` | `gograb-vehicle-types` | 0 |
| `ride_section + ride_type` | `gograb-ride-types` | **3** (GrabGo, Moto, Grab Mini) |
| `coupon + coupon_used` | `gograb-coupons` | 0 |
| `food_category` | `gograb-food-categories` | **8** (Home Style, Pizza, Burger, Dasi Thal, Chicken, Biryani, Fries, Sandwich) |
| `package_size` | `gograb-package-sizes` | **4** (Small, Medium, Large, X Large) |
| `good_type` | `gograb-good-types` | **7** (Groceries, Electronics, Medicament, …) |
| `notification` | `gograb-notifications` | 0 |
| `driver_rating` | `gograb-driver-ratings` | 0 |
| `order_transaction` | `gograb-transactions` | 0 |
| `user_document` | `gograb-user-documents` | 0 |
| `service_charge` | `gograb-service-charges` | **3** |
| `html_page` | `gograb-html-pages` | **3** (Privacy Policy, T&C) |
| `withdraw_request` | `gograb-withdraw-requests` | 0 |
| `app_slider + country + language + coin_worth` | `gograb-app-config` | **242** (236 countries + 4 sliders + 2 languages) |

### API Endpoints (all live at `/gograb/*`)

```
POST /gograb/api/register           — User registration
POST /gograb/api/login              — User login
GET  /gograb/api/restaurants        — List restaurants
GET  /gograb/api/restaurant/:id     — Restaurant + menus
GET  /gograb/api/restaurantMenu     — Menu sections + items
POST /gograb/api/place_food_order   — Place food order
GET  /gograb/api/food_orders        — User's food orders
POST /gograb/api/food_order_status  — Update order status
POST /gograb/api/place_parcel_order — Place parcel delivery
GET  /gograb/api/parcel_orders      — User's parcel orders
POST /gograb/api/create_request     — Ride request
POST /gograb/api/create_trip        — Create trip
GET  /gograb/api/trips              — User/driver trips
GET  /gograb/api/food_categories    — Food categories (8)
GET  /gograb/api/package_sizes      — Package sizes (4)
GET  /gograb/api/good_types         — Good types (7)
GET  /gograb/api/vehicle_types      — Vehicle types
GET  /gograb/api/ride_types         — Ride types (3)
POST /gograb/api/validate_coupon    — Coupon validation
GET  /gograb/api/notifications      — User notifications
POST /gograb/api/rate_driver        — Driver rating
POST /gograb/api/withdraw           — Withdrawal request
GET  /gograb/admin/stats            — Platform dashboard stats
GET  /gograb/admin/users            — All users
GET  /gograb/admin/restaurants      — All restaurants
GET  /gograb/admin/food_orders      — All food orders
GET  /gograb/admin/trips            — All trips
POST /gograb/admin/user/:id/block   — Block/unblock user
POST /gograb/admin/restaurant/:id/block — Block restaurant
```

### Frontend Components Added

| Component | Route | Description |
|-----------|-------|-------------|
| `GoGrabAdminPanel.tsx` | Admin sidebar → 🛍 icon | Full admin portal: stats, users, restaurants, orders, trips, withdrawals |
| `GoGrabRestaurantPanel.tsx` | Restaurant owners | Dashboard, order management, menu CRUD |
| `gograbService.ts` | Frontend service | Complete TypeScript API client for all GoGrab endpoints |

### Files Preserved

```
legacy/
├── admin-panel/          ← Original PHP admin panel (573 files, fully preserved)
│   ├── restaurant/       ← dashboard.php, foodOrders.php, restaurantManageMenu.php, …
│   └── portal/assets/    ← CSS, JS, CKEditor assets
├── php-api/mobileapp_api/ ← Original CakePHP API source (121 files)
│   └── app/Controller/   ← ApiController.php, AdminController.php, VendorController.php
└── database/
    ├── gograb.sql         ← Original MySQL dump (110 KB, 56 tables, all seed data)
    ├── gograb-dynamodb-tables.json  ← DynamoDB table definitions
    ├── provision-tables.cjs         ← Table provisioner script
    └── seed-from-sql.cjs            ← SQL→DynamoDB data seeder
```

---

## 📄 License

Private — OpusAIMobility Platform © 2025
