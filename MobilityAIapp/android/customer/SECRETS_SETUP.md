# GitHub Secrets Setup Guide

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

---

## 1. JitPack Token (`JITPACK_TOKEN`)

Required for: `RecyclerTreeView` and any other JitPack packages that hit
rate limits or return 401 on the free tier.

**How to get it:**
1. Go to https://jitpack.io
2. Sign in with your GitHub account
3. Go to **Account** → copy your **Authentication Token**
4. Add it as secret named: `JITPACK_TOKEN`

---

## 2. Release Signing Secrets (4 secrets)

Required for: building a signed Release APK that can be uploaded to Google Play.

### Step A — Generate a keystore (skip if you already have one)

Run this on your machine (requires JDK installed):

```bash
keytool -genkey -v \
  -keystore terraai-release.jks \
  -alias terraai \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for:
- A **keystore password** (save it — this is `KEYSTORE_PASSWORD`)
- Your name/org details
- A **key password** (save it — this is `KEY_PASSWORD`)
- The **alias** you typed is `KEY_ALIAS` (e.g. `terraai`)

### Step B — Base64-encode the keystore file

**macOS/Linux:**
```bash
base64 -i terraai-release.jks | pbcopy   # copies to clipboard
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("terraai-release.jks")) | clip
```

### Step C — Add these 4 secrets to GitHub

| Secret Name         | Value                                      |
|---------------------|--------------------------------------------|
| `KEYSTORE_BASE64`   | The base64 string from Step B              |
| `KEYSTORE_PASSWORD` | The keystore password you chose            |
| `KEY_ALIAS`         | The alias (e.g. `terraai`)                 |
| `KEY_PASSWORD`      | The key password you chose                 |

---

## What happens without the secrets?

| Secret set?           | Debug build | Release build              |
|-----------------------|-------------|----------------------------|
| No secrets at all     | ✅ Works     | ✅ Builds (debug-signed)    |
| Only JITPACK_TOKEN    | ✅ Works     | ✅ Builds (debug-signed)    |
| All 5 secrets set     | ✅ Works     | ✅ Builds (release-signed)  |

The CI is designed to **never fail** just because secrets are missing —
it degrades gracefully.

---

## ⚠️ NEVER commit these files

- `terraai-release.jks`
- Any file containing raw keystore passwords

They are already in `.gitignore`. Double-check before pushing.

---

## 3. Firebase `google-services.json` (`GOOGLE_SERVICES_JSON`)

Required for: Firebase Crashlytics, Analytics, Realtime Database, GeoFire.
The `com.google.gms.google-services` Gradle plugin reads this file at build time.

**How to get it:**
1. Go to https://console.firebase.google.com
2. Open the **OpusAIMobility** project (or create it)
3. Android app → package name: `com.yna.opusaimobilityapp`
4. Download `google-services.json`

**Encode and store:**
```bash
# macOS / Linux
base64 -i google-services.json | pbcopy   # copies to clipboard

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-services.json")) | clip
```

Add it as GitHub secret: **`GOOGLE_SERVICES_JSON`**

| Secret Name             | Value                                      |
|-------------------------|--------------------------------------------|
| `GOOGLE_SERVICES_JSON` | base64-encoded `google-services.json`     |

**What happens without it?**
CI will write a stub `google-services.json` with no real credentials.
The app will compile but Firebase services (Crashlytics, Analytics, GeoFire)
will not function at runtime until the real file is provided.
