/**
 * Cognito User Migration Lambda Trigger
 *
 * Invoked by Cognito when a user signs in but is not found locally in the user pool.
 * Queries TerraAI RDS for the user by email, validates the supplied password against
 * the stored bcrypt hash, and returns user attributes to Cognito if valid.
 *
 * Requirements: 8.2, 8.3
 */

import { createConnection, type Connection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

/**
 * Environment variables required for this Lambda:
 * - DB_HOST: RDS endpoint
 * - DB_PORT: RDS port (default 3306)
 * - DB_NAME: TerraAI database name
 * - DB_USER: Database username
 * - DB_PASS: Database password
 */

export interface TerraAIUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  role: 'customer' | 'rider' | 'vendor' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
}

export interface CognitoUserMigrationEvent {
  version: string;
  triggerSource: 'UserMigration_Authentication' | 'UserMigration_ForgotPassword';
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    password?: string;
    validationData?: Record<string, string>;
    clientMetadata?: Record<string, string>;
  };
  response: {
    userAttributes?: Record<string, string>;
    finalUserStatus?: string;
    messageAction?: string;
    desiredDeliveryMediums?: string[];
    forceAliasCreation?: boolean;
  };
}

/**
 * Creates a MySQL connection to the TerraAI RDS instance.
 */
export async function createDbConnection(): Promise<Connection> {
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASS;

  if (!host || !database || !user || !password) {
    throw new Error('Missing required database environment variables');
  }

  return createConnection({
    host,
    port,
    database,
    user,
    password,
    connectTimeout: 5000,
    ssl: { rejectUnauthorized: true },
  });
}

/**
 * Queries the TerraAI database for an active user by email.
 * Returns the user record if found and active, null otherwise.
 */
export async function findUserByEmail(
  connection: Connection,
  email: string
): Promise<TerraAIUser | null> {
  const [rows] = await connection.execute<any[]>(
    'SELECT id, email, password_hash, name, phone, role, status FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const user = rows[0] as TerraAIUser;

  // Only allow migration of active users
  if (user.status !== 'active') {
    return null;
  }

  return user;
}

/**
 * Validates a plaintext password against a bcrypt hash.
 * Returns true if the password matches, false otherwise.
 */
export async function validatePassword(
  plainPassword: string,
  bcryptHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, bcryptHash);
}

/**
 * Formats a phone number to E.164 format if not already.
 * Returns null if phone is null or empty.
 */
export function formatPhoneE164(phone: string | null): string | null {
  if (!phone || phone.trim() === '') {
    return null;
  }

  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Already in E.164 format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Assume international number without +
  return `+${cleaned}`;
}

/**
 * Builds the Cognito user attributes map from a TerraAI user record.
 */
export function buildCognitoAttributes(user: TerraAIUser): Record<string, string> {
  const attributes: Record<string, string> = {
    email: user.email,
    email_verified: 'true',
    name: user.name,
    'custom:role': user.role,
    'custom:permissions': '[]',
  };

  const formattedPhone = formatPhoneE164(user.phone);
  if (formattedPhone) {
    attributes['phone_number'] = formattedPhone;
    attributes['phone_number_verified'] = 'true';
  }

  return attributes;
}

/**
 * Main Lambda handler for Cognito User Migration trigger.
 *
 * Triggered when:
 * - UserMigration_Authentication: User tries to sign in but doesn't exist in pool
 * - UserMigration_ForgotPassword: User tries forgot-password but doesn't exist in pool
 */
export async function handler(
  event: CognitoUserMigrationEvent
): Promise<CognitoUserMigrationEvent> {
  const { triggerSource, userName } = event;

  console.log(`[UserMigration] triggerSource=${triggerSource} user=${userName}`);

  // Only handle authentication trigger
  if (triggerSource === 'UserMigration_Authentication') {
    return handleAuthentication(event);
  }

  // For forgot password, we allow the migration without password validation
  if (triggerSource === 'UserMigration_ForgotPassword') {
    return handleForgotPassword(event);
  }

  // Unknown trigger source — deny
  throw new Error(`Unknown trigger source: ${triggerSource}`);
}

/**
 * Handles UserMigration_Authentication trigger.
 * Validates the user's password against TerraAI's bcrypt hash.
 */
async function handleAuthentication(
  event: CognitoUserMigrationEvent
): Promise<CognitoUserMigrationEvent> {
  const email = event.userName;
  const password = event.request.password;

  if (!password) {
    console.error('[UserMigration] No password provided in authentication request');
    throw new Error('Bad password');
  }

  let connection: Connection | null = null;

  try {
    connection = await createDbConnection();
    const user = await findUserByEmail(connection, email);

    if (!user) {
      console.log(`[UserMigration] User not found or inactive: ${email}`);
      throw new Error('Bad password');
    }

    const isValid = await validatePassword(password, user.password_hash);

    if (!isValid) {
      console.log(`[UserMigration] Invalid password for user: ${email}`);
      throw new Error('Bad password');
    }

    // Password is valid — return user attributes to Cognito
    console.log(`[UserMigration] Successfully validated user: ${email}`);

    event.response.userAttributes = buildCognitoAttributes(user);
    event.response.finalUserStatus = 'CONFIRMED';
    event.response.messageAction = 'SUPPRESS';

    return event;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Handles UserMigration_ForgotPassword trigger.
 * Allows the user to reset their password via Cognito after migration.
 */
async function handleForgotPassword(
  event: CognitoUserMigrationEvent
): Promise<CognitoUserMigrationEvent> {
  const email = event.userName;

  let connection: Connection | null = null;

  try {
    connection = await createDbConnection();
    const user = await findUserByEmail(connection, email);

    if (!user) {
      console.log(`[UserMigration] User not found or inactive for forgot-password: ${email}`);
      throw new Error('User not found');
    }

    // Return user attributes — Cognito will handle the password reset flow
    console.log(`[UserMigration] Migrating user for forgot-password: ${email}`);

    event.response.userAttributes = buildCognitoAttributes(user);
    event.response.messageAction = 'SUPPRESS';

    return event;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
