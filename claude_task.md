# Terra-AI-Mobility — CTO-Level Engineering Blueprint
## Full Implementation Plan & Design Task Breakdown

> **Classification:** Internal Engineering Roadmap | **Version:** 2.0.0  
> **Date:** 2026-07-06 | **Author:** Opus AI Engineering (CTO Blueprint)  
> **Codebases Audited:** `opusaimobility/` (React 19 TypeScript PWA) + `TerraAI/` (Android Java + Node.js Lambda + PHP Admin)  
> **Document Type:** Sprint-Ready CTO Blueprint with Task Tickets  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Codebase Audit — Delta Analysis](#2-codebase-audit--delta-analysis)
3. [Unified System Architecture](#3-unified-system-architecture)
4. [Architecture Diagrams](#4-architecture-diagrams)
5. [Frontend Architecture — Component Map](#5-frontend-architecture--component-map)
6. [Full API Route Specification](#6-full-api-route-specification)
7. [Telemetry Ingestion Pipeline](#7-telemetry-ingestion-pipeline)
8. [Blockchain & Carbon Credit Contracts](#8-blockchain--carbon-credit-contracts)
9. [Authentication, RBAC & KYC Flow](#9-authentication-rbac--kyc-flow)
10. [Infrastructure Provisioning (IaC)](#10-infrastructure-provisioning-iac)
11. [Monitoring & Observability Stack](#11-monitoring--observability-stack)
12. [CI/CD Strategy & Pipeline Design](#12-cicd-strategy--pipeline-design)
13. [Data Flow Diagrams](#13-data-flow-diagrams)
14. [Sprint Task Tickets — Epics & Stories](#14-sprint-task-tickets--epics--stories)
15. [Risk Register](#15-risk-register)
16. [Team Structure & Ownership Map](#16-team-structure--ownership-map)

---

## 1. EXECUTIVE SUMMARY

Terra-AI-Mobility is a next-generation, multi-platform electric vehicle (EV) ride-hailing ecosystem targeting East African urban mobility markets. It uniquely combines:

- **AI-driven dispatch** via Google Gemini 2.0 Flash (proxied through AWS Lambda — API key never in client)
- **Real-time IoT telemetry** from EV battery management systems via AWS IoT Core (MQTT/WebSocket)
- **Carbon credit blockchain** ledger on a Celo-compatible chain (Lambda-simulated, ready for real deployment)
- **DeFi asset financing** for riders (bike purchase loans + insurance installments via EventBridge auto-deduct)
- **Multi-role platform** — Customer, Rider, Vendor, Business/Corporate, Admin
- **Multi-app delivery** — React TypeScript PWA (web) + Android Java native app

### Business Model Summary

| Revenue Stream | Mechanism | Split |
|---|---|---|
| Ride fares | Per-km pricing ($0.37/km base), surge multiplier | 90% rider / 10% platform |
| Food orders | Restaurant commission + delivery fee | Configurable % |
| Parcel delivery | Fee-per-delivery | 90% rider / 10% platform |
| Battery swaps | Station-owner revenue + platform fee | 90% owner / 10% platform |
| Business subscriptions | Corporate dedicated rider monthly plan | Fixed monthly fee |
| DeFi loans | 10% p.a. interest on asset/insurance financing | 100% platform |
| Carbon credits | OMNI token trading from eco-scores | Market rate |

### Current State Assessment

Both codebases are **production-deployed on AWS** (Account: 683541453923, Region: us-east-1).

| Component | Status | Location |
|---|---|---|
| OpusAIMobility PWA | Live at S3/CloudFront | `opusaimobility/` |
| TerraAI API Lambda | Live — opusaimobility-api | `TerraAI/aws/lambda/api` |
| Push Notification Lambda | Live — opusaimobility-push | `TerraAI/aws/lambda/push` |
| WebSocket Lambda | Live — opusaimobility-ws | `TerraAI/aws/lambda/ws` |
| OpusAIMobility Lambda | Live — opusaimobility-api | `opusaimobility/aws/lambda` |
| Admin Panel Lambda | Live — opusaimobility-admin | `TerraAI/aws/admin-panel` |
| Android App | Debug APK built | `TerraAI/Debug APK` |
| Cognito User Pool (TerraAI) | us-east-1_HA6twtr4a | AWS |
| Cognito User Pool (OpusAIMobility) | us-east-1_3lWqQNDwm | AWS |
| DynamoDB Tables | 10 tables (opusaimobility-*) + 8 tables (opusaimobility-*) | us-east-1 |

---

## 2. CODEBASE AUDIT — DELTA ANALYSIS

### 2.1 OpusAIMobility (`opusaimobility/`)

**Tech Stack:**
- React 19 + TypeScript + Vite 6 + Tailwind CSS
- Leaflet.js for mapping (dark tile overlay)
- Lucide-react for icons
- AWS SDK v3 (Cognito, SNS, Secrets Manager, IoT Core)
- DynamoDB via API Gateway → Lambda (single monolithic handler)
- Google Gemini 2.0 Flash via Lambda proxy

**What exists and works:**
- Full multi-role UI: Customer / Rider / Vendor / Business / Admin
- Location autocomplete via Gemini AI
- Road distance/duration AI calculation
- Ride booking with escrow wallet deduction
- Food ordering with restaurant menu system
- Parcel delivery with KYC contact verification
- Errand portal with shopping list builder
- Rider portal with job acceptance flow
- Battery swap with 90/10 payment split
- Energy hub with IoT telemetry + map visualization
- Fleet telemetry dashboard (live IoT polling)
- Carbon credit ledger (blockchain simulation)
- DeFi loan calculator + financing request
- Admin interface: fleet config, pricing, RBAC, settlement engine, audit logs
- Business portal: corporate billing, dedicated rider management
- Full RBAC with Cognito JWT custom claims
- Notification system (overlay + tray)
- Multi-language support (en/es/fr/zh)
- GitHub Actions CI/CD: TypeScript check → Vite build → Lambda deploy → S3 sync → smoke test

**Gaps / Incomplete:**
- IoT WebSocket uses PLACEHOLDER endpoint in env (live streaming not wired)
- Blockchain is simulation only — no real Celo/Ethereum contract deployed
- Carbon registry validation is mock — not connected to VCS/Gold Standard API
- Stripe payment intent only creates a local record — no real Stripe SDK integration
- M-Pesa STK Push hits Lambda but Lambda has no real Daraja API credentials
- Gemini AI distance/routing uses simple prompt — no Google Maps API for accuracy
- No real WebSocket for live driver tracking (polling only)
- Push notifications via SNS but platform ARN is PENDING_SNS_PLATFORM_APP
- No user-facing email verification flow
- Admin reporting endpoint returns hardcoded mock data
- No rate limiting on Lambda API
- No WAF on API Gateway

### 2.2 TerraAI (`TerraAI/`)

**Tech Stack:**
- Android Java (native) — customer mobile app
- Node.js Lambda — unified API handler (DynamoDB + Cognito)
- PHP admin panel (restaurant management, legacy CakePHP-style)
- AWS SNS for push (FCM via platform endpoint)
- AWS Cognito (USER_POOL: us-east-1_HA6twtr4a)

**What exists and works:**
- Full ride booking API (requestRide, getRideHistory, trackDriver, estimateFare)
- Food ordering complete (placeFoodOrder, updateOrderStatus, trackFoodOrder)
- Parcel delivery API (createParcelOrder, trackParcelOrder)
- Cognito JWT auth with DynamoDB user sync
- Email-based GSI for fast user lookup (upgraded from Scan)
- Push notification Lambda v2 with retry logic + DLQ + auto-cleanup stale endpoints
- SNS topic fan-out for ride/order/broadcast events
- WebSocket Lambda for real-time messaging
- GitHub Actions CI/CD: npm install → zip → Lambda deploy → versioning → LIVE alias → rollback
- Admin panel (PHP) with restaurant management

**Gaps / Incomplete:**
- No telemetry/IoT integration
- No blockchain/carbon credit system
- No DeFi loans
- No corporate/business portal
- No errand system
- Android app has FCM token registration but SNS Platform App ARN is empty
- PHP admin panel is legacy — not containerized
- No real M-Pesa or Stripe in Lambda
- Wallet balance stored as string "0.00" not number — type inconsistency
- No CORS on WebSocket
- Config table uses 5-min in-memory cache but Lambda may cold-start

### 2.3 Key Differences Summary

| Dimension | OpusAIMobility | TerraAI |
|---|---|---|
| Frontend | React 19 PWA (modern) | Android Java (native) |
| API style | RESTful path-based routing | Single-route POST with `route` field |
| Auth | Cognito JWT only | Cognito + API-key fallback |
| Push notification | Basic SNS publish | Mature v2: retry + DLQ + cleanup |
| CI/CD rollback | No automatic rollback | Alias-based instant rollback |
| Versioning | Basic publish-version | Snapshot + rollback on smoke fail |
| Admin | React component (modern) | PHP legacy panel |
| IoT/Telemetry | Implemented (frontend+Lambda) | Not present |
| Blockchain | Simulated ledger | Not present |
| DeFi | Loan calculator | Not present |

---

## 3. UNIFIED SYSTEM ARCHITECTURE

### 3.1 Platform Layers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TERRA-AI-MOBILITY UNIFIED PLATFORM                        │
├─────────────────────┬───────────────────────┬───────────────────────────────────┤
│  PRESENTATION       │  INTELLIGENCE         │  PERSISTENCE                      │
│  LAYER              │  LAYER                │  LAYER                            │
├─────────────────────┼───────────────────────┼───────────────────────────────────┤
│ React 19 PWA        │ Google Gemini 2.0     │ DynamoDB (18+ tables)             │
│ (Web — all roles)   │ Flash (Lambda proxy)  │ RDS Aurora (TerraAI migration)    │
│                     │                       │ S3 (assets, APKs, reports)        │
│ Android Java App    │ AWS IoT Core          │ ElastiCache (session/config)      │
│ (Customer mobile)   │ (MQTT telemetry)      │ Secrets Manager (API keys)        │
│                     │                       │                                   │
│ Admin React Panel   │ Celo Blockchain       │ CloudWatch (logs/metrics)         │
│ (replaces PHP)      │ (carbon credits)      │ X-Ray (distributed traces)        │
└─────────────────────┴───────────────────────┴───────────────────────────────────┘
```

### 3.2 AWS Services Inventory

| Service | Purpose | Current State |
|---|---|---|
| **API Gateway HTTP v2** | Unified REST facade | 2 APIs → merge to 1 |
| **API Gateway WebSocket** | Real-time tracking | Live (opusaimobility-ws) |
| **Lambda (Node 18.x)** | Business logic, AI proxy, payments | 5 functions |
| **DynamoDB** | Primary data store | 18 tables |
| **RDS Aurora Serverless** | TerraAI MySQL migration target | NEW |
| **Cognito User Pool** | Auth, JWT, RBAC | 2 pools → merge to 1 |
| **S3** | Frontend + APK hosting | opusaimobility-assets-prod |
| **CloudFront** | CDN, HTTPS, SPA routing | Live |
| **IoT Core** | EV telemetry MQTT broker | Endpoint configured |
| **SNS** | Push notifications | 3 topics |
| **EventBridge** | Scheduled DeFi deductions | Needs rule creation |
| **CloudWatch** | Logs, metrics, alarms | Lambda auto-logging |
| **Secrets Manager** | Gemini, Stripe, M-Pesa keys | opusaimobility/gemini-api-key |
| **Route 53** | DNS | Configured |
| **ACM** | SSL certificates | Configured |
| **SQS (DLQ)** | Push Lambda dead-letter | Configured |
| **VPC** | Network isolation | NEW for RDS |
| **WAF** | API protection | NEW |
| **GuardDuty** | Threat detection | NEW |

### 3.3 Service Topology

```
                        INTERNET
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌───▼──────┐
         │CloudFront│  │Route 53 │  │ ACM SSL  │
         │  CDN     │  │  DNS    │  │          │
         └────┬────┘  └─────────┘  └──────────┘
              │
         ┌────▼────────────────┐
         │    S3 Static Bucket  │──── APK downloads
         │  (React PWA + APKs)  │
         └─────────────────────┘
              │ API calls
              ▼
         ┌──────────────────────────┐
         │    API Gateway v2 + WAF  │
         │   (HTTP + WebSocket)     │
         └────────────┬─────────────┘
                      │ invoke
          ┌───────────┼───────────┬────────────┐
          ▼           ▼           ▼            ▼
     ┌─────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐
     │opusaimobility │ │TerraAI  │ │ Push   │ │Telemetry│
     │-api     │ │-api     │ │Lambda  │ │-ingest  │
     │Lambda   │ │Lambda   │ │  v2    │ │Lambda   │
     └────┬────┘ └────┬────┘ └───┬────┘ └────┬────┘
          │           │          │            │
          └─────┬─────┘          │            │
                │                │            │
          ┌─────▼──────┐   ┌────▼───┐   ┌────▼────────┐
          │ DynamoDB   │   │  SNS   │   │ IoT Core    │
          │ (18+ tbls) │   │Topics  │   │ MQTT Broker │
          └─────┬──────┘   └────────┘   └─────────────┘
                │
          ┌─────▼────┐    ┌──────────────┐
          │ RDS      │    │Secrets Mgr   │
          │ Aurora   │    │(Gemini,Stripe │
          │(TerraAI) │    │ M-Pesa,Celo) │
          └──────────┘    └──────────────┘
```

---

## 4. ARCHITECTURE DIAGRAMS

### 4.1 Ride Booking Data Flow

```
Customer App (React/Android)
        │
        │ POST /rides/request  (JWT Bearer)
        ▼
API Gateway HTTP v2 + WAF
        │
        │ invoke
        ▼
opusaimobility-api Lambda
        │
        ├─── DynamoDB PutItem → opusaimobility-trips
        ├─── DynamoDB UpdateItem → opusaimobility-users (deduct wallet)
        ├─── DynamoDB PutItem → opusaimobility-transactions
        ├─── SNS Publish → opusaimobility-ride-events topic
        │         │
        │         └──► Push Lambda v2 → FCM → Rider device
        │
        └─── Response: { user: updatedUser }

        │  (Rider accepts via Android/PWA)
        ▼
PATCH /rides/:id/assign
        │
        ├─── DynamoDB UpdateItem → opusaimobility-trips (riderId, status=on_ride)
        ├─── SNS Publish → customer notification
        └─── WebSocket → customer real-time update
```

### 4.2 IoT Telemetry Pipeline

```
EV Battery Management System (BMS)
        │
        │ MQTT publish every 30s
        │ Topic: opusaimobility/telemetry/{riderId}
        ▼
AWS IoT Core Message Broker
        │
        │ IoT Rule: SELECT *, topic(3) as riderId
        │ FROM 'opusaimobility/telemetry/+'
        ▼
telemetry-ingest Lambda
        │
        ├─── DynamoDB PutItem → opusaimobility-telemetry (time-series, TTL: 90 days)
        ├─── CloudWatch PutMetricData → TerraAI/Telemetry namespace
        └─── WebSocket Broadcast → rider dashboard (live update)

Frontend (RiderDashboardAnalytics.tsx)
        │
        │ GET /iot/telemetry (polling every 8s, fallback)
        │ OR WebSocket: wss://{iot-endpoint}/mqtt (live)
        ▼
Lambda → DynamoDB getItem(latest snapshot)
```

### 4.3 Blockchain / Carbon Credit Flow

```
Rider completes trip
        │
        │ distanceKm * 0.5 = carbonCredits earned
        ▼
Frontend: blockchainApi.seedEvent('TOKEN_MINT', {...})
        │
        │ POST /blockchain/seed
        ▼
Lambda → DynamoDB opusaimobility-blockchain (append-only ledger)

[PHASE 2] Real Celo contract:
        │
        │ Lambda → ethers.js → Celo Alfajores RPC
        ▼
TerraCarbon.sol (ERC-20)
        ├─── mintForTrip(rider, distanceKm, tripId, vehicleId)
        ├─── tradeForOMNI(amount) → burn + bridge
        └─── Events → DynamoDB index for fast queries
```

### 4.4 Authentication & RBAC Flow

```
User submits login (email + password)
        │
        │ POST /auth/signin
        ▼
Lambda → Cognito AdminInitiateAuth
        │
        ├─── Returns: { idToken, accessToken, refreshToken }
        ├─── idToken claims: { sub, email, custom:role, custom:permissions }
        └─── DynamoDB user merge → return to client

Every API request:
        │ Authorization: Bearer {idToken}
        ▼
Lambda → verify JWT → check custom:permissions for admin actions
        │ 401 → auto-refresh via POST /auth/refresh
```

### 4.5 CI/CD Pipeline Architecture

```
Developer pushes to GitHub
        │
        ├─── PR → main: CI only (type-check + build + test)
        │
        └─── Push to main:
                │
                ├── Job 1: CI (all branches)
                │   ├── npm ci + tsc --noEmit + vite build
                │   └── Upload dist/ artifact
                │
                ├── Job 2: Deploy Lambda (5 functions)
                │   ├── Snapshot current LIVE alias versions
                │   ├── Zip + update-function-code
                │   ├── Publish version + smoke test
                │   ├── IF pass: update-alias LIVE → new version
                │   └── IF fail: ROLLBACK aliases to snapshot
                │
                ├── Job 3: Deploy Frontend → S3
                │   ├── assets/ → immutable cache (1yr)
                │   ├── index.html → no-cache
                │   └── CloudFront invalidation
                │
                ├── Job 4: Build Android APK
                │   └── Upload debug + release APK to S3
                │
                └── Job 5: Post-deploy Smoke Test
                    ├── curl GET /platform/settings → 200
                    ├── curl GET /rides/pricing → 200
                    └── curl OPTIONS /auth/signin → CORS OK
```

---

## 5. FRONTEND ARCHITECTURE — COMPONENT MAP

### 5.1 React Application Structure (`opusaimobility/src/`)

```
src/
├── App.tsx                    ← Root orchestrator, routing, state FSM
├── index.tsx                  ← React DOM mount
├── types.ts                   ← 60+ TypeScript interfaces
├── constants.tsx              ← Mock data (MOCK_RIDE_OPTIONS, MOCK_ORDERS)
│
├── components/
│   ├── AuthScreen.tsx         ← Login/Register (Cognito)
│   ├── MapView.tsx            ← Leaflet map, dark tiles, route display
│   ├── RideSelector.tsx       ← Provider cards, pricing, coupons
│   ├── RideComparison.tsx     ← Side-by-side comparison
│   ├── BookingCheckout.tsx    ← Confirm ride, payment selection
│   ├── OrderTracking.tsx      ← Live order status
│   ├── DeliveryTracking.tsx   ← Parcel status overlay
│   ├── FoodDashboard.tsx      ← Restaurant browse/search
│   ├── RestaurantMenu.tsx     ← Menu items, cart
│   ├── DeliveryDashboard.tsx  ← Parcel send/request
│   ├── ErrandPortal.tsx       ← Hourly/half-day/full-day errand
│   ├── OrderHistory.tsx       ← Unified history
│   ├── UserWallet.tsx         ← Balance, top-up, transfer
│   ├── ProfileEditor.tsx      ← User settings
│   ├── NotificationOverlay.tsx← Toast system
│   ├── NotificationTray.tsx   ← History panel
│   ├── SupportCenter.tsx      ← AI chatbot (Gemini stream)
│   ├── VendorPortal.tsx       ← Restaurant management
│   ├── VendorSecurity.tsx     ← 2FA, PIN, audit
│   ├── RiderPortal.tsx        ← Job feed, accept/decline
│   ├── RiderJobTasks.tsx      ← Active job management
│   ├── RiderWalletHub.tsx     ← Earnings, payouts, DeFi
│   ├── RiderDashboardAnalytics.tsx ← IoT telemetry, leaderboard
│   ├── EnergyPortal.tsx       ← Battery swap, IoT, station map
│   ├── BusinessPortal.tsx     ← Corporate dashboard
│   ├── AdminInterface.tsx     ← Fleet, pricing, RBAC, audit
│   ├── CarbonWallet.tsx       ← Carbon credits, trading
│   ├── ChargingStationHub.tsx ← EV charging finder
│   ├── InsuranceCenter.tsx    ← Insurance DeFi
│   ├── PaymentGateways.tsx    ← M-Pesa, Stripe, Bank
│   ├── PromoCenter.tsx        ← Coupon management
│   ├── ReportingCenter.tsx    ← Financial reports
│   └── AssistantPanel.tsx     ← AI assistant (Gemini SSE)
│
└── services/
    ├── api.ts                 ← OmniAPI — DynamoDB via Lambda, offline cache
    ├── awsClient.ts           ← HTTP wrapper: JWT auth, 401 refresh, SSE
    ├── awsConfig.ts           ← LAMBDA_ROUTES, DYNAMO_TABLES, env config
    ├── geminiService.ts       ← AI: locations, distance, routing, chat
    ├── iotService.ts          ← IoT Core: telemetry poll + WebSocket
    ├── blockchainService.ts   ← Carbon ledger, token minting, trading
    ├── carbonRegistryService.ts ← VCS/Gold Standard validation
    ├── paymentService.ts      ← M-Pesa, Stripe, Bank, P2P
    ├── defiService.ts         ← Asset loans, insurance financing
    ├── rbacService.ts         ← Permission groups, JWT claims
    ├── auditService.ts        ← Action logging
    ├── vendorService.ts       ← Vendor CRUD
    ├── reportingService.ts    ← Financial reports
    ├── mapUtils.ts            ← Leaflet helpers
    └── i18n.ts                ← Multi-language (en/es/fr/zh)
```

### 5.2 State Management

App.tsx manages global state via React useState with optimistic updates:
- User Profile → polled every 4s against localStorage + Lambda sync
- Booking FSM → searching → selecting → comparing → confirming → on_ride → completed
- Notifications → append-only array with toast overlay
- Mode/Route → single `AppMode` string controls panel rendering

### 5.3 Offline-First Strategy

Write-through cache pattern:
1. Read localStorage immediately (instant UI)
2. Fire Lambda call in background (non-blocking)
3. On success: update localStorage with server data
4. On failure: localStorage = source of truth

---

## 6. FULL API ROUTE SPECIFICATION

Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod`
Auth: `Authorization: Bearer {Cognito idToken}` on protected routes.

### 6.1 Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/signup | Public | Create Cognito user + DynamoDB profile |
| POST | /auth/signin | Public | AdminInitiateAuth → JWT tokens |
| POST | /auth/signout | Bearer | Clear session |
| POST | /auth/refresh | Public | Rotate access token via refresh token |
| GET | /auth/me | Bearer | Current user profile |

### 6.2 Users

| Method | Path | Auth | Description |
|---|---|---|---|
| PUT | /users/sync | Bearer | Upsert user profile |
| GET | /users/:id | Bearer | Fetch user |
| GET | /users | Bearer+Admin | List all users |
| PATCH | /users/:id/balance | Bearer+Admin | Update wallet |

### 6.3 Rides

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /rides/request | Bearer | Create ride + deduct + notify |
| GET | /rides | Bearer | All rides (admin) |
| PATCH | /rides/:id/assign | Bearer+Rider | Assign rider |
| GET | /rides/fleet | Bearer | Fleet config |
| PUT | /rides/fleet | Bearer+Admin | Update fleet |
| GET | /rides/pricing | Public | Pricing config |
| PUT | /rides/pricing | Bearer+Admin | Update pricing |

### 6.4 Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /orders | Bearer | Place food/delivery order |
| GET | /orders | Bearer | List orders |
| PATCH | /orders/:id/status | Bearer | Update status |

### 6.5 Errands

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /errands | Bearer | Place errand |
| GET | /errands | Bearer | List errands |

### 6.6 Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /payments/mpesa | Bearer | M-Pesa STK Push |
| POST | /payments/stripe | Bearer | Stripe PaymentIntent |
| POST | /payments/bank | Bearer | Bank transfer request |
| PATCH | /payments/bank/approve | Bearer+Admin | Approve transfer |
| POST | /payments/transfer | Bearer | P2P wallet transfer |
| GET | /payments/history | Bearer | Transaction history |
| POST | /payments/swap | Bearer+Rider | Battery swap 90/10 |

### 6.7 Vendors / Stations / Inventory

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /vendors | Bearer | List vendors |
| PATCH | /vendors/:id/status | Bearer+Admin | Update status |
| GET | /stations | Bearer | List swap stations |
| POST | /stations | Bearer | Register station |
| PATCH | /stations/:id/status | Bearer | Toggle open/closed |
| GET | /inventory | Bearer | List inventory |
| PUT | /inventory/:id | Bearer+Vendor | Update item |
| DELETE | /inventory/:id | Bearer+Admin | Remove item |

### 6.8 Blockchain / Carbon / DeFi

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /blockchain/seed | Bearer | Seed event (mint/trade) |
| GET | /blockchain/ledger | Bearer | Full ledger |
| POST | /carbon/validate | Bearer | VCS registry validation |
| GET | /carbon/rate | Bearer | Market rate |
| POST | /defi/asset-loan | Bearer+Rider | Bike financing |
| POST | /defi/insurance-loan | Bearer+Rider | Insurance financing |

### 6.9 IoT / Platform / Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /iot/telemetry | Bearer+Rider | Latest snapshot |
| POST | /iot/firmware | Bearer+Admin | OTA firmware update |
| GET | /platform/settings | Bearer+Admin | Platform settings |
| PUT | /platform/settings | Bearer+Admin | Update settings |
| GET | /platform/collection | Bearer+Admin | Collection balance |
| PATCH | /platform/collection | Bearer+Admin | Update collection |
| GET | /audit/logs | Bearer+Admin | Audit entries |
| POST | /audit/log | Bearer | Log action |
| GET | /reporting/financial | Bearer+Admin | Financial report |
| POST | /notifications/push | Bearer | SNS push |

### 6.10 AI Routes (Lambda → Gemini Proxy)

| Method | Path | Auth | Function |
|---|---|---|---|
| POST | /ai/generate | Bearer | Generic text/JSON |
| POST | /ai/stream | Bearer | SSE streaming |
| POST | /ai/locations | Bearer | Location autocomplete |
| POST | /ai/distance | Bearer | Road distance + ETA |
| POST | /ai/task-logistics | Bearer | Multi-stop routing |
| POST | /ai/rider-match | Bearer | Best rider suggestion |
| POST | /ai/route-optimize | Bearer | Delivery sequencing |
| POST | /ai/business-strategy | Bearer | Corp growth tactics |

### 6.11 TerraAI Legacy Routes (backward compat for Android)

| Route Field | Function |
|---|---|
| login / loginUser | Cognito auth + DynamoDB |
| signUp / registerUser | Create + auto-login |
| requestRide / bookRide | Create ride + notify |
| placeFoodOrder | Food order + SNS |
| createParcelOrder | Parcel creation |
| getDashboardStats | Admin stats |
| health / ping | Liveness check |
| 60+ additional routes | See TerraAI/aws/lambda/api/index.js |

---

## 7. TELEMETRY INGESTION PIPELINE

### 7.1 Device → Cloud Path

```
EV Bike BMS
 ├── batteryTemp, motorTemp, controllerTemp
 ├── cycleCount, healthPercentage
 ├── efficiencyWhKm, totalEnergyConsumed
 ├── brakeWearStatus, swapCount, ecoScore
 └── lastSwapTimestamp
        │
        │ MQTT TLS publish every 30s
        │ Topic: opusaimobility/telemetry/{riderId}
        ▼
AWS IoT Core
        │
        │ IoT Rule: SELECT *, topic(3) as riderId FROM 'opusaimobility/telemetry/+'
        ▼
telemetry-ingest Lambda
        │
        ├── DynamoDB PutItem: opusaimobility-telemetry (PK: riderId, SK: timestamp, TTL: 90d)
        ├── CloudWatch PutMetricData: TerraAI/Telemetry namespace
        └── WebSocket broadcast to connected rider dashboard
```

### 7.2 Device Provisioning

Each EV requires X.509 certificate for mutual TLS with IoT Core:
- `aws iot create-keys-and-certificate`
- Policy: publish only to `opusaimobility/telemetry/{thingName}`
- Provisioned during rider onboarding (admin action)

### 7.3 Data Retention

| Dataset | Retention | Storage |
|---|---|---|
| Raw telemetry (30s) | 90 days | DynamoDB TTL |
| Aggregated daily | 2 years | DynamoDB |
| CloudWatch metrics | 15 months | CloudWatch |
| Firmware OTA history | Indefinite | IoT Core |

---

## 8. BLOCKCHAIN & CARBON CREDIT CONTRACTS

### 8.1 Current (Phase 1 — Lambda Simulation)

DynamoDB append-only ledger:
- Block height incremented per event
- SHA-like hex hash generated
- Gas simulation included
- Table: `opusaimobility-blockchain`

### 8.2 Token Economics

| Parameter | Value |
|---|---|
| Credit earning rate | 0.5 credits per km |
| Carbon → OMNI rate | $0.52 per credit (VCS market) |
| Minimum trade | 5 credits |
| Max daily mint | 100 credits per rider |
| OMNI utility | Platform discount, premium features |

### 8.3 Phase 2 — Real Celo Contract

```solidity
// TerraCarbon.sol — ERC-20 on Celo Alfajores
contract TerraCarbon is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    struct TripRecord {
        address rider;
        uint256 distanceKm;
        uint256 creditsEarned;
        uint256 timestamp;
        string vehicleId;
    }
    
    mapping(bytes32 => TripRecord) public trips;
    
    function mintForTrip(address rider, uint256 distanceKm, bytes32 tripId, string calldata vehicleId) external onlyRole(MINTER_ROLE) {
        uint256 credits = (distanceKm * 1e18) / 2;
        _mint(rider, credits);
        trips[tripId] = TripRecord(rider, distanceKm, credits, block.timestamp, vehicleId);
    }
    
    function tradeForOMNI(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount);
        _burn(msg.sender, amount);
        // Bridge to OMNI token
    }
}
```

### 8.4 Lambda ↔ Celo Integration

Lambda uses `ethers.js` → Celo Alfajores RPC → mint on trip completion → index event in DynamoDB for fast queries.

---

## 9. AUTHENTICATION, RBAC & KYC FLOW

### 9.1 Cognito Pool Consolidation

**Current:** 2 separate pools (OpusAIMobility + TerraAI)
**Target:** 1 unified pool: `opusaimobility-users`

Custom Attributes:
- `custom:role` → user | rider | vendor | admin | business
- `custom:permissions` → JSON array of Permission strings
- `custom:status` → active | pending | suspended

### 9.2 RBAC Permission Matrix

| Role | fleet_read | fleet_write | vendor_read | vendor_write | finance_read | payout_write | audit_read | rbac_write | wallet_approval |
|---|---|---|---|---|---|---|---|---|---|
| Super Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fleet Manager | ✓ | ✓ | — | — | ✓ | — | ✓ | — | — |
| Vendor Liaison | ✓ | — | ✓ | ✓ | — | — | ✓ | — | — |
| Support Lead | ✓ | — | ✓ | — | — | — | ✓ | — | — |
| Finance Admin | — | — | — | — | ✓ | ✓ | ✓ | — | ✓ |

### 9.3 User Migration (TerraAI → Unified Pool)

- Cognito user migration Lambda trigger validates against TerraAI password hashes on first login
- No re-verification required for migrated users
- Duplicate emails (exist in both pools) → merge: keep OpusAIMobility password, append TerraAI role

---

## 10. INFRASTRUCTURE PROVISIONING (IaC)

### 10.1 DynamoDB Tables

| Table | PK | SK | GSIs | Notes |
|---|---|---|---|---|
| opusaimobility-users | id | — | email-index | All user profiles |
| opusaimobility-trips | id | — | customerId-index, riderId-index | Ride records |
| opusaimobility-orders | id | — | customerId-index | Food + delivery |
| opusaimobility-errands | id | — | customerId-index | Errand orders |
| opusaimobility-transactions | id | — | userId-index | Payment history |
| opusaimobility-swap-stations | id | — | brand-index, ownerId-index | Battery stations |
| opusaimobility-inventory | id | — | vendorId-index | Errand items |
| opusaimobility-blockchain | id | — | blockHeight-index | Carbon ledger |
| opusaimobility-audit-logs | id | — | userId-index, timestamp-index | Audit trail |
| opusaimobility-platform | configKey | — | — | Settings/pricing/fleet |
| opusaimobility-telemetry | riderId | timestamp | — | Time-series, TTL 90d |
| opusaimobility-connections | connectionId | — | userId-index | WebSocket sessions |

### 10.2 VPC Architecture (NEW)

```
VPC: 10.0.0.0/16
├── Public Subnet A (10.0.1.0/24) — NAT Gateway
├── Public Subnet B (10.0.2.0/24) — NAT Gateway (HA)
├── Private Subnet A (10.0.10.0/24) — Lambda, ECS
├── Private Subnet B (10.0.20.0/24) — Lambda, ECS
├── Private Subnet C (10.0.30.0/24) — RDS Primary
└── Private Subnet D (10.0.40.0/24) — RDS Standby
```

### 10.3 Security Groups

| SG | Inbound | Outbound | Attached To |
|---|---|---|---|
| sg-lambda | — | 443 (internet), 3306 (sg-rds) | Lambda functions |
| sg-rds | 3306 from sg-lambda | — | RDS Aurora |
| sg-apigw | 443 (0.0.0.0/0) | — | API Gateway VPC Link |

---

## 11. MONITORING & OBSERVABILITY STACK

### 11.1 CloudWatch Alarms

| Alarm | Condition | Action |
|---|---|---|
| Lambda Errors > 5% | ErrorRate > 0.05 / 5min | SNS → PagerDuty |
| Lambda Duration P99 > 5s | Duration > 5000ms | SNS notification |
| DynamoDB Throttles | ConsumedWrite > 80% | Auto-scale |
| IoT Messages < 1/min | Bike offline detection | Push → rider |
| API Gateway 5xx > 1% | 5xxError rate | SNS → on-call |
| Battery Temp > 50°C | Critical threshold | Push → rider |
| EcoScore < 60 | Performance drop | AI coaching trigger |

### 11.2 Dashboard Layout

**Dashboard 1: Platform Health** — Lambda invocations, error rate, API latency P50/P95/P99, DynamoDB capacity
**Dashboard 2: Business Metrics** — Active rides, food orders, revenue, carbon credits, battery swaps
**Dashboard 3: Fleet Telemetry** — Avg EcoScore, battery health distribution, online/offline riders

### 11.3 X-Ray Distributed Tracing

All Lambda functions instrumented with `aws-xray-sdk-core` — trace propagation across API Gateway → Lambda → DynamoDB → external APIs.

---

## 12. CI/CD STRATEGY & PIPELINE DESIGN

### 12.1 Unified Pipeline (GitHub Actions)

**Branches:**
- `main` → production deploy (version + alias + rollback)
- `staging` → staging deploy
- `feature/*` → CI only
- PR → main → CI gate (must pass)

**Key Differences Merged:**
- OpusAIMobility's Node 24 + Vite build
- TerraAI's alias-based rollback on smoke failure (adopted for all)
- Path-based triggers for Android builds

### 12.2 Versioning Strategy

- Lambda: publish-version + LIVE alias + instant rollback
- Frontend: content-hashed filenames, no-cache index.html, CloudFront invalidation
- Android: semantic versioning, GITHUB_RUN_NUMBER versionCode

### 12.3 Environment Matrix

| Env | Branch | API | Tables | Purpose |
|---|---|---|---|---|
| production | main | prod APIGW | opusaimobility-* | Live traffic |
| staging | staging | staging APIGW | opusaimobility-*-staging | QA |
| development | feature/* | local/dev | opusaimobility-*-dev | Dev |

---

## 13. DATA FLOW DIAGRAMS

### 13.1 Complete Ride Booking

```
Customer types destination → POST /ai/locations → suggestions
Customer selects → POST /ai/distance → { distanceKm, durationMinutes }
Customer sees pricing → baseFare + (distanceKm * 0.37)
Customer confirms → POST /rides/request
Lambda: DynamoDB put trip + deduct wallet + record transaction + SNS publish
SNS → Push Lambda → FCM → Rider device "New ride available"
Rider accepts → PATCH /rides/:id/assign
Lambda: update trip status + notify customer + WebSocket update
Trip completes → settlement: 90% rider / 10% platform
```

### 13.2 Battery Swap Payment

```
Rider selects station on map → handshake (2s simulated)
POST /payments/swap { riderId, stationId, amount, isDedicated }
Lambda: platformFee = 10%, ownerRevenue = 90%
IF dedicated: skip wallet deduction (employer pays)
ELSE: deduct rider wallet
Credit station owner + record transaction
Push: "Energy handshake verified"
```

### 13.3 Carbon Credit Lifecycle

```
Trip completes → credits = distanceKm / 2
POST /blockchain/seed { type: TOKEN_MINT, payload }
Lambda: append to opusaimobility-blockchain (immutable)
CarbonWallet UI: shows balance + ledger
Trade action → POST /blockchain/seed { type: TRADE_EXECUTED }
Credits burned → OMNI tokens minted @ $0.52/credit
```

---

## 14. SPRINT TASK TICKETS — EPICS & STORIES

### EPIC 1: PLATFORM CONSOLIDATION (Sprint 1-2)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-001 | Merge Cognito pools into single `opusaimobility-users` pool | P0 | 5d | Backend |
| TAM-002 | Build Cognito user migration Lambda trigger (TerraAI password hash validation) | P0 | 3d | Backend |
| TAM-003 | Unify API Gateway: single gateway, `/terra/` prefix for legacy routes | P0 | 3d | Backend |
| TAM-004 | Migrate TerraAI DynamoDB tables (opusaimobility-*) to opusaimobility-* schema | P1 | 5d | Backend |
| TAM-005 | Reconcile wallet balance types (string→number) in TerraAI data | P1 | 2d | Backend |
| TAM-006 | Remove API-key fallback from TerraAI Lambda, enforce JWT only | P1 | 2d | Backend |
| TAM-007 | Create monorepo workspace structure (`/apps/customer/`, `/apps/web/`, `/packages/`) | P1 | 3d | DevOps |
| TAM-008 | Integrate Android source code into monorepo `/apps/customer/` | P1 | 3d | Mobile |

### EPIC 2: FRONTEND ENHANCEMENTS (Sprint 2-3)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-010 | Replace Gemini location search with Google Maps Places API for accuracy | P1 | 3d | Frontend |
| TAM-011 | Implement real WebSocket driver tracking (replace polling) | P1 | 5d | Full-stack |
| TAM-012 | Add email verification flow post-signup (Cognito confirm) | P1 | 2d | Frontend |
| TAM-013 | Build vendor onboarding wizard (replaces PHP admin panel) | P2 | 5d | Frontend |
| TAM-014 | Implement real-time order status via WebSocket (food + delivery) | P2 | 3d | Frontend |
| TAM-015 | Add PWA install prompt + service worker for true offline | P2 | 3d | Frontend |
| TAM-016 | Implement multi-language Swahili (sw) + Kinyarwanda (rw) | P3 | 2d | Frontend |

### EPIC 3: PAYMENT GATEWAY INTEGRATION (Sprint 2-3)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-020 | Integrate real Safaricom Daraja API (M-Pesa STK Push) in Lambda | P0 | 5d | Backend |
| TAM-021 | Integrate Stripe PaymentIntents SDK in Lambda | P1 | 3d | Backend |
| TAM-022 | Implement M-Pesa callback webhook (payment confirmation) | P0 | 3d | Backend |
| TAM-023 | Add Airtel Money integration (East Africa) | P2 | 3d | Backend |
| TAM-024 | Implement DeFi auto-deduction via EventBridge scheduled rule | P2 | 3d | Backend |
| TAM-025 | Add payment reconciliation reporting (admin) | P2 | 3d | Backend |

### EPIC 4: TELEMETRY & IoT (Sprint 3-4)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-030 | Build telemetry-ingest Lambda (IoT Rule → DynamoDB + CloudWatch) | P1 | 5d | Backend |
| TAM-031 | Provision IoT Core thing registry + X.509 cert pipeline | P1 | 3d | DevOps |
| TAM-032 | Wire IoT WebSocket signed URL generation in Lambda | P1 | 3d | Backend |
| TAM-033 | Connect frontend WebSocket to real IoT endpoint (replace placeholder) | P1 | 2d | Frontend |
| TAM-034 | Build telemetry aggregation Lambda (daily rollups) | P2 | 3d | Backend |
| TAM-035 | Create CloudWatch dashboard: Fleet Telemetry | P2 | 2d | DevOps |
| TAM-036 | Implement OTA firmware job via IoT Core Jobs API | P3 | 5d | Backend |

### EPIC 5: BLOCKCHAIN & CARBON CREDITS (Sprint 4-5)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-040 | Deploy TerraCarbon.sol to Celo Alfajores testnet | P2 | 5d | Blockchain |
| TAM-041 | Build Lambda ↔ Celo RPC integration (ethers.js) | P2 | 5d | Backend |
| TAM-042 | Implement VCS/Gold Standard API validation proxy | P3 | 3d | Backend |
| TAM-043 | Build OMNI token bridge contract (carbon → OMNI swap) | P3 | 5d | Blockchain |
| TAM-044 | Add carbon credit marketplace UI (buy/sell between users) | P3 | 5d | Frontend |
| TAM-045 | Integrate Celo wallet connect for rider wallet addresses | P3 | 3d | Frontend |

### EPIC 6: INFRASTRUCTURE & SECURITY (Sprint 1-2)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-050 | Provision VPC with public/private subnets + NAT Gateway | P0 | 3d | DevOps |
| TAM-051 | Deploy AWS WAF on API Gateway (rate limiting, SQL injection rules) | P0 | 2d | DevOps |
| TAM-052 | Enable GuardDuty for VPC + S3 + IAM threat detection | P1 | 1d | DevOps |
| TAM-053 | Create CloudFormation/CDK stack for all infrastructure | P1 | 8d | DevOps |
| TAM-054 | Enable VPC Flow Logs → CloudWatch (30-day retention) | P1 | 1d | DevOps |
| TAM-055 | Migrate secrets to Secrets Manager with 90-day rotation | P1 | 3d | DevOps |
| TAM-056 | Provision RDS Aurora Serverless for TerraAI MySQL migration | P1 | 3d | DevOps |
| TAM-057 | Run TerraAI database migration script (mysqldump → RDS) | P1 | 2d | Backend |

### EPIC 7: CI/CD UNIFICATION (Sprint 2)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-060 | Merge deploy workflows into single multi-job pipeline | P1 | 3d | DevOps |
| TAM-061 | Add alias-based rollback to OpusAIMobility Lambda deploy | P0 | 2d | DevOps |
| TAM-062 | Add Android APK build job (path-filtered trigger) | P1 | 2d | DevOps |
| TAM-063 | Add APK upload to S3 with CloudFront `latest.apk` stable URL | P2 | 2d | DevOps |
| TAM-064 | Add security audit job (npm audit, OWASP dependency check) | P1 | 2d | DevOps |
| TAM-065 | Add bundle size regression check (fail if +10% from main) | P2 | 1d | DevOps |

### EPIC 8: MONITORING & OBSERVABILITY (Sprint 3)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-070 | Instrument all Lambda functions with X-Ray SDK | P1 | 2d | Backend |
| TAM-071 | Create CloudWatch alarms (error rate, duration, 5xx) | P1 | 2d | DevOps |
| TAM-072 | Build Platform Health dashboard | P1 | 2d | DevOps |
| TAM-073 | Build Business Metrics dashboard | P2 | 2d | DevOps |
| TAM-074 | Add structured JSON logging to all Lambda functions | P1 | 2d | Backend |
| TAM-075 | Set up SNS → PagerDuty/Slack notification channel | P2 | 1d | DevOps |

### EPIC 9: PUSH NOTIFICATIONS (Sprint 2)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-080 | Create SNS Platform Application for FCM (Android) | P0 | 2d | Backend |
| TAM-081 | Create SNS Platform Application for APNs (iOS future) | P2 | 2d | Backend |
| TAM-082 | Wire Android FCM device token registration to Push Lambda | P0 | 2d | Mobile |
| TAM-083 | Implement PWA Web Push via service worker | P2 | 3d | Frontend |
| TAM-084 | Unify notification topics: single push pipeline for both codebases | P1 | 3d | Backend |

### EPIC 10: ANDROID APP MODERNIZATION (Sprint 4-5)

| ID | Story | Priority | Estimate | Owner |
|---|---|---|---|---|
| TAM-090 | Update Android app to use unified Cognito pool | P0 | 3d | Mobile |
| TAM-091 | Add IoT telemetry display to Android rider app | P2 | 5d | Mobile |
| TAM-092 | Add carbon credit wallet to Android app | P3 | 5d | Mobile |
| TAM-093 | Add DeFi loan view to Android rider app | P3 | 3d | Mobile |
| TAM-094 | Build release signing + Play Store deployment pipeline | P2 | 3d | Mobile/DevOps |

---

## 15. RISK REGISTER

| ID | Risk | Impact | Probability | Mitigation |
|---|---|---|---|---|
| R-001 | Cognito pool merge causes user lockout | HIGH | Medium | Run user migration in dry-run mode first; keep old pool active for 30 days as fallback |
| R-002 | M-Pesa Daraja API rate limits under load | HIGH | Medium | Implement request queuing with SQS; cache STK Push status; implement circuit breaker |
| R-003 | IoT Core message quota exceeded (5000 bikes) | MEDIUM | Low | Request quota increase proactively; implement message batching at device level |
| R-004 | Celo testnet instability blocks carbon credit minting | MEDIUM | Medium | Keep DynamoDB simulation as fallback; dual-write (DynamoDB + Celo) during transition |
| R-005 | Lambda cold start latency (VPC-attached) degrades UX | HIGH | High | Use provisioned concurrency for critical paths (auth, rides); minimize VPC-attached functions |
| R-006 | Single region failure (us-east-1) takes down platform | HIGH | Low | Implement S3 cross-region replication; design for future multi-region Active-Passive |
| R-007 | DynamoDB scan operations in TerraAI Lambda hit performance ceiling | MEDIUM | High | Replace all scans with GSI queries (already partially done with email-index) |
| R-008 | Wallet balance race condition during concurrent deductions | HIGH | Medium | Use DynamoDB conditional expressions (ConditionExpression: balance >= amount) |
| R-009 | Android APK signing key compromise | HIGH | Low | Store keystore in Secrets Manager; rotate annually; implement Play App Signing |
| R-010 | Gemini API key exposed in Lambda logs | HIGH | Low | Audit all console.log statements; use structured logging that excludes secrets |

---

## 16. TEAM STRUCTURE & OWNERSHIP MAP

### 16.1 Recommended Team (8-12 engineers)

| Role | Count | Ownership |
|---|---|---|
| **Tech Lead / Architect** | 1 | Architecture decisions, code review, sprint planning |
| **Senior Backend Engineer** | 2 | Lambda functions, DynamoDB, Cognito, payment integrations |
| **Senior Frontend Engineer** | 2 | React PWA, state management, offline-first, UX |
| **Mobile Engineer (Android)** | 1 | Android Java app, FCM, Play Store deployment |
| **DevOps / Platform Engineer** | 2 | AWS IaC, CI/CD, monitoring, VPC, security |
| **Blockchain Engineer** | 1 | Solidity contracts, Celo integration, ethers.js |
| **QA Engineer** | 1 | E2E testing, load testing, Android QA |

### 16.2 Ownership Matrix

| Domain | Primary Owner | Secondary |
|---|---|---|
| Auth / Cognito / RBAC | Backend #1 | DevOps |
| Ride/Order/Errand APIs | Backend #1 | Backend #2 |
| Payment Gateways | Backend #2 | Backend #1 |
| IoT / Telemetry | Backend #2 | DevOps |
| Frontend PWA | Frontend #1 | Frontend #2 |
| Admin Interface | Frontend #2 | Frontend #1 |
| Android App | Mobile | Frontend #1 |
| Blockchain / Carbon | Blockchain | Backend #2 |
| CI/CD Pipeline | DevOps #1 | DevOps #2 |
| AWS Infrastructure | DevOps #2 | DevOps #1 |
| Monitoring / Alerts | DevOps #1 | Backend #1 |

### 16.3 Sprint Cadence

- **Sprint duration:** 2 weeks
- **Estimated total delivery:** 10-12 sprints (20-24 weeks)
- **Phase 1 (Sprint 1-3):** Consolidation + Infrastructure + Payments
- **Phase 2 (Sprint 4-6):** IoT + Blockchain + Push + Android modernization
- **Phase 3 (Sprint 7-9):** Real payment gateways + Celo mainnet + monitoring hardening
- **Phase 4 (Sprint 10-12):** Performance optimization + multi-region prep + launch readiness

### 16.4 Critical Path

```
TAM-050 (VPC) → TAM-056 (RDS) → TAM-057 (DB Migration)
       ↓
TAM-001 (Cognito Merge) → TAM-002 (Migration Trigger) → TAM-006 (Remove API-key)
       ↓
TAM-003 (API Gateway Unify) → TAM-060 (CI/CD Merge) → TAM-061 (Rollback)
       ↓
TAM-020 (M-Pesa Real) → TAM-022 (Callback Webhook)
       ↓
TAM-030 (Telemetry Lambda) → TAM-031 (IoT Certs) → TAM-033 (Frontend Wire)
       ↓
TAM-040 (Celo Deploy) → TAM-041 (Lambda↔Celo)
```

---

## APPENDIX A: MONOREPO TARGET STRUCTURE

```
terra-ai-mobility/
├── .github/
│   └── workflows/
│       ├── ci.yml              (unified CI: type-check + build + lint)
│       ├── deploy-lambda.yml   (deploy all Lambda functions + rollback)
│       ├── deploy-frontend.yml (S3 sync + CloudFront invalidation)
│       ├── deploy-android.yml  (APK build + S3 upload)
│       └── security-audit.yml  (npm audit + OWASP check)
│
├── apps/
│   ├── web/                    (OpusAIMobility React PWA — current opusaimobility/src)
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── customer/               (TerraAI Android app)
│       ├── app/
│       ├── build.gradle
│       └── google-services.json
│
├── packages/
│   ├── shared-types/           (TypeScript interfaces shared across apps)
│   ├── shared-utils/           (Common utilities: date formatting, validation)
│   └── api-client/             (Typed API client for Lambda endpoints)
│
├── infra/
│   ├── cloudformation/         (CloudFormation / CDK templates)
│   ├── lambda/
│   │   ├── api/                (Unified Lambda handler)
│   │   ├── push/               (Push notification Lambda v2)
│   │   ├── ws/                 (WebSocket Lambda)
│   │   └── telemetry/          (IoT telemetry ingest — NEW)
│   └── terraform/              (Optional: Terraform for VPC/RDS)
│
├── contracts/
│   ├── TerraCarbon.sol         (ERC-20 carbon credit token)
│   ├── OMNIToken.sol           (Platform utility token)
│   ├── hardhat.config.js
│   └── scripts/deploy.js
│
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   └── runbook.md
│
├── package.json                (workspace root)
└── turbo.json                  (Turborepo config for build orchestration)
```

---

## APPENDIX B: ENVIRONMENT VARIABLES REFERENCE

```bash
# ── AWS Core ──────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=<iam-key>
AWS_SECRET_ACCESS_KEY=<iam-secret>
AWS_REGION=us-east-1

# ── Frontend (Vite build-time injection) ──────────────────────
VITE_API_BASE_URL=https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_3lWqQNDwm
VITE_COGNITO_CLIENT_ID=6o0bfotnaeaqq40idq6ukhrb8e
VITE_S3_BUCKET=opusaimobility-assets-prod
VITE_S3_BASE_URL=https://opusaimobility-assets-prod.s3.us-east-1.amazonaws.com
VITE_IOT_ENDPOINT=wss://arqymixni12gc-ats.iot.us-east-1.amazonaws.com/mqtt
VITE_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications

# ── Lambda Runtime ────────────────────────────────────────────
CLIENT_ID=6o0bfotnaeaqq40idq6ukhrb8e
USER_POOL_ID=us-east-1_3lWqQNDwm
GEMINI_SECRET_NAME=opusaimobility/gemini-api-key
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications

# ── TerraAI Legacy Lambda ─────────────────────────────────────
API_KEY=terraai-mobility-key-2024
COGNITO_USER_POOL_ID=us-east-1_HA6twtr4a
COGNITO_CLIENT_ID=5nd3067cl29ka0b3a2k8me2ijh
WS_ENDPOINT=https://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod

# ── Celo Blockchain (Phase 2) ─────────────────────────────────
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
MINTER_PRIVATE_KEY=<secrets-manager-ref>
CARBON_CONTRACT_ADDRESS=<deployed-address>
OMNI_CONTRACT_ADDRESS=<deployed-address>

# ── Payment Gateways (Phase 2) ────────────────────────────────
MPESA_CONSUMER_KEY=<daraja-key>
MPESA_CONSUMER_SECRET=<daraja-secret>
MPESA_PASSKEY=<daraja-passkey>
MPESA_SHORTCODE=<business-shortcode>
STRIPE_SECRET_KEY=<stripe-sk>
STRIPE_WEBHOOK_SECRET=<stripe-whsec>
```

---

*End of Document — Terra-AI-Mobility CTO Blueprint v2.0.0*
