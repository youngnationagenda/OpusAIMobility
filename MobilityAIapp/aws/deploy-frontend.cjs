#!/usr/bin/env node
/**
 * OpusAIMobility — Frontend Auto-Deploy Script
 * ─────────────────────────────────────────────
 * Does 3 things in one command:
 *   1. npm run build  (fresh Vite production build)
 *   2. aws s3 sync    (upload to opusaimobility-assets-prod)
 *   3. CloudFront invalidation (clears edge cache instantly)
 *
 * Architecture:
 *   opusaimobility.yna.co.ke  →  CF dist E18GJ5VKHBIJAI
 *     Default behaviour  →  S3: opusaimobility-assets-prod  (frontend)
 *     /auth/*  /users/*  /rides/*  /orders/*  /payments/*
 *     /ai/*  /notifications/*  /platform/*  /errands/*
 *                            →  APIGW: 0wv2nyk3je/prod    (Lambda)
 *
 * Usage:
 *   node aws/deploy-frontend.cjs
 *
 * Optional — pass a Gemini key to update it in Secrets Manager too:
 *   node aws/deploy-frontend.cjs --gemini-key AIza...
 */

const { execSync } = require('child_process');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const DIST_DIR    = path.resolve(__dirname, '..', 'dist');
const BUCKET      = 'opusaimobility-assets-prod';
const CF_DIST_ID  = 'E18GJ5VKHBIJAI';   // opusaimobility.yna.co.ke (frontend + API)
const SECRET_NAME = 'opusaimobility/gemini-api-key';
const REGION      = 'us-east-1';
const DOMAIN      = 'https://opusaimobility.yna.co.ke';

// ── Helpers ───────────────────────────────────────────────────────────────────
function run(cmd, label) {
  const tag = label || cmd.slice(0, 70);
  console.log(`\n▶  ${tag}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (out.trim()) console.log(`   ${out.trim().split('\n').join('\n   ')}`);
    return out.trim();
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').trim();
    console.error(`   ✗ FAILED: ${msg.slice(0, 400)}`);
    process.exit(1);
  }
}

// ── Parse args ────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const geminiIdx = args.indexOf('--gemini-key');
const geminiKey = geminiIdx !== -1 ? args[geminiIdx + 1] : null;

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║     OpusAIMobility — Frontend Deploy Pipeline        ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  Bucket  : ${BUCKET}`);
console.log(`║  CF Dist : ${CF_DIST_ID}  (opusaimobility.yna.co.ke)`);
console.log(`║  Domain  : ${DOMAIN}`);
console.log('╚══════════════════════════════════════════════════════╝');

// ── STEP 1 — Build ────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' STEP 1 — Building app (npm run build)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
run(`cd "${path.resolve(__dirname, '..')}" && npm run build`, 'vite build');

// ── STEP 2 — Sync assets (long cache, content-hashed filenames) ───────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' STEP 2 — Syncing to S3');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

run(
  `aws s3 sync "${DIST_DIR}/assets" s3://${BUCKET}/assets/` +
  ` --delete` +
  ` --cache-control "public, max-age=31536000, immutable"` +
  ` --region ${REGION}`,
  'S3 sync: assets/ (1-year immutable cache)'
);

run(
  `aws s3 cp "${DIST_DIR}/index.html" s3://${BUCKET}/index.html` +
  ` --cache-control "no-cache, no-store, must-revalidate"` +
  ` --content-type "text/html"` +
  ` --region ${REGION}`,
  'S3 upload: index.html (no-cache)'
);

run(
  `aws s3 sync "${DIST_DIR}" s3://${BUCKET}/` +
  ` --exclude "assets/*"` +
  ` --exclude "index.html"` +
  ` --cache-control "public, max-age=86400"` +
  ` --region ${REGION}`,
  'S3 sync: root files (1-day cache)'
);

// ── STEP 3 — CloudFront Invalidation ─────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' STEP 3 — Invalidating CloudFront cache');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const invResult = JSON.parse(
  run(
    `aws cloudfront create-invalidation` +
    ` --distribution-id ${CF_DIST_ID}` +
    ` --paths "/*"` +
    ` --region ${REGION} --output json`,
    'CloudFront invalidation: /*'
  )
);
const invId     = invResult?.Invalidation?.Id;
const invStatus = invResult?.Invalidation?.Status;
console.log(`   ✔ Invalidation ID: ${invId}  (${invStatus})`);

// ── STEP 4 (optional) — Update Gemini key in Secrets Manager ─────────────────
if (geminiKey) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' STEP 4 — Updating Gemini API key in Secrets Manager');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  run(
    `aws secretsmanager put-secret-value` +
    ` --secret-id ${SECRET_NAME}` +
    ` --secret-string "${geminiKey}"` +
    ` --region ${REGION} --output json`,
    'Secrets Manager: update gemini key'
  );
  console.log('   ✔ Gemini API key updated in Secrets Manager');
}

// ── Done ──────────────────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║              Deploy Complete! ✅                     ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  🌐  ${DOMAIN}`);
console.log(`║  ☁️   CF: ${CF_DIST_ID}  (cache cleared)`);
console.log(`║  🪣  S3: ${BUCKET}`);
if (geminiKey) console.log(`║  🔑  Gemini key: updated in Secrets Manager`);
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');
console.log('  Note: CloudFront propagation takes ~30–60 seconds.');
console.log(`  Visit: ${DOMAIN}`);
console.log('');
