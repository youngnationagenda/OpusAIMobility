/**
 * OpusAIMobility — Pre-build preparation script
 * 1. Decodes keystore from AWS Secrets Manager
 * 2. Fixes local.properties for both apps  
 * 3. Patches SNS_TOPIC with real account ID
 * 4. Removes duplicate google_map_key from strings.xml (customer app)
 * 5. Patches google-services.json with real keys
 */
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ANDROID_SDK = 'C:\\Users\\user\\android-sdk';
const BASE        = 'D:\\omnisonietest\\OpusAIMobility\\MobilityAIapp\\android';
const ACCOUNT_ID  = '683541453923';

const JAVA_HOME = 'C:\\Users\\user\\AppData\\Local\\jdk17\\PFiles64\\Eclipse Adoptium\\jdk-17.0.19.10-hotspot';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      env: {
        ...process.env,
        JAVA_HOME,
        ANDROID_SDK_ROOT: ANDROID_SDK,
        PATH: `${JAVA_HOME}\\bin;${process.env.PATH}`
      },
      ...opts
    }).trim();
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. local.properties
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[1/5] Updating local.properties...');
const sdkDirVal = `sdk.dir=${ANDROID_SDK.replace(/\\/g, '\\\\')}`;
fs.writeFileSync(path.join(BASE, 'customer', 'local.properties'), sdkDirVal + '\n', 'utf8');
fs.writeFileSync(path.join(BASE, 'driver',   'local.properties'), sdkDirVal + '\n', 'utf8');
console.log(`  sdk.dir = ${ANDROID_SDK}`);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Decode keystore from Secrets Manager
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[2/5] Fetching keystore from AWS Secrets Manager...');
let keystoreData;
try {
  const raw = run(
    'aws secretsmanager get-secret-value --secret-id opusaimobility/android-keystore --query SecretString --output text --region us-east-1'
  );
  keystoreData = JSON.parse(raw);
  console.log('  Secret fetched OK — alias:', keystoreData.keyAlias, '| valid until:', keystoreData.validUntil);
} catch (e) {
  console.error('  ERROR fetching secret:', e.message);
  process.exit(1);
}

// Write keystore for Customer app
const customerKsPath = path.join(BASE, 'customer', 'app', 'opusaimobility-release.jks');
fs.writeFileSync(customerKsPath, Buffer.from(keystoreData.keystoreBase64, 'base64'));
console.log(`  Customer keystore: ${customerKsPath} (${fs.statSync(customerKsPath).size} bytes)`);

// Write keystore for Driver app (same keystore)
const driverKsPath = path.join(BASE, 'driver', 'app', 'opusaimobility-driver.jks');
fs.writeFileSync(driverKsPath, Buffer.from(keystoreData.keystoreBase64, 'base64'));
console.log(`  Driver   keystore: ${driverKsPath} (${fs.statSync(driverKsPath).size} bytes)`);

// Export env vars for gradle (write to a .env file that build script sources)
const envContent = [
  `KEYSTORE_PASSWORD=${keystoreData.storePassword}`,
  `KEY_ALIAS=${keystoreData.keyAlias}`,
  `KEY_PASSWORD=${keystoreData.keyPassword}`,
  `KEYSTORE_FILE_CUSTOMER=${customerKsPath.replace(/\\/g, '/')}`,
  `KEYSTORE_FILE_DRIVER=${driverKsPath.replace(/\\/g, '/')}`,
  `ANDROID_SDK_ROOT=${ANDROID_SDK}`,
  `JAVA_HOME=${JAVA_HOME}`,
].join('\n');
const envFilePath = path.join(BASE, '..', '..', '.build-env');
fs.writeFileSync(envFilePath, envContent, 'utf8');
console.log(`  Build env written to: ${envFilePath}`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Patch SNS_TOPIC in customer app/build.gradle (replace <ACCOUNT_ID>)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[3/5] Patching SNS_TOPIC account ID in customer build.gradle...');
const customerBuildGradle = path.join(BASE, 'customer', 'app', 'build.gradle');
let gradleContent = fs.readFileSync(customerBuildGradle, 'utf8');
if (gradleContent.includes('<ACCOUNT_ID>')) {
  gradleContent = gradleContent.replace(/<ACCOUNT_ID>/g, ACCOUNT_ID);
  fs.writeFileSync(customerBuildGradle, gradleContent, 'utf8');
  console.log(`  Replaced <ACCOUNT_ID> with ${ACCOUNT_ID} in customer build.gradle`);
} else {
  console.log('  SNS_TOPIC already has real account ID — no change needed');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Remove duplicate google_map_key from strings.xml (Customer app)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[4/5] Checking for duplicate google_map_key in customer strings.xml...');
const stringsXmlPath = path.join(BASE, 'customer', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
if (fs.existsSync(stringsXmlPath)) {
  let xml = fs.readFileSync(stringsXmlPath, 'utf8');
  const beforeCount = (xml.match(/name="google_map_key"/g) || []).length;
  if (beforeCount > 0) {
    // Remove static declaration — build.gradle injects it via resValue
    xml = xml.replace(/<string name="google_map_key"[^>]*>.*?<\/string>\s*/gs, '');
    xml = xml.replace(/<string name="google_map_key"[^\/]*\/>\s*/g, '');
    fs.writeFileSync(stringsXmlPath, xml, 'utf8');
    const afterCount = (xml.match(/name="google_map_key"/g) || []).length;
    console.log(`  Removed ${beforeCount} static google_map_key declaration(s) from strings.xml`);
    console.log(`  Remaining references: ${afterCount}`);
  } else {
    console.log('  strings.xml is clean — no duplicate google_map_key found');
  }
} else {
  console.log(`  strings.xml not found at: ${stringsXmlPath} — skipping`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Verify SDK installation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[5/5] Verifying Android SDK...');
const checks = {
  'platforms/android-34':  path.join(ANDROID_SDK, 'platforms', 'android-34'),
  'build-tools/34.0.0':    path.join(ANDROID_SDK, 'build-tools', '34.0.0'),
  'platform-tools':        path.join(ANDROID_SDK, 'platform-tools'),
  'cmdline-tools/latest':  path.join(ANDROID_SDK, 'cmdline-tools', 'latest'),
};
let allOk = true;
for (const [label, p] of Object.entries(checks)) {
  const ok = fs.existsSync(p);
  console.log(`  [${ok ? '✓' : '✗'}] ${label}`);
  if (!ok) allOk = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║    OpusAIMobility Build Environment Summary          ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  Java JDK 17     : ${JAVA_HOME.slice(-30).padStart(30)} ║`);
console.log(`║  Android SDK     : ${ANDROID_SDK.padStart(30)} ║`);
console.log(`║  SDK packages    : ${allOk ? 'ALL OK ✓'.padStart(30) : 'INCOMPLETE ✗'.padStart(30)} ║`);
console.log(`║  Keystore        : opusaimobility/${keystoreData.keyAlias.padEnd(19)} ║`);
console.log(`║  AWS Account     : ${'683541453923'.padStart(30)} ║`);
console.log(`║  Cognito Pool    : ${'us-east-1_LKa4ElQem'.padStart(30)} ║`);
console.log(`║  API Gateway     : ${'pg4ulam66a (prod)'.padStart(30)} ║`);
console.log(`║  WebSocket       : ${'z4sof7ojdf (prod)'.padStart(30)} ║`);
console.log(`║  S3 Bucket       : ${'opusaimobility-assets-prod'.padStart(30)} ║`);
console.log('╚══════════════════════════════════════════════════════╝');
console.log('\n✅ Build environment ready. Run build-apps.cjs to compile.');
