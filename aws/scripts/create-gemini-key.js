/**
 * Create a new Gemini API key using the Firebase service account token
 * and update AWS Secrets Manager with the new key.
 */
const https  = require('https');
const { createSign } = require('crypto');
const fs     = require('fs');
const path   = require('path');
const { SecretsManagerClient, PutSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const SA_PATH = path.resolve(__dirname, '../../opusaimobility-d90412e796f2.json');
const sa      = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
const PROJECT_NUMBER = '181397500727'; // from earlier API response

async function getAccessToken() {
  const now     = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  const b64     = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const si      = b64(header) + '.' + b64(payload);
  const sign    = createSign('RSA-SHA256');
  sign.update(si);
  const jwt = si + '.' + sign.sign(sa.private_key, 'base64url');
  const form = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { const t = JSON.parse(d); t.access_token ? resolve(t.access_token) : reject(new Error(d)); });
    });
    req.on('error', reject); req.write(form); req.end();
  });
}

async function apiPost(hostname, path2, token, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({ hostname, path: path2, method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: r.statusCode, body: d }); } });
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function run() {
  console.log('\n🔑 Creating new Gemini API key...');
  const token = await getAccessToken();
  console.log('✅ Service account token obtained');

  // Create API key via Cloud API Keys
  const createRes = await apiPost(
    'apikeys.googleapis.com',
    `/v2/projects/${PROJECT_NUMBER}/locations/global/keys`,
    token,
    {
      displayName: 'gemini-cli-opusaimobility-' + Date.now(),
      restrictions: {
        apiTargets: [{ service: 'generativelanguage.googleapis.com' }]
      }
    }
  );

  console.log('API Keys response:', createRes.status, JSON.stringify(createRes.body).slice(0, 400));

  if (createRes.status === 403) {
    const errMsg = typeof createRes.body === 'object' ? createRes.body?.error?.message : createRes.body;
    console.error('\n❌ Cannot create API key — project APIs not enabled or insufficient permissions.');
    console.error('Error:', errMsg);
    console.log('\n📋 MANUAL STEPS REQUIRED:');
    console.log('1. Go to: https://console.firebase.google.com/project/opusaimobility');
    console.log('2. Or: https://aistudio.google.com/apikey');
    console.log('3. Create a new Gemini API key for project opusaimobility');
    console.log('4. Run: aws secretsmanager put-secret-value --secret-id omniride/gemini-api-key --secret-string "YOUR_NEW_KEY"');
    console.log('5. Run: node aws/scripts/setup-fcm-sns.js');
    process.exit(1);
  }

  if (createRes.body?.name) {
    // Get the actual key string from the operation
    const opName = createRes.body.name;
    console.log('Operation:', opName);
    // Poll for completion
    await new Promise(r => setTimeout(r, 3000));
    const getRes = await new Promise((resolve, reject) => {
      const req = https.request({ hostname: 'apikeys.googleapis.com', path: '/v2/' + opName.replace('operations/','') + ':getKeyString', method: 'GET', headers: { Authorization: 'Bearer ' + token } }, (r) => {
        let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: r.statusCode, body: d }); } });
      });
      req.on('error', reject); req.end();
    });
    console.log('Key response:', getRes.status, JSON.stringify(getRes.body).slice(0, 300));
  }
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
