/**
 * Database Export Script
 *
 * Executes mysqldump against the source TerraAI database to export
 * complete schema including tables, indexes, constraints, stored procedures,
 * views, triggers, and functions.
 *
 * Requirements: 1.1, 1.6
 */

import { execFile } from 'node:child_process';
import { stat, unlink, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Configuration for the database export */
export interface ExportConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  outputPath: string;
}

/** Result of the export operation */
export interface ExportResult {
  success: boolean;
  outputPath: string;
  fileSizeBytes: number;
  error?: string;
  lastExportedObject?: string;
}

/**
 * Validates that a SQL dump file is non-empty and contains basic valid SQL structure.
 * Checks for:
 * - File size > 0
 * - Contains at least one SQL statement terminator
 * - Starts with valid mysqldump header or SQL comment/statement
 */
export async function validateExportFile(filePath: string): Promise<{ valid: boolean; reason?: string }> {
  const fileInfo = await stat(filePath);

  if (fileInfo.size === 0) {
    return { valid: false, reason: 'Export file is empty (0 bytes)' };
  }

  const content = await readFile(filePath, 'utf-8');

  // Basic SQL syntax validation: must contain at least one statement terminator
  if (!content.includes(';')) {
    return { valid: false, reason: 'Export file contains no SQL statement terminators' };
  }

  // Must start with a valid SQL comment, SET statement, or CREATE/DROP/INSERT
  const trimmed = content.trimStart();
  const validStarts = ['--', '/*', 'SET', 'CREATE', 'DROP', 'INSERT', 'USE', 'LOCK', 'UNLOCK'];
  const startsValid = validStarts.some((prefix) => trimmed.startsWith(prefix));

  if (!startsValid) {
    return { valid: false, reason: 'Export file does not begin with valid SQL syntax' };
  }

  return { valid: true };
}

/**
 * Extracts the last successfully exported object from partial mysqldump output.
 * Looks for the last CREATE, INSERT, or DUMP comment referencing a database object.
 */
export function extractLastExportedObject(content: string): string | undefined {
  const lines = content.split('\n');

  // Search backwards for the last object reference
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();

    // mysqldump comments like: -- Dumping data for table `users`
    const dumpMatch = line.match(/^-- (?:Dumping data for|Table structure for) (?:table )?`(\w+)`/i);
    if (dumpMatch) {
      return dumpMatch[1];
    }

    // CREATE statements
    const createMatch = line.match(
      /^CREATE\s+(?:TABLE|VIEW|PROCEDURE|FUNCTION|TRIGGER)\s+(?:IF NOT EXISTS\s+)?`(\w+)`/i
    );
    if (createMatch) {
      return createMatch[1];
    }

    // INSERT statements
    const insertMatch = line.match(/^INSERT\s+INTO\s+`(\w+)`/i);
    if (insertMatch) {
      return insertMatch[1];
    }
  }

  return undefined;
}

/**
 * Executes mysqldump to export the complete TerraAI database schema and data.
 *
 * Exports include:
 * - Tables with data
 * - Indexes and constraints
 * - Stored procedures and functions
 * - Views
 * - Triggers
 *
 * If the export fails or is interrupted, partial files are discarded and
 * the error is logged with the last successfully exported object.
 */
export async function exportDatabase(config: ExportConfig): Promise<ExportResult> {
  const outputPath = resolve(config.outputPath);

  const args = [
    `--host=${config.host}`,
    `--port=${config.port}`,
    `--user=${config.user}`,
    `--databases`,
    config.database,
    '--routines',       // Include stored procedures and functions
    '--triggers',       // Include triggers
    '--events',         // Include events
    '--single-transaction', // Consistent snapshot without locking
    '--set-gtid-purged=OFF', // Avoid GTID-related issues
    '--column-statistics=0', // Avoid column statistics for compatibility
    `--result-file=${outputPath}`,
  ];

  return new Promise<ExportResult>((resolvePromise) => {
    const child = execFile(
      'mysqldump',
      args,
      {
        env: { ...process.env, MYSQL_PWD: config.password },
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer for large schemas
        timeout: 600_000, // 10 minute timeout
      },
      async (error, _stdout, stderr) => {
        if (error) {
          // Export failed — discard partial file and report error
          let lastExportedObject: string | undefined;

          try {
            const partialContent = await readFile(outputPath, 'utf-8');
            lastExportedObject = extractLastExportedObject(partialContent);
          } catch {
            // Partial file may not exist
          }

          // Discard partial file
          try {
            await unlink(outputPath);
          } catch {
            // File may not exist
          }

          const errorMessage = stderr?.trim() || error.message;
          console.error(`[export-db] Export failed: ${errorMessage}`);
          if (lastExportedObject) {
            console.error(`[export-db] Last successfully exported object: ${lastExportedObject}`);
          }

          resolvePromise({
            success: false,
            outputPath,
            fileSizeBytes: 0,
            error: errorMessage,
            lastExportedObject,
          });
          return;
        }

        // Export completed — validate the file
        try {
          const validation = await validateExportFile(outputPath);

          if (!validation.valid) {
            // Validation failed — discard the file
            console.error(`[export-db] Export validation failed: ${validation.reason}`);
            await unlink(outputPath).catch(() => {});

            resolvePromise({
              success: false,
              outputPath,
              fileSizeBytes: 0,
              error: `Export validation failed: ${validation.reason}`,
            });
            return;
          }

          const fileInfo = await stat(outputPath);
          console.log(`[export-db] Export successful: ${outputPath} (${fileInfo.size} bytes)`);

          resolvePromise({
            success: true,
            outputPath,
            fileSizeBytes: fileInfo.size,
          });
        } catch (validationError) {
          // Could not validate — discard and report
          const msg = validationError instanceof Error ? validationError.message : String(validationError);
          console.error(`[export-db] Post-export validation error: ${msg}`);
          await unlink(outputPath).catch(() => {});

          resolvePromise({
            success: false,
            outputPath,
            fileSizeBytes: 0,
            error: `Post-export validation error: ${msg}`,
          });
        }
      }
    );

    // Handle process-level interruption (e.g., SIGTERM)
    process.on('SIGINT', async () => {
      child.kill('SIGTERM');
      try {
        await unlink(outputPath);
      } catch {
        // File may not exist
      }
      console.error('[export-db] Export interrupted by SIGINT, partial file discarded');
      process.exit(1);
    });
  });
}

/**
 * Reads export configuration from environment variables.
 */
function getConfigFromEnv(): ExportConfig {
  const host = process.env.TERRA_DB_HOST;
  const port = process.env.TERRA_DB_PORT;
  const database = process.env.TERRA_DB_NAME;
  const user = process.env.TERRA_DB_USER;
  const password = process.env.TERRA_DB_PASSWORD;
  const outputPath = process.env.EXPORT_OUTPUT_PATH || './terraai-export.sql';

  const missing: string[] = [];
  if (!host) missing.push('TERRA_DB_HOST');
  if (!port) missing.push('TERRA_DB_PORT');
  if (!database) missing.push('TERRA_DB_NAME');
  if (!user) missing.push('TERRA_DB_USER');
  if (!password) missing.push('TERRA_DB_PASSWORD');

  if (missing.length > 0) {
    console.error(`[export-db] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return {
    host: host!,
    port: parseInt(port!, 10),
    database: database!,
    user: user!,
    password: password!,
    outputPath,
  };
}

/**
 * CLI entry point — executes when run directly via `tsx export-db.ts`
 */
async function main(): Promise<void> {
  console.log('[export-db] Starting TerraAI database export...');

  const config = getConfigFromEnv();
  console.log(`[export-db] Target: ${config.host}:${config.port}/${config.database}`);
  console.log(`[export-db] Output: ${config.outputPath}`);

  const result = await exportDatabase(config);

  if (!result.success) {
    console.error(`[export-db] Export failed: ${result.error}`);
    if (result.lastExportedObject) {
      console.error(`[export-db] Last successfully exported object: ${result.lastExportedObject}`);
    }
    process.exit(1);
  }

  console.log(`[export-db] Export complete. File size: ${result.fileSizeBytes} bytes`);
}

// Only run main when executed directly (not when imported as a module)
const isDirectRun = process.argv[1]?.endsWith('export-db.ts') ||
                    process.argv[1]?.endsWith('export-db');

if (isDirectRun) {
  main().catch((err) => {
    console.error('[export-db] Unexpected error:', err);
    process.exit(1);
  });
}
