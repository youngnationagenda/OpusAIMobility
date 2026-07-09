# Android Release Keystore — Setup Guide
## Generated: 2026-07-09 | TERRA-094

---

## ✅ Keystore Already Generated

The Android release keystore has been created and is ready to use.

| Property | Value |
|---|---|
| **Algorithm** | RSA 2048-bit |
| **Signature** | SHA256withRSA |
| **Key Alias** | `opusaimobility` |
| **Subject** | `CN=OpusAIMobility, OU=Mobile, O=YNA, L=Nairobi, ST=Nairobi, C=KE` |
| **Valid From** | 2026-07-09 |
| **Valid Until** | **2053-11-24** (10,000 days) |
| **Keystore File** | `opusaimobility-release.jks` (2,768 bytes, PKCS12) |
| **Base64 File** | `keystore.b64` (3,692 chars) |
| **AWS Secret** | `opusaimobility/android-keystore` |
| **Secret ARN** | `arn:aws:secretsmanager:us-east-1:683541453923:secret:opusaimobility/android-keystore-UR6QHg` |

---

## 🔑 GitHub Secrets — Exact Values

**Go to:** https://github.com/youngnationagenda/OpusAIMobility/settings/secrets/actions

Add these **4 secrets** exactly:

### Secret 1: `KEYSTORE_FILE`
Copy the entire contents of this file:
```
D:\omnisonietest\OpusAIMobility\keystore.b64
```
Or retrieve from AWS:
```bash
aws secretsmanager get-secret-value \
  --secret-id opusaimobility/android-keystore \
  --query "SecretString" --output text \
  | python -c "import sys,json; print(json.load(sys.stdin)['keystoreBase64'])"
```

### Secret 2: `KEYSTORE_PASSWORD`
```
OpusAI2026@Keystore!
```

### Secret 3: `KEY_ALIAS`
```
opusaimobility
```

### Secret 4: `KEY_PASSWORD`
```
OpusAI2026@Key!
```

---

## 🚀 How to Trigger a Release Build

Once the 4 secrets are added, create a git tag:

```bash
git tag v1.7.0
git push origin v1.7.0
```

The `deploy-customer-release` job in `deploy.yml` will:
1. Decode the keystore from `KEYSTORE_FILE` secret
2. Build a signed release APK with `./gradlew assembleRelease`
3. Verify the APK signature with `apksigner`
4. Upload to S3:
   - `s3://opusaimobility-apk-distribution/apks/customer/release/opusaimobility-customer-v1.7.0.apk`
   - `s3://opusaimobility-apk-distribution/apks/customer/release/latest-release.apk`

---

## 🔒 Security Notes

- The keystore private key is protected by `OpusAI2026@Keystore!` password
- It is stored in AWS Secrets Manager (`opusaimobility/android-keystore`) — retrieve anytime
- The keystore file itself is at `D:\omnisonietest\OpusAIMobility\opusaimobility-release.jks`
- **Back up the keystore file** — if lost, you cannot update the app on Play Store with the same signing key
- Consider also enabling **Play App Signing** in the Play Console to let Google manage the upload key

---

## 📋 All 4 Credentials At A Glance

```
KEYSTORE_FILE     = <contents of keystore.b64 — 3,692 chars>
KEYSTORE_PASSWORD = OpusAI2026@Keystore!
KEY_ALIAS         = opusaimobility
KEY_PASSWORD      = OpusAI2026@Key!
```
