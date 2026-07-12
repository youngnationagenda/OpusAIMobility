/**
 * Environment variable validation for TerraAI API startup.
 *
 * TypeScript equivalent of the PHP bootstrap.php validateEnvVars() function.
 * Takes a record of env vars and checks that all required DB variables
 * (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS) are present and non-empty.
 *
 * Requirements: 2.5
 */

import { REQUIRED_DB_ENV_VARS } from './constants/env-vars.js';

export interface EnvValidationResult {
  /** Whether all required variables are present and non-empty */
  valid: boolean;
  /** List of variable names that are missing or empty */
  missing: string[];
}

/**
 * Validates that all required database environment variables are present and non-empty.
 *
 * Mirrors the behavior of TerraAI's PHP bootstrap.php `validateEnvVars()`:
 * - Checks each required var exists in the provided record
 * - Treats missing keys and empty string values as "missing"
 * - Returns which specific variables are missing for logging
 *
 * @param env - Record of environment variable name → value (simulates process.env or getenv())
 * @returns Validation result with valid flag and list of missing variable names
 */
export function validateEnvVars(env: Record<string, string | undefined>): EnvValidationResult {
  const missing: string[] = [];

  for (const varName of REQUIRED_DB_ENV_VARS) {
    const value = env[varName];
    if (value === undefined || value === '') {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
