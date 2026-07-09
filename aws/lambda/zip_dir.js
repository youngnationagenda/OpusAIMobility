// Generic zip utility for Lambda deployment
const fs   = require('fs');
const path = require('path');
const JSZip = require('jszip');

const srcDir = process.argv[2];
const outZip = process.argv[3];

if (!srcDir || !outZip) {
  console.error('Usage: node zip_dir.js <srcDir> <outZip>');
  process.exit(1);
}

const zip = new JSZip();

function addDir(base, rel) {
  const entries = fs.readdirSync(path.join(base, rel), { withFileTypes: true });
  for (const e of entries) {
    const relPath = rel ? `${rel}/${e.name}` : e.name;
    const full    = path.join(base, relPath);
    if (e.isDirectory()) {
      addDir(base, relPath);
    } else {
      zip.file(relPath.replace(/\\/g, '/'), fs.readFileSync(full));
    }
  }
}

addDir(srcDir, '');

zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true, compression: 'DEFLATE' })
  .pipe(fs.createWriteStream(outZip))
  .on('finish', () => console.log('ZIP_OK:', outZip, `(${(fs.statSync(outZip).size/1024).toFixed(0)}KB)`))
  .on('error', e => { console.error('ZIP_ERR:', e); process.exit(1); });
