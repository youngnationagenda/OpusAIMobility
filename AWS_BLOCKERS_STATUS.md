# AWS_BLOCKERS_STATUS.md
## OpusAIMobility — Live AWS Blocker & Status Report

> **Generated:** 2026-07-07 | **Auditor:** Sonie
> **Account:** 683541453923 | **Region:** us-east-1 | **IAM:** arn:aws:iam::683541453923:user/dev
> **Method:** Every line verified via live AWS CLI — no assumptions

---

## LEGEND
```
✅ CONFIRMED WORKING    — verified live, no action needed
⚠️  PARTIAL             — exists but incomplete or misconfigured
❌ BROKEN / MISSING     — not working, action required
🔒 SECURITY NOTE        — security-relevant finding
```

---

## 1. LAMBDA FUNCTIONS

### 1.1 Runtime (nodejs18.x → nodejs20.x upgrade)

| Function | Runtime | Status |
|---|---|---|
| `omniride-api` | nodejs20.x | ✅ |
| `terraaimobility-api` | nodejs20.x | ✅ |
| `terraaimobility-admin` | nodejs20.x | ✅ |
| `terraaimobility-admin-panel` | nodejs20.x | ✅ |
| `aimobility-ws` | nodejs20.x | ✅ |
| `aimobility-push` | nodejs20.x | ✅ |
| `opusaimobility-push-notification` | nodejs20.x | ✅ |
| `opusaimobility-user-migration` | nodejs20.x | ✅ |
| `terraai-telemetry-ingest` | nodejs20.x | ✅ |
| `terraai-defi-settlement` | nodejs20.x | ✅ |
| `terraai-mpesa` | nodejs20.x | ✅ |
| `terraai-stripe` | nodejs20.x | ✅ |
| `terraai-airtel` | nodejs20.x | ✅ |
| `terraai-reporting` | nodejs20.x | ✅ |
| `terraai-secrets-rotation` | nodejs20.x | ✅ |
| `ai-fleet-analysis` | nodejs24.x | ✅ (intentional — latest) |

**All 16 project Lambdas on nodejs20.x or higher. Zero on deprecated nodejs18.x.**

---

### 1.2 Lambda — Environment Variables & Wiring

| Function | Issue | Status |
|---|---|---|
| `omniride-api` | `GEMINI_SECRET_NAME`, `COGNITO_USER_POOL_ID`, `CLIENT_ID`, all SNS ARNs set | ✅ |
| `aimobility-ws` | `TABLE_CONNECTIONS=omniride-connections`, Cognito pool wired | ✅ |
| `terraai-telemetry-ingest` | `TABLE_CONNECTIONS=omniride-connections`, `TABLE_TELEMETRY=omniride-telemetry`, `WS_ENDPOINT` set | ✅ WebSocket conflict resolved — both use `omniride-connections` |
| `opusaimobility-push-notification` | `WS_ENDPOINT`, `IOT_ENDPOINT`, `PINPOINT_APP_ID` set | ✅ |
| `opusaimobility-user-migration` | `DB_HOST=opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT` all set | ✅ |
| `ai-fleet-analysis` | `GEMINI_SECRET_NAME=omniride/gemini-api-key` — raw key removed | ✅ 🔒 |
| `aimobility-push` | `SNS_PLATFORM_APP_ARN = PENDING_FCM_KEY` | ❌ C1 — FCM not wired |
| `terraai-reporting` | `Environment.Variables = null` — no table names configured | ❌ H7 — no env vars |
| `terraai-mpesa` | Only `SNS_TOPIC_PUSH` — no Daraja credentials injected at runtime | ⚠️ Secrets in SM, not read |
| `terraai-stripe` | Only `SNS_TOPIC_PUSH` — no Stripe SK at runtime | ⚠️ Secrets in SM, not read |
| `terraai-airtel` | Only `SNS_TOPIC_PUSH` — no Airtel credentials at runtime | ⚠️ Secrets in SM, not read |

---

### 1.3 omniride-api — Live Smoke Test

```
aws lambda invoke → GET /platform/settings
Response: HTTP 200
Body: {"autoSettlementEnabled":true,"configKey":"settings",
       "systemWeeklyFee":10,"deductionTime":"23:59"}
```
**✅ Primary API is live and responding correctly.**

---

### 1.4 Lambda Versioning & Rollback

| Function | Alias | Pinned Version | Status |
|---|---|---|---|
| `omniride-api` | `live` | Version 2 (2026-07-04) | ✅ Alias-based rollback active |
| All others | None | `$LATEST` only | ⚠️ No rollback protection |

---

## 2. API GATEWAY

### 2.1 HTTP APIs

| API | ID | Endpoint | Status |
|---|---|---|---|
| `omniride-http-api` | `0wv2nyk3je` | `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com` | ✅ Live |
| `terraaimobility-api` | `pg4ulam66a` | `https://pg4ulam66a.execute-api.us-east-1.amazonaws.com` | ✅ Live |
| `terraaimobility-admin` | `wqhukwpxqc` | `https://wqhukwpxqc.execute-api.us-east-1.amazonaws.com` | ✅ Live |
| `aimobility-ws` | `z4sof7ojdf` | `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com` | ✅ Live |

### 2.2 omniride-http-api Routes (0wv2nyk3je)

```
✅ $default                       → omniride-api Lambda
✅ ANY /terra/{proxy+}            → terraaimobility-api Lambda  ← C5 RESOLVED
✅ GET  /reporting/summary        → terraai-reporting Lambda
✅ GET  /reporting/financial      → terraai-reporting Lambda
✅ GET  /reporting/riders         → terraai-reporting Lambda
✅ GET  /reporting/gateways       → terraai-reporting Lambda
✅ POST /payments/mpesa/callback  → terraai-mpesa Lambda
✅ POST /payments/tkash           → terraai-mpesa Lambda
✅ POST /payments/tkash/callback  → terraai-mpesa Lambda
✅ POST /payments/airtel          → terraai-airtel Lambda
✅ POST /payments/airtel/callback → terraai-airtel Lambda
✅ POST /payments/stripe/webhook  → terraai-stripe Lambda
```
**`ANY /terra/{proxy+}` is LIVE — unified routing is deployed. C5 resolved.**

### 2.3 WAF

| WAF ACL | Rules | Attached to API | Status |
|---|---|---|---|
| `terraai-api-waf` | RateLimitPerIP, AWSManagedRulesCommonRuleSet, SQLi, KnownBadInputs | ❌ NOT attached to any API Gateway | ⚠️ WAF exists but not active |

> WAF is created and configured but `ResourceArns = []` — it is not protecting the API.
> **Action needed:** Associate WAF ACL with API Gateway stage.

---

## 3. COGNITO USER POOLS

| Pool ID | Name | Status |
|---|---|---|
| `us-east-1_LKa4ElQem` | `terraaimobility-production` | ✅ **PRIMARY — Active** |
| `us-east-1_HA6twtr4a` | `aimobility-users` | ⚠️ Legacy — not decommissioned |
| `us-east-1_3lWqQNDwm` | `omniride-users` | ⚠️ Legacy — not decommissioned |

### 3.1 Unified Pool Clients

| Client Name | Client ID |
|---|---|
| `terraaimobility-android` | `2am01r4fmsp0s08991ftgub887` |
| `terraaimobility-web` | `3a207uin5o3p4k1ngk334crntl` |

**Both clients wired to unified pool. ✅**

### 3.2 User Migration Lambda Trigger

```
Pool: us-east-1_LKa4ElQem
LambdaConfig.UserMigration = arn:aws:lambda:us-east-1:683541453923:function:opusaimobility-user-migration
```
**✅ C4 RESOLVED — Migration Lambda is attached to the unified Cognito pool.**

### 3.3 Migration Lambda DB Connection

```
DB_HOST = opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com
DB_PORT = 3306
DB_NAME = terraai
DB_USER = admin_opus
DB_PASS = [set]
```
**✅ RDS credentials wired into user-migration Lambda.**

---

## 4. DYNAMODB

### 4.1 Point-in-Time Recovery (PITR)

| Table | PITR Status |
|---|---|
| `omniride-users` | ✅ ENABLED |
| `omniride-trips` | ✅ ENABLED |
| `omniride-orders` | ✅ ENABLED |
| `omniride-errands` | ✅ ENABLED |
| `omniride-transactions` | ✅ ENABLED |
| `omniride-swap-stations` | ✅ ENABLED |
| `omniride-inventory` | ✅ ENABLED |
| `omniride-blockchain` | ✅ ENABLED |
| `omniride-audit-logs` | ✅ ENABLED |
| `omniride-platform` | ✅ ENABLED |
| `omniride-connections` | ✅ ENABLED |
| `omniride-telemetry` | ✅ ENABLED |

**All 12 omniride-* tables have PITR enabled. H3 fully resolved. ✅**

### 4.2 GSIs (Global Secondary Indexes)

| Table | Index | Status |
|---|---|---|
| `omniride-users` | `email-index` | ✅ ACTIVE |
| `omniride-transactions` | `userId-index` | ✅ ACTIVE |
| `omniride-trips` | `customerId-index` | ✅ ACTIVE (pre-existing) |
| `omniride-connections` | `userId-index` | ✅ ACTIVE (pre-existing) |

**H4 resolved. ✅**

### 4.3 WebSocket Connection Table Conflict

```
aimobility-ws Lambda    → TABLE_CONNECTIONS = omniride-connections  ✅
terraai-telemetry-ingest → TABLE_CONNECTIONS = omniride-connections  ✅
```
**Both Lambdas now read/write the SAME table. C3 resolved. ✅**

---

## 5. S3 & CLOUDFRONT

### 5.1 Frontend

| Resource | Value | Status |
|---|---|---|
| S3 Bucket | `omniride-assets-prod` | ✅ Live |
| Contents | `index.html` + `assets/` (13 JS chunks) | ✅ |
| CloudFront | `E1TIJJKJ2UEIO7` → `d2rofh106fep8b.cloudfront.net` | ✅ Deployed |
| S3 Lifecycle | None configured | ⚠️ No lifecycle policy on omniride-assets-prod |

### 5.2 ECR / ECS

| Resource | Status |
|---|---|
| ECR Repo `opusaimobility/terra-api` | ✅ EXISTS |
| ECS Cluster `opusaimobility` | ✅ ACTIVE |
| ECS Service | ❌ 0 services — cluster empty, no container deployed yet |

> The ECR repo and ECS cluster exist. The Dockerfile is ready locally.
> **Action needed:** Build image, push to ECR, create ECS service with task def.

---

## 6. SNS & PUSH NOTIFICATIONS

### 6.1 SNS Topics

| Topic | Status |
|---|---|
| `omniride-notifications` | ✅ Exists |
| `aimobility-push-notifications` | ✅ Exists |
| `aimobility-ride-events` | ✅ Exists |
| `aimobility-order-events` | ✅ Exists |

### 6.2 FCM SNS Platform Application

```
SNS Platform Applications: NONE
```
**❌ C1 STILL OPEN — FCM Platform App not created.**

**Root cause:** The secret `terraai/fcm-server-key` contains:
```json
{"ServerKey":"PLACEHOLDER_SET_FIREBASE_SERVER_KEY","ProjectId":"terraai-mobility"}
```
**The FCM Server Key is a placeholder — no real Firebase key has been set.**
This is not a Sonie bug — the Firebase project credentials have never been provided.

**To fix:**
1. Go to Firebase Console → Project Settings → Cloud Messaging → Server Key
2. Run: `bash omniride/scripts/setup/setup-fcm-sns.sh` with real key in secret

---

## 7. SECRETS MANAGER

| Secret | Value | Status |
|---|---|---|
| `omniride/gemini-api-key` | Real Gemini API key | ✅ |
| `terraai/fcm-server-key` | `PLACEHOLDER_SET_FIREBASE_SERVER_KEY` | ❌ Placeholder |
| `terraai/mpesa` | Present | ⚠️ Not read by Lambda at runtime |
| `terraai/stripe` | Present | ⚠️ Not read by Lambda at runtime |
| `terraai/airtel` | Present | ⚠️ Not read by Lambda at runtime |
| `terraai/tkash` | Present | ⚠️ Not read by Lambda at runtime |
| `terraai/celo-contract` | Present | ⚠️ Not used yet (blockchain Phase 2) |
| `opusaimobility/user-migration-db` | Present | ✅ Used by migration Lambda |

---

## 8. IOT CORE & EVENTBRIDGE

### 8.1 IoT

| Resource | Value | Status |
|---|---|---|
| IoT Endpoint | `arqymixni12gc-ats.iot.us-east-1.amazonaws.com` | ✅ Active |
| IoT Rule `TerraAITelemetryIngest` | ENABLED → `terraai-telemetry-ingest` Lambda | ✅ Live |
| IoT SQL | `SELECT *, topic(3) as riderId FROM 'omniride/telemetry/+'` | ✅ Correct |
| Registered Things | 0 | ⚠️ No EV devices provisioned |

### 8.2 EventBridge

| Rule | Schedule | State | Target |
|---|---|---|---|
| `terraai-defi-daily` | `cron(59 23 * * ? *)` | ✅ ENABLED | `terraai-defi-settlement` Lambda |

---

## 9. RDS

| Instance | Engine | Status | Endpoint |
|---|---|---|---|
| `opusaimobility-db` | MySQL 8 | ✅ available | `opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com` |

---

## 10. SECURITY

### 10.1 WAF

```
WAF ACL: terraai-api-waf
Rules: RateLimitPerIP + AWSManagedRulesCommonRuleSet + SQLi + KnownBadInputs
Status: EXISTS but NOT ATTACHED to any API Gateway
ResourceArns: []
```
**⚠️ WAF exists but is not protecting anything. Needs association with API Gateway.**

### 10.2 GuardDuty

```
DetectorIds: []
```
**❌ GuardDuty NOT enabled. No threat detection active.**

### 10.3 Secrets Security

```
ai-fleet-analysis Lambda:
  BEFORE: GOOGLE_GENAI_API_KEY = AIzaSyDSW24O6uH... (plaintext in env)
  AFTER:  GEMINI_SECRET_NAME = omniride/gemini-api-key (reads from SM)
```
**✅ Raw API key removed from Lambda env. Secrets Manager only. 🔒**

---

## 11. CLAUDE DESKTOP MCP CONFIG

```
File: C:\Users\user\AppData\Roaming\Claude\claude_desktop_config.json
Servers configured: filesystem, memory, aws-cli, powershell, ubuntu, kiro
AWS credentials: injected via env vars in each server block
pwsh.exe: C:\Users\user\AppData\Local\Microsoft\WindowsApps\pwsh.exe
wsl.exe: C:\Users\user\AppData\Local\Microsoft\WindowsApps\wsl.exe (Ubuntu WSL2)
kiro: C:\Users\user\AppData\Local\Programs\Kiro\bin\kiro.cmd
```
**✅ Config written and deployed. Restart Claude Desktop to activate.**

---

## SUMMARY SCORECARD

| Blocker | Description | Status |
|---|---|---|
| **C1** | FCM SNS Platform App — push notifications broken | ❌ OPEN — placeholder Firebase key |
| **C2** | Payment Lambdas not reading Secrets Manager at runtime | ⚠️ PARTIAL — secrets exist, code doesn't call SM |
| **C3** | WebSocket connection table conflict (2 tables) | ✅ RESOLVED — both Lambdas use omniride-connections |
| **C4** | User Migration Lambda not attached to Cognito | ✅ RESOLVED — attached + DB creds wired |
| **C5** | `/terra/{proxy+}` route not on API Gateway | ✅ RESOLVED — route live on 0wv2nyk3je |
| **C6** | ECS Cluster + ECR repo missing | ✅ PARTIAL — cluster + ECR exist, no service deployed |
| **H1** | No CloudWatch alarms | ❌ OPEN — zero alarms exist |
| **H2** | All Lambdas on nodejs18.x | ✅ RESOLVED — all on nodejs20.x+ |
| **H3** | No PITR on DynamoDB tables | ✅ RESOLVED — all 12 tables ENABLED |
| **H4** | Missing GSIs on DynamoDB tables | ✅ RESOLVED — email-index + userId-index ACTIVE |
| **H5** | No PR check workflow | ❌ OPEN — pr-check.yml not created |
| **H6** | WAF not protecting API Gateway | ⚠️ PARTIAL — WAF exists, not associated |
| **H7** | terraai-reporting has zero env vars | ❌ OPEN — null env, reporting broken |
| **SEC** | Raw Gemini API key in Lambda env | ✅ RESOLVED — removed, SM reference only |

---

## ACTION ITEMS — ORDERED BY IMPACT

```
IMMEDIATE (unblock production today):
  1. C1  — Provide real Firebase Server Key → run setup-fcm-sns.sh
  2. H7  — Add env vars to terraai-reporting Lambda (table names)
  3. H6  — Associate terraai-api-waf with omniride-http-api stage

SHORT-TERM (this sprint):
  4. C2  — Update terraai-mpesa/stripe/airtel handlers to call SM at runtime
  5. H1  — Create CloudWatch alarms (Lambda error rate, duration, 5xx)
  6. C6  — Build + push terra-api Docker image, create ECS service
  7. SEC — Enable GuardDuty

NEXT SPRINT:
  8. H5  — Create pr-check.yml GitHub Actions workflow
  9.     — Decommission legacy Cognito pools (HA6twtr4a, 3lWqQNDwm)
  10.    — Restart Claude Desktop to activate MCP server config
```

---

*End of AWS_BLOCKERS_STATUS.md — Live audit 2026-07-07*
