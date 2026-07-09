const AdmZip = require('D:/omnisonietest/terraaimobility/aws/lambda/api/node_modules/adm-zip');
const fs = require('fs'), path = require('path');
const zip = new AdmZip();
const src = 'aws/admin-panel';
const skip = new Set(['.DS_Store','_gen.js','_complete.js','_pages.js','_core.js','_fix.js','_fix2.js','_build.js','_b.js','_test.js','_test.txt','_test2.py','_builder.py','_writer.js','build.js','test.txt','_gen.py','public','_zip.js']);

function addDir(dir, zp) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function(e) {
    if (skip.has(e.name)) return;
    const full = path.join(dir, e.name);
    const zpath = zp ? zp + '/' + e.name : e.name;
    if (e.isDirectory()) addDir(full, zpath);
    else {
      zip.addFile(zpath, fs.readFileSync(full));
      process.stdout.write('  + ' + zpath + ' (' + Math.round(fs.statSync(full).size / 1024) + 'KB)\n');
    }
  });
}

addDir(src, '');
zip.writeZip('aws/admin-panel.zip');
const size = Math.round(fs.statSync('aws/admin-panel.zip').size / 1024);
process.stdout.write('ZIP created: aws/admin-panel.zip (' + size + ' KB)\n');
