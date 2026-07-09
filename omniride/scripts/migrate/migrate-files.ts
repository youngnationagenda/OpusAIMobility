/**
 * File Migration Script
 *
 * Copies all files from TerraAI's upload directory to the designated S3 bucket,
 * preserving the original directory structure as S3 key prefixes.
 * Produces a report listing total files copied, total bytes transferred, and failed files.
 *
 * Requirements: 9.1
 */

import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  FileMigrationResult,
  FileMigrationFailure,
  FileMigrationEntry,
} from '@opusaimobility/common';

/** Configuration for the file migration */
export interface FileMigrationConfig {
  /** Absolute path to TerraAI's upload directory on the local filesystem */
  sourceDir: string;
  /** Target S3 bucket name */
  s3Bucket: string;
  /** AWS region for S3 */
  region: string;
  /** Optional key prefix to prepend to all S3 keys */
  keyPrefix?: string;
}

/**
 * Converts a local file path (relative to the upload directory) to an S3 key.
 * Preserves directory structure as S3 key prefixes.
 * Normalizes path separators to forward slashes for S3 compatibility.
 *
 * @param relativePath - File path relative to the TerraAI upload directory
 * @param keyPrefix - Optional prefix to prepend to the key
 * @returns The S3 object key
 */
export function toS3Key(relativePath: string, keyPrefix?: string): string {
  // Normalize to forward slashes (S3 uses forward slashes as delimiters)
  const normalized = relativePath.replace(/\\/g, '/');

  // Remove any leading slash
  const cleaned = normalized.startsWith('/') ? normalized.slice(1) : normalized;

  if (keyPrefix) {
    const prefix = keyPrefix.endsWith('/') ? keyPrefix : `${keyPrefix}/`;
    return `${prefix}${cleaned}`;
  }

  return cleaned;
}

/**
 * Recursively walks a directory and returns all file paths relative to the root.
 *
 * @param dir - The directory to walk
 * @param rootDir - The root directory (for computing relative paths)
 * @returns Array of relative file paths
 */
export function walkDirectory(dir: string, rootDir?: string): string[] {
  const root = rootDir ?? dir;
  const results: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath, root));
    } else if (entry.isFile()) {
      const relativePath = path.relative(root, fullPath);
      results.push(relativePath);
    }
  }

  return results;
}

/**
 * Uploads a single file to S3, preserving its relative path as the S3 key.
 *
 * @param client - S3 client
 * @param bucket - Target S3 bucket
 * @param sourceDir - Root upload directory
 * @param relativePath - File path relative to sourceDir
 * @param keyPrefix - Optional S3 key prefix
 * @returns A FileMigrationEntry describing the result
 */
export async function uploadFileToS3(
  client: S3Client,
  bucket: string,
  sourceDir: string,
  relativePath: string,
  keyPrefix?: string
): Promise<FileMigrationEntry> {
  const fullPath = path.join(sourceDir, relativePath);
  const s3Key = toS3Key(relativePath, keyPrefix);

  try {
    const fileBuffer = fs.readFileSync(fullPath);
    const stats = fs.statSync(fullPath);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentLength: stats.size,
      })
    );

    return {
      sourcePath: relativePath,
      destKey: s3Key,
      sizeBytes: stats.size,
      success: true,
    };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      sourcePath: relativePath,
      destKey: s3Key,
      sizeBytes: 0,
      success: false,
      error: reason,
    };
  }
}

/**
 * Migrates all files from the TerraAI upload directory to S3.
 * This is the core migration function exported for property testing.
 *
 * @param config - File migration configuration
 * @param client - S3 client instance (injectable for testing)
 * @returns FileMigrationResult with totals and failures
 */
export async function migrateFiles(
  config: FileMigrationConfig,
  client: S3Client
): Promise<FileMigrationResult> {
  const { sourceDir, s3Bucket, keyPrefix } = config;

  // Discover all files in the source directory
  const files = walkDirectory(sourceDir);
  console.log(`[migrate-files] Found ${files.length} files in ${sourceDir}`);

  let totalFiles = 0;
  let totalBytes = 0;
  const failed: FileMigrationFailure[] = [];

  for (const relativePath of files) {
    const entry = await uploadFileToS3(client, s3Bucket, sourceDir, relativePath, keyPrefix);

    if (entry.success) {
      totalFiles++;
      totalBytes += entry.sizeBytes;
      console.log(`[migrate-files] Copied: ${relativePath} → s3://${s3Bucket}/${entry.destKey} (${entry.sizeBytes} bytes)`);
    } else {
      failed.push({
        path: relativePath,
        reason: entry.error ?? 'Unknown error',
      });
      console.warn(`[migrate-files] Failed: ${relativePath} — ${entry.error}`);
    }
  }

  const result: FileMigrationResult = {
    totalFiles,
    totalBytes,
    failed,
  };

  return result;
}

/**
 * Builds and logs the migration report summary.
 *
 * @param result - The FileMigrationResult from migrateFiles
 * @returns The same result, after logging
 */
export function buildFileMigrationReport(result: FileMigrationResult): FileMigrationResult {
  console.log('[migrate-files] === File Migration Summary ===');
  console.log(`[migrate-files] Total Files Copied: ${result.totalFiles}`);
  console.log(`[migrate-files] Total Bytes Transferred: ${result.totalBytes}`);
  console.log(`[migrate-files] Failed Files: ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.log('[migrate-files] Failed files:');
    for (const f of result.failed) {
      console.log(`[migrate-files]   - ${f.path}: ${f.reason}`);
    }
  }

  return result;
}

/**
 * Reads migration configuration from environment variables.
 */
function getConfigFromEnv(): FileMigrationConfig {
  const sourceDir = process.env.TERRA_UPLOAD_DIR;
  const s3Bucket = process.env.S3_UPLOAD_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  const keyPrefix = process.env.S3_KEY_PREFIX || undefined;

  const missing: string[] = [];
  if (!sourceDir) missing.push('TERRA_UPLOAD_DIR');
  if (!s3Bucket) missing.push('S3_UPLOAD_BUCKET');

  if (missing.length > 0) {
    console.error(`[migrate-files] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return {
    sourceDir: sourceDir!,
    s3Bucket: s3Bucket!,
    region,
    keyPrefix,
  };
}

/**
 * CLI entry point — executes when run directly via `tsx migrate-files.ts`
 */
async function main(): Promise<void> {
  console.log('[migrate-files] Starting TerraAI file migration to S3...');

  const config = getConfigFromEnv();
  console.log(`[migrate-files] Source directory: ${config.sourceDir}`);
  console.log(`[migrate-files] Target bucket: ${config.s3Bucket}`);
  if (config.keyPrefix) {
    console.log(`[migrate-files] Key prefix: ${config.keyPrefix}`);
  }

  // Verify source directory exists
  if (!fs.existsSync(config.sourceDir)) {
    console.error(`[migrate-files] Source directory does not exist: ${config.sourceDir}`);
    process.exit(1);
  }

  // Create S3 client
  const s3Client = new S3Client({ region: config.region });

  // Run migration
  const result = await migrateFiles(config, s3Client);

  // Produce report
  buildFileMigrationReport(result);

  // Output as JSON for downstream consumption
  console.log('[migrate-files] Report JSON:');
  console.log(JSON.stringify(result, null, 2));

  if (result.failed.length > 0) {
    console.warn(`[migrate-files] Migration completed with ${result.failed.length} failures`);
    process.exit(1);
  } else {
    console.log('[migrate-files] Migration completed successfully');
  }
}

// Only run main when executed directly (not when imported as a module)
const isDirectRun = process.argv[1]?.endsWith('migrate-files.ts') ||
                    process.argv[1]?.endsWith('migrate-files');

if (isDirectRun) {
  main().catch((err) => {
    console.error('[migrate-files] Unexpected error:', err);
    process.exit(1);
  });
}
