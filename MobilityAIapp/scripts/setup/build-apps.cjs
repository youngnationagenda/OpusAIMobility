/**
 * OpusAIMobility — Gradle Build Script (Windows)
 * Builds Customer + Driver APKs (debug + release) and uploads to S3.
 */
const { spawnSync, execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const JAVA_HOME     = 'C:\\Users\\user\\AppData\\Local\\jdk17\\PFiles64\\Eclipse Adoptium\\jdk-17.0.19.10-hotspot';
const ANDROID_SDK   = 'C:\\Users\\user\\android-sdk';
const BASE          = 'D:\\omnisonietest\\OpusAIMobility\\MobilityAIapp\\android';

// Keystore credentials (fetched from Secrets Manager in prepare-build step)
const KS_PASSWORD   = 'OpusAI2026@Keystore!';
const KEY_ALIAS     = 'opusaimobility';
const KEY_PASSWORD  = 'OpusAI2026@Key!';

const S3_BUCKET     = 'opusaimobility-apk-distribution';

const buildEnv = {
  ...process.env,
  JAVA_HOME,
  ANDROID_SDK_ROOT:  ANDROID_SDK,
  ANDROID_HOME:      ANDROID_SDK,
  KEYSTORE_PASSWORD: KS_PASSWORD,
  KEY_ALIAS,
  KEY_PASSWORD,
  GRADLE_USER_HOME:  'C:\\Users\\user\\.gradle',
  PATH: `${JAVA_HOME}\\bin;${ANDROID_SDK}\\platform-tools;${ANDROID_SDK}\\build-tools\\34.0.0;${process.env.PATH}`
};

function runGradle(appDir, task, extraArgs = []) {
  const gradlew = path.join(appDir, 'gradlew.bat');
  const args = [task, '--no-daemon', '--stacktrace', ...extraArgs];
  console.log(`\n  Running: gradlew.bat ${args.join(' ')}`);
  console.log(`  Working dir: ${appDir}`);
  const result = spawnSync(gradlew, args, {
    cwd: appDir,
    env: buildEnv,
    stdio: 'inherit',
    timeout: 1200000, // 20 minutes
    shell: true
  });
  return result.status;
}

function uploadToS3(apkPath, s3Key) {
  if (!fs.existsSync(apkPath)) {
    console.log(`  ⚠  APK not found at ${apkPath} — skipping upload`);
    return false;
  }
  const size = (fs.statSync(apkPath).size / 1024 / 1024).toFixed(1);
  console.log(`  📦 Uploading ${size} MB → s3://${S3_BUCKET}/${s3Key}`);
  try {
    execSync(
      `aws s3 cp "${apkPath}" "s3://${S3_BUCKET}/${s3Key}" --region us-east-1`,
      { env: buildEnv, encoding: 'utf8', timeout: 120000 }
    );
    console.log(`  ✅ Upload complete: s3://${S3_BUCKET}/${s3Key}`);
    return true;
  } catch (e) {
    console.error('  ❌ S3 upload failed:', e.message);
    return false;
  }
}

function buildApp(name, appDir, ksPath) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Building: ${name}`);
  console.log('═'.repeat(60));

  // Set keystore file env var for this app
  buildEnv.KEYSTORE_FILE = ksPath.replace(/\\/g, '/');
  console.log(`  Keystore: ${buildEnv.KEYSTORE_FILE}`);

  // --- Debug build ---
  console.log('\n--- Debug APK ---');
  const debugStatus = runGradle(appDir, 'assembleDebug');
  if (debugStatus !== 0) {
    console.error(`  ❌ Debug build FAILED (exit ${debugStatus})`);
    return { debug: false, release: false };
  }
  console.log('  ✅ Debug build succeeded');

  // --- Release build ---
  console.log('\n--- Release APK ---');
  const releaseStatus = runGradle(appDir, 'assembleRelease');
  if (releaseStatus !== 0) {
    console.warn(`  ⚠  Release build returned ${releaseStatus} — may have used debug signing`);
  } else {
    console.log('  ✅ Release build succeeded');
  }

  // --- Find and display APK locations ---
  const outputBase = path.join(appDir, 'app', 'build', 'outputs', 'apk');
  const debugApk   = path.join(outputBase, 'debug',   'app-debug.apk');
  const releaseApk = path.join(outputBase, 'release', 'app-release.apk');

  console.log('\n--- APK Outputs ---');
  if (fs.existsSync(debugApk)) {
    const sz = (fs.statSync(debugApk).size / 1024 / 1024).toFixed(1);
    console.log(`  Debug:   ${debugApk} (${sz} MB)`);
  }
  if (fs.existsSync(releaseApk)) {
    const sz = (fs.statSync(releaseApk).size / 1024 / 1024).toFixed(1);
    console.log(`  Release: ${releaseApk} (${sz} MB)`);
  }

  return { debug: fs.existsSync(debugApk), release: fs.existsSync(releaseApk), debugApk, releaseApk };
}

async function main() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        OpusAIMobility Android Build                      ║');
  console.log(`║  Started: ${new Date().toISOString().slice(0, 19)}                          ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  const customerDir  = path.join(BASE, 'customer');
  const driverDir    = path.join(BASE, 'driver');
  const customerKs   = path.join(customerDir, 'app', 'opusaimobility-release.jks');
  const driverKs     = path.join(driverDir,   'app', 'opusaimobility-driver.jks');

  const results = {};

  // ── Customer App ──────────────────────────────────────────────────────────
  results.customer = buildApp('Customer App (com.yna.opusaimobilityapp)', customerDir, customerKs);

  // ── Driver App ────────────────────────────────────────────────────────────
  results.driver = buildApp('Driver App (com.opusaimobility.driver)', driverDir, driverKs);

  // ── Upload to S3 ──────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  Uploading APKs to S3...');
  console.log('═'.repeat(60));

  if (results.customer.debugApk) {
    uploadToS3(results.customer.debugApk,  `customer/debug/opusaimobility-customer-debug-latest.apk`);
    uploadToS3(results.customer.debugApk,  `customer/debug/opusaimobility-customer-debug-${ts}.apk`);
  }
  if (results.customer.releaseApk) {
    uploadToS3(results.customer.releaseApk, `customer/release/opusaimobility-customer-release-latest.apk`);
    uploadToS3(results.customer.releaseApk, `customer/release/opusaimobility-customer-release-${ts}.apk`);
  }
  if (results.driver.debugApk) {
    uploadToS3(results.driver.debugApk,    `driver/debug/opusaimobility-driver-debug-latest.apk`);
    uploadToS3(results.driver.debugApk,    `driver/debug/opusaimobility-driver-debug-${ts}.apk`);
  }
  if (results.driver.releaseApk) {
    uploadToS3(results.driver.releaseApk,  `driver/release/opusaimobility-driver-release-latest.apk`);
    uploadToS3(results.driver.releaseApk,  `driver/release/opusaimobility-driver-release-${ts}.apk`);
  }

  // ── Final Summary ─────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    Build Summary                         ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Customer Debug:   ${results.customer.debug   ? '✅ BUILT' : '❌ FAILED'}`
    .padEnd(60) + '║');
  console.log(`║  Customer Release: ${results.customer.release ? '✅ BUILT' : '⚠ SKIPPED'}`
    .padEnd(60) + '║');
  console.log(`║  Driver   Debug:   ${results.driver.debug     ? '✅ BUILT' : '❌ FAILED'}`
    .padEnd(60) + '║');
  console.log(`║  Driver   Release: ${results.driver.release   ? '✅ BUILT' : '⚠ SKIPPED'}`
    .padEnd(60) + '║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  S3 Bucket: opusaimobility-apk-distribution              ║');
  console.log('║  Customer: s3://...customer/debug|release/               ║');
  console.log('║  Driver:   s3://...driver/debug|release/                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

main().catch(e => { console.error('BUILD SCRIPT FAILED:', e); process.exit(1); });
