/**
 * notify.js — Push notifications via SNS (unified) + WebSocket (real-time)
 * 
 * Primary: Publishes to SNS topic `opusaimobility-notifications`
 *   → triggers opusaimobility-push-notification Lambda
 *   → delivers via IoT Core MQTT to device
 *
 * Secondary: Also sends via WebSocket for instant in-app delivery
 *   (for users with active WS connections)
 *
 * This replaces the old direct aimobility-push Lambda invocation.
 */
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'us-east-1';
const SNS_TOPIC = process.env.SNS_TOPIC_PUSH || 'arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications';
const WS_ENDPOINT = process.env.WS_ENDPOINT;
const WS_TABLE = 'aimobility-ws-connections';

const sns = new SNSClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const apigw = WS_ENDPOINT ? new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT, region: REGION }) : null;

/**
 * Sends a notification to a user via:
 * 1. SNS → push-notification Lambda → IoT Core MQTT → device (persistent delivery)
 * 2. WebSocket → instant in-app delivery (if connected)
 */
async function notifyUser(userId, type, data = {}) {
  if (!userId) return { sent: 0 };

  const results = { sns: false, ws: 0 };

  // 1. Publish to SNS (primary — guaranteed delivery via IoT Core)
  try {
    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC,
      Message: JSON.stringify({
        userId,
        notification: {
          title: data.title || formatTitle(type),
          body: data.body || data.message || formatBody(type, data),
          type,
          data
        }
      }),
      MessageAttributes: {
        userId: { DataType: 'String', StringValue: userId.toString() },
        notificationType: { DataType: 'String', StringValue: type }
      }
    }));
    results.sns = true;
  } catch (e) {
    console.error(`[notify] SNS publish failed for ${userId}:`, e.message);
  }

  // 2. Send via WebSocket (secondary — instant in-app if connected)
  if (apigw) {
    try {
      const res = await ddb.send(new QueryCommand({
        TableName: WS_TABLE,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId.toString() },
      }));

      const connections = res.Items || [];
      const payload = JSON.stringify({ action: 'notification', type, data, ts: Date.now() });

      for (const conn of connections) {
        try {
          await apigw.send(new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: Buffer.from(payload),
          }));
          results.ws++;
        } catch (e) {
          if (e.$metadata?.httpStatusCode === 410) {
            await ddb.send(new DeleteCommand({
              TableName: WS_TABLE,
              Key: { connectionId: conn.connectionId }
            })).catch(() => {});
          }
        }
      }
    } catch (e) {
      // WebSocket delivery is best-effort — SNS is the reliable path
      console.warn(`[notify] WS delivery failed for ${userId}:`, e.message);
    }
  }

  return { sent: results.ws, snsSent: results.sns };
}

/** Format a human-readable title from notification type */
function formatTitle(type) {
  const titles = {
    ride_confirmed: 'Ride Confirmed',
    ride_cancelled: 'Ride Cancelled',
    order_update: 'Order Update',
    parcel_update: 'Parcel Update',
    message: 'New Message',
    payment: 'Payment Update',
    driver_assigned: 'Driver Assigned',
    driver_arrived: 'Driver Arrived',
  };
  return titles[type] || 'OpusAI Mobility';
}

/** Format a notification body from type and data */
function formatBody(type, data) {
  if (data.message) return data.message;
  const bodies = {
    ride_confirmed: `Your ride is confirmed. ETA: ${data.eta || 'shortly'}`,
    ride_cancelled: 'Your ride has been cancelled',
    order_update: `Order ${data.orderId || ''} status: ${data.status || 'updated'}`,
    parcel_update: `Parcel ${data.orderId || ''}: ${data.status || 'updated'}`,
    message: data.body || 'You have a new message',
    driver_assigned: `A driver is on the way`,
    driver_arrived: 'Your driver has arrived',
  };
  return bodies[type] || 'You have a new notification';
}

module.exports = { notifyUser };
