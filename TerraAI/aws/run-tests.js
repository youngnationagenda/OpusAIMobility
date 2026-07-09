/**
 * aimobility API Test Suite
 * Tests all major endpoints against live Lambda
 */
const https = require('https');
const url   = require('url');

const API_BASE = 'https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/';
const API_KEY  = 'terraai-mobility-key-2024';

function call(ep, data) {
  return new Promise(resolve => {
    const body = JSON.stringify(data || {});
    const u    = url.parse(API_BASE + ep);
    const req  = https.request({
      hostname: u.hostname,
      path:     u.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'api-key':        API_KEY
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ ok: true, data: JSON.parse(raw) }); }
        catch(e) { resolve({ ok: false, error: 'Parse error: ' + raw.slice(0, 100) }); }
      });
    });
    req.on('error', e => resolve({ ok: false, error: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
    req.write(body);
    req.end();
  });
}

const tests = [
  { name: '🟢 Health Check',         ep: 'health',          data: {} },
  { name: '🔐 Admin Login',          ep: 'loginVendor',     data: { email: 'admin@aimobility.app', password: 'Admin@2024' } },
  { name: '👤 Get All Users',        ep: 'getAllUsers',      data: {} },
  { name: '🏍️  Get All Riders',      ep: 'getAllRiders',     data: {} },
  { name: '🍽️  Get Restaurants',     ep: 'getRestaurants',  data: {} },
  { name: '🛒 Get Food Orders',      ep: 'showFoodOrders',  data: {} },
  { name: '🚗 Get Trip Requests',    ep: 'tripRequest',     data: {} },
  { name: '📦 Get Parcel Orders',    ep: 'showParcelOrders', data: {} },
  { name: '📊 Dashboard Stats',      ep: 'dashboardData',   data: {} },
  { name: '🍔 Food Categories',      ep: 'getFoodCategories', data: {} },
  { name: '🚙 Ride Types',           ep: 'getRideTypes',    data: {} },
  { name: '📏 Package Sizes',        ep: 'getPackageSizes', data: {} },
  { name: '📦 Good Types',           ep: 'getGoodTypes',    data: {} },
  { name: '🎟️  Coupons',             ep: 'manageCoupon',    data: {} },
  { name: '💰 Service Fees',         ep: 'manageServiceFee', data: {} },
  { name: '🌍 Countries',            ep: 'getCountries',    data: {} },
  { name: '🔔 Payment Methods',      ep: 'getPaymentMethods', data: {} },
  { name: '📜 Get Policy',           ep: 'getHtmlPage',     data: { name: 'privacy_policy' } },
  { name: '🔑 Register User',        ep: 'signUp',          data: { first_name: 'Test', last_name: 'User2', email: 'test2@aimobility.app', password: 'Test@123' } },
  { name: '📍 Estimate Fare',        ep: 'estimateFare',    data: { pickup_lat: '-1.2921', pickup_lng: '36.8219', dropoff_lat: '-1.3000', dropoff_lng: '36.8300' } },
  { name: '🏪 Add Restaurant',       ep: 'addRestaurant',   data: { name: 'Test Cafe API', min_order_price: '150', lat: '-1.29', long: '36.82', delivery_fee: '50', delivery_min_time: '20', delivery_max_time: '45' } },
  { name: '📊 Admin Users',          ep: 'getAdminUsers',   data: {} },
  { name: '🔔 Notifications',        ep: 'getNotifications', data: { user_id: 'admin-001' } },
];

async function run() {
  process.stdout.write('\n═══════════════════════════════════════════════════\n');
  process.stdout.write('  aimobility Live API Test Suite\n');
  process.stdout.write('  API: ' + API_BASE + '\n');
  process.stdout.write('═══════════════════════════════════════════════════\n\n');

  let passed = 0, failed = 0;

  for (const t of tests) {
    try {
      const result = await call(t.ep, t.data);
      if (result.ok && result.data && result.data.code === '200') {
        const msg = result.data.msg;
        let detail = '';
        if (Array.isArray(msg)) detail = ' [' + msg.length + ' items]';
        else if (msg && typeof msg === 'object') {
          if (msg.User)   detail = ' [User: ' + (msg.User.first_name || '') + ' ' + (msg.User.last_name || '') + ']';
          if (msg.status) detail = ' [status: ' + msg.status + ']';
          if (msg.estimated_fare) detail = ' [fare: ' + msg.estimated_fare + ']';
          if (msg.total_users !== undefined) detail = ' [users:' + msg.total_users + ' rides:' + msg.total_trips + ' restaurants:' + msg.total_restaurants + ']';
        } else if (typeof msg === 'string') detail = ' [' + msg.slice(0, 40) + ']';
        process.stdout.write('  ✅ ' + t.name + detail + '\n');
        passed++;
      } else {
        process.stdout.write('  ❌ ' + t.name + ' → code:' + (result.data && result.data.code) + ' msg:' + JSON.stringify(result.data && result.data.msg).slice(0,60) + '\n');
        failed++;
      }
    } catch(e) {
      process.stdout.write('  💥 ' + t.name + ' → ' + e.message + '\n');
      failed++;
    }
  }

  process.stdout.write('\n═══════════════════════════════════════════════════\n');
  process.stdout.write('  Results: ' + passed + '/' + (passed+failed) + ' passed\n');
  process.stdout.write('═══════════════════════════════════════════════════\n\n');
}

run().catch(e => process.stdout.write('Fatal: ' + e.message + '\n'));
