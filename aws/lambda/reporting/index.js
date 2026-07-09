'use strict';
/**
 * terraai-reporting Lambda  v1.0 — TERRA-060
 * ────────────────────────────────────────────
 * Real financial reporting with DynamoDB aggregation.
 *
 * Routes:
 *   GET /reporting/financial          — daily aggregates (last 30d default)
 *   GET /reporting/financial?days=7   — configurable window
 *   GET /reporting/summary            — platform summary stats
 *   GET /reporting/gateways           — revenue by payment gateway
 *   GET /reporting/riders             — top earning riders
 *
 * Data source: opusaimobility-transactions (scan + group by date)
 * Performance: uses DynamoDB scan with filter on timestamp range
 * For production scale: replace with DynamoDB Streams → S3 Athena aggregation
 */

const { DynamoDBClient }           = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient,
        ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const REGION         = 'us-east-1';
const TABLE_TX       = 'opusaimobility-transactions';
const TABLE_USERS    = 'opusaimobility-users';
const TABLE_TRIPS    = 'opusaimobility-trips';
const TABLE_ORDERS   = 'opusaimobility-orders';
const TABLE_ERRANDS  = 'opusaimobility-errands';
const TABLE_CHAIN    = 'opusaimobility-blockchain';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' };
const ok   = (b) => ({ statusCode: 200, headers: CORS, body: JSON.stringify(b) });
const err  = (m, c = 500) => ({ statusCode: c, headers: CORS, body: JSON.stringify({ error: m }) });

// ── Scan with timestamp filter ────────────────────────────────────────────
async function scanSince(table, sinceMs, limit = 2000) {
  const items = [];
  let lastKey;
  do {
    const res = await ddb.send(new ScanCommand({
      TableName:        table,
      Limit:            limit,
      FilterExpression: '#ts >= :since',
      ExpressionAttributeNames:  { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':since': sinceMs },
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    }));
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey && items.length < 5000);
  return items;
}

// ── Format date as YYYY-MM-DD ─────────────────────────────────────────────
const toDate = (ts) => new Date(ts).toISOString().split('T')[0];

// ── GET /reporting/financial ─────────────────────────────────────────────
async function financialReport(days = 30) {
  const sinceMs = Date.now() - days * 86400000;
  const txs = await scanSince(TABLE_TX, sinceMs);

  // Group by date
  const byDate = {};
  for (const tx of txs) {
    const date = toDate(tx.timestamp);
    if (!byDate[date]) byDate[date] = { date, gross: 0, net: 0, fees: 0, inflow: 0, outflow: 0, count: 0, carbon_credits: 0 };
    const d  = byDate[date];
    const amt = parseFloat(tx.amount) || 0;
    d.count++;
    if (tx.direction === 'in'  && tx.status === 'successful') { d.inflow  += amt; d.gross += amt; }
    if (tx.direction === 'out' && tx.status === 'successful') { d.outflow += amt; }
  }

  // Fetch carbon credits minted per day
  try {
    const chainItems = await scanSince(TABLE_CHAIN, sinceMs, 500);
    for (const ev of chainItems) {
      if (ev.eventType === 'TOKEN_MINT') {
        const date = toDate(ev.timestamp);
        if (byDate[date]) byDate[date].carbon_credits += parseFloat(ev.payload?.credits || 0);
      }
    }
  } catch (_) { /* non-critical */ }

  // Calculate net (inflow - platform fee 10%)
  for (const d of Object.values(byDate)) {
    d.fees = parseFloat((d.gross * 0.10).toFixed(2));
    d.net  = parseFloat((d.gross - d.fees).toFixed(2));
    d.gross = parseFloat(d.gross.toFixed(2));
    d.inflow = parseFloat(d.inflow.toFixed(2));
    d.outflow = parseFloat(d.outflow.toFixed(2));
    d.carbon_credits = parseFloat(d.carbon_credits.toFixed(1));
  }

  const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  // Fill gaps with zero rows for every day in range
  const allDates = [];
  for (let i = 0; i < days; i++) {
    const d = toDate(Date.now() - (days - 1 - i) * 86400000);
    allDates.push(byDate[d] || { date: d, gross: 0, net: 0, fees: 0, inflow: 0, outflow: 0, count: 0, carbon_credits: 0 });
  }

  return ok(allDates);
}

// ── GET /reporting/summary ────────────────────────────────────────────────
async function summaryReport() {
  const [users, trips, orders, txs] = await Promise.all([
    ddb.send(new ScanCommand({ TableName: TABLE_USERS,  Select: 'COUNT' })),
    ddb.send(new ScanCommand({ TableName: TABLE_TRIPS,  Select: 'COUNT' })),
    ddb.send(new ScanCommand({ TableName: TABLE_ORDERS, Select: 'COUNT' })),
    ddb.send(new ScanCommand({ TableName: TABLE_TX })),
  ]);

  const txItems   = txs.Items || [];
  const today     = toDate(Date.now());
  const thisMonth = today.slice(0, 7);

  const todayTxs  = txItems.filter(t => toDate(t.timestamp) === today && t.status === 'successful');
  const monthTxs  = txItems.filter(t => toDate(t.timestamp).startsWith(thisMonth) && t.status === 'successful');
  const totalIn   = txItems.filter(t => t.direction === 'in'  && t.status === 'successful').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const totalOut  = txItems.filter(t => t.direction === 'out' && t.status === 'successful').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  const userItems  = (await ddb.send(new ScanCommand({ TableName: TABLE_USERS }))).Items || [];
  const activeRiders = userItems.filter(u => u.role === 'rider' && u.riderProfile?.online).length;
  const pendingKYC   = userItems.filter(u => u.status === 'pending').length;

  return ok({
    total_users:         users.Count || 0,
    total_trips:         trips.Count || 0,
    total_orders:        orders.Count || 0,
    total_transactions:  txItems.length,
    active_riders:       activeRiders,
    pending_kyc:         pendingKYC,
    revenue_today:       parseFloat(todayTxs.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0).toFixed(2)),
    revenue_month:       parseFloat(monthTxs.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0).toFixed(2)),
    total_inflow:        parseFloat(totalIn.toFixed(2)),
    total_outflow:       parseFloat(totalOut.toFixed(2)),
    net_revenue:         parseFloat((totalIn - totalOut).toFixed(2)),
    platform_fee_10pct:  parseFloat((totalIn * 0.10).toFixed(2)),
    generated_at:        new Date().toISOString(),
  });
}

// ── GET /reporting/gateways ───────────────────────────────────────────────
async function gatewayReport(days = 30) {
  const sinceMs = Date.now() - days * 86400000;
  const txs = await scanSince(TABLE_TX, sinceMs);

  const byGateway = {};
  for (const tx of txs.filter(t => t.status === 'successful')) {
    const gw = tx.gateway || 'Unknown';
    if (!byGateway[gw]) byGateway[gw] = { gateway: gw, total: 0, count: 0, direction: {} };
    byGateway[gw].total += parseFloat(tx.amount) || 0;
    byGateway[gw].count++;
    const dir = tx.direction || 'out';
    byGateway[gw].direction[dir] = (byGateway[gw].direction[dir] || 0) + (parseFloat(tx.amount) || 0);
  }

  const sorted = Object.values(byGateway)
    .map(g => ({ ...g, total: parseFloat(g.total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

  return ok(sorted);
}

// ── GET /reporting/riders ─────────────────────────────────────────────────
async function ridersReport(limit = 20) {
  const [tripsRes, usersRes] = await Promise.all([
    ddb.send(new ScanCommand({ TableName: TABLE_TRIPS })),
    ddb.send(new ScanCommand({ TableName: TABLE_USERS, FilterExpression: '#r = :r', ExpressionAttributeNames: { '#r': 'role' }, ExpressionAttributeValues: { ':r': 'rider' } })),
  ]);

  const trips   = tripsRes.Items  || [];
  const riders  = usersRes.Items  || [];

  const riderStats = {};
  for (const trip of trips.filter(t => t.riderId && t.status === 'completed')) {
    const id = trip.riderId;
    if (!riderStats[id]) riderStats[id] = { riderId: id, trips: 0, earnings: 0, distanceKm: 0 };
    riderStats[id].trips++;
    riderStats[id].earnings   += parseFloat(trip.price || 0) * 0.9;
    riderStats[id].distanceKm += parseFloat(trip.distanceKm || 0);
  }

  // Merge with rider profile for name
  const enriched = Object.values(riderStats).map(s => {
    const user = riders.find(r => r.id === s.riderId || r.riderProfile?.id === s.riderId);
    return {
      ...s,
      name:         user?.name || 'Unknown',
      rating:       user?.riderProfile?.rating || 0,
      online:       user?.riderProfile?.online || false,
      earnings:     parseFloat(s.earnings.toFixed(2)),
      distanceKm:   parseFloat(s.distanceKm.toFixed(1)),
    };
  }).sort((a, b) => b.earnings - a.earnings).slice(0, limit);

  return ok(enriched);
}

// ── Lambda Handler ────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const method  = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const rawPath = event.rawPath || event.path || '/reporting/financial';
  const qs      = event.queryStringParameters || {};
  const days    = parseInt(qs.days || '30', 10);

  if (method === 'OPTIONS') return ok({});

  console.log(`[Reporting] ${method} ${rawPath} days=${days}`);

  try {
    if (rawPath.includes('/summary'))  return await summaryReport();
    if (rawPath.includes('/gateways')) return await gatewayReport(days);
    if (rawPath.includes('/riders'))   return await ridersReport(parseInt(qs.limit || '20', 10));
    return await financialReport(days); // default: /reporting/financial
  } catch (e) {
    console.error('[Reporting] Error:', e.message);
    return err(e.message);
  }
};
