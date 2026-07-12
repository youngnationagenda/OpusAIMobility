/**
 * scripts/ci/check-static-path.cjs
 * ─────────────────────────────────
 * Quick CI check: confirms server/server.js staticPath resolves to
 * project-root dist/ (path.join(__dirname,'..','dist')) and NOT to
 * server/dist (path.join(__dirname,'dist')).
 *
 * Called from buildspec-frontend.yml pre_build phase.
 * Exit 0 = pass, exit 1 = fail (blocks build).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', '..', 'server', 'server.js');

if (!fs.existsSync(serverFile)) {
  console.error('FAIL: server/server.js not found at', serverFile);
  process.exit(1);
}

const src = fs.readFileSync(serverFile, 'utf8');

// Correct: path.join(__dirname, '..', 'dist')
const correct = /path\.join\(\s*__dirname\s*,\s*['"]\.\.['"]\s*,\s*['"]dist['"]\s*\)/.test(src);

// Wrong: path.join(__dirname, 'dist')  -- resolves to server/dist
const wrong   = /path\.join\(\s*__dirname\s*,\s*['"]dist['"]\s*\)/.test(src);

if (wrong && !correct) {
  console.error('FAIL: server.js staticPath = server/dist (WRONG)');
  console.error('      Expected: path.join(__dirname, "..", "dist")');
  process.exit(1);
}

if (!correct) {
  console.error('FAIL: Cannot confirm staticPath points to project root dist/');
  process.exit(1);
}

console.log('PASS: server.js staticPath correctly set to ../dist');
process.exit(0);
