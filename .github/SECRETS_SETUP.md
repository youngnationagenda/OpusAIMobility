# GitHub Actions — Secrets Setup Guide
## OpusAIMobility CI/CD Pipeline

> **No AWS keys needed.** Authentication uses GitHub OIDC → AWS STS.
> The IAM role `opusaimobility-github-deploy` is already live in account `683541453923`.

---

## How to Add a Secret

1. Go to your repo on GitHub
2. Click **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Paste the **Name** and **Value** from the tables below exactly

---

## Group 1 — AWS Deploy (Required for all deploy jobs)

| Secret Name | Value | Used By |
|---|---|---|
| *(none — OIDC is keyless)* | *OIDC role assumed automatically* | All jobs |

> ✅ **No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed.**
> The workflow uses `role-to-assume: arn:aws:iam::683541453923:role/opusaimobility-github-deploy`
> with GitHub's built-in OIDC token — zero static credentials stored in GitHub.

---

## Group 2 — Container & ECS (Required for `deploy-terra-api`)

| Secret Name | Value |
|---|---|
| `ECR_REPOSITORY` | `opusaimobility/terra-api` |
| `ECS_CLUSTER` | `opusaimobility` |
| `ECS_SERVICE` | `opusaimobility-terra-api` |
| `TERRA_HEALTH_URL` | `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/terra/health` |

---

## Group 3 — Frontend Deploy (Required for `deploy-frontend`)

| Secret Name | Value |
|---|---|
| `S3_FRONTEND_BUCKET` | `opusaimobility-assets-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E18GJ5VKHBIJAI` |

> **CloudFront Distribution `E18GJ5VKHBIJAI`** → `d22up4o3zhu9gf.cloudfront.net`
> Origin: `opusaimobility-assets-prod.s3.us-east-1.amazonaws.com` (Status: Deployed)

---

## Group 4 — APK Distribution (Required for `deploy-customer-apk`)

| Secret Name | Value |
|---|---|
| `S3_APK_BUCKET` | `opusaimobility-assets-prod` |

> Debug APKs land at:
> `s3://opusaimobility-assets-prod/apks/customer/debug/<name>-debug-<build>.apk`
> Stable URL: `s3://opusaimobility-assets-prod/apks/customer/debug/latest.apk`

---

## Group 5 — Android Signing (Release builds only — tags `v*` or manual dispatch)

The keystore is already stored in AWS Secrets Manager at
`opusaimobility/android-keystore` (ARN: `arn:aws:secretsmanager:us-east-1:683541453923:secret:opusaimobility/android-keystore-UR6QHg`).

| Secret Name | Value |
|---|---|
| `KEYSTORE_FILE` | *(base64 string from `keystore.b64` — see note below)* |
| `KEYSTORE_PASSWORD` | `OpusAI2026@Keystore!` |
| `KEY_ALIAS` | `opusaimobility` |
| `KEY_PASSWORD` | `OpusAI2026@Key!` |

> **`KEYSTORE_FILE` value** — copy the full contents of `keystore.b64` in the project root.
> It is the base64-encoded `.jks` file. The workflow decodes it with:
> `echo "${{ secrets.KEYSTORE_FILE }}" | base64 --decode > release.keystore`
>
> Valid until: **2053-11-24** | Algorithm: RSA-2048 / SHA256withRSA
> CN=OpusAIMobility, OU=Mobile, O=YNA, L=Nairobi, C=KE

---

## Group 6 — Runtime Environment (Baked into the Vite build)

These are injected as `VITE_*` env vars during `npm run build` — they are
**not secret** (they end up in the browser bundle) but are included here for
completeness. They are already hardcoded in `deploy.yml` from `.env.local`.

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://opusaimobility.yna.co.ke` |
| `VITE_AWS_REGION` | `us-east-1` |
| `VITE_COGNITO_USER_POOL_ID` | `us-east-1_LKa4ElQem` |
| `VITE_COGNITO_CLIENT_ID` | `3a207uin5o3p4k1ngk334crntl` (web) |
| `VITE_S3_BUCKET` | `opusaimobility-assets-prod` |
| `VITE_IOT_ENDPOINT` | `wss://arqymixni12gc-ats.iot.us-east-1.amazonaws.com/mqtt` |

---

## Minimal Secret Set (fastest path to a working pipeline)

If you only want CI + Lambda + Frontend deploys working now:

```
S3_FRONTEND_BUCKET         = opusaimobility-assets-prod
CLOUDFRONT_DISTRIBUTION_ID = E18GJ5VKHBIJAI
S3_APK_BUCKET              = opusaimobility-assets-prod
```

The `deploy-terra-api` job will be skipped if `ECR_REPOSITORY` / `ECS_CLUSTER` /
`ECS_SERVICE` are not set — that is safe.

---

## Verification

After adding secrets, trigger a manual run:

```
GitHub → Actions → Deploy → Run workflow → Branch: main → Force deploy: false
```

The `validate-aws` job will:
1. Assume `opusaimobility-github-deploy` via OIDC (no keys needed)
2. Confirm the Amazon Q Connection ARN `106cbfc4-0ec6-492a-bf08-43ba86575ea1` is `AVAILABLE`
3. Warn about any missing optional secrets

---

## IAM Resources (already live — no action needed)

| Resource | Value |
|---|---|
| OIDC Provider | `arn:aws:iam::683541453923:oidc-provider/token.actions.githubusercontent.com` |
| Deploy Role | `arn:aws:iam::683541453923:role/opusaimobility-github-deploy` |
| Deploy Policy | `arn:aws:iam::683541453923:policy/opusaimobility-github-deploy-policy` |
| Amazon Q Role | `arn:aws:iam::683541453923:role/AmazonQDeveloperGitHubRole` |
| Connection ARN | `arn:aws:codeconnections:us-east-1:683541453923:connection/106cbfc4-0ec6-492a-bf08-43ba86575ea1` |
| Connection Status | `AVAILABLE` |
