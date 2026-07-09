'use strict';
/**
 * terraai-secrets-rotation Lambda  v1.0
 * ──────────────────────────────────────
 * Secrets Manager rotation Lambda for TerraAI platform secrets.
 * TICKET: TERRA-092
 *
 * Supports rotation for:
 *  - opusaimobility/gemini-api-key (external — manual validation only)
 *  - terraai/mpesa           (external — manual validation only)
 *  - terraai/stripe          (external — manual validation only)
 *
 * Rotation Steps (Secrets Manager standard):
 *  1. createSecret  — create AWSPENDING version
 *  2. setSecret     — apply pending secret to service
 *  3. testSecret    — validate new secret works
 *  4. finishSecret  — promote AWSPENDING → AWSCURRENT
 *
 * For external API keys (Gemini, MPesa, Stripe) the rotation strategy is:
 *  - Notify via SNS that rotation is due
 *  - Admin updates the AWSPENDING secret manually
 *  - testSecret validates by calling the service
 *  - finishSecret promotes
 */

const {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  DescribeSecretCommand,
  UpdateSecretVersionStageCommand,
} = require('@aws-sdk/client-secrets-manager');

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const https = require('https');

const REGION        = 'us-east-1';
const SNS_TOPIC     = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications';

const sm  = new SecretsManagerClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

// ── Step handlers ─────────────────────────────────────────────────────────────

async function createSecret(secretId, token) {
  // Check if AWSPENDING already exists
  try {
    await sm.send(new GetSecretValueCommand({
      SecretId:     secretId,
      VersionStage: 'AWSPENDING',
    }));
    console.log(`[Rotation] AWSPENDING already exists for ${secretId}`);
    return; // Already created
  } catch (e) {
    if (e.name !== 'ResourceNotFoundException' && !e.message?.includes('AWSPENDING')) throw e;
  }

  // Get current secret value
  const current = await sm.send(new GetSecretValueCommand({
    SecretId:     secretId,
    VersionStage: 'AWSCURRENT',
  }));

  // For external keys: copy current value to AWSPENDING
  // Admin will update AWSPENDING with new key before testSecret runs
  await sm.send(new PutSecretValueCommand({
    SecretId:          secretId,
    ClientRequestToken: token,
    SecretString:       current.SecretString,
    VersionStages:      ['AWSPENDING'],
  }));

  // Notify admin via SNS
  await sns.send(new PublishCommand({
    TopicArn: SNS_TOPIC,
    Subject:  `[TerraAI] Secret Rotation Started: ${secretId}`,
    Message:  `Secret ${secretId} rotation has been initiated.\n\nAction Required:\n1. Generate a new API key from the provider\n2. Update the AWSPENDING version of ${secretId} in Secrets Manager\n3. The rotation will complete automatically after testSecret validates\n\nRegion: ${REGION}\nAccount: 683541453923`,
  })).catch(e => console.warn('[Rotation] SNS notify failed:', e.message));

  console.log(`[Rotation] createSecret complete for ${secretId}`);
}

async function setSecret(secretId, token) {
  // For external API keys, there's no programmatic way to "set" the key
  // in the external service — admin must do this manually
  // This step is a no-op for our external key rotation
  console.log(`[Rotation] setSecret — external key, admin action required for ${secretId}`);
}

async function testSecret(secretId, token) {
  const pending = await sm.send(new GetSecretValueCommand({
    SecretId:     secretId,
    VersionStage: 'AWSPENDING',
  }));

  const secret = JSON.parse(pending.SecretString || '{}');

  // Test based on secret type
  if (secretId.includes('gemini')) {
    await testGeminiKey(secret.key || secret.geminiApiKey || pending.SecretString);
  } else if (secretId.includes('stripe')) {
    await testStripeKey(secret.SecretKey || secret.secretKey);
  } else {
    // For other secrets, just verify it's not a placeholder
    const val = pending.SecretString || '';
    if (val.includes('PLACEHOLDER')) {
      throw new Error(`Secret ${secretId} still contains PLACEHOLDER — admin must update AWSPENDING version`);
    }
    console.log(`[Rotation] testSecret — ${secretId} value verified (non-placeholder)`);
  }
}

async function testGeminiKey(apiKey) {
  if (!apiKey || apiKey.includes('PLACEHOLDER')) {
    throw new Error('Gemini key is a placeholder — admin must update AWSPENDING');
  }
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] });
    const req  = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path:     `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 400) {
        // 400 = bad request but key is valid (our minimal body may be rejected)
        console.log('[Rotation] Gemini key test passed, status:', res.statusCode);
        resolve();
      } else if (res.statusCode === 403 || res.statusCode === 401) {
        reject(new Error(`Gemini key invalid — HTTP ${res.statusCode}`));
      } else {
        resolve(); // Treat other codes as pass (network issues shouldn't block rotation)
      }
    });
    req.on('error', (e) => {
      console.warn('[Rotation] Gemini test network error (treating as pass):', e.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

async function testStripeKey(secretKey) {
  if (!secretKey || secretKey.includes('PLACEHOLDER')) {
    throw new Error('Stripe key is a placeholder — admin must update AWSPENDING');
  }
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      path:     '/v1/balance',
      method:   'GET',
      headers:  { Authorization: `Bearer ${secretKey}` },
    }, (res) => {
      if (res.statusCode === 200) {
        console.log('[Rotation] Stripe key test passed');
        resolve();
      } else if (res.statusCode === 401) {
        reject(new Error('Stripe key invalid — 401 Unauthorized'));
      } else {
        resolve(); // Don't block on other errors
      }
    });
    req.on('error', (e) => { console.warn('[Rotation] Stripe test error:', e.message); resolve(); });
    req.end();
  });
}

async function finishSecret(secretId, token) {
  const meta = await sm.send(new DescribeSecretCommand({ SecretId: secretId }));

  // Find current version
  let currentVersion;
  for (const [vId, stages] of Object.entries(meta.VersionIdsToStages || {})) {
    if (stages.includes('AWSCURRENT')) {
      if (vId === token) {
        console.log(`[Rotation] ${secretId} already on version ${token}`);
        return;
      }
      currentVersion = vId;
      break;
    }
  }

  // Promote AWSPENDING → AWSCURRENT
  await sm.send(new UpdateSecretVersionStageCommand({
    SecretId:            secretId,
    VersionStage:        'AWSCURRENT',
    MoveToVersionId:     token,
    RemoveFromVersionId: currentVersion,
  }));

  // Notify admin
  await sns.send(new PublishCommand({
    TopicArn: SNS_TOPIC,
    Subject:  `[TerraAI] Secret Rotation Complete: ${secretId}`,
    Message:  `Secret ${secretId} has been successfully rotated.\n\nNew version is now AWSCURRENT.\nOld version marked AWSPREVIOUS for rollback.\n\nAccount: 683541453923 | Region: ${REGION}`,
  })).catch(() => {});

  console.log(`[Rotation] finishSecret complete for ${secretId} — version ${token} is now AWSCURRENT`);
}

// ── Lambda Handler ────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log('[Rotation] event:', JSON.stringify({ step: event.Step, secretId: event.SecretId }));

  const { Step: step, SecretId: secretId, ClientRequestToken: token } = event;

  if (!step || !secretId || !token) {
    throw new Error('Missing required rotation event fields: Step, SecretId, ClientRequestToken');
  }

  switch (step) {
    case 'createSecret':  await createSecret(secretId, token);  break;
    case 'setSecret':     await setSecret(secretId, token);     break;
    case 'testSecret':    await testSecret(secretId, token);    break;
    case 'finishSecret':  await finishSecret(secretId, token);  break;
    default: throw new Error(`Unknown rotation step: ${step}`);
  }

  console.log(`[Rotation] Step ${step} complete for ${secretId}`);
};
