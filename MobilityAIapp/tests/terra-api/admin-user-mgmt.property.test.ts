/**
 * Property tests for TERRA-061 — Admin User Management
 *
 * Properties verified:
 *  P-ADM-1: search query is URL-encoded correctly
 *  P-ADM-2: bulk action payload always has non-empty userIds array
 *  P-ADM-3: valid actions are only 'suspend' | 'delete' | 'activate'
 *  P-ADM-4: filter combination always produces valid query params
 *  P-ADM-5: search query with special characters is safely encoded
 *  P-ADM-6: bulk action with empty userIds is always rejected
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── Types ─────────────────────────────────────────────────────────────────────

type BulkAction = 'suspend' | 'delete' | 'activate';
type RoleFilter   = 'all' | 'user' | 'rider' | 'vendor' | 'admin' | 'business';
type StatusFilter = 'all' | 'active' | 'suspended' | 'pending';

interface BulkActionPayload {
  action:  BulkAction;
  userIds: string[];
}

interface UserFilterParams {
  role?:   RoleFilter;
  status?: StatusFilter;
  search?: string;
}

// ── Pure helpers extracted from AdminInterface.tsx ────────────────────────────

const VALID_BULK_ACTIONS: BulkAction[] = ['suspend', 'delete', 'activate'];
const VALID_ROLES:   RoleFilter[]   = ['all', 'user', 'rider', 'vendor', 'admin', 'business'];
const VALID_STATUSES: StatusFilter[] = ['all', 'active', 'suspended', 'pending'];

/** Build the URL for GET /users?search=... */
function buildSearchUrl(query: string): string {
  return `/users?search=${encodeURIComponent(query)}`;
}

/** Build a bulk action payload — returns null if invalid */
function buildBulkPayload(action: string, userIds: string[]): BulkActionPayload | null {
  if (!VALID_BULK_ACTIONS.includes(action as BulkAction)) return null;
  if (!userIds || userIds.length === 0) return null;
  return { action: action as BulkAction, userIds };
}

/** Build query params from filter combination */
function buildFilterQueryParams(params: UserFilterParams): string {
  const parts: string[] = [];
  if (params.role   && params.role   !== 'all') parts.push(`role=${encodeURIComponent(params.role)}`);
  if (params.status && params.status !== 'all') parts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.search && params.search.trim())    parts.push(`search=${encodeURIComponent(params.search)}`);
  return parts.length > 0 ? `/users?${parts.join('&')}` : '/users';
}

/** Validate that a URL only contains safe characters */
function isValidQueryString(url: string): boolean {
  // Must start with /users
  if (!url.startsWith('/users')) return false;
  // If has query params, each = must separate key and value
  if (url.includes('?')) {
    const query = url.split('?')[1];
    if (!query) return false;
    for (const part of query.split('&')) {
      if (!part.includes('=')) return false;
      const [key, value] = part.split('=');
      if (!key) return false;
      // Attempt decode — should not throw
      try { decodeURIComponent(value); } catch { return false; }
    }
  }
  return true;
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

const arbUserId     = fc.string({ minLength: 4, maxLength: 36 }).filter(s => s.trim().length > 0);
const arbUserIds    = fc.array(arbUserId, { minLength: 1, maxLength: 50 });
const arbBulkAction = fc.constantFrom<BulkAction>('suspend', 'delete', 'activate');
const arbRole       = fc.constantFrom<RoleFilter>(...VALID_ROLES);
const arbStatus     = fc.constantFrom<StatusFilter>(...VALID_STATUSES);
const arbSearchQuery = fc.string({ minLength: 0, maxLength: 100 }); // any string including special chars

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TERRA-061: Admin User Management — Property Tests', () => {

  // P-ADM-1: search query is URL-encoded correctly
  it('P-ADM-1: search query is always properly URL-encoded in the request URL', () => {
    fc.assert(
      fc.property(arbSearchQuery, (query) => {
        const url = buildSearchUrl(query);
        expect(url.startsWith('/users?search=')).toBe(true);
        // The encoded value round-trips correctly
        const encodedPart = url.split('search=')[1];
        expect(decodeURIComponent(encodedPart)).toBe(query);
      }),
      { numRuns: 200 }
    );
  });

  // P-ADM-2: bulk action payload always has non-empty userIds array
  it('P-ADM-2: valid bulk action payload always has non-empty userIds array', () => {
    fc.assert(
      fc.property(arbBulkAction, arbUserIds, (action, userIds) => {
        const payload = buildBulkPayload(action, userIds);
        expect(payload).not.toBeNull();
        expect(payload!.userIds).toBeDefined();
        expect(Array.isArray(payload!.userIds)).toBe(true);
        expect(payload!.userIds.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 }
    );
  });

  // P-ADM-3: valid actions are only 'suspend' | 'delete' | 'activate'
  it('P-ADM-3: only valid actions (suspend/delete/activate) produce a non-null payload', () => {
    // Valid actions always succeed
    fc.assert(
      fc.property(arbBulkAction, arbUserIds, (action, userIds) => {
        const payload = buildBulkPayload(action, userIds);
        expect(payload).not.toBeNull();
        expect(VALID_BULK_ACTIONS).toContain(payload!.action);
      }),
      { numRuns: 100 }
    );

    // Invalid actions always fail
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !VALID_BULK_ACTIONS.includes(s as BulkAction)),
        arbUserIds,
        (invalidAction, userIds) => {
          const payload = buildBulkPayload(invalidAction, userIds);
          expect(payload).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  // P-ADM-4: filter combination always produces valid query params
  it('P-ADM-4: any combination of role+status+search filters produces valid URL query params', () => {
    fc.assert(
      fc.property(
        fc.record({
          role:   fc.option(arbRole,   { nil: undefined }),
          status: fc.option(arbStatus, { nil: undefined }),
          search: fc.option(arbSearchQuery, { nil: undefined }),
        }),
        (params) => {
          const url = buildFilterQueryParams(params as UserFilterParams);
          expect(isValidQueryString(url)).toBe(true);
          // Must start with /users
          expect(url.startsWith('/users')).toBe(true);
          // If role is 'all', it should NOT appear in query string
          if (params.role === 'all') {
            expect(url).not.toContain('role=all');
          }
          // If status is 'all', it should NOT appear in query string
          if (params.status === 'all') {
            expect(url).not.toContain('status=all');
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  // P-ADM-5: search query with special characters is safely encoded
  it('P-ADM-5: special chars in search (spaces, @, +, /, #) are safely encoded and decode correctly', () => {
    const specialChars = ['hello world', 'user@example.com', 'a+b', 'path/to/user', '#tag', '100% free'];
    fc.assert(
      fc.property(fc.constantFrom(...specialChars), (query) => {
        const url = buildSearchUrl(query);
        expect(url).not.toContain(' '); // spaces must be encoded
        const encodedPart = url.split('search=')[1];
        expect(decodeURIComponent(encodedPart)).toBe(query);
      }),
      { numRuns: specialChars.length }
    );
  });

  // P-ADM-6: bulk action with empty userIds is always rejected
  it('P-ADM-6: bulk action with empty userIds array always returns null', () => {
    fc.assert(
      fc.property(arbBulkAction, (action) => {
        const payload = buildBulkPayload(action, []);
        expect(payload).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  // Additional: action field in payload matches input exactly
  it('action field in payload exactly matches the requested action', () => {
    fc.assert(
      fc.property(arbBulkAction, arbUserIds, (action, userIds) => {
        const payload = buildBulkPayload(action, userIds);
        expect(payload!.action).toBe(action);
      }),
      { numRuns: 100 }
    );
  });
});
