/**
 * OpusAIMobility — Android SDK Setup Script
 * Downloads Android cmdline-tools, SDK platform-34, build-tools 34.0.0
 * and configures local.properties for both Customer and Driver apps.
 */
const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { execSync, spawnSync } = require('child_process');
const { createWriteStream, mkdirSync, existsSync } = require('fs');

const JAVA_HOME = 'C:\\Users\\user\\AppData\\Local\\jdk17\\PFiles64\\Eclipse Adoptium\\jdk-17.0.19.10-hotspot';
const ANDROID_SDK_ROOT = 'C:\\Users\\user\\android-sdk';
const CLT_URL = 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip';
const CLT_ZIP = 'C:\\Temp\\clt.zip';

function downloadFile(url, dest, label) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);
    let downloaded = 0;
    let total = 0;
    let lastLog = 0;

    function doGet(u) {
      proto.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          console.log(`  Redirecting -> ${res.headers.location}`);
          doGet(res.headers.location);
          return;
        }
        total = parseInt(res.headers['content-length'] || '0', 10);
        res.on('data', (chunk) => {
          downloaded += chunk.length;
          const now = Date.now();
          if (now - lastLog > 3000) {
            const pct = total ? Math.round(downloaded / total * 100) : '?';
            console.log(`  [${label}] ${pct}% (${(downloaded/1024/1024).toFixed(1)} MB)`);
            lastLog = now;
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`  [${label}] Download complete — ${(downloaded/1024/1024).toFixed(1)} MB`);
          resolve(dest);
        });
        res.on('error', reject);
      }).on('error', reject);
    }
    doGet(url);
  });
}

function unzip(zipPath, outDir) {
  console.log(`  Extracting ${zipPath} -> ${outDir}`);
  mkdirSync(outDir, { recursive: true });
  // Use PowerShell expand-archive
  const ps = 'C:\\Program Files\\PowerShell\\7-preview\\preview\\pwsh.exe';
  const ps2 = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
  const shell = existsSync(ps) ? ps : ps2;
  const result = spawnSync(shell, [
    '-Command',
    `Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force`
  ], { stdio: 'inherit', timeout: 300000 });
  if (result.status !== 0) throw new Error(`Unzip failed with code ${result.status}`);
  console.log('  Extraction complete');
}

function acceptLicenses() {
  const sdkmanager = path.join(ANDROID_SDK_ROOT, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat');
  console.log('  Accepting SDK licenses...');
  const env = { ...process.env, JAVA_HOME, ANDROID_SDK_ROOT, PATH: `${JAVA_HOME}\\bin;${process.env.PATH}` };
  const r = spawnSync(sdkmanager, ['--licenses'], {
    input: 'y\ny\ny\ny\ny\ny\ny\n',
    env,
    timeout: 120000,
    encoding: 'utf8'
  });
  console.log(r.stdout || '');
  if (r.stderr) console.log(r.stderr);
}

function installPackages(pkgs) {
  const sdkmanager = path.join(ANDROID_SDK_ROOT, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat');
  const env = { ...process.env, JAVA_HOME, ANDROID_SDK_ROOT, PATH: `${JAVA_HOME}\\bin;${process.env.PATH}` };
  for (const pkg of pkgs) {
    console.log(`  Installing: ${pkg}`);
    const r = spawnSync(sdkmanager, [pkg], { env, timeout: 300000, encoding: 'utf8', stdio: 'inherit' });
    if (r.status !== 0) {
      console.warn(`  WARNING: ${pkg} install returned ${r.status}`);
    }
  }
}

function updateLocalProperties(appDir, sdkPath) {
  const localProps = path.join(appDir, 'local.properties');
  const content = `sdk.dir=${sdkPath.replace(/\\/g, '\\\\')}\n`;
  fs.writeFileSync(localProps, content, 'utf8');
  console.log(`  Updated ${localProps}`);
}

async function main() {
  console.log('=== OpusAIMobility Android SDK Setup ===');
  console.log(`JAVA_HOME   : ${JAVA_HOME}`);
  console.log(`ANDROID_SDK : ${ANDROID_SDK_ROOT}`);

  const cltLatest = path.join(ANDROID_SDK_ROOT, 'cmdline-tools', 'latest');

  // Step 1 — Download cmdline-tools if not already installed
  if (!existsSync(path.join(cltLatest, 'bin', 'sdkmanager.bat'))) {
    console.log('\n[1/4] Downloading Android Command Line Tools...');
    await downloadFile(CLT_URL, CLT_ZIP, 'cmdline-tools');

    console.log('\n[1/4] Extracting...');
    const tmpOut = path.join(ANDROID_SDK_ROOT, '_clt_tmp');
    unzip(CLT_ZIP, tmpOut);

    // Move extracted cmdline-tools/latest into place
    const extracted = path.join(tmpOut, 'cmdline-tools');
    if (existsSync(cltLatest)) {
      fs.rmSync(cltLatest, { recursive: true });
    }
    mkdirSync(path.join(ANDROID_SDK_ROOT, 'cmdline-tools'), { recursive: true });
    fs.renameSync(extracted, cltLatest);
    fs.rmSync(tmpOut, { recursive: true, force: true });
    console.log('  cmdline-tools installed at:', cltLatest);
  } else {
    console.log('\n[1/4] cmdline-tools already installed — skipping download');
  }

  // Step 2 — Accept licenses
  console.log('\n[2/4] Accepting Android SDK licenses...');
  acceptLicenses();

  // Step 3 — Install platform + build-tools
  console.log('\n[3/4] Installing Android SDK packages (platform-34, build-tools 34.0.0, platform-tools)...');
  installPackages([
    'platforms;android-34',
    'build-tools;34.0.0',
    'platform-tools'
  ]);

  // Step 4 — Update local.properties for both apps
  console.log('\n[4/4] Configuring local.properties...');
  const base = 'D:\\omnisonietest\\OpusAIMobility\\MobilityAIapp\\android';
  updateLocalProperties(path.join(base, 'customer'), ANDROID_SDK_ROOT);
  updateLocalProperties(path.join(base, 'driver'),   ANDROID_SDK_ROOT);

  // Verify
  console.log('\n=== Verification ===');
  const platformsPath = path.join(ANDROID_SDK_ROOT, 'platforms', 'android-34');
  const buildToolsPath = path.join(ANDROID_SDK_ROOT, 'build-tools', '34.0.0');
  console.log(`  platforms/android-34  : ${existsSync(platformsPath) ? 'OK' : 'MISSING'}`);
  console.log(`  build-tools/34.0.0    : ${existsSync(buildToolsPath) ? 'OK' : 'MISSING'}`);
  console.log(`  cmdline-tools/latest  : ${existsSync(cltLatest) ? 'OK' : 'MISSING'}`);

  const customerProps = path.join(base, 'customer', 'local.properties');
  const driverProps   = path.join(base, 'driver', 'local.properties');
  console.log(`  customer/local.properties: ${fs.readFileSync(customerProps, 'utf8').trim()}`);
  console.log(`  driver/local.properties  : ${fs.readFileSync(driverProps, 'utf8').trim()}`);

  console.log('\n=== Android SDK Setup Complete ===');
}

main().catch((e) => { console.error('SETUP FAILED:', e); process.exit(1); });
