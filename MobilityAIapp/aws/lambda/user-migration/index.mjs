/**
 * OpusAIMobility — Cognito User Migration Lambda Trigger
 *
 * Handles UserMigration_Authentication and UserMigration_ForgotPassword triggers.
 * Validates legacy TerraAI credentials against bcrypt hashes stored in RDS.
 *
 * Schema (opusaimobility-db.terraai.users):
 *   id, email, password_hash, name, phone, role, status (ENUM: active|suspended|deleted)
 *
 * Connection: uses VPC-internal RDS endpoint — no public access required.
 */

import { createConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Connection pool (module-level — reused across warm Lambda invocations)
let _conn = null;

async function getConnection() {
  // Reuse connection if still alive
  if (_conn) {
    try {
      await _conn.ping();
      return _conn;
    } catch {
      _conn = null;
    }
  }
  _conn = await createConnection({
    host:           process.env.DB_HOST,
    port:           parseInt(process.env.DB_PORT || '3306'),
    database:       process.env.DB_NAME   || 'terraai',
    user:           process.env.DB_USER,
    password:       process.env.DB_PASS,
    ssl:            { rejectUnauthorized: false }, // TLS validated at VPC/SG level
    connectTimeout: 8_000,
    // Keep connection alive between Lambda warm invocations
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  return _conn;
}

export const handler = async (event) => {
  console.log('[migration] trigger:', event.triggerSource, '| user:', event.userName);

  const connection = await getConnection();

  try {
    if (event.triggerSource === 'UserMigration_Authentication') {
      await handleAuthentication(event, connection);
    } else if (event.triggerSource === 'UserMigration_ForgotPassword') {
      await handleForgotPassword(event, connection);
    } else {
      console.warn('[migration] Unknown trigger source:', event.triggerSource);
    }
  } catch (err) {
    // Log before re-throwing — Cognito will deny auth on any exception
    console.error('[migration] Failed for', event.userName, '—', err.message);
    throw err;
  }

  return event;
};

async function handleAuthentication(event, connection) {
  const email    = event.userName;
  const password = event.request.password;

  const [rows] = await connection.execute(
    `SELECT id, email, password_hash, name, phone, role
     FROM users
     WHERE email = ? AND status = 'active'
     LIMIT 1`,
    [email]
  );

  if (rows.length === 0) {
    console.log('[migration] Not found or inactive:', email);
    throw new Error('Bad password'); // Cognito expects exactly this message
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    console.log('[migration] Wrong password for:', email);
    throw new Error('Bad password');
  }

  // Success — return attributes so Cognito creates the user in the pool
  event.response.userAttributes = {
    email:           user.email,
    email_verified:  'true',
    name:            (user.name  || '').trim(),
    phone_number:    (user.phone || ''),
    'custom:role':   user.role   || 'customer',
    'custom:status': 'active',
  };
  event.response.finalUserStatus = 'CONFIRMED';
  event.response.messageAction   = 'SUPPRESS';

  console.log('[migration] ✔ Authenticated and migrated:', email, '| role:', user.role);
}

async function handleForgotPassword(event, connection) {
  const email = event.userName;

  const [rows] = await connection.execute(
    `SELECT id, email, name, phone, role
     FROM users
     WHERE email = ? AND status = 'active'
     LIMIT 1`,
    [email]
  );

  if (rows.length === 0) {
    console.log('[migration] Not found for forgot-password:', email);
    throw new Error('User not found');
  }

  const user = rows[0];

  event.response.userAttributes = {
    email:           user.email,
    email_verified:  'true',
    name:            (user.name  || '').trim(),
    phone_number:    (user.phone || ''),
    'custom:role':   user.role   || 'customer',
    'custom:status': 'active',
  };
  event.response.messageAction = 'SUPPRESS';

  console.log('[migration] ✔ Forgot-password migration:', email);
}
