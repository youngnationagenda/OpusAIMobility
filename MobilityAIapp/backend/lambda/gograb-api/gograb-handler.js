'use strict';
/**
 * GoGrab API Lambda Handler
 * Migrated from PHP CakePHP mobileapp_api → DynamoDB
 * All 56 MySQL tables mapped to 23 DynamoDB tables
 * Routes: /gograb/api/* and /gograb/admin/*
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand,
  ScanCommand, QueryCommand, UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const S3_BUCKET = process.env.S3_UPLOADS_BUCKET || 'aimobility-uploads-683541453923';

const REGION = process.env.REGION || 'us-east-1';
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const sns = new SNSClient({ region: REGION });
const s3  = new S3Client({ region: REGION });
const SNS_TOPIC = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,User-Id,Auth-Token,Api-Key'
};

const ok  = (b, s) => ({ statusCode: s || 200, headers: CORS, body: JSON.stringify(b) });
const err = (m, s) => ({ statusCode: s || 500, headers: CORS, body: JSON.stringify({ code: s || 500, msg: m }) });

// DynamoDB table names (migrated from gograb MySQL)
const T = {
  USERS:     'gograb-users',
  RST:       'gograb-restaurants',
  MENUS:     'gograb-restaurant-menus',
  ITEMS:     'gograb-restaurant-menu-items',
  FOOD:      'gograb-food-orders',
  PARCEL:    'gograb-parcel-orders',
  TRIPS:     'gograb-trips',
  REQS:      'gograb-requests',
  VEHICLES:  'gograb-vehicles',
  VEH_TYPES: 'gograb-vehicle-types',
  RIDE_TYPES:'gograb-ride-types',
  COUPONS:   'gograb-coupons',
  FOOD_CATS: 'gograb-food-categories',
  PKG:       'gograb-package-sizes',
  GOODS:     'gograb-good-types',
  NOTIFS:    'gograb-notifications',
  DR:        'gograb-driver-ratings',
  TXN:       'gograb-transactions',
  DOCS:      'gograb-user-documents',
  SVC:       'gograb-service-charges',
  PAGES:     'gograb-html-pages',
  WDRAW:     'gograb-withdraw-requests',
  CFG:       'gograb-app-config',
};

// DynamoDB helpers
const dbGet   = async (t, k) => { const r = await ddb.send(new GetCommand({ TableName: t, Key: k })); return r.Item || null; };
const dbPut   = async (t, i) => { await ddb.send(new PutCommand({ TableName: t, Item: i })); return i; };
const dbDel   = async (t, k) => ddb.send(new DeleteCommand({ TableName: t, Key: k }));
const dbScan  = async (t)    => { const r = await ddb.send(new ScanCommand({ TableName: t })); return r.Items || []; };
const dbQuery = async (t, idx, k, v) => {
  const r = await ddb.send(new QueryCommand({
    TableName: t, IndexName: idx,
    KeyConditionExpression: '#k = :v',
    ExpressionAttributeNames: { '#k': k },
    ExpressionAttributeValues: { ':v': v }
  }));
  return r.Items || [];
};
const genId = (pfx) => (pfx || 'gg') + '-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex');

// ── USER MANAGEMENT ──────────────────────────────────────────────────────────
async function registerUser(b) {
  const { email, phone, firstName, lastName, role, password, socialId, social, deviceToken, countryId } = b;
  if (!email && !phone) return err('email or phone required', 400);
  if (email) {
    const ex = await dbQuery(T.USERS, 'email-index', 'email', email);
    if (ex.length) return ok({ code: 200, msg: ex[0], existing: true });
  }
  const uid = genId('usr');
  const user = {
    id: uid, email: email || '', phone: phone || '',
    firstName: firstName || '', lastName: lastName || '',
    fullName: `${firstName || ''} ${lastName || ''}`.trim(),
    role: role || 'user',
    opusRole: role === 'rider' ? 'rider' : role === 'vendor' ? 'vendor' : 'customer',
    socialId: socialId || '', social: social || '', deviceToken: deviceToken || '',
    countryId: String(countryId || 1), wallet: 0, online: 0, verified: 0, active: 1,
    image: '', paypal: '', riderFeeFood: 0, riderCommission: 0,
    createdAt: new Date().toISOString()
  };
  if (password) user.passwordHash = password.startsWith('$2') ? password : null;
  await dbPut(T.USERS, user);
  return ok({ code: 200, msg: user });
}

async function loginUser(b) {
  const { email, phone, password, deviceToken } = b;
  let users = [];
  if (email)      users = await dbQuery(T.USERS, 'email-index', 'email', email);
  else if (phone) users = await dbQuery(T.USERS, 'phone-index', 'phone', phone);
  if (!users.length) return err('User not found', 404);
  const u = users[0];
  if (u.active > 1) return err('Account blocked. Contact support.', 403);
  const authToken = crypto.randomBytes(32).toString('hex');
  try {
    await ddb.send(new UpdateCommand({
      TableName: T.USERS, Key: { id: u.id },
      UpdateExpression: 'SET authToken = :t, deviceToken = :d, lastLogin = :l',
      ExpressionAttributeValues: { ':t': authToken, ':d': deviceToken || u.deviceToken || '', ':l': new Date().toISOString() }
    }));
  } catch (e) {
    await dbPut(T.USERS, { ...u, authToken, deviceToken: deviceToken || u.deviceToken || '' });
  }
  return ok({ code: 200, msg: { ...u, authToken } });
}

async function getUserProfile(uid) {
  const u = await dbGet(T.USERS, { id: uid });
  if (!u) return err('Not found', 404);
  return ok({ code: 200, msg: u });
}

async function updateUserProfile(uid, b) {
  const u = await dbGet(T.USERS, { id: uid });
  if (!u) return err('Not found', 404);
  const up = { ...u, ...b, id: uid, updatedAt: new Date().toISOString() };
  await dbPut(T.USERS, up);
  return ok({ code: 200, msg: up });
}

// ── RESTAURANTS ──────────────────────────────────────────────────────────────
async function listRestaurants() {
  const items = await dbScan(T.RST);
  return ok({ code: 200, msg: items.filter(r => !r.block) });
}

async function getRestaurant(rid) {
  const r = await dbGet(T.RST, { id: rid });
  if (!r) return err('Not found', 404);
  const menus = await dbQuery(T.MENUS, 'restaurantId-index', 'restaurantId', rid);
  for (const m of menus) m.items = await dbQuery(T.ITEMS, 'menuId-index', 'menuId', m.id);
  return ok({ code: 200, msg: { ...r, menus } });
}

async function createRestaurant(b) {
  const rid = genId('rst');
  const r = { id: rid, ...b, view: 0, block: 0, createdAt: new Date().toISOString() };
  await dbPut(T.RST, r);
  return ok({ code: 200, msg: r });
}

async function updateRestaurant(rid, b) {
  const r = await dbGet(T.RST, { id: rid });
  if (!r) return err('Not found', 404);
  const up = { ...r, ...b, id: rid, updatedAt: new Date().toISOString() };
  await dbPut(T.RST, up);
  return ok({ code: 200, msg: up });
}

async function getRestaurantMenu(rid) {
  const menus = await dbQuery(T.MENUS, 'restaurantId-index', 'restaurantId', rid);
  for (const m of menus) m.items = await dbQuery(T.ITEMS, 'menuId-index', 'menuId', m.id);
  return ok({ code: 200, msg: menus });
}

async function addMenuItem(b) {
  const mid = genId('mnu');
  const item = { id: mid, ...b, active: 1, createdAt: new Date().toISOString() };
  await dbPut(T.ITEMS, item);
  return ok({ code: 200, msg: item });
}

// ── FOOD ORDERS ───────────────────────────────────────────────────────────────
async function placeFoodOrder(b) {
  const oid = genId('fod');
  const order = { id: oid, ...b, status: 0, statusDatetime: new Date().toISOString(), createdAt: new Date().toISOString() };
  await dbPut(T.FOOD, order);
  if (b.restaurantId) {
    const r = await dbGet(T.RST, { id: String(b.restaurantId) });
    if (r && r.userId) {
      const n = { id: genId('ntf'), receiverId: String(r.userId), title: 'New Order', description: `Order #${oid}`, type: 'food_order', createdAt: new Date().toISOString() };
      await dbPut(T.NOTIFS, n);
      try { await sns.send(new PublishCommand({ TopicArn: SNS_TOPIC, Message: JSON.stringify({ userId: String(r.userId), title: 'New Order', body: `Order #${oid}`, type: 'food_order' }), Subject: 'New Order' })); } catch {}
    }
  }
  return ok({ code: 200, msg: order });
}

async function getFoodOrders(uid) {
  const orders = await dbQuery(T.FOOD, 'userId-index', 'userId', uid);
  return ok({ code: 200, msg: orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
}

async function updateFoodOrderStatus(oid, b) {
  const o = await dbGet(T.FOOD, { id: oid });
  if (!o) return err('Not found', 404);
  const labels = { 0: 'Processing', 1: 'Accepted', 2: 'Completed', 3: 'Cancelled' };
  o.status = b.status; o.statusDatetime = new Date().toISOString();
  await dbPut(T.FOOD, o);
  const n = { id: genId('ntf'), receiverId: o.userId, title: 'Order Update', description: `Order ${labels[b.status]}`, type: 'food_order_status', createdAt: new Date().toISOString() };
  await dbPut(T.NOTIFS, n);
  try { await sns.send(new PublishCommand({ TopicArn: SNS_TOPIC, Message: JSON.stringify({ userId: o.userId, title: 'Order Update', body: labels[b.status], type: 'food_order_status' }) })); } catch {}
  return ok({ code: 200, msg: o });
}

// ── PARCEL ORDERS ─────────────────────────────────────────────────────────────
async function placeParcelOrder(b) {
  const oid = genId('pcl');
  const o = { id: oid, ...b, status: 0, createdAt: new Date().toISOString() };
  await dbPut(T.PARCEL, o);
  return ok({ code: 200, msg: o });
}
async function getParcelOrders(uid) { return ok({ code: 200, msg: await dbQuery(T.PARCEL, 'userId-index', 'userId', uid) }); }

// ── RIDE REQUESTS ─────────────────────────────────────────────────────────────
async function createRequest(b) {
  const rid = genId('req');
  const r = { id: rid, ...b, request: 0, status: 0, createdAt: new Date().toISOString() };
  await dbPut(T.REQS, r);
  return ok({ code: 200, msg: r });
}
async function getRideRequests(uid) { return ok({ code: 200, msg: await dbQuery(T.REQS, 'userId-index', 'userId', uid) }); }
async function updateRequest(rid, b) {
  const r = await dbGet(T.REQS, { id: rid });
  if (!r) return err('Not found', 404);
  const up = { ...r, ...b, id: rid, updatedAt: new Date().toISOString() };
  await dbPut(T.REQS, up);
  return ok({ code: 200, msg: up });
}

// ── TRIPS ─────────────────────────────────────────────────────────────────────
async function createTrip(b) {
  const tid = genId('trp');
  const t = { id: tid, ...b, createdAt: new Date().toISOString() };
  await dbPut(T.TRIPS, t);
  return ok({ code: 200, msg: t });
}
async function getTrips(uid, role) {
  const idx = role === 'driver' ? 'driverId-index' : 'userId-index';
  const k   = role === 'driver' ? 'driverId' : 'userId';
  return ok({ code: 200, msg: await dbQuery(T.TRIPS, idx, k, uid) });
}

// ── VEHICLES ──────────────────────────────────────────────────────────────────
async function createVehicle(b) {
  const vid = genId('vhc');
  const v = { id: vid, ...b, createdAt: new Date().toISOString() };
  await dbPut(T.VEHICLES, v);
  return ok({ code: 200, msg: v });
}
async function getVehicles(uid)   { return ok({ code: 200, msg: await dbQuery(T.VEHICLES, 'userId-index', 'userId', uid) }); }
async function getVehicleTypes()  { return ok({ code: 200, msg: await dbScan(T.VEH_TYPES) }); }
async function getRideTypes()     { return ok({ code: 200, msg: await dbScan(T.RIDE_TYPES) }); }

// ── CATALOGUE ─────────────────────────────────────────────────────────────────
async function getFoodCategories() { return ok({ code: 200, msg: await dbScan(T.FOOD_CATS) }); }
async function getPackageSizes()   { return ok({ code: 200, msg: await dbScan(T.PKG) }); }
async function getGoodTypes()      { return ok({ code: 200, msg: await dbScan(T.GOODS) }); }
async function getServiceCharges() { return ok({ code: 200, msg: await dbScan(T.SVC) }); }
async function listCoupons()       { return ok({ code: 200, msg: await dbScan(T.COUPONS) }); }
async function validateCoupon(b) {
  const items = await dbQuery(T.COUPONS, 'couponCode-index', 'couponCode', b.couponCode || '');
  if (!items.length) return err('Invalid coupon', 404);
  const c = items[0];
  if (new Date(c.expiryDate) < new Date()) return err('Coupon expired', 400);
  return ok({ code: 200, msg: c });
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
async function getNotifications(uid) {
  const n = await dbQuery(T.NOTIFS, 'receiverId-index', 'receiverId', uid);
  return ok({ code: 200, msg: n.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
}
async function sendNotification(b) {
  const nid = genId('ntf');
  const n = { id: nid, ...b, createdAt: new Date().toISOString() };
  await dbPut(T.NOTIFS, n);
  if (b.receiverId) try { await sns.send(new PublishCommand({ TopicArn: SNS_TOPIC, Message: JSON.stringify({ userId: b.receiverId, title: b.title, body: b.description, type: 'notification' }), Subject: b.title })); } catch {}
  return ok({ code: 200, msg: n });
}

// ── RATINGS ───────────────────────────────────────────────────────────────────
async function rateDriver(b) {
  const rid = genId('drt');
  const r = { id: rid, ...b, createdAt: new Date().toISOString() };
  await dbPut(T.DR, r);
  return ok({ code: 200, msg: r });
}

// ── CONTENT ───────────────────────────────────────────────────────────────────
async function getHtmlPage(name) {
  const items = await dbQuery(T.PAGES, 'name-index', 'name', name);
  if (!items.length) return err('Not found', 404);
  return ok({ code: 200, msg: items[0] });
}
async function updateHtmlPage(pid, b) {
  const pg = await dbGet(T.PAGES, { id: pid });
  if (!pg) return err('Not found', 404);
  const up = { ...pg, ...b, id: pid, updatedAt: new Date().toISOString() };
  await dbPut(T.PAGES, up);
  return ok({ code: 200, msg: up });
}
async function getAppConfig(key)   { return ok({ code: 200, msg: await dbGet(T.CFG, { configKey: key }) || {} }); }
async function setAppConfig(key, b) {
  const item = { configKey: key, ...b, updatedAt: new Date().toISOString() };
  await dbPut(T.CFG, item);
  return ok({ code: 200, msg: item });
}

// ── WALLET ────────────────────────────────────────────────────────────────────
async function submitWithdraw(b) {
  const wid = genId('wdr');
  const w = { id: wid, ...b, status: 'pending', createdAt: new Date().toISOString() };
  await dbPut(T.WDRAW, w);
  return ok({ code: 200, msg: w });
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
async function adminStats() {
  const [users, restaurants, foodOrders, parcelOrders, trips] = await Promise.all([
    dbScan(T.USERS), dbScan(T.RST), dbScan(T.FOOD), dbScan(T.PARCEL), dbScan(T.TRIPS)
  ]);
  return ok({ code: 200, msg: {
    totalUsers: users.length,
    totalRestaurants: restaurants.length,
    totalFoodOrders: foodOrders.length,
    totalParcelOrders: parcelOrders.length,
    totalTrips: trips.length,
    activeRiders: users.filter(u => u.role === 'rider' && u.active === 1).length,
    pendingFoodOrders: foodOrders.filter(o => o.status === 0).length,
    completedTrips: trips.filter(t => t.endRide === 1).length,
    totalRevenue: +foodOrders.filter(o => o.status === 2).reduce((s, o) => s + (parseFloat(o.price) || 0), 0).toFixed(2)
  }});
}

async function adminUsers()       { return ok({ code: 200, msg: await dbScan(T.USERS) }); }
async function adminRestaurants() { return ok({ code: 200, msg: await dbScan(T.RST) }); }
async function adminFoodOrders()  { return ok({ code: 200, msg: await dbScan(T.FOOD) }); }
async function adminParcelOrders(){ return ok({ code: 200, msg: await dbScan(T.PARCEL) }); }
async function adminTrips()       { return ok({ code: 200, msg: await dbScan(T.TRIPS) }); }
async function adminWithdraws()   { return ok({ code: 200, msg: await dbScan(T.WDRAW) }); }

async function adminBlockUser(uid, b) {
  const u = await dbGet(T.USERS, { id: uid });
  if (!u) return err('Not found', 404);
  u.active = b.block ? 2 : 1; u.updatedAt = new Date().toISOString();
  await dbPut(T.USERS, u);
  return ok({ code: 200, msg: u });
}

async function adminApproveWithdraw(wid, b) {
  const w = await dbGet(T.WDRAW, { id: wid });
  if (!w) return err('Not found', 404);
  w.status = b.approve ? 'approved' : 'rejected'; w.updatedAt = new Date().toISOString();
  await dbPut(T.WDRAW, w);
  return ok({ code: 200, msg: w });
}

async function adminBlockRestaurant(rid, b) {
  const r = await dbGet(T.RST, { id: rid });
  if (!r) return err('Not found', 404);
  r.block = b.block ? 1 : 0; r.updatedAt = new Date().toISOString();
  await dbPut(T.RST, r);
  return ok({ code: 200, msg: r });
}

// ── S3 PRESIGNED UPLOAD ───────────────────────────────────────────────────────
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const S3_BUCKET = process.env.S3_UPLOADS_BUCKET || 'aimobility-uploads-683541453923';
const s3 = new S3Client({ region: REGION });

async function generatePresignedUpload(b) {
  const { filename, contentType, folder } = b;
  if (!filename || !contentType) return err('filename and contentType required', 400);
  const key = `${folder || 'gograb'}/${filename}`;
  const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  const publicUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return ok({ code: 200, uploadUrl, objectKey: key, publicUrl });
}

// ── RESTAURANT MANAGEMENT CRUD ────────────────────────────────────────────────
async function addMenuSection(b) {
  const { restaurantId, name, description, image } = b;
  if (!restaurantId || !name) return err('restaurantId and name required', 400);
  const id = genId('mnu');
  const item = { id, restaurantId, name, description: description || '', image: image || '', active: 1, createdAt: new Date().toISOString() };
  await dbPut(T.MENUS, item);
  return ok({ code: 200, msg: item });
}

async function editMenuSection(b) {
  const { menuId, name, description, image } = b;
  if (!menuId) return err('menuId required', 400);
  const existing = await dbGet(T.MENUS, { id: menuId });
  if (!existing) return err('Menu not found', 404);
  const updated = { ...existing, name: name || existing.name, description: description ?? existing.description, image: image ?? existing.image, updatedAt: new Date().toISOString() };
  await dbPut(T.MENUS, updated);
  return ok({ code: 200, msg: updated });
}

async function deleteMenuSection(b) {
  const { menuId } = b;
  if (!menuId) return err('menuId required', 400);
  await dbDel(T.MENUS, { id: menuId });
  return ok({ code: 200, msg: 'deleted' });
}

async function addMenuItemFull(b) {
  const { menuId, restaurantId, name, description, price, image, outOfOrder } = b;
  if (!menuId || !name) return err('menuId and name required', 400);
  const id = genId('itm');
  const item = { id, menuId, restaurantId: restaurantId || '', name, description: description || '', price: parseFloat(price) || 0, image: image || '', outOfOrder: outOfOrder ? 1 : 0, active: 1, createdAt: new Date().toISOString() };
  await dbPut(T.ITEMS, item);
  return ok({ code: 200, msg: item });
}

async function editMenuItemFull(b) {
  const { itemId, name, description, price, image, outOfOrder } = b;
  if (!itemId) return err('itemId required', 400);
  const existing = await dbGet(T.ITEMS, { id: itemId });
  if (!existing) return err('Item not found', 404);
  const updated = { ...existing, name: name ?? existing.name, description: description ?? existing.description, price: price !== undefined ? parseFloat(price) : existing.price, image: image ?? existing.image, outOfOrder: outOfOrder !== undefined ? (outOfOrder ? 1 : 0) : existing.outOfOrder, updatedAt: new Date().toISOString() };
  await dbPut(T.ITEMS, updated);
  return ok({ code: 200, msg: updated });
}

async function deleteMenuItemFull(b) {
  const { itemId } = b;
  if (!itemId) return err('itemId required', 400);
  await dbDel(T.ITEMS, { id: itemId });
  return ok({ code: 200, msg: 'deleted' });
}

async function addRestaurantTiming(b) {
  const { restaurantId, day, openTime, closeTime } = b;
  if (!restaurantId) return err('restaurantId required', 400);
  const r = await dbGet(T.RST, { id: restaurantId });
  if (!r) return err('Restaurant not found', 404);
  const timings = r.timings || [];
  const idx = timings.findIndex(t => t.day === day);
  if (idx >= 0) timings[idx] = { day, openTime, closeTime };
  else timings.push({ day, openTime, closeTime });
  await dbPut(T.RST, { ...r, timings, updatedAt: new Date().toISOString() });
  return ok({ code: 200, msg: timings });
}

async function changeRestaurantPassword(b) {
  const { userId, oldPassword, newPassword } = b;
  if (!userId || !newPassword) return err('userId and newPassword required', 400);
  const u = await dbGet(T.USERS, { id: userId });
  if (!u) return err('User not found', 404);
  // Store new password (hashed if bcrypt available, plain otherwise)
  const updated = { ...u, passwordHash: newPassword, updatedAt: new Date().toISOString() };
  await dbPut(T.USERS, updated);
  return ok({ code: 200, msg: 'Password updated' });
}

// ── RESTAURANT IMAGE UPLOAD (presigned URL) ───────────────────────────────────
async function generatePresignedUpload(b) {
  const { filename, contentType, folder } = b;
  if (!filename || !contentType) return err('filename and contentType required', 400);
  const key = `${folder || 'gograb'}/${Date.now()}-${filename}`;
  const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  const publicUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return ok({ code: 200, uploadUrl, objectKey: key, publicUrl });
}

// ── RESTAURANT MANAGEMENT CRUD ────────────────────────────────────────────────
async function addMenuSection(b) {
  const { restaurantId, name, description, image } = b;
  if (!restaurantId || !name) return err('restaurantId and name required', 400);
  const id = genId('mnu');
  const item = { id, restaurantId, name, description: description || '', image: image || '', active: 1, createdAt: new Date().toISOString() };
  await dbPut(T.MENUS, item);
  return ok({ code: 200, msg: item });
}

async function editMenuSection(b) {
  const { menuId, name, description, image } = b;
  if (!menuId) return err('menuId required', 400);
  const existing = await dbGet(T.MENUS, { id: menuId });
  if (!existing) return err('Menu not found', 404);
  const updated = { ...existing, name: name ?? existing.name, description: description ?? existing.description, image: image ?? existing.image, updatedAt: new Date().toISOString() };
  await dbPut(T.MENUS, updated);
  return ok({ code: 200, msg: updated });
}

async function deleteMenuSection(b) {
  const { menuId } = b;
  if (!menuId) return err('menuId required', 400);
  await dbDel(T.MENUS, { id: menuId });
  return ok({ code: 200, msg: 'deleted' });
}

async function addMenuItemFull(b) {
  const { menuId, restaurantId, name, description, price, image, outOfOrder } = b;
  if (!menuId || !name) return err('menuId and name required', 400);
  const id = genId('itm');
  const item = { id, menuId, restaurantId: restaurantId || '', name, description: description || '', price: parseFloat(price) || 0, image: image || '', outOfOrder: outOfOrder ? 1 : 0, active: 1, createdAt: new Date().toISOString() };
  await dbPut(T.ITEMS, item);
  return ok({ code: 200, msg: item });
}

async function editMenuItemFull(b) {
  const { itemId, name, description, price, image, outOfOrder } = b;
  if (!itemId) return err('itemId required', 400);
  const existing = await dbGet(T.ITEMS, { id: itemId });
  if (!existing) return err('Item not found', 404);
  const updated = { ...existing, name: name ?? existing.name, description: description ?? existing.description, price: price !== undefined ? parseFloat(price) : existing.price, image: image ?? existing.image, outOfOrder: outOfOrder !== undefined ? (outOfOrder ? 1 : 0) : existing.outOfOrder, updatedAt: new Date().toISOString() };
  await dbPut(T.ITEMS, updated);
  return ok({ code: 200, msg: updated });
}

async function deleteMenuItemFull(b) {
  const { itemId } = b;
  if (!itemId) return err('itemId required', 400);
  await dbDel(T.ITEMS, { id: itemId });
  return ok({ code: 200, msg: 'deleted' });
}

async function addRestaurantTiming(b) {
  const { restaurantId, day, openTime, closeTime } = b;
  if (!restaurantId) return err('restaurantId required', 400);
  const r = await dbGet(T.RST, { id: restaurantId });
  if (!r) return err('Restaurant not found', 404);
  const timings = Array.isArray(r.timings) ? [...r.timings] : [];
  const idx = timings.findIndex(t => t.day === day);
  if (idx >= 0) timings[idx] = { day, openTime, closeTime };
  else timings.push({ day, openTime, closeTime });
  await dbPut(T.RST, { ...r, timings, updatedAt: new Date().toISOString() });
  return ok({ code: 200, msg: timings });
}

async function changeRestaurantPassword(b) {
  const { userId, newPassword } = b;
  if (!userId || !newPassword) return err('userId and newPassword required', 400);
  const u = await dbGet(T.USERS, { id: userId });
  if (!u) return err('User not found', 404);
  await dbPut(T.USERS, { ...u, passwordHash: newPassword, updatedAt: new Date().toISOString() });
  return ok({ code: 200, msg: 'Password updated' });
}

// ── MAIN ROUTER ───────────────────────────────────────────────────────────────
async function handleGoGrab(method, rawPath, segs, body, qs) {
  const path = rawPath.replace(/^\/gograb/, '').replace(/\/$/, '') || '/';
  if (method === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  // --- AUTH ---
  if (path === '/api/register' || path === '/api/registerUser') return registerUser(body);
  if (path === '/api/login' || path === '/api/loginUser') return loginUser(body);
  const ugm = path.match(/^\/api\/user\/(.+)$/);
  if (ugm && method === 'GET') return getUserProfile(ugm[1]);
  if (ugm && method === 'PUT') return updateUserProfile(ugm[1], body);
  if (path === '/api/update_profile') return updateUserProfile(body.userId || body.id, body);

  // --- RESTAURANTS ---
  if (path === '/api/restaurants' && method === 'GET') return listRestaurants();
  if (path === '/api/restaurants' && method === 'POST') return createRestaurant(body);
  const rstm = path.match(/^\/api\/restaurant\/(.+)$/);
  if (rstm && method === 'GET') return getRestaurant(rstm[1]);
  if (rstm && method === 'PUT') return updateRestaurant(rstm[1], body);
  if (path === '/api/restaurantMenu' || path === '/api/restaurant_menu') return getRestaurantMenu(body.restaurantId || qs?.restaurantId);
  const mnm = path.match(/^\/api\/restaurant_menu\/(.+)$/);
  if (mnm) return getRestaurantMenu(mnm[1]);
  if (path === '/api/addMenuItem') return addMenuItem(body);

  // --- FOOD ORDERS ---
  if (path === '/api/place_food_order' || path === '/api/placeFoodOrder') return placeFoodOrder(body);
  if (path === '/api/food_orders') return getFoodOrders(qs?.userId || body.userId);
  if (path === '/api/food_order_status') return updateFoodOrderStatus(body.orderId, body);
  const fom = path.match(/^\/api\/food_order_status\/(.+)$/);
  if (fom) return updateFoodOrderStatus(fom[1], body);

  // --- PARCEL ORDERS ---
  if (path === '/api/place_parcel_order' || path === '/api/placeParcelOrder') return placeParcelOrder(body);
  if (path === '/api/parcel_orders') return getParcelOrders(qs?.userId || body.userId);

  // --- RIDES ---
  if (path === '/api/create_request' || path === '/api/createRequest') return createRequest(body);
  if (path === '/api/ride_requests') return getRideRequests(qs?.userId || body.userId);
  if (path === '/api/update_request') return updateRequest(body.id, body);
  if (path === '/api/create_trip') return createTrip(body);
  if (path === '/api/trips') return getTrips(qs?.userId || body.userId, qs?.role || body.role);

  // --- VEHICLES ---
  if (path === '/api/vehicles' && method === 'POST') return createVehicle(body);
  if (path === '/api/vehicles') return getVehicles(qs?.userId || body.userId);
  if (path === '/api/vehicle_types' || path === '/api/vehicleTypes') return getVehicleTypes();
  if (path === '/api/ride_types' || path === '/api/rideTypes') return getRideTypes();

  // --- CATALOGUE ---
  if (path === '/api/food_categories' || path === '/api/foodCategories') return getFoodCategories();
  if (path === '/api/package_sizes' || path === '/api/packageSizes') return getPackageSizes();
  if (path === '/api/good_types' || path === '/api/goodTypes') return getGoodTypes();
  if (path === '/api/service_charges') return getServiceCharges();
  if (path === '/api/validate_coupon') return validateCoupon(body);
  if (path === '/api/coupons') return listCoupons();

  // --- NOTIFICATIONS ---
  if (path === '/api/notifications' && method === 'GET') return getNotifications(qs?.userId || body.userId);
  if (path === '/api/notifications' && method === 'POST') return sendNotification(body);

  // --- RATINGS ---
  if (path === '/api/rate_driver' || path === '/api/rateDriver') return rateDriver(body);

  // --- CONTENT ---
  if (path === '/api/html_page') return getHtmlPage(body.name || qs?.name);
  const hpm = path.match(/^\/api\/html_page\/(.+)$/);
  if (hpm && method === 'PUT') return updateHtmlPage(hpm[1], body);
  if (path === '/api/app_config' && method === 'GET') return getAppConfig(qs?.key || 'settings');
  if (path === '/api/app_config' && method === 'POST') return setAppConfig(body.key || 'settings', body);

  // --- WALLET ---
  if (path === '/api/withdraw') return submitWithdraw(body);

  // --- ADMIN ---
  if (path === '/admin/stats' || path === '/admin/dashboard') return adminStats();
  if (path === '/admin/users' && method === 'GET') return adminUsers();
  const blkm = path.match(/^\/admin\/user\/(.+)\/block$/);
  if (blkm) return adminBlockUser(blkm[1], body);
  if (path === '/admin/restaurants') return adminRestaurants();
  const rblk = path.match(/^\/admin\/restaurant\/(.+)\/block$/);
  if (rblk) return adminBlockRestaurant(rblk[1], body);
  if (path === '/admin/food_orders' || path === '/admin/foodOrders') return adminFoodOrders();
  if (path === '/admin/parcel_orders' || path === '/admin/parcelOrders') return adminParcelOrders();
  if (path === '/admin/trips') return adminTrips();
  if (path === '/admin/withdraw_requests') return adminWithdraws();
  const wam = path.match(/^\/admin\/withdraw\/(.+)$/);
  if (wam) return adminApproveWithdraw(wam[1], body);

  // --- RESTAURANT IMAGE UPLOAD (presigned URL) ---
  if (path === '/restaurant/presigned-upload' && method === 'POST') return generatePresignedUpload(body);

  // --- RESTAURANT MANAGEMENT CRUD ---
  if (path === '/restaurant/edit') return updateRestaurant(body.restaurantId, body);
  if (path === '/restaurant/menu/add') return addMenuSection(body);
  if (path === '/restaurant/menu/edit') return editMenuSection(body);
  if (path === '/restaurant/menu/delete') return deleteMenuSection(body);
  if (path === '/restaurant/menu/item/add') return addMenuItemFull(body);
  if (path === '/restaurant/menu/item/edit') return editMenuItemFull(body);
  if (path === '/restaurant/menu/item/delete') return deleteMenuItemFull(body);
  if (path === '/restaurant/timing/add') return addRestaurantTiming(body);
  if (path === '/restaurant/change-password') return changeRestaurantPassword(body);

  return err(`GoGrab: not found ${method} ${path}`, 404);
}

module.exports = { handleGoGrab };
