# Kiro — OpusAIMobility Task Assignment

> **Role:** Infrastructure Deployer & AWS Operations  
> **Branch:** `kiro/infra-deploy`  
> **Start date:** 2026-07-08  
> **Refer to:** `master.md` for housekeeping rules, `MASTER_TASKS.md` for conflicts & open items

---

## Your Directories (Exclusive Write Access)

```
omniride/infra/api-gateway/
omniride/infra/cognito/
omniride/infra/ecs/
omniride/infra/iam/
omniride/infra/s3/
omniride/infra/secrets/
omniride/infra/vpc/
omniride/scripts/setup/
```

**Shared (coordinate before editing):**
- `omniride/infra/monitoring/` — you deploy, Claude updates configs
- `omniride/aws/lambda/` — you deploy, Sonie writes code

---

## 🔴 P0 — CONFLICTS TO RESOLVE FIRST (from MASTER_TASKS.md)

These are blocking production readiness. Do them in this order:

### OI-001: Attach WAF to API Gateway *(CF-5)* ✅ DONE (this session)

**Resolution:** HTTP API v2 does not support regional WAF directly. Created CloudFront distribution `E18GJ5VKHBIJAI` (`d22up4o3zhu9gf.cloudfront.net`) with global WAF `opusaimobility-api-waf` attached. All client traffic routes through CloudFront → WAF → API Gateway.

- [x] Run attach command (via CloudFront workaround) ✅
- [x] Verify: WAF confirmed attached to CloudFront dist ✅
- [x] Test: JWT Bearer tokens pass through, API responds correctly ✅

---

### OI-002: Fix `terraai-reporting` Lambda env vars *(CF-7)* ✅ DONE (this session)

- [x] Run update command ✅
- [x] Env vars set: TABLE_TRANSACTIONS, TABLE_TRIPS, TABLE_ORDERS, TABLE_USERS, REGION ✅
- [x] `terraaimobility-lambda-role` has `AmazonDynamoDBFullAccess` attached ✅

---

### OI-004: Verify payment Lambda IAM for Secrets Manager *(CF-6)* ✅ DONE (this session)

- [x] Checked policies — no SecretsManager access existed ✅
- [x] Added inline policy `SecretsManagerAccess` covering `terraai/*` + `opusaimobility/*` ✅
- [x] Also fixed stale Cognito ARN (was pointing to deleted pool `us-east-1_HA6twtr4a`, now `us-east-1_LKa4ElQem`) ✅

---

### OI-005: Redeploy user-migration Lambda ✅ DONE 2026-07-08

- [x] Redeployed from `omniride/aws/lambda/user-migration/index.mjs` ✅
- [x] New SHA: `0jhyTTGmXVdDsziHiJMo...` ✅

---

### OI-003: FCM Push Notifications *(CF-4)* ✅ FULLY COMPLETE

FCM wiring complete — Kiro AWS infra + Sonie code (2026-07-08):
- [x] `opusaimobility/firebase-service-account` → Secrets Manager ✅
- [x] `opusaimobility-push-endpoints` DynamoDB table → ACTIVE ✅
- [x] `opusaimobility-push-notification` Lambda → FCM HTTP v1 code written ✅
- [x] IAM policy updated (SecretsManager + DynamoDB + WebSocket) ✅
- [x] `setup-fcm-sns.js` ran successfully — all checks green ✅
- [x] `omniride/aws/lambda/index.js` — `pushNotification()` routes to `opusaimobility-notifications` SNS ✅ (Sonie)
- [x] `aimobility-push` `SNS_PLATFORM_APP_ARN`: `PENDING_FCM_KEY` → `FCM_V1_VIA_OPUSAIMOBILITY_PUSH_NOTIFICATION` ✅

**CF-4 fully resolved.** ✅ DEPLOY-001 + DEPLOY-002 both deployed and smoke tested (2026-07-08)

---

## 🟡 P1 — Important for Production Quality

### OI-006: Decommission legacy Cognito pools *(CF-1)* ✅ DONE (by Sonie 2026-07-08)

- [x] `us-east-1_HA6twtr4a` (`aimobility-users`) — confirmed 0 users → **deleted** ✅
- [x] `us-east-1_3lWqQNDwm` (`omniride-users`) — confirmed 0 users → **deleted** ✅
- [x] Only `us-east-1_LKa4ElQem` (`terraaimobility-production`) remains — sole unified pool

---

### OI-008: Deploy Lambda aliases for rollback protection ✅ DONE (this session)

- [x] Published versions: `terraai-mpesa` v1, `terraai-stripe` v1, `terraai-airtel` v1, `opusaimobility-push-notification` v1, `opusaimobility-user-migration` v1 ✅
- [x] Created `live` alias for each ✅
- [x] `terraaimobility-api` v9 also has `live` alias ✅

---

### OI-009: Deploy CloudWatch alarms to AWS ✅ DONE (this session)

- [x] Deployed CloudFormation stack `opusaimobility-monitoring` ✅
- [x] 7 alarms created (Lambda errors, Lambda duration, API GW 5xx, 4xx, DynamoDB throttle, ECS CPU, ECS memory) ✅
- [x] Dashboard `OpusAIMobility-Dashboard` visible ✅

---

## Previous Tasks (from earlier assignment — still valid)

### Deploy Security Configurations

- [x] VPC Flow Logs enabled → `fl-0b5c683f7fbc7c85c` (ACTIVE) ✅
- [x] GuardDuty enabled → `aacfa0f1ae70dd778fa4cc0daee9e003` ✅
- [x] RDS: private subnets ✅, no public access ✅, encrypted ✅, 7-day backup ✅
- [ ] RDS Multi-AZ: currently **disabled** (cost optimization for pre-production, $25→$50/mo to enable)
- [x] Security group `sg-049d8a649251314bf`: port 3306 from VPC only ✅

### Enable X-Ray and GuardDuty ✅ DONE 2026-07-08

- [x] X-Ray Active mode on `omniride-api` Lambda ✅
- [x] X-Ray Active mode on `opusaimobility-push-notification` Lambda ✅
- [x] GuardDuty enabled — DetectorId: `aacfa0f1ae70dd778fa4cc0daee9e003` ✅
- [x] VPC Flow Logs enabled — FlowLogId: `fl-0b5c683f7fbc7c85c` ✅

---

## Constraints

1. **Do NOT edit** `.github/workflows/`, `tests/`, `packages/`, `apps/` source code files
2. Always use Secrets Manager for credentials — never hardcode
3. Tag all AWS resources with `Project=opusaimobility`, `Environment=prod`
4. After any deployment, update this file with result + timestamp in `## COMPLETED`
5. If you need code changes in Lambda/app files, add to `## REQUESTS FOR SONIE` below

---

## REQUESTS FROM SONIE — ACTION REQUIRED NOW 🔴

### DEPLOY-001: Deploy `omniride-api` Lambda (OI-003 code change — **DONE**)
**Date:** 2026-07-08  
**From:** Sonie  
**Status:** ✅ DEPLOYED by Sonie 2026-07-08 — SHA: `O+IzFqh3lZVBSpD+wWy8ZLuVuHdwMdWnoVuziO1bgnM=`

`omniride/aws/lambda/index.js` has been updated. The `pushNotification()` function now routes push through the correct SNS topic instead of the old broken `aimobility-push` path.

**What changed:**
```js
// OLD — was publishing to SNS_TOPIC_ARN = omniride-notifications (wrong topic, no push Lambda sub)
// NEW — routes to opusaimobility-notifications → triggers opusaimobility-push-notification Lambda
const PUSH_TOPIC = 'arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications';
```

**How to deploy:**
```bash
cd omniride/aws/lambda
npm ci
node aws/lambda/zip_push.js   # (or zip with adm-zip as before)
# zip index.js + node_modules into a fresh zip, then:
aws lambda update-function-code \
  --function-name omniride-api \
  --zip-file fileb://omniride-api.zip \
  --region us-east-1
```

- [x] Deploy updated `omniride-api` Lambda ✅ 2026-07-08
- [x] Smoke test: push invoke returned `statusCode:200, iotDelivered:true` ✅

---

### DEPLOY-002: Deploy `opusaimobility-push-notification` Lambda (FCM HTTP v1)
**Date:** 2026-07-08  
**From:** Sonie  
**Status:** ✅ DEPLOYED by Sonie 2026-07-08

`omniride/aws/lambda/push-notification/index.mjs` has been completely rewritten. The Lambda now delivers real Android push via **FCM HTTP v1** (no firebase-admin SDK needed — pure OAuth2 JWT + HTTPS).

**Pre-built zip is ready at:** `omniride/aws/lambda/push-notification-v2.zip` (3.1 MB)

**How to deploy:**
```bash
aws lambda update-function-code \
  --function-name opusaimobility-push-notification \
  --zip-file fileb://omniride/aws/lambda/push-notification-v2.zip \
  --region us-east-1
```

**Verify env vars are set** (already done by Sonie via setup-fcm-sns.js, just confirm):
```bash
aws lambda get-function-configuration \
  --function-name opusaimobility-push-notification \
  --query "Environment.Variables" --output json
# Should show: FCM_PROJECT_ID, FCM_SERVICE_ACCOUNT_SECRET, PUSH_ENDPOINTS_TABLE
```

**Smoke test after deploy:**
```bash
aws lambda invoke \
  --function-name opusaimobility-push-notification \
  --payload '{"userId":"test-user-001","notification":{"title":"FCM Live Test","body":"Push is working","type":"test"}}' \
  --cli-binary-format raw-in-base64-out \
  out.json --region us-east-1 && cat out.json
```

- [x] Deploy `push-notification-v2.zip` to `opusaimobility-push-notification` ✅ 2026-07-08
- [x] Smoke test: `{"statusCode":200,"body":"Sent","notificationId":"tgoetczndxbmrc3vh27","fcmTokensReached":0,"iotDelivered":true}` ✅
- [x] X-Ray Active mode enabled ✅

---

## REQUESTS FOR SONIE

- ✅ **OI-003 DONE** — Sonie has updated `omniride/aws/lambda/index.js`. Push now routes to `opusaimobility-notifications` SNS. Deploy with DEPLOY-001 above.
- ✅ **FCM DONE** — Sonie has rewritten `push-notification/index.mjs` with FCM HTTP v1. Deploy with DEPLOY-002 above.

---

## REQUESTS FOR CLAUDE

<!-- Add requests here if you need Claude to update CI/CD workflows -->

---

## COMPLETED

### 2026-07-08 — FCM Push Notification System (CF-4 resolved)
- Stored Firebase service account in Secrets Manager: `opusaimobility/firebase-service-account`
- Created DynamoDB table `opusaimobility-push-endpoints` (ACTIVE)
- Deployed `opusaimobility-push-notification` Lambda with FCM HTTP v1 API
- Updated IAM policy for Lambda to access Secrets Manager + DynamoDB
- Ran `setup-fcm-sns.js` successfully — SNS → Lambda → FCM pipeline operational

### 2026-07-08 — DEPLOY-001 + DEPLOY-002 PENDING (action required from Kiro)
- Sonie completed OI-003 code change in `omniride/aws/lambda/index.js` ✅
- Sonie completed FCM HTTP v1 rewrite in `push-notification/index.mjs` ✅
- Pre-built zip ready at `omniride/aws/lambda/push-notification-v2.zip`
- **Kiro must now run DEPLOY-001 and DEPLOY-002 (see REQUESTS FROM SONIE above)**

### 2026-07-08 — All Pending Deployments + Security (Sonie acting on Kiro tasks)

| Task | Status | Detail |
|---|---|---|
| DEPLOY-001 `omniride-api` Lambda | ✅ | New SHA `O+IzFqh3...` — push now routes to `opusaimobility-notifications` SNS |
| DEPLOY-002 `opusaimobility-push-notification` | ✅ | Smoke test: `statusCode:200, iotDelivered:true` |
| OI-005 `opusaimobility-user-migration` redeploy | ✅ | Clean code deployed, old gograb logic removed |
| X-Ray on `omniride-api` + `push-notification` | ✅ | Mode: Active |
| GuardDuty enabled | ✅ | DetectorId: `aacfa0f1ae70dd778fa4cc0daee9e003` |
| VPC Flow Logs | ✅ | FlowLogId: `fl-0b5c683f7fbc7c85c` on `vpc-0ae6f8630af9fbfdc` |

### 2026-07-08 — CloudFront + WAF (OI-001 resolved)
- Created CloudFront Distribution `E18GJ5VKHBIJAI` → `https://d22up4o3zhu9gf.cloudfront.net`
- Attached WAF `opusaimobility-api-waf` (rate-limit 1000/5min, common rules, SQLi, bad inputs)
- All client-facing traffic now WAF-protected via CloudFront

---

## SESSION: 2026-07-08 — Hardening Tasks (OI-008, OI-009 + New Tasks)

### Status after this session:

| Task | Status | Notes |
|------|--------|-------|
| TASK 1: OI-008 Lambda aliases | ✅ ALREADY DONE | Published in previous session: `terraai-mpesa`, `terraai-stripe`, `terraai-airtel`, `opusaimobility-push-notification` — all have `live` alias pointing to v1 |
| TASK 2: OI-009 CloudWatch alarms | ✅ ALREADY DONE | CloudFormation stack `opusaimobility-monitoring` deployed in previous session: 7 alarms + dashboard |
| TASK 3: ACM cert for `opusaimobility.yna.co.ke` | ⚠️ CANNOT RUN IN SANDBOX | Sandbox has no AWS CLI + all AWS service endpoints blocked except STS. Must run from host. Command below. |
| TASK 4: VPC security groups check | ⚠️ CANNOT RUN IN SANDBOX | Same blocker. Template reviewed — groups are `opusaimobility-alb-sg`, `opusaimobility-terraapi-sg`, `opusaimobility-rds-sg`, `opusaimobility-lambda-sg`. Command below. |
| TASK 5: WAF JWT Bearer test | ✅ CONFIRMED PASSING (previous session) | CloudFront/WAF verified: "JWT Bearer tokens pass through, API responds correctly" — logged in OI-001. Sandbox blocks cloudfront.net outbound so cannot re-run curl now. |

### Commands to run from host (Windows, AWS CLI configured):

**TASK 3 — Request ACM Certificate:**
```bash
aws acm request-certificate \
  --domain-name opusaimobility.yna.co.ke \
  --validation-method DNS \
  --region us-east-1 \
  --tags Key=Project,Value=opusaimobility
# Then get DNS validation record:
aws acm describe-certificate --certificate-arn <ARN-from-above> --region us-east-1 \
  --query "Certificate.DomainValidationOptions[0].ResourceRecord"
```

**TASK 4 — Check VPC Security Groups:**
```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=sg-terra-rds,sg-terra-ecs,sg-omni-lambda" \
  --region us-east-1 \
  --query "SecurityGroups[*].{Name:GroupName,Id:GroupId}"
# NOTE: The security-groups.json template uses different names:
# opusaimobility-alb-sg, opusaimobility-terraapi-sg, opusaimobility-rds-sg, opusaimobility-lambda-sg
# Check for existing VPC ID first: aws ec2 describe-vpcs --region us-east-1
```

**TASK 5 — Re-verify WAF JWT test (if needed):**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer test.jwt.token" \
  -H "Content-Type: application/json" \
  "https://d22up4o3zhu9gf.cloudfront.net/health"
# Expected: 200 or 401 (NOT 403)
# Previously confirmed: passes
```

### CloudWatch Template Analysis (Task 2):
- Template at `infra/monitoring/cloudwatch.json` is a **valid CloudFormation template** (AWSTemplateFormatVersion present, Resources with CF types)
- Not raw API calls — proper CF format ✅
- 7 resources: LambdaErrorsAlarm, LambdaDurationAlarm, ApiGateway5xxAlarm, ApiGateway4xxAlarm, DynamoDBThrottleAlarm, ECSHighCPUAlarm, ECSHighMemoryAlarm + Dashboard

### OI-008 Lambda Aliases — Verification (from previous session):
```
# To re-verify:
aws lambda list-aliases --function-name opusaimobility-push-notification --region us-east-1
```
Expected: `live` alias at version 1 or later.
