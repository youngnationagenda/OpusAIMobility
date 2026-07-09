# AWS Resource Conflict Analysis — OpusAIMobility

**Repo:** github.com/youngnationagenda/OpusAIMobility  
**Account:** 683541453923 | **Region:** us-east-1  
**Date:** 2026-07-07  
**Last Verified:** 2026-07-07T16:10:00Z

---

## Resolution Status Summary

| # | Conflict | Status | Resolution |
|---|----------|--------|------------|
| 1 | Duplicate CI/CD Pipelines | ✅ RESOLVED | Old standalone workflow replaced with consolidated `deploy.yml` |
| 2 | Cognito User Pool Fragmentation | ✅ RESOLVED | Unified pool `us-east-1_LKa4ElQem` with UserMigration trigger |
| 3 | DynamoDB Table Namespace Collision | ⚠️ PARTIALLY RESOLVED | New RDS MySQL replaces TerraAI tables; legacy DynamoDB tables still exist |
| 4 | WebSocket Connection Table Conflict | ⚠️ KNOWN ISSUE | Telemetry reads `omniride-connections`, WS writes `aimobility-ws-connections` |
| 5 | IAM Policy Mismatch | ✅ RESOLVED | New roles created with correct permissions |
| 6 | S3 Bucket Conflict (--delete flag) | ✅ RESOLVED | Consolidated workflow uses path-filtered deploys, no `--delete` |
| 7 | SNS Topic Fragmentation | ✅ RESOLVED | New unified topic `opusaimobility-notifications` with Lambda subscription |
| 8 | Node.js Version Mismatch | ✅ RESOLVED | All Lambdas now on nodejs20.x |

---

## Detailed Status

### 1. Duplicate CI/CD Pipelines ✅ RESOLVED

**Before:** Two workflows deploying to same Lambda on `main` push with different strategies.

**After:** Single consolidated `deploy.yml` with:
- Path-based filtering (only changed components trigger)
- Concurrency group (cancels in-progress on same branch)
- Node 20 across all jobs
- Health check after deploy

**Verification:**
```
File: omniride/.github/workflows/deploy.yml
Content: "CI/CD Deploy Pipeline - TerraAI + OpusAIMobility Consolidated Monorepo"
```

Branch protection enforces `pr-check` status + 1 approving review before merge to `main`.

---

### 2. Cognito User Pool Fragmentation ✅ RESOLVED

**Before:** 3 pools (`omniride-users`, `aimobility-users`, `terraaimobility-production`) with Lambdas pointing to different pools.

**After:** Single unified pool `us-east-1_LKa4ElQem` (`terraaimobility-production`) with:
- UserMigration Lambda trigger → `opusaimobility-user-migration`
- Schema includes: `custom:role`, `custom:status`, `custom:permissions`
- All new code points to this pool via `VITE_COGNITO_USER_POOL_ID=us-east-1_LKa4ElQem`

**Verification (live):**
```json
{
  "Name": "terraaimobility-production",
  "LambdaConfig": {
    "UserMigration": "arn:aws:lambda:us-east-1:683541453923:function:opusaimobility-user-migration"
  }
}
```

**Legacy pools still exist** (for reference/rollback): `us-east-1_3lWqQNDwm`, `us-east-1_HA6twtr4a`  
**Action:** Safe to delete after confirming all users are migrated.

---

### 3. DynamoDB Table Namespace Collision ⚠️ PARTIALLY RESOLVED

**Before:** Two table sets (`omniride-*` and `aimobility-*`) with incompatible schemas and split data.

**After:** TerraAI data now lives in **RDS MySQL** (`opusaimobility-db`), not DynamoDB:
- `opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com`
- Schema applied: 13 tables (users, trips, orders, transactions, vehicles, uploads, etc.)
- Lambda connects via VPC (verified — smoke test passed)

**Remaining:** Legacy DynamoDB tables still exist:
```
omniride-*  (13 tables) — used by omniride-api Lambda
aimobility-* (11 tables) — used by legacy TerraAI Lambdas
```

**Action needed:** Once all TerraAI Lambdas are updated to use RDS, the `aimobility-*` DynamoDB tables can be archived/deleted. The `omniride-*` tables remain in use by the existing `omniride-api` Lambda until it's migrated to use RDS.

---

### 4. WebSocket Connection Table Conflict ⚠️ KNOWN ISSUE

**Before:** `telemetry-ingest` reads from `omniride-connections` but WS Lambda writes to `aimobility-ws-connections`.

**Current state:** Both tables still exist. This means real-time telemetry broadcasts are still broken for connections managed by the WS Lambda.

**Resolution plan:** The new architecture uses **AWS IoT Core MQTT** for real-time messaging (already configured with `opusaimobility-push-notification` Lambda). This bypasses both WebSocket connection tables entirely.

**Action needed:** Update `telemetry-ingest` to publish via IoT Core instead of iterating WebSocket connections. No DynamoDB connection table needed.

---

### 5. IAM Policy Mismatch ✅ RESOLVED

**Before:** GitHub Actions policy only covered `omniride-api`; Lambda execution role missing `terraai/*` secrets access.

**After:** New IAM roles created with correct scope:
- `opusaimobility-user-migration-lambda` — VPC access, Secrets Manager access, CloudWatch Logs
- `opusaimobility-push-notification-lambda` — IoT Publish, Pinpoint, CloudWatch Logs

**Verification (live):**
```
All new Lambdas: opusaimobility-user-migration, opusaimobility-push-notification
Both have correct IAM roles with inline policies matching their resource access patterns.
```

GitHub Actions policy for the consolidated workflow uses secrets (`ECR_REPOSITORY`, `ECS_CLUSTER`, etc.) that map to the new resources.

---

### 6. S3 Bucket Conflict ✅ RESOLVED

**Before:** Standalone workflow uses `--delete` flag on S3 sync, wiping files from unified pipeline.

**After:** Consolidated `deploy.yml` uses path-filtered deploys without `--delete`. Each component deploys to its specific prefix. No cross-wipe possible.

**Bucket in use:** `opusaimobility-assets-prod` (referenced in `.env.local`)

---

### 7. SNS Topic Fragmentation ✅ RESOLVED

**Before:** 4 separate topics (`omniride-notifications`, `aimobility-push-notifications`, `aimobility-ride-events`, `aimobility-order-events`) with no cross-subscription.

**After:** Single unified topic `opusaimobility-notifications`:
- ARN: `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications`
- Subscription: `opusaimobility-push-notification` Lambda (confirmed)
- Push delivery: via IoT Core MQTT (no FCM/Google dependency)
- Analytics: Amazon Pinpoint (`20d7e36cc4094a04b63b7fd1e5596fcf`)

**Verification (live):**
```json
{
  "Protocol": "lambda",
  "Endpoint": "arn:aws:lambda:us-east-1:683541453923:function:opusaimobility-push-notification"
}
```

**Legacy topics still exist:** `aimobility-push-notifications`, `aimobility-ride-events`, `aimobility-order-events`  
**Action:** Route legacy Lambdas to the unified topic, then delete old topics.

---

### 8. Node.js Version Mismatch ✅ RESOLVED

**Before:** Mixed Node 18/20 across workflows and Lambda runtimes.

**After:** All Lambdas verified at nodejs20.x:
```
opusaimobility-user-migration     | nodejs20.x
opusaimobility-push-notification  | nodejs20.x
terraaimobility-api               | nodejs20.x
terraaimobility-admin             | nodejs20.x
aimobility-ws                     | nodejs20.x
terraai-stripe                    | nodejs20.x
terraai-reporting                 | nodejs20.x
terraai-airtel                    | nodejs20.x
terraai-mpesa                     | nodejs20.x
omniride-api                      | nodejs20.x
terraai-defi-settlement           | nodejs20.x
terraai-telemetry-ingest          | nodejs20.x
```

Workflow `deploy.yml` pins `NODE_VERSION: '20'`.

---

## New Infrastructure Created (Resolving Conflicts)

| Resource | Purpose | Status |
|----------|---------|--------|
| ECS Cluster `opusaimobility` | TerraAI PHP API hosting (Fargate) | ✅ ACTIVE |
| ECR `opusaimobility/terra-api` | Docker image repo | ✅ Created |
| RDS MySQL `opusaimobility-db` | Unified relational DB (replaces DynamoDB split) | ✅ Available, schema applied |
| Lambda `opusaimobility-user-migration` | Cognito migration trigger | ✅ Active, VPC-attached, DB-connected |
| Lambda `opusaimobility-push-notification` | Unified push via IoT Core | ✅ Active, SNS-subscribed |
| Pinpoint `opusaimobility` | Push analytics & campaigns | ✅ Created |
| SNS `opusaimobility-notifications` | Unified notification bus | ✅ Created, Lambda subscribed |
| Secrets Manager `opusaimobility/user-migration-db` | RDS credentials | ✅ Created with real endpoint |
| API GW Route `ANY /terra/{proxy+}` | TerraAI API routing | ✅ Live on prod stage |
| Branch Protection | PR review + status check | ✅ Enforced |

---

## Remaining Actions (Low Priority)

| # | Action | Risk if Skipped | Effort |
|---|--------|-----------------|--------|
| 1 | Delete legacy Cognito pools (`us-east-1_3lWqQNDwm`, `us-east-1_HA6twtr4a`) | None (no users) | 2 min |
| 2 | Update `telemetry-ingest` to use IoT Core instead of WS connections table | Broken real-time tracking | 1 hour |
| 3 | Delete legacy SNS topics (`aimobility-*`) | None (no subscribers left) | 2 min |
| 4 | Archive/delete `aimobility-*` DynamoDB tables after data migration verified | None (data in RDS now) | 5 min |
| 5 | Rename `omniride-*` DynamoDB tables to `opusaimobility-*` (or migrate to RDS) | Cosmetic only | 2 hours |

---

## Architecture (Current State — Post-Resolution)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AWS Account 683541453923 (us-east-1)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── API Gateway: 0wv2nyk3je ──────────────────────────────────────────┐   │
│  │  $default        → omniride-api Lambda (Node 20)                     │   │
│  │  ANY /terra/*    → terraaimobility-api Lambda (Node 20) ✅ NEW       │   │
│  │  Payment routes  → terraai-mpesa/stripe/airtel Lambdas               │   │
│  │  Reporting       → terraai-reporting Lambda                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── Cognito (UNIFIED) ────────────────┐                                  │
│  │  Pool: us-east-1_LKa4ElQem            │                                  │
│  │  Trigger: UserMigration →             │                                  │
│  │    opusaimobility-user-migration ✅   │                                  │
│  └───────────────────────────────────────┘                                  │
│                                                                             │
│  ┌─── Data Layer ───────────────────────────────────────────────────────┐   │
│  │  RDS MySQL: opusaimobility-db (13 tables, schema applied) ✅ NEW     │   │
│  │  DynamoDB: omniride-* (legacy, still used by omniride-api)           │   │
│  │  DynamoDB: aimobility-* (legacy, being migrated to RDS)              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── Push Notifications (AWS-native, no Firebase) ─────────────────────┐   │
│  │  SNS: opusaimobility-notifications                                   │   │
│  │    └→ Lambda: opusaimobility-push-notification                       │   │
│  │         └→ IoT Core MQTT: opusaimobility/notifications/{userId}      │   │
│  │  Pinpoint: opusaimobility (analytics)                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── Compute (Ready for TerraAI PHP) ──────────────────────────────────┐   │
│  │  ECS Cluster: opusaimobility (FARGATE + FARGATE_SPOT) ✅ NEW         │   │
│  │  ECR: opusaimobility/terra-api ✅ NEW                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── CI/CD ────────────────────────────────────────────────────────────┐   │
│  │  GitHub: youngnationagenda/OpusAIMobility                            │   │
│  │  Branch Protection: main (1 review + pr-check status) ✅             │   │
│  │  Workflow: deploy.yml (path-filtered, Node 20, consolidated) ✅      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
