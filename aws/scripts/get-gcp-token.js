/**
 * Get a GCP access token from the Firebase service account
 * and enable the Vertex AI / aiplatform API on the opusaimobility project.
 */
const https  = require('https');
const { createSign } = require('crypto');
const fs     = require('fs');
const path   = require('path');

const SA_PATH = path.resolve(__dirname, '../../opusaimobility-d90412e796f2.json');
const sa      = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
const PROJECT = sa.project_id;

async function getAccessToken(scope) {
  const now     = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  const b64     = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const si      = b64(header) + '.' + b64(payload);
  const sign    = createSign('RSA-SHA256');
  sign.update(si);
  const jwt = si + '.' + sign.sign(sa.private_key, 'base64url');
  const form = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt;

  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { const t = JSON.parse(d); t.access_token ? resolve(t.access_token) : reject(new Error(d)); }); }
    );
    req.on('error', reject);
    req.write(form);
    req.end();
  });
}

async function apiRequest(method, hostname, path2, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request({ hostname, path: path2, method, headers }, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: r.statusCode, body: d }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('\n🔑 Getting GCP access token for project:', PROJECT);
  const token = await getAccessToken('https://www.googleapis.com/auth/cloud-platform');
  console.log('✅ Access token obtained\n');

  // Enable Vertex AI / aiplatform API
  const apis = [
    'aiplatform.googleapis.com',
    'generativelanguage.googleapis.com',
    'firebase.googleapis.com',
  ];

  console.log('🔧 Enabling required GCP APIs...');
  for (const api of apis) {
    const res = await apiRequest(
      'POST',
      'serviceusage.googleapis.com',
      `/v1/projects/${PROJECT}/services/${api}:enable`,
      token,
      {}
    );
    if (res.status === 200 || res.status === 201 || (res.body && res.body.name)) {
      console.log(`  ✅ ${api} — enabling (operation: ${res.body?.name || 'queued'})`);
    } else if (res.status === 403) {
      console.warn(`  ⚠️  ${api} — 403 (service account may lack serviceusage.services.enable permission)`);
      console.warn(`     Manual fix: https://console.developers.google.com/apis/api/${api}/overview?project=${PROJECT}`);
    } else {
      console.log(`  ℹ️  ${api} — HTTP ${res.status}:`, JSON.stringify(res.body).slice(0, 200));
    }
  }

  // Write token to a temp file for Gemini CLI env
  const tokenFile = path.resolve(__dirname, '../../.gcp-token');
  fs.writeFileSync(tokenFile, token, { mode: 0o600 });
  console.log('\n✅ Token written to .gcp-token (valid ~60 min)');
  console.log('   Use: set GOOGLE_ACCESS_TOKEN=<value from .gcp-token>');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
