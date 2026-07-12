'use strict';
/**
 * terraai-mpesa Lambda  v1.0 — TERRA-020
 * ────────────────────────────────────────
 * Real M-Pesa Daraja STK Push integration.
 *
 * Routes handled:
 *   POST /payments/mpesa          — initiate STK Push
 *   POST /payments/mpesa/callback — Daraja confirmation callback
 *
 * Flow:
 *  1. Get OAuth token from Daraja
 *  2. Send STK Push (simulates payment request to customer's phone)
 *  3. Daraja calls /payments/mpesa/callback with payment result
 *  4. Callback: update transaction → successful/failed, update wallet, push SNS
 *
 * Credentials stored in Secrets Manager: terraai/mpesa
 */

const { DynamoDBClient }      = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient,
        PutCommand, GetCommand,
        UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SecretsManagerClient,
        GetSecretValueCommand }  = require('@aws-sdk/client-secrets-manager');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const https  = require('https');

const REGION        = 'us-east-1';
const TABLE_TX      = 'opusaimobility-transactions';
const TABLE_USERS   = 'opusaimobility-users';
const SNS_PUSH      = process.env.SNS_TOPIC_PUSH || 'arn:aws:sns:us-east-1:683541453923:opusaimobility-push-notifications';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const sm  = new SecretsManagerClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

const CORS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':'Content-Type,Authorization',
};

function resp(code, body) {
  return { statusCode: code, headers: CORS, body: JSON.stringify(body) };
}
function genId(p) { return `${p}-${Date.now().toString(36).toUpperCase()}`; }

// ── Secrets cache ─────────────────────────────────────────────────────────────
let _mpesaCreds = null;
async function getMpesaCreds() {
  if (_mpesaCreds) return _mpesaCreds;
  try {
    const secret = await sm.send(new GetSecretValueCommand({ SecretId: 'terraai/mpesa' }));
    _mpesaCreds = JSON.parse(secret.SecretString);
  } catch (e) {
    console.warn('[MPesa] Could not load secrets, using env fallback:', e.message);
    // Fallback to env vars (dev/staging)
    _mpesaCreds = {
      ConsumerKey:    process.env.MPESA_CONSUMER_KEY    || 'PLACEHOLDER',
      ConsumerSecret: process.env.MPESA_CONSUMER_SECRET || 'PLACEHOLDER',
      PassKey:        process.env.MPESA_PASS_KEY        || 'PLACEHOLDER',
      ShortCode:      process.env.MPESA_SHORTCODE       || '174379',
      CallbackURL:    process.env.MPESA_CALLBACK_URL    || 'https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/payments/mpesa/callback',
    };
  }
  return _mpesaCreds;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function httpsRequest(options, body) {
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

// ── Step 1: Get OAuth token ───────────────────────────────────────────────────
async function getDarajaToken(creds) {
  const auth = Buffer.from(`${creds.ConsumerKey}:${creds.ConsumerSecret}`).toString('base64');
  const res = await httpsRequest({
    hostname: 'sandbox.safaricom.co.ke', // prod: api.safaricom.co.ke
    path:     '/oauth/v1/generate?grant_type=client_credentials',
    method:   'GET',
    headers:  { Authorization: `Basic ${auth}` },
  });

  if (res.status !== 200 || !res.body.access_token) {
    throw new Error(`Daraja OAuth failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.access_token;
}

// ── Step 2: STK Push ──────────────────────────────────────────────────────────
async function initiateStkPush(phone, amount, accountRef, creds, accessToken) {
  const timestamp  = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password   = Buffer.from(`${creds.ShortCode}${creds.PassKey}${timestamp}`).toString('base64');
  const normalizedPhone = phone.startsWith('+') ? phone.slice(1) : phone.replace(/^0/, '254');

  const payload = {
    BusinessShortCode: creds.ShortCode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            Math.ceil(amount),   // Daraja requires integer KES
    PartyA:            normalizedPhone,
    PartyB:            creds.ShortCode,
    PhoneNumber:       normalizedPhone,
    CallBackURL:       creds.CallbackURL,
    AccountReference:  accountRef || 'TerraAI',
    TransactionDesc:   'OpusAIMobility Wallet Top-up',
  };

  const res = await httpsRequest({
    hostname: 'sandbox.safaricom.co.ke', // prod: api.safaricom.co.ke
    path:     '/mpesa/stkpush/v1/processrequest',
    method:   'POST',
    headers:  {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }, payload);

  if (res.status !== 200 || res.body.ResponseCode !== '0') {
    throw new Error(`STK Push failed: ${JSON.stringify(res.body)}`);
  }
  return res.body; // { CheckoutRequestID, MerchantRequestID, ... }
}

// ── Handler: POST /payments/mpesa ─────────────────────────────────────────────
async function handleStkPush(body) {
  const { userId, phone, amount } = body;
  if (!userId || !phone || !amount) {
    return resp(400, { error: 'userId, phone, amount required' });
  }

  const txId = genId('MPX');
  let stkResult;

  // Store pending transaction immediately (optimistic)
  const tx = {
    id:          txId,
    userId,
    amount:      parseFloat(amount),
    currency:    'KES',
    status:      'pending',
    method:      phone,
    gateway:     'M-Pesa Express',
    timestamp:   Date.now(),
    description: 'Wallet Top-up via M-Pesa STK Push',
    userType:    'customer',
    direction:   'in',
  };
  await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));

  try {
    const creds       = await getMpesaCreds();
    const isPlaceholder = creds.ConsumerKey === 'PLACEHOLDER';

    if (isPlaceholder) {
      // Sandbox simulation mode — auto-succeed after 3s delay
      console.log('[MPesa] PLACEHOLDER creds — simulating STK push (sandbox mode)');
      tx.status      = 'pending';
      tx.checkoutId  = `SANDBOX_${Date.now()}`;
      tx.note        = 'Sandbox simulation — no real Daraja credentials set';
      await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
      return resp(200, { transaction: tx, sandbox: true });
    }

    const token  = await getDarajaToken(creds);
    stkResult    = await initiateStkPush(phone, amount, `TRX-${txId}`, creds, token);

    // Update tx with Daraja checkout ID
    tx.checkoutId = stkResult.CheckoutRequestID;
    tx.merchantId = stkResult.MerchantRequestID;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));

    console.log(`[MPesa] STK Push sent: userId=${userId} phone=${phone} amount=${amount} checkoutId=${tx.checkoutId}`);
    return resp(200, { transaction: tx });

  } catch (e) {
    console.error('[MPesa] STK Push error:', e.message);
    // Update tx to failed
    tx.status = 'failed';
    tx.error  = e.message;
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));
    return resp(200, { transaction: tx, error: e.message }); // 200 so frontend can show message
  }
}

// ── Handler: POST /payments/mpesa/callback ────────────────────────────────────
async function handleCallback(body) {
  /**
   * Daraja calls this with:
   * {
   *   Body: {
   *     stkCallback: {
   *       MerchantRequestID, CheckoutRequestID,
   *       ResultCode: 0 (success) | non-zero (failure),
   *       ResultDesc,
   *       CallbackMetadata: { Item: [{ Name:'Amount',Value }, { Name:'PhoneNumber',Value },...] }
   *     }
   *   }
   * }
   */
  console.log('[MPesa] Callback received:', JSON.stringify(body));

  const cb        = body?.Body?.stkCallback;
  if (!cb) return resp(200, { ResultCode: 0, ResultDesc: 'Accepted' });

  const checkoutId  = cb.CheckoutRequestID;
  const resultCode  = cb.ResultCode;
  const resultDesc  = cb.ResultDesc;
  const meta        = cb.CallbackMetadata?.Item || [];
  const paid        = meta.find(i => i.Name === 'Amount')?.Value;
  const phone       = meta.find(i => i.Name === 'PhoneNumber')?.Value?.toString();
  const mpesaRef    = meta.find(i => i.Name === 'MpesaReceiptNumber')?.Value;

  // Find the transaction by checkoutId
  const txScan = await ddb.send(new ScanCommand({
    TableName:        TABLE_TX,
    FilterExpression: 'checkoutId = :cid',
    ExpressionAttributeValues: { ':cid': checkoutId },
  }));
  const tx = txScan.Items?.[0];
  if (!tx) {
    console.warn('[MPesa] Callback: transaction not found for checkoutId:', checkoutId);
    return resp(200, { ResultCode: 0, ResultDesc: 'Accepted' });
  }

  if (resultCode === 0) {
    // SUCCESS — update tx, credit wallet, send push
    await ddb.send(new UpdateCommand({
      TableName:                 TABLE_TX,
      Key:                       { id: tx.id },
      UpdateExpression:          'SET #s = :s, mpesaRef = :ref, paidAmount = :amt, paidPhone = :ph, completedAt = :ts',
      ExpressionAttributeNames:  { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s':   'successful',
        ':ref': mpesaRef || checkoutId,
        ':amt': paid || tx.amount,
        ':ph':  phone || tx.method,
        ':ts':  Date.now(),
      },
    }));

    // Credit user wallet
    const user = await ddb.send(new GetCommand({ TableName: TABLE_USERS, Key: { id: tx.userId } }));
    if (user.Item) {
      const u = user.Item;
      const newBal = (parseFloat(u.walletBalance) || 0) + parseFloat(paid || tx.amount);
      await ddb.send(new UpdateCommand({
        TableName:                 TABLE_USERS,
        Key:                       { id: tx.userId },
        UpdateExpression:          'SET walletBalance = :bal',
        ExpressionAttributeValues: { ':bal': parseFloat(newBal.toFixed(2)) },
      }));
    }

    // SNS push notification
    await sns.send(new PublishCommand({
      TopicArn: SNS_PUSH,
      Message:  JSON.stringify({
        userId:  tx.userId,
        title:   '💚 Payment Confirmed',
        message: `KES ${paid || tx.amount} received via M-Pesa. Ref: ${mpesaRef}`,
        type:    'wallet_topup',
      }),
      Subject: 'M-Pesa Payment Confirmed',
    })).catch(e => console.warn('[MPesa] SNS notify failed:', e.message));

    console.log(`[MPesa] Payment SUCCESS: userId=${tx.userId} amount=${paid} ref=${mpesaRef}`);
  } else {
    // FAILURE
    await ddb.send(new UpdateCommand({
      TableName:                 TABLE_TX,
      Key:                       { id: tx.id },
      UpdateExpression:          'SET #s = :s, failReason = :fr, failedAt = :ts',
      ExpressionAttributeNames:  { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'failed', ':fr': resultDesc, ':ts': Date.now() },
    }));

    await sns.send(new PublishCommand({
      TopicArn: SNS_PUSH,
      Message:  JSON.stringify({
        userId:  tx.userId,
        title:   '❌ Payment Failed',
        message: `M-Pesa payment failed: ${resultDesc}`,
        type:    'wallet_topup_failed',
      }),
      Subject: 'M-Pesa Payment Failed',
    })).catch(() => {});

    console.log(`[MPesa] Payment FAILED: userId=${tx.userId} reason=${resultDesc}`);
  }

  // Always return 200 to Daraja to acknowledge receipt
  return resp(200, { ResultCode: 0, ResultDesc: 'Accepted' });
}

// ── Lambda handler ────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const method   = event.requestContext?.http?.method || event.httpMethod || 'POST';
  const rawPath  = event.rawPath || event.path || '/payments/mpesa';
  const isCallback = rawPath.includes('/callback');

  let body = {};
  try { body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {}; } catch (_) {}

  console.log(`[MPesa] ${method} ${rawPath} callback=${isCallback}`);

  if (method === 'OPTIONS') return resp(200, {});

  if (isCallback) return await handleCallback(body);
  return await handleStkPush(body);
};
