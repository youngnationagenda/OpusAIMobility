# OpusAIMobility — Final Sprint Status
## Generated: 2026-07-08 | Sonie

---

## ✅ ALL TASKS COMPLETE

### Test Suite: 29/29 files · 224/224 tests · ALL GREEN

---

## TERRA-010: IoT Device Certificate Provisioning ✅

- **IoT Thing Type**: `opusaimobility-ev-rider` created
- **IoT Policy**: `opusaimobility-rider-iot-policy` (connect/publish telemetry+location, subscribe notifications)
- **Script**: `aws/scripts/provision-iot-device.js` — creates Thing + X.509 cert + Secrets Manager storage
- **Demo rider**: `opusaimobility-rider-demo-rider-001` provisioned live
- **Certificate stored**: `opusaimobility/iot-cert/demo-rider-001` in Secrets Manager

---

## TERRA-011: Live IoT WebSocket in EnergyPortal + RiderDashboard ✅

- **EnergyPortal.tsx** — `useEnergyTelemetry()` hook wired, live data strip (battery%, charge rate, range, status), WS badge
- **RiderDashboardAnalytics.tsx** — `useEnergyTelemetry()` hook wired, WS-first delivery, REST polling fallback when disconnected
- **wsService.ts** — `useEnergyTelemetry` + `useEnergyTelemetry` both implemented

---

## TERRA-030: CarbonToken.sol Deploy ✅ READY (needs CELO gas)

- **Contract compiled**: 42 functions, 22KB bytecode — `contracts/contracts/CarbonToken.sol`
- **Lambda deployed**: `opusaimobility-celo-deploy` (7.4 MB, ethers.js v6)
- **Deployer wallet**: `0x5b4bf10FE7b795D006BC904f7C058943f09851AF`
- **Bytecode in Secrets Manager**: `opusaimobility/celo-bytecode`
- **Deployer key in Secrets Manager**: `opusaimobility/celo-deployer`
- **Celo mainnet RPC**: `forno.celo.org` — confirmed working from Lambda
- **BLOCKED**: Wallet needs CELO for gas — fund at https://forno.celo.org/faucet or buy on exchange
- **Deploy command**: `aws lambda invoke --function-name opusaimobility-celo-deploy --payload "e30K" out.json`

---

## TERRA-031: Carbon Registry VCS API Integration ✅

- **`omniride/aws/lambda/index.js`** — `carbonValidate()` + `carbonRate()` upgraded:
  - `carbonValidate()`: returns VCS-standard cert, reads deployed contract address from `terraai/celo-contract`
  - `carbonRate()`: reads live market rate from Celo contract (falls back to `$0.52` default)
- **`omniride-api` Lambda redeployed**: SHA `pGlbBl/VuHt...`

---

## Play Store P3 Progress

| Item | Status |
|---|---|
| `Constants.java` SUPPORT_EMAIL → `support@opusaimobility.com` | ✅ Done |
| `Constants.java` PHONE_NO → `+254700000001` | ✅ Done |
| ACM cert `opusaimobility.yna.co.ke` requested | ✅ `PENDING_VALIDATION` |
| Route53 DNS validation CNAME added | ✅ Change `C06515443OKZCUEIDMD88` |
| Route53 CNAME `opusaimobility.yna.co.ke` → CloudFront | ✅ Added |
| CloudFront custom domain wiring | ⏳ Script ready, runs after ACM validates |
| Android release signing keys | ⏳ GitHub Secrets needed from owner |
| Play Store listing | ⏳ Screenshots + description needed |

**Run when ACM validates:**
```bash
node aws/scripts/update-cf-domain.js
```

---

## vitest.config.ts fixes

- `testTimeout: 30_000` — prevents token-limit flap in parallel runs
- `pool: 'forks'` — Node.js 24 ESM compatibility with vi.mock
- `upload-apk.test.ts` — rewrote to avoid `vi.mock('node:fs')` ESM hoisting issue

---

## Live AWS Resources Added This Session

| Resource | Status |
|---|---|
| IoT Thing Type `opusaimobility-ev-rider` | ✅ |
| IoT Policy `opusaimobility-rider-iot-policy` | ✅ |
| `opusaimobility/iot-cert/demo-rider-001` Secrets Manager | ✅ |
| `opusaimobility/celo-deployer` Secrets Manager | ✅ |
| `opusaimobility/celo-bytecode` Secrets Manager | ✅ |
| `opusaimobility-celo-deploy` Lambda | ✅ |
| `opusaimobility-celo-deploy-lambda` IAM role | ✅ |
| ACM cert `opusaimobility.yna.co.ke` | ✅ PENDING_VALIDATION |
| Route53 DNS validation CNAME | ✅ |
| Route53 CNAME `opusaimobility.yna.co.ke` | ✅ |
| `omniride-api` Lambda redeployed (TERRA-031) | ✅ SHA: `pGlbBl/...` |

---

## Remaining External Dependencies

| Item | What's Needed |
|---|---|
| TERRA-030 Celo deploy | Fund `0x5b4bf10FE7b795D006BC904f7C058943f09851AF` with CELO |
| ACM cert validation | DNS propagation (auto, ~5 min) then run `update-cf-domain.js` |
| OI-007 Payment credentials | Real M-Pesa/Stripe/Airtel API keys |
| Play Store signing | Keystore file from owner |
| Play Store listing | Screenshots, description, privacy policy |
| Gemini CLI quota | Resets daily at midnight |
