'use strict';
const fs   = require('fs');
const path = require('path');

const SRC  = 'D:/omnisonietest/Go Grab Customer 6 December 2022';
const DST  = path.resolve(__dirname, '..');   // MobilityAIapp/legacy
const ROOT = path.resolve(DST, '..');

let copied = 0, skipped = 0, failed = 0;

function ensureDir(p) {
  // Create intermediate directories using recursive split
  const parts = p.replace(/\\/g, '/').split('/');
  let current = parts[0];
  for (let i = 1; i < parts.length; i++) {
    current += '/' + parts[i];
    if (!fs.existsSync(current)) {
      try { fs.mkdirSync(current); } catch (e) { /* already exists race */ }
    }
  }
}

function copyFile(src, dst) {
  try {
    ensureDir(path.dirname(dst));
    if (!fs.existsSync(src)) { skipped++; return; }
    fs.copyFileSync(src, dst);
    copied++;
  } catch (e) {
    failed++;
    process.stdout.write('FAIL: ' + dst + ' — ' + e.message + '\n');
  }
}

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  ensureDir(dst);
  const items = fs.readdirSync(src, { withFileTypes: true });
  for (const item of items) {
    if (item.name === '.DS_Store') continue;
    const s = path.join(src, item.name);
    const d = path.join(dst, item.name);
    if (item.isDirectory()) {
      copyDir(s, d);
    } else {
      copyFile(s, d);
    }
  }
}

// ── Copy Admin Panel ──────────────────────────────────────────────────────────
copyDir(SRC + '/Admin panel/restaurant', DST + '/admin-panel/restaurant');
copyDir(SRC + '/Admin panel/portal/assets/css', DST + '/admin-panel/portal/assets/css');
copyDir(SRC + '/Admin panel/portal/assets/js',  DST + '/admin-panel/portal/assets/js');
copyDir(SRC + '/Admin panel/portal/assets/img', DST + '/admin-panel/portal/assets/img');
process.stdout.write('admin-panel: copied=' + copied + '\n');

const c1 = copied; copied = 0;

// ── Copy PHP API (skip large vendor dirs) ────────────────────────────────────
const phpSrc = SRC + '/PHP API/mobileapp_api/app';
const phpDst = DST + '/php-api/mobileapp_api/app';
copyDir(phpSrc + '/Controller', phpDst + '/Controller');
copyDir(phpSrc + '/Model',      phpDst + '/Model');
copyDir(phpSrc + '/Config',     phpDst + '/Config');
copyDir(phpSrc + '/Lib',        phpDst + '/Lib');
copyDir(phpSrc + '/View',       phpDst + '/View');
process.stdout.write('php-api: copied=' + copied + '\n');

const c2 = copied; copied = 0;

// ── Copy SQL ──────────────────────────────────────────────────────────────────
copyFile(SRC + '/PHP API/Database/gograb.sql', DST + '/database/gograb.sql');
process.stdout.write('sql: copied=' + copied + '\n');

process.stdout.write('\nTOTAL: ' + (c1 + c2 + copied) + ' files  failed=' + failed + '\n');
