const AdmZip = require('./node_modules/adm-zip');
const fs = require('fs'), path = require('path');
const SRC  = 'aws/lambda/api';
const OUT  = 'aws/lambda/terraaimobility-api.zip';
const SKIP = new Set(['_patchkey.js','_zip.js','.DS_Store']);
const zip  = new AdmZip();

function add(dir, zp) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    if (SKIP.has(e.name)) return;
    const full  = path.join(dir, e.name);
    const zpath = zp ? zp + '/' + e.name : e.name;
    if (e.isDirectory()) add(full, zpath);
    else { zip.addFile(zpath, fs.readFileSync(full)); }
  });
}

add(SRC, '');
zip.writeZip(OUT);
process.stdout.write('✅ ZIP: ' + OUT + ' (' + Math.round(fs.statSync(OUT).size / 1024) + ' KB)\n');
