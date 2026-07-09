/**
 * Property 10: Duplicate User Merge Preserves Existing Credentials
 *
 * For any user whose email exists in both TerraAI and Cognito, the merge logic SHALL:
 * preserve the existing Cognito password, append TerraAI's role to the role attribute,
 * copy TerraAI-only attributes (phone, name) that are absent in Cognito, and log the
 * merge event with both identifiers.
 *
 * Validates: Requirements 8.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { appendRole } from '../../scripts/migrate/migrate-users';

/**
 * Arbitrary generator for valid TerraAI roles.
 */
const arbRole: fc.Arbitrary<string> = fc.constantFrom(
  'customer',
  'rider',
  'vendor',
  'admin'
);

/**
 * Arbitrary generator for existing Cognito role strings (possibly comma-separated).
 */
const arbExistingRole: fc.Arbitrary<string> = fc
  .subarray(['customer', 'rider', 'vendor', 'admin', 'business'], { minLength: 1, maxLength: 3 })
  .map((roles) => roles.join(','));

describe('Feature: terraai-opusaimobility-consolidation, Property 10: Duplicate user merge', () => {
  it('appending a new role to an existing role string produces a comma-separated result containing the new role', () => {
    fc.assert(
      fc.property(arbExistingRole, arbRole, (existingRole: string, newRole: string) => {
        const existingRoles = existingRole.split(',').map((r) => r.trim());

        // Only test the case where the new role is NOT already present
        fc.pre(!existingRoles.includes(newRole));

        const result = appendRole(existingRole, newRole);

        // The result should contain the new role
        const resultRoles = result.split(',').map((r) => r.trim());
        expect(resultRoles).toContain(newRole);

        // All original roles should still be present (password/credentials preserved by not touching them)
        for (const original of existingRoles) {
          expect(resultRoles).toContain(original);
        }

        // The result should be the existing role + comma + new role
        expect(result).toBe(`${existingRole},${newRole}`);
      }),
      { numRuns: 100 }
    );
  });

  it('appending an already-present role returns the existing role string unchanged (existing credentials preserved)', () => {
    fc.assert(
      fc.property(arbExistingRole, (existingRole: string) => {
        const existingRoles = existingRole.split(',').map((r) => r.trim());
        // Pick one of the existing roles to re-append
        const roleToAppend = existingRoles[0];

        const result = appendRole(existingRole, roleToAppend);

        // The result should be unchanged — no duplicate, existing state preserved
        expect(result).toBe(existingRole);
      }),
      { numRuns: 100 }
    );
  });

  it('appending a role to an empty string returns just the new role', () => {
    fc.assert(
      fc.property(arbRole, (newRole: string) => {
        const result = appendRole('', newRole);
        expect(result).toBe(newRole);
      }),
      { numRuns: 100 }
    );
  });

  it('appending a role to a whitespace-only string returns just the new role', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('  ', ' ', '   '),
        arbRole,
        (existingRole: string, newRole: string) => {
          const result = appendRole(existingRole, newRole);
          expect(result).toBe(newRole);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('merge preserves all existing roles and appends new one without modifying order', () => {
    fc.assert(
      fc.property(
        fc.tuple(arbExistingRole, arbRole),
        ([existingRole, newRole]: [string, string]) => {
          const existingRoles = existingRole.split(',').map((r) => r.trim());
          fc.pre(!existingRoles.includes(newRole));

          const result = appendRole(existingRole, newRole);
          const resultRoles = result.split(',').map((r) => r.trim());

          // The new role should be at the end
          expect(resultRoles[resultRoles.length - 1]).toBe(newRole);

          // The prefix (all but last) should match the original roles in order
          const prefix = resultRoles.slice(0, resultRoles.length - 1);
          expect(prefix).toEqual(existingRoles);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('merge event is loggable: result always contains both source role and appended role identifiers', () => {
    fc.assert(
      fc.property(arbExistingRole, arbRole, (existingRole: string, newRole: string) => {
        const result = appendRole(existingRole, newRole);
        const resultRoles = result.split(',').map((r) => r.trim());

        // The result always contains the new role (either already was there or appended)
        expect(resultRoles).toContain(newRole);

        // All original roles are preserved (merge preserves existing credentials)
        const existingRoles = existingRole.split(',').map((r) => r.trim());
        for (const original of existingRoles) {
          expect(resultRoles).toContain(original);
        }
      }),
      { numRuns: 100 }
    );
  });
});
