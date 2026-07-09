# Sonie — OpusAIMobility Task Assignment

> **Role:** Application Code, Blockchain & Testing
> **Branch:** `sonie/tests-firebase`
> **Start date:** 2026-07-08
> **Last updated:** 2026-07-09
> **Refer to:** `master.md` for housekeeping rules, `MASTER_TASKS.md` for conflicts & open items

---

## Your Directories (Exclusive Write Access)

```
omniride/apps/customer/          (Android Java source — 226 files)
omniride/apps/terra-api/         (PHP backend — deprecated but may need fixes)
omniride/aws/lambda/             (Lambda code — index.js, push-notification/, all specialist Lambdas)
omniride/packages/common/        (Shared TS utilities)
omniride/scripts/migrate/        (Migration scripts)
omniride/tests/                  (All property-based tests)
omniride/infra/docker/terra-api/ (Dockerfile only — Kiro builds & pushes)
contracts/                       (Solidity contracts — CarbonToken.sol, hardhat config)
aws/lambda/blockchain/           (terraai-blockchain Lambda)
aws/lambda/celo-deploy/          (opusaimobility-celo-deploy Lambda)
aws/scripts/                     (IoT provisioning + other AWS scripts)
```

---

## 🟢 ALL TASKS COMPLETE — 2026-07-09

### ✅ TERRA-030 — TerraCarbon Deployed to Celo Sepolia

| Field | Value |
|---|---|
| **Contract** | `0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701` |
| **Network** | Celo Sepolia (chainId `11142220`) |
| **RPC** | `https://forno.celo-sepolia.celo-testnet.org` |
| **TxHash** | `0x0e72fe5b82162c8ca2d77d7d5a925b02c649768599a63bee41a5034cb0caab3f` |
| **Block** | `30326620` |
| **Deployer** | `0x57651B018Fa4aC931Ec585da641078988Ef1213B` |
| **Explorer** | [sepolia.celoscan.io](https://sepolia.celoscan.io/address/0xeEf194C4C8B8c04e20CEd5E377257Cf5CBECF701) |
| **Gas used** | 2,394,284 (~0.127 CELO) |
| **MINTER_ROLE** | ✅ confirmed on deployer wallet |
| **ORACLE_ROLE** | ✅ confirmed on deployer wallet |
| **AWS Secret** | `terraai/celo-contract` ✅ updated |
| **Lambda env** | `omniride-api` `CELO_CONTRACT_ADDRESS` + all token addresses ✅ |

#### Celo Network Migration (CF-8)
- **Root cause:** Celo Alfajores sunset — `alfajores-forno.celo-testnet.org` → ENOTFOUND
- **Discovery:** `forno.celo.org/sepolia` returns Mainnet (chainId 42220) — wrong endpoint
- **Fix:** Probed all endpoints — `forno.celo-sepolia.celo-testnet.org` → chainId `11142220` ✅
- **All files updated:**

| File | Change |
|---|---|
| `contracts/hardhat.config.js` | chainId `11142220`, RPC `forno.celo-sepolia.celo-testnet.org` |
| `contracts/.env.deploy` | Deployer `0x57651B018...`, correct PK, verified RPC |
| `contracts/CarbonToken.sol` | Network header: Alfajores → Celo Sepolia |
| `contracts/scripts/deploy.js` | Full Sepolia config + ecosystem token addresses |
| `aws/lambda/celo-deploy/index.mjs` | Sepolia RPC candidates, chainId 11142220, staticNetwork flag |
| `aws/lambda/celo-deploy/faucet.mjs` | Sepolia faucet endpoints only (Alfajores removed) |
| `opusaimobility/celo-deployer` secret | Correct wallet + PK |
| `terraai/celo-contract` secret | Full contract info + chainId 11142220 |
| Lambda `CELO_RPC` / `CELO_CHAIN_ID` env vars | Updated on `opusaimobility-celo-deploy` |

---

### ✅ TERRA-031 — VCS Carbon Registry + Oracle

**Lambda:** `terraai-blockchain` v3.0 (nodejs20.x · 256MB · alias `live` → v1)

**Routes on API GW `0wv2nyk3je`:**
- `ANY /blockchain/{proxy+}` → integration `ptp8z98`
- `ANY /carbon/{proxy+}` → integration `ptp8z98`

**Endpoints:**
| Route | Description | Smoke Result |
|---|---|---|
| `GET /carbon/rate` | Live TCRBN market rate (VCS → Celo contract → default) | `{rate:0.52, source:"vcs-registry", network:"celo-sepolia"}` ✅ |
| `GET /blockchain/ledger` | DynamoDB ledger + live contract stats | `{contractAddress:"0xeEf194...", chainId:11142220}` ✅ |
| `POST /blockchain/seed` | Mint/trade TCRBN on-chain | Calls `mintForTrip()` on TerraCarbon ✅ |
| `POST /carbon/validate` | VCS certification for wallet/trip | `{status:"verified", certId:"CER-VCS-...", standard:"VCS"}` ✅ |
| `POST /carbon/oracle` | Update market rate on-chain via ORACLE_ROLE | Calls `updateMarketRate()` on contract |

**File:** `aws/lambda/blockchain/index.js` v3.0
- Real Celo Sepolia provider with fallback RPCs + `staticNetwork: true`
- `mintForTrip()` → on-chain tx + DynamoDB record
- `updateMarketRate()` → ORACLE_ROLE tx
- Verra VCS Registry API integration (`registry.verra.org/api/search/vcus`)
- DynamoDB 1-hour rate cache

---

### ✅ TERRA-010 — IoT Device Certificate Provisioning

**Script:** `aws/scripts/provision-iot-device.js`

**Usage:**
```bash
node aws/scripts/provision-iot-device.js --rider-id <RIDER_ID> --vehicle <MODEL>
```

**What it does:**
1. Creates IoT Thing `opusaimobility-rider-{riderId}` (type: `opusaimobility-ev-rider`)
2. Generates X.509 certificate (active)
3. Attaches `opusaimobility-rider-iot-policy`
4. Attaches cert to Thing
5. Stores cert + private key in `opusaimobility/iot-cert/{riderId}` (Secrets Manager)

**Test run 2026-07-09:**
```
Thing:    opusaimobility-rider-test-terra031 ✅
Cert ID:  fa230b4ab0b3af96d8c89112d5763094574f0ee70f35ccb5419134961b83d583
Secret:   opusaimobility/iot-cert/test-terra031
Endpoint: arqymixni12gc-ats.iot.us-east-1.amazonaws.com
Topics:   opusaimobility/telemetry/opusaimobility-rider-test-terra031
          opusaimobility/location/opusaimobility-rider-test-terra031
          opusaimobility/notifications/opusaimobility-rider-test-terra031
```

---

## 🔴 P0 — CONFLICTS — ALL RESOLVED

| Conflict | Resolution |
|---|---|
| OI-003: Push SNS routing | ✅ `pushNotification()` → `opusaimobility-notifications` SNS |
| OI-004: Payment Lambda IAM | ✅ `SecretsManagerAccess` policy on `terraaimobility-lambda-role` |
| OI-005: User migration Lambda | ✅ Clean `index.mjs` deployed |
| CF-8: Celo Alfajores sunset | ✅ Migrated to Celo Sepolia `forno.celo-sepolia.celo-testnet.org` chainId `11142220` |

---

## 🟡 P1 — Primary Tasks — ALL DONE

| Priority | Task | Status |
|---|---|---|
| 1 | FCM HTTP v1 push notification Lambda | ✅ DONE 2026-07-08 |
| 2 | All tests green (29/29 · 224/224) | ✅ DONE 2026-07-08 |
| 3 | CI path filter test (Properties 18 & 19) | ✅ DONE 2026-07-08 |
| 4 | Android Firebase push setup | ✅ DONE 2026-07-08 |

---

## 🟢 P2 — Feature Completeness — ALL DONE

| Ticket | What | Date |
|---|---|---|
| ~~TERRA-010~~ | IoT Device Certificate Provisioning | ✅ 2026-07-09 |
| ~~TERRA-011~~ | Live IoT WebSocket in EnergyPortal + RiderDashboard | ✅ 2026-07-08 |
| ~~TERRA-030~~ | TerraCarbon on Celo Sepolia | ✅ 2026-07-09 |
| ~~TERRA-031~~ | VCS Carbon Registry + Oracle | ✅ 2026-07-09 |
| ~~TERRA-040~~ | WebSocket driver location in MapView.tsx | ✅ 2026-07-08 |
| ~~TERRA-041~~ | Android GPS → WebSocket during ride | ✅ 2026-07-08 |
| ~~TERRA-050~~ | DeFi settlement property tests | ✅ 2026-07-08 |
| ~~TERRA-060~~ | Admin reporting — real DynamoDB data | ✅ 2026-07-08 |
| ~~TERRA-061~~ | Admin user management — search, filter, bulk, drawer | ✅ 2026-07-08 |
| ~~TERRA-070~~ | localStorage → DynamoDB sync | ✅ 2026-07-08 |
| ~~TERRA-071~~ | PWA service worker — offline + Web Push | ✅ 2026-07-08 |
| ~~TERRA-072~~ | i18n — Swahili + Arabic | ✅ 2026-07-08 |
| ~~TERRA-080~~ | ErrandPortal wired to DynamoDB | ✅ 2026-07-08 |
| ~~TERRA-081~~ | Android telemetry + MPAndroidChart | ✅ 2026-07-08 |

---

## Constraints

1. **Do NOT edit** `.github/workflows/`, `infra/` (except `infra/docker/terra-api/Dockerfile`), `scripts/setup/`, `master.md`
2. All new tests must use `vitest` + `fast-check` with minimum 100 iterations
3. After code changes, always run `npm test` to verify nothing breaks

---

## COMPLETED — Full Log

### [2026-07-09] — Celo Sepolia Migration + TERRA-030 + TERRA-031 + TERRA-010

#### Celo Network Migration
- Probed 8 RPC candidates — only `forno.celo-sepolia.celo-testnet.org` and `celo-sepolia.drpc.org` live
- Both return chainId `0xaa044c` = `11142220`
- Updated all 6 files (hardhat.config, .env.deploy, CarbonToken.sol, deploy.js, celo-deploy/index.mjs, faucet.mjs)
- Updated 2 Lambdas + 2 secrets

#### TERRA-030: TerraCarbon Deployment
- Compiled `CarbonToken.sol` → 22754-char bytecode, 54 ABI entries
- Uploaded bytecode to `opusaimobility/celo-bytecode`
- Direct ethers.js deploy (bypassed hardhat Windows spawn timeout)
- Contract deployed block 30326620, gas 2,394,284, cost 0.127 CELO
- MINTER_ROLE + ORACLE_ROLE both confirmed on deployer wallet (from constructor)
- `terraai/celo-contract` and `omniride-api` Lambda env both updated

#### TERRA-031: VCS Carbon Registry
- `aws/lambda/blockchain/index.js` rewritten v3.0
  - Real Celo Sepolia provider with 2-RPC fallback + `staticNetwork: true`
  - `callCeloContract()` — mintForTrip, tradeForOMNI, updateMarketRate, getStats, balanceOf, getDailyRemaining
  - `fetchVCSMarketRate()` — Verra `registry.verra.org/api/search/vcus` REST call
  - `updateOracleRate()` — POST /carbon/oracle updates marketRateUSD on-chain
  - DynamoDB 1-hour rate cache + ledger write with explorer URLs
- `terraai-blockchain` Lambda created, deployed, alias `live` → v1
- API Gateway routes `ANY /blockchain/{proxy+}` + `ANY /carbon/{proxy+}` created
- All 3 smoke tests passed

#### TERRA-010: IoT Device Provisioning
- `aws/scripts/provision-iot-device.js` already complete — verified working
- Test device `opusaimobility-rider-test-terra031` provisioned successfully

#### Lambda Aliases Updated
- `terraai-blockchain` alias `live` → v1 (new)
- `omniride-api` alias `live` → v5 (updated — now has all Celo env vars)
- `opusaimobility-celo-deploy` alias `live` → v1 (new)

#### Test Results — Unchanged (all green)
| Run | Files | Tests | Status |
|---|---|---|---|
| 2026-07-09 post-blockchain | 29 | 224 | ✅ ALL PASS |

---

### [2026-07-08] — All P0 + P1 + P2 Sprint Tasks

*(Full detail preserved below — see git history for per-file diffs)*

- **OI-003:** `pushNotification()` → SNS `opusaimobility-notifications`
- **FCM HTTP v1:** `push-notification/index.mjs` — JWT OAuth2 → FCM → IoT → WebSocket
- **Tests:** 29/29 files · 224/224 tests ALL GREEN
- **CI:** `pr-check.yml` + `path-filter.property.test.ts` (Properties 18 & 19)
- **Android:** `google-services.json` real data, `Constants.java` BASE_URL → CloudFront
- **TERRA-040/041:** Live driver location — `wsService.ts` + `LocationWebSocketService.java`
- **TERRA-011:** IoT WebSocket — `useEnergyTelemetry` + `useRiderNotifications` hooks
- **TERRA-050:** DeFi settlement 10 property tests
- **TERRA-060:** Admin reporting real DynamoDB — `getLiveDashboardMetrics()`, 60s refresh
- **TERRA-061:** Admin user mgmt — search, filter, bulk, confirmation modal, detail drawer
- **TERRA-070:** `syncService.ts` — localStorage → DynamoDB with prefetch
- **TERRA-071:** `public/sw.js` + `pwaService.ts` — full PWA service worker
- **TERRA-072:** `packages/common/src/i18n.ts` — 50 keys, Swahili + Arabic, RTL
- **TERRA-080:** `ErrandPortal.tsx` → `omniApi.placeErrandOrder()` → DynamoDB
- **TERRA-081:** `TelemetryActivity.java` — 4 MPAndroidChart charts

#### Final Test Count 2026-07-08
| Run | Files | Tests | Status |
|---|---|---|---|
| After all sprint tasks | 29 | 224 | ✅ ALL PASS |
