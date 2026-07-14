# OpusAIMobility Customer App — Integration Notes
> Integrated: OpusAIMobility Customer Android App (Dec 2022) into OpusAIMobility / MobilityAIapp
> Location  : `MobilityAIapp/android/customer/`

---

## What Was Integrated

| Source | Destination | Description |
|--------|-------------|-------------|
| `Android source code/OpusAIMobilityCustomer/app/src/main/java/com/yna/` | `android/customer/app/src/main/java/com/yna/` | Full OpusAIMobility Java source (all packages) |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/layout/` | `android/customer/app/src/main/res/layout/` | **165 layout XMLs** (all screens + items) |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/drawable/` | `android/customer/app/src/main/res/drawable/` | All icons, backgrounds, vector drawables |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/font/` | `android/customer/app/src/main/res/font/` | Airbnb Cereal font family (6 weights) |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/values/` | `android/customer/app/src/main/res/values/` | colors, strings, dimens, themes, attrs |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/values-ar/` | `android/customer/app/src/main/res/values-ar/` | Arabic string localisation |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/anim/` | `android/customer/app/src/main/res/anim/` | Screen transition animations |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/animator/` | `android/customer/app/src/main/res/animator/` | Heart fill/empty vector animators |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/color/` | `android/customer/app/src/main/res/color/` | State-list color selectors |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/menu/` | `android/customer/app/src/main/res/menu/` | App menu XML |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/mipmap-*/` | `android/customer/app/src/main/res/mipmap-*/` | Launcher icons (all densities) |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/raw/` | `android/customer/app/src/main/res/raw/` | gray_map.json + change_logs |
| `Android source code/OpusAIMobilityCustomer/app/src/main/res/xml/` | `android/customer/app/src/main/res/xml/` | file_paths.xml, network_security_config |
| `Android source code/OpusAIMobilityCustomer/app/libs/` | `android/customer/app/libs/` | retrofit-plus-debug.aar |
| `Debug APK/OpusAIMobility Customer.apk` | `android/OpusAIMobility-Customer-debug.apk` | Pre-built debug APK (37.8 MB) |
| `PHP API/Database/opusaimobility.sql` | `android/opusaimobility-schema.sql` | Full MySQL database schema |

---

## Package Namespaces

| Namespace | Purpose |
|-----------|---------|
| `com.terraai.aimobility` | OpusAIMobility core (AWS Amplify, Cognito, S3, WebSocket) |
| `com.yna.opusaimobilityapp` | OpusAIMobility source (Ride, Food, Parcel, Chat, Map features) |

Both coexist in the same APK. The OpusAIMobility source provides the **UI, layout and feature logic**
while OpusAIMobility replaces the backend with AWS services.

---

## App Theme & Layout Preserved

- **Primary colour:** `#00b14f` (OpusAIMobility green)
- **Font family:** Airbnb Cereal (Light, Book, Medium, Bold, ExtraBold, Black)
- **Theme:** `Theme.MaterialComponents.Light.NoActionBar`
- **165 screen layouts** preserved exactly as designed
- **Splash theme** with green status bar

---

## Database Schema (`opusaimobility-schema.sql`)

The SQL file (`113 KB`) contains the full OpusAIMobility MySQL schema including:

| Table Category | Tables |
|----------------|--------|
| Users & Auth | `users`, `user_devices`, `otp_codes` |
| Rides | `rides`, `ride_types`, `vehicle_types`, `ride_history` |
| Food Delivery | `restaurants`, `menus`, `menu_items`, `food_orders`, `order_items` |
| Parcel Delivery | `parcels`, `parcel_types`, `parcel_history` |
| Payments | `payment_methods`, `transactions`, `wallets`, `promo_codes` |
| Location | `saved_places`, `locations`, `delivery_addresses` |
| Notifications | `notifications`, `push_tokens` |
| Reviews | `ratings`, `reviews` |
| Admin | `categories`, `banners`, `settings` |

> **To use with OpusAIMobility's DynamoDB infrastructure**, see `infrastructure/` for
> the DynamoDB table equivalents. The SQL schema serves as the canonical data model reference.

---

## CI/CD Changes

The `deploy.yml` workflow now includes a **`build-android-customer`** job that:

1. Triggers on changes to `MobilityAIapp/android/customer/**` (or force deploy)
2. Sets up JDK 17 + Gradle caching
3. Decodes release keystore from `KEYSTORE_BASE64` secret (gracefully skips if absent)
4. Builds **debug APK** (always) and **release APK** (when keystore present)
5. Uploads APK as GitHub Actions artifact (debug: 30 days, release: 90 days)
6. Pushes both APKs to S3 bucket `opusaimobility-apk-distribution`

### Required GitHub Secrets for Android builds

| Secret | Required | Description |
|--------|----------|-------------|
| `JITPACK_TOKEN` | Optional | Prevents JitPack 429 rate-limits |
| `KEYSTORE_BASE64` | Optional (release) | Base64-encoded .jks keystore |
| `KEYSTORE_PASSWORD` | Optional (release) | Keystore password |
| `KEY_ALIAS` | Optional (release) | Key alias |
| `KEY_PASSWORD` | Optional (release) | Key password |
| `S3_APK_BUCKET` | Optional | S3 bucket for APK distribution |

---

## Change Log (from OpusAIMobility Dec 2022 source)

The following files were updated in the Dec 2022 release:
- `AndroidManifest.xml`
- `ChatA.java`
- `Notification_Receive.java`
- `ReviewDeliveryFragment.java`

---

## Build Configuration Notes

- **compileSdk / targetSdk:** Upgraded from 31 → 34 (matches OpusAIMobility baseline)
- **Firebase Crashlytics:** Added plugin (`com.google.firebase:firebase-crashlytics-gradle:2.9.1`)
- **Image Cropper:** Upgraded from `theartofdev.edmodo` → `com.vanniktech:android-image-cropper:4.3.3`
- **GeoFire:** `com.firebase:geofire-android:3.1.0` added for real-time driver location
- **BouncyCastle:** Forced to `1.70` to prevent AWS SDK vs iText7 conflict

---

## ✅ Tasks 1–3 Complete — OpusAIMobility → OpusAIMobility AWS Backend Integration

### Task 1 — `Constants.java` (yna namespace) → AWS endpoints
- `BASE_URL`  → `https://d22up4o3zhu9gf.cloudfront.net/` (CloudFront WAF proxy)
- `APILINK`   → `BASE_URL + "api/"`
- Added `COGNITO_USER_POOL_ID`, `COGNITO_APP_CLIENT_ID`, `COGNITO_IDENTITY_POOL`
- Added `WS_ENDPOINT` (WebSocket), `S3_BUCKET`, `SNS_TOPIC`
- Currency → `KSh`, Country → `KENYA / +254 / KE`
- Support email → `support@opusaimobility.com`

### Task 2 — `Singleton.java` → OkHttp + Retrofit + Cognito JWT
- **Removed** `retrofit-plus` `ApiClient` dependency (proprietary .aar)
- **Added** standard OkHttp 4.10.0 + Retrofit 2.9.0 client
- Auth interceptor automatically attaches `Authorization: Bearer <jwt>` from
  SharedPreferences (`u_token`) on every request
- Added `X-App-Version: 1.7` and `X-Platform: android` headers
- `Singleton.reset()` clears cached client (called on login/logout + app start)

### Task 3 — `OpusAIMobility.java` merged with `AWSManager`
- `AWSManager.getInstance(this)` initialised after Firebase
- `AWSPushService.registerToken()` re-registers SNS token on warm start
- WebSocket (`AWSManager.startWebSocket`) started if user is already logged in
- Singleton reset ensures Retrofit picks up fresh JWT on next API call
- AndroidManifest `android:name` → `com.yna.opusaimobilityapp.codeclasses.OpusAIMobility`

### Rename Summary
All `OpusAIMobility` references across **913 files** renamed to `OpusAIMobility`:
- File/dir names: APK → `OpusAIMobility-Customer-debug.apk`, SQL → `OpusAIMobility-schema.sql`
- Java packages: `com.yna.opusaimobilityapp` → `com.yna.opusaimobilityapp`
- Java class: `OpusAIMobility.java` → `OpusAIMobility.java`
- String values: display text, tags, promo codes, UI copy
