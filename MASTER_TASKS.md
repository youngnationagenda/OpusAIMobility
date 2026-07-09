# OpusAIMobility — Master Task Tracker
## Consolidated from: claude_tasks.md (v1.0, 2025-07-13) · claude_task.md (v2.0, 2026-07-06) · kiro_tasks.md · Kiro_taskupdate.md · Sonie_taskupdate.md · AWS_BLOCKERS_STATUS.md (live audit)

> **Last updated:** 2026-07-09
> **Status key:** ✅ Done · ⚠️ Partial · ❌ Not done · 🔴 CONFLICT

---

## CONFLICTS FOUND (read before starting anything)

| # | Conflict | Source A | Source B | Resolution |
|---|---|---|---|---|
| CF-1 | Cognito pool IDs | `claude_tasks.md` says merge `HA6twtr4a` + `3lWqQNDwm` into new pool | Live state: unified pool `LKa4ElQem` already created | ✅ **Resolved + cleaned up.** Old pools deleted (0 users each). Only `us-east-1_LKa4ElQem` remains. |
| CF-2 | Android package name | `claude_tasks.md` uses `com.opusaimobility.customer` | `kiro_tasks.md` uses `com.omniride.customer` | ✅ **Resolved.** `com.opusaimobility.customer` canonical in `build.gradle`. |
| CF-3 | PHP backend fate | Containerize on ECS Fargate | Deprecate PHP, replace with Lambda | ✅ **Resolved.** PHP is `DEPRECATED.md`. Lambda is live. |
| CF-4 | Push notifications | SNS_PLATFORM_APP_ARN blocker | `aimobility-push` has `PENDING_FCM_KEY` | ✅ **Fully resolved 2026-07-08.** FCM HTTP v1 deployed. `omniride-api` + `push-notification` Lambdas both redeployed. `aimobility-push` retired. |
| CF-5 | WAF status | WAF exists but not attached | Protecting nothing | ✅ **Resolved 2026-07-08.** CloudFront `d22up4o3zhu9gf.cloudfront.net` + WAF `opusaimobility-api-waf` live. |
| CF-6 | Payment Lambda IAM | Secrets Manager access needed | May be missing IAM policy | ✅ **Resolved 2026-07-08.** `SecretsManagerAccess` policy added to `terraaimobility-lambda-role` covering `terraai/*` + `opusaimobility/*`. |
| CF-7 | `terraai-reporting` env vars | Zero env vars — DynamoDB calls will fail | Newly discovered | ✅ **Resolved 2026-07-08.** `TABLE_TRANSACTIONS`, `TABLE_TRIPS`, `TABLE_ORDERS`, `TABLE_USERS`, `REGION` all set. |
| CF-8 | Celo network | Alfajores RPC dead — `alfajores-forno.celo-testnet.org` ENOTFOUND | `forno.celo.org/sepolia` returns Mainnet chainId 42220 | ✅ **Resolved 2026-07-09.** Celo Sepolia confirmed: RPC `forno.celo-sepolia.celo-testnet.org`, chainId `11142220`. All files + Lambda updated. |

---

## PART 1 — INFRASTRUCTURE (AWS) — COMPLETED ✅

All the following are live and verified via AWS CLI:

| Item | Status | Evidence |
|---|---|---|
| Unified Cognito pool `us-east-1_LKa4ElQem` | ✅ | UserMigration trigger attached |
| Old Cognito pools `HA6twtr4a` + `3lWqQNDwm` deleted | ✅ | 0 users confirmed before delete |
| All 16 Lambdas on nodejs20.x+ | ✅ | `fix-remaining.sh` confirmed |
| All 12 omniride-* DynamoDB tables PITR enabled | ✅ | `fix-remaining.sh` confirmed |
| `email-index` on `omniride-users` | ✅ | ACTIVE |
| `userId-index` on `omniride-transactions` | ✅ | ACTIVE |
| ECS cluster `opusaimobility` (Fargate+Spot) | ✅ | Container Insights ON |
| ECR repo `opusaimobility/terra-api` | ✅ | scan-on-push enabled |
| `opusaimobility-push-notification` Lambda — FCM HTTP v1 + IoT + WebSocket | ✅ | Smoke: `iotDelivered:true` |
| `opusaimobility-user-migration` Lambda + Cognito trigger | ✅ | RDS wired, clean schema |
| `ANY /terra/{proxy+}` route on API GW `0wv2nyk3je` | ✅ | Auto-deployed |
| `ANY /blockchain/{proxy+}` route on API GW `0wv2nyk3je` | ✅ | → `terraai-blockchain` Lambda |
| `ANY /carbon/{proxy+}` route on API GW `0wv2nyk3je` | ✅ | → `terraai-blockchain` Lambda |
| Pinpoint app `20d7e36cc4094a04b63b7fd1e5596fcf` | ✅ | |
| RDS MySQL 8.0 `opusaimobility-db` | ✅ | 13 tables, private subnets |
| Secrets Manager — 13 secrets | ✅ | incl. `firebase-service-account`, `celo-contract`, `celo-deployer` |
| `opusaimobility-push-endpoints` DynamoDB table | ✅ | ACTIVE |
| GitHub branch protection `pr-check` on main | ✅ | 1 review required |
| CloudFront `d22up4o3zhu9gf.cloudfront.net` + WAF | ✅ | 4 WAF rules active |
| GuardDuty enabled | ✅ | DetectorId: `aacfa0f1ae70dd778fa4cc0daee9e003` |
| VPC Flow Logs | ✅ | FlowLogId: `fl-0b5c683f7fbc7c85c` |
| X-Ray Active — `omniride-api` + `push-notification` | ✅ | |
| `terraai-reporting` env vars set | ✅ | TABLE_TRANSACTIONS/TRIPS/ORDERS/USERS |
| `terraaimobility-lambda-role` — SecretsManager IAM policy | ✅ | Covers `terraai/*` + `opusaimobility/*` |
| `omniride-api` Lambda — push routes to `opusaimobility-notifications` SNS | ✅ | alias `live` → v5 |
| **`terraai-blockchain`** Lambda — Celo Sepolia + VCS Carbon Registry | ✅ | alias `live` → v1 · 2026-07-09 |
| **`opusaimobility-celo-deploy`** Lambda — Sepolia deployer | ✅ | alias `live` → v1 · 2026-07-09 |
| **TerraCarbon contract on Celo Sepolia** | ✅ | `0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701` · block 30326620 |
| **MINTER_ROLE + ORACLE_ROLE** on TerraCarbon | ✅ | Granted to `0x57651B018Fa4aC931Ec585da641078988Ef1213B` |
| **IoT thing** `opusaimobility-rider-test-terra031` | ✅ | Cert provisioned · secret stored |
| CloudWatch monitoring stack `opusaimobility-monitoring` | ✅ | 7 alarms + dashboard · CREATE_COMPLETE |
| Lambda `live` aliases — all 8 functions pinned | ✅ | mpesa v1, stripe v1, airtel v1, push v1, migration v1, api v5, blockchain v1, celo-deploy v1 |

---

## PART 2 — CODEBASE — COMPLETED ✅

| Item | Status |
|---|---|
| TerraAI Android source copied to `omniride/apps/customer/` (226 Java files) | ✅ |
| Package renamed `com.opusaimobility.customer` | ✅ |
| API URLs updated to `0wv2nyk3je` unified Lambda | ✅ |
| Cognito pool updated to `us-east-1_LKa4ElQem` | ✅ |
| Static API key `terraai-mobility-key-2024` removed from all 5 Android files | ✅ |
| Lambda PHP-replacement routes: presign-upload, presign-download, /devices/token, /health | ✅ |
| S3Client + getSignedUrl added to Lambda | ✅ |
| `apps/terra-api/DEPRECATED.md` created | ✅ |
| Sprint 4: pr-check.yml, structured logging, CloudWatch alarms JSON, GuardDuty, VPC SGs, Secrets rotation config, RDS network config, rollback function in snapshot.ts | ✅ |
| Push Lambda WebSocket bridge added (`sendViaWebSocket`) | ✅ |
| User migration Lambda simplified to match clean schema | ✅ |
| `ai-fleet-analysis` hardcoded Gemini key → Secrets Manager | ✅ (Kiro) |
| `pushNotification()` in `index.js` → SNS `opusaimobility-notifications` | ✅ (Sonie 2026-07-08) |
| `push-notification/index.mjs` — FCM HTTP v1 + IoT + WebSocket triple delivery | ✅ (Sonie 2026-07-08) |
| `Constants.java` BASE_URL → `https://d22up4o3zhu9gf.cloudfront.net/` | ✅ (Sonie 2026-07-08) |
| `google-services.json` — real Firebase project data (opusaimobility) | ✅ (Sonie 2026-07-08) |
| `file-retrieval.ts` clock drift bug fixed (expiry 3600→3599s) | ✅ (Sonie 2026-07-08) |
| TERRA-040: `wsService.ts` + `MapView.tsx` — live driver location via WebSocket | ✅ (Sonie 2026-07-08) |
| TERRA-041: `LocationWebSocketService.java` — Android GPS → WebSocket every 3s | ✅ (Sonie 2026-07-08) |
| **Final checkpoint 17 — 29/29 files · 224/224 tests · ALL GREEN** | ✅ (Sonie 2026-07-08) |
| CI path filter test (Properties 18 & 19, 100+ fast-check iterations) | ✅ (Sonie 2026-07-08) |
| deploy.yml — validate-secrets, push Lambda job, smoke tests, secrets docs | ✅ (Claude 2026-07-08) |
| pr-check.yml — full path-based filtering, android-build-check, infra-check | ✅ (Claude 2026-07-08) |
| **Celo network migration** — all files updated from Alfajores → Celo Sepolia | ✅ (Sonie 2026-07-09) |
| **`contracts/hardhat.config.js`** — chainId `11142220`, RPC `forno.celo-sepolia.celo-testnet.org` | ✅ (Sonie 2026-07-09) |
| **`contracts/CarbonToken.sol`** — network header updated to Celo Sepolia | ✅ (Sonie 2026-07-09) |
| **`contracts/scripts/deploy.js`** — full Sepolia config + ecosystem addresses | ✅ (Sonie 2026-07-09) |
| **`aws/lambda/celo-deploy/index.mjs`** — Sepolia RPCs, chainId 11142220, staticNetwork fix | ✅ (Sonie 2026-07-09) |
| **`aws/lambda/celo-deploy/faucet.mjs`** — Sepolia faucet endpoints only | ✅ (Sonie 2026-07-09) |
| **`aws/lambda/blockchain/index.js`** — v3.0: real Celo Sepolia + VCS Oracle (TERRA-031) | ✅ (Sonie 2026-07-09) |

---

## PART 3 — ALL OPEN ITEMS RESOLVED ✅

### 🔴 P0 — All Resolved

| Item | Status |
|---|---|
| **OI-001** Attach WAF to API Gateway *(CF-5)* | ✅ RESOLVED 2026-07-08 — CloudFront + WAF 4 rules live |
| **OI-002** Fix `terraai-reporting` Lambda env vars *(CF-7)* | ✅ RESOLVED 2026-07-08 |
| **OI-003** FCM Push + `omniride-api` deploy *(CF-4)* | ✅ RESOLVED 2026-07-08 |
| **OI-004** Payment Lambda IAM for Secrets Manager *(CF-6)* | ✅ RESOLVED 2026-07-08 |
| **OI-005** Redeploy user-migration Lambda | ✅ DONE 2026-07-08 |

### 🟡 P1 — All Resolved

| Item | Status |
|---|---|
| **OI-006** Decommission legacy Cognito pools | ✅ DONE 2026-07-08 — both old pools deleted |
| **OI-008** Lambda `live` aliases for all specialist functions | ✅ DONE 2026-07-09 — all 8 Lambdas pinned |
| **OI-009** CloudWatch alarms stack deployed | ✅ DONE 2026-07-08 — `CREATE_COMPLETE`, 7 alarms active |

### 🟡 P1 — Needs Human Action

**OI-007: Activate real payment credentials in Secrets Manager** ⏳ HUMAN ACTION REQUIRED
- M-Pesa: update `terraai/mpesa` — real Daraja ConsumerKey, ConsumerSecret, PassKey, ShortCode
- Stripe: update `terraai/stripe` — real `sk_live_...` key
- Airtel: update `terraai/airtel` — real Airtel Money credentials
- Secrets exist and rotation is configured — just substitute real values

---

### 🟢 P2 — Feature Completeness — ALL DONE ✅

| Ticket | Description | Status |
|---|---|---|
| ~~TERRA-010~~ | IoT Device Certificate Provisioning per rider | ✅ **DONE 2026-07-09** |
| ~~TERRA-011~~ | Wire live IoT WebSocket in EnergyPortal + RiderDashboard | ✅ DONE 2026-07-08 |
| TERRA-020 | M-Pesa Daraja real STK Push | ✅ Code live — needs real creds (OI-007) |
| TERRA-021 | Stripe real PaymentIntent | ✅ Code live — needs real creds (OI-007) |
| TERRA-022 | Airtel Money + T-Kash | ✅ Code live — needs real creds (OI-007) |
| ~~TERRA-030~~ | Deploy CarbonToken.sol to Celo Sepolia | ✅ **DONE 2026-07-09** |
| ~~TERRA-031~~ | Carbon Registry VCS API integration | ✅ **DONE 2026-07-09** |
| ~~TERRA-040~~ | WebSocket driver location broadcasting (MapView.tsx) | ✅ DONE 2026-07-08 |
| ~~TERRA-041~~ | Android: send location updates via WebSocket during ride | ✅ DONE 2026-07-08 |
| ~~TERRA-050~~ | EventBridge cron DeFi loan deduction — property tests | ✅ DONE 2026-07-08 |
| ~~TERRA-060~~ | Admin financial reporting — real DynamoDB data | ✅ DONE 2026-07-08 |
| ~~TERRA-061~~ | Admin user management — search, filter, bulk actions | ✅ DONE 2026-07-08 |
| ~~TERRA-070~~ | Replace localStorage mock with DynamoDB sync | ✅ DONE 2026-07-08 |
| ~~TERRA-071~~ | PWA service worker — offline mode + Web Push | ✅ DONE 2026-07-08 |
| ~~TERRA-072~~ | i18n — Swahili + Arabic support | ✅ DONE 2026-07-08 |
| ~~TERRA-080~~ | ErrandPortal wired to DynamoDB + omniApi | ✅ DONE 2026-07-08 |
| ~~TERRA-081~~ | Android: telemetry screen with MPAndroidChart | ✅ DONE 2026-07-08 |

---

### 🔵 P3 — Play Store / App Store Launch Prep

| Task | Status |
|---|---|
| `google-services.json` real Firebase data | ✅ DONE (Sonie 2026-07-08) |
| Android release signing job in CI | ✅ DONE — `deploy-customer-release` job in deploy.yml |
| `SUPPORT_EMAIL` + `PHONE_NO` in Constants.java | ✅ DONE — `support@opusaimobility.com` / `+254700000001` |
| SSL certificate for `opusaimobility.yna.co.ke` | ⏳ Run: `aws acm request-certificate --domain-name opusaimobility.yna.co.ke --validation-method DNS --region us-east-1` then add DNS CNAME |
| CloudFront custom domain | ⏳ After ACM cert — associate with distribution `E18GJ5VKHBIJAI` |
| Android release signing secrets | ⏳ Add 4 GitHub Secrets: `KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` then `git tag v1.0.0 && git push origin v1.0.0` |
| Play Store listing | ⏳ Screenshots · privacy policy URL · icon |

---

## CURRENT STATUS — 2026-07-09

**ALL P0 + P1 + P2 items DONE. All 8 conflicts RESOLVED. All 17 sprint tickets CLOSED.**
**29/29 test files · 224/224 tests · ALL GREEN.**

### ✅ COMPLETED 2026-07-09 (Sonie)

| Item | Details |
|---|---|
| **Celo network migration** | All files migrated from Alfajores (sunset) → Celo Sepolia (chainId 11142220, RPC `forno.celo-sepolia.celo-testnet.org`) |
| **TERRA-030: TerraCarbon deployed** | Contract `0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701` · block 30326620 · 0.127 CELO gas · deployer `0x57651B018...` |
| **TERRA-030: MINTER_ROLE + ORACLE_ROLE** | Confirmed on-chain for deployer wallet |
| **TERRA-030: Bytecode** | `opusaimobility/celo-bytecode` secret updated (22754 chars) |
| **TERRA-030: AWS wired** | `terraai/celo-contract` secret + `omniride-api` Lambda env (`CELO_CONTRACT_ADDRESS`, `CELO_CHAIN_ID`, `CELO_RPC_URL`, all token addrs) |
| **TERRA-031: VCS Carbon Registry** | `terraai-blockchain` Lambda v3.0 — real Celo Sepolia calls + Verra VCS API + Oracle rate updater |
| **TERRA-031: API routes live** | `ANY /blockchain/{proxy+}` + `ANY /carbon/{proxy+}` on API GW `0wv2nyk3je` (integration `ptp8z98`) |
| **TERRA-031: Smoke tests** | `/carbon/rate` ✅ · `/blockchain/ledger` ✅ · `/carbon/validate` ✅ |
| **TERRA-010: IoT provisioning** | `aws/scripts/provision-iot-device.js` tested — `opusaimobility-rider-test-terra031` provisioned, cert stored in `opusaimobility/iot-cert/test-terra031` |
| **Lambda `live` aliases** | All 8 Lambdas pinned: `omniride-api` v5, `terraai-blockchain` v1, `opusaimobility-celo-deploy` v1, plus all pre-existing |
| **`opusaimobility/celo-deployer`** secret | Updated with correct wallet `0x57651B018...` + private key |

### 🔴 REMAINING — Needs human action only

```
1. OI-007  Real M-Pesa / Stripe / Airtel credentials into Secrets Manager
           (secrets exist + rotation configured — just substitute real values)

2. ACM cert for opusaimobility.yna.co.ke:
   aws acm request-certificate --domain-name opusaimobility.yna.co.ke \
     --validation-method DNS --region us-east-1
   → add DNS CNAME from ACM to your domain registrar

3. CloudFront custom domain — associate ACM cert with distribution E18GJ5VKHBIJAI
   (after cert issued + DNS validated)

4. Android release signing — set 4 GitHub Secrets:
   KEYSTORE_FILE  (base64 .jks — content of keystore.b64)
   KEYSTORE_PASSWORD  OpusAI2026@Keystore!
   KEY_ALIAS          opusaimobility
   KEY_PASSWORD       OpusAI2026@Key!
   Then: git tag v1.0.0 && git push origin v1.0.0

5. Play Store listing:
   - Screenshots from the app
   - Privacy policy at opusaimobility.yna.co.ke/privacy
   - Support: support@opusaimobility.com ✅
```

---

## QUICK REFERENCE — KEY AWS RESOURCES

| Resource | Value |
|---|---|
| Client-facing API (WAF protected) | `https://d22up4o3zhu9gf.cloudfront.net` ← use this in apps |
| Primary API (internal only) | `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod` |
| CloudFront Distribution | `E18GJ5VKHBIJAI` |
| WebSocket | `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` |
| Cognito Pool | `us-east-1_LKa4ElQem` (terraaimobility-production) |
| Android Client ID | `2am01r4fmsp0s08991ftgub887` |
| Web Client ID | `3a207uin5o3p4k1ngk334crntl` |
| RDS Endpoint | `opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com:3306/terraai` |
| IoT Core | `arqymixni12gc-ats.iot.us-east-1.amazonaws.com` |
| Pinpoint App | `20d7e36cc4094a04b63b7fd1e5596fcf` |
| SNS Notifications | `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |
| ECS Cluster | `opusaimobility` |
| ECR | `683541453923.dkr.ecr.us-east-1.amazonaws.com/opusaimobility/terra-api` |
| Frontend CDN | `https://d2rofh106fep8b.cloudfront.net` |
| AWS Account | `683541453923` · Region: `us-east-1` |
| **TerraCarbon Contract** | `0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701` · Celo Sepolia chainId `11142220` |
| **Celo RPC** | `https://forno.celo-sepolia.celo-testnet.org` · fallback: `https://celo-sepolia.drpc.org` |
| **Celo Explorer** | `https://sepolia.celoscan.io/address/0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701` |
| **Celo Deployer Wallet** | `0x57651B018Fa4aC931Ec585da641078988Ef1213B` · 1,129 CELO balance |
| **Celo Faucet** | `https://faucet.celo.org/sepolia` |
| CloudWatch Dashboard | `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=OpusAIMobility-Dashboard` |
