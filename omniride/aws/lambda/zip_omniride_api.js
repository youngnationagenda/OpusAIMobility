/**
 * Build omniride-api.zip from index.js + node_modules
 */
const fs   = require('fs');
const path = require('path');
const ADMZip = require(path.join(__dirname, 'node_modules', 'adm-zip'));

const srcDir  = __dirname;
const zipDest = path.join(__dirname, 'omniride-api.zip');

if (fs.existsSync(zipDest)) { try { fs.unlinkSync(zipDest); } catch(e) {} }

const zip = new ADMZip();

function addDir(dir, zipPath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    // Skip the zip files themselves, test files, and dev artifacts
    if (entry.name.endsWith('.zip') || entry.name === 'zip_omniride_api.js'
        || entry.name === 'zip_push.js' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    const zp = zipPath ? zipPath + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      addDir(fullPath, zp);
    } else {
      zip.addFile(zp, fs.readFileSync(fullPath));
    }
  }
}

// Add index.js and node_modules
addDir(srcDir, '');
zip.writeZip(zipDest);
const stat = fs.statSync(zipDest);
console.log(`✅ omniride-api.zip — ${(stat.size/1024/1024).toFixed(1)} MB`);
