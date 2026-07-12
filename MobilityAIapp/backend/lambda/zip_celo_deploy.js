const fs   = require('fs');
const path = require('path');
const ADMZip = require(path.join(__dirname, 'node_modules', 'adm-zip'));

const srcDir  = path.resolve('D:/omnisonietest/OpusAIMobility/aws/lambda/celo-deploy');
const zipDest = path.resolve('D:/omnisonietest/OpusAIMobility/aws/lambda/celo-deploy.zip');

if (fs.existsSync(zipDest)) { try { fs.unlinkSync(zipDest); } catch(e) {} }
const zip = new ADMZip();

function addDir(dir, zipPath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith('.zip')) continue;
    const fp = path.join(dir, entry.name);
    const zp = zipPath ? zipPath + '/' + entry.name : entry.name;
    if (entry.isDirectory()) addDir(fp, zp);
    else zip.addFile(zp, fs.readFileSync(fp));
  }
}

addDir(srcDir, '');
zip.writeZip(zipDest);
const stat = fs.statSync(zipDest);
console.log(`✅ celo-deploy.zip — ${(stat.size/1024/1024).toFixed(1)} MB`);
