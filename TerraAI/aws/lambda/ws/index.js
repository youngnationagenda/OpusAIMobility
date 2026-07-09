'use strict';
/**
 * aimobility WebSocket Lambda  v2.0 — TERRA-040
 * ──────────────────────────────────────────────
 * Sprint 2 upgrade: adds real-time driver location broadcasting
 *
 * Actions:
 *   $connect          — authenticate via JWT, store connectionId → omniride-connections
 *   $disconnect       — remove connection record
 *   ping              — heartbeat / keep-alive
 *   updateLocation    — rider sends lat/lng → broadcast to customer on active ride
 *   subscribeRide     — customer subscribes to a specific rideId
 *   sendToUser        — server-side broadcast helper (internal)
 *   orderUpdate       — notify customer of order status change
 *
 * Auth: Cognito JWT via ?token= query param on $connect
 * Pool: us-east-1_LKa4ElQem (terraaimobility-production) — TERRA-001
 */

const { CognitoJwtVerifier }       = require('aws-jwt-verify');
const { DynamoDBClient }           = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient,
        PutCommand, DeleteCommand,
        GetCommand, QueryCommand,
        UpdateCommand }             = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient,
        PostToConnectionCommand }   = require('@aws-sdk/client-apigatewaymanagementapi');

const REGION       = 'us-east-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_LKa4ElQem';
const CLIENT_ID    = process.env.COGNITO_CLIENT_ID    || '2am01r4fmsp0s08991ftgub887';
const TABLE_CONNS  = process.env.TABLE_CONNECTIONS    || 'omniride-connections';
const TABLE_RIDES  = process.env.TABLE_RIDES          || 'omniride-trips';
const TTL_HOURS    = 24; // connections expire after 24 hours

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse:   'id',
  clientId:   CLIENT_ID,
});

// ── helpers ───────────────────────────────────────────────────────────────────

function resp(statusCode, body) {
  return { statusCode, body: typeof body === 'string' ? body : JSON.stringify(body) };
}

function getApigwClient(domainName, stage) {
  return new ApiGatewayManagementApiClient({
    region:   REGION,
    endpoint: `https://${domainName}/${stage}`,
  });
}

async function send(connectionId, data, client) {
  try {
    await client.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data:         Buffer.from(JSON.stringify(data)),
    }));
    return true;
  } catch (e) {
    if (e.$metadata?.httpStatusCode === 410) {
      // Stale connection — clean up
      await ddb.send(new DeleteCommand({ TableName: TABLE_CONNS, Key: { connectionId } })).catch(() => {});
      console.log(`[WS] Removed stale connection: ${connectionId}`);
    } else {
      console.warn(`[WS] Send failed to ${connectionId}:`, e.message);
    }
    return false;
  }
}

async function broadcastToUser(userId, data, client) {
  const res = await ddb.send(new QueryCommand({
    TableName:                 TABLE_CONNS,
    IndexName:                 'userId-index',
    KeyConditionExpression:    'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  const conns = res.Items || [];
  await Promise.allSettled(conns.map(c => send(c.connectionId, data, client)));
  return conns.length;
}

// ── $connect ──────────────────────────────────────────────────────────────────

async function handleConnect(event) {
  const connectionId = event.requestContext.connectionId;
  const params       = event.queryStringParameters || {};
  const token        = params.token;
  const userType     = params.type || 'customer'; // 'customer' | 'rider'

  if (!token) {
    console.warn(`[WS] $connect rejected: no token. connId=${connectionId}`);
    return resp(401, 'Authorization token required');
  }

  let userId, role;
  try {
    const claims = await verifier.verify(token);
    userId = claims.sub;
    role   = claims['custom:role'] || userType;
  } catch (e) {
    console.warn(`[WS] JWT invalid: ${e.message}`);
    return resp(401, 'Invalid token');
  }

  const ttl = Math.floor(Date.now() / 1000) + TTL_HOURS * 3600;

  await ddb.send(new PutCommand({
    TableName: TABLE_CONNS,
    Item: {
      connectionId,
      userId,
      role,
      type:      userType,
      connectedAt: Date.now(),
      ttl,
    },
  }));

  console.log(`[WS] $connect: connId=${connectionId} userId=${userId} role=${role}`);
  return resp(200, 'Connected');
}

// ── $disconnect ───────────────────────────────────────────────────────────────

async function handleDisconnect(event) {
  const connectionId = event.requestContext.connectionId;
  await ddb.send(new DeleteCommand({ TableName: TABLE_CONNS, Key: { connectionId } }));
  console.log(`[WS] $disconnect: connId=${connectionId}`);
  return resp(200, 'Disconnected');
}

// ── $default (action router) ──────────────────────────────────────────────────

async function handleDefault(event) {
  const connectionId = event.requestContext.connectionId;
  const domainName   = event.requestContext.domainName;
  const stage        = event.requestContext.stage;
  const client       = getApigwClient(domainName, stage);

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  const action = body.action || 'ping';

  console.log(`[WS] action=${action} connId=${connectionId}`);

  switch (action) {

    // ── TERRA-040: Real-time driver location ───────────────────────────────
    case 'updateLocation': {
      /**
       * Rider sends: { action: 'updateLocation', lat, lng, rideId, eta? }
       * Lambda:
       *  1. Look up the ride in omniride-trips to find customerId
       *  2. Broadcast { type:'driverLocation', lat, lng, eta, rideId } to all customer connections
       *  3. Update ride record with latest driver coords
       */
      const { lat, lng, rideId, eta } = body;
      if (!lat || !lng) {
        await send(connectionId, { type: 'error', msg: 'lat and lng required' }, client);
        return resp(400, 'Missing location');
      }

      // Get connection record to find riderId
      const connRec = await ddb.send(new GetCommand({
        TableName: TABLE_CONNS,
        Key:       { connectionId },
      }));
      const riderId = connRec.Item?.userId;
      if (!riderId) {
        return resp(400, 'Unknown connection');
      }

      // Broadcast to customer on this ride
      if (rideId) {
        const rideRec = await ddb.send(new GetCommand({
          TableName: TABLE_RIDES,
          Key:       { id: rideId },
        }));
        const customerId = rideRec.Item?.customerId;
        if (customerId) {
          const sent = await broadcastToUser(customerId, {
            type:    'driverLocation',
            rideId,
            lat:     parseFloat(lat),
            lng:     parseFloat(lng),
            eta:     eta || null,
            ts:      Date.now(),
          }, client);
          console.log(`[WS] Location broadcast rideId=${rideId} → ${sent} customer connections`);
        }

        // Update ride with latest driver position
        await ddb.send(new UpdateCommand({
          TableName:                 TABLE_RIDES,
          Key:                       { id: rideId },
          UpdateExpression:          'SET driverLat = :lat, driverLng = :lng, driverEta = :eta, lastLocationUpdate = :ts',
          ExpressionAttributeValues: {
            ':lat': parseFloat(lat),
            ':lng': parseFloat(lng),
            ':eta': eta || null,
            ':ts':  Date.now(),
          },
        })).catch(e => console.warn('[WS] Ride location update failed:', e.message));
      }

      // ACK back to rider
      await send(connectionId, { type: 'locationAck', ts: Date.now() }, client);
      return resp(200, 'OK');
    }

    // ── Customer subscribes to track a ride ───────────────────────────────
    case 'subscribeRide': {
      /**
       * Customer sends: { action: 'subscribeRide', rideId }
       * Lambda: tag the connection with the rideId so we can look it up
       */
      const { rideId } = body;
      if (!rideId) {
        await send(connectionId, { type: 'error', msg: 'rideId required' }, client);
        return resp(400, 'Missing rideId');
      }

      await ddb.send(new UpdateCommand({
        TableName:                 TABLE_CONNS,
        Key:                       { connectionId },
        UpdateExpression:          'SET activeRideId = :rid',
        ExpressionAttributeValues: { ':rid': rideId },
      }));

      await send(connectionId, { type: 'subscribed', rideId, ts: Date.now() }, client);
      console.log(`[WS] Customer subscribed to rideId=${rideId}`);
      return resp(200, 'OK');
    }

    // ── Order status push ─────────────────────────────────────────────────
    case 'orderUpdate': {
      const { userId, orderId, orderType, status, message } = body;
      if (!userId) {
        return resp(400, 'userId required');
      }
      const sent = await broadcastToUser(userId, {
        type:      'orderUpdate',
        orderId,
        orderType: orderType || 'food',
        status,
        message:   message || `Your ${orderType || 'order'} is now ${status}`,
        ts:        Date.now(),
      }, client);
      console.log(`[WS] orderUpdate userId=${userId} sent to ${sent} connections`);
      return resp(200, 'OK');
    }

    // ── Ride assigned notification ────────────────────────────────────────
    case 'rideAssigned': {
      const { customerId, rideId, riderName, eta } = body;
      if (customerId) {
        await broadcastToUser(customerId, {
          type:      'rideAssigned',
          rideId,
          riderName: riderName || 'Your rider',
          eta:       eta || '5 mins',
          ts:        Date.now(),
        }, client);
      }
      return resp(200, 'OK');
    }

    // ── Generic broadcast to user ─────────────────────────────────────────
    case 'sendToUser': {
      const { userId, type, data } = body;
      if (!userId) return resp(400, 'userId required');
      await broadcastToUser(userId, { type, data, ts: Date.now() }, client);
      return resp(200, 'OK');
    }

    // ── Ping / heartbeat ──────────────────────────────────────────────────
    case 'ping':
      await send(connectionId, { type: 'pong', ts: Date.now() }, client);
      return resp(200, 'OK');

    default:
      await send(connectionId, { type: 'error', msg: `Unknown action: ${action}` }, client);
      return resp(400, 'Unknown action');
  }
}

// ── Lambda handler ────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const route = event.requestContext?.routeKey;
  console.log(`[WS] route=${route} connId=${event.requestContext?.connectionId}`);

  try {
    switch (route) {
      case '$connect':    return await handleConnect(event);
      case '$disconnect': return await handleDisconnect(event);
      default:            return await handleDefault(event);
    }
  } catch (e) {
    console.error('[WS] Unhandled error:', e);
    return resp(500, 'Internal error');
  }
};
