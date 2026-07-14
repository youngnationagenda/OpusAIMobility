/**
 * GoGrab MySQL → DynamoDB Data Seeder
 *
 * Parses gograb.sql and imports all seed data into DynamoDB tables.
 * Handles: users, restaurants, menus, food_categories, package_sizes,
 *          good_types, vehicle_types, ride_types, coupons, html_pages,
 *          app_slider, country, service_charge, food_orders, trips, etc.
 *
 * Run: node seed-from-sql.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const { DynamoDBClient }         = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client  = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddb     = DynamoDBDocumentClient.from(client);

const SQL_FILE = path.join(__dirname, 'gograb.sql');

// ─── SQL Parser ──────────────────────────────────────────────────────────────
function parseInserts(sql) {
  const result = {};
  // Match: INSERT INTO `table` (cols) VALUES (row),(row),...;
  const regex = /INSERT INTO `(\w+)` \(([^)]+)\) VALUES\s*([\s\S]+?);/g;
  let m;
  while ((m = regex.exec(sql)) !== null) {
    const table  = m[1];
    const cols   = m[2].split(',').map(c => c.trim().replace(/`/g, ''));
    const valStr = m[3];

    // Parse value rows — handle escaped quotes, NULLs, nested parens
    const rows = [];
    const rowRegex = /\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g;
    let r;
    while ((r = rowRegex.exec(valStr)) !== null) {
      const raw = r[1];
      const values = parseValues(raw);
      if (values.length === cols.length) {
        const row = {};
        cols.forEach((c, i) => {
          const v = values[i];
          if (v === null || v === 'NULL') {
            row[camel(c)] = null;
          } else if (v.match(/^-?\d+(\.\d+)?$/) && !c.includes('phone') && !c.includes('code') && !c.includes('token')) {
            row[camel(c)] = parseFloat(v);
          } else {
            row[camel(c)] = v;
          }
        });
        rows.push(row);
      }
    }
    if (!result[table]) result[table] = [];
    result[table].push(...rows);
  }
  return result;
}

function parseValues(str) {
  const vals = [];
  let current = '';
  let inStr = false;
  let strChar = '';
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escape) { current += ch; escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (!inStr && (ch === "'" || ch === '"')) { inStr = true; strChar = ch; continue; }
    if (inStr && ch === strChar) { inStr = false; continue; }
    if (!inStr && ch === ',') { vals.push(current.trim() === 'NULL' ? null : current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current !== '') vals.push(current.trim() === 'NULL' ? null : current.trim());
  return vals;
}

function camel(s) {
  return s.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

// ─── Table name mapping ───────────────────────────────────────────────────────
const TABLE_MAP = {
  user:                    'gograb-users',
  restaurant:              'gograb-restaurants',
  restaurant_menu:         'gograb-restaurant-menus',
  restaurant_menu_item:    'gograb-restaurant-menu-items',
  food_order:              'gograb-food-orders',
  parcel_order:            'gograb-parcel-orders',
  trip:                    'gograb-trips',
  trip_history:            'gograb-trips',        // merge into trips
  request:                 'gograb-requests',
  vehicle:                 'gograb-vehicles',
  vehicle_type:            'gograb-vehicle-types',
  ride_type:               'gograb-ride-types',
  coupon:                  'gograb-coupons',
  food_category:           'gograb-food-categories',
  package_size:            'gograb-package-sizes',
  good_type:               'gograb-good-types',
  notification:            'gograb-notifications',
  driver_rating:           'gograb-driver-ratings',
  order_transaction:       'gograb-transactions',
  user_document:           'gograb-user-documents',
  service_charge:          'gograb-service-charges',
  html_page:               'gograb-html-pages',
  withdraw_request:        'gograb-withdraw-requests',
  // Config tables → gograb-app-config
  app_slider:              'gograb-app-config',
  coin_worth:              'gograb-app-config',
  country:                 'gograb-app-config',
  language:                'gograb-app-config',
};

// Config tables get a compound key
function configKey(table, row) {
  return `${table}#${row.id || row.name || Date.now()}`;
}

async function batchWrite(tableName, items) {
  const CHUNK = 25;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK).map(item => ({
      PutRequest: { Item: item }
    }));
    try {
      await ddb.send(new BatchWriteCommand({
        RequestItems: { [tableName]: chunk }
      }));
    } catch (e) {
      console.warn(`    ⚠️  Batch write failed for ${tableName}: ${e.message}`);
      // Fall back to individual puts
      for (const item of items.slice(i, i + CHUNK)) {
        try {
          await ddb.send(new PutCommand({ TableName: tableName, Item: item }));
        } catch (e2) {
          console.warn(`    ⚠️  Individual put failed: ${e2.message}`);
        }
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 GoGrab SQL → DynamoDB Seeder');
  console.log('─'.repeat(50));

  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  const data = parseInserts(sql);
  const tables = Object.keys(data);

  console.log(`📦 Tables with data: ${tables.join(', ')}\n`);

  const CONFIG_TABLES = ['app_slider', 'coin_worth', 'country', 'language'];

  for (const [sqlTable, rows] of Object.entries(data)) {
    const dynTable = TABLE_MAP[sqlTable];
    if (!dynTable) {
      console.log(`  ⏭️  SKIP ${sqlTable} (no mapping)`);
      continue;
    }

    // Transform rows
    const items = rows.map((row, idx) => {
      let item = { ...row, _source: sqlTable, _migratedAt: new Date().toISOString() };

      if (CONFIG_TABLES.includes(sqlTable)) {
        item.configKey = configKey(sqlTable, row);
        item.configType = sqlTable;
      } else {
        // Ensure string PK
        if (item.id !== undefined) item.id = String(item.id);
        if (item.userId !== undefined) item.userId = String(item.userId);
        if (item.restaurantId !== undefined) item.restaurantId = String(item.restaurantId);
        if (item.driverId !== undefined) item.driverId = String(item.driverId);
        if (item.receiverId !== undefined) item.receiverId = String(item.receiverId);
      }

      // Map gograb user roles to OpusAIMobility roles
      if (sqlTable === 'user' && item.role) {
        const roleMap = { user: 'customer', rider: 'rider', vendor: 'vendor', admin: 'admin' };
        item.opusRole = roleMap[item.role] || 'customer';
      }

      // Sanitize password (keep bcrypt hash, flag plaintext)
      if (item.password) {
        item.passwordHash = item.password.startsWith('$2') ? item.password : null;
        delete item.password;
      }

      return item;
    });

    console.log(`  📥 ${sqlTable.padEnd(30)} → ${dynTable} (${items.length} rows)`);
    await batchWrite(dynTable, items);
  }

  console.log('\n✅ Seeding complete.');
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
