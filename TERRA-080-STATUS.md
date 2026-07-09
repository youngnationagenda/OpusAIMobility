# TERRA-080 + Task Audit Status
## Generated: 2026-07-08 | Sonie

---

## ✅ COMPLETED TODAY

### FCM HTTP v1 Pipeline — TERRA-080 + P1 Priority 1

| Component | Status | Detail |
|---|---|---|
| Firebase service account | ✅ | `opusaimobility/firebase-service-account` in Secrets Manager |
| `push-notification/index.mjs` | ✅ | Rewritten — FCM HTTP v1 + IoT MQTT + WebSocket triple delivery |
| `opusaimobility-push-endpoints` DynamoDB | ✅ | Created (userId PK + deviceToken SK, PAY_PER_REQUEST) |
| IAM policy `PushNotificationAccess` | ✅ | Expanded: SecretsManager, DynamoDB, execute-api:ManageConnections |
| Lambda deployed | ✅ | `opusaimobility-push-notification` v2 (3.1 MB) |
| Lambda env vars | ✅ | FCM_PROJECT_ID, FCM_SERVICE_ACCOUNT_SECRET, PUSH_ENDPOINTS_TABLE |
| `aimobility-push` SNS_PLATFORM_APP_ARN | ✅ | PENDING_FCM_KEY → FCM_V1_VIA_OPUSAIMOBILITY_PUSH_NOTIFICATION |
| `setup-fcm-sns.js` | ✅ | Rewritten for HTTP v1, ran successfully |
| `google-services.json` (both copies) | ✅ | project_id=opusaimobility, project_number=113167999384360995568 |

### OI-003 — Push SNS routing (was BLOCKING KIRO)

| Item | Status |
|---|---|
| `omniride/aws/lambda/index.js` `pushNotification()` | ✅ Now publishes to `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |
| Old route | `SNS_TOPIC_ARN` = `omniride-notifications` (wrong topic, no push Lambda sub) |
| New route | `opusaimobility-notifications` → `opusaimobility-push-notification` Lambda |

> **🔴 KIRO ACTION REQUIRED: Deploy updated `omniride-api` Lambda (index.js changed)**

### REQ-001 — Android BASE_URL → CloudFront WAF-protected URL

| File | Change |
|---|---|
| `omniride/apps/customer/.../Constants.java` | `BASE_URL` → `https://d22up4o3zhu9gf.cloudfront.net/` |

### OI-001 — WAF Status

- `opusaimobility-api-waf` (GLOBAL scope) **already attached** to CloudFront `E18GJ5VKHBIJAI`
- Confirmed via: `aws cloudfront get-distribution --id E18GJ5VKHBIJAI --query DistributionConfig.WebACLId`
- Returns: `arn:aws:wafv2:us-east-1:683541453923:global/webacl/opusaimobility-api-waf/6d59000b...`
- **Status: ACTIVE ✅** (was listed as open — now confirmed closed)

### OI-006 — Legacy Cognito pools decommissioned

| Pool | Users | Action |
|---|---|---|
| `us-east-1_HA6twtr4a` (`aimobility-users`) | 0 | ✅ Deleted |
| `us-east-1_3lWqQNDwm` (`omniride-users`) | 0 | ✅ Deleted |
| `us-east-1_LKa4ElQem` (`terraaimobility-production`) | Active | ✅ Kept — sole unified pool |

---

## ✅ ALREADY LIVE (confirmed — no action needed)

| Item | Evidence |
|---|---|
| OI-002: `terraai-reporting` env vars | `TABLE_TRIPS`, `TABLE_ORDERS`, `TABLE_USERS`, `TABLE_TRANSACTIONS`, `REGION` all set |
| OI-004: Payment Lambda SecretsManager IAM | `SecretsManagerAccess` policy on `terraaimobility-lambda-role` |
| OI-005: UserMigration Lambda attached | `LKa4ElQem` LambdaConfig: `UserMigration = opusaimobility-user-migration` |
| SNS subscription | `opusaimobility-notifications` → `opusaimobility-push-notification` Lambda active |

---

## ⚠️ STILL BLOCKED — External Dependencies

### Gemini CLI Auth

| Method Tried | Result | Root Cause |
|---|---|---|
| `oauth-personal` | ❌ DASHER_USER IneligibleTierError | `mk@yna.co.ke` is Google Workspace — blocked from free tier |
| `gemini-api-key` | ❌ 403 Key leaked | Stored key exposed in session — auto-revoked by Google |
| `vertex-ai` | ❌ SERVICE_DISABLED | `aiplatform.googleapis.com` not enabled on project `opusaimobility` |
| `cloud-shell` / `service-account` | ❌ Invalid auth method | Not valid CLI selectedType values |

**Fix Option A (easiest):** Create new API key at https://aistudio.google.com/apikey → run:
```bash
aws secretsmanager put-secret-value --secret-id omniride/gemini-api-key --secret-string "YOUR_NEW_KEY"
```

**Fix Option B:** Enable Vertex AI API at:
https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=opusaimobility

---

## 📋 REMAINING OPEN ITEMS (from MASTER_TASKS.md)

| # | Item | Priority | Notes |
|---|---|---|---|
| OI-007 | Activate real payment credentials (M-Pesa, Stripe, Airtel) | 🟡 P1 | Update Secrets Manager values |
| OI-008 | Lambda aliases for rollback protection | 🟡 P1 | `terraai-mpesa`, `terraai-stripe`, `opusaimobility-push-notification` |
| OI-009 | Deploy CloudWatch alarms | 🟡 P1 | `aws cloudformation deploy --stack-name opusaimobility-monitoring --template-file infra/monitoring/cloudwatch.json` |
| TERRA-040 | WebSocket driver location broadcasting (`MapView.tsx`) | 🟢 P2 | 13pts |
| TERRA-041 | Android location updates via WebSocket during ride | 🟢 P2 | 8pts |
| TERRA-060 | Admin reporting — real DynamoDB data | 🟢 P2 | Needs OI-002 (done) |
| TERRA-070 | Replace localStorage mock with DynamoDB sync | 🟢 P2 | 8pts |
| TERRA-080 | Android: errand portal, battery swap, carbon wallet, DeFi view | 🟢 P2 | 20pts |
| 13.2 | PR check workflow `pr-check.yml` | Sprint 4 | Already exists per MASTER_TASKS.md ✅ |
| 13.3 | CI path filter property test | Sprint 4 | Check if exists at `tests/ci/path-filter.property.test.ts` |
| 14.x | Monitoring: structured logging, X-Ray, GuardDuty | Sprint 4 | CloudFormation template exists |
| 15.x | VPC security groups, Secrets rotation, RDS network isolation | Sprint 4 | Config files exist |
| 17 | Final checkpoint — all 19 properties pass | Sprint 4 | Run `npm test` from `omniride/` |

---

## 🔑 FCM Delivery Flow (Live)

```
Android Device
     │
     ▼  POST /devices/token (Cognito JWT)
omniride-api Lambda (index.js)
     │
     ▼  PUT opusaimobility-push-endpoints (DynamoDB)
     │  { userId, deviceToken, platform: 'fcm' }
     │
Backend Event → /notifications/push
     │
     ▼  SNS Publish → opusaimobility-notifications
     │
     ▼  opusaimobility-push-notification Lambda
     ├─ FCM HTTP v1 (oauth2.googleapis.com → fcm.googleapis.com/v1/projects/opusaimobility/messages:send)
     │    └─ Reads tokens from opusaimobility-push-endpoints
     │    └─ Service account from opusaimobility/firebase-service-account (Secrets Manager)
     │    └─ Stale token cleanup on UNREGISTERED error
     ├─ IoT Core MQTT → opusaimobility/notifications/{userId}
     └─ WebSocket → omniride-connections table → active sessions
```
