# FCM SNS Platform Application Setup

## Status: ⏳ Waiting for FCM Server Key

AWS SNS requires a valid FCM Server Key to create the platform application. Once you have it, run:

```bash
aws sns create-platform-application \
  --name opusaimobility-fcm \
  --platform GCM \
  --attributes PlatformCredential=YOUR_FCM_SERVER_KEY \
  --region us-east-1
```

## Alternative: FCM v1 API (Recommended)

If using the newer FCM v1 API with service account credentials:

```bash
aws sns create-platform-application \
  --name opusaimobility-fcm \
  --platform GCM \
  --attributes PlatformCredential=YOUR_FCM_V1_SERVICE_ACCOUNT_JSON \
  --region us-east-1
```

## After Creation

The returned `PlatformApplicationArn` needs to be added to:
1. The `omniride-api` Lambda environment variable `FCM_PLATFORM_ARN`
2. The `terraaimobility-api` Lambda environment variable `FCM_PLATFORM_ARN`
3. The `.env.local` file as `VITE_FCM_PLATFORM_ARN`

## Where to Get the FCM Key

1. Go to https://console.firebase.google.com
2. Select your project
3. Project Settings → Cloud Messaging
4. Copy the "Server key" (legacy) or download Service Account JSON (v1)
