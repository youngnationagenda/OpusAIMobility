/**
 * Accepts Android SDK licenses by writing license hash files directly.
 * This is the standard CI approach used by GitHub Actions, CodeBuild, etc.
 */
const fs = require('fs');
const path = require('path');

const ANDROID_SDK_ROOT = 'C:\\Users\\user\\android-sdk';
const licensesDir = path.join(ANDROID_SDK_ROOT, 'licenses');

// Standard Android SDK license hashes (SHA-1 of accepted license text)
const licenses = {
  'android-sdk-license': [
    '24333f8a63b6825ea9c5514f83c2829b004d1fee',
    '8933bad161af4178b1185d1a37fbf41ea5269c55',
    'd56f5187479451eabf01fb78af6dfcb131a6481e'
  ],
  'android-sdk-preview-license': [
    '84831b9409646a918e30573bab4c9c91346d8abd'
  ],
  'android-googletv-license': [
    '601085b94cd77f0b54ff86406957099ebe79c4d6'
  ],
  'android-sdk-arm-dbt-license': [
    '859f317696f67ef3d7f30a50a5560e7834b43903'
  ],
  'google-gdk-license': [
    '33b6a2b64607f11b759f320ef9dff4ae5c47d97a'
  ],
  'intel-android-extra-license': [
    'd975f751698a77b662f1254ddbeed3901e976f5a'
  ],
  'mips-android-sysimage-license': [
    'e9acab5b5fbb560a72cfaecce8946896ff6aab9d'
  ]
};

console.log('=== Accepting Android SDK Licenses ===');
fs.mkdirSync(licensesDir, { recursive: true });

for (const [name, hashes] of Object.entries(licenses)) {
  const filePath = path.join(licensesDir, name);
  const content = '\n' + hashes.join('\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Wrote: ${name}`);
}

console.log(`\n  Licenses directory: ${licensesDir}`);
console.log('  Files created:', fs.readdirSync(licensesDir).join(', '));
console.log('\n=== All licenses accepted ===');
