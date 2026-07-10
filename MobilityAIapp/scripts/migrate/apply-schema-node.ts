/**
 * apply-schema-node.ts — Applies schema.sql to the target RDS using mysql2
 * Equivalent to apply-schema.sh but runs via Node.js (no mysql CLI needed)
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST = process.env.TARGET_DB_HOST || 'opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com';
const PORT = parseInt(process.env.TARGET_DB_PORT || '3306');
const DB = process.env.TARGET_DB_NAME || 'terraai';
const USER = process.env.TARGET_DB_USER || 'admin_opus';
const PASS = process.env.TARGET_DB_PASS || '';

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  OpusAIMobility — TerraAI Schema Application (Node.js)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Target: ${USER}@${HOST}:${PORT}/${DB}`);
  console.log('');

  if (!PASS) {
    console.error('✗ TARGET_DB_PASS environment variable is required');
    process.exit(1);
  }

  // Step 1: Connect
  console.log('▶ Connecting to RDS...');
  let connection: mysql.Connection;
  try {
    connection = await mysql.createConnection({
      host: HOST,
      port: PORT,
      user: USER,
      password: PASS,
      database: DB,
      multipleStatements: true,
      connectTimeout: 15000,
      ssl: { rejectUnauthorized: false } // RDS uses Amazon-issued certs
    });
    console.log('  ✔ Connected');
  } catch (err: any) {
    console.error(`✗ Connection failed: ${err.message}`);
    console.error('  Check: security group, publicly-accessible, credentials');
    process.exit(1);
  }

  // Step 2: Apply schema
  console.log('');
  console.log('▶ Applying schema...');
  const schemaPath = resolve(__dirname, 'schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');

  try {
    await connection.query(schemaSql);
    console.log('  ✔ Schema applied');
  } catch (err: any) {
    console.error(`✗ Schema application failed: ${err.message}`);
    await connection.end();
    process.exit(1);
  }

  // Step 3: Verify tables
  console.log('');
  console.log('▶ Verifying tables...');
  const [tables] = await connection.query('SHOW TABLES') as any[];
  console.log(`  Tables created: ${tables.length}`);
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    console.log(`    - ${tableName}`);
  }

  // Step 4: Verify users table structure
  console.log('');
  console.log('▶ Verifying users table (migration Lambda target)...');
  const [desc] = await connection.query('DESCRIBE users') as any[];
  console.log('  Columns:');
  for (const col of desc) {
    console.log(`    ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
  }

  // Step 5: Check settings seed
  console.log('');
  console.log('▶ Checking seed settings...');
  const [settings] = await connection.query('SELECT `key`, `value` FROM settings LIMIT 5') as any[];
  for (const s of settings) {
    console.log(`    ${s.key} = ${s.value}`);
  }

  await connection.end();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✔ Schema ready. Migration Lambda can now query users.');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
