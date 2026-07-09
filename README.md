# OpusAIMobility

**100% Zero-Emission Mobility Platform** — AI-powered ride-hailing that aggregates electric-only transport services with carbon tracking, blockchain rewards, DeFi micro-lending, and a full AWS serverless backend.

Built for the East African market (Kenya-first), OpusAIMobility consolidates what was formerly TerraAI into a unified monorepo with a React PWA, Android native app, 70+ Lambda API routes, and a Celo-based carbon credit token.

---

## Platform Overview

OpusAIMobility is a multi-sided marketplace connecting riders, drivers, food vendors, errand runners, and fleet operators — all on electric vehicles. The platform incentivizes zero-emission transport by minting carbon credits (TCRBN tokens) for every EV kilometer driven.

**Core verticals:**

- **Ride-hailing** — EV-only rides with real-time driver location, surge pricing, and multi-provider comparison
- **Food delivery** — Restaurant ordering with driver dispatch and live tracking
- **Errand services** — On-demand package delivery and task completion
- **Energy & charging** — Swap station locator, battery telemetry, and IoT-connected charging
- **Carbon wallet** — Blockchain-based carbon credits (0.5 TCRBN per EV km), tradeable on Celo
- **DeFi micro-loans** — Driver vehicle financing with daily settlement via EventBridge

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                  │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  React PWA       │  Android App     │  Admin Panel                   │
│  (Vite + TS)     │  (Java, 226 files)│  (React components)           │
│  d2rofh106fep8b  │  com.opusaimo... │  Reporting, User Mgmt         │
│  .cloudfront.net │  Play Store ready│  RBAC-gated                    │
└────────┬─────────┴────────┬─────────┴──────────────┬────────────────┘
         │                  │                         │
         ▼                  ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EDGE / SECURITY LAYER                              │
│  CloudFront (d22up4o3zhu9gf) + WAF (rate-limit, SQLi, bad inputs)   │
│  Custom domain: opusaimobility.yna.co.ke                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API LAYER (AWS)                                 │
├────────────────────┬────────────────────┬───────────────────────────┤
│  API Gateway       │  WebSocket API     │  IoT Core MQTT             │
│  REST (omniride-   │  (z4sof7ojdf)      │  (arqymixni12gc-ats)      │
│  api Lambda)       │  Real-time comms   │  Device telemetry          │
│  70+ routes        │  Driver location   │  Push notifications        │
└────────┬───────────┴────────┬───────────┴──────────────┬────────────┘
         │                    │                           │
         ▼                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPUTE LAYER                                    │
│  omniride-api (unified)  │  opusaimobility-push-notification (FCM)  │
│  terraai-mpesa           │  terraai-stripe                          │
│  terraai-airtel          │  terraai-telemetry-ingest                │
│  terraai-defi-settlement │  opusaimobility-user-migration           │
│  opusaimobility-celo-deploy │  terraai-reporting                    │
│  All nodejs20.x  │  X-Ray Active  │  Lambda aliases (live)          │
└────────┬───────────────────┬───────────────────────────┬────────────┘
         │                   │                            │
         ▼                   ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                       │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  DynamoDB        │  RDS MySQL 8.0   │  S3                            │
│  11+ tables      │  opusaimobility- │  omniride-assets-prod          │
│  PITR enabled    │  db (legacy)     │  opusaimobility-apk-dist       │
│  GSIs on email,  │  13 tables       │  File uploads (presigned)      │
│  userId          │  Private subnets │                                │
├──────────────────┼──────────────────┼───────────────────────────────┤
│  Cognito         │  Secrets Manager │  SNS                           │
│  us-east-1_LKa4  │  9 secrets       │  opusaimobility-notifications │
│  ElQem           │  Auto-rotation   │  → Push Lambda subscription   │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, TypeScript 5.8, Leaflet maps, Lucide icons |
| Android | Java (226 files), Gradle 8.1, AGP 8.1.4, compileSdk 34, MPAndroidChart |
| Backend | AWS Lambda (Node.js 20), API Gateway (REST + WebSocket), IoT Core MQTT |
| Database | DynamoDB (11 tables, PITR), RDS MySQL 8.0 (legacy migration) |
| Auth | AWS Cognito (JWT), RBAC middleware |
| Push | FCM HTTP v1 (OAuth2 JWT), IoT MQTT, WebSocket triple-delivery |
| Payments | M-Pesa Daraja STK Push, Stripe PaymentIntent, Airtel Money |
| Blockchain | Solidity (ERC-20), Hardhat, Celo network, OpenZeppelin |
| AI | Google Gemini 2.0 Flash (fleet analysis, support chat) |
| Monitoring | CloudWatch (7 alarms + dashboard), X-Ray, GuardDuty, VPC Flow Logs |
| CI/CD | GitHub Actions, path-based filtering, signed APK releases |
| CDN/Security | CloudFront + WAF (rate-limit 1000/5min, SQLi protection) |
| i18n | English, Swahili, Arabic (RTL support) |

---

## Project Structure

```
OpusAIMobility/
├── .github/workflows/
│   └── terra-ai-unified.yml    # Unified CI/CD pipeline (10 jobs)
├── aws/                         # Infrastructure-level Lambdas
│   ├── iam/                     # IAM policy documents
│   ├── iot/                     # IoT Core rules and policies
│   ├── lambda/                  # Specialist Lambdas (payments, telemetry, DeFi)
│   ├── scripts/                 # AWS provisioning scripts
│   └── waf/                     # WAF rule definitions
├── contracts/                   # Solidity smart contracts (Celo)
│   ├── contracts/CarbonToken.sol
│   ├── hardhat.config.js
│   └── test/TerraCarbon.test.js
├── omniride/                    # Main application monorepo
│   ├── apps/
│   │   ├── customer/            # Android app (Java, Gradle)
│   │   └── terra-api/           # PHP backend (DEPRECATED)
│   ├── aws/lambda/
│   │   ├── index.js             # Unified API Lambda (70+ routes)
│   │   ├── push-notification/   # FCM + IoT + WebSocket push
│   │   └── user-migration/      # Cognito user migration trigger
│   ├── infra/                   # Infrastructure-as-code configs
│   │   ├── api-gateway/
│   │   ├── cognito/
│   │   ├── monitoring/          # CloudWatch + GuardDuty
│   │   ├── secrets/
│   │   └── vpc/
│   ├── packages/common/         # Shared TypeScript utilities
│   │   └── src/                 # auth, cors, routing, i18n, device-tokens
│   ├── scripts/
│   │   ├── ci/                  # APK upload, path filter
│   │   ├── migrate/             # DB migration (snapshot, export, import, verify)
│   │   └── setup/               # Environment setup scripts
│   ├── src/                     # React PWA frontend
│   │   ├── components/          # 36 React components
│   │   ├── services/            # 19 service modules
│   │   └── App.tsx              # Main application (all routes)
│   ├── tests/                   # 29 test files, 224 tests (vitest + fast-check)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── MASTER_TASKS.md              # Source of truth — all tasks and status
├── MIGRATION_PLAN.md            # TerraAI → OpusAIMobility migration plan
└── README.md                    # This file
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Java 17 (for Android builds)
- Android SDK (API 34)
- AWS CLI v2 (configured with appropriate IAM credentials)

### Frontend Development

```bash
cd omniride
npm install
npm run dev
```

Opens at `http://localhost:3000`. The PWA includes offline support via service worker.

### Run Tests

```bash
cd omniride
npm test
```

Runs 29 test files with 224 property-based tests using Vitest and fast-check (minimum 100 iterations per property).

### Android Build

```bash
cd omniride/apps/customer
chmod +x gradlew
./gradlew assembleDebug
```

The debug APK appears at `app/build/outputs/apk/debug/`. For signed release builds, see the CI/CD section.

### Smart Contract (Celo)

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

Deploy to Alfajores testnet:
```bash
npx hardhat run scripts/deploy.js --network alfajores
```

---

## Environment Variables

The frontend requires these Vite environment variables (set in CI or `.env.local`):

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | CloudFront API URL (`https://d22up4o3zhu9gf.cloudfront.net`) |
| `VITE_AWS_REGION` | AWS region (`us-east-1`) |
| `VITE_COGNITO_USER_POOL_ID` | Cognito pool (`us-east-1_LKa4ElQem`) |
| `VITE_COGNITO_CLIENT_ID` | Web client ID |
| `VITE_S3_BUCKET` | Upload bucket name |
| `VITE_IOT_ENDPOINT` | IoT Core WebSocket endpoint |
| `VITE_WS_ENDPOINT` | API Gateway WebSocket URL |
| `VITE_PINPOINT_APP_ID` | Pinpoint analytics app ID |

---

## Testing Strategy

All tests use **property-based testing** (fast-check) to verify correctness invariants rather than example-based assertions:

| Domain | Tests | What's Verified |
|--------|-------|----------------|
| Auth & RBAC | JWT validation, role-based access, legacy bcrypt credentials |
| Migration | Row counts preserved, constraints enforced, user mapping/merge correctness |
| Routing | TerraAI prefix stripping, default routes, CORS headers, path filtering |
| Push Notifications | Token limits, stale token cleanup, token rotation |
| WebSocket | Driver location broadcasting, message format, reconnection |
| DeFi | Money conservation, balance invariants, overdue flag correctness |
| i18n | Translation key coverage, RTL support, locale fallback |
| Admin | User search/filter, bulk actions, role assignment |
| CI | Path filter correctness (8 categories × 100+ iterations) |

Run with coverage:
```bash
cd omniride && npx vitest --coverage
```

---

## CI/CD Pipeline

The unified workflow (`.github/workflows/terra-ai-unified.yml`) runs 10 jobs with path-based filtering so only affected components rebuild:

```
validate-secrets → changes → ┬→ ci-frontend → deploy-frontend
                              ├→ test ──────→ deploy-lambda
                              ├→ test ──────→ deploy-push-lambda
                              ├→ deploy-infra-lambdas
                              ├→ deploy-customer-release (v* tags only)
                              └→ smoke-test (post-deploy)
```

**Triggers:**
- Push to `main` or `staging` — deploys affected components
- Pull request to `main` — runs tests and type-check only
- Tag `v*` — builds signed release APK and uploads to S3
- Manual dispatch — with skip options for frontend/lambda

### Release Build

To trigger a signed APK release:

```bash
git tag v1.8.0
git push origin v1.8.0
```

This requires 4 GitHub Secrets: `KEYSTORE_FILE` (base64), `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

The signed APK is uploaded to:
- `s3://opusaimobility-apk-distribution/apks/customer/release/opusaimobility-customer-v1.8.0.apk`
- `s3://opusaimobility-apk-distribution/apks/customer/release/latest-release.apk`

---

## API Routes

The unified Lambda (`omniride-api`) handles 70+ routes. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/signup` | Cognito user registration |
| POST | `/auth/signin` | Cognito authentication |
| GET | `/rides/pricing` | Fare calculation |
| POST | `/rides/book` | Book a ride |
| GET | `/rides/:id/track` | Real-time ride tracking |
| POST | `/payments/mpesa/stk` | M-Pesa STK Push |
| POST | `/payments/stripe/intent` | Stripe PaymentIntent |
| GET | `/carbon/balance` | TCRBN token balance |
| POST | `/carbon/mint` | Mint carbon credits (per ride) |
| GET | `/platform/settings` | Platform configuration |
| POST | `/files/presign-upload` | S3 presigned upload URL |
| GET | `/files/presign-download` | S3 presigned download URL |
| POST | `/devices/token` | Register push notification token |
| GET | `/errands/available` | Available errand tasks |
| POST | `/errands/place` | Place an errand order |

All endpoints are protected by CloudFront + WAF. Authenticated routes require a Cognito JWT in the `Authorization` header.

---

## Smart Contracts

**TerraCarbon (TCRBN)** — an ERC-20 token on the Celo network rewarding zero-emission transport.

| Property | Value |
|----------|-------|
| Standard | ERC-20 (OpenZeppelin) |
| Network | Celo (Alfajores testnet → mainnet) |
| Mint rate | 0.5 TCRBN per EV kilometer |
| Daily cap | 100 TCRBN per rider |
| Min trade | 5 TCRBN |
| Features | Burnable, Pausable, AccessControl |

The `opusaimobility-celo-deploy` Lambda handles on-chain deployment. Fund the wallet at `0x5b4bf10FE7b795D006BC904f7C058943f09851AF` with CELO for gas.

---

## Payments

Three payment providers are integrated, each with its own Lambda and Secrets Manager credentials:

| Provider | Market | Integration |
|----------|--------|-------------|
| M-Pesa (Daraja) | Kenya | STK Push (real-time mobile money) |
| Stripe | International | PaymentIntent API |
| Airtel Money | East Africa | Airtel Money API |

All payment Lambdas have `live` aliases for safe rollback and read credentials from AWS Secrets Manager at runtime.

---

## Monitoring & Security

| Service | Purpose |
|---------|---------|
| CloudWatch | 7 alarms (5xx rate, latency P95, DynamoDB throttle, Lambda errors, concurrent executions, dead letter queue, API 4xx spike) + unified dashboard |
| X-Ray | Distributed tracing on `omniride-api` + `push-notification` |
| GuardDuty | Account-level threat detection |
| VPC Flow Logs | Network traffic audit |
| WAF | Rate limiting (1000 req/5min), AWS managed rules (SQLi, common exploits, bad inputs) |
| Secrets Manager | 9 secrets with automatic rotation configured |
| IAM | Least-privilege policies per Lambda function |

---

## AWS Resources

| Resource | Identifier |
|----------|-----------|
| API (client-facing, WAF) | `https://d22up4o3zhu9gf.cloudfront.net` |
| Frontend CDN | `https://d2rofh106fep8b.cloudfront.net` |
| WebSocket | `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` |
| IoT Core | `arqymixni12gc-ats.iot.us-east-1.amazonaws.com` |
| Cognito Pool | `us-east-1_LKa4ElQem` |
| RDS | `opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com` |
| Region | `us-east-1` |
| Account | `683541453923` |

---

## Multi-Agent Development

This project was built collaboratively by three AI agents with strict directory ownership to prevent conflicts:

| Agent | Responsibility | Directories |
|-------|---------------|-------------|
| Kiro | AWS infrastructure, deployments, IAM | `aws/`, `infra/`, provisioning scripts |
| Sonie | Application code, tests, Android | `apps/`, `packages/`, `tests/`, `src/` |
| Claude | CI/CD pipelines, documentation, coordination | `.github/`, docs, task tracking |

Coordination files: `master.md` (housekeeping rules), `MASTER_TASKS.md` (source of truth), per-agent task files (`kiro.OpusAImobilitytask.md`, `sonie.OpusAImobilitytask.md`, `claude.OpusAImobilitytask.md`).

---

## License

Proprietary — Young Nation Agenda (YNA). All rights reserved.

---

## Contact

- **Support:** support@opusaimobility.com
- **Phone:** +254 700 000 001
- **Organization:** Young Nation Agenda
- **Domain:** opusaimobility.yna.co.ke
