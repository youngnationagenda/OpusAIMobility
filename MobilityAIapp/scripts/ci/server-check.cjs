#!/usr/bin/env node
/**
 * scripts/ci/server-check.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Pre-start / pre-deploy integrity gate for the OpusAIMobility Express server.
 *
 * Checks performed (in order):
 *   1. dist/index.html exists
 *   2. dist/index.html is valid HTML (contains <!DOCTYPE html> and <div id="root">)
 *   3. dist/assets/ directory exists and contains at least one JS chunk
 *   4. server/server.js staticPath resolves to dist/ (not server/dist/)
 *   5. Boots the server on a throwaway port, fires an HTTP GET /, asserts HTTP 200
 *      and that the response body contains the app shell
 *
 * Exit 0 = all checks pass (deploy / start may proceed)
 * Exit 1 = one or more checks failed (deploy / start is BLOCKED)
 *
 * Usage:
 *   node scripts/ci/server-check.cjs          # standalone
 *   npm run server:check                       # via package.json
 *   node aws/deploy-frontend.cjs              # called automatically inside deploy
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const http    = require('http');
const { spawn } = require('child_process');

const ROOT       = path.resolve(__dirname, '..', '..');
const DIST_DIR   = path.join(ROOT, 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const SERVER_JS  = path.join(ROOT, 'server', 'server.js');
const PROBE_PORT = 13579;  // throwaway port — very unlikely to be in use

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  ✔  ${msg}`);
  passed++;
}

function fail(msg, hint) {
  console.error(`  ✗  ${msg}`);
  if (hint) console.error(`     → ${hint}`);
  failed++;
}

function section(title) {
  console.log(`\n  ── ${title}`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('  OpusAIMobility — Server Pre-flight Check');
console.log('  ─────────────────────────────────────────');

// ── Check 1: dist/index.html exists ──────────────────────────────────────────
section('Check 1: dist/index.html exists');
if (fs.existsSync(INDEX_HTML)) {
  pass(`dist/index.html found (${fs.statSync(INDEX_HTML).size} bytes)`);
} else {
  fail(
    'dist/index.html is MISSING',
    'Run `npm run build` before starting the server or deploying.'
  );
}

// ── Check 2: index.html is valid app shell ────────────────────────────────────
section('Check 2: index.html content validation');
if (fs.existsSync(INDEX_HTML)) {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');

  if (html.includes('<!DOCTYPE html') || html.includes('<!doctype html')) {
    pass('index.html contains <!DOCTYPE html>');
  } else {
    fail('index.html missing <!DOCTYPE html> declaration', 'File may be corrupted or empty.');
  }

  if (html.includes('<div id="root">') || html.includes("<div id='root'>")) {
    pass('index.html contains React mount point (<div id="root">)');
  } else {
    fail('index.html missing React mount point', 'Expected <div id="root"> — file may be from wrong build.');
  }

  if (html.includes('OpusAIMobility') || html.includes('opusaimobility')) {
    pass('index.html references OpusAIMobility project');
  } else {
    fail('index.html does not reference OpusAIMobility', 'Possible wrong project build uploaded.');
  }
} else {
  fail('Skipping content checks — index.html not found');
}

// ── Check 3: dist/assets/ has JS chunks ──────────────────────────────────────
section('Check 3: dist/assets/ JS chunks present');
if (fs.existsSync(ASSETS_DIR)) {
  const jsFiles = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.js'));
  if (jsFiles.length >= 5) {
    pass(`dist/assets/ contains ${jsFiles.length} JS chunks`);
  } else if (jsFiles.length > 0) {
    fail(
      `dist/assets/ only has ${jsFiles.length} JS file(s) — expected ≥ 5`,
      'Run `npm run build` to regenerate a full production bundle.'
    );
  } else {
    fail(
      'dist/assets/ contains no JS files',
      'Run `npm run build` to produce the production bundle.'
    );
  }
} else {
  fail(
    'dist/assets/ directory is MISSING',
    'Run `npm run build` — the assets folder is created by Vite.'
  );
}

// ── Check 4: server.js staticPath correctness ────────────────────────────────
section('Check 4: server/server.js staticPath points to project root dist/');
if (fs.existsSync(SERVER_JS)) {
  const serverSrc = fs.readFileSync(SERVER_JS, 'utf8');
  // Correct pattern: path.join(__dirname,'..','dist')  or  path.join(__dirname, '..', 'dist')
  const correctPattern = /path\.join\(__dirname\s*,\s*['"]\.\.['"]\s*,\s*['"]dist['"]\)/;
  // Wrong pattern: path.join(__dirname,'dist')  — resolves to server/dist
  const wrongPattern   = /path\.join\(__dirname\s*,\s*['"]dist['"]\)/;

  if (correctPattern.test(serverSrc)) {
    pass("staticPath = path.join(__dirname, '..', 'dist')  ✓  points to project root dist/");
  } else if (wrongPattern.test(serverSrc)) {
    fail(
      "staticPath = path.join(__dirname, 'dist')  ✗  resolves to server/dist (WRONG)",
      "Fix: change to path.join(__dirname, '..', 'dist') in server/server.js"
    );
  } else {
    fail(
      'Could not determine staticPath value in server/server.js',
      'Ensure staticPath is set to path.join(__dirname, \'..\', \'dist\')'
    );
  }
} else {
  fail('server/server.js not found', 'Expected at server/server.js');
}

// ── Check 5: Live HTTP boot test ──────────────────────────────────────────────
section('Check 5: Server boot test (HTTP GET / → 200 + app shell)');

// Only run if previous checks passed well enough that a boot makes sense
const canBoot = fs.existsSync(INDEX_HTML) && fs.existsSync(SERVER_JS);

if (!canBoot) {
  fail('Skipping boot test — prerequisite files missing', 'Fix checks 1–4 first.');
  printSummary();
} else {
  // Boot the server on the throwaway port
  const serverProc = spawn(
    process.execPath,
    [SERVER_JS],
    {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PROBE_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let bootLog = '';
  serverProc.stdout.on('data', d => { bootLog += d.toString(); });
  serverProc.stderr.on('data', d => { bootLog += d.toString(); });

  // Give the server up to 4 seconds to start
  const bootTimeout = setTimeout(() => {
    fail(
      `Server did not boot within 4 s on port ${PROBE_PORT}`,
      `Boot log:\n${bootLog.trim() || '(empty)'}`
    );
    serverProc.kill('SIGTERM');
    printSummary();
  }, 4000);

  // Poll for the listening message then probe
  const pollInterval = setInterval(() => {
    if (!bootLog.includes('listening on port')) return;
    clearInterval(pollInterval);
    clearTimeout(bootTimeout);

    // Server is up — probe it
    const req = http.get(`http://127.0.0.1:${PROBE_PORT}/`, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        serverProc.kill('SIGTERM');

        // Assert status code
        if (res.statusCode === 200) {
          pass(`HTTP GET / → ${res.statusCode} ${http.STATUS_CODES[res.statusCode]}`);
        } else {
          fail(
            `HTTP GET / returned ${res.statusCode} (expected 200)`,
            `Response body (first 200 chars): ${body.slice(0, 200)}`
          );
        }

        // Assert response contains the app shell
        const bodyLc = body.toLowerCase();
        if (bodyLc.includes('<html') && bodyLc.includes('opusaimobility')) {
          pass('Response body contains OpusAIMobility app shell HTML');
        } else if (bodyLc.includes('<html')) {
          fail(
            'Response is HTML but does not reference OpusAIMobility',
            `Body snippet: ${body.slice(0, 200)}`
          );
        } else {
          fail(
            'Response body does not appear to be HTML',
            `Content-Type: ${res.headers['content-type']}  |  Body: ${body.slice(0, 200)}`
          );
        }

        // Assert Content-Type
        const ct = res.headers['content-type'] || '';
        if (ct.includes('text/html')) {
          pass(`Content-Type: ${ct}`);
        } else {
          fail(`Content-Type is "${ct}" — expected text/html`);
        }

        printSummary();
      });
    });

    req.on('error', err => {
      serverProc.kill('SIGTERM');
      clearInterval(pollInterval);
      clearTimeout(bootTimeout);
      fail(`HTTP probe failed: ${err.message}`);
      printSummary();
    });

    req.setTimeout(3000, () => {
      req.destroy();
      serverProc.kill('SIGTERM');
      fail('HTTP probe timed out after 3 s');
      printSummary();
    });
  }, 100);
}

// ─────────────────────────────────────────────────────────────────────────────
function printSummary() {
  const total = passed + failed;
  console.log('');
  console.log('  ─────────────────────────────────────');
  if (failed === 0) {
    console.log(`  ✅  All ${total} checks passed — server is ready.`);
    console.log('');
    process.exit(0);
  } else {
    console.log(`  ❌  ${failed} of ${total} checks FAILED — deploy/start blocked.`);
    console.log('');
    process.exit(1);
  }
}
