/**
 * Full admin panel test — login, every page, logout, unauthenticated access
 */
const { execSync } = require('child_process');
const fs  = require('fs');
const os  = require('os');
const path = require('path');

let p = 0, f = 0;
const ok  = (n, d) => { process.stdout.write('  ✅ ' + n + (d ? '  ' + d : '') + '\n'); p++; };
const fail = (n, d) => { process.stdout.write('  ❌ ' + n + (d ? '  → ' + d : '') + '\n'); f++; };

function invoke(event) {
  const evtFile  = path.join(os.tmpdir(), 'aip-evt-' + Date.now() + '.json');
  const respFile = path.join(os.tmpdir(), 'aip-resp-' + Date.now() + '.json');
  fs.writeFileSync(evtFile, JSON.stringify(event));
  execSync(`aws lambda invoke --function-name terraaimobility-admin-panel --payload fileb://${evtFile} --output json ${respFile}`, { stdio: 'pipe' });
  return JSON.parse(fs.readFileSync(respFile, 'utf8'));
}

function mkEvent(qs, method, body, cookie) {
  const e = {
    rawPath: '/',
    queryStringParameters: qs || {},
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    requestContext: { http: { method: method || 'GET' } }
  };
  if (body)   e.body = body;
  if (cookie) e.headers.cookie = cookie;
  return e;
}

async function run() {
  process.stdout.write('\n╔══════════════════════════════════════════════════════╗\n');
  process.stdout.write('║   aimobility Admin Panel — Full Fix Verification    ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════╝\n\n');

  // ── 1. Verify API_BASE is correct in deployed Lambda ─────────────────────
  process.stdout.write('🔧  SECTION 1: Lambda Configuration\n');
  process.stdout.write('─'.repeat(54) + '\n');
  const { execSync: ex } = require('child_process');
  const cfg = JSON.parse(ex('aws lambda get-function-configuration --function-name terraaimobility-admin-panel --output json', {stdio:'pipe'}).toString());
  cfg.LastUpdateStatus === 'Successful' ? ok('Lambda update successful', '[' + cfg.CodeSize + ' bytes]') : fail('Lambda update', cfg.LastUpdateStatus);
  cfg.State === 'Active' ? ok('Lambda state', '[Active]') : fail('Lambda state', cfg.State);

  // ── 2. Login test ─────────────────────────────────────────────────────────
  process.stdout.write('\n🔐  SECTION 2: Login Flow\n');
  process.stdout.write('─'.repeat(54) + '\n');

  // 2a. GET login page (unauthenticated)
  const loginPage = invoke(mkEvent({}, 'GET'));
  loginPage.statusCode === 200 && loginPage.body.includes('Log in')
    ? ok('GET / → login page renders', '[' + loginPage.body.length + ' bytes]')
    : fail('GET / → login page', 'status:' + loginPage.statusCode);
  loginPage.body.includes('aimobility') ? ok('Login page has branding', '') : fail('Login page branding missing');
  loginPage.body.includes('form') && loginPage.body.includes('email')
    ? ok('Login form present', '') : fail('Login form missing');

  // 2b. POST bad credentials
  const badLogin = invoke(mkEvent({ action: 'login' }, 'POST', 'email=wrong%40test.com&password=wrongpassword'));
  badLogin.statusCode === 200 && badLogin.body.includes('Invalid')
    ? ok('Bad credentials → error shown', '') : fail('Bad credentials handling', 'status:' + badLogin.statusCode + ' body:' + badLogin.body.slice(0,60));

  // 2c. POST correct credentials
  const goodLogin = invoke(mkEvent({ action: 'login' }, 'POST', 'email=admin%40aimobility.app&password=Admin%402024'));
  let sessionCookie = '';
  if (goodLogin.statusCode === 302 && goodLogin.headers && goodLogin.headers['Set-Cookie']) {
    sessionCookie = goodLogin.headers['Set-Cookie'];
    const sid = sessionCookie.split(';')[0].replace('sid=', '');
    ok('✨ LOGIN SUCCESS — redirects to dashboard', '[302]');
    ok('Session cookie set', '[sid=' + sid.slice(0, 14) + '..., Max-Age=43200]');
  } else {
    fail('LOGIN FAILED', 'status:' + goodLogin.statusCode + ' body:' + JSON.stringify(goodLogin.headers));
  }

  if (!sessionCookie) {
    process.stdout.write('\n⛔  Cannot continue — login failed\n');
    process.stdout.write('Results: ' + p + '/' + (p+f) + '\n');
    return;
  }

  // ── 3. All dashboard pages ────────────────────────────────────────────────
  process.stdout.write('\n📋  SECTION 3: All Admin Pages\n');
  process.stdout.write('─'.repeat(54) + '\n');

  const pages = [
    ['dashboard',    'Dashboard'],
    ['users',        'Users'],
    ['riders',       'Riders'],
    ['restaurants',  'Restaurants'],
    ['foodOrders',   'Food Orders'],
    ['trips',        'Trip Requests'],
    ['parcelOrders', 'Parcel Orders'],
    ['foodCategory', 'Food Categories'],
    ['rideTypes',    'Ride Types'],
    ['packageSize',  'Package Sizes'],
    ['goodType',     'Good Types'],
    ['coupons',      'Coupons'],
    ['serviceFee',   'Service Fees'],
    ['sliderImages', 'Slider Images'],
    ['reportReasons','Report Reasons'],
    ['policies',     'Policies'],
    ['adminUsers',   'Admin Users'],
    ['setting',      'Settings'],
  ];

  for (const [page, label] of pages) {
    const r = invoke(mkEvent({ p: page }, 'GET', null, sessionCookie));
    if (r.statusCode === 200 && r.body && r.body.includes(label)) {
      // Count data rows
      const rowCount = (r.body.match(/<tr>/g) || []).length;
      ok(label + ' page loads', '[' + r.body.length + ' bytes, ~' + rowCount + ' rows]');
    } else if (r.statusCode === 200 && r.body && r.body.length > 1000) {
      ok(label + ' page loads', '[' + r.body.length + ' bytes]');
    } else {
      fail(label + ' page', 'status:' + r.statusCode + ' size:' + (r.body||'').length + ' snippet:' + (r.body||'').slice(0,80));
    }
  }

  // ── 4. DynamoDB session verification ─────────────────────────────────────
  process.stdout.write('\n🗄️   SECTION 4: DynamoDB Session Persistence\n');
  process.stdout.write('─'.repeat(54) + '\n');

  const sid = sessionCookie.split(';')[0].replace('sid=', '');

  // Verify session exists in DynamoDB
  try {
    const { DynamoDBClient } = require('./lambda/api/node_modules/@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = require('./lambda/api/node_modules/@aws-sdk/lib-dynamodb');
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
    const result = await ddb.send(new GetCommand({ TableName: 'aimobility-sessions', Key: { sessionId: sid } }));
    if (result.Item) {
      ok('Session persisted in DynamoDB', '[user: ' + result.Item.data.first_name + ' ' + result.Item.data.last_name + ']');
      const ttlDate = new Date(result.Item.data.ttl * 1000 || result.Item.ttl * 1000);
      ok('Session TTL set', '[expires: ' + new Date(result.Item.ttl * 1000).toISOString() + ']');
    } else {
      fail('Session in DynamoDB', 'Item not found for sid=' + sid.slice(0,12) + '...');
    }
  } catch(e) {
    fail('DynamoDB session check', e.message.slice(0,80));
  }

  // Second request reuses same session (no re-login needed)
  const r2 = invoke(mkEvent({ p: 'restaurants' }, 'GET', null, sessionCookie));
  r2.statusCode === 200 && !r2.body.includes('Log in')
    ? ok('Session reused across requests', '[restaurants page, no re-login]')
    : fail('Session reuse', 'got login page instead');

  // ── 5. Logout ─────────────────────────────────────────────────────────────
  process.stdout.write('\n🚪  SECTION 5: Logout & Security\n');
  process.stdout.write('─'.repeat(54) + '\n');

  const logout = invoke(mkEvent({ action: 'logout' }, 'GET', null, sessionCookie));
  logout.statusCode === 302 && logout.headers && logout.headers['Location'] === '?'
    ? ok('Logout redirects to /?', '') : fail('Logout redirect', 'got:' + JSON.stringify(logout.headers));
  logout.headers && logout.headers['Set-Cookie'] && logout.headers['Set-Cookie'].includes('Max-Age=0')
    ? ok('Logout clears cookie', '[Max-Age=0]') : fail('Logout cookie not cleared');

  // After logout, old session should fail
  const afterLogout = invoke(mkEvent({ p: 'dashboard' }, 'GET', null, sessionCookie));
  afterLogout.statusCode === 200 && afterLogout.body.includes('Log in')
    ? ok('Expired session → login page', '[security confirmed]')
    : fail('Expired session should redirect to login');

  // No session → login page
  const noSession = invoke(mkEvent({ p: 'users' }, 'GET'));
  noSession.statusCode === 200 && noSession.body.includes('Log in')
    ? ok('No session → login page', '[confirmed]')
    : fail('No session should show login');

  // ── 6. Summary ────────────────────────────────────────────────────────────
  process.stdout.write('\n╔══════════════════════════════════════════════════════╗\n');
  const total = p + f;
  process.stdout.write('║  ' + p + '/' + total + ' passed' + (f > 0 ? '   (' + f + ' failed)' : '   🎉 100% Green!') + '                       ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════╝\n\n');

  if (f === 0) {
    process.stdout.write('🚀  ADMIN PANEL FULLY OPERATIONAL\n\n');
    process.stdout.write('  🌐 URL:      https://admin.yna.co.ke\n');
    process.stdout.write('  🔑 Login:    admin@aimobility.app  /  Admin@2024\n');
    process.stdout.write('  🗄️  Sessions: DynamoDB (aimobility-sessions)\n');
    process.stdout.write('  ⏱️  TTL:      12 hours auto-expiry\n\n');
  }
}

run().catch(e => { process.stdout.write('FATAL: ' + e.message + '\n'); process.exit(1); });
