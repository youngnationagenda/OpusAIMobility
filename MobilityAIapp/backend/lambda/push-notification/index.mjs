/**
 * OpusAIMobility — Push Notification Lambda
 * ──────────────────────────────────────────
 * Delivery stack (in priority order):
 *   1. FCM (Firebase Admin SDK HTTP v1)  — real Android device push
 *   2. AWS IoT Core MQTT                 — in-app real-time delivery
 *   3. API Gateway WebSocket             — browser / active-session fallback
 *
 * Event sources:
 *   • SNS subscription  (opusaimobility-notifications topic)
 *   • Pinpoint custom channel
 *   • Direct Lambda invocation  { userId, notification }
 *
 * FCM service account loaded from:
 *   AWS Secrets Manager: opusaimobility/firebase-service-account
 */

import { IoTDataPlaneClient, PublishCommand }        from '@aws-sdk/client-iot-data-plane';
import { PinpointClient, PutEventsCommand }          from '@aws-sdk/client-pinpoint';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBClient }                            from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import https from 'https';

const REGION              = process.env.AWS_REGION       || 'us-east-1';
const IOT_ENDPOINT        = process.env.IOT_ENDPOINT     || 'arqymixni12gc-ats.iot.us-east-1.amazonaws.com';
const WS_ENDPOINT         = process.env.WS_ENDPOINT      || 'https://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod';
const PINPOINT_APP_ID     = process.env.PINPOINT_APP_ID;
const WS_CONNECTIONS_TABLE  = 'omniride-connections';
const PUSH_ENDPOINTS_TABLE  = 'opusaimobility-push-endpoints';
const FCM_SECRET_ID         = 'opusaimobility/firebase-service-account';

// ── AWS Clients ───────────────────────────────────────────────────────────────
const iotClient       = new IoTDataPlaneClient({ region: REGION, endpoint: `https://${IOT_ENDPOINT}` });
const pinpointClient  = new PinpointClient({ region: REGION });
const ddbClient       = new DynamoDBClient({ region: REGION });
const ddb             = DynamoDBDocumentClient.from(ddbClient);
const wsClient        = new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT });
const smClient        = new SecretsManagerClient({ region: REGION });

// ── Firebase service account cache ───────────────────────────────────────────
let _fcmServiceAccount = null;
let _fcmAccessToken    = null;
let _fcmTokenExpiry    = 0;

async function getServiceAccount() {
  if (_fcmServiceAccount) return _fcmServiceAccount;
  try {
    const secret = await smClient.send(new GetSecretValueCommand({ SecretId: FCM_SECRET_ID }));
    _fcmServiceAccount = JSON.parse(secret.SecretString);
    console.log('[FCM] Service account loaded for project:', _fcmServiceAccount.project_id);
    return _fcmServiceAccount;
  } catch (e) {
    console.error('[FCM] Failed to load service account:', e.message);
    return null;
  }
}

/**
 * Generate a Google OAuth2 access token using the service account private key.
 * Uses the google-auth-library pattern (JWT → token exchange).
 * Caches token until 5 minutes before expiry.
 */
async function getFCMAccessToken() {
  const now = Date.now();
  if (_fcmAccessToken && now < _fcmTokenExpiry) return _fcmAccessToken;

  const sa = await getServiceAccount();
  if (!sa) return null;

  // Build JWT header + payload
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   Math.floor(now / 1000),
    exp:   Math.floor(now / 1000) + 3600,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${b64(header)}.${b64(payload)}`;

  // Sign with private key using Node.js crypto (built-in to Lambda)
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const formData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  const tokenRes = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path:     '/token',
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('Token parse error: ' + data)); }
        });
      }
    );
    req.on('error', reject);
    req.write(formData);
    req.end();
  });

  if (!tokenRes.access_token) {
    console.error('[FCM] Token exchange failed:', JSON.stringify(tokenRes));
    return null;
  }

  _fcmAccessToken = tokenRes.access_token;
  _fcmTokenExpiry = now + (tokenRes.expires_in - 300) * 1000; // expire 5min early
  console.log('[FCM] Access token obtained, expires in', tokenRes.expires_in, 's');
  return _fcmAccessToken;
}

/**
 * Send FCM notification via HTTP v1 API to a single device token.
 * Returns: { success: true } | { success: false, error, shouldRemoveToken }
 */
async function sendFCMToToken(deviceToken, notification) {
  const sa          = await getServiceAccount();
  const accessToken = await getFCMAccessToken();
  if (!sa || !accessToken) return { success: false, error: 'FCM not configured' };

  const message = {
    message: {
      token: deviceToken,
      notification: {
        title: notification.title || 'OpusAI Mobility',
        body:  notification.body  || '',
      },
      data: {
        type:      notification.type  || 'general',
        ...(notification.data || {}),
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'aimobility_push',
          priority:   'max',
          default_sound:   true,
          default_vibrate_timings: true,
        },
      },
    },
  };

  const body = JSON.stringify(message);

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'fcm.googleapis.com',
        path:     `/v1/projects/${sa.project_id}/messages:send`,
        method:   'POST',
        headers:  {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 200) {
              console.log('[FCM] Sent to token ...', deviceToken.slice(-12), '→', parsed.name);
              resolve({ success: true, messageId: parsed.name });
            } else {
              const errCode = parsed?.error?.details?.[0]?.errorCode || parsed?.error?.status || 'UNKNOWN';
              const staleTokenCodes = [
                'UNREGISTERED',
                'INVALID_ARGUMENT',
                'REGISTRATION_TOKEN_NOT_REGISTERED',
              ];
              const shouldRemoveToken = staleTokenCodes.includes(errCode);
              console.warn('[FCM] Send failed:', errCode, shouldRemoveToken ? '(stale — will remove)' : '');
              resolve({ success: false, error: errCode, shouldRemoveToken });
            }
          } catch (e) {
            resolve({ success: false, error: 'parse: ' + e.message });
          }
        });
      }
    );
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(body);
    req.end();
  });
}

/**
 * Get all FCM device tokens for a user from DynamoDB.
 */
async function getDeviceTokens(userId) {
  try {
    const result = await ddb.send(new QueryCommand({
      TableName:                 PUSH_ENDPOINTS_TABLE,
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));
    return result.Items || [];
  } catch (e) {
    console.warn('[FCM] getDeviceTokens error:', e.message);
    return [];
  }
}

/**
 * Remove a stale/invalid device token from DynamoDB.
 */
async function removeStaleToken(userId, deviceToken) {
  try {
    await ddb.send(new DeleteCommand({
      TableName: PUSH_ENDPOINTS_TABLE,
      Key:       { userId, deviceToken },
    }));
    console.log('[FCM] Removed stale token for user', userId, '...', deviceToken.slice(-12));
  } catch (e) {
    console.warn('[FCM] removeStaleToken error:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAMBDA HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  console.log('Push notification event:', JSON.stringify(event));

  // Direct invocation
  if (event.userId && event.notification) {
    return await sendDirectNotification(event.userId, event.notification);
  }

  // Pinpoint custom channel
  if (event.Endpoints) {
    return await handlePinpointCustomChannel(event);
  }

  // SNS event (opusaimobility-notifications topic)
  if (event.Records) {
    for (const record of event.Records) {
      const message = JSON.parse(record.Sns.Message);
      if (message.userId && message.notification) {
        await sendDirectNotification(message.userId, message.notification);
      } else if (message.userId && (message.title || message.body)) {
        // Compact SNS publish format: { userId, title, body, type }
        await sendDirectNotification(message.userId, {
          title: message.title,
          body:  message.body || message.message,
          type:  message.type || 'general',
          data:  message.data || {},
        });
      }
    }
    return { statusCode: 200, body: 'Processed' };
  }

  return { statusCode: 400, body: 'Unknown event format' };
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE DELIVERY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send notification to a user via all available channels.
 * Priority: FCM → IoT MQTT → WebSocket
 */
async function sendDirectNotification(userId, notification) {
  const notificationId = generateId();
  let fcmDelivered     = false;
  let fcmTokensReached = 0;

  // ── 1. FCM delivery (real Android push) ────────────────────────────────────
  const tokens = await getDeviceTokens(userId);
  if (tokens.length > 0) {
    const fcmResults = await Promise.allSettled(
      tokens.map(async (t) => {
        const result = await sendFCMToToken(t.deviceToken, notification);
        if (result.shouldRemoveToken) {
          await removeStaleToken(userId, t.deviceToken);
        }
        return result;
      })
    );

    fcmTokensReached = fcmResults.filter(
      (r) => r.status === 'fulfilled' && r.value?.success
    ).length;
    fcmDelivered = fcmTokensReached > 0;

    console.log(`[FCM] User ${userId}: ${fcmTokensReached}/${tokens.length} tokens delivered`);
  } else {
    console.log(`[FCM] User ${userId}: no registered device tokens`);
  }

  // ── 2. IoT Core MQTT (in-app real-time) ────────────────────────────────────
  let iotDelivered = false;
  try {
    const topic   = `opusaimobility/notifications/${userId}`;
    const payload = {
      type:           notification.type || 'general',
      title:          notification.title,
      body:           notification.body,
      data:           notification.data || {},
      timestamp:      new Date().toISOString(),
      notificationId,
    };
    await iotClient.send(new PublishCommand({
      topic,
      payload: Buffer.from(JSON.stringify(payload)),
      qos:     1,
    }));
    iotDelivered = true;

    if (PINPOINT_APP_ID) {
      await trackDeliveryEvent(userId, notificationId, 'delivered').catch(() => {});
    }
  } catch (e) {
    console.warn('[IoT] MQTT publish failed:', e.message);
  }

  // ── 3. WebSocket fallback (active browser/app session) ─────────────────────
  const wsResult = await sendViaWebSocket(userId, notification).catch(() => ({ sent: 0 }));

  console.log(
    `[Push] User ${userId} — FCM:${fcmDelivered ? fcmTokensReached + ' devices' : 'none'} | IoT:${iotDelivered ? 'ok' : 'fail'} | WS:${wsResult.sent}`
  );

  return {
    statusCode:      200,
    body:            'Sent',
    notificationId,
    fcmTokensReached,
    iotDelivered,
    wsConnections:   wsResult.sent,
  };
}

/**
 * WebSocket delivery via API Gateway Management API.
 * Uses omniride-connections table (userId-index GSI).
 */
async function sendViaWebSocket(userId, notification) {
  try {
    const result = await ddb.send(new QueryCommand({
      TableName:                 WS_CONNECTIONS_TABLE,
      IndexName:                 'userId-index',
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));

    const connections = result.Items || [];
    if (connections.length === 0) return { sent: 0, reason: 'no active connections' };

    const payload = Buffer.from(JSON.stringify({
      action:    'notification',
      type:      notification.type || 'general',
      title:     notification.title,
      body:      notification.body,
      data:      notification.data || {},
      timestamp: new Date().toISOString(),
    }));

    let sent = 0;
    for (const conn of connections) {
      try {
        await wsClient.send(new PostToConnectionCommand({ ConnectionId: conn.connectionId, Data: payload }));
        sent++;
      } catch (e) {
        console.warn('[WS] Stale connection', conn.connectionId, ':', e.message);
      }
    }
    return { sent, total: connections.length };
  } catch (e) {
    console.warn('[WS] Bridge failed:', e.message);
    return { sent: 0, error: e.message };
  }
}

/**
 * Handle Pinpoint custom channel campaign/journey events.
 */
async function handlePinpointCustomChannel(event) {
  const results = [];
  for (const [endpointId, endpoint] of Object.entries(event.Endpoints)) {
    const userId = endpoint.User?.UserId || endpoint.Address;
    if (!userId) { results.push({ endpointId, status: 'skipped', reason: 'no userId' }); continue; }

    const notification = {
      type:  event.CampaignId ? 'campaign' : 'journey',
      title: event.Message?.Title  || 'OpusAI Mobility',
      body:  event.Message?.Body   || '',
      data:  event.Message?.CustomPayload ? JSON.parse(event.Message.CustomPayload) : {},
    };

    const result = await sendDirectNotification(userId, notification);
    results.push({ endpointId, userId, status: result.statusCode === 200 ? 'sent' : 'failed' });
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  console.log(`[Pinpoint] Batch complete: ${sent}/${results.length} delivered`);
  return results;
}

/**
 * Track delivery events in Pinpoint for analytics.
 */
async function trackDeliveryEvent(userId, notificationId, status) {
  try {
    await pinpointClient.send(new PutEventsCommand({
      ApplicationId: PINPOINT_APP_ID,
      EventsRequest: {
        BatchItem: {
          [userId]: {
            Endpoint: { Address: userId },
            Events: {
              [notificationId]: {
                EventType:  `push.${status}`,
                Timestamp:  new Date().toISOString(),
                Attributes: { notificationId, channel: 'fcm+iot' },
              },
            },
          },
        },
      },
    }));
  } catch (e) {
    console.warn('[Pinpoint] Tracking failed (non-critical):', e.message);
  }
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
