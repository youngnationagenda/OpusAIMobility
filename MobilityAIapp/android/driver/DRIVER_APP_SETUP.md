# OpusAIMobility Driver App — Setup Guide

## Architecture

```
Driver App (Android)
      │
      ├── Auth:        AWS Cognito  (us-east-1_LKa4ElQem)
      ├── API:         Lambda via CloudFront WAF (opusaimobility.yna.co.ke)
      ├── Real-time:   AWS API Gateway WebSocket (z4sof7ojdf)
      ├── Location:    GPS → IoT Core MQTT (arqymixni12gc-ats.iot.us-east-1.amazonaws.com)
      ├── Files:       S3 pre-signed PUT (opusaimobility-assets-prod)
      ├── Push:        FCM → SNS → aimobility-push Lambda
      └── Crash:       Firebase Crashlytics (project: opusaimobility)
```

## AWS Resources (All Live)

| Resource | Value |
|----------|-------|
| CloudFront API | `https://opusaimobility.yna.co.ke/` |
| API Gateway direct | `https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/` |
| Cognito User Pool | `us-east-1_LKa4ElQem` (terraaimobility-production) |
| Cognito App Client | `2am01r4fmsp0s08991ftgub887` (terraaimobility-android) |
| Cognito Identity Pool | `us-east-1:a89c4453-5965-4a4e-97c7-3ba1a99cdd38` |
| Cognito Hosted UI | `https://auth-opusaimobility.auth.us-east-1.amazoncognito.com` |
| WebSocket | `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` |
| S3 Bucket | `opusaimobility-assets-prod` |
| SNS Topic | `arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications` |
| IoT Endpoint | `arqymixni12gc-ats.iot.us-east-1.amazonaws.com` |
| Firebase Project | `opusaimobility` |

## Build Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17
- Android SDK 34 (API 34)
- Build Tools 34.0.0
- Gradle 8.4 (auto-downloaded via wrapper)

## Build Steps

### 1. Open in Android Studio
```
File → Open → android/driver/
```

### 2. Add google-services.json
The `google-services.json` in `app/` contains placeholder API keys.
To get the real file:
1. Go to https://console.firebase.google.com → opusaimobility project
2. Add Android app with package name: `com.opusaimobility.driver`
3. Download `google-services.json` → replace `app/google-services.json`

### 3. Set Google Maps API Key
Edit `app/src/main/res/values/strings.xml`:
```xml
<string name="google_maps_key">YOUR_REAL_GOOGLE_MAPS_KEY</string>
```
Or inject via the credential script:
```bash
node scripts/inject-credentials.cjs --service google \
  --maps-key AIzaSy... --client-id 123.apps.googleusercontent.com
```

### 4. Build Debug APK
```bash
cd android/driver
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

### 5. Build Release APK
The keystore is stored in AWS Secrets Manager (`opusaimobility/android-keystore`)
and has been extracted to `app/opusaimobility-driver.jks`.

```bash
export KEYSTORE_FILE=$(pwd)/app/opusaimobility-driver.jks
export KEYSTORE_PASSWORD="OpusAI2026@Keystore!"
export KEY_ALIAS="opusaimobility"
export KEY_PASSWORD="OpusAI2026@Key!"

./gradlew assembleRelease
```
Output: `app/build/outputs/apk/release/app-release.apk`

## App Package Structure

```
com.opusaimobility.driver
├── DriverApp.java          — Application class (Amplify + Firebase + Notifications)
├── Constants.java          — All AWS endpoints and app constants
├── NetworkSingleton.java   — Retrofit + OkHttp + JWT interceptor
├── ApiService.java         — All API endpoint definitions
├── model/
│   ├── ApiResponse.java    — Generic { code, msg } wrapper
│   └── UserModel.java      — DynamoDB aimobility-users schema
├── ui/
│   ├── splash/SplashActivity.java          — Launch + session check
│   ├── auth/LoginActivity.java             — Cognito JWT login
│   ├── auth/RegisterActivity.java          — New driver registration
│   ├── auth/OtpVerifyActivity.java         — SNS SMS OTP
│   ├── auth/ForgotPasswordActivity.java    — Password reset
│   ├── home/HomeActivity.java              — Dashboard (map + online toggle)
│   ├── ride/RideRequestActivity.java       — Incoming ride (countdown)
│   ├── ride/ActiveRideActivity.java        — Live ride (Google Maps)
│   ├── ride/RideCompleteActivity.java      — Post-ride rating
│   ├── ride/RideHistoryActivity.java       — Past trips
│   ├── delivery/DeliveryRequestActivity.java — Food/Parcel request
│   ├── delivery/ActiveDeliveryActivity.java  — Active delivery
│   ├── profile/ProfileActivity.java          — Edit profile + S3 upload
│   ├── profile/DocumentsActivity.java        — KYC document upload
│   ├── profile/EarningsActivity.java         — Earnings summary
│   └── settings/SettingsActivity.java        — Logout + support
├── services/
│   ├── LocationTrackingService.java    — Foreground GPS (5 sec interval)
│   ├── WebSocketService.java           — AWS API Gateway WSS
│   └── DriverFCMService.java           — Firebase Cloud Messaging
└── receivers/
    └── BootReceiver.java               — Restart services on reboot
```

## API Endpoints Used

All POST to `https://opusaimobility.yna.co.ke/api/`:

| Endpoint | Purpose |
|----------|---------|
| `login` | Driver login → JWT |
| `registerUser` | New driver → Cognito + DynamoDB |
| `sendOtp` / `verifyOtp` | SNS SMS phone verification |
| `getUserProfile` | Load driver profile from DynamoDB |
| `editProfile` | Update profile + GPS coordinates |
| `updateFcmToken` | Register FCM token for push |
| `upload` | Get S3 pre-signed PUT URL |
| `getRideHistory` | Driver trip history |
| `updateOrderStatus` | Update food order status |
| `parcel_changeStatus` | Update parcel delivery status |
| `getWalletBalance` | Driver wallet |
| `getNotifications` | Notification list |

## Online/Offline Flow

```
Driver toggles ONLINE
    → LocationTrackingService.startForeground()
    → FusedLocationProvider (5s interval, 10m min)
    → Location update → POST /api/editProfile { lat, long }
    → Location update → WebSocketService.broadcastLocation()
    → WebSocket sends { action: "location_update", lat, lng }
    → Rider's app receives real-time driver position on map

Driver receives ride request:
    → WebSocketService receives { action: "ride_request", ... }
    → LocalBroadcast → RideRequestActivity launches
    → 30-second countdown to accept/reject
    → Accept → POST /api/requestRide → ActiveRideActivity
```

## Keystore Information

| Property | Value |
|----------|-------|
| File | `app/opusaimobility-driver.jks` |
| Alias | `opusaimobility` |
| Algorithm | RSA 2048 + SHA256 |
| Valid until | 2053-11-24 |
| Secrets Manager | `opusaimobility/android-keystore` |

## CI/CD Integration

Add to your CI pipeline (GitHub Actions / AWS CodeBuild):

```yaml
- name: Decode keystore
  run: |
    aws secretsmanager get-secret-value \
      --secret-id opusaimobility/android-keystore \
      --query 'SecretString' --output text | \
    node -e "const s=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      require('fs').writeFileSync('app/release.jks',Buffer.from(s.keystoreBase64,'base64'));
      console.log('KEYSTORE_PASSWORD='+s.storePassword) >> $GITHUB_ENV;
      console.log('KEY_ALIAS='+s.keyAlias) >> $GITHUB_ENV;
      console.log('KEY_PASSWORD='+s.keyPassword) >> $GITHUB_ENV;"

- name: Build release APK
  env:
    KEYSTORE_FILE: app/release.jks
  run: ./gradlew assembleRelease

- name: Upload to S3
  run: |
    aws s3 cp app/build/outputs/apk/release/app-release.apk \
      s3://opusaimobility-apk-distribution/driver/driver-$(date +%Y%m%d-%H%M).apk
```
