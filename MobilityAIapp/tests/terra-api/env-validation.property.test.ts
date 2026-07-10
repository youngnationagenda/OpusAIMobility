/**
 * Property 3: Missing Environment Variable Detection
 *
 * For any subset of required database environment variables (DB_HOST, DB_PORT, DB_NAME,
 * DB_USER, DB_PASS) where at least one is missing or empty, the TerraAI API startup
 * logic SHALL refuse to start and log which variable is missing.
 *
 * **Validates: Requirements 2.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEnvVars } from '@opusaimobility/common/env-validation.js';
import { REQUIRED_DB_ENV_VARS } from '@opusaimobility/common/constants/env-vars.js';

/**
 * Generator for a non-empty string value (simulates a valid env var value).
 */
const arbNonEmptyEnvValue: fc.Arbitrary<string> = fc.stringMatching(/^[a-zA-Z0-9_./-]+$/).filter(
  (s) => s.length > 0
);

/**
 * Generator for an arbitrary subset of required env vars with at least one missing or empty.
 *
 * Strategy:
 * 1. For each required var, randomly decide: present (non-empty), empty string, or absent (undefined)
 * 2. Ensure at least one variable is missing or empty
 */
const arbEnvWithMissing: fc.Arbitrary<{
  env: Record<string, string | undefined>;
  expectedMissing: string[];
}> = fc
  .tuple(
    // For each of the 5 required vars, pick a "status": 0=absent, 1=empty, 2=present
    fc.tuple(
      fc.integer({ min: 0, max: 2 }),
      fc.integer({ min: 0, max: 2 }),
      fc.integer({ min: 0, max: 2 }),
      fc.integer({ min: 0, max: 2 }),
      fc.integer({ min: 0, max: 2 })
    ),
    // Values for vars that are "present"
    fc.array(arbNonEmptyEnvValue, { minLength: 5, maxLength: 5 })
  )
  .filter(([statuses]) => {
    // Ensure at least one variable is missing (status 0 or 1)
    return statuses.some((s) => s < 2);
  })
  .map(([statuses, values]) => {
    const env: Record<string, string | undefined> = {};
    const expectedMissing: string[] = [];

    for (let i = 0; i < REQUIRED_DB_ENV_VARS.length; i++) {
      const varName = REQUIRED_DB_ENV_VARS[i];
      const status = statuses[i];

      if (status === 0) {
        // Absent — don't add to env record
        expectedMissing.push(varName);
      } else if (status === 1) {
        // Empty string
        env[varName] = '';
        expectedMissing.push(varName);
      } else {
        // Present with non-empty value
        env[varName] = values[i];
      }
    }

    return { env, expectedMissing };
  });

/**
 * Generator for a complete valid env (all required vars present and non-empty).
 */
const arbCompleteEnv: fc.Arbitrary<Record<string, string | undefined>> = fc
  .array(arbNonEmptyEnvValue, { minLength: 5, maxLength: 5 })
  .map((values) => {
    const env: Record<string, string | undefined> = {};
    for (let i = 0; i < REQUIRED_DB_ENV_VARS.length; i++) {
      env[REQUIRED_DB_ENV_VARS[i]] = values[i];
    }
    return env;
  });

describe('Feature: terraai-opusaimobility-consolidation, Property 3: Missing env var detection', () => {
  it('detects all missing/empty env vars and refuses to start', () => {
    fc.assert(
      fc.property(arbEnvWithMissing, ({ env, expectedMissing }) => {
        const result = validateEnvVars(env);

        // Must report invalid (refuse to start)
        expect(result.valid).toBe(false);

        // Must identify exactly which variables are missing
        expect(result.missing).toHaveLength(expectedMissing.length);
        expect(result.missing.sort()).toEqual(expectedMissing.sort());

        // Each reported missing var must be one of the required vars
        for (const varName of result.missing) {
          expect(REQUIRED_DB_ENV_VARS).toContain(varName);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('reports valid when all required env vars are present and non-empty', () => {
    fc.assert(
      fc.property(arbCompleteEnv, (env) => {
        const result = validateEnvVars(env);

        // Must report valid (allow startup)
        expect(result.valid).toBe(true);
        expect(result.missing).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('each individual missing var is correctly identified', () => {
    fc.assert(
      fc.property(
        // Pick one var to make missing, give the rest valid values
        fc.integer({ min: 0, max: REQUIRED_DB_ENV_VARS.length - 1 }),
        fc.array(arbNonEmptyEnvValue, { minLength: 5, maxLength: 5 }),
        fc.boolean(), // true = absent, false = empty string
        (missingIndex, values, isAbsent) => {
          const env: Record<string, string | undefined> = {};

          for (let i = 0; i < REQUIRED_DB_ENV_VARS.length; i++) {
            if (i === missingIndex) {
              if (!isAbsent) {
                env[REQUIRED_DB_ENV_VARS[i]] = '';
              }
              // if isAbsent, simply don't add the key
            } else {
              env[REQUIRED_DB_ENV_VARS[i]] = values[i];
            }
          }

          const result = validateEnvVars(env);

          // Must refuse to start
          expect(result.valid).toBe(false);

          // Must identify the specific missing variable
          expect(result.missing).toContain(REQUIRED_DB_ENV_VARS[missingIndex]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
