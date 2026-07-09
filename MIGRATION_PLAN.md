# OpusAIMobility Migration Plan
## TerraAI Android App → OmniRide + PHP Backend Elimination + AWS DynamoDB Consolidation

> **Version:** 1.0.0 | **Date:** 2026-07-07  
> **Scope:** Migrate TerraAI Android app into `omniride/apps/customer/`, eliminate PHP backend, consolidate on AWS serverless (Lambda + DynamoDB)  
> **Previous Work Reference:** `claude_task.md` (CTO Blueprint v2.0.0)

---

## 1. EXECUTIVE SUMMARY

This plan merges the TerraAI Android native app (`TerraAI/Android source code/AIMobilityCustomer/`) into the OmniRide monorepo (`omniride/apps/customer/`), eliminates the PHP backend (`omniride/apps/terra-api/`), and consolidates all data persistence on AWS DynamoDB via Lambda API Gateway.

### What Currently Exists

| Component | Location | Status |
|-----------|----------|--------|
| TerraAI Android App (Java) | `TerraAI/Android source code/AIMobilityCustomer/` | Working, versionCode 7 |
| OmniRide Android placeholder | `omniride/apps/customer/` | Empty build.gradle only |
| PHP Backend (terra-api) | `omniride/apps/terra-api/` | Active - handles uploads, notifications, auth middleware, health check |
| Lambda API (Node.js) | `omniride/aws/lambda/` + `TerraAI/aws/lambda/` + `aws/lambda/` | 70+ routes, DynamoDB, Cognito |
| DynamoDB Tables | AWS us-east-1 | 18+ tables (opusaimobility-*) |
| MySQL/RDS | AWS us-east-1 | Legacy - used only by PHP backend |

### Target State

| Component | Location | Technology |
|-----------|----------|------------|
| Android Customer App (Kotlin) | `omniride/apps/customer/` | Kotlin + Jetpack Compose + AWS Amplify |
| Unified API | AWS Lambda + API Gateway | Node.js 18, DynamoDB, Cognito JWT |
| Database | AWS DynamoDB | 18 tables, serverless, auto-scaling |
| Auth | AWS Cognito | JWT tokens, custom RBAC claims |
| Real-time | API Gateway WebSocket | Driver tracking, order updates |
| Push | AWS SNS + FCM | Cross-platform notifications |
| Files | AWS S3 | Pre-signed URL upload/download |
| PHP Backend | DELETED | All functionality absorbed by Lambda |

---

## 2. ARCHITECTURE DECISION: WHY DYNAMODB (NOT RDS)

Based on what the previous agents built, **DynamoDB is already the primary database**. The PHP backend's MySQL dependency is a legacy artifact that only handles 4 operations (file upload, file retrieval, device tokens, notifications). All core business logic already runs on DynamoDB via Lambda.

### Recommendation: Keep DynamoDB + Eliminate RDS

| Factor | DynamoDB (Current) | RDS Aurora (Alternative) |
|--------|-------------------|--------------------------|
| Cost at scale | Pay-per-request, $0 idle | $60+/month minimum (always-on) |
| Scaling | Automatic, infinite | Manual scaling, connection limits |
| Maintenance | Zero (serverless) | Patching, backups, failover config |
| Fit with Lambda | Native integration | Cold-start connection pooling issues |
| Already implemented | 18+ tables with GSIs | Would require full schema migration |
| Real-time streams | DynamoDB Streams built-in | Requires triggers/CDC setup |

**Decision: Consolidate on DynamoDB. Eliminate MySQL/RDS entirely.**

---

## 3. PHP BACKEND ELIMINATION PLAN

The PHP backend (`omniride/apps/terra-api/`) handles only 4 functions. Each must be migrated to Lambda:

### 3.1 Current PHP Handlers → Lambda Replacements

| PHP Handler | What It Does | Lambda Replacement |
|-------------|-------------|-------------------|
| `handlers/upload.php` | S3 file upload (50MB limit, 3x retry) | `POST /files/upload` → Lambda generates pre-signed S3 URL; client uploads directly to S3 |
| `handlers/file-retrieval.php` | S3 pre-signed download URL (1hr expiry) | `GET /files/:key` → Lambda returns pre-signed URL |
| `handlers/device-tokens.php` | SNS platform endpoint management (max 10 per user, rotation, stale cleanup) | `POST /notifications/register` → Lambda manages DynamoDB `opusaimobility-push-endpoints` table |
| `handlers/notifications.php` | SNS publish with retry + DLQ | Already exists as `POST /notifications/push` in Lambda routes |
| `middleware/auth.php` | Cognito JWT verification + RBAC | Already handled by API Gateway Cognito Authorizer + Lambda RBAC |

### 3.2 Migration Steps

**Phase 1: Add missing Lambda endpoints (1-2 days)**

```
POST /files/presign-upload     → Generate S3 pre-signed PUT URL
GET  /files/presign-download   → Generate S3 pre-signed GET URL  
POST /devices/token            → Register/rotate device token in DynamoDB
DELETE /devices/token           → Remove stale device token
```

**Phase 2: Update Android app to call Lambda directly (1 day)**

Replace any `terra-api` HTTP calls with API Gateway endpoints.

**Phase 3: Delete PHP backend (1 hour)**

Remove `omniride/apps/terra-api/` directory entirely. Remove MySQL/RDS dependency from infrastructure.

---

## 4. ANDROID APP MIGRATION PLAN

### 4.1 Source Migration (TerraAI → OmniRide)

**From:** `TerraAI/Android source code/AIMobilityCustomer/`  
**To:** `omniride/apps/customer/`

### 4.2 Key Changes

| Aspect | TerraAI (Current) | OmniRide (Target) |
|--------|-------------------|-------------------|
| Language | Java | Kotlin (gradual migration) |
| Package name | `com.terraai.aimobility` | `com.opusaimobility.customer` |
| App name | AIMobility | OpusAI Mobility |
| UI framework | XML Views + ViewBinding | Kotlin + ViewBinding → Jetpack Compose (Phase 2) |
| Networking | Retrofit → PHP/Lambda | Retrofit → API Gateway Lambda (direct) |
| Auth | AWS Amplify (Cognito) | AWS Amplify (Cognito) - same pool |
| Maps | Google Maps SDK | Google Maps SDK (keep) |
| Push | AWS SNS (broken ARN) | AWS SNS + FCM (fixed) |
| WebSocket | OkHttp WebSocket | OkHttp WebSocket (keep, update URL) |
| Database | Room (local cache) | Room (local cache, keep) |
| Min SDK | 24 | 24 (keep) |
| Target SDK | 34 | 35 (upgrade) |
| Gradle | 8.1.4 | 8.4+ with KTS (Kotlin DSL) |

### 4.3 Feature Additions (from OmniRide PWA → Android)

The TerraAI Android app is MISSING these features that exist in the OmniRide web app:

| Feature | Priority | Effort |
|---------|----------|--------|
| Errand Portal (hourly/half-day/full-day rider hire) | HIGH | 3 days |
| Carbon Wallet & Blockchain Ledger | MEDIUM | 2 days |
| DeFi Loan Calculator (asset + insurance) | MEDIUM | 2 days |
| Battery Swap Station Finder | HIGH | 2 days |
| Business/Corporate Portal | LOW | 5 days |
| Vendor Portal (restaurant management) | LOW | 5 days |
| Multi-language (EN/ES/FR/ZH) | MEDIUM | 2 days |
| IoT Telemetry Dashboard (already partially exists) | LOW | 1 day |

---

## 5. DETAILED MIGRATION STEPS

### EPIC 1: Android Source Migration (Week 1)

#### TAM-100: Copy Android source into omniride monorepo
**Priority:** P0 | **Effort:** 4 hours

1. Copy `TerraAI/Android source code/AIMobilityCustomer/` → `omniride/apps/customer/`
2. Preserve git history (git subtree or manual copy + initial commit)
3. Update `.gitignore` for Android artifacts
4. Verify project structure:
   ```
   omniride/apps/customer/
   ├── app/
   │   ├── src/main/java/com/opusaimobility/customer/
   │   ├── src/main/res/
   │   ├── src/main/AndroidManifest.xml
   │   └── build.gradle.kts
   ├── pdf/
   ├── gradle/
   ├── build.gradle.kts (project-level)
   ├── settings.gradle.kts
   └── gradle.properties
   ```

#### TAM-101: Rename package from terraai to opusaimobility
**Priority:** P0 | **Effort:** 2 hours

1. Refactor package: `com.terraai.aimobility` → `com.opusaimobility.customer`
2. Update `AndroidManifest.xml` package attribute
3. Update `build.gradle` applicationId
4. Update all Java imports
5. Update Cognito `amplifyconfiguration.json` (if present)
6. Update all resource references

#### TAM-102: Upgrade build system to Kotlin DSL
**Priority:** P1 | **Effort:** 3 hours

1. Convert `build.gradle` → `build.gradle.kts`
2. Upgrade Gradle wrapper to 8.4+
3. Upgrade AGP to 8.3+
4. Set Java compatibility to 17 (from 1.8)
5. Add Kotlin plugin (`kotlin-android`)
6. Enable Compose compiler (for Phase 2)

#### TAM-103: Update API configuration to point to unified Lambda
**Priority:** P0 | **Effort:** 4 hours

1. Create `app/src/main/res/values/config.xml`:
   ```xml
   <string name="api_base_url">https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod</string>
   <string name="ws_url">wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod</string>
   <string name="cognito_pool_id">us-east-1_LKa4ElQem</string>
   <string name="cognito_client_id">3a207uin5o3p4k1ngk334crntl</string>
   ```
2. Update Retrofit `ApiClient` base URL
3. Update `WebSocketManager` endpoint
4. Update Cognito configuration
5. Remove any references to PHP backend URLs
6. Add build flavors for dev/staging/prod environments

#### TAM-104: Fix push notifications (SNS + FCM)
**Priority:** P0 | **Effort:** 6 hours

1. Register Firebase project for `com.opusaimobility.customer`
2. Add `google-services.json` to `app/`
3. Create SNS Platform Application in AWS Console (GCM/FCM)
4. Update device token registration to call `POST /devices/token` Lambda
5. Implement token rotation logic (match PHP's max-10, stale-cleanup behavior)
6. Test end-to-end: ride assigned → SNS → FCM → Android notification

#### TAM-105: Update auth flow for unified Cognito pool
**Priority:** P0 | **Effort:** 4 hours

1. Point Amplify config to unified pool: `us-east-1_LKa4ElQem`
2. Update client ID: `3a207uin5o3p4k1ngk334crntl`
3. Update custom attributes: `custom:role`, `custom:wallet`, `custom:country_id`
4. Test sign-up / sign-in / token refresh / social login
5. Ensure JWT claims include role for RBAC

---

### EPIC 2: Eliminate PHP Backend (Week 1-2)

#### TAM-110: Create S3 pre-signed URL Lambda endpoints
**Priority:** P0 | **Effort:** 4 hours

Add to existing Lambda API handler:

```javascript
// POST /files/presign-upload
// Returns: { uploadUrl, key, expiresIn }
// Client PUTs file directly to S3 using the pre-signed URL

// GET /files/presign-download?key=uploads/userId/timestamp_filename
// Returns: { downloadUrl, expiresIn }
```

Benefits over PHP approach:
- No 50MB proxy through Lambda (client uploads directly to S3)
- Faster uploads (direct to S3, no intermediary)
- Lower Lambda cost (no large payload processing)

#### TAM-111: Migrate device token management to DynamoDB
**Priority:** P0 | **Effort:** 3 hours

Create/update DynamoDB table `opusaimobility-push-endpoints`:
```
PK: userId (String)
SK: deviceToken (String)
Attributes: platform, endpointArn, createdAt, lastUsed, deviceId
GSI: endpointArn-index (for SNS callback lookups)
```

Lambda endpoints:
```
POST /devices/token    → Register new token (max 10 per user, auto-rotate)
DELETE /devices/token   → Remove specific token
POST /devices/cleanup   → Admin: purge stale endpoints (called by EventBridge daily)
```

#### TAM-112: Verify notification Lambda covers all PHP functionality
**Priority:** P1 | **Effort:** 2 hours

Ensure existing `POST /notifications/push` Lambda includes:
- 3x retry with exponential backoff (1s, 2s, 4s)
- DLQ routing for failed notifications
- Structured error logging
- Payload validation (title, body, type required)

#### TAM-113: Remove PHP backend and MySQL dependency
**Priority:** P1 | **Effort:** 1 hour

1. Delete `omniride/apps/terra-api/` directory
2. Remove PHP references from `Dockerfile`
3. Remove MySQL connection from any remaining configs
4. Update CI/CD pipeline to skip PHP deployment
5. Decommission RDS instance (after data verification)
6. Update `omniride/packages/common/src/constants/env-vars.ts` to remove DB_* vars

---

### EPIC 3: Android App Feature Parity (Weeks 2-4)

#### TAM-120: Add Errand Portal to Android app
**Priority:** HIGH | **Effort:** 3 days

Implement errand booking flow matching PWA:
- Plan selection (Hourly/Half Day/Full Day)
- Shopping list builder (item name, vendor, quantity)
- Rider assignment + real-time tracking
- API: `POST /errands`, `GET /errands`

#### TAM-121: Add Battery Swap Station Finder
**Priority:** HIGH | **Effort:** 2 days

- Map view showing nearby swap stations
- Station details (available slots, brand, swap fee)
- Swap initiation with 90/10 payment split
- API: `GET /stations`, `POST /payments/swap`

#### TAM-122: Add Carbon Wallet & Blockchain View
**Priority:** MEDIUM | **Effort:** 2 days

- Display carbon credits earned per ride (eco-score based)
- Blockchain event ledger (block height, hash, type)
- OMNI token balance display
- API: `GET /blockchain/ledger`, `GET /carbon/rate`

#### TAM-123: Add DeFi Loan Calculator
**Priority:** MEDIUM | **Effort:** 2 days

- Asset loan calculator (bike purchase financing)
- Insurance loan calculator
- Application submission
- Active loan status + daily deduction display
- API: `POST /defi/asset-loan`, `POST /defi/insurance-loan`

#### TAM-124: Multi-language Support
**Priority:** MEDIUM | **Effort:** 2 days

- Extract all strings to `res/values/strings.xml`
- Add `res/values-es/`, `res/values-fr/`, `res/values-zh/`
- In-app language switcher
- Persist selection in SharedPreferences

---

### EPIC 4: AWS Infrastructure Consolidation (Week 2)

#### TAM-130: Consolidate DynamoDB tables
**Priority:** P1 | **Effort:** 4 hours

Ensure all 18 tables have proper GSIs and auto-scaling:

```
opusaimobility-users          PK: userId        GSI: email-index, phone-index
opusaimobility-trips          PK: tripId        GSI: userId-index, status-index
opusaimobility-orders         PK: orderId       GSI: userId-index, restaurantId-index
opusaimobility-errands        PK: errandId      GSI: userId-index
opusaimobility-transactions   PK: txId          GSI: userId-index, type-index
opusaimobility-swap-stations  PK: stationId     GSI: ownerId-index, location-index
opusaimobility-inventory      PK: itemId        GSI: vendorId-index
opusaimobility-blockchain     PK: blockHeight   GSI: eventType-index
opusaimobility-audit-logs     PK: logId         GSI: userId-index, timestamp-index
opusaimobility-platform       PK: configKey     (singleton table for settings)
opusaimobility-push-endpoints PK: userId+SK:token  GSI: endpointArn-index
opusaimobility-restaurants    PK: restaurantId  GSI: ownerId-index
opusaimobility-drivers        PK: driverId      GSI: status-index, location-index
opusaimobility-notifications  PK: notifId       GSI: userId-index
opusaimobility-ws-connections PK: connectionId  GSI: userId-index
opusaimobility-config         PK: configKey     (ride types, countries, charges)
opusaimobility-food-categories PK: categoryId
opusaimobility-coupons        PK: couponId      GSI: code-index
```

#### TAM-131: Set up DynamoDB backup & point-in-time recovery
**Priority:** P1 | **Effort:** 1 hour

- Enable PITR on all production tables
- Create daily backup schedule via AWS Backup
- Set retention to 35 days
- Test restore procedure

#### TAM-132: Migrate any remaining MySQL data to DynamoDB
**Priority:** P0 | **Effort:** 4 hours

Use existing migration scripts at `omniride/scripts/migrate/`:
- `export-db.ts` — Exports from MySQL
- `import-db.ts` — Imports into DynamoDB
- `migrate-users.ts` — MySQL users → Cognito
- `verify.ts` — Validates migration completeness

Run full migration, verify, then decommission RDS.

#### TAM-133: Unify Lambda API into single deployment package
**Priority:** P2 | **Effort:** 8 hours

Current state: Multiple Lambda sources across 3 directories:
- `TerraAI/aws/lambda/` (api, ws, push)
- `omniride/aws/lambda/` (main API)
- `aws/lambda/` (blockchain, telemetry, reporting, defi, payments)

Target: Single monorepo Lambda deployment structure:
```
omniride/aws/lambda/
├── api/             → Main REST API (all 70+ routes)
├── ws/              → WebSocket handler
├── push/            → Push notification processor
├── blockchain/      → Celo carbon credit operations
├── telemetry/       → IoT Core telemetry ingestion
├── reporting/       → Financial reporting
├── defi/            → DeFi settlement scheduler
├── payments/        → M-Pesa, Stripe, Airtel
└── secrets-rotation/ → Secrets Manager rotator
```

---

### EPIC 5: CI/CD & Testing (Week 3)

#### TAM-140: Add Android build to GitHub Actions
**Priority:** P1 | **Effort:** 4 hours

Update `.github/workflows/terra-ai-unified.yml`:
```yaml
android:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with: { java-version: '17', distribution: 'temurin' }
    - uses: gradle/gradle-build-action@v2
    - run: cd omniride/apps/customer && ./gradlew assembleRelease
    - uses: actions/upload-artifact@v4
      with: { name: customer-apk, path: '**/*.apk' }
```

#### TAM-141: Add integration tests for Lambda API
**Priority:** P2 | **Effort:** 6 hours

- Test all PHP replacement endpoints (file presign, device tokens)
- Test auth flow end-to-end (signup → signin → token refresh)
- Test critical paths (ride request, food order, errand creation)
- Run against DynamoDB Local for CI

#### TAM-142: Add Android instrumentation tests
**Priority:** P2 | **Effort:** 4 hours

- Auth flow (login, signup, forgot password)
- Ride booking flow (location → estimate → confirm)
- WebSocket connection + message handling
- Push notification receipt

---

## 6. TIMELINE SUMMARY

```
WEEK 1  ┃ EPIC 1 (Android Migration) + EPIC 2 (PHP Elimination)
        ┃ TAM-100 → TAM-105, TAM-110 → TAM-113
        ┃ MILESTONE: Android app builds with new package name, PHP deleted
        ┃
WEEK 2  ┃ EPIC 3 (Feature Parity - High Priority) + EPIC 4 (AWS Consolidation)  
        ┃ TAM-120, TAM-121, TAM-130 → TAM-133
        ┃ MILESTONE: Errands + Battery Swap in Android, DynamoDB fully consolidated
        ┃
WEEK 3  ┃ EPIC 3 (Feature Parity - Medium Priority) + EPIC 5 (CI/CD)
        ┃ TAM-122 → TAM-124, TAM-140 → TAM-142
        ┃ MILESTONE: Full feature parity, CI builds APK, tests passing
        ┃
WEEK 4  ┃ Polish, testing, production deployment
        ┃ Performance optimization, crash reporting (Crashlytics)
        ┃ Play Store listing preparation
        ┃ MILESTONE: Production-ready APK
```

---

## 7. RISK REGISTER

| Risk | Impact | Mitigation |
|------|--------|------------|
| Java → Kotlin migration breaks existing functionality | HIGH | Phase 1: Keep Java, Phase 2: Gradual Kotlin migration per-file |
| DynamoDB cold-start latency on Lambda | MEDIUM | Provisioned concurrency for critical paths (auth, ride request) |
| Push notification token migration loses users | HIGH | Dual-write period: keep old + new tokens active for 30 days |
| S3 direct upload from client introduces security risk | MEDIUM | Pre-signed URLs with 5-min expiry, server-side validation Lambda trigger |
| Existing users on TerraAI pool can't access new app | HIGH | Cognito User Migration Lambda already exists in `aws/lambda/user-migration/` |

---

## 8. FILES TO DELETE AFTER MIGRATION

```
omniride/apps/terra-api/               → PHP backend (ENTIRE DIRECTORY)
TerraAI/Admin panel/                   → Legacy PHP admin (replaced by React admin)
TerraAI/Android source code/           → Source moved to omniride/apps/customer/
TerraAI/Debug APK/                     → Obsolete debug build
TerraAI/documentation/                 → Empty/unused
```

---

## 9. IMPLEMENTATION ORDER (START HERE)

1. **TAM-100** — Copy Android source to `omniride/apps/customer/`
2. **TAM-101** — Rename package to `com.opusaimobility.customer`
3. **TAM-103** — Update API URLs to point to Lambda (eliminate PHP dependency)
4. **TAM-110** — Create S3 pre-signed URL Lambda (replaces PHP upload.php)
5. **TAM-111** — Migrate device token management to DynamoDB Lambda
6. **TAM-113** — Delete PHP backend
7. **TAM-104** — Fix push notifications with proper SNS/FCM setup
8. **TAM-105** — Update Cognito to unified pool
9. **TAM-132** — Run MySQL → DynamoDB migration scripts
10. **TAM-102** — Upgrade build system

---

## 10. ANDROID APP FINAL ARCHITECTURE

```
omniride/apps/customer/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/opusaimobility/customer/
│   │   │   │   ├── activities/          → All Activities (Splash, Login, Home, Telemetry)
│   │   │   │   ├── fragments/           → UI Fragments
│   │   │   │   ├── adapters/            → RecyclerView adapters
│   │   │   │   ├── models/              → Data classes (User, Ride, Order, etc.)
│   │   │   │   ├── api/                 → Retrofit interfaces + ApiClient
│   │   │   │   ├── aws/                 → Cognito auth, WebSocket, S3, SNS
│   │   │   │   ├── services/            → Location service, notification service
│   │   │   │   ├── utils/               → Helpers, constants
│   │   │   │   ├── ride/                → Ride booking + tracking
│   │   │   │   ├── food/                → Food ordering
│   │   │   │   ├── parcel/              → Parcel delivery
│   │   │   │   ├── errand/              → NEW: Errand portal
│   │   │   │   ├── swap/                → NEW: Battery swap
│   │   │   │   ├── carbon/              → NEW: Carbon wallet
│   │   │   │   └── defi/                → NEW: DeFi loans
│   │   │   ├── res/
│   │   │   │   ├── layout/             → XML layouts
│   │   │   │   ├── values/             → Strings, colors, dimens
│   │   │   │   ├── values-es/          → Spanish
│   │   │   │   ├── values-fr/          → French
│   │   │   │   ├── drawable/           → Icons, backgrounds
│   │   │   │   └── navigation/         → Nav graph
│   │   │   └── AndroidManifest.xml
│   │   ├── debug/
│   │   └── release/
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── gradle/
│   └── wrapper/
├── build.gradle.kts (project)
├── settings.gradle.kts
└── gradle.properties
```

---

## 11. API ENDPOINTS THE ANDROID APP WILL CALL (NO PHP)

All calls go to: `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod`

| Category | Method | Path | Purpose |
|----------|--------|------|---------|
| Auth | POST | `/auth/signup` | Create account |
| Auth | POST | `/auth/signin` | Login |
| Auth | POST | `/auth/refresh` | Refresh JWT |
| Auth | GET | `/auth/me` | Get current user |
| Users | PUT | `/users/sync` | Upsert profile |
| Rides | POST | `/rides/request` | Book a ride |
| Rides | GET | `/rides` | Ride history |
| Food | GET | `/vendors` | List restaurants |
| Food | POST | `/orders` | Place food order |
| Parcel | POST | `/orders` | Create parcel order |
| Errands | POST | `/errands` | Book errand rider |
| Files | POST | `/files/presign-upload` | Get S3 upload URL |
| Files | GET | `/files/presign-download` | Get S3 download URL |
| Devices | POST | `/devices/token` | Register push token |
| Payments | POST | `/payments/mpesa` | M-Pesa STK push |
| Payments | POST | `/payments/stripe` | Card payment |
| Stations | GET | `/stations` | Battery swap stations |
| Carbon | GET | `/blockchain/ledger` | Carbon credits |
| DeFi | POST | `/defi/asset-loan` | Apply for loan |
| IoT | GET | `/iot/telemetry` | EV telemetry |
| AI | POST | `/ai/locations` | Location autocomplete |
| AI | POST | `/ai/distance` | Route distance/ETA |

---

## 12. SUMMARY OF DECISIONS

1. **Keep DynamoDB** — Already the primary database with 18+ tables. No reason to add RDS complexity.
2. **Eliminate PHP entirely** — Only 4 handlers exist; all trivially replaceable by Lambda.
3. **Eliminate MySQL/RDS** — Migration scripts already exist and have been used. Run final migration, decommission.
4. **Keep Java initially, plan Kotlin migration** — Rewriting 50+ Java files to Kotlin in one pass is high-risk. Gradual file-by-file conversion is safer.
5. **Direct S3 upload** — More scalable than proxying through Lambda/PHP. Pre-signed URLs are the AWS best practice.
6. **Unified Cognito pool** — Both apps authenticate against the same pool (`us-east-1_LKa4ElQem`).
7. **Single API Gateway** — One REST API Gateway URL for all endpoints. No PHP endpoint needed.

---

*End of Migration Plan*
