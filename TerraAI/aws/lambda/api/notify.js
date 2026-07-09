/**
 * notify.js — Push real-time notifications to connected WebSocket clients
 * Used by the main API Lambda when events occur (ride booked, order status change, etc.)
 */
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'us-east-1';
const WS_ENDPOINT = process.env.WS_ENDPOINT;
if (!WS_ENDPOINT) { console.warn('[notify] WS_ENDPOINT not set — notifications disabled'); }
const WS_TABLE = 'aimobility-ws-connections';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const apigw = WS_ENDPOINT ? new ApiGatewayManagementApiClient({ endpoint: WS_ENDPOINT, region: REGION }) : null;

async function notifyUser(userId, type, data = {}) {
  if (!userId || !apigw) return { sent: 0 };

  const res = await ddb.send(new QueryCommand({
    TableName: WS_TABLE,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));

  const connections = res.Items || [];
  if (connections.length === 0) return { sent: 0, noConnections: true };

  const payload = JSON.stringify({ action: 'notification', type, data, ts: Date.now() });
  let sent = 0;

  for (const conn of connections) {
    try {
      await apigw.send(new PostToConnectionCommand({
        ConnectionId: conn.connectionId,
        Data: Buffer.from(payload),
      }));
      sent++;
    } catch (e) {
      console.error(`[notify] Failed to send to connection ${conn.connectionId}:`, e.message);
      if (e.$metadata?.httpStatusCode === 410) {
        await ddb.send(new DeleteCommand({ TableName: WS_TABLE, Key: { connectionId: conn.connectionId } })).catch((err) => {
          console.error(`[notify] Failed to delete stale connection ${conn.connectionId}:`, err.message);
        });
      }
    }
  }

  return { sent, total: connections.length };
}

module.exports = { notifyUser };
