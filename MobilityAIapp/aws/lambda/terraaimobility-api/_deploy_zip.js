/**
 * Creates a clean deployment zip for terraaimobility-api
 * Includes: index.js, auth.js, db.js, notify.js, seed-config.js, package.json, node_modules
 * Excludes: _*.js test/debug files, devDependencies
 */
const AdmZip = require('adm-zip');
const path   = require('path');
const fs     = require('fs');

const SRC     = __dirname;
const OUT     = path.resolve(__dirname, '../../../../aws/lambda-api-deploy.zip');
const INCLUDE = ['index.js','auth.js','db.js','notify.js','seed-config.js','package.json','package-lock.json'];

console.log('📦 Building deploy zip for terraaimobility-api...');

const zip = new AdmZip();

// Add source files
for (const f of INCLUDE) {
  const fp = path.join(SRC, f);
  if (fs.existsSync(fp)) {
    zip.addLocalFile(fp);
    console.log('  + ' + f);
  } else {
    console.warn('  ⚠ Missing: ' + f);
  }
}

// Add node_modules
const nmPath = path.join(SRC, 'node_modules');
if (fs.existsSync(nmPath)) {
  zip.addLocalFolder(nmPath, 'node_modules');
  console.log('  + node_modules/');
} else {
  console.error('  ✗ node_modules not found — run npm install first');
  process.exit(1);
}

zip.writeZip(OUT);
const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
console.log('\n✅ Zip written to: ' + OUT);
console.log('   Size: ' + sizeMB + ' MB');
