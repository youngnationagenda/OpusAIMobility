/**
 * User Migration Script
 *
 * Reads active users from TerraAI database and creates corresponding
 * Cognito user records. Handles duplicates by merging attributes and
 * produces a summary report.
 *
 * Requirements: 8.1, 8.4, 8.5, 8.6
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Connection } from 'mysql2/promise';
import type {
  TerraAIUserRecord,
  UserMigrationResult,
  UserMigrationFailure,
  UserMigrationOutcome,
  UserMergeEvent,
} from '@opusaimobility/common';

/** Configuration for the user migration */
export interface UserMigrationConfig {
  /** TerraAI database connection */
  db: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  /** Cognito configuration */
  cognito: {
    userPoolId: string;
    region: string;
  };
}

/**
 * Normalizes a phone number to E.164 format.
 * If the phone number is null/empty, returns null.
 * If already in E.164 format (starts with +), returns as-is.
 * Otherwise, prepends '+' assuming the number includes country code.
 *
 * @param phone - Raw phone number from TerraAI database
 * @returns Phone number in E.164 format or null
 */
export function normalizePhoneToE164(phone: string | null): string | null {
  if (!phone || phone.trim() === '') {
    return null;
  }

  const cleaned = phone.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Assume the number includes a country code, prepend '+'
  return `+${cleaned}`;
}

/**
 * Maps a TerraAI user record to Cognito user attributes.
 *
 * @param user - The TerraAI user record
 * @returns Array of Cognito user attribute objects
 */
export function mapUserToCognitoAttributes(
  user: TerraAIUserRecord
): { Name: string; Value: string }[] {
  const attributes: { Name: string; Value: string }[] = [
    { Name: 'email', Value: user.email },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'name', Value: user.name },
    { Name: 'custom:role', Value: user.role },
    { Name: 'custom:permissions', Value: '[]' },
  ];

  const phone = normalizePhoneToE164(user.phone);
  if (phone) {
    attributes.push({ Name: 'phone_number', Value: phone });
  }

  return attributes;
}

/**
 * Fetches active users from TerraAI database (status not suspended/deleted).
 *
 * @param connection - Active mysql2 connection
 * @returns Array of TerraAI user records
 */
export async function fetchActiveUsers(
  connection: Connection
): Promise<TerraAIUserRecord[]> {
  const [rows] = await connection.execute<any[]>(
    `SELECT id, email, password_hash, name, phone, role, status, created_at, updated_at
     FROM users
     WHERE status = 'active'`
  );

  return rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    phone: row.phone ?? null,
    role: row.role,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }));
}

/**
 * Attempts to create a new Cognito user for a TerraAI user record.
 * Returns the outcome of the operation.
 *
 * @param client - Cognito Identity Provider client
 * @param userPoolId - Cognito User Pool ID
 * @param user - TerraAI user record
 * @returns The migration outcome for this user
 */
export async function createCognitoUser(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  user: TerraAIUserRecord
): Promise<UserMigrationOutcome> {
  const attributes = mapUserToCognitoAttributes(user);

  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: user.email,
        UserAttributes: attributes,
        MessageAction: 'SUPPRESS', // Don't send welcome email
      })
    );

    return {
      email: user.email,
      sourceId: user.id,
      action: 'created',
    };
  } catch (error: unknown) {
    // Check if user already exists — handle merge
    if (error instanceof UsernameExistsException) {
      return await mergeExistingUser(client, userPoolId, user);
    }

    // Any other error — skip this user
    const reason = error instanceof Error ? error.message : String(error);
    return {
      email: user.email,
      sourceId: user.id,
      action: 'skipped',
      reason,
    };
  }
}

/**
 * Merges a TerraAI user into an existing Cognito record.
 * Preserves the existing Cognito password, appends TerraAI role,
 * and copies missing attributes (phone, name).
 *
 * @param client - Cognito Identity Provider client
 * @param userPoolId - Cognito User Pool ID
 * @param user - TerraAI user record to merge
 * @returns The migration outcome for this user
 */
export async function mergeExistingUser(
  client: CognitoIdentityProviderClient,
  userPoolId: string,
  user: TerraAIUserRecord
): Promise<UserMigrationOutcome> {
  try {
    // Get existing Cognito user attributes
    const existingUser = await client.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: user.email,
      })
    );

    const existingAttrs = existingUser.UserAttributes ?? [];
    const getAttr = (name: string): string | undefined =>
      existingAttrs.find((a) => a.Name === name)?.Value;

    const existingRole = getAttr('custom:role') ?? '';
    const existingPhone = getAttr('phone_number');
    const existingName = getAttr('name');

    // Build list of attributes to update
    const updatedAttributes: { Name: string; Value: string }[] = [];
    const copiedAttributes: string[] = [];

    // Append TerraAI role if not already present
    const newRole = appendRole(existingRole, user.role);
    if (newRole !== existingRole) {
      updatedAttributes.push({ Name: 'custom:role', Value: newRole });
      copiedAttributes.push('custom:role');
    }

    // Copy phone if missing in Cognito
    if (!existingPhone && user.phone) {
      const phone = normalizePhoneToE164(user.phone);
      if (phone) {
        updatedAttributes.push({ Name: 'phone_number', Value: phone });
        copiedAttributes.push('phone_number');
      }
    }

    // Copy name if missing in Cognito
    if (!existingName && user.name) {
      updatedAttributes.push({ Name: 'name', Value: user.name });
      copiedAttributes.push('name');
    }

    // Update Cognito if there are attributes to change
    if (updatedAttributes.length > 0) {
      await client.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: user.email,
          UserAttributes: updatedAttributes,
        })
      );
    }

    // Log merge event
    const mergeEvent: UserMergeEvent = {
      terraUserId: user.id,
      cognitoUsername: user.email,
      copiedAttributes,
      appendedRole: user.role,
      timestamp: new Date().toISOString(),
    };
    console.log('[migrate-users] Merge event:', JSON.stringify(mergeEvent));

    return {
      email: user.email,
      sourceId: user.id,
      action: 'merged',
      cognitoUsername: user.email,
    };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      email: user.email,
      sourceId: user.id,
      action: 'skipped',
      reason: `Merge failed: ${reason}`,
    };
  }
}

/**
 * Appends a role to an existing role string if not already present.
 * Roles are comma-separated within the custom:role attribute.
 *
 * @param existingRole - Current role string (may be comma-separated)
 * @param newRole - Role to append
 * @returns Updated role string
 */
export function appendRole(existingRole: string, newRole: string): string {
  if (!existingRole || existingRole.trim() === '') {
    return newRole;
  }

  const roles = existingRole.split(',').map((r) => r.trim());
  if (roles.includes(newRole)) {
    return existingRole;
  }

  return `${existingRole},${newRole}`;
}

/**
 * Processes a batch of TerraAI users, creating or merging each into Cognito.
 * On individual failure, skips the user and continues processing.
 *
 * This is the core migration function exported for testing.
 *
 * @param users - Array of active TerraAI user records
 * @param client - Cognito Identity Provider client
 * @param userPoolId - Cognito User Pool ID
 * @returns UserMigrationResult summary
 */
export async function migrateUsers(
  users: TerraAIUserRecord[],
  client: CognitoIdentityProviderClient,
  userPoolId: string
): Promise<UserMigrationResult> {
  let created = 0;
  let merged = 0;
  const failed: UserMigrationFailure[] = [];

  for (const user of users) {
    try {
      const outcome = await createCognitoUser(client, userPoolId, user);

      switch (outcome.action) {
        case 'created':
          created++;
          console.log(`[migrate-users] Created: ${user.email}`);
          break;
        case 'merged':
          merged++;
          console.log(`[migrate-users] Merged: ${user.email}`);
          break;
        case 'skipped':
          failed.push({ userId: user.email, reason: outcome.reason ?? 'Unknown error' });
          console.warn(`[migrate-users] Skipped: ${user.email} — ${outcome.reason}`);
          break;
      }
    } catch (error: unknown) {
      // Unexpected error — skip user, log, continue
      const reason = error instanceof Error ? error.message : String(error);
      failed.push({ userId: user.email, reason });
      console.error(`[migrate-users] Failed: ${user.email} — ${reason}`);
    }
  }

  const result: UserMigrationResult = {
    totalProcessed: created + merged + failed.length,
    created,
    merged,
    failed,
  };

  return result;
}

/**
 * Builds the migration summary report from the migration result.
 * Logs the summary to console and returns the result unchanged.
 *
 * @param result - The UserMigrationResult from migrateUsers
 * @returns The same result, after logging the summary
 */
export function buildSummaryReport(result: UserMigrationResult): UserMigrationResult {
  console.log('[migrate-users] === Migration Summary ===');
  console.log(`[migrate-users] Total Processed: ${result.totalProcessed}`);
  console.log(`[migrate-users] Created: ${result.created}`);
  console.log(`[migrate-users] Merged: ${result.merged}`);
  console.log(`[migrate-users] Failed: ${result.failed.length}`);

  if (result.failed.length > 0) {
    console.log('[migrate-users] Failed users:');
    for (const f of result.failed) {
      console.log(`[migrate-users]   - ${f.userId}: ${f.reason}`);
    }
  }

  return result;
}

/**
 * Creates a MySQL connection using mysql2/promise.
 */
async function createConnection(config: UserMigrationConfig['db']): Promise<Connection> {
  const mysql = await import('mysql2/promise');
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 10_000,
    ssl: { rejectUnauthorized: true },
  });
}

/**
 * Reads migration configuration from environment variables.
 */
function getConfigFromEnv(): UserMigrationConfig {
  const dbHost = process.env.TERRA_DB_HOST;
  const dbPort = process.env.TERRA_DB_PORT;
  const dbName = process.env.TERRA_DB_NAME;
  const dbUser = process.env.TERRA_DB_USER;
  const dbPassword = process.env.TERRA_DB_PASSWORD;
  const cognitoPoolId = process.env.COGNITO_USER_POOL_ID;
  const cognitoRegion = process.env.COGNITO_REGION || 'us-east-1';

  const missing: string[] = [];
  if (!dbHost) missing.push('TERRA_DB_HOST');
  if (!dbPort) missing.push('TERRA_DB_PORT');
  if (!dbName) missing.push('TERRA_DB_NAME');
  if (!dbUser) missing.push('TERRA_DB_USER');
  if (!dbPassword) missing.push('TERRA_DB_PASSWORD');
  if (!cognitoPoolId) missing.push('COGNITO_USER_POOL_ID');

  if (missing.length > 0) {
    console.error(`[migrate-users] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return {
    db: {
      host: dbHost!,
      port: parseInt(dbPort!, 10),
      database: dbName!,
      user: dbUser!,
      password: dbPassword!,
    },
    cognito: {
      userPoolId: cognitoPoolId!,
      region: cognitoRegion,
    },
  };
}

/**
 * CLI entry point — executes when run directly via `tsx migrate-users.ts`
 */
async function main(): Promise<void> {
  console.log('[migrate-users] Starting TerraAI user migration to Cognito...');

  const config = getConfigFromEnv();
  console.log(`[migrate-users] Source DB: ${config.db.host}:${config.db.port}/${config.db.database}`);
  console.log(`[migrate-users] Cognito Pool: ${config.cognito.userPoolId} (${config.cognito.region})`);

  // Create Cognito client
  const cognitoClient = new CognitoIdentityProviderClient({
    region: config.cognito.region,
  });

  // Connect to TerraAI database
  let connection: Connection | undefined;
  try {
    connection = await createConnection(config.db);
    console.log('[migrate-users] Connected to TerraAI database');

    // Fetch active users
    const users = await fetchActiveUsers(connection);
    console.log(`[migrate-users] Found ${users.length} active users to migrate`);

    // Run migration
    const result = await migrateUsers(users, cognitoClient, config.cognito.userPoolId);

    // Produce summary report
    buildSummaryReport(result);

    // Output as JSON for downstream consumption
    console.log('[migrate-users] Report JSON:');
    console.log(JSON.stringify(result, null, 2));

    if (result.failed.length > 0) {
      console.warn(`[migrate-users] Migration completed with ${result.failed.length} failures`);
    } else {
      console.log('[migrate-users] Migration completed successfully');
    }
  } finally {
    if (connection) {
      try { await connection.end(); } catch { /* ignore */ }
    }
  }
}

// Only run main when executed directly (not when imported as a module)
const isDirectRun = process.argv[1]?.endsWith('migrate-users.ts') ||
                    process.argv[1]?.endsWith('migrate-users');

if (isDirectRun) {
  main().catch((err) => {
    console.error('[migrate-users] Unexpected error:', err);
    process.exit(1);
  });
}
