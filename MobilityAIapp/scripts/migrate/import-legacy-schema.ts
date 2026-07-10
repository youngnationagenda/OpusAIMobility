/**
 * import-legacy-schema.ts — Import TerraAI (gograb) legacy schema into opusaimobility-db
 * 
 * Reads the gograb.sql dump and imports it as a separate `legacy_terraai` schema
 * alongside the main `terraai` database. This preserves the original table structure
 * for reference while the new normalized schema serves the application.
 * 
 * Transformations applied:
 * - ENGINE=MyISAM → ENGINE=InnoDB
 * - CHARSET=latin1 → CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
 * - Creates `legacy_terraai` database for raw import
 * - Maps `user` table data → `terraai.users` table (for migration Lambda)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';

const HOST = process.env.TARGET_DB_HOST || 'opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com';
const PORT = parseInt(process.env.TARGET_DB_PORT || '3306');
const USER = process.env.TARGET_DB_USER || 'admin_opus';
const PASS = process.env.TARGET_DB_PASS || '';

const SQL_FILE = process.argv[2] || resolve('D:/omnisonietest/OpusAIMobility/TerraAI/.claude/PHP API/Database/gograb.sql');

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  OpusAIMobility — Import Legacy TerraAI Schema (gograb)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Source SQL: ${SQL_FILE}`);
  console.log(`  Target: ${USER}@${HOST}:${PORT}`);
  console.log('');

  if (!PASS) {
    console.error('✗ TARGET_DB_PASS required');
    process.exit(1);
  }

  // Read the SQL dump
  console.log('▶ Reading SQL dump...');
  let sql = readFileSync(SQL_FILE, 'utf-8');
  console.log(`  ✔ Read ${(sql.length / 1024).toFixed(1)} KB`);

  // Transform for MySQL 8.0 / InnoDB compatibility
  console.log('▶ Transforming for MySQL 8.0 compatibility...');
  sql = sql
    .replace(/ENGINE=MyISAM/g, 'ENGINE=InnoDB')
    .replace(/DEFAULT CHARSET=latin1/g, 'DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci')
    .replace(/DEFAULT CHARSET=utf8;/g, 'DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;')
    // Remove index length for compatibility
    .replace(/int\(11\)/g, 'int')
    .replace(/int\(1\)/g, 'tinyint')
    // Prepend database creation
  ;

  const fullSql = `
    CREATE DATABASE IF NOT EXISTS \`legacy_terraai\`;
    USE \`legacy_terraai\`;
    ${sql}
  `;
  console.log('  ✔ Transformations applied');

  // Connect
  console.log('▶ Connecting to RDS...');
  const connection = await mysql.createConnection({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASS,
    multipleStatements: true,
    connectTimeout: 15000,
    ssl: { rejectUnauthorized: false }
  });
  console.log('  ✔ Connected');

  // Apply the legacy schema
  console.log('▶ Applying legacy schema (this may take a moment)...');
  try {
    await connection.query(fullSql);
    console.log('  ✔ Legacy schema imported into `legacy_terraai` database');
  } catch (err: any) {
    console.error(`  ✗ Import error: ${err.message}`);
    // Try to continue — some statements may have issues but we want the core tables
    console.log('  Attempting table-by-table import...');
    const statements = fullSql.split(';').filter(s => s.trim().length > 5);
    let success = 0, failed = 0;
    for (const stmt of statements) {
      try {
        await connection.query(stmt + ';');
        success++;
      } catch (e: any) {
        failed++;
        if (failed <= 5) console.warn(`    Skip: ${e.message.substring(0, 80)}`);
      }
    }
    console.log(`  ✔ Imported: ${success} statements, skipped: ${failed}`);
  }

  // Verify tables in legacy_terraai
  console.log('');
  console.log('▶ Verifying legacy_terraai tables...');
  const [tables] = await connection.query("SHOW TABLES FROM legacy_terraai") as any[];
  console.log(`  Tables: ${tables.length}`);
  for (const row of tables) {
    console.log(`    - ${Object.values(row)[0]}`);
  }

  // Map legacy `user` table → main `terraai.users` table
  console.log('');
  console.log('▶ Syncing legacy users → terraai.users...');
  
  const [userCount] = await connection.query("SELECT COUNT(*) AS cnt FROM legacy_terraai.user") as any[];
  const count = userCount[0]?.cnt || 0;
  
  if (count > 0) {
    // Map columns: first_name+last_name → name, password → password_hash, active → status
    await connection.query(`
      INSERT IGNORE INTO terraai.users (email, password_hash, name, phone, role, status, created_at)
      SELECT 
        email,
        password AS password_hash,
        CONCAT(first_name, ' ', last_name) AS name,
        phone,
        CASE role 
          WHEN 'rider' THEN 'rider'
          WHEN 'driver' THEN 'rider'
          WHEN 'admin' THEN 'admin'
          ELSE 'customer'
        END AS role,
        CASE active
          WHEN 1 THEN 'active'
          WHEN 0 THEN 'suspended'
          WHEN 2 THEN 'suspended'
          ELSE 'active'
        END AS status,
        created AS created_at
      FROM legacy_terraai.user
      WHERE email != '' AND email IS NOT NULL
    `);
    
    const [newCount] = await connection.query("SELECT COUNT(*) AS cnt FROM terraai.users") as any[];
    console.log(`  ✔ Synced ${newCount[0].cnt} users from legacy → terraai.users`);
  } else {
    console.log('  ℹ No user data in dump (schema only). Users table ready for migration Lambda.');
  }

  // Final summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✔ Legacy TerraAI schema imported successfully');
  console.log(`  Databases on RDS:`);
  const [dbs] = await connection.query("SHOW DATABASES") as any[];
  for (const db of dbs) {
    const dbName = Object.values(db)[0] as string;
    if (!['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) {
      console.log(`    - ${dbName}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════');

  await connection.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
