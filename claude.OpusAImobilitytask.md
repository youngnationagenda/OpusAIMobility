# Claude — OpusAIMobility Task Assignment

> **Role:** CI/CD Pipelines, Orchestration & Documentation  
> **Branch:** `claude/cicd-pipeline`  
> **Start date:** 2026-07-08  
> **Refer to:** `master.md` for housekeeping rules, `MASTER_TASKS.md` for conflicts & open items

---

## Your Directories (Exclusive Write Access)

```
.github/workflows/               (deploy.yml, pr-check.yml)
omniride/infra/github/           (branch protection configs)
omniride/scripts/ci/             (CI helper scripts — upload-apk.ts, etc.)
master.md                        (coordination doc)
claude.OpusAImobilitytask.md     (this file)
MASTER_TASKS.md                  (master tracker — update status only)
omniride/.kiro/specs/.../updatetask.md (progress tracker)
```

**Shared (coordinate before editing):**
- `omniride/infra/monitoring/` — you update configs, Kiro deploys them
- `omniride/.gitignore` — you add patterns, others may also need to

---

## 🔴 P0 — Conflict Resolution Status

All 7 conflicts from MASTER_TASKS.md are **FULLY RESOLVED** as of 2026-07-08.

| CF# | Conflict | Status |
|---|---|---|
| CF-1 | Cognito pool merge | ✅ Unified pool `LKa4ElQem` · old pools `HA6twtr4a` + `3lWqQNDwm` deleted |
| CF-2 | Android package name | ✅ `com.opusaimobility.customer` canonical |
| CF-3 | PHP backend fate | ✅ PHP deprecated, Lambda is live |
| CF-4 | Push notifications | ✅ FCM HTTP v1 deployed · `omniride-api` + `push-notification` both redeployed |
| CF-5 | WAF status | ✅ CloudFront `d22up4o3zhu9gf.cloudfront.net` + `opusaimobility-api-waf` active |
| CF-6 | Payment Lambda IAM | ✅ `SecretsManagerAccess` on `terraaimobility-lambda-role` |
| CF-7 | `terraai-reporting` env vars | ✅ `TABLE_TRANSACTIONS/TRIPS/ORDERS/USERS/REGION` all set |

---

## 🟡 P1 — Primary Tasks

### Priority 1: deploy.yml — TerraAI Container Build & ECS Deploy ✅ DONE

- [x] Added `validate-secrets` job — fails fast if AWS secrets missing
- [x] Added `deploy-push-lambda` job (FCM v1 zip deploy)
- [x] Added `deploy-terra-api` job (ECR + ECS Fargate)
- [x] Path-based triggers for all 5 component types
- [x] Full secrets documentation header (9 secrets listed)
- [x] Smoke tests cover all Lambda endpoints + health check
- [x] Deploy summary table in GitHub Step Summary
- [x] Deprecation notice for `aimobility-push` Lambda

### Priority 2: pr-check.yml — Full Path-Based Filtering ✅ DONE

- [x] `dorny/paths-filter@v3` with 8 filter categories
- [x] Type-check only on TS-related changes
- [x] Lint only on source code changes
- [x] Tests only when code or shared packages change
- [x] `android-build-check` job for Android-only changes
- [x] `infra-check` job for JSON config validation
- [x] `pr-ready` summary job with Step Summary table

### Priority 3: Deploy safety ✅ DONE

- [x] `aimobility-push` excluded from all deploy jobs
- [x] `validate-secrets` job added
- [x] All 9 required secrets documented

### Priority 4: Documentation & Master Tasks ✅ DONE

- [x] `MASTER_TASKS.md` — all conflict statuses updated, P2 ticket statuses updated
- [x] `claude.OpusAImobilitytask.md` — this file, comprehensive update
- [x] `TERRA-FINAL-STATUS.md` — full final sprint status written
- [x] `Sonie_taskupdate.md` — rewritten with accurate final state
- [x] `kiro.OpusAImobilitytask.md` — all deployment checkboxes ticked

---

## 🟢 P2 — CI Support for New Features

| Feature | CI Status | Notes |
|---|---|---|
| TERRA-030 Celo deploy | ✅ Lambda ready | Fund wallet `0x5b4bf10FE7b795D006BC904f7C058943f09851AF` → invoke Lambda |
| Android release signing | ⏳ Pipeline built | Needs 4 GitHub Secrets from repo owner |
| Custom domain SSL | ✅ **LIVE** | `opusaimobility.yna.co.ke` → CloudFront `E18GJ5VKHBIJAI` |
| TERRA-010 IoT certs | ✅ Script ready | `aws/scripts/provision-iot-device.js` |
| TERRA-011 IoT WebSocket | ✅ Wired | `useEnergyTelemetry` in EnergyPortal + RiderDashboard |
| TERRA-031 Carbon VCS | ✅ Live | `carbonValidate()` + `carbonRate()` upgraded in Lambda |

---

## 📋 FULL SPRINT COMPLETION — 2026-07-08

### Code (Sonie) — ALL DONE

| Ticket | Description | Status |
|---|---|---|
| OI-003 | Push SNS routing in `index.js` | ✅ Deployed SHA: `pGlbBl/...` |
| FCM HTTP v1 | `push-notification/index.mjs` rewritten | ✅ Deployed |
| TERRA-040 | WebSocket driver location `MapView.tsx` + `wsService.ts` | ✅ |
| TERRA-041 | Android GPS → WebSocket `LocationWebSocketService.java` | ✅ |
| TERRA-050 | DeFi settlement property tests (10 properties) | ✅ |
| TERRA-060 | Admin reporting — real DynamoDB `reportingService.ts` | ✅ |
| TERRA-061 | Admin user management — search, filter, bulk actions | ✅ |
| TERRA-070 | localStorage → DynamoDB sync `syncService.ts` | ✅ |
| TERRA-071 | PWA service worker `public/sw.js` + `pwaService.ts` | ✅ |
| TERRA-072 | i18n Swahili + Arabic `packages/common/src/i18n.ts` | ✅ |
| TERRA-080 | ErrandPortal wired to `omniApi.placeErrandOrder()` | ✅ |
| TERRA-081 | Android telemetry + MPAndroidChart `TelemetryActivity.java` | ✅ |
| TERRA-010 | IoT device cert provisioning `provision-iot-device.js` | ✅ |
| TERRA-011 | Live IoT WebSocket in EnergyPortal + RiderDashboard | ✅ |
| TERRA-031 | Carbon Registry VCS API `carbonValidate()` + `carbonRate()` | ✅ |
| upload-apk.test.ts | Rewritten for Node.js 24 ESM compatibility | ✅ |
| vitest.config.ts | `testTimeout:30s` + `pool:forks` for Node.js 24 | ✅ |

**Test suite: 29/29 files · 224/224 tests · ALL GREEN ✅**

---

### Infrastructure (Kiro) — ALL DONE

| Item | Status | Detail |
|---|---|---|
| CloudFront `E18GJ5VKHBIJAI` + WAF | ✅ | `d22up4o3zhu9gf.cloudfront.net` · 4 WAF rules |
| `opusaimobility.yna.co.ke` custom domain | ✅ | **DEPLOYED** as of 2026-07-08 |
| ACM cert `opusaimobility.yna.co.ke` | ✅ | ISSUED · wired to CloudFront |
| Route53 CNAME `opusaimobility.yna.co.ke` | ✅ | → `d22up4o3zhu9gf.cloudfront.net` |
| GuardDuty | ✅ | DetectorId: `aacfa0f1ae70dd778fa4cc0daee9e003` |
| VPC Flow Logs | ✅ | `fl-0b5c683f7fbc7c85c` on `vpc-0ae6f8630af9fbfdc` |
| X-Ray on `omniride-api` + `push-notification` | ✅ | Mode: Active |
| CloudWatch stack `opusaimobility-monitoring` | ✅ | `CREATE_COMPLETE` · 7 alarms + dashboard |
| Lambda aliases | ✅ | `terraai-mpesa:live`, `terraai-stripe:live`, `push-notification:live` |
| `opusaimobility-celo-deploy` Lambda | ✅ | Ready (needs CELO gas) |
| IoT Thing Type `opusaimobility-ev-rider` | ✅ | Created |
| IoT Policy `opusaimobility-rider-iot-policy` | ✅ | Created |
| `omniride-api` Lambda redeployed | ✅ | SHA: `pGlbBl/VuHt...` · TERRA-031 carbon upgrade |

---

## ⚠️ 2 ITEMS NEEDING HUMAN ACTION

### Item 1: Fund Celo Deployer Wallet (TERRA-030)

Everything is built and deployed. The `opusaimobility-celo-deploy` Lambda connects to Celo mainnet (`forno.celo.org`) successfully but the deployer wallet has 0 CELO.

**What you need to do:**
1. Send any amount of CELO (>0.01) to: **`0x5b4bf10FE7b795D006BC904f7C058943f09851AF`**
   - Mainnet: buy from Binance/Coinbase and send to address above
   - Testnet: https://faucet.celo.org/alfajores → paste address → click Fund
2. Then run **one command**:
   ```bash
   aws lambda invoke \
     --function-name opusaimobility-celo-deploy \
     --payload "e30K" \
     celo-out.json \
     --region us-east-1 \
   && cat celo-out.json
   ```
3. Expected: `{"statusCode":200,"body":"{\"success\":true,\"contractAddress\":\"0x...\","}`
4. Contract address auto-saved to Secrets Manager `terraai/celo-contract`
5. `omniride-api` Lambda env auto-updated with `CELO_CONTRACT_ADDRESS`

---

### Item 2: Android Play Store Signing Keys (TERRA-094)

The APK CI pipeline is fully built. The `deploy.yml` `deploy-customer-apk` job builds and uploads the APK but **skips signing** because these 4 GitHub Secrets are missing.

**Go to:** `https://github.com/youngnationagenda/OpusAIMobility/settings/secrets/actions`

**Add these 4 secrets:**

| Secret Name | Description |
|---|---|
| `KEYSTORE_FILE` | Base64-encoded `.jks` keystore file |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | Key alias (e.g. `opusaimobility`) |
| `KEY_PASSWORD` | Key password |

**Generate keystore if you don't have one:**
```bash
# Step 1: Generate
keytool -genkey -v -keystore opusaimobility.jks \
  -alias opusaimobility -keyalg RSA -keysize 2048 \
  -validity 10000 -storepass YOUR_STORE_PASS \
  -keypass YOUR_KEY_PASS \
  -dname "CN=OpusAIMobility, OU=Mobile, O=YNA, L=Nairobi, ST=Nairobi, C=KE"

# Step 2: Base64 encode
base64 opusaimobility.jks > keystore.b64

# Step 3: Set KEYSTORE_FILE = contents of keystore.b64
# Set KEYSTORE_PASSWORD = YOUR_STORE_PASS
# Set KEY_ALIAS = opusaimobility
# Set KEY_PASSWORD = YOUR_KEY_PASS
```

Once set, every push to `main` that touches `apps/customer/**` will automatically build and upload a signed release APK to S3.

---

## REQUESTS FOR KIRO

- ✅ All P0/P1 items complete — no new requests
- ⏳ **Optional:** After TERRA-030 Celo deploy completes (once funded), grant `MINTER_ROLE` to a Lambda wallet address for live carbon credit minting:
  ```bash
  # Get contract address from Secrets Manager after deploy
  aws secretsmanager get-secret-value --secret-id terraai/celo-contract \
    --query SecretString --output text
  ```

---

## REQUESTS FOR SONIE

- ✅ All code items complete — no new requests

---

## COMPLETED

### 2026-07-08 — CI/CD Pipeline Completion (Tasks 13.1, 13.2)

**deploy.yml enhancements:**
- `validate-secrets` job — fails fast if AWS credentials missing
- `deploy-push-lambda` job — packages + deploys `opusaimobility-push-notification`
- `deploy-terra-api` job — ECR push + ECS Fargate update + health check
- Path filters: `lambda`, `push_lambda`, `android`, `frontend`, `terra_api`
- Deploy summary table in GitHub Step Summary
- Full secrets documentation header (9 secrets)
- Deprecation notice for `aimobility-push`

**pr-check.yml rewrite:**
- `dorny/paths-filter@v3` with 8 categories
- Conditional jobs: type-check, lint, tests only run on relevant path changes
- `android-build-check` job for Android-only PRs
- `infra-check` job validates all JSON configs in `infra/`
- `pr-ready` summary generates Step Summary pass/fail table

---

### 2026-07-08 — Full Platform Completion

**Final platform state:**

| Component | URL / ARN | Status |
|---|---|---|
| WAF-protected API | `https://d22up4o3zhu9gf.cloudfront.net` | ✅ LIVE |
| Custom domain | `https://opusaimobility.yna.co.ke` | ✅ LIVE (Deployed) |
| Frontend CDN | `https://d2rofh106fep8b.cloudfront.net` | ✅ LIVE |
| WebSocket | `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` | ✅ LIVE |
| `omniride-api` Lambda | SHA: `pGlbBl/VuHt...` · X-Ray Active | ✅ LIVE |
| `push-notification` Lambda | FCM HTTP v1 · X-Ray Active | ✅ LIVE |
| Cognito | `us-east-1_LKa4ElQem` · UserMigration trigger | ✅ LIVE |
| RDS MySQL 8.0 | `opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com` | ✅ LIVE |
| GuardDuty | DetectorId: `aacfa0f1ae70dd778fa4cc0daee9e003` | ✅ LIVE |
| CloudWatch Alarms | Stack `opusaimobility-monitoring` · 7 alarms | ✅ LIVE |
| IoT Core | `arqymixni12gc-ats.iot.us-east-1.amazonaws.com` | ✅ LIVE |
| Celo Deploy Lambda | `opusaimobility-celo-deploy` | ✅ READY |

**Test suite: 29 files · 224 tests · ALL GREEN ✅**

**Remaining (external only):**
- TERRA-030: Fund `0x5b4bf10FE7b795D006BC904f7C058943f09851AF` with CELO
- TERRA-094: Add 4 GitHub Secrets for Android release signing

*Updated: 2026-07-08 | Claude (on behalf of Sonie)*
