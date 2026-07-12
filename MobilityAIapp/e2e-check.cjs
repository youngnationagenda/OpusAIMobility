/**
 * e2e-check.cjs — Full backend + frontend flow verification (v2)
 * ─────────────────────────────────────────────────────────────────
 * Tests (in order):
 *   00. Live frontend HTML shell (CloudFront)
 *   01. API Gateway health endpoint
 *   02. Auth: signup (new test user) — using legacy field names
 *   03. Auth: signin (same user)     — returns accessToken + user
 *   04. Auth: GET /auth/me           — JWT-protected profile
 *   05. Users: sync user profile
 *   06. Rides: fleet config          — public read (no auth)
 *   07. Rides: pricing config        — public read (no auth)
 *   08. Rides: request a ride        — public write (like e2e signaling)
 *   09. Orders: place food order
 *   10. Payments: transaction history
 *   11. Platform: settings read
 *   12. AI: distance + ETA calculation
 *   13. Auth: signout
 *   14. CDN: vendor-react JS asset served via CloudFront (direct S3 path)
 */

'use strict';
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────
const API  = 'https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod';
const CF   = 'https://opusaimobility.yna.co.ke';

// Use a unique email per run to avoid duplicate conflicts
const RUN_ID     = Date.now().toString(36);
const TEST_EMAIL = `e2e-${RUN_ID}@opusaimobility.test`;
const TEST_PASS  = 'OpusAITest2025!';

// ── State ─────────────────────────────────────────────────────────────────────
let accessToken  = null;
let refreshToken = null;
let userId       = null;

// ── Results ───────────────────────────────────────────────────────────────────
const results = [];
let passed = 0, failed = 0, skipped = 0;

// ── HTTP helper ───────────────────────────────────────────────────────────────
function req(url, opts = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || 443,
      path:     parsed.pathname + parsed.search,
      method:   opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        ...(opts.headers || {}),
      },
      timeout: 14000,
    };
    const r = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, body, json });
      });
    });
    r.on('timeout', () => { r.destroy(); resolve({ status: 'TIMEOUT', body: '', json: null, headers: {} }); });
    r.on('error',   (e) => resolve({ status: 'ERROR',   body: e.message, json: null, headers: {} }));
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

function authHdrs() {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function log(id, name, status, detail, extra = '') {
  const icon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️ ' : '❌';
  const line  = `${icon} [${id}] ${name}`;
  const det   = detail ? `\n       ${detail}` : '';
  const ext   = extra  ? `\n       ${extra}`  : '';
  results.push(line + det + ext);
  if (status === 'PASS')  passed++;
  else if (status === 'SKIP') skipped++;
  else failed++;
}

// ── Test runner ───────────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   OpusAIMobility — End-to-End Backend + Frontend Check v2   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Run ID: ${RUN_ID}   Test user: ${TEST_EMAIL}\n`);

  // ── 00. Frontend HTML shell ───────────────────────────────────────────────
  {
    const r  = await req(CF);
    const ok = r.status === 200 &&
               r.body.includes('<!DOCTYPE html') &&
               r.body.includes('id="root"') &&
               r.body.includes('OpusAIMobility');
    log('00', `Frontend HTML shell  ${CF}`,
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  size=${r.body.length}B  CT=${r.headers['content-type']}`,
      ok ? '' : r.body.slice(0, 100)
    );
  }

  // ── 01. API Gateway health ────────────────────────────────────────────────
  {
    const r  = await req(`${API}/health`);
    const ok = r.status === 200 && r.json?.code === '200';
    log('01', `API Gateway health   ${API}/health`,
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}`,
      ok
        ? `service=${r.json?.msg?.service}  version=${r.json?.msg?.version}`
        : JSON.stringify(r.json).slice(0, 150)
    );
  }

  // ── 02. Auth: signup ──────────────────────────────────────────────────────
  // Lambda's signUp handler expects first_name, not name
  {
    const r = await req(`${API}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({
        email:      TEST_EMAIL,
        password:   TEST_PASS,
        first_name: 'E2E',
        last_name:  'TestUser',
        phone:      '+254700000001',
        role:       'user',
      }),
    });
    const ok = r.status === 200 && r.json?.code === '200';
    // Capture tokens if returned immediately (lambda returns tokens on signup)
    if (ok) {
      const msg = r.json?.msg || {};
      if (msg.accessToken)   accessToken  = msg.accessToken;
      if (msg.refreshToken)  refreshToken = msg.refreshToken;
      if (msg.user?.id)      userId       = msg.user.id;
      if (msg.User?.userId)  userId       = userId || msg.User.userId;
    }
    log('02', 'Auth: POST /auth/signup → user created in Cognito + DynamoDB',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}  userId=${userId || 'n/a'}  hasToken=${!!accessToken}`,
      ok ? '' : JSON.stringify(r.json).slice(0, 250)
    );
  }

  // ── 03. Auth: signin ──────────────────────────────────────────────────────
  {
    const r = await req(`${API}/auth/signin`, {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
    });
    const ok    = r.status === 200 && r.json?.code === '200';
    const msg   = r.json?.msg || {};
    const gotAt = !!(msg.accessToken || msg.tokens?.accessToken || msg.tokens?.idToken);
    if (ok && gotAt) {
      accessToken  = msg.accessToken  || msg.tokens?.accessToken || msg.tokens?.idToken;
      refreshToken = msg.refreshToken || msg.tokens?.refreshToken || '';
      userId       = userId || msg.user?.id || msg.User?.userId;
    }
    log('03', 'Auth: POST /auth/signin → Cognito JWT issued',
      (ok && gotAt) ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}  hasToken=${gotAt}  userId=${userId || 'n/a'}`,
      (ok && gotAt) ? '' : JSON.stringify(r.json).slice(0, 300)
    );
  }

  // ── 04. Auth: GET /auth/me ────────────────────────────────────────────────
  if (!accessToken) {
    log('04', 'Auth: GET /auth/me', 'SKIP', 'No access token from signin — cannot test protected endpoint');
  } else {
    const r  = await req(`${API}/auth/me`, { headers: authHdrs() });
    const ok = r.status === 200 && r.json?.code === '200';
    log('04', 'Auth: GET /auth/me → JWT-protected user profile',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok
        ? `email=${r.json?.msg?.email || r.json?.msg?.User?.email}`
        : JSON.stringify(r.json).slice(0, 250)
    );
  }

  // ── 05. Users: sync ───────────────────────────────────────────────────────
  {
    const r = await req(`${API}/users/sync`, {
      method: 'PUT',
      headers: authHdrs(),
      body: JSON.stringify({
        user_id:    userId || 'usr_e2e_001',
        first_name: 'E2E',
        last_name:  'TestUser',
        email:      TEST_EMAIL,
        phone:      '+254700000001',
        role:       'user',
        updated:    Date.now(),
      }),
    });
    const ok = r.status === 200 && r.json?.code === '200';
    log('05', 'Users: PUT /users/sync → profile upsert to DynamoDB',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok ? '' : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 06. Rides: fleet config ───────────────────────────────────────────────
  // getRideTypes is public — no auth needed
  {
    const r  = await req(`${API}/rides/fleet`);
    const ok = r.status === 200 && r.json?.code === '200' &&
               (Array.isArray(r.json?.msg) || typeof r.json?.msg === 'object');
    log('06', 'Rides: GET /rides/fleet → fleet / ride types from DynamoDB',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}  count=${Array.isArray(r.json?.msg) ? r.json.msg.length : 'n/a'}`,
      ok ? '' : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 07. Rides: pricing config ─────────────────────────────────────────────
  {
    const r  = await req(`${API}/rides/pricing`);
    const ok = r.status === 200 && r.json?.code === '200';
    log('07', 'Rides: GET /rides/pricing → service charges config',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok ? `data=${JSON.stringify(r.json?.msg).slice(0,80)}` : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 08. Rides: request ride ────────────────────────────────────────────────
  {
    const r = await req(`${API}/rides/request`, {
      method: 'POST',
      headers: authHdrs(),
      body: JSON.stringify({
        user_id:     userId || 'usr_e2e_001',
        pickup_lat:  '-1.2921', pickup_lng: '36.8219',
        dropoff_lat: '-1.3001', dropoff_lng: '36.8300',
        ride_type_id: '1',
        payment_method: 'wallet',
      }),
    });
    const ok = r.status === 200 && r.json?.code === '200';
    log('08', 'Rides: POST /rides/request → ride created + driver assigned',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok
        ? `rideId=${r.json?.msg?.ride?.rideId}  eta=${r.json?.msg?.driver?.eta}`
        : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 09. Orders: place food order ──────────────────────────────────────────
  {
    const r = await req(`${API}/orders`, {
      method: 'POST',
      headers: authHdrs(),
      body: JSON.stringify({
        user_id:       userId || 'usr_e2e_001',
        restaurant_id: 'rest_001',
        items:         [{ food_id: 'item_001', quantity: 1, price: 8.50 }],
        total_price:   11.49,
        payment_method: 'wallet',
        notes:         'E2E test order',
      }),
    });
    const ok = r.status === 200 && r.json?.code === '200';
    log('09', 'Orders: POST /orders → food order placed in DynamoDB',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok
        ? `orderId=${r.json?.msg?.order?.orderId}`
        : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 10. Payments: history ─────────────────────────────────────────────────
  {
    const r  = await req(`${API}/payments/history`, { headers: authHdrs() });
    const ok = r.status === 200 && r.json?.code === '200';
    log('10', 'Payments: GET /payments/history → payment methods / ledger',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok ? '' : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 11. Platform: settings ────────────────────────────────────────────────
  {
    const r  = await req(`${API}/platform/settings`, { headers: authHdrs() });
    const ok = r.status === 200 && r.json?.code === '200';
    const msg = r.json?.msg || {};
    log('11', 'Platform: GET /platform/settings → app config',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok
        ? `app=${msg.app_name}  perKmRate=${msg.perKmRate}  weeklyFee=${msg.systemWeeklyFee}`
        : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 12. AI: distance + ETA ────────────────────────────────────────────────
  {
    const r = await req(`${API}/ai/distance`, {
      method: 'POST',
      headers: authHdrs(),
      body: JSON.stringify({ from: 'Nairobi CBD, Kenya', to: 'Westlands, Nairobi' }),
    });
    const ok  = r.status === 200 && r.json?.code === '200';
    const msg = r.json?.msg || {};
    log('12', 'AI: POST /ai/distance → road distance + ETA (estimateFare)',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok
        ? `distanceKm=${msg.distanceKm}  durationMinutes=${msg.durationMinutes}  fare=${msg.estimatedFare}`
        : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 13. Auth: signout ─────────────────────────────────────────────────────
  if (!accessToken) {
    log('13', 'Auth: POST /auth/signout', 'SKIP', 'No token to revoke');
  } else {
    const r = await req(`${API}/auth/signout`, {
      method: 'POST',
      headers: authHdrs(),
      body: JSON.stringify({ refresh_token: refreshToken || '' }),
    });
    const ok = r.status === 200 && r.json?.code === '200';
    log('13', 'Auth: POST /auth/signout → session ended',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  code=${r.json?.code}`,
      ok ? '' : JSON.stringify(r.json).slice(0, 200)
    );
  }

  // ── 14. CDN: JS asset via CloudFront ─────────────────────────────────────
  // Use the CF domain directly — the chunk name is content-hashed so always exists in S3
  {
    // First find an actual chunk name from the known list
    const CHUNK = 'assets/chunk-aws-CGpACWh-.js'; // small 5KB chunk — always present
    const r = await req(`${CF}/${CHUNK}`);
    const isJs = r.headers['content-type']?.includes('javascript') ||
                 r.headers['content-type']?.includes('application/');
    const ok   = r.status === 200 && r.body.length > 1000 && isJs;
    log('14', `CDN: ${CF}/${CHUNK}`,
      ok ? 'PASS' : 'FAIL',
      `HTTP ${r.status}  size=${r.body.length}B  CT=${r.headers['content-type'] || 'n/a'}  cache=${r.headers['x-cache'] || 'n/a'}`,
      ok ? '' : `First 120 chars: ${r.body.slice(0, 120)}`
    );
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + results.join('\n'));
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Passed  : ${passed}`);
  console.log(`  ❌ Failed  : ${failed}`);
  console.log(`  ⏭️  Skipped : ${skipped}`);
  console.log(`  Total    : ${passed + failed + skipped}`);
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log(`  🌐  App URL : ${CF}`);
  console.log(`  🔗  API URL : ${API}`);
  console.log('');

  const fs = require('fs');
  fs.writeFileSync('e2e-result.json', JSON.stringify({
    passed, failed, skipped, runId: RUN_ID,
    testUser: TEST_EMAIL, api: API, frontend: CF,
    results, timestamp: new Date().toISOString(),
  }, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
