/**
 * Final comprehensive test — every URL variant, with and without api-key
 */
const https = require('https');

let p = 0, f = 0;
const ok   = (n, d) => { process.stdout.write('  ✅ ' + n + (d ? '  ' + d : '') + '\n'); p++; };
const fail = (n, d) => { process.stdout.write('  ❌ ' + n + (d ? '  → ' + d : '') + '\n'); f++; };

function post(host, path, apiKey) {
  return new Promise(resolve => {
    const body = '{}';
    const h    = { 'Content-Type': 'application/json', 'Content-Length': 2 };
    if (apiKey) h['api-key'] = apiKey;
    const req  = https.request({ hostname: host, path, method: 'POST', headers: h }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.write(body); req.end();
  });
}

const KEY  = 'terraai-mobility-key-2024';
const BAD  = 'wrong-key-12345';
const H1   = 'api.yna.co.ke';       // custom domain
const H2   = 'pg4ulam66a.execute-api.us-east-1.amazonaws.com'; // direct

async function run() {
  process.stdout.write('\n╔═══════════════════════════════════════════════════════╗\n');
  process.stdout.write('║  aimobility API — All URL Variants + Key Scenarios   ║\n');
  process.stdout.write('╚═══════════════════════════════════════════════════════╝\n\n');

  // ── 1. api.yna.co.ke paths ─────────────────────────────────────────────────
  process.stdout.write('🌐  api.yna.co.ke (custom domain)\n');
  process.stdout.write('─'.repeat(55) + '\n');

  for (const [label, path, key] of [
    ['WITH key,    /api/health',       '/api/health',       KEY  ],
    ['WITHOUT key, /api/health',       '/api/health',       null ],
    ['WRONG key,   /api/health',       '/api/health',       BAD  ],
    ['WITH key,    /prod/api/health',  '/prod/api/health',  KEY  ],
    ['WITHOUT key, /prod/api/health',  '/prod/api/health',  null ],
    ['WITH key,    /health',           '/health',           KEY  ],
    ['WITHOUT key, /health',           '/health',           null ],
  ]) {
    const r = await post(H1, path, key);
    const body = JSON.parse(r.body || '{}');
    const good = r.status === 200 && body.code === '200';
    good ? ok(label, '[200 healthy]') : fail(label, 'status:' + r.status + ' code:' + body.code + ' msg:' + JSON.stringify(body.msg).slice(0,50));
  }

  // ── 2. Direct execute-api URL ─────────────────────────────────────────────
  process.stdout.write('\n🔗  Direct execute-api URL (pg4ulam66a)\n');
  process.stdout.write('─'.repeat(55) + '\n');

  for (const [label, path, key] of [
    ['WITH key,    /prod/api/health',  '/prod/api/health',  KEY  ],
    ['WITHOUT key, /prod/api/health',  '/prod/api/health',  null ],
    ['WRONG key,   /prod/api/health',  '/prod/api/health',  BAD  ],
  ]) {
    const r = await post(H2, path, key);
    const body = JSON.parse(r.body || '{}');
    const good = r.status === 200 && body.code === '200';
    good ? ok(label, '[200 healthy]') : fail(label, 'status:' + r.status + ' code:' + body.code + ' msg:' + JSON.stringify(body.msg).slice(0,50));
  }

  // ── 3. Real endpoint tests via api.yna.co.ke ──────────────────────────────
  process.stdout.write('\n📡  Key API Endpoints via api.yna.co.ke\n');
  process.stdout.write('─'.repeat(55) + '\n');

  const endpoints = [
    ['Login (admin)',     '/api/loginVendor',    JSON.stringify({email:'admin@aimobility.app',password:'Admin@2024'})],
    ['Get Restaurants',  '/api/getRestaurants',  '{}'],
    ['Get Users',        '/api/getAllUsers',      '{}'],
    ['Dashboard Stats',  '/api/dashboardData',   '{}'],
    ['Food Categories',  '/api/getFoodCategories','{}'],
    ['Ride Types',       '/api/getRideTypes',     '{}'],
    ['Get Coupons',      '/api/manageCoupon',     '{}'],
    ['Get Countries',    '/api/getCountries',     '{}'],
    ['Estimate Fare',    '/api/estimateFare',     JSON.stringify({pickup_lat:'-1.29',pickup_lng:'36.82',dropoff_lat:'-1.33',dropoff_lng:'36.80'})],
  ];

  // Test WITHOUT key — should all pass now
  process.stdout.write('  (testing WITHOUT api-key header — must all pass)\n');
  for (const [label, path, bodyStr] of endpoints) {
    const r = await new Promise(resolve => {
      const h = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) };
      const req = https.request({ hostname: H1, path, method: 'POST', headers: h }, res => {
        let b = ''; res.on('data', d => b += d); res.on('end', () => resolve({ status: res.statusCode, body: b }));
      });
      req.on('error', e => resolve({ status: 0, body: e.message }));
      req.setTimeout(12000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
      req.write(bodyStr); req.end();
    });
    const body = JSON.parse(r.body || '{}');
    const good = r.status === 200 && body.code === '200';
    const detail = Array.isArray(body.msg) ? '[' + body.msg.length + ' items]'
                 : body.msg && body.msg.User ? '[User: ' + body.msg.User.first_name + ']'
                 : body.msg && body.msg.estimated_fare ? '[fare: ' + body.msg.estimated_fare + ']'
                 : body.msg && body.msg.total_users !== undefined ? '[users:' + body.msg.total_users + ' restaurants:' + body.msg.total_restaurants + ']'
                 : '';
    good ? ok(label, detail) : fail(label, 'code:' + body.code + ' msg:' + JSON.stringify(body.msg).slice(0,60));
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = p + f;
  process.stdout.write('\n╔═══════════════════════════════════════════════════════╗\n');
  process.stdout.write('║  ' + p + '/' + total + ' passed' + (f === 0 ? '   🎉 ALL GREEN!' : '   (' + f + ' failed)') + '                        ║\n');
  process.stdout.write('╚═══════════════════════════════════════════════════════╝\n\n');

  if (f === 0) {
    process.stdout.write('🚀  API FULLY OPEN — works with OR without api-key\n\n');
    process.stdout.write('  Android app:  https://api.yna.co.ke/api/{endpoint}\n');
    process.stdout.write('  PHP portal:   https://api.yna.co.ke/api/{endpoint}\n');
    process.stdout.write('  Direct URL:   https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/{endpoint}\n');
    process.stdout.write('  Admin panel:  https://admin.yna.co.ke\n\n');
  }
}

run().catch(e => process.stdout.write('FATAL: ' + e.message + '\n'));
