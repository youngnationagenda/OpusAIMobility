/**
 * Database Import Script
 *
 * Streams an exported SQL file into the target RDS MySQL instance.
 * Detects constraint violations and data type mismatches, halts on error,
 * and produces an ImportErrorReport with affected records.
 *
 * Requirements: 1.2, 1.4
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import type { Connection } from 'mysql2/promise';
import type { ImportErrorReport, ConstraintViolation } from '@opusaimobility/common';

/** MySQL error codes for constraint violations */
const CONSTRAINT_ERROR_CODES: Record<number, ConstraintViolation['violationType']> = {
  1062: 'unique_constraint',   // ER_DUP_ENTRY
  1216: 'foreign_key',         // ER_NO_REFERENCED_ROW
  1217: 'foreign_key',         // ER_ROW_IS_REFERENCED
  1451: 'foreign_key',         // ER_ROW_IS_REFERENCED_2
  1452: 'foreign_key',         // ER_NO_REFERENCED_ROW_2
  1048: 'not_null',            // ER_BAD_NULL_ERROR
  1264: 'data_type_mismatch',  // ER_WARN_DATA_OUT_OF_RANGE
  1265: 'data_type_mismatch',  // WARN_DATA_TRUNCATED
  1366: 'data_type_mismatch',  // ER_TRUNCATED_WRONG_VALUE_FOR_FIELD
  1406: 'data_type_mismatch',  // ER_DATA_TOO_LONG
};

/** Configuration for the database import */
export interface ImportConfig {
  /** RDS MySQL host */
  host: string;
  /** RDS MySQL port */
  port: number;
  /** Target database name */
  database: string;
  /** Database user */
  user: string;
  /** Database password */
  password: string;
  /** Path to the exported SQL file */
  inputPath: string;
}

/** Result of the import operation */
export interface ImportResult {
  success: boolean;
  statementsExecuted: number;
  errorReport?: ImportErrorReport;
  error?: string;
}

/**
 * Extracts the table name from a SQL statement.
 * Handles INSERT INTO, CREATE TABLE, ALTER TABLE, and related statements.
 */
export function extractTableName(statement: string): string {
  const trimmed = statement.trimStart();

  // INSERT INTO `table_name` or INSERT INTO table_name
  const insertMatch = trimmed.match(/^INSERT\s+INTO\s+`?(\w+)`?/i);
  if (insertMatch) return insertMatch[1];

  // CREATE TABLE `table_name` or CREATE TABLE IF NOT EXISTS `table_name`
  const createMatch = trimmed.match(
    /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i
  );
  if (createMatch) return createMatch[1];

  // ALTER TABLE `table_name`
  const alterMatch = trimmed.match(/^ALTER\s+TABLE\s+`?(\w+)`?/i);
  if (alterMatch) return alterMatch[1];

  // UPDATE `table_name`
  const updateMatch = trimmed.match(/^UPDATE\s+`?(\w+)`?/i);
  if (updateMatch) return updateMatch[1];

  // DELETE FROM `table_name`
  const deleteMatch = trimmed.match(/^DELETE\s+FROM\s+`?(\w+)`?/i);
  if (deleteMatch) return deleteMatch[1];

  return 'unknown';
}

/**
 * Extracts affected record information from a SQL statement for error reporting.
 * Returns a truncated version of the statement showing the data being inserted.
 */
export function extractAffectedRecord(statement: string): string {
  // Limit to first 200 chars to keep the report manageable
  const truncated = statement.length > 200
    ? statement.substring(0, 200) + '...'
    : statement;
  return truncated;
}

/**
 * Classifies a MySQL error into a ConstraintViolation if it matches known error codes.
 * Returns undefined if the error is not a constraint/type violation.
 */
export function classifyMySQLError(
  error: unknown,
  statement: string
): ConstraintViolation | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const mysqlError = error as { errno?: number; code?: string; message?: string; sqlMessage?: string };
  const errno = mysqlError.errno;

  if (errno === undefined || !(errno in CONSTRAINT_ERROR_CODES)) {
    return undefined;
  }

  const violationType = CONSTRAINT_ERROR_CODES[errno];
  const table = extractTableName(statement);
  const affectedRecord = extractAffectedRecord(statement);
  const message = mysqlError.sqlMessage || mysqlError.message || `MySQL error ${errno}`;

  return {
    table,
    affectedRecords: [affectedRecord],
    violationType,
    message,
  };
}

/**
 * Reads and parses a SQL dump file, yielding individual SQL statements.
 * Handles multi-line statements terminated by semicolons.
 * Skips comments and empty lines.
 */
export async function* parseSqlStatements(
  filePath: string
): AsyncGenerator<string, void, undefined> {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let currentStatement = '';
  let inMultiLineComment = false;

  for await (const line of rl) {
    const trimmed = line.trim();

    // Handle multi-line comments /* ... */
    if (inMultiLineComment) {
      if (trimmed.includes('*/')) {
        inMultiLineComment = false;
        // Check for content after the comment close
        const afterComment = trimmed.substring(trimmed.indexOf('*/') + 2).trim();
        if (afterComment) {
          currentStatement += afterComment + ' ';
        }
      }
      continue;
    }

    // Skip single-line comments
    if (trimmed.startsWith('--') || trimmed.startsWith('#')) {
      continue;
    }

    // Detect start of multi-line comment (but not MySQL conditionals like /*!...)
    if (trimmed.startsWith('/*') && !trimmed.startsWith('/*!')) {
      if (!trimmed.includes('*/')) {
        inMultiLineComment = true;
      }
      continue;
    }

    // Skip empty lines
    if (trimmed === '') continue;

    // Accumulate lines into a statement
    currentStatement += line + '\n';

    // Check if the statement is complete (ends with semicolon)
    if (trimmed.endsWith(';')) {
      const stmt = currentStatement.trim();
      if (stmt.length > 0 && stmt !== ';') {
        yield stmt;
      }
      currentStatement = '';
    }
  }

  // Yield any remaining statement (without terminator)
  if (currentStatement.trim().length > 0 && currentStatement.trim() !== ';') {
    yield currentStatement.trim();
  }
}

/**
 * Creates a MySQL connection using the mysql2/promise module.
 * Dynamically imports mysql2 to keep the module importable in test environments
 * without requiring the mysql2 package to be installed globally.
 */
async function createConnection(config: ImportConfig): Promise<Connection> {
  const mysql = await import('mysql2/promise');
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    multipleStatements: false,
    connectTimeout: 10_000,
    ssl: { rejectUnauthorized: true },
  });
}

/**
 * Imports an exported SQL file into the target RDS MySQL instance.
 *
 * Streams SQL statements one at a time and executes them sequentially.
 * If a constraint violation or data type mismatch is encountered:
 * - Halts the import immediately
 * - Logs the specific error
 * - Produces an ImportErrorReport with affected records
 *
 * On success, returns a result indicating readiness for verification.
 */
export async function importDatabase(config: ImportConfig): Promise<ImportResult> {
  const inputPath = resolve(config.inputPath);

  // Validate input file exists and is non-empty
  try {
    const fileInfo = await stat(inputPath);
    if (fileInfo.size === 0) {
      return {
        success: false,
        statementsExecuted: 0,
        error: 'Import file is empty (0 bytes)',
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      statementsExecuted: 0,
      error: `Cannot read import file: ${message}`,
    };
  }

  // Connect to target database
  let connection: Connection;
  try {
    connection = await createConnection(config);
    console.log(`[import-db] Connected to ${config.host}:${config.port}/${config.database}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      statementsExecuted: 0,
      error: `Failed to connect to database: ${message}`,
    };
  }

  let statementsExecuted = 0;
  const violations: ConstraintViolation[] = [];

  try {
    // Disable FK checks during import for proper ordering, re-enable after
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"');
    await connection.execute("SET NAMES 'utf8mb4'");

    for await (const statement of parseSqlStatements(inputPath)) {
      try {
        await connection.execute(statement);
        statementsExecuted++;

        // Progress logging every 100 statements
        if (statementsExecuted % 100 === 0) {
          console.log(`[import-db] Executed ${statementsExecuted} statements...`);
        }
      } catch (err) {
        // Check if this is a constraint violation
        const violation = classifyMySQLError(err, statement);

        if (violation) {
          violations.push(violation);

          const errorReport: ImportErrorReport = {
            table: violation.table,
            violations,
            halted: true,
            timestamp: new Date().toISOString(),
          };

          console.error(
            `[import-db] Constraint violation detected at statement ${statementsExecuted + 1}: ` +
            `[${violation.violationType}] ${violation.message}`
          );
          console.error(`[import-db] Affected table: ${violation.table}`);
          console.error(`[import-db] Import halted. Error report generated.`);

          return {
            success: false,
            statementsExecuted,
            errorReport,
            error: `Import halted: ${violation.violationType} violation in table "${violation.table}" — ${violation.message}`,
          };
        }

        // Non-constraint error — still halt but with generic error
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[import-db] SQL execution error at statement ${statementsExecuted + 1}: ${message}`);

        return {
          success: false,
          statementsExecuted,
          error: `SQL execution error: ${message}`,
        };
      }
    }

    // Re-enable FK checks and verify integrity
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log(
      `[import-db] Import complete. ${statementsExecuted} statements executed successfully.`
    );

    return {
      success: true,
      statementsExecuted,
    };
  } finally {
    try {
      await connection.end();
    } catch {
      // Connection cleanup - ignore errors
    }
  }
}

/**
 * Reads import configuration from environment variables.
 */
function getConfigFromEnv(): ImportConfig {
  const host = process.env.TARGET_DB_HOST;
  const port = process.env.TARGET_DB_PORT;
  const database = process.env.TARGET_DB_NAME;
  const user = process.env.TARGET_DB_USER;
  const password = process.env.TARGET_DB_PASSWORD;
  const inputPath = process.env.IMPORT_INPUT_PATH || './terraai-export.sql';

  const missing: string[] = [];
  if (!host) missing.push('TARGET_DB_HOST');
  if (!port) missing.push('TARGET_DB_PORT');
  if (!database) missing.push('TARGET_DB_NAME');
  if (!user) missing.push('TARGET_DB_USER');
  if (!password) missing.push('TARGET_DB_PASSWORD');

  if (missing.length > 0) {
    console.error(`[import-db] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return {
    host: host!,
    port: parseInt(port!, 10),
    database: database!,
    user: user!,
    password: password!,
    inputPath,
  };
}

/**
 * CLI entry point — executes when run directly via `tsx import-db.ts`
 */
async function main(): Promise<void> {
  console.log('[import-db] Starting TerraAI database import...');

  const config = getConfigFromEnv();
  console.log(`[import-db] Target: ${config.host}:${config.port}/${config.database}`);
  console.log(`[import-db] Input file: ${config.inputPath}`);

  const result = await importDatabase(config);

  if (!result.success) {
    console.error(`[import-db] Import failed: ${result.error}`);

    if (result.errorReport) {
      console.error('[import-db] Error Report:');
      console.error(JSON.stringify(result.errorReport, null, 2));
    }

    process.exit(1);
  }

  console.log(`[import-db] Import successful. ${result.statementsExecuted} statements executed.`);
  console.log('[import-db] Ready for verification step.');
}

// Only run main when executed directly (not when imported as a module)
const isDirectRun = process.argv[1]?.endsWith('import-db.ts') ||
                    process.argv[1]?.endsWith('import-db');

if (isDirectRun) {
  main().catch((err) => {
    console.error('[import-db] Unexpected error:', err);
    process.exit(1);
  });
}
