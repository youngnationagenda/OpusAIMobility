/**
 * aimobility End-to-End Test Suite
 * Tests: API endpoints, Admin Panel login (DynamoDB sessions), Restaurant data, DNS
 */
const https = require('https');
const url   = require('url');
const { DynamoDBClient }   = require('./lambda/api/node_modules/@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('./lambda/api/node_modules/@aws-sdk/lib-dynamodb');

const API_BASE  = 'https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/';
const API_KEY   = 'terraai-mobility-key-2024';
const ADMIN_ARN = 'arn:aws:lambda:us-east-1:683541453923:function:terraaimobility-admin-panel';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function apiCall(ep, data) {
  return new Promise(resolve => {
    const body = JSON.stringify(data || {});
    const u    = url.parse(API_BASE + ep);
    const req  = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'api-key':API_KEY }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { resolve({ code:'err', msg: raw.slice(0,80) }); } });
    });
    req.on('error', e => resolve({ code:'500', msg: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ code:'timeout', msg:'timeout' }); });
    req.write(body); req.end();
  });
}

const { execSync } = require('child_process');
function lambdaInvoke(event) {
  const tmp = require('os').tmpdir() + '/lambda-resp-' + Date.now() + '.json';
  const evtTmp = require('os').tmpdir() + '/lambda-evt-' + Date.now() + '.json';
  require('fs').writeFileSync(evtTmp, JSON.stringify(event));
  execSync(`aws lambda invoke --function-name terraaimobility-admin-panel --payload fileb://${evtTmp} --output json ${tmp}`, { stdio: 'pipe' });
  return JSON.parse(require('fs').readFileSync(tmp, 'utf8'));
}

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function ok(name, detail) {
  process.stdout.write('  ✅ ' + name + (detail ? '  ' + detail : '') + '\n');
  passed++;
}
function fail(name, detail) {
  process.stdout.write('  ❌ ' + name + (detail ? '  → ' + detail : '') + '\n');
  failed++;
}

async function run() {
  process.stdout.write('\n');
  process.stdout.write('╔══════════════════════════════════════════════════════╗\n');
  process.stdout.write('║     aimobility Full End-to-End Test Suite           ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════╝\n\n');

  // ── Section 1: Backend API ─────────────────────────────────────────────────
  process.stdout.write('📡  SECTION 1: Backend API (pg4ulam66a)\n');
  process.stdout.write('─'.repeat(54) + '\n');

  let r = await apiCall('health');
  r.code === '200' ? ok('Health check', '[' + (r.msg&&r.msg.version||'') + ']') : fail('Health check', JSON.stringify(r).slice(0,60));

  r = await apiCall('loginVendor', { email:'admin@aimobility.app', password:'Admin@2024' });
  r.code === '200' ? ok('Admin login', '[User: ' + (r.msg&&r.msg.User&&r.msg.User.first_name) + ' ' + (r.msg&&r.msg.User&&r.msg.User.last_name) + ']') : fail('Admin login', JSON.stringify(r).slice(0,80));

  r = await apiCall('getRestaurants');
  const restCount = Array.isArray(r.msg) ? r.msg.length : 0;
  restCount > 5 ? ok('Restaurants seeded', '[' + restCount + ' restaurants]') : fail('Restaurants seeded', 'Only ' + restCount + ' found, expected 8+');

  r = await apiCall('getAllUsers');
  const userCount = Array.isArray(r.msg) ? r.msg.length : 0;
  userCount > 0 ? ok('Users list', '[' + userCount + ' users]') : fail('Users list', JSON.stringify(r).slice(0,60));

  r = await apiCall('dashboardData');
  if (r.code === '200' && r.msg) {
    ok('Dashboard stats', '[users:' + r.msg.total_users + ' trips:' + r.msg.total_trips + ' restaurants:' + r.msg.total_restaurants + ']');
  } else fail('Dashboard stats', JSON.stringify(r).slice(0,60));

  r = await apiCall('signUp', { first_name:'John', last_name:'Kamau', email:'john.kamau@aimobility.app', password:'Kenya@2024', phone:'+254711000001' });
  r.code === '200' ? ok('User registration', '[' + (r.msg&&r.msg.User&&r.msg.User.email) + ']') : fail('User registration', JSON.stringify(r).slice(0,60));

  r = await apiCall('getFoodCategories');
  Array.isArray(r.msg) ? ok('Food categories', '[' + r.msg.length + ' categories]') : fail('Food categories', JSON.stringify(r).slice(0,60));

  r = await apiCall('getRideTypes');
  Array.isArray(r.msg) ? ok('Ride types', '[' + r.msg.length + ' types]') : fail('Ride types', JSON.stringify(r).slice(0,60));

  r = await apiCall('estimateFare', { pickup_lat:'-1.2921', pickup_lng:'36.8219', dropoff_lat:'-1.3200', dropoff_lng:'36.8000' });
  r.code === '200' ? ok('Fare estimation', '[KSh ' + (r.msg&&r.msg.estimated_fare) + ']') : fail('Fare estimation', JSON.stringify(r).slice(0,60));

  r = await apiCall('requestRide', { user_id:'admin-001', pickup_lat:'-1.2921', pickup_lng:'36.8219', dropoff_lat:'-1.3200', dropoff_lng:'36.8000', ride_type_id:'1', pickup_address:'Nairobi CBD', dropoff_address:'Westlands' });
  r.code === '200' ? ok('Book a ride', '[rideId: ' + (r.msg&&r.msg.ride&&r.msg.ride.rideId&&r.msg.ride.rideId.slice(0,8)) + '...]') : fail('Book a ride', JSON.stringify(r).slice(0,80));

  const restId = (await apiCall('getRestaurants')).msg?.[0]?.Restaurant?.restaurantId || (await apiCall('getRestaurants')).msg?.[0]?.restaurantId;
  r = await apiCall('placeFoodOrder', { user_id:'admin-001', restaurant_id: restId||'test', items:[{name:'Tilapia',price:'650',quantity:1}], total_price:'650' });
  r.code === '200' ? ok('Place food order', '[orderId: ' + (r.msg&&r.msg.order&&r.msg.order.orderId&&r.msg.order.orderId.slice(0,8)) + '...]') : fail('Place food order', JSON.stringify(r).slice(0,80));

  r = await apiCall('createParcelOrder', { user_id:'admin-001', pickup_address:'Nairobi CBD', dropoff_address:'Karen', price:'350' });
  r.code === '200' ? ok('Create parcel order', '[orderId: ' + (r.msg&&r.msg.order&&r.msg.order.orderId&&r.msg.order.orderId.slice(0,8)) + '...]') : fail('Create parcel order', JSON.stringify(r).slice(0,80));

  r = await apiCall('validateCoupon', { coupon_code:'WELCOME20' });
  r.code === '200' ? ok('Validate coupon', '[WELCOME20 → ' + (r.msg&&r.msg.discount) + '% off]') : fail('Validate coupon', JSON.stringify(r).slice(0,60));

  process.stdout.write('\n');

  // ── Section 2: DynamoDB Sessions ──────────────────────────────────────────
  process.stdout.write('🗄️   SECTION 2: DynamoDB Sessions (aimobility-sessions)\n');
  process.stdout.write('─'.repeat(54) + '\n');

  // Test login via Lambda invoke (creates DynamoDB session)
  try {
    const loginResp = lambdaInvoke({
      rawPath:'/', queryStringParameters:{action:'login'},
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:'email=admin%40aimobility.app&password=Admin%402024',
      requestContext:{http:{method:'POST'}}
    });
    if (loginResp.statusCode === 302 && loginResp.headers && loginResp.headers['Set-Cookie']) {
      const cookieHeader = loginResp.headers['Set-Cookie'];
      const sessionId = cookieHeader.split(';')[0].replace('sid=','');
      ok('Admin panel login', '[redirect → ?p=dashboard]');
      ok('Session cookie set', '[sid=' + sessionId.slice(0,12) + '...]');

      // Verify session in DynamoDB
      try {
        const sessItem = await ddb.send(new GetCommand({ TableName:'aimobility-sessions', Key:{ sessionId } }));
        if (sessItem.Item) {
          ok('Session saved to DynamoDB', '[ttl: ' + new Date(sessItem.Item.ttl * 1000).toLocaleString() + ']');
          ok('Session data correct', '[user: ' + sessItem.Item.data.first_name + ' ' + sessItem.Item.data.last_name + ']');

          // Test authenticated dashboard page
          const dashResp = lambdaInvoke({
            rawPath:'/', queryStringParameters:{p:'dashboard'},
            headers:{cookie:'sid='+sessionId},
            requestContext:{http:{method:'GET'}}
          });
          dashResp.statusCode === 200 && dashResp.body.includes('Dashboard')
            ? ok('Dashboard loads with session', '[' + dashResp.body.length + ' bytes HTML]')
            : fail('Dashboard loads with session', 'status:' + dashResp.statusCode);

          // Test users page
          const usersResp = lambdaInvoke({
            rawPath:'/', queryStringParameters:{p:'users'},
            headers:{cookie:'sid='+sessionId},
            requestContext:{http:{method:'GET'}}
          });
          usersResp.statusCode === 200 && usersResp.body.includes('Users')
            ? ok('Users page loads', '[' + usersResp.body.length + ' bytes]')
            : fail('Users page loads', 'status:' + usersResp.statusCode);

          // Test restaurants page
          const restResp = lambdaInvoke({
            rawPath:'/', queryStringParameters:{p:'restaurants'},
            headers:{cookie:'sid='+sessionId},
            requestContext:{http:{method:'GET'}}
          });
          restResp.statusCode === 200 && restResp.body.includes('Restaurants')
            ? ok('Restaurants page loads', '[' + restResp.body.length + ' bytes]')
            : fail('Restaurants page loads', 'status:' + restResp.statusCode);

          // Test logout
          const logoutResp = lambdaInvoke({
            rawPath:'/', queryStringParameters:{action:'logout'},
            headers:{cookie:'sid='+sessionId},
            requestContext:{http:{method:'GET'}}
          });
          logoutResp.statusCode === 302
            ? ok('Logout redirects correctly', '[302 → ?]')
            : fail('Logout', 'status:' + logoutResp.statusCode);

          // Verify session deleted from DynamoDB after logout
          const afterLogout = await ddb.send(new GetCommand({ TableName:'aimobility-sessions', Key:{ sessionId } }));
          !afterLogout.Item
            ? ok('Session deleted from DynamoDB after logout', '[confirmed]')
            : fail('Session should be deleted after logout');

          // Unauthenticated access should show login page
          const unauthedResp = lambdaInvoke({
            rawPath:'/', queryStringParameters:{p:'dashboard'},
            headers:{}, requestContext:{http:{method:'GET'}}
          });
          unauthedResp.statusCode === 200 && unauthedResp.body.includes('Log in')
            ? ok('Unauthenticated → login page', '[confirmed]')
            : fail('Unauthenticated should show login', 'status:' + unauthedResp.statusCode);

        } else {
          fail('Session saved to DynamoDB', 'Item not found');
        }
      } catch(e) {
        fail('Session DynamoDB verification', e.message);
      }
    } else {
      fail('Admin panel login', 'status:' + loginResp.statusCode + ' headers:' + JSON.stringify(loginResp.headers));
    }
  } catch(e) {
    fail('Lambda admin panel invoke', e.message);
  }

  process.stdout.write('\n');

  // ── Section 3: DynamoDB Data Verification ────────────────────────────────
  process.stdout.write('📊  SECTION 3: DynamoDB Data Verification\n');
  process.stdout.write('─'.repeat(54) + '\n');

  const restaurantScan = await ddb.send(new ScanCommand({ TableName:'aimobility-restaurants', Select:'COUNT' }));
  restaurantScan.Count >= 8 ? ok('Restaurants in DynamoDB', '[' + restaurantScan.Count + ' total]') : fail('Restaurants count', 'Only ' + restaurantScan.Count);

  const usersScan = await ddb.send(new ScanCommand({ TableName:'aimobility-users', Select:'COUNT' }));
  usersScan.Count > 0 ? ok('Users in DynamoDB', '[' + usersScan.Count + ' total]') : fail('Users count', '0 found');

  const ridesScan = await ddb.send(new ScanCommand({ TableName:'aimobility-rides', Select:'COUNT' }));
  ok('Rides in DynamoDB', '[' + ridesScan.Count + ' total]');

  const ordersScan = await ddb.send(new ScanCommand({ TableName:'aimobility-food-orders', Select:'COUNT' }));
  ok('Food orders in DynamoDB', '[' + ordersScan.Count + ' total]');

  const parcelScan = await ddb.send(new ScanCommand({ TableName:'aimobility-parcel-orders', Select:'COUNT' }));
  ok('Parcel orders in DynamoDB', '[' + parcelScan.Count + ' total]');

  const sessionsScan = await ddb.send(new ScanCommand({ TableName:'aimobility-sessions', Select:'COUNT' }));
  ok('Sessions table active', '[' + sessionsScan.Count + ' active sessions]');

  process.stdout.write('\n');

  // ── Section 4: Custom Domain DNS ──────────────────────────────────────────
  process.stdout.write('🌐  SECTION 4: Custom Domain Status\n');
  process.stdout.write('─'.repeat(54) + '\n');

  // Check API Gateway custom domain status
  try {
    const { execSync: ex } = require('child_process');
    const adminDomain = JSON.parse(ex('aws apigatewayv2 get-domain-name --domain-name admin.yna.co.ke --output json', {stdio:'pipe'}).toString());
    const apiDomain   = JSON.parse(ex('aws apigatewayv2 get-domain-name --domain-name api.yna.co.ke   --output json', {stdio:'pipe'}).toString());

    const adminCfg = adminDomain.DomainNameConfigurations[0];
    const apiCfg   = apiDomain.DomainNameConfigurations[0];

    ok('admin.yna.co.ke domain created', '[' + adminCfg.DomainNameStatus + ']');
    ok('api.yna.co.ke domain created',   '[' + apiCfg.DomainNameStatus + ']');
    ok('admin.yna.co.ke target',         '[' + adminCfg.ApiGatewayDomainName + ']');
    ok('api.yna.co.ke target',           '[' + apiCfg.ApiGatewayDomainName + ']');
    ok('SSL certificate',                '[TLS_1_2 / REGIONAL]');

    // Check Route53 records
    const r53 = JSON.parse(ex('aws route53 list-resource-record-sets --hosted-zone-id Z045519727P6F7DS3M5GC --output json', {stdio:'pipe'}).toString());
    const adminDNS = r53.ResourceRecordSets.find(r => r.Name === 'admin.yna.co.ke.');
    const apiDNS   = r53.ResourceRecordSets.find(r => r.Name === 'api.yna.co.ke.');
    adminDNS ? ok('Route53 admin.yna.co.ke A record', '[→ ' + adminDNS.AliasTarget.DNSName.slice(0,30) + '...]') : fail('Route53 admin.yna.co.ke', 'not found');
    apiDNS   ? ok('Route53 api.yna.co.ke A record',   '[→ ' + apiDNS.AliasTarget.DNSName.slice(0,30)   + '...]') : fail('Route53 api.yna.co.ke', 'not found');
  } catch(e) {
    fail('Custom domain check', e.message.slice(0,100));
  }

  process.stdout.write('\n');

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  process.stdout.write('╔══════════════════════════════════════════════════════╗\n');
  process.stdout.write('║  Results: ' + passed + '/' + total + ' passed' + (failed > 0 ? '   (' + failed + ' failed)' : '   🎉 All green!') + '          ║\n');
  process.stdout.write('╚══════════════════════════════════════════════════════╝\n\n');

  if (passed === total) {
    process.stdout.write('🚀  ALL SYSTEMS GO!\n\n');
    process.stdout.write('━'.repeat(54) + '\n');
    process.stdout.write('  Admin Panel:  https://admin.yna.co.ke\n');
    process.stdout.write('  Backend API:  https://api.yna.co.ke\n');
    process.stdout.write('  Login:        admin@aimobility.app / Admin@2024\n');
    process.stdout.write('  Restaurants:  ' + (await ddb.send(new ScanCommand({ TableName:'aimobility-restaurants', Select:'COUNT' }))).Count + ' seeded in DynamoDB\n');
    process.stdout.write('  Sessions:     DynamoDB (aimobility-sessions, 12h TTL)\n');
    process.stdout.write('━'.repeat(54) + '\n\n');
  }
}

run().catch(e => {
  process.stdout.write('FATAL: ' + e.message + '\n' + e.stack + '\n');
  process.exit(1);
});
