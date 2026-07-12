/**
 * Property 9: Legacy Credential Validation Round-Trip
 *
 * For any TerraAI user with a known password, the user migration Lambda trigger SHALL
 * correctly validate the supplied password against the stored bcrypt hash and return
 * the user's attributes to Cognito upon successful validation.
 *
 * Validates: Requirements 8.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../../backend/lambda/user-migration/index.ts';

/**
 * Arbitrary password generator: printable ASCII strings of length 4–64.
 * Avoids empty or trivially short passwords while covering realistic inputs.
 */
const arbPassword: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~ ]+$/)
  .filter((s) => s.length >= 4 && s.length <= 64);

describe('Feature: terraai-opusaimobility-consolidation, Property 9: Credential validation round-trip', () => {
  it('correct passwords validate successfully against their bcrypt hash', async () => {
    await fc.assert(
      fc.asyncProperty(arbPassword, async (password: string) => {
        // Hash the password with bcrypt (cost factor 4 for speed in tests)
        const hash = await bcrypt.hash(password, 4);

        // Validate: correct password should return true
        const result = await validatePassword(password, hash);
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('incorrect passwords fail validation against bcrypt hash', async () => {
    await fc.assert(
      fc.asyncProperty(arbPassword, async (password: string) => {
        // Hash the password with bcrypt
        const hash = await bcrypt.hash(password, 4);

        // Validate: wrong password should return false
        const wrongPassword = password + '!WRONG!';
        const result = await validatePassword(wrongPassword, hash);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
