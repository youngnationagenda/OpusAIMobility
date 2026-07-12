#!/usr/bin/env node
/**
 * OpusAIMobility — Frontend Auto-Deploy Script
 * ─────────────────────────────────────────────
 * Steps (always):
 *   1. npm run build          — fresh Vite production build
 *   2. server:check           — assert dist/index.html exists & is valid HTML
 *   3. aws s3 sync            — upload to opusaimobility-assets-prod
 *   4. CloudFront invalidation — clears edge cache instantly
 *
 * Optional flags:
 *   --restart-server          — force-deploy new ECS task (or redeploy Lambda
 *                               serving the app) after S3 sync so the Node proxy
 *                               picks up the new dist/ immediately
 *   --gemini-key AIza...      — update Gemini key in Secrets Manager
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
 *   node aws/deploy-frontend.cjs --restart-server
 *   node aws/deploy-frontend.cjs --restart-server --gemini-key AIza...
 */

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────
const ROOT_DIR    = path.resolve(__dirname, '..');
const DIST_DIR    = path.join(ROOT_DIR, 'dist');
const BUCKET      = 'opusaimobility-assets-prod';
const CF_DIST_ID  = 'E18GJ5VKHBIJAI';   // opusaimobility.yna.co.ke (frontend + API)
const SECRET_NAME = 'opusaimobility/gemini-api-key';
const REGION      = 'us-east-1';
const DOMAIN      = 'https://opusaimobility.yna.co.ke';

// ECS config — used only when --restart-server is passed
const ECS_CLUSTER = 'opusaimobility';
const ECS_SERVICE = 'opusaimobility-server';   // service name (created when server is deployed to ECS)

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

function ok(msg)   { console.log(`   ✔  ${msg}`); }
function fail(msg) { console.error(`   ✗  ${msg}`); process.exit(1); }
function info(msg) { console.log(`   ℹ  ${msg}`); }

// ── Parse args ────────────────────────────────────────────────────────────────
const args           = process.argv.slice(2);
const restartServer  = args.includes('--restart-server');
const geminiIdx      = args.indexOf('--gemini-key');
const geminiKey      = geminiIdx !== -1 ? args[geminiIdx + 1] : null;

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║     OpusAIMobility — Frontend Deploy Pipeline        ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  Bucket  : ${BUCKET}`);
console.log(`║  CF Dist : ${CF_DIST_ID}  (opusaimobility.yna.co.ke)`);
console.log(`║  Domain  : ${DOMAIN}`);
if (restartServer) console.log(`║  ECS     : ${ECS_CLUSTER} / ${ECS_SERVICE}  ← will restart`);
console.log('╚══════════════════════════════════════════════════════╝');

// ── STEP 1 — Build ────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' STEP 1 — Building app (npm run build)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
run(`cd "${ROOT_DIR}" && npm run build`, 'vite build');

// ── STEP 2 — Server pre-flight check ─────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' STEP 2 — Server pre-flight check (dist/ integrity)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
run(`node "${path.join(ROOT_DIR, 'scripts', 'ci', 'server-check.cjs')}"`, 'server:check — dist integrity gate');

// ── STEP 3 — Sync assets ──────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' STEP 3 — Syncing to S3');
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

// ── STEP 4 — CloudFront Invalidation ─────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' STEP 4 — Invalidating CloudFront cache');
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
ok(`Invalidation ID: ${invId}  (${invStatus})`);

// ── STEP 5 (optional) — Restart ECS server task ───────────────────────────────
if (restartServer) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' STEP 5 — Restarting ECS server task');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check whether the ECS service actually exists before attempting restart
  let serviceExists = false;
  try {
    const describeOut = execSync(
      `aws ecs describe-services` +
      ` --cluster ${ECS_CLUSTER}` +
      ` --services ${ECS_SERVICE}` +
      ` --region ${REGION}` +
      ` --output json`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const describeJson = JSON.parse(describeOut);
    const svc = describeJson?.services?.[0];
    serviceExists = svc && svc.status === 'ACTIVE';
  } catch (_) {
    serviceExists = false;
  }

  if (!serviceExists) {
    info(`ECS service "${ECS_SERVICE}" not found or inactive on cluster "${ECS_CLUSTER}".`);
    info('Skipping ECS restart — server is running as a standalone process.');
    info('To deploy the server to ECS, run: aws ecs create-service ... (see infra/ecs/task-def.json)');
  } else {
    // Force a new deployment — ECS will pull the latest task definition and start
    // a fresh container, which will mount the new dist/ from S3 via the app bundle
    run(
      `aws ecs update-service` +
      ` --cluster ${ECS_CLUSTER}` +
      ` --service ${ECS_SERVICE}` +
      ` --force-new-deployment` +
      ` --region ${REGION}` +
      ` --output json`,
      `ECS force-new-deployment: ${ECS_CLUSTER}/${ECS_SERVICE}`
    );
    ok(`ECS service "${ECS_SERVICE}" redeployment initiated.`);
    info('New task will be running within ~60 seconds (Fargate cold start).');
  }
}

// ── STEP 6 (optional) — Update Gemini key in Secrets Manager ─────────────────
if (geminiKey) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' STEP 6 — Updating Gemini API key in Secrets Manager');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  run(
    `aws secretsmanager put-secret-value` +
    ` --secret-id ${SECRET_NAME}` +
    ` --secret-string "${geminiKey}"` +
    ` --region ${REGION} --output json`,
    'Secrets Manager: update gemini key'
  );
  ok('Gemini API key updated in Secrets Manager');
}

// ── Done ──────────────────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║              Deploy Complete! ✅                     ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  🌐  ${DOMAIN}`);
console.log(`║  ☁️   CF: ${CF_DIST_ID}  (cache cleared)`);
console.log(`║  🪣  S3: ${BUCKET}`);
if (restartServer) console.log(`║  🔄  ECS: restart triggered for ${ECS_SERVICE}`);
if (geminiKey)     console.log(`║  🔑  Gemini key: updated in Secrets Manager`);
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');
console.log('  Note: CloudFront propagation takes ~30–60 seconds.');
console.log(`  Visit: ${DOMAIN}`);
console.log('');
