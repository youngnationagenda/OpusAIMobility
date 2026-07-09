'use strict';
/**
 * terraai-airtel Lambda  v1.0 — TERRA-022
 * ─────────────────────────────────────────
 * Airtel Money (Kenya/Africa) + T-Kash (Telkom Kenya) payment collection.
 *
 * Routes:
 *   POST /payments/airtel          — initiate Airtel Money collection
 *   POST /payments/airtel/callback — Airtel confirmation callback
 *   POST /payments/tkash           — initiate T-Kash collection
 *   POST /payments/tkash/callback  — T-Kash confirmation callback
 *
 * Both follow same pattern:
 *   1. Store pending tx in DynamoDB
 *   2. Call provider API (sandbox if PLACEHOLDER creds)
 *   3. Callback updates tx + wallet + SNS notification
 *
 * Credentials:
 *   Secrets Manager: terraai/airtel  { ClientId, ClientSecret, PinEncryptionKey, BaseUrl }
 *   Secrets Manager: terraai/tkash   { ConsumerKey, ConsumerSecret, ShortCode, BaseUrl }
 */

const { DynamoDBClient }           = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient,
        PutCommand, GetCommand,
        UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient,
        GetSecretValueCommand }      = require('@aws-sdk/client-secrets-manager');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const https  = require('https');
const crypto = require('crypto');

const REGION      = 'us-east-1';
const TABLE_TX    = 'opusaimobility-transactions';
const TABLE_USERS = 'opusaimobility-users';
const SNS_PUSH    = process.env.SNS_TOPIC_PUSH || 'arn:aws:sns:us-east-1:683541453923:opusaimobility-push-notifications';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const sm  = new SecretsManagerClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' };
const resp = (code, body) => ({ statusCode: code, headers: CORS, body: JSON.stringify(body) });
const genId = (p) => `${p}-${Date.now().toString(36).toUpperCase()}`;

// ── Secret loader with cache ────────────────────────────────────────────────
const _cache = {};
async function getSecret(name) {
  if (_cache[name]) return _cache[name];
  try {
    const s = await sm.send(new GetSecretValueCommand({ SecretId: name }));
    _cache[name] = JSON.parse(s.SecretString);
    return _cache[name];
  } catch (e) {
    console.warn(`[${name}] Secret load failed:`, e.message);
    return null;
  }
}

// ── Generic HTTPS helper ────────────────────────────────────────────────────
function httpsReq(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// ── Common: update tx + wallet + notify ────────────────────────────────────
async function settleTransaction(txId, success, ref, amount, userId, failReason) {
  if (success) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE_TX, Key: { id: txId },
      UpdateExpression: 'SET #s = :s, paymentRef = :r, completedAt = :ts',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'successful', ':r': ref, ':ts': Date.now() },
    }));
    const u = await ddb.send(new GetCommand({ TableName: TABLE_USERS, Key: { id: userId } }));
    if (u.Item) {
      const newBal = parseFloat(((parseFloat(u.Item.walletBalance) || 0) + parseFloat(amount)).toFixed(2));
      await ddb.send(new UpdateCommand({
        TableName: TABLE_USERS, Key: { id: userId },
        UpdateExpression: 'SET walletBalance = :b',
        ExpressionAttributeValues: { ':b': newBal },
      }));
    }
    await sns.send(new PublishCommand({
      TopicArn: SNS_PUSH,
      Message: JSON.stringify({ userId, title: '💚 Payment Confirmed', message: `${amount} received. Ref: ${ref}`, type: 'wallet_topup' }),
      Subject: 'Payment Confirmed',
    })).catch(() => {});
  } else {
    await ddb.send(new UpdateCommand({
      TableName: TABLE_TX, Key: { id: txId },
      UpdateExpression: 'SET #s = :s, failReason = :f, failedAt = :ts',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'failed', ':f': failReason || 'Unknown', ':ts': Date.now() },
    }));
    await sns.send(new PublishCommand({
      TopicArn: SNS_PUSH,
      Message: JSON.stringify({ userId, title: '❌ Payment Failed', message: `Payment failed: ${failReason}`, type: 'wallet_topup_failed' }),
      Subject: 'Payment Failed',
    })).catch(() => {});
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AIRTEL MONEY
// ════════════════════════════════════════════════════════════════════════════

async function airtelGetToken(creds) {
  const res = await httpsReq({
    hostname: creds.BaseUrl || 'openapiuat.airtel.africa',
    path: '/auth/oauth2/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { client_id: creds.ClientId, client_secret: creds.ClientSecret, grant_type: 'client_credentials' });
  if (!res.body.access_token) throw new Error('Airtel OAuth failed: ' + JSON.stringify(res.body));
  return res.body.access_token;
}

async function handleAirtelPush(b) {
  const { userId, phone, amount, country = 'KE', currency = 'KES' } = b;
  if (!userId || !phone || !amount) return resp(400, { error: 'userId, phone, amount required' });

  const txId = genId('AIR');
  const tx = {
    id: txId, userId, amount: parseFloat(amount), currency,
    status: 'pending', method: phone, gateway: 'Airtel Money',
    timestamp: Date.now(), description: 'Wallet Top-up via Airtel Money',
    userType: 'customer', direction: 'in',
  };
  await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));

  try {
    const creds = await getSecret('terraai/airtel');
    if (!creds || creds.ClientId === 'PLACEHOLDER') {
      console.log('[Airtel] Sandbox mode');
      tx.sandbox = true; tx.note = 'Set terraai/airtel secret for live Airtel Money';
      await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
      return resp(200, { transaction: tx });
    }

    const token = await airtelGetToken(creds);
    const normPhone = phone.replace(/^\+/, '').replace(/^0/, '254');
    const payload = {
      reference: txId, subscriber: { country, currency, msisdn: normPhone },
      transaction: { amount: Math.ceil(parseFloat(amount)), country, currency, id: txId },
    };

    const res = await httpsReq({
      hostname: creds.BaseUrl || 'openapiuat.airtel.africa',
      path: '/merchant/v1/payments/',
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Country': country, 'X-Currency': currency },
    }, payload);

    if (res.body.status?.code !== '200') throw new Error('Airtel push failed: ' + JSON.stringify(res.body));
    tx.airtelTxId = res.body.data?.transaction?.id;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
    console.log(`[Airtel] Push sent txId=${tx.airtelTxId}`);
    return resp(200, { transaction: tx });
  } catch (e) {
    console.error('[Airtel] error:', e.message);
    tx.status = 'failed'; tx.error = e.message;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
    return resp(200, { transaction: tx, error: e.message });
  }
}

async function handleAirtelCallback(body) {
  console.log('[Airtel] Callback:', JSON.stringify(body));
  const txId    = body.transaction?.id || body.reference;
  const success = body.transaction?.status_code === 'TS';
  const ref     = body.transaction?.airtel_money_id;
  const amt     = body.transaction?.amount;

  const scan = await ddb.send(new ScanCommand({
    TableName: TABLE_TX,
    FilterExpression: 'id = :t OR airtelTxId = :t',
    ExpressionAttributeValues: { ':t': txId },
  }));
  const tx = scan.Items?.[0];
  if (tx) await settleTransaction(tx.id, success, ref, amt || tx.amount, tx.userId, body.transaction?.message);
  return resp(200, { status: 'OK' });
}

// ════════════════════════════════════════════════════════════════════════════
// T-KASH (Telkom Kenya)
// ════════════════════════════════════════════════════════════════════════════

async function tkashGetToken(creds) {
  const auth = Buffer.from(`${creds.ConsumerKey}:${creds.ConsumerSecret}`).toString('base64');
  const res = await httpsReq({
    hostname: creds.BaseUrl || 'api.tkash.co.ke',
    path: '/oauth/token?grant_type=client_credentials',
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.body.access_token) throw new Error('T-Kash OAuth failed');
  return res.body.access_token;
}

async function handleTkashPush(b) {
  const { userId, phone, amount } = b;
  if (!userId || !phone || !amount) return resp(400, { error: 'userId, phone, amount required' });

  const txId = genId('TKS');
  const tx = {
    id: txId, userId, amount: parseFloat(amount), currency: 'KES',
    status: 'pending', method: phone, gateway: 'T-Kash',
    timestamp: Date.now(), description: 'Wallet Top-up via T-Kash',
    userType: 'customer', direction: 'in',
  };
  await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));

  try {
    const creds = await getSecret('terraai/tkash');
    if (!creds || creds.ConsumerKey === 'PLACEHOLDER') {
      console.log('[TKash] Sandbox mode');
      tx.sandbox = true; tx.note = 'Set terraai/tkash secret for live T-Kash';
      await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
      return resp(200, { transaction: tx });
    }

    const token = await tkashGetToken(creds);
    const ts    = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const pw    = Buffer.from(`${creds.ShortCode}${creds.PassKey || ''}${ts}`).toString('base64');
    const normPhone = phone.startsWith('+') ? phone.slice(1) : phone.replace(/^0/, '0722');

    const stkBody = JSON.stringify({
      BusinessShortCode: creds.ShortCode, Password: pw, Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline', Amount: Math.ceil(parseFloat(amount)),
      PartyA: normPhone, PartyB: creds.ShortCode, PhoneNumber: normPhone,
      CallBackURL: `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/payments/tkash/callback`,
      AccountReference: 'TerraAI-' + txId, TransactionDesc: 'OpusAIMobility Wallet Top-up',
    });

    const res = await httpsReq({
      hostname: creds.BaseUrl || 'api.tkash.co.ke',
      path: '/mpesa/stkpush/v1/processrequest',
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(stkBody) },
    }, stkBody);

    if (res.body.ResponseCode !== '0') throw new Error('T-Kash push failed: ' + JSON.stringify(res.body));
    tx.checkoutId = res.body.CheckoutRequestID;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
    console.log(`[TKash] Push sent checkoutId=${tx.checkoutId}`);
    return resp(200, { transaction: tx });
  } catch (e) {
    console.error('[TKash] error:', e.message);
    tx.status = 'failed'; tx.error = e.message;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
    return resp(200, { transaction: tx, error: e.message });
  }
}

async function handleTkashCallback(body) {
  console.log('[TKash] Callback:', JSON.stringify(body));
  const cb      = body?.Body?.stkCallback;
  if (!cb) return resp(200, { ResultCode: 0, ResultDesc: 'Accepted' });
  const checkoutId = cb.CheckoutRequestID;
  const success = cb.ResultCode === 0;
  const meta    = cb.CallbackMetadata?.Item || [];
  const ref     = meta.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
  const paid    = meta.find(i => i.Name === 'Amount')?.Value;

  const scan = await ddb.send(new ScanCommand({
    TableName: TABLE_TX,
    FilterExpression: 'checkoutId = :c',
    ExpressionAttributeValues: { ':c': checkoutId },
  }));
  const tx = scan.Items?.[0];
  if (tx) await settleTransaction(tx.id, success, ref, paid || tx.amount, tx.userId, cb.ResultDesc);
  return resp(200, { ResultCode: 0, ResultDesc: 'Accepted' });
}

// ── Lambda Handler ──────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const method  = event.requestContext?.http?.method || event.httpMethod || 'POST';
  const rawPath = event.rawPath || event.path || '/';

  let body = {};
  if (!rawPath.includes('/callback')) {
    try { body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {}; } catch (_) {}
  } else {
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {}); } catch (_) {}
  }

  if (method === 'OPTIONS') return resp(200, {});

  if (rawPath.includes('/airtel/callback')) return await handleAirtelCallback(body);
  if (rawPath.includes('/tkash/callback'))  return await handleTkashCallback(body);
  if (rawPath.includes('/airtel'))          return await handleAirtelPush(body);
  if (rawPath.includes('/tkash'))           return await handleTkashPush(body);

  return resp(404, { error: 'Route not found' });
};
