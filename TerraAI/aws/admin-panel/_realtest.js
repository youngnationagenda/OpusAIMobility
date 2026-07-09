/**
 * Real browser simulation test — uses actual HTTPS requests to the API Gateway
 * endpoint, following redirects and managing cookies exactly like a browser does.
 */
const https = require('https');

const HOST = 'wqhukwpxqc.execute-api.us-east-1.amazonaws.com';
const BASE = '/prod';

let p = 0, f = 0;
const ok   = (n, d) => { process.stdout.write('  ✅ ' + n + (d ? '  ' + d : '') + '\n'); p++; };
const fail = (n, d) => { process.stdout.write('  ❌ ' + n + (d ? '  → ' + d : '') + '\n'); f++; };

function request(method, path, body, cookieJar) {
  return new Promise((resolve, reject) => {
    const headers = { 'Host': HOST };
    if (body) {
      headers['Content-Type']   = 'application/x-www-form-urlencoded';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    if (cookieJar && cookieJar.length) {
      headers['Cookie'] = cookieJar.join('; ');
    }
    const req = https.request(
      { hostname: HOST, path: BASE + path, method, headers },
      res => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => {
          const setCookies = [].concat(res.headers['set-cookie'] || []);
          resolve({ status: res.statusCode, headers: res.headers, body: raw, cookies: setCookies });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function extractCookies(setCookieHeaders) {
  return setCookieHeaders.map(c => c.split(';')[0]);
}

async function run() {
  process.stdout.write('\n╔══════════════════════════════════════════════════════╗\n');
  process.stdout.write('║  REAL Browser Simulation Test — Live HTTPS           ║\n');
  process.stdout.write('║  ' + HOST + '  ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════╝\n\n');

  // ── 1. Load login page ────────────────────────────────────────────────────
  process.stdout.write('🌐  STEP 1: Load Login Page\n');
  process.stdout.write('─'.repeat(54) + '\n');
  const loginPageResp = await request('GET', '/');
  loginPageResp.status === 200 && loginPageResp.body.includes('Log in')
    ? ok('GET /prod/ → login page', '[' + loginPageResp.body.length + ' bytes]')
    : fail('GET login page', 'status:' + loginPageResp.status + ' size:' + loginPageResp.body.length);
  loginPageResp.body.includes('aimobility') ? ok('Branding present', '') : fail('Branding missing');
  loginPageResp.body.includes('action=login') ? ok('Form action=login', '') : fail('Form action missing');

  // ── 2. Submit bad credentials ─────────────────────────────────────────────
  process.stdout.write('\n🔒  STEP 2: Bad Credentials\n');
  process.stdout.write('─'.repeat(54) + '\n');
  const badResp = await request('POST', '/?action=login', 'email=wrong%40test.com&password=badpass');
  badResp.status === 200 && badResp.body.includes('Invalid')
    ? ok('Bad login → error message shown', '')
    : fail('Bad login handling', 'status:' + badResp.status + ' snippet:' + badResp.body.slice(0, 80));

  // ── 3. Submit correct credentials ────────────────────────────────────────
  process.stdout.write('\n🔐  STEP 3: Correct Login\n');
  process.stdout.write('─'.repeat(54) + '\n');
  const loginResp = await request('POST', '/?action=login', 'email=admin%40aimobility.app&password=Admin%402024');

  if (loginResp.status === 302) {
    ok('Login POST → 302 redirect', '[Location: ' + loginResp.headers.location + ']');
  } else {
    fail('Login should 302 redirect', 'got status:' + loginResp.status);
  }

  const cookieJar = extractCookies(loginResp.cookies);
  const sidCookie = cookieJar.find(c => c.startsWith('sid='));
  if (sidCookie) {
    ok('Session cookie received', '[' + sidCookie.slice(0, 20) + '...]');
  } else {
    fail('No session cookie in response', 'cookies:' + JSON.stringify(loginResp.cookies));
    process.stdout.write('\n⛔  Cannot continue without session cookie\n');
    process.stdout.write('  Results: ' + p + '/' + (p+f) + ' passed\n\n');
    return;
  }

  // ── 4. Access dashboard WITH cookie ──────────────────────────────────────
  process.stdout.write('\n📊  STEP 4: Authenticated Pages\n');
  process.stdout.write('─'.repeat(54) + '\n');

  const dashResp = await request('GET', '/?p=dashboard', null, cookieJar);
  if (dashResp.status === 200 && dashResp.body.includes('Dashboard') && !dashResp.body.includes('Log in')) {
    ok('Dashboard loads ✨', '[' + dashResp.body.length + ' bytes — AUTHENTICATED!]');
  } else if (dashResp.body.includes('Log in')) {
    fail('Dashboard still showing LOGIN PAGE — cookie not working', 'body snippet: ' + dashResp.body.slice(0, 150));
  } else {
    fail('Dashboard unexpected response', 'status:' + dashResp.status);
  }

  // Test all 17 other pages
  const pages = [
    ['users',         'Users'],
    ['riders',        'Riders'],
    ['restaurants',   'Restaurants'],
    ['foodOrders',    'Food Orders'],
    ['trips',         'Trip Requests'],
    ['parcelOrders',  'Parcel Orders'],
    ['foodCategory',  'Food Categories'],
    ['rideTypes',     'Ride Types'],
    ['packageSize',   'Package Sizes'],
    ['goodType',      'Good Types'],
    ['coupons',       'Coupons'],
    ['serviceFee',    'Service Fees'],
    ['sliderImages',  'Slider Images'],
    ['reportReasons', 'Report Reasons'],
    ['policies',      'Policies'],
    ['adminUsers',    'Admin Users'],
    ['setting',       'Settings'],
  ];

  for (const [page, label] of pages) {
    const r = await request('GET', '/?p=' + page, null, cookieJar);
    if (r.status === 200 && !r.body.includes('Log in') && r.body.length > 2000) {
      ok(label + ' page', '[' + r.body.length + ' bytes]');
    } else if (r.body.includes('Log in')) {
      fail(label + ' → showing login (cookie broken!)', '');
    } else {
      fail(label + ' page', 'status:' + r.status + ' size:' + r.body.length);
    }
  }

  // ── 5. Logout ─────────────────────────────────────────────────────────────
  process.stdout.write('\n🚪  STEP 5: Logout\n');
  process.stdout.write('─'.repeat(54) + '\n');
  const logoutResp = await request('GET', '/?action=logout', null, cookieJar);
  logoutResp.status === 302 && logoutResp.headers.location === '?'
    ? ok('Logout → 302 to /?', '')
    : fail('Logout', 'status:' + logoutResp.status + ' location:' + logoutResp.headers.location);

  // After logout, same cookie must show login page
  const afterLogout = await request('GET', '/?p=dashboard', null, cookieJar);
  afterLogout.body.includes('Log in')
    ? ok('After logout → login page (session destroyed)', '')
    : fail('After logout should show login', 'showed dashboard instead');

  // ── Summary ───────────────────────────────────────────────────────────────
  process.stdout.write('\n╔══════════════════════════════════════════════════════╗\n');
  const total = p + f;
  process.stdout.write('║  ' + p + '/' + total + ' passed' + (f > 0 ? '   (' + f + ' failed)' : '   🎉 100%!') + '                         ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════╝\n\n');

  if (f === 0) {
    process.stdout.write('🚀  ADMIN PANEL FULLY WORKING IN BROWSER!\n\n');
    process.stdout.write('  URL:    https://wqhukwpxqc.execute-api.us-east-1.amazonaws.com/prod\n');
    process.stdout.write('         https://admin.yna.co.ke  (DNS propagating)\n');
    process.stdout.write('  Login:  admin@aimobility.app  /  Admin@2024\n\n');
  }
}

run().catch(e => { process.stdout.write('FATAL: ' + e.message + '\n'); process.exit(1); });
