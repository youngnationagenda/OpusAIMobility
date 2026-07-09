/**
 * notify.js — Send messages to connected WebSocket clients
 */
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const db = require('./db');

let apigw = null;

function getClient(domainName, stage) {
  if (!apigw) {
    const endpoint = `https://${domainName}/${stage}`;
    apigw = new ApiGatewayManagementApiClient({ endpoint, region: process.env.AWS_REGION || 'us-east-1' });
  }
  return apigw;
}

function initClient(endpoint) {
  apigw = new ApiGatewayManagementApiClient({ endpoint, region: process.env.AWS_REGION || 'us-east-1' });
}

async function sendToConnection(connectionId, payload, client) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  try {
    await client.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(data),
    }));
    return true;
  } catch (e) {
    if (e.statusCode === 410 || e.$metadata?.httpStatusCode === 410) {
      await db.removeConnection(connectionId);
      return false;
    }
    console.error(`[WS] Failed to send to ${connectionId}:`, e.message);
    return false;
  }
}

async function sendToUser(userId, payload, client) {
  const connections = await db.getConnectionsByUserId(userId);
  let sent = 0;
  for (const conn of connections) {
    const ok = await sendToConnection(conn.connectionId, payload, client);
    if (ok) sent++;
  }
  return { sent, total: connections.length };
}

async function broadcast(payload, client) {
  const connections = await db.getAllConnections();
  let sent = 0;
  for (const conn of connections) {
    const ok = await sendToConnection(conn.connectionId, payload, client);
    if (ok) sent++;
  }
  return { sent, total: connections.length };
}

module.exports = { getClient, initClient, sendToConnection, sendToUser, broadcast };
