/**
 * admin-index.js — terraaimobility-admin Lambda v4.0
 * Full GoGrab AdminController + VendorController migration
 * Handles all admin panel, vendor portal, and management API requests.
 *
 * Migrated from php-api/mobileapp_api/app/Controller/AdminController.php
 * Migrated from php-api/mobileapp_api/app/Controller/VendorController.php
 */
const db   = require('./db');
const auth = require('./auth');
const { handleAdminRoute } = require('./admin-handler');
const { generateUploadUrl, deleteAsset } = require('./storage');
const { sendMail } = require('./mailer');

if (!process.env.COGNITO_USER_POOL_ID) throw new Error('COGNITO_USER_POOL_ID required');
if (!process.env.COGNITO_CLIENT_ID)    throw new Error('COGNITO_CLIENT_ID required');

function response(statusCode, body) {
  return { statusCode, headers:{ 'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization,api-key,Api-Key','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS' }, body: JSON.stringify(body) };
}
const ok  = msg     => response(200, { code:'200', msg });
const err = (msg,c) => response(200, { code:c||'400', msg });

function getBody(e) {
  try { let raw = e.body||''; if(e.isBase64Encoded&&raw) raw=Buffer.from(raw,'base64').toString('utf8'); if(raw){ const ct=(e.headers&&(e.headers['content-type']||e.headers['Content-Type'])||'').toLowerCase(); if(ct.includes('urlencoded')){const p={};raw.split('&').forEach(x=>{const[k,v]=x.split('=');if(k)p[decodeURIComponent(k)]=decodeURIComponent(v||'');});return p;} if(raw.trim().startsWith('{')||raw.trim().startsWith('['))return JSON.parse(raw); } if(e.queryStringParameters&&Object.keys(e.queryStringParameters).length>0)return e.queryStringParameters; return {}; } catch(_){return e.queryStringParameters||{};}
}

function getPath(e) {
  let p = e.rawPath||e.path||(e.pathParameters&&e.pathParameters.proxy?'/'+e.pathParameters.proxy:'/');
  p = p.replace(/^\/prod/,'').replace(/^\/admin/,'').replace(/^\/api/,'');
  return p||'/';
}

function getRoute(path) {
  return path.replace(/^\/+/,'').replace(/\/[0-9a-zA-Z_-]{20,}\//,'/')||'';
}

// Admin-specific public routes (no JWT needed for health + login)
const ADMIN_PUBLIC = new Set(['health','ping','','/',
  'loginVendor','vendorLogin','adminLogin','login',
  'showCountries','getCountries','showAppSliderImages','getHtmlPage',
  'getSettings','setting','getDashboardStats','dashboardData',
  'uploadAsset','getUploadUrl','requestUploadUrl',
]);

exports.handler = async (event) => {
  console.log('[admin-lambda]', event.rawPath||event.path);
  if ((event.requestContext&&event.requestContext.http&&event.requestContext.http.method)==='OPTIONS' || event.httpMethod==='OPTIONS') return response(200,{message:'OK'});

  const path  = getPath(event);
  const route = getRoute(path);
  const body  = getBody(event);
  console.log('[admin-lambda] route:',route);

  // Auth check
  const cognitoUser = await auth.verifyCognitoToken(event);
  if (!ADMIN_PUBLIC.has(route) && !cognitoUser) return err('Authentication required','401');
  if (cognitoUser) body._cognitoUser = cognitoUser;

  // Only allow admin/vendor roles on protected routes
  if (cognitoUser && !ADMIN_PUBLIC.has(route)) {
    const userRole = cognitoUser['custom:role'] || cognitoUser.role || '';
    if (userRole && userRole !== 'admin' && userRole !== 'vendor' && userRole !== 'superadmin') {
      return err('Insufficient permissions — admin or vendor role required','403');
    }
  }

  try {
    // Handle health
    if (route === 'health' || route === 'ping' || route === '' || route === '/') {
      return ok({status:'healthy',service:'aimobility Admin API',version:'4.0.0',backend:'DynamoDB+Cognito+SNS',auth:'JWT',description:'Full GoGrab AdminController + VendorController migration'});
    }

    // Dashboard
    if (route === 'dashboardData' || route === 'getDashboardStats' || route === 'adminDashboard') {
      const [users,rides,fo,po,rest] = await Promise.all([
        db.scanTable(db.T.USERS,1000), db.scanTable(db.T.RIDES,1000),
        db.scanTable(db.T.FOOD_ORDERS,1000), db.scanTable(db.T.PARCEL_ORDERS,1000),
        db.scanTable(db.T.RESTAURANTS,1000)
      ]);
      return ok({total_users:users.filter(u=>u.role==='user').length,total_drivers:users.filter(u=>u.role==='driver').length,total_vendors:users.filter(u=>u.role==='vendor').length,total_trips:rides.length,total_food_orders:fo.length,total_parcel_orders:po.length,total_restaurants:rest.length,revenue_today:'0.00',revenue_month:'0.00',active_rides:rides.filter(r=>r.status==='active').length,pending_orders:fo.filter(o=>o.status==='pending').length});
    }

    // Delegate to admin-handler for all other routes
    const result = await handleAdminRoute(route, body);
    if (result) return result;

    // Route not found
    return err('Admin route not found: '+route,'404');
  } catch(e) {
    console.error('[admin-lambda] Error:', e);
    return response(500,{code:'500',msg:'Server error: '+e.message});
  }
};
