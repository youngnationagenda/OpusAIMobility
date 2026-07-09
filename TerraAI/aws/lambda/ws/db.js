/**
 * db.js — DynamoDB connection management for WebSocket Lambda
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = 'aimobility-ws-connections';

async function saveConnection(connectionId, userId, metadata = {}) {
  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24h TTL
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: { connectionId, userId, ttl, connectedAt: new Date().toISOString(), ...metadata },
  }));
}

async function removeConnection(connectionId) {
  await ddb.send(new DeleteCommand({
    TableName: TABLE,
    Key: { connectionId },
  }));
}

async function getConnectionsByUserId(userId) {
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  return res.Items || [];
}

async function getAllConnections() {
  const res = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 1000 }));
  return res.Items || [];
}

module.exports = { saveConnection, removeConnection, getConnectionsByUserId, getAllConnections, TABLE };
