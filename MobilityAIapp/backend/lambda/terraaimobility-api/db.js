/**
 * db.js — DynamoDB helper for aimobility Lambda
 *
 * v3.1 changes:
 *  - getUserByEmail now uses GSI "email-index" (Query) instead of Scan.
 *    Full-table Scan on every login was the #1 production perf/cost issue.
 *    The GSI was added to aimobility-users via AWS CLI on 2025-01-01.
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

const T = {
  USERS:         "aimobility-users",
  RIDES:         "aimobility-rides",
  FOOD_ORDERS:   "aimobility-food-orders",
  PARCEL_ORDERS: "aimobility-parcel-orders",
  DRIVERS:       "aimobility-drivers",
  RESTAURANTS:   "aimobility-restaurants",
  NOTIFICATIONS: "aimobility-notifications",
  CONFIG:        "aimobility-config",
};

// ── Config cache (5-minute TTL) ───────────────────────────────────────────────
const configCache = new Map();
const CONFIG_TTL = 5 * 60 * 1000;

async function getConfig(configKey) {
  const cached = configCache.get(configKey);
  if (cached && Date.now() - cached.ts < CONFIG_TTL) return cached.items;
  const item = await getItem(T.CONFIG, { configKey });
  const items = (item && item.items) || [];
  configCache.set(configKey, { items, ts: Date.now() });
  return items;
}

async function putConfig(configKey, items) {
  await putItem(T.CONFIG, { configKey, items, updated: now() });
  configCache.set(configKey, { items, ts: Date.now() });
}

const uuid = () => randomUUID();
const now  = () => new Date().toISOString();

// ── Generic helpers ───────────────────────────────────────────────────────────

async function getItem(table, key) {
  const res = await ddb.send(new GetCommand({ TableName: table, Key: key }));
  return res.Item || null;
}

async function putItem(table, item) {
  await ddb.send(new PutCommand({ TableName: table, Item: item }));
  return item;
}

async function scanTable(table, limit = 100) {
  const res = await ddb.send(new ScanCommand({ TableName: table, Limit: limit }));
  return res.Items || [];
}

async function queryByIndex(table, indexName, keyName, keyValue) {
  const res = await ddb.send(new QueryCommand({
    TableName: table,
    IndexName: indexName,
    KeyConditionExpression: "#k = :v",
    ExpressionAttributeNames: { "#k": keyName },
    ExpressionAttributeValues: { ":v": keyValue },
  }));
  return res.Items || [];
}

async function updateItem(table, key, updates) {
  const expParts = [], names = {}, vals = {};
  Object.keys(updates).forEach((k, i) => {
    const n = `#f${i}`, v = `:v${i}`;
    expParts.push(`${n} = ${v}`);
    names[n] = k;
    vals[v] = updates[k];
  });
  const res = await ddb.send(new UpdateCommand({
    TableName: table,
    Key: key,
    UpdateExpression: "SET " + expParts.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: vals,
    ReturnValues: "ALL_NEW",
  }));
  return res.Attributes;
}

async function deleteItem(table, key) {
  await ddb.send(new DeleteCommand({ TableName: table, Key: key }));
}

// ── Domain helpers ────────────────────────────────────────────────────────────

/**
 * getUserByEmail — uses the "email-index" GSI (O(1) Query).
 *
 * Previously this was a full-table Scan (O(n)) which hit every login,
 * registration, and email-check. At 10k users that costs ~50ms extra
 * per request plus unnecessary RCUs.
 *
 * Falls back to Scan ONLY if the GSI doesn't exist yet (during index
 * backfill window, which is typically < 60 seconds on a small table).
 */
async function getUserByEmail(email) {
  if (!email || typeof email !== "string" || !email.trim()) return null;
  const normalised = email.trim().toLowerCase();

  try {
    // ── Fast path: GSI Query ─────────────────────────────────────────────────
    const res = await ddb.send(new QueryCommand({
      TableName: T.USERS,
      IndexName: "email-index",
      KeyConditionExpression: "email = :e",
      ExpressionAttributeValues: { ":e": normalised },
      Limit: 1,
    }));
    return (res.Items || [])[0] || null;
  } catch (e) {
    // During the GSI backfill window (CREATING state) DynamoDB returns
    // ResourceNotFoundException on the index. Fall back to Scan.
    if (e.name === "ResourceNotFoundException" || (e.message && e.message.includes("email-index"))) {
      console.warn("[db] email-index not ready yet, falling back to Scan");
      const res = await ddb.send(new ScanCommand({
        TableName: T.USERS,
        FilterExpression: "email = :e",
        ExpressionAttributeValues: { ":e": normalised },
        Limit: 1,
      }));
      return (res.Items || [])[0] || null;
    }
    throw e;
  }
}

async function getUserByPhone(phone) {
  if (!phone || typeof phone !== "string" || !phone.trim()) return null;
  const res = await ddb.send(new ScanCommand({
    TableName: T.USERS,
    FilterExpression: "phone = :p",
    ExpressionAttributeValues: { ":p": phone.trim() },
    Limit: 1,
  }));
  return (res.Items || [])[0] || null;
}

async function createUser(data) {
  const user = {
    userId:       uuid(),
    id:           uuid(),
    first_name:   data.first_name   || "",
    last_name:    data.last_name    || "",
    // Store email normalised so GSI lookups are always consistent
    email:        (data.email || "").trim().toLowerCase(),
    phone:        data.phone        || "",
    role:         data.role         || "user",
    wallet:       "0.00",
    image:        "",
    gender:       data.gender       || "",
    dob:          data.dob          || "",
    country_id:   data.country_id   || "1",
    device_token: data.device_token || "",
    created:      now(),
    updated:      now(),
  };
  await putItem(T.USERS, user);
  return user;
}

async function createRide(data) {
  const ride = {
    rideId:       uuid(),
    id:           uuid(),
    userId:       data.user_id || "",
    user_id:      data.user_id || "",
    pickup:       data.pickup_address || data.pickup || "",
    dropoff:      data.dropoff_address || data.dropoff || "",
    pickup_lat:   data.pickup_lat   || "",
    pickup_lng:   data.pickup_lng   || "",
    dropoff_lat:  data.dropoff_lat  || "",
    dropoff_lng:  data.dropoff_lng  || "",
    ride_type_id: data.ride_type_id || "",
    status:       "pending",
    fare:         data.estimated_fare || "10.00",
    created:      now(),
  };
  await putItem(T.RIDES, ride);
  return ride;
}

async function createFoodOrder(data) {
  const order = {
    orderId:       uuid(),
    id:            uuid(),
    userId:        data.user_id       || "",
    user_id:       data.user_id       || "",
    restaurant_id: data.restaurant_id || "",
    items:         data.items         || [],
    status:        "pending",
    total_price:   data.total_price   || "0.00",
    created:       now(),
  };
  await putItem(T.FOOD_ORDERS, order);
  return order;
}

async function createParcelOrder(data) {
  const order = {
    orderId:     uuid(),
    id:          uuid(),
    userId:      data.user_id || "",
    user_id:     data.user_id || "",
    status:      "pending",
    total_price: data.price   || "15.00",
    created:     now(),
  };
  await putItem(T.PARCEL_ORDERS, order);
  return order;
}

async function createRestaurant(data) {
  const r = {
    restaurantId:      uuid(),
    id:                uuid(),
    name:              data.name              || "",
    image:             data.image             || "",
    lat:               data.lat               || "",
    long:              data.long              || "",
    delivery_fee:      data.delivery_fee      || "2.00",
    delivery_min_time: data.delivery_min_time || "20",
    delivery_max_time: data.delivery_max_time || "40",
    min_order_price:   data.min_order_price   || "10.00",
    rating:            "4.0",
    is_open:           true,
    created:           now(),
  };
  await putItem(T.RESTAURANTS, r);
  return r;
}

async function saveNotification(userId, title, body, type) {
  const n = {
    notifId: uuid(),
    userId,
    title,
    body,
    type,
    read:    false,
    created: now(),
  };
  await putItem(T.NOTIFICATIONS, n);
  return n;
}

module.exports = {
  T, uuid, now,
  getItem, putItem, scanTable, queryByIndex, updateItem, deleteItem,
  getConfig, putConfig,
  getUserByEmail, getUserByPhone,
  createUser, createRide, createFoodOrder, createParcelOrder,
  createRestaurant, saveNotification,
};
