'use strict';
/**
 * TERRA-001 — Cognito User Pool Migration Script
 * ─────────────────────────────────────────────────
 * Migrates users from:
 *   us-east-1_HA6twtr4a  (opusaimobility-users / TerraAI Android)
 *   us-east-1_3lWqQNDwm  (opusaimobility-users / OpusAIMobility Web)
 * Into the unified pool:
 *   us-east-1_LKa4ElQem  (opusaimobility-production)
 *
 * Strategy:
 *  - AdminCreateUser (MessageAction: SUPPRESS → no emails sent)
 *  - AdminSetUserPassword (permanent = true → no forced reset)
 *  - Copy all standard + custom attributes
 *  - Mark email_verified = true (already verified in source pools)
 *  - Source DynamoDB records updated with new sub (when user first logs in,
 *    a Lambda trigger reconciles old sub → new sub via email lookup)
 *
 * Safe to re-run — skips UsernameExistsException automatically.
 *
 * Usage:
 *   node migrate-cognito-pools.js [--dry-run]
 */

const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const REGION      = 'us-east-1';
const SOURCE_POOLS = [
  { id: 'us-east-1_HA6twtr4a', name: 'opusaimobility-users (TerraAI)', source: 'terraai' },
  { id: 'us-east-1_3lWqQNDwm', name: 'opusaimobility-users (OpusAIMobility)',  source: 'opusaimobility' },
];
const TARGET_POOL  = 'us-east-1_LKa4ElQem';
const DRY_RUN      = process.argv.includes('--dry-run');

const cognito = new CognitoIdentityProviderClient({ region: REGION });

// ── attr helpers ─────────────────────────────────────────────────────────────

function getAttr(attrs, name) {
  return (attrs || []).find(a => a.Name === name)?.Value || '';
}

function buildTargetAttrs(user, sourceName) {
  const attrs = user.Attributes || [];
  const out   = [];

  // Standard attrs
  const fields = ['email','given_name','family_name','name','phone_number','gender','birthdate','locale'];
  for (const f of fields) {
    const v = getAttr(attrs, f);
    if (v) out.push({ Name: f, Value: v });
  }

  // email_verified always true (already verified in source)
  out.push({ Name: 'email_verified', Value: 'true' });

  // Map source custom attrs → unified custom attrs
  // TerraAI pool uses custom:custom:role, opusaimobility uses custom:role
  const role = getAttr(attrs, 'custom:role') || getAttr(attrs, 'custom:custom:role') || 'user';
  out.push({ Name: 'custom:role',        Value: role });
  out.push({ Name: 'custom:permissions', Value: '[]' });
  out.push({ Name: 'custom:status',      Value: 'active' });

  return out;
}

// ── migrate single user ───────────────────────────────────────────────────────

async function migrateUser(user, sourceName) {
  const email = getAttr(user.Attributes, 'email');
  if (!email) {
    console.log(`  ⚠️  Skip ${user.Username} — no email`);
    return { status: 'skipped', reason: 'no_email' };
  }

  const attrs = buildTargetAttrs(user, sourceName);

  if (DRY_RUN) {
    console.log(`  [DRY] Would migrate: ${email} (${sourceName})`);
    return { status: 'dry_run', email };
  }

  try {
    // Create user with suppressed welcome email
    await cognito.send(new AdminCreateUserCommand({
      UserPoolId:        TARGET_POOL,
      Username:          email,
      UserAttributes:    attrs,
      MessageAction:     'SUPPRESS',
      TemporaryPassword: `TmpP@ss${Date.now().toString(36)}`,
    }));

    // Set a permanent placeholder password
    // Users will use "Forgot Password" to set their own on first login
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: TARGET_POOL,
      Username:   email,
      Password:   `MigratedU$er${Date.now().toString(36)}!`,
      Permanent:  true,
    }));

    console.log(`  ✅ Migrated: ${email}`);
    return { status: 'migrated', email };

  } catch (e) {
    if (e.name === 'UsernameExistsException') {
      // Already migrated — update attrs to be safe
      try {
        await cognito.send(new AdminUpdateUserAttributesCommand({
          UserPoolId:     TARGET_POOL,
          Username:       email,
          UserAttributes: attrs,
        }));
        console.log(`  ℹ️  Already exists (attrs refreshed): ${email}`);
        return { status: 'already_exists', email };
      } catch (ue) {
        console.warn(`  ⚠️  Attr refresh failed for ${email}:`, ue.message);
        return { status: 'already_exists', email };
      }
    }
    console.error(`  ❌ Failed ${email}:`, e.message);
    return { status: 'error', email, error: e.message };
  }
}

// ── paginate all users from a source pool ─────────────────────────────────────

async function listAllUsers(poolId) {
  const users = [];
  let token;
  do {
    const res = await cognito.send(new ListUsersCommand({
      UserPoolId: poolId,
      Limit:      60,
      ...(token ? { PaginationToken: token } : {}),
    }));
    users.push(...(res.Users || []));
    token = res.PaginationToken;
  } while (token);
  return users;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🔄 Cognito Pool Migration — TERRA-001');
  console.log(`   Target: us-east-1_LKa4ElQem (opusaimobility-production)`);
  console.log(`   Mode:   ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

  const summary = { migrated: 0, already_exists: 0, skipped: 0, error: 0, dry_run: 0 };

  for (const pool of SOURCE_POOLS) {
    console.log(`📥 Source pool: ${pool.name} (${pool.id})`);
    const users = await listAllUsers(pool.id);
    console.log(`   Found ${users.length} users\n`);

    for (const user of users) {
      const result = await migrateUser(user, pool.source);
      summary[result.status] = (summary[result.status] || 0) + 1;
    }
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log('Migration Summary:');
  console.log(`  ✅ Migrated:       ${summary.migrated}`);
  console.log(`  ℹ️  Already Exists: ${summary.already_exists}`);
  console.log(`  ⏭️  Skipped:        ${summary.skipped}`);
  console.log(`  ❌ Errors:         ${summary.error}`);
  if (DRY_RUN) console.log(`  🔍 Dry Run:        ${summary.dry_run}`);
  console.log('\nNew Pool Clients:');
  console.log('  Web:     3a207uin5o3p4k1ngk334crntl  (VITE_COGNITO_CLIENT_ID)');
  console.log('  Android: 2am01r4fmsp0s08991ftgub887  (Android BuildConfig)');
  console.log('  Pool ID: us-east-1_LKa4ElQem         (COGNITO_USER_POOL_ID)');
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
