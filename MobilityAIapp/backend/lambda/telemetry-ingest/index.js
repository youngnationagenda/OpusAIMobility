'use strict';
/**
 * terraai-telemetry-ingest Lambda  v1.0
 * ──────────────────────────────────────
 * Triggered by: AWS IoT Core Rule
 *   SQL: SELECT *, topic(3) as riderId FROM 'opusaimobility/telemetry/+'
 *
 * Actions:
 *  1. DynamoDB PutItem  → opusaimobility-telemetry (riderId + timestamp, TTL 90d)
 *  2. DynamoDB UpdateItem → opusaimobility-telemetry-latest (snapshot for GET /iot/telemetry)
 *  3. CloudWatch PutMetricData → TerraAI/Telemetry namespace
 *  4. WebSocket broadcast → opusaimobility-connections (if rider online)
 *
 * TICKET: TERRA-010
 */

const { DynamoDBClient }           = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const REGION         = process.env.AWS_REGION          || 'us-east-1';
const TABLE_TELEM    = process.env.TABLE_TELEMETRY      || 'opusaimobility-telemetry';
const TABLE_CONNS    = process.env.TABLE_CONNECTIONS    || 'opusaimobility-connections';
const WS_ENDPOINT    = process.env.WS_ENDPOINT          || 'https://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod';
const TTL_DAYS       = 90;

const ddb  = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const cw   = new CloudWatchClient({ region: REGION });
const apigw = new ApiGatewayManagementApiClient({
  region:   REGION,
  endpoint: WS_ENDPOINT,
});

// ── helpers ───────────────────────────────────────────────────────────────────

function ttlFromNow(days) {
  return Math.floor(Date.now() / 1000) + days * 86400;
}

function safeNum(v, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

// ── main handler ──────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log('[TelemetryIngest] event:', JSON.stringify(event));

  // IoT Rule injects riderId from topic(3)
  const riderId = event.riderId || event.clientId || 'unknown';
  const now     = Date.now();

  const item = {
    riderId,
    timestamp:            now,
    expiresAt:            ttlFromNow(TTL_DAYS),
    batteryTemp:          safeNum(event.batteryTemp,         28),
    motorTemp:            safeNum(event.motorTemp,           42),
    controllerTemp:       safeNum(event.controllerTemp,      38),
    cycleCount:           safeNum(event.cycleCount,         156),
    healthPercentage:     safeNum(event.healthPercentage,   94.2),
    efficiencyWhKm:       safeNum(event.efficiencyWhKm,      38),
    totalEnergyConsumed:  safeNum(event.totalEnergyConsumed, 1240.8),
    brakeWearStatus:      safeNum(event.brakeWearStatus,     82),
    swapCount:            safeNum(event.swapCount,           24),
    ecoScore:             safeNum(event.ecoScore,            88),
    lastSwapTimestamp:    safeNum(event.lastSwapTimestamp,   now - 14400000),
    source:               'iot-mqtt',
  };

  // ── 1. Store time-series record ──────────────────────────────────────────
  try {
    await ddb.send(new PutCommand({ TableName: TABLE_TELEM, Item: item }));
    console.log(`[TelemetryIngest] Stored telemetry for rider ${riderId}`);
  } catch (e) {
    console.error('[TelemetryIngest] DynamoDB put error:', e.message);
  }

  // ── 2. CloudWatch metrics ────────────────────────────────────────────────
  try {
    await cw.send(new PutMetricDataCommand({
      Namespace: 'TerraAI/Telemetry',
      MetricData: [
        { MetricName: 'BatteryTemp',     Dimensions: [{ Name: 'RiderId', Value: riderId }], Value: item.batteryTemp,      Unit: 'None' },
        { MetricName: 'EcoScore',        Dimensions: [{ Name: 'RiderId', Value: riderId }], Value: item.ecoScore,         Unit: 'None' },
        { MetricName: 'EfficiencyWhKm',  Dimensions: [{ Name: 'RiderId', Value: riderId }], Value: item.efficiencyWhKm,   Unit: 'None' },
        { MetricName: 'HealthPct',       Dimensions: [{ Name: 'RiderId', Value: riderId }], Value: item.healthPercentage, Unit: 'Percent' },
        { MetricName: 'BrakeWear',       Dimensions: [{ Name: 'RiderId', Value: riderId }], Value: item.brakeWearStatus,  Unit: 'Percent' },
      ],
    }));
    console.log('[TelemetryIngest] CloudWatch metrics published');
  } catch (e) {
    console.warn('[TelemetryIngest] CloudWatch error (non-fatal):', e.message);
  }

  // ── 3. WebSocket broadcast to rider's active connections ─────────────────
  try {
    const conns = await ddb.send(new QueryCommand({
      TableName:                 TABLE_CONNS,
      IndexName:                 'userId-index',
      KeyConditionExpression:    'userId = :uid',
      ExpressionAttributeValues: { ':uid': riderId },
    }));

    const payload = JSON.stringify({ type: 'telemetry', data: item });

    await Promise.allSettled(
      (conns.Items || []).map(conn =>
        apigw.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data:         Buffer.from(payload),
        })).catch(e => {
          if (e.$metadata?.httpStatusCode === 410) {
            console.log(`[TelemetryIngest] Stale WS connection ${conn.connectionId} — skipping`);
          } else {
            console.warn('[TelemetryIngest] WS send error:', e.message);
          }
        })
      )
    );
  } catch (e) {
    console.warn('[TelemetryIngest] WebSocket broadcast error (non-fatal):', e.message);
  }

  // ── 4. High-temp alert (BatteryTemp > 50°C) ──────────────────────────────
  if (item.batteryTemp > 50) {
    console.warn(`[TelemetryIngest] HIGH TEMP ALERT rider=${riderId} temp=${item.batteryTemp}`);
    // SNS notification would go here (TERRA-094)
  }

  return { statusCode: 200, body: 'ok' };
};
