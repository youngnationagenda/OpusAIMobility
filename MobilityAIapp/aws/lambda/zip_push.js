/**
 * Build push-notification-v2.zip using Node's built-in JSZip approach.
 */
const fs   = require('fs');
const path = require('path');

const srcDir  = path.resolve(__dirname, 'push-notification');
const zipDest = path.resolve(__dirname, 'push-notification-v2.zip');

// Use ADM-Zip if available, otherwise fall back to manual approach
let ADMZip;
try {
  ADMZip = require(path.join(__dirname, 'node_modules', 'adm-zip'));
} catch(e) {}

if (ADMZip) {
  if (fs.existsSync(zipDest)) { try { fs.unlinkSync(zipDest); } catch(e) {} }
  const zip = new ADMZip();
  
  function addDir(dir, zipPath) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const zp = zipPath ? zipPath + '/' + entry.name : entry.name;
      if (entry.isDirectory()) {
        addDir(fullPath, zp);
      } else {
        zip.addFile(zp, fs.readFileSync(fullPath));
      }
    }
  }
  
  addDir(srcDir, '');
  zip.writeZip(zipDest);
  const stat = fs.statSync(zipDest);
  console.log(`✅ push-notification-v2.zip — ${(stat.size/1024).toFixed(1)} KB`);
} else {
  console.error('ADM-Zip not found. Run: npm install adm-zip --prefix ./');
  process.exit(1);
}
