/**
 * Property 7: JWT Role-Based Access Control
 *
 * For any valid Cognito JWT token and any TerraAI API endpoint with a defined
 * permission requirement, access SHALL be granted if and only if the token's
 * `custom:role` value has permission for that endpoint. Invalid/expired tokens
 * SHALL receive HTTP 401; valid tokens with insufficient role SHALL receive HTTP 403.
 *
 * Validates: Requirements 7.4, 7.5, 7.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ROLE_PERMISSIONS,
  hasPermission,
  checkAccess,
  type TokenStatus,
} from '@opusaimobility/common/auth/rbac.js';
import { ALL_ROLES, type Role } from '@opusaimobility/common/auth/roles.js';

/**
 * All endpoint path prefixes that have specific role permissions defined.
 * These represent the distinct permission domains in the TerraAI API.
 */
const PERMISSION_PREFIXES = [
  '/vendors/',
  '/trips/',
  '/uploads/',
  '/notifications/',
  '/chat/',
  '/business/',
  '/riders/',
  '/customers/',
];

/**
 * Arbitrary: generates a valid TerraAI API endpoint path that falls within
 * the defined permission domains.
 */
const arbEndpointPath: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom(...PERMISSION_PREFIXES),
    fc.array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 0, maxLength: 3 })
  )
  .map(([prefix, segments]) => prefix + segments.join('/'));

/**
 * Arbitrary: generates a valid role from ALL_ROLES.
 */
const arbRole: fc.Arbitrary<Role> = fc.constantFrom(...ALL_ROLES);

/**
 * Arbitrary: generates a token status representing invalid/expired/missing tokens.
 */
const arbInvalidTokenStatus: fc.Arbitrary<TokenStatus> = fc.constantFrom(
  'expired' as TokenStatus,
  'invalid' as TokenStatus,
  'missing' as TokenStatus
);

/**
 * Arbitrary: generates endpoint paths that no non-admin role has permission for.
 * These are paths outside the defined permission domains.
 */
const arbUnpermittedPath: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 4 })
  .map((segments) => '/' + segments.join('/'))
  .filter((path) => !PERMISSION_PREFIXES.some((prefix) => path.startsWith(prefix)));

describe('Feature: terraai-opusaimobility-consolidation, Property 7: JWT role-based access', () => {
  describe('Valid token + permitted role → access granted (200)', () => {
    it('admin role has access to any endpoint path', () => {
      fc.assert(
        fc.property(arbEndpointPath, (path: string) => {
          const result = checkAccess('valid', 'admin', path);

          expect(result.statusCode).toBe(200);
          expect(result.granted).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('admin role has access to paths outside defined permission domains', () => {
      fc.assert(
        fc.property(arbUnpermittedPath, (path: string) => {
          const result = checkAccess('valid', 'admin', path);

          expect(result.statusCode).toBe(200);
          expect(result.granted).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('each role has access to its own permitted endpoint patterns', () => {
      fc.assert(
        fc.property(arbRole, (role: Role) => {
          const patterns = ROLE_PERMISSIONS[role];

          for (const pattern of patterns) {
            if (pattern === '*') {
              // Admin wildcard — already tested above
              continue;
            }

            // Generate a concrete path matching this pattern
            // e.g., '/trips/*' → '/trips/123'
            const concretePath = pattern.replace('*', 'test-resource');
            const result = checkAccess('valid', role, concretePath);

            expect(result.statusCode).toBe(200);
            expect(result.granted).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('role + arbitrary path within its permitted prefix → access granted', () => {
      /**
       * For each non-admin role, generate an arbitrary path within one of its
       * permitted prefixes and assert access is granted.
       */
      const arbRoleAndPermittedPath: fc.Arbitrary<{ role: Role; path: string }> = fc
        .constantFrom(
          ...ALL_ROLES.filter((r) => r !== 'admin').flatMap((role) =>
            ROLE_PERMISSIONS[role]
              .filter((p) => p !== '*')
              .map((pattern) => ({ role, pattern }))
          )
        )
        .chain(({ role, pattern }) => {
          const prefix = pattern.replace('*', '');
          return fc
            .array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 3 })
            .map((segments) => ({ role, path: prefix + segments.join('/') }));
        });

      fc.assert(
        fc.property(arbRoleAndPermittedPath, ({ role, path }) => {
          const result = checkAccess('valid', role, path);

          expect(result.statusCode).toBe(200);
          expect(result.granted).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid/expired token → 401 regardless of role or path', () => {
    it('expired/invalid/missing tokens always return 401', () => {
      fc.assert(
        fc.property(
          arbInvalidTokenStatus,
          arbRole,
          arbEndpointPath,
          (tokenStatus: TokenStatus, role: Role, path: string) => {
            const result = checkAccess(tokenStatus, role, path);

            expect(result.statusCode).toBe(401);
            expect(result.granted).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('expired token returns "Token expired" error', () => {
      fc.assert(
        fc.property(arbRole, arbEndpointPath, (role: Role, path: string) => {
          const result = checkAccess('expired', role, path);

          expect(result.statusCode).toBe(401);
          expect(result.error).toBe('Token expired');
        }),
        { numRuns: 100 }
      );
    });

    it('invalid token returns "Invalid token format" error', () => {
      fc.assert(
        fc.property(arbRole, arbEndpointPath, (role: Role, path: string) => {
          const result = checkAccess('invalid', role, path);

          expect(result.statusCode).toBe(401);
          expect(result.error).toBe('Invalid token format');
        }),
        { numRuns: 100 }
      );
    });

    it('missing token returns "Authentication credentials required" error', () => {
      fc.assert(
        fc.property(arbRole, arbEndpointPath, (role: Role, path: string) => {
          const result = checkAccess('missing', role, path);

          expect(result.statusCode).toBe(401);
          expect(result.error).toBe('Authentication credentials required');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Valid token + insufficient role → 403', () => {
    it('non-admin roles cannot access paths outside their permission domains', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            ...ALL_ROLES.filter((r) => r !== 'admin')
          ) as fc.Arbitrary<Role>,
          arbUnpermittedPath,
          (role: Role, path: string) => {
            const result = checkAccess('valid', role, path);

            expect(result.statusCode).toBe(403);
            expect(result.granted).toBe(false);
            expect(result.error).toBe('Insufficient permissions');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('customer cannot access vendor-only endpoints', () => {
      const arbVendorOnlyPath: fc.Arbitrary<string> = fc
        .array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 3 })
        .map((segments) => '/vendors/' + segments.join('/'));

      fc.assert(
        fc.property(arbVendorOnlyPath, (path: string) => {
          const result = checkAccess('valid', 'customer', path);

          expect(result.statusCode).toBe(403);
          expect(result.granted).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('vendor cannot access customer-only endpoints', () => {
      const arbCustomerOnlyPath: fc.Arbitrary<string> = fc
        .array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 3 })
        .map((segments) => '/customers/' + segments.join('/'));

      fc.assert(
        fc.property(arbCustomerOnlyPath, (path: string) => {
          const result = checkAccess('valid', 'vendor', path);

          expect(result.statusCode).toBe(403);
          expect(result.granted).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('rider cannot access business-only endpoints', () => {
      const arbBusinessOnlyPath: fc.Arbitrary<string> = fc
        .array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 3 })
        .map((segments) => '/business/' + segments.join('/'));

      fc.assert(
        fc.property(arbBusinessOnlyPath, (path: string) => {
          const result = checkAccess('valid', 'rider', path);

          expect(result.statusCode).toBe(403);
          expect(result.granted).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('null/empty/invalid role with valid token → 403', () => {
      const arbInvalidRole = fc.constantFrom(null, undefined, '', 'superuser', 'moderator', 'root');

      fc.assert(
        fc.property(
          arbInvalidRole,
          arbEndpointPath,
          (role: string | null | undefined, path: string) => {
            const result = checkAccess('valid', role, path);

            expect(result.statusCode).toBe(403);
            expect(result.granted).toBe(false);
            expect(result.error).toBe('Insufficient permissions');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('hasPermission correctness', () => {
    it('admin role permits any arbitrary path', () => {
      const arbAnyPath: fc.Arbitrary<string> = fc
        .array(fc.stringMatching(/^[a-zA-Z0-9_.-]+$/), { minLength: 1, maxLength: 5 })
        .map((segments) => '/' + segments.join('/'));

      fc.assert(
        fc.property(arbAnyPath, (path: string) => {
          expect(hasPermission('admin', path)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('permission is symmetric: if role X has pattern P, then path matching P is permitted', () => {
      fc.assert(
        fc.property(arbRole, (role: Role) => {
          const patterns = ROLE_PERMISSIONS[role];
          for (const pattern of patterns) {
            if (pattern === '*') continue;
            const testPath = pattern.replace('*', 'any-resource/sub-path');
            expect(hasPermission(role, testPath)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
