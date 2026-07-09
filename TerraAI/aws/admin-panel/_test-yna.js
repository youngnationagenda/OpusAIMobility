const https = require('https');

const HOST = 'admin.yna.co.ke';

let p = 0, f = 0;
const ok   = (n, d) => { process.stdout.write('  ✅ ' + n + (d ? '  ' + d : '') + '\n'); p++; };
const fail = (n, d) => { process.stdout.write('  ❌ ' + n + (d ? '  → ' + d : '') + '\n'); f++; };

function request(method, path, body, cookieJar) {
  return new Promise((resolve, reject) => {
    const headers = { Host: HOST };
    if (body) { headers['Content-Type'] = 'application/x-www-form-urlencoded'; headers['Content-Length'] = Buffer.byteLength(body); }
    if (cookieJar && cookieJar.length) headers['Cookie'] = cookieJar.join('; ');
    const req = https.request({ hostname: HOST, path, method, headers }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw, cookies: [].concat(res.headers['set-cookie'] || []) }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function jar(setCookies) { return setCookies.map(c => c.split(';')[0]); }

async function run() {
  process.stdout.write('\n╔══════════════════════════════════════════════════╗\n');
  process.stdout.write('║  aimobility — https://admin.yna.co.ke LIVE TEST ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════╝\n\n');

  // 1. Login page
  process.stdout.write('🌐  Login Page\n─────────────────────────────────────────────────\n');
  const lp = await request('GET', '/');
  lp.status === 200 && lp.body.includes('Log in') ? ok('Login page loads', '['+lp.body.length+' bytes]') : fail('Login page', 'status:'+lp.status);
  lp.body.includes('aimobility') ? ok('Brand present') : fail('Brand missing');
  lp.body.includes('action=login') ? ok('Form correct') : fail('Form missing');

  // 2. Bad creds
  process.stdout.write('\n🔒  Bad Credentials\n─────────────────────────────────────────────────\n');
  const bad = await request('POST', '/?action=login', 'email=bad%40bad.com&password=wrong');
  bad.status === 200 && bad.body.includes('Invalid') ? ok('Error message shown') : fail('Bad creds not handled', bad.body.slice(0,80));

  // 3. Login
  process.stdout.write('\n🔐  Login with admin@aimobility.app / Admin@2024\n─────────────────────────────────────────────────\n');
  const login = await request('POST', '/?action=login', 'email=admin%40aimobility.app&password=Admin%402024');
  let cookieJar = [];
  if (login.status === 302) {
    ok('Login → 302 redirect', '[Location: '+login.headers.location+']');
    cookieJar = jar(login.cookies);
    const sid = cookieJar.find(c => c.startsWith('sid='));
    sid ? ok('Session cookie set', '['+sid.slice(0,22)+'...]') : fail('No session cookie');
  } else {
    fail('Login failed', 'status:'+login.status+' body:'+login.body.slice(0,100));
    process.stdout.write('\n⛔ Cannot continue\n'); return;
  }

  // 4. All pages
  process.stdout.write('\n📋  All Admin Pages\n─────────────────────────────────────────────────\n');
  const pages = [
    ['/?p=dashboard',     'Dashboard'],
    ['/?p=users',         'Users'],
    ['/?p=riders',        'Riders'],
    ['/?p=restaurants',   'Restaurants'],
    ['/?p=foodOrders',    'Food Orders'],
    ['/?p=trips',         'Trip Requests'],
    ['/?p=parcelOrders',  'Parcel Orders'],
    ['/?p=foodCategory',  'Food Categories'],
    ['/?p=rideTypes',     'Ride Types'],
    ['/?p=packageSize',   'Package Sizes'],
    ['/?p=goodType',      'Good Types'],
    ['/?p=coupons',       'Coupons'],
    ['/?p=serviceFee',    'Service Fees'],
    ['/?p=sliderImages',  'Slider Images'],
    ['/?p=reportReasons', 'Report Reasons'],
    ['/?p=policies',      'Policies'],
    ['/?p=adminUsers',    'Admin Users'],
    ['/?p=setting',       'Settings'],
  ];
  for (const [path, label] of pages) {
    const r = await request('GET', path, null, cookieJar);
    if (r.status === 200 && !r.body.includes('Log in') && r.body.length > 2000)
      ok(label, '['+r.body.length+' bytes]');
    else if (r.body.includes('Log in'))
      fail(label+' — showing login page!', 'cookie broken');
    else
      fail(label, 'status:'+r.status+' size:'+r.body.length);
  }

  // 5. Logout
  process.stdout.write('\n🚪  Logout\n─────────────────────────────────────────────────\n');
  const lo = await request('GET', '/?action=logout', null, cookieJar);
  lo.status === 302 ? ok('Logout → 302', '[Location: '+lo.headers.location+']') : fail('Logout', 'status:'+lo.status);
  const after = await request('GET', '/?p=dashboard', null, cookieJar);
  after.body.includes('Log in') ? ok('Session destroyed — shows login') : fail('Session not destroyed');

  // Summary
  const total = p + f;
  process.stdout.write('\n╔══════════════════════════════════════════════════╗\n');
  process.stdout.write('║  '+p+'/'+total+' passed'+(f===0?'  🎉 100% — FULLY WORKING!':'  ('+f+' failed)')+'              ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════╝\n\n');
  if (f === 0) {
    process.stdout.write('  🌐  https://admin.yna.co.ke\n');
    process.stdout.write('  🔑  admin@aimobility.app / Admin@2024\n\n');
  }
}
run().catch(e => process.stdout.write('FATAL: '+e.message+'\n'));
