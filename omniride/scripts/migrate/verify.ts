/**
 * Database Verification Script
 *
 * Queries source and destination databases for row counts per table,
 * compares them, and produces a comparison report JSON.
 * Also verifies referential integrity by checking all FK constraints
 * are valid and zero orphaned records exist.
 *
 * Requirements: 1.3, 1.5
 */

import type { Connection } from 'mysql2/promise';
import type { TableMigrationResult, DatabaseMigrationResult } from '@opusaimobility/common';

/** Configuration for source database connection */
export interface VerifySourceConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/** Configuration for destination database connection */
export interface VerifyDestConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/** Full verification configuration */
export interface VerifyConfig {
  source: VerifySourceConfig;
  destination: VerifyDestConfig;
}

/**
 * Compares source and destination row count maps and produces a DatabaseMigrationResult.
 *
 * This is the pure comparison logic, separated from DB access for testability.
 * It takes two maps of table name → row count and produces the comparison report.
 *
 * @param sourceCounts - Map of table name to row count in the source database
 * @param destCounts - Map of table name to row count in the destination database
 * @param foreignKeyValid - Whether all FK constraints are valid (from integrity check)
 * @param orphanedRecords - Count of orphaned records found
 * @returns A DatabaseMigrationResult with per-table comparison and totals
 */
export function compareRowCounts(
  sourceCounts: Record<string, number>,
  destCounts: Record<string, number>,
  foreignKeyValid: boolean = true,
  orphanedRecords: number = 0
): DatabaseMigrationResult {
  // Collect all unique table names from both source and destination
  const allTables = new Set<string>([
    ...Object.keys(sourceCounts),
    ...Object.keys(destCounts),
  ]);

  const tables: TableMigrationResult[] = [];
  let totalDiscrepancies = 0;

  for (const tableName of allTables) {
    const sourceRowCount = sourceCounts[tableName] ?? 0;
    const destRowCount = destCounts[tableName] ?? 0;
    const discrepancy = sourceRowCount - destRowCount;

    tables.push({
      name: tableName,
      sourceRowCount,
      destRowCount,
      discrepancy,
    });

    if (discrepancy !== 0) {
      totalDiscrepancies += Math.abs(discrepancy);
    }
  }

  // Sort tables alphabetically for deterministic output
  tables.sort((a, b) => a.name.localeCompare(b.name));

  return {
    tables,
    totalDiscrepancies,
    foreignKeyValid,
    orphanedRecords,
  };
}

/**
 * Queries a MySQL database for row counts of all tables.
 *
 * @param connection - An active mysql2 connection
 * @param database - The database name to query
 * @returns Map of table name to row count
 */
export async function getRowCounts(
  connection: Connection,
  database: string
): Promise<Record<string, number>> {
  // Get all table names in the database
  const [tableRows] = await connection.execute<any[]>(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [database]
  );

  const counts: Record<string, number> = {};

  for (const row of tableRows) {
    const tableName: string = row.TABLE_NAME;
    // Use exact COUNT(*) for accurate row counts
    const [countRows] = await connection.execute<any[]>(
      `SELECT COUNT(*) AS cnt FROM \`${tableName}\``
    );
    counts[tableName] = Number(countRows[0].cnt);
  }

  return counts;
}

/**
 * Represents a single foreign key relationship found in the schema.
 */
interface ForeignKeyInfo {
  /** The table containing the FK column */
  childTable: string;
  /** The FK column in the child table */
  childColumn: string;
  /** The referenced (parent) table */
  parentTable: string;
  /** The referenced column in the parent table */
  parentColumn: string;
}

/**
 * Checks referential integrity by finding all FK constraints and
 * verifying no orphaned records exist (child rows referencing non-existent parents).
 *
 * @param connection - An active mysql2 connection
 * @param database - The database name to check
 * @returns Object with foreignKeyValid boolean and orphanedRecords count
 */
export async function checkReferentialIntegrity(
  connection: Connection,
  database: string
): Promise<{ foreignKeyValid: boolean; orphanedRecords: number }> {
  // Query all FK constraints in the database
  const [fkRows] = await connection.execute<any[]>(
    `SELECT
       TABLE_NAME AS childTable,
       COLUMN_NAME AS childColumn,
       REFERENCED_TABLE_NAME AS parentTable,
       REFERENCED_COLUMN_NAME AS parentColumn
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [database]
  );

  const foreignKeys: ForeignKeyInfo[] = fkRows.map((row: any) => ({
    childTable: row.childTable,
    childColumn: row.childColumn,
    parentTable: row.parentTable,
    parentColumn: row.parentColumn,
  }));

  let totalOrphaned = 0;

  for (const fk of foreignKeys) {
    // Find rows in the child table that reference non-existent parent rows
    const [orphanRows] = await connection.execute<any[]>(
      `SELECT COUNT(*) AS cnt
       FROM \`${fk.childTable}\` child
       LEFT JOIN \`${fk.parentTable}\` parent
         ON child.\`${fk.childColumn}\` = parent.\`${fk.parentColumn}\`
       WHERE child.\`${fk.childColumn}\` IS NOT NULL
         AND parent.\`${fk.parentColumn}\` IS NULL`
    );

    const orphanCount = Number(orphanRows[0].cnt);
    if (orphanCount > 0) {
      console.warn(
        `[verify] Orphaned records found: ${fk.childTable}.${fk.childColumn} → ` +
        `${fk.parentTable}.${fk.parentColumn}: ${orphanCount} records`
      );
      totalOrphaned += orphanCount;
    }
  }

  return {
    foreignKeyValid: totalOrphaned === 0,
    orphanedRecords: totalOrphaned,
  };
}

/**
 * Creates a MySQL connection using mysql2/promise.
 */
async function createConnection(config: VerifySourceConfig | VerifyDestConfig): Promise<Connection> {
  const mysql = await import('mysql2/promise');
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 10_000,
    ssl: { rejectUnauthorized: true },
  });
}

/**
 * Runs the full database verification: row count comparison and referential integrity check.
 *
 * @param config - Source and destination database connection configs
 * @returns A DatabaseMigrationResult with the full comparison report
 */
export async function verifyMigration(config: VerifyConfig): Promise<DatabaseMigrationResult> {
  let sourceConn: Connection | undefined;
  let destConn: Connection | undefined;

  try {
    // Connect to both databases
    sourceConn = await createConnection(config.source);
    console.log(`[verify] Connected to source: ${config.source.host}:${config.source.port}/${config.source.database}`);

    destConn = await createConnection(config.destination);
    console.log(`[verify] Connected to destination: ${config.destination.host}:${config.destination.port}/${config.destination.database}`);

    // Get row counts from both databases
    console.log('[verify] Querying source row counts...');
    const sourceCounts = await getRowCounts(sourceConn, config.source.database);

    console.log('[verify] Querying destination row counts...');
    const destCounts = await getRowCounts(destConn, config.destination.database);

    // Check referential integrity on the destination
    console.log('[verify] Checking referential integrity on destination...');
    const { foreignKeyValid, orphanedRecords } = await checkReferentialIntegrity(
      destConn,
      config.destination.database
    );

    // Produce comparison report
    const result = compareRowCounts(sourceCounts, destCounts, foreignKeyValid, orphanedRecords);

    return result;
  } finally {
    // Clean up connections
    if (sourceConn) {
      try { await sourceConn.end(); } catch { /* ignore */ }
    }
    if (destConn) {
      try { await destConn.end(); } catch { /* ignore */ }
    }
  }
}

/**
 * Reads verification configuration from environment variables.
 */
function getConfigFromEnv(): VerifyConfig {
  const sourceHost = process.env.TERRA_DB_HOST;
  const sourcePort = process.env.TERRA_DB_PORT;
  const sourceDatabase = process.env.TERRA_DB_NAME;
  const sourceUser = process.env.TERRA_DB_USER;
  const sourcePassword = process.env.TERRA_DB_PASSWORD;

  const destHost = process.env.TARGET_DB_HOST;
  const destPort = process.env.TARGET_DB_PORT;
  const destDatabase = process.env.TARGET_DB_NAME;
  const destUser = process.env.TARGET_DB_USER;
  const destPassword = process.env.TARGET_DB_PASSWORD;

  const missing: string[] = [];
  if (!sourceHost) missing.push('TERRA_DB_HOST');
  if (!sourcePort) missing.push('TERRA_DB_PORT');
  if (!sourceDatabase) missing.push('TERRA_DB_NAME');
  if (!sourceUser) missing.push('TERRA_DB_USER');
  if (!sourcePassword) missing.push('TERRA_DB_PASSWORD');
  if (!destHost) missing.push('TARGET_DB_HOST');
  if (!destPort) missing.push('TARGET_DB_PORT');
  if (!destDatabase) missing.push('TARGET_DB_NAME');
  if (!destUser) missing.push('TARGET_DB_USER');
  if (!destPassword) missing.push('TARGET_DB_PASSWORD');

  if (missing.length > 0) {
    console.error(`[verify] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return {
    source: {
      host: sourceHost!,
      port: parseInt(sourcePort!, 10),
      database: sourceDatabase!,
      user: sourceUser!,
      password: sourcePassword!,
    },
    destination: {
      host: destHost!,
      port: parseInt(destPort!, 10),
      database: destDatabase!,
      user: destUser!,
      password: destPassword!,
    },
  };
}

/**
 * CLI entry point — executes when run directly via `tsx verify.ts`
 */
async function main(): Promise<void> {
  console.log('[verify] Starting database migration verification...');

  const config = getConfigFromEnv();
  console.log(`[verify] Source: ${config.source.host}:${config.source.port}/${config.source.database}`);
  console.log(`[verify] Destination: ${config.destination.host}:${config.destination.port}/${config.destination.database}`);

  const result = await verifyMigration(config);

  // Output the comparison report as JSON
  console.log('[verify] Comparison Report:');
  console.log(JSON.stringify(result, null, 2));

  if (result.totalDiscrepancies === 0 && result.foreignKeyValid && result.orphanedRecords === 0) {
    console.log('[verify] ✓ Migration verified successfully — zero discrepancies, referential integrity intact.');
  } else {
    if (result.totalDiscrepancies > 0) {
      console.error(`[verify] ✗ Row count discrepancies found: ${result.totalDiscrepancies} total across tables:`);
      for (const table of result.tables) {
        if (table.discrepancy !== 0) {
          console.error(
            `[verify]   - ${table.name}: source=${table.sourceRowCount}, dest=${table.destRowCount}, discrepancy=${table.discrepancy}`
          );
        }
      }
    }

    if (!result.foreignKeyValid) {
      console.error(`[verify] ✗ Referential integrity violated: ${result.orphanedRecords} orphaned records found.`);
    }

    process.exit(1);
  }
}

// Only run main when executed directly (not when imported as a module)
const isDirectRun = process.argv[1]?.endsWith('verify.ts') ||
                    process.argv[1]?.endsWith('verify');

if (isDirectRun) {
  main().catch((err) => {
    console.error('[verify] Unexpected error:', err);
    process.exit(1);
  });
}
