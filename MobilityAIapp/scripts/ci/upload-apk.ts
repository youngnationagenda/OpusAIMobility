/**
 * APK Upload CI Script
 *
 * Uploads a built APK to S3 under `/apks/customer/debug/<app-name>-debug-<build-number>.apk`
 * and copies it to `/apks/customer/debug/latest.apk` for a stable download URL.
 *
 * Exits with an error within 30 seconds if upload fails, reporting the failure reason.
 *
 * Requirements: 6.1, 6.5, 6.6
 *
 * Usage:
 *   APK_PATH=./app-debug.apk APP_NAME=opusaimobility BUILD_NUMBER=42 \
 *   S3_APK_BUCKET=opusaimobility-apk-distribution AWS_REGION=us-east-1 \
 *   tsx upload-apk.ts
 */

import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'node:fs';

/** Configuration for the APK upload */
export interface ApkUploadConfig {
  /** Local path to the built APK file */
  apkPath: string;
  /** Application name (used in the S3 key) */
  appName: string;
  /** CI build number (used in the S3 key) */
  buildNumber: string;
  /** Target S3 bucket name */
  s3Bucket: string;
  /** AWS region for S3 */
  region: string;
}

/** Result of the APK upload operation */
export interface ApkUploadResult {
  /** Whether the upload succeeded */
  success: boolean;
  /** The versioned S3 key where the APK was uploaded */
  versionedKey?: string;
  /** The stable latest S3 key */
  latestKey?: string;
  /** Error message if upload failed */
  error?: string;
}

/** Timeout in milliseconds — script must exit within 30 seconds on failure */
const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * Builds the versioned S3 key for an APK upload.
 *
 * @param appName - The application name
 * @param buildNumber - The CI build number
 * @returns The S3 object key in format: apks/customer/debug/<app-name>-debug-<build-number>.apk
 */
export function buildVersionedKey(appName: string, buildNumber: string): string {
  return `apks/customer/debug/${appName}-debug-${buildNumber}.apk`;
}

/**
 * Returns the stable "latest" S3 key for the debug APK.
 *
 * @returns The S3 object key: apks/customer/debug/latest.apk
 */
export function buildLatestKey(): string {
  return 'apks/customer/debug/latest.apk';
}

/**
 * Uploads the APK to S3 at the versioned key, then copies it to the latest key.
 *
 * @param config - Upload configuration
 * @param client - S3 client instance (injectable for testing)
 * @returns ApkUploadResult indicating success or failure
 */
export async function uploadApk(
  config: ApkUploadConfig,
  client: S3Client
): Promise<ApkUploadResult> {
  const { apkPath, appName, buildNumber, s3Bucket } = config;

  // Validate APK file exists and is readable
  if (!fs.existsSync(apkPath)) {
    return {
      success: false,
      error: `APK file not found: ${apkPath}`,
    };
  }

  const stats = fs.statSync(apkPath);
  if (stats.size === 0) {
    return {
      success: false,
      error: `APK file is empty (0 bytes): ${apkPath}`,
    };
  }

  const versionedKey = buildVersionedKey(appName, buildNumber);
  const latestKey = buildLatestKey();

  // Step 1: Upload APK to versioned key
  console.log(`[upload-apk] Uploading APK to s3://${s3Bucket}/${versionedKey}`);

  const fileBuffer = fs.readFileSync(apkPath);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: versionedKey,
        Body: fileBuffer,
        ContentLength: stats.size,
        ContentType: 'application/vnd.android.package-archive',
        ContentDisposition: `attachment; filename="${appName}-debug-${buildNumber}.apk"`,
      })
    );
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      versionedKey,
      error: `Failed to upload APK to versioned path: ${reason}`,
    };
  }

  console.log(`[upload-apk] Upload successful: s3://${s3Bucket}/${versionedKey}`);

  // Step 2: Copy the uploaded file to the stable "latest.apk" path
  console.log(`[upload-apk] Copying to stable URL: s3://${s3Bucket}/${latestKey}`);

  try {
    await client.send(
      new CopyObjectCommand({
        Bucket: s3Bucket,
        CopySource: `${s3Bucket}/${versionedKey}`,
        Key: latestKey,
        ContentType: 'application/vnd.android.package-archive',
        ContentDisposition: `attachment; filename="latest.apk"`,
        MetadataDirective: 'REPLACE',
      })
    );
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      versionedKey,
      latestKey,
      error: `APK uploaded to versioned path but failed to copy to latest: ${reason}`,
    };
  }

  console.log(`[upload-apk] Copy successful: s3://${s3Bucket}/${latestKey}`);

  return {
    success: true,
    versionedKey,
    latestKey,
  };
}

/**
 * Reads upload configuration from environment variables.
 * Exits with error if any required variable is missing.
 */
export function getConfigFromEnv(): ApkUploadConfig {
  const apkPath = process.env.APK_PATH;
  const appName = process.env.APP_NAME;
  const buildNumber = process.env.BUILD_NUMBER;
  const s3Bucket = process.env.S3_APK_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';

  const missing: string[] = [];
  if (!apkPath) missing.push('APK_PATH');
  if (!appName) missing.push('APP_NAME');
  if (!buildNumber) missing.push('BUILD_NUMBER');
  if (!s3Bucket) missing.push('S3_APK_BUCKET');

  if (missing.length > 0) {
    console.error(`[upload-apk] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return {
    apkPath: apkPath!,
    appName: appName!,
    buildNumber: buildNumber!,
    s3Bucket: s3Bucket!,
    region,
  };
}

/**
 * CLI entry point — executes when run directly via `tsx upload-apk.ts`
 */
async function main(): Promise<void> {
  console.log('[upload-apk] Starting APK upload to S3...');

  const config = getConfigFromEnv();
  console.log(`[upload-apk] APK Path: ${config.apkPath}`);
  console.log(`[upload-apk] App Name: ${config.appName}`);
  console.log(`[upload-apk] Build Number: ${config.buildNumber}`);
  console.log(`[upload-apk] S3 Bucket: ${config.s3Bucket}`);
  console.log(`[upload-apk] Region: ${config.region}`);

  const s3Client = new S3Client({ region: config.region });

  // Set a timeout to ensure we exit within 30 seconds on failure
  const timeoutHandle = setTimeout(() => {
    console.error('[upload-apk] ERROR: Upload timed out after 30 seconds');
    process.exit(1);
  }, UPLOAD_TIMEOUT_MS);

  try {
    const result = await uploadApk(config, s3Client);

    clearTimeout(timeoutHandle);

    if (!result.success) {
      console.error(`[upload-apk] ERROR: ${result.error}`);
      process.exit(1);
    }

    console.log('[upload-apk] === APK Upload Summary ===');
    console.log(`[upload-apk] Versioned URL: s3://${config.s3Bucket}/${result.versionedKey}`);
    console.log(`[upload-apk] Latest URL: s3://${config.s3Bucket}/${result.latestKey}`);
    console.log('[upload-apk] Upload completed successfully');
  } catch (error: unknown) {
    clearTimeout(timeoutHandle);
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[upload-apk] ERROR: Unexpected failure — ${reason}`);
    process.exit(1);
  }
}

// Only run main when executed directly (not when imported as a module)
const isDirectRun =
  process.argv[1]?.endsWith('upload-apk.ts') ||
  process.argv[1]?.endsWith('upload-apk');

if (isDirectRun) {
  main().catch((err) => {
    console.error('[upload-apk] Unexpected error:', err);
    process.exit(1);
  });
}
