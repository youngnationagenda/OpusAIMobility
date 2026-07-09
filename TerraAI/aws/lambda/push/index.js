/**
 * aimobility Push Notification Lambda  v2.0
 *
 * Changes vs v1:
 *  - Dead Letter Queue (SQS) attached via AWS console/CLI for failed invocations
 *  - Retry logic: up to 3 attempts with 200 ms back-off before giving up
 *  - Disabled-endpoint auto-cleanup on InvalidParameter / EndpointDisabled
 *  - Full push token registration flow matched to AWSPushService.java
 *
 * Actions:
 *   registerToken   — store device token → SNS Platform Endpoint
 *   sendPush        — unicast to a user (all their active devices)
 *   sendRideUpdate  — ride status change notification
 *   sendOrderUpdate — food/parcel order status change notification
 *   broadcast       — SNS topic fan-out
 *   health          — liveness check
 */

const {
  SNSClient,
  CreatePlatformEndpointCommand,
  PublishCommand,
  SetEndpointAttributesCommand,
  GetEndpointAttributesCommand,
} = require("@aws-sdk/client-sns");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const REGION          = process.env.AWS_REGION            || "us-east-1";
const _RAW_ARN        = process.env.SNS_PLATFORM_APP_ARN  || "";
const APP_ARN         = (_RAW_ARN && _RAW_ARN.startsWith("arn:aws:sns")) ? _RAW_ARN : "";
const TOPIC_PUSH      = process.env.SNS_TOPIC_PUSH  || "arn:aws:sns:us-east-1:683541453923:aimobility-push-notifications";
const TOPIC_RIDE      = process.env.SNS_TOPIC_RIDE  || "arn:aws:sns:us-east-1:683541453923:aimobility-ride-events";
const TOPIC_ORDER     = process.env.SNS_TOPIC_ORDER || "arn:aws:sns:us-east-1:683541453923:aimobility-order-events";
const ENDPOINTS_TABLE = "aimobility-push-endpoints";
const MAX_RETRIES     = 3;
const RETRY_DELAY_MS  = 200;

const sns = new SNSClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// ── Helpers ───────────────────────────────────────────────────────────────────
function resp(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(body),
  };
}
const ok  = data => resp(200, { code: "200", data });
const err = msg  => resp(200, { code: "400", msg });

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Retry wrapper — retries on transient SNS/DynamoDB errors up to MAX_RETRIES.
 * Does NOT retry on InvalidParameter or EndpointDisabled (those are permanent).
 */
async function withRetry(fn, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const isPermanent =
        e.name === "InvalidParameterException" ||
        (e.message && (e.message.includes("EndpointDisabled") || e.message.includes("InvalidParameter")));
      if (isPermanent) throw e;
      console.warn(`[Push] ${label} attempt ${attempt}/${MAX_RETRIES} failed: ${e.message}`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw lastErr;
}

// ── Register device token → SNS Endpoint ─────────────────────────────────────
async function registerToken(userId, deviceToken, platform = "GCM") {
  if (!APP_ARN) {
    // SNS Platform Application not yet configured — store token only.
    // Push will activate automatically once FCM key is set and APP_ARN env var added.
    await ddb.send(new PutCommand({
      TableName: ENDPOINTS_TABLE,
      Item: {
        endpointId:     `${userId}#${deviceToken}`,
        userId,
        deviceToken,
        platform,
        snsEndpointArn: "PENDING_SNS_PLATFORM_APP",
        enabled:        true,
        createdAt:      new Date().toISOString(),
        updatedAt:      new Date().toISOString(),
      },
    }));
    console.log(`[Push] SNS Platform App not configured — token stored for user ${userId}`);
    return { endpointArn: "PENDING_SNS_PLATFORM_APP", userId, deviceToken, status: "pending_config" };
  }

  let endpointArn;

  try {
    // Create SNS Platform Endpoint (idempotent — returns existing ARN if token already registered)
    const createRes = await withRetry(
      () => sns.send(new CreatePlatformEndpointCommand({
        PlatformApplicationArn: APP_ARN,
        Token:          deviceToken,
        CustomUserData: userId,
        Attributes:     { Enabled: "true" },
      })),
      "CreatePlatformEndpoint"
    );
    endpointArn = createRes.EndpointArn;
  } catch (e) {
    // SNS returns a non-retryable error that embeds the existing ARN in the message
    const match = e.message && e.message.match(/Endpoint (arn:aws:sns:[^\s]+)/);
    if (match) {
      endpointArn = match[1];
    } else {
      throw e;
    }
  }

  // Always refresh token + re-enable endpoint (handles reinstalls / token rotation)
  await withRetry(
    () => sns.send(new SetEndpointAttributesCommand({
      EndpointArn: endpointArn,
      Attributes:  { Enabled: "true", Token: deviceToken },
    })),
    "SetEndpointAttributes"
  );

  // Persist in DynamoDB
  await ddb.send(new PutCommand({
    TableName: ENDPOINTS_TABLE,
    Item: {
      endpointId:     `${userId}#${deviceToken}`,
      userId,
      deviceToken,
      platform,
      snsEndpointArn: endpointArn,
      enabled:        true,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
    },
  }));

  console.log(`[Push] Registered endpoint ${endpointArn} for user ${userId}`);
  return { endpointArn, userId, deviceToken, status: "registered" };
}

// ── Send push to a specific user (all active devices, with retry) ─────────────
async function sendToUser(userId, title, message, data = {}) {
  if (!APP_ARN) {
    console.log(`[Push] No SNS Platform App — skipping push to user ${userId}: ${title}`);
    return { sent: 0, total: 0, pending: true };
  }

  const res = await ddb.send(new QueryCommand({
    TableName:                 ENDPOINTS_TABLE,
    IndexName:                 "userId-index",
    KeyConditionExpression:    "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
  }));

  const endpoints = (res.Items || []).filter(ep =>
    ep.enabled &&
    ep.snsEndpointArn &&
    ep.snsEndpointArn !== "PENDING_SNS_PLATFORM_APP"
  );

  const results = await Promise.allSettled(
    endpoints.map(ep => sendToEndpoint(ep, title, message, data))
  );

  const sent   = results.filter(r => r.status === "fulfilled" && r.value.status === "sent").length;
  const failed = results.filter(r => r.status === "rejected" || (r.value && r.value.status === "failed")).length;

  console.log(`[Push] User ${userId}: sent=${sent} failed=${failed} total=${endpoints.length}`);
  return { sent, failed, total: endpoints.length };
}

async function sendToEndpoint(ep, title, message, data = {}) {
  const gcmPayload = {
    notification: { title, body: message },
    data:         { ...data, title, body: message },
  };
  const snsMessage = { GCM: JSON.stringify(gcmPayload) };

  try {
    await withRetry(
      () => sns.send(new PublishCommand({
        TargetArn:        ep.snsEndpointArn,
        MessageStructure: "json",
        Message:          JSON.stringify(snsMessage),
      })),
      `Publish to ${ep.snsEndpointArn}`
    );
    return { endpoint: ep.snsEndpointArn, status: "sent" };
  } catch (e) {
    console.error(`[Push] Failed to send to endpoint ${ep.snsEndpointArn}: ${e.message}`);

    // Permanently disable stale endpoint in DynamoDB
    if (e.message && (e.message.includes("EndpointDisabled") || e.message.includes("InvalidParameter"))) {
      await ddb.send(new UpdateCommand({
        TableName:                 ENDPOINTS_TABLE,
        Key:                       { endpointId: ep.endpointId },
        UpdateExpression:          "SET enabled = :f, disabledAt = :t",
        ExpressionAttributeValues: { ":f": false, ":t": new Date().toISOString() },
      })).catch(() => {});
      console.log(`[Push] Disabled stale endpoint ${ep.snsEndpointArn}`);
    }
    return { endpoint: ep.snsEndpointArn, status: "failed", error: e.message };
  }
}

// ── Broadcast to SNS topic ────────────────────────────────────────────────────
async function broadcastToTopic(topicArn, subject, message, data = {}) {
  const payload = {
    default: message,
    GCM:     JSON.stringify({
      notification: { title: subject, body: message },
      data,
    }),
  };
  const res = await withRetry(
    () => sns.send(new PublishCommand({
      TopicArn:         topicArn,
      MessageStructure: "json",
      Message:          JSON.stringify(payload),
      Subject:          subject,
    })),
    `Broadcast to ${topicArn}`
  );
  return { messageId: res.MessageId };
}

// ── Lambda Handler ────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  console.log("[Push Lambda] event:", JSON.stringify(event));

  // OPTIONS pre-flight
  if (event.httpMethod === "OPTIONS" || event.requestContext?.http?.method === "OPTIONS") {
    return resp(200, { message: "OK" });
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {}

  const action =
    event.pathParameters?.action ||
    event.queryStringParameters?.action ||
    body.action ||
    "registerToken";

  try {
    switch (action) {

      case "registerToken": {
        const { userId, deviceToken, platform } = body;
        if (!userId || !deviceToken) return err("userId and deviceToken required");
        const result = await registerToken(userId, deviceToken, platform || "GCM");
        return ok(result);
      }

      case "sendPush": {
        const { userId, title, message, data } = body;
        if (!userId || !title || !message) return err("userId, title, message required");
        const result = await sendToUser(userId, title, message, data || {});
        return ok(result);
      }

      case "sendRideUpdate": {
        const { userId, rideId, status, message } = body;
        if (!userId) return err("userId required");
        const result = await sendToUser(
          userId,
          "Ride Update 🚗",
          message || `Your ride is now: ${status}`,
          { type: "ride_update", rideId, status }
        );
        return ok(result);
      }

      case "sendOrderUpdate": {
        const { userId, orderId, orderType, status, message } = body;
        if (!userId) return err("userId required");
        const emoji = orderType === "food" ? "🍔" : "📦";
        const result = await sendToUser(
          userId,
          `Order Update ${emoji}`,
          message || `Your order is now: ${status}`,
          { type: "order_update", orderId, orderType: orderType || "food", status }
        );
        return ok(result);
      }

      case "broadcast": {
        const { topicType, subject, message, data } = body;
        if (!subject || !message) return err("subject and message required");
        const topicMap = { push: TOPIC_PUSH, ride: TOPIC_RIDE, order: TOPIC_ORDER };
        const topicArn = topicMap[topicType] || TOPIC_PUSH;
        const result = await broadcastToTopic(topicArn, subject, message, data || {});
        return ok(result);
      }

      case "health":
        return ok({
          status:           "healthy",
          service:          "aimobility Push Lambda v2.0",
          snsAppConfigured: !!APP_ARN,
          dlqEnabled:       true,
          retryEnabled:     true,
          maxRetries:       MAX_RETRIES,
          topics:           { push: TOPIC_PUSH, ride: TOPIC_RIDE, order: TOPIC_ORDER },
        });

      default:
        return err(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error("[Push Lambda] Unhandled error:", e);
    return resp(500, { code: "500", msg: "Push error: " + e.message });
  }
};
