const AdmZip = require('D:/omnisonietest/opusaimobility/aws/lambda/api/node_modules/adm-zip');
const fs = require('fs'), path = require('path');

const srcDir = 'D:/omnisonietest/opusaimobility/Admin panel/restaurant';
const outZip = 'D:/omnisonietest/opusaimobility/aws/setup/opusaimobility-admin.zip';

const zip = new AdmZip();
const skipDirs = ['.DS_Store'];

let fileCount = 0;

function addDir(dir, zipPath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (skipDirs.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    const zp   = zipPath ? zipPath + '/' + e.name : e.name;
    if (e.isDirectory()) {
      addDir(full, zp);
    } else {
      zip.addFile(zp, fs.readFileSync(full));
      fileCount++;
    }
  }
}

addDir(srcDir, '');
zip.writeZip(outZip);

const size = Math.round(fs.statSync(outZip).size / 1024);
console.log('Admin panel ZIP built:');
console.log('  Files packed : ' + fileCount);
console.log('  Size         : ' + size + ' KB');
console.log('  Output       : ' + outZip);
