const fs   = require('fs');
const path = require('path');
const ADMZip = require(path.join(__dirname, 'node_modules', 'adm-zip'));

const srcDir  = path.join(__dirname, 'user-migration');
const zipDest = path.join(__dirname, 'user-migration.zip');

if (fs.existsSync(zipDest)) { try { fs.unlinkSync(zipDest); } catch(e) {} }

const zip = new ADMZip();

function addDir(dir, zipPath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith('.ts') || entry.name === 'tsconfig.json') continue; // skip TS source
    const fullPath = path.join(dir, entry.name);
    const zp = zipPath ? zipPath + '/' + entry.name : entry.name;
    if (entry.isDirectory()) { addDir(fullPath, zp); }
    else { zip.addFile(zp, fs.readFileSync(fullPath)); }
  }
}

addDir(srcDir, '');
zip.writeZip(zipDest);
const stat = fs.statSync(zipDest);
console.log(`✅ user-migration.zip — ${(stat.size/1024).toFixed(0)} KB`);
