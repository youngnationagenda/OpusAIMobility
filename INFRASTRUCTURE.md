# OpusAIMobility — Infrastructure Source of Truth

> **Last updated:** 2026-07-12
> **AWS Account:** 683541453923
> **Region:** us-east-1
> **IAM User:** dev

---

## Domains

| URL | Purpose |
|---|---|
| `https://opusaimobility.yna.co.ke` | Production API + Frontend (unified CloudFront `E18GJ5VKHBIJAI`) |
| `https://app.opusaimobility.yna.co.ke` | Frontend PWA alias (CloudFront `E1TIJJKJ2UEIO7`) |
| `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` | WebSocket (real-time driver location) |

---

## CloudFront

### Primary Distribution — `E18GJ5VKHBIJAI` ✅ CANONICAL

| Property | Value |
|---|---|
| **Distribution ID** | `E18GJ5VKHBIJAI` |
| **Domain** | `d22up4o3zhu9gf.cloudfront.net` |
| **Custom Domain** | `opusaimobility.yna.co.ke` |
| **ACM Certificate** | `arn:aws:acm:us-east-1:683541453923:certificate/704d96b8-1017-485c-ba24-476370d42a63` (`*.opusaimobility.yna.co.ke`, valid until 2027-01-22) |
| **WAF** | `opusaimobility-api-waf` ARN: `arn:aws:wafv2:us-east-1:683541453923:global/webacl/opusaimobility-api-waf/6d59000b-568f-448f-9256-1dce840dbcbe` |
| **OAC** | `EE2VHTRNK5QP0` (sigv4, always) |
| **Default Root** | `index.html` |
| **SPA Error Pages** | 403→index.html (200), 404→index.html (200) |
| **Status** | Deployed |

#### Origins on `E18GJ5VKHBIJAI`

| Origin ID | Domain | Purpose |
|---|---|---|
| `opusaimobility-s3-frontend` | `opusaimobility-assets-prod.s3.us-east-1.amazonaws.com` | Frontend static files (default) |
| `api-gateway-origin` | `0wv2nyk3je.execute-api.us-east-1.amazonaws.com` | API Gateway (path-routed) |

#### API Path Patterns (routed to API Gateway on `E18GJ5VKHBIJAI`)

`/auth/*`, `/users/*`, `/rides/*`, `/orders/*`, `/payments/*`, `/ai/*`, `/notifications/*`, `/platform/*`, `/errands/*`

### Secondary Distribution — `E1TIJJKJ2UEIO7`

| Property | Value |
|---|---|
| **Distribution ID** | `E1TIJJKJ2UEIO7` |
| **Domain** | `d2rofh106fep8b.cloudfront.net` |
| **Custom Domains** | `app.opusaimobility.yna.co.ke`, `omniride.yna.co.ke` |
| **Origin** | `opusaimobility-assets-prod.s3.us-east-1.amazonaws.com` |
| **ACM Certificate** | `arn:aws:acm:us-east-1:683541453923:certificate/704d96b8-1017-485c-ba24-476370d42a63` |
| **Status** | Deployed |

> ⚠️ **`CLOUDFRONT_DISTRIBUTION_ID` in all configs = `E18GJ5VKHBIJAI`** — the primary distribution is the canonical one used for cache invalidation after frontend deploys. `E1TIJJKJ2UEIO7` is the legacy/secondary distribution.

---

## S3 Buckets

| Bucket | Purpose |
|---|---|
| `opusaimobility-assets-prod` | Frontend static files (private, CloudFront OAC only) — serves both `E18GJ5VKHBIJAI` and `E1TIJJKJ2UEIO7` |
| `opusaimobility-apk-distribution` | Android APK distribution (`apks/debug/`, `apks/release/`) |
| `opusaimobility-codebuild-artifacts-683541453923` | CodeBuild build artifacts + S3 cache |

---

## Lambda Functions

| Function Name | Runtime | State | Purpose |
|---|---|---|---|
| `terraaimobility-api` | **nodejs22.x** | Active | Main backend API (v3.1) |
| `opusaimobility-push-notification` | nodejs20.x | Active | Push notification delivery (FCM HTTP v1 + IoT + WebSocket) |
| `terraai-blockchain` | nodejs20.x | Active | Celo Sepolia blockchain + VCS Carbon Registry |
| `opusaimobility-celo-deploy` | nodejs20.x | Active | Smart contract deployer (Celo Sepolia) |
| `terraai-mpesa` | nodejs20.x | Active | M-Pesa Daraja STK Push |
| `terraai-stripe` | nodejs20.x | Active | Stripe PaymentIntents |
| `terraai-airtel` | nodejs20.x | Active | Airtel Money / T-Kash |
| `terraai-reporting` | nodejs20.x | Active | Admin financial reporting |
| `terraai-defi-settlement` | nodejs20.x | Active | DeFi loan deduction (EventBridge cron) |
| `opusaimobility-user-migration` | nodejs20.x | Active | Cognito user migration trigger |
| `terraai-telemetry-ingest` | nodejs20.x | Active | IoT telemetry ingest |
| `terraai-secrets-rotation` | nodejs20.x | Active | Secrets Manager rotation |

### Lambda Aliases (production pins)

| Function | Alias | Version |
|---|---|---|
| `terraaimobility-api` | `LIVE` | v10 |
| `opusaimobility-push-notification` | `live` | v2 |
| `terraai-blockchain` | `live` | v1 |
| `opusaimobility-celo-deploy` | `live` | v1 |
| `terraai-mpesa` | `live` | v1 |
| `terraai-stripe` | `live` | v1 |
| `terraai-airtel` | `live` | v1 |

### Lambda Source Code

| Function | Source Path |
|---|---|
| `terraaimobility-api` | `MobilityAIapp/aws/lambda/` (`index.js`, `package.json`, `node_modules`) |
| `opusaimobility-push-notification` | `MobilityAIapp/aws/lambda/push-notification/` |

### Lambda Environment Variables (`terraaimobility-api`)

| Variable | Value |
|---|---|
| `COGNITO_USER_POOL_ID` | `us-east-1_LKa4ElQem` |
| `COGNITO_CLIENT_ID` | `2am01r4fmsp0s08991ftgub887` |
| `WS_ENDPOINT` | `https://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` |
| `SNS_TOPIC_PUSH` | `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |
| `SNS_TOPIC_RIDE` | `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |
| `SNS_TOPIC_ORDER` | `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |
| `GEMINI_SECRET_NAME` | `omniride/gemini-api-key` |

---

## API Gateway

| Property | Value |
|---|---|
| **API ID** | `0wv2nyk3je` |
| **Name** | `omniride-http-api` |
| **Type** | HTTP API v2 |
| **Stage** | `prod` |
| **Endpoint** | `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod` |

---

## Cognito

| Property | Value |
|---|---|
| **User Pool ID** | `us-east-1_LKa4ElQem` |
| **Pool Name** | `terraaimobility-production` |
| **Region** | `us-east-1` |
| **Android Client ID** | `2am01r4fmsp0s08991ftgub887` (`terraaimobility-android`) |
| **Web Client ID** | `3a207uin5o3p4k1ngk334crntl` (`terraaimobility-web`) |

---

## IoT Core (Real-time Telemetry)

| Property | Value |
|---|---|
| **ATS Endpoint** | `arqymixni12gc-ats.iot.us-east-1.amazonaws.com` |
| **WebSocket API** | `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` |
| **Protocol** | WebSocket MQTT over API Gateway |
| **Use** | Driver location streaming + rider notifications |
| **Thing naming** | `opusaimobility-rider-{riderId}` |
| **Topics** | `opusaimobility/telemetry/{thingId}`, `opusaimobility/location/{thingId}`, `opusaimobility/notifications/{thingId}` |

---

## SNS

| Topic | ARN |
|---|---|
| `opusaimobility-notifications` | `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |

---

## Pinpoint

| Property | Value |
|---|---|
| **App ID** | `20d7e36cc4094a04b63b7fd1e5596fcf` |
| **Use** | Push analytics |

---

## Blockchain (Celo Sepolia)

| Property | Value |
|---|---|
| **TerraCarbon Contract** | `0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701` |
| **Network** | Celo Sepolia (chainId `11142220`) |
| **RPC** | `https://forno.celo-sepolia.celo-testnet.org` |
| **Fallback RPC** | `https://celo-sepolia.drpc.org` |
| **Explorer** | `https://sepolia.celoscan.io/address/0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701` |
| **Deployer Wallet** | `0x57651B018Fa4aC931Ec585da641078988Ef1213B` |
| **Deployer Secret** | `opusaimobility/celo-deployer` (Secrets Manager) |
| **Bytecode Secret** | `opusaimobility/celo-bytecode` (Secrets Manager) |

---

## CodeBuild Projects

| Project | Buildspec | Purpose |
|---|---|---|
| `OpusAIMobility` | `buildspec.yml` | Full build (Android + Frontend + Lambda) |
| `OpusAIMobility-Frontend` | `buildspec-frontend.yml` | Frontend-only (faster) |

### CodeBuild Environment Variables

| Variable | Value |
|---|---|
| `S3_APK_BUCKET` | `opusaimobility-apk-distribution` |
| `S3_FRONTEND_BUCKET` | `opusaimobility-assets-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | **`E18GJ5VKHBIJAI`** |
| `LAMBDA_FUNCTION_NAME` | `terraaimobility-api` |

### CodeBuild Stack

| Property | Value |
|---|---|
| **Stack Name** | `OpusAIMobility-CodeBuild` |
| **Status** | `UPDATE_COMPLETE` |
| **Artifact Bucket** | `opusaimobility-codebuild-artifacts-683541453923` |

---

## Android Signing (SSM Parameter Store)

| Parameter | Type |
|---|---|
| `/opusaimobility/keystore-file` | SecureString (base64 .jks) |
| `/opusaimobility/keystore-password` | SecureString |
| `/opusaimobility/key-alias` | SecureString (`opusaimobility`) |
| `/opusaimobility/key-password` | SecureString |

Keystore: RSA-2048, SHA256withRSA, valid until 2053-11-24
CN=OpusAIMobility, OU=Mobile, O=YNA, L=Nairobi, C=KE

---

## GitHub Actions (CI/CD)

> **Authentication:** GitHub OIDC → AWS STS (zero static keys — no `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed)

| Secret Name | Value |
|---|---|
| `S3_FRONTEND_BUCKET` | `opusaimobility-assets-prod` |
| `S3_APK_BUCKET` | `opusaimobility-apk-distribution` |
| `CLOUDFRONT_DISTRIBUTION_ID` | **`E18GJ5VKHBIJAI`** |
| `KEYSTORE_FILE` | *(base64 .jks — contents of `keystore.b64`)* |
| `KEYSTORE_PASSWORD` | `OpusAI2026@Keystore!` |
| `KEY_ALIAS` | `opusaimobility` |
| `KEY_PASSWORD` | `OpusAI2026@Key!` |
| `ECR_REPOSITORY` | `opusaimobility/terra-api` |
| `ECS_CLUSTER` | `opusaimobility` |
| `ECS_SERVICE` | `opusaimobility-terra-api` |
| `TERRA_HEALTH_URL` | `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/terra/health` |

### IAM Roles

| Role | Purpose |
|---|---|
| `OpusAIMobility-CodeBuild-Role` | CodeBuild service role (policy v2) |
| `opusaimobility-github-deploy` | GitHub OIDC → AWS (keyless deploy) |
| `AmazonQDeveloperGitHubRole` | Amazon Q PR reviews |
| `terraaimobility-lambda-role` | Lambda execution role (SecretsManager, SNS, DynamoDB, S3, IoT) |

### CodeConnections

| ARN | Status |
|---|---|
| `arn:aws:codeconnections:us-east-1:683541453923:connection/106cbfc4-0ec6-492a-bf08-43ba86575ea1` | AVAILABLE |

---

## Route 53

| Record | Type | Value | Purpose |
|---|---|---|---|
| `opusaimobility.yna.co.ke` | CNAME | `d22up4o3zhu9gf.cloudfront.net` | Primary domain → `E18GJ5VKHBIJAI` |
| `app.opusaimobility.yna.co.ke` | CNAME | `d2rofh106fep8b.cloudfront.net` | App alias → `E1TIJJKJ2UEIO7` |
| `_cd0b081a84bcc4648ff8379a6a4ffa72.opusaimobility.yna.co.ke` | CNAME | `_42cf175fae49cd4885d4b43deab47e2d.jkddzztszm.acm-validations.aws.` | ACM validation |

**Hosted Zone:** `Z045519727P6F7DS3M5GC` (`yna.co.ke.`)

---

## ACM Certificates

| Certificate ARN | Domain | Status | Expiry |
|---|---|---|---|
| `arn:aws:acm:us-east-1:683541453923:certificate/704d96b8-1017-485c-ba24-476370d42a63` | `opusaimobility.yna.co.ke` + `*.opusaimobility.yna.co.ke` | ISSUED | 2027-01-22 |

---

## Project Structure

```
OpusAIMobility/
├── MobilityAIapp/
│   ├── src/                        # React 19 + TypeScript + Vite frontend
│   ├── apps/customer/              # Android app (Gradle, AGP 8.1.4, Java 17)
│   ├── aws/lambda/
│   │   ├── index.js                # terraaimobility-api main handler (zipped for deploy)
│   │   ├── package.json
│   │   ├── terraaimobility-api/    # v3.1 source (auth.js, db.js, notify.js, seed-config.js)
│   │   └── push-notification/     # opusaimobility-push-notification Lambda
│   ├── server/                     # Node.js backend (Express, legacy)
│   └── infra/                      # CloudFormation / infra templates
├── contracts/                      # Solidity smart contracts (Hardhat, Celo Sepolia)
├── aws/lambda/                     # Specialist Lambdas (blockchain, mpesa, stripe, airtel…)
├── buildspec.yml                   # CodeBuild full build
├── buildspec-frontend.yml          # CodeBuild frontend-only
├── INFRASTRUCTURE.md               # ← this file (source of truth)
└── scripts/                        # Deployment scripts
```

---

## Frontend Build

| Property | Value |
|---|---|
| **Framework** | React 19 + Vite 6 |
| **Entry** | `MobilityAIapp/src/index.html` |
| **Output** | `MobilityAIapp/dist/` |
| **Build command** | `cd MobilityAIapp && npm run build` |
| **Deploy command** | `aws s3 sync MobilityAIapp/dist/ s3://opusaimobility-assets-prod/ --delete` |

### Vite Environment Variables (build-time)

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://opusaimobility.yna.co.ke` |
| `VITE_APP_URL` | `https://app.opusaimobility.yna.co.ke` |
| `VITE_AWS_REGION` | `us-east-1` |
| `VITE_COGNITO_USER_POOL_ID` | `us-east-1_LKa4ElQem` |
| `VITE_COGNITO_CLIENT_ID` | `3a207uin5o3p4k1ngk334crntl` |
| `VITE_S3_BUCKET` | `opusaimobility-assets-prod` |
| `VITE_S3_BASE_URL` | `https://opusaimobility-assets-prod.s3.us-east-1.amazonaws.com` |
| `VITE_IOT_ENDPOINT` | `wss://arqymixni12gc-ats.iot.us-east-1.amazonaws.com/mqtt` |
| `VITE_SNS_TOPIC_ARN` | `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |
| `VITE_PINPOINT_APP_ID` | `20d7e36cc4094a04b63b7fd1e5596fcf` |

---

## Deployment Flow

```
git push main
    → GitHub Actions (.github/workflows/deploy.yml)
        → Deploy Main Lambda  (terraaimobility-api)
        → Deploy Push Lambda  (opusaimobility-push-notification)
        → Build frontend      (Vite → MobilityAIapp/dist/)
        → S3 sync             (opusaimobility-assets-prod)
        → CloudFront inval.   (E18GJ5VKHBIJAI)   ← CANONICAL
        → Android APK         (opusaimobility-apk-distribution/apks/)
        → Post-deploy smoke tests

    OR: AWS CodeBuild (OpusAIMobility project)
        → buildspec.yml       (same steps + Android build)
        → CloudFront inval.   (E18GJ5VKHBIJAI)
```

---

## Monitoring

| Resource | Details |
|---|---|
| CloudWatch Stack | `opusaimobility-monitoring` (CREATE_COMPLETE) — 7 alarms + dashboard |
| Dashboard | `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=OpusAIMobility-Dashboard` |
| GuardDuty | `aacfa0f1ae70dd778fa4cc0daee9e003` |
| VPC Flow Logs | `fl-0b5c683f7fbc7c85c` on `vpc-0ae6f8630af9fbfdc` |
| X-Ray | Active on `terraaimobility-api` + `opusaimobility-push-notification` |
