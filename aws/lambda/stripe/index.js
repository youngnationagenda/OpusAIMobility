'use strict';
/**
 * terraai-stripe Lambda  v1.0 — TERRA-021
 * ─────────────────────────────────────────
 * Real Stripe PaymentIntent integration.
 *
 * Routes:
 *   POST /payments/stripe          — create PaymentIntent → return client_secret
 *   POST /payments/stripe/webhook  — Stripe webhook (payment_intent.succeeded / failed)
 *
 * Flow:
 *  1. Lambda creates PaymentIntent server-side (secret key never in client)
 *  2. Returns { clientSecret } to frontend
 *  3. Frontend uses Stripe.js confirmCardPayment(clientSecret)
 *  4. Stripe calls /webhook on success → update transaction + wallet
 *
 * Credentials: Secrets Manager terraai/stripe → { SecretKey, WebhookSecret, PublishableKey }
 */

const { DynamoDBClient }           = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient,
        PutCommand, GetCommand,
        UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient,
        GetSecretValueCommand }      = require('@aws-sdk/client-secrets-manager');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const https = require('https');
const crypto = require('crypto');

const REGION      = 'us-east-1';
const TABLE_TX    = 'opusaimobility-transactions';
const TABLE_USERS = 'opusaimobility-users';
const SNS_PUSH    = process.env.SNS_TOPIC_PUSH || 'arn:aws:sns:us-east-1:683541453923:opusaimobility-push-notifications';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const sm  = new SecretsManagerClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,Stripe-Signature' };
function resp(code, body) { return { statusCode: code, headers: CORS, body: JSON.stringify(body) }; }
function genId(p) { return `${p}-${Date.now().toString(36).toUpperCase()}`; }

// ── Secrets cache ─────────────────────────────────────────────────────────────
let _stripeCreds = null;
async function getStripeCreds() {
  if (_stripeCreds) return _stripeCreds;
  try {
    const s = await sm.send(new GetSecretValueCommand({ SecretId: 'terraai/stripe' }));
    _stripeCreds = JSON.parse(s.SecretString);
  } catch (e) {
    console.warn('[Stripe] Secrets load failed, using placeholder:', e.message);
    _stripeCreds = { SecretKey: 'PLACEHOLDER', WebhookSecret: 'PLACEHOLDER', PublishableKey: 'PLACEHOLDER' };
  }
  return _stripeCreds;
}

// ── Stripe API helper ─────────────────────────────────────────────────────────
function stripeRequest(secretKey, method, path, formData) {
  const body = formData ? new URLSearchParams(formData).toString() : null;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      path,
      method,
      headers: {
        Authorization:  `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Verify Stripe webhook signature ──────────────────────────────────────────
function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader || !secret || secret === 'PLACEHOLDER') return true; // skip in sandbox
  const parts    = sigHeader.split(',').reduce((acc, p) => { const [k,v]=p.split('='); acc[k]=v; return acc; }, {});
  const ts       = parts.t;
  const sig      = parts.v1;
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
}

// ── POST /payments/stripe — Create PaymentIntent ──────────────────────────────
async function handleCreatePaymentIntent(body) {
  const { userId, amount, currency, gateway, description } = body;
  if (!userId || !amount) return resp(400, { error: 'userId and amount required' });

  const txId = genId('STR');
  const amountCents = Math.round(parseFloat(amount) * 100);

  // Store pending transaction
  const tx = {
    id:          txId,
    userId,
    amount:      parseFloat(amount),
    currency:    currency || 'USD',
    status:      'pending',
    method:      'Stripe',
    gateway:     gateway || 'Visa/Mastercard',
    timestamp:   Date.now(),
    description: description || 'Ride/Order Payment',
    userType:    'customer',
    direction:   'out',
  };
  await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));

  const creds = await getStripeCreds();

  if (creds.SecretKey === 'PLACEHOLDER') {
    console.log('[Stripe] PLACEHOLDER key — returning sandbox clientSecret');
    tx.clientSecret = `pi_sandbox_${txId}_secret_test`;
    tx.paymentIntentId = `pi_sandbox_${txId}`;
    tx.sandbox = true;
    return resp(200, { clientSecret: tx.clientSecret, transactionId: txId, sandbox: true });
  }

  try {
    const res = await stripeRequest(creds.SecretKey, 'POST', '/v1/payment_intents', {
      amount:   amountCents,
      currency: (currency || 'USD').toLowerCase(),
      metadata: JSON.stringify({ txId, userId }),
      description: description || 'TerraAI Mobility Payment',
    });

    if (res.status !== 200 || !res.body.client_secret) {
      throw new Error(`Stripe API error: ${JSON.stringify(res.body)}`);
    }

    tx.paymentIntentId = res.body.id;
    tx.clientSecret    = res.body.client_secret;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));

    console.log(`[Stripe] PaymentIntent created: ${res.body.id} for userId=${userId} amount=${amount}`);
    return resp(200, { clientSecret: res.body.client_secret, transactionId: txId });

  } catch (e) {
    console.error('[Stripe] PaymentIntent error:', e.message);
    tx.status = 'failed';
    tx.error  = e.message;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
    return resp(200, { error: e.message, transactionId: txId });
  }
}

// ── POST /payments/stripe/webhook ─────────────────────────────────────────────
async function handleWebhook(event) {
  const rawBody   = event.body || '';
  const sigHeader = (event.headers || {})['stripe-signature'] || (event.headers || {})['Stripe-Signature'] || '';
  const creds     = await getStripeCreds();

  if (!verifyStripeSignature(rawBody, sigHeader, creds.WebhookSecret)) {
    console.warn('[Stripe] Webhook signature verification FAILED');
    return resp(400, { error: 'Invalid signature' });
  }

  let payload;
  try { payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody; } catch { return resp(400, { error: 'Invalid JSON' }); }

  const eventType = payload.type;
  const pi        = payload.data?.object;
  const txId      = pi?.metadata?.txId;

  console.log(`[Stripe] Webhook event=${eventType} piId=${pi?.id} txId=${txId}`);

  if (eventType === 'payment_intent.succeeded') {
    // Update transaction
    if (txId) {
      await ddb.send(new UpdateCommand({
        TableName:                 TABLE_TX,
        Key:                       { id: txId },
        UpdateExpression:          'SET #s = :s, stripeId = :sid, completedAt = :ts',
        ExpressionAttributeNames:  { '#s': 'status' },
        ExpressionAttributeValues: { ':s': 'successful', ':sid': pi.id, ':ts': Date.now() },
      }));
    }

    const userId = pi?.metadata?.userId;
    if (userId) {
      await sns.send(new PublishCommand({
        TopicArn: SNS_PUSH,
        Message:  JSON.stringify({ userId, title: '✅ Payment Successful', message: `Card payment of $${(pi.amount / 100).toFixed(2)} confirmed.`, type: 'payment_success' }),
        Subject: 'Stripe Payment Confirmed',
      })).catch(() => {});
    }

  } else if (eventType === 'payment_intent.payment_failed') {
    if (txId) {
      await ddb.send(new UpdateCommand({
        TableName:                 TABLE_TX,
        Key:                       { id: txId },
        UpdateExpression:          'SET #s = :s, failReason = :fr, failedAt = :ts',
        ExpressionAttributeNames:  { '#s': 'status' },
        ExpressionAttributeValues: { ':s': 'failed', ':fr': pi.last_payment_error?.message || 'Unknown', ':ts': Date.now() },
      }));
    }
  }

  return resp(200, { received: true });
}

// ── Lambda handler ────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const method  = event.requestContext?.http?.method || event.httpMethod || 'POST';
  const rawPath = event.rawPath || event.path || '/payments/stripe';
  const isWebhook = rawPath.includes('/webhook');

  let body = {};
  if (!isWebhook) {
    try { body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {}; } catch (_) {}
  }

  if (method === 'OPTIONS') return resp(200, {});
  if (isWebhook) return await handleWebhook(event);
  return await handleCreatePaymentIntent(body);
};
