/**
 * Role-Based Access Control (RBAC) module.
 *
 * Mirrors the PHP auth middleware's permission checking logic from
 * `/apps/terra-api/src/middleware/auth.php` (ROLE_PERMISSIONS constant).
 *
 * Used for TypeScript-side validation and property testing.
 */

import { type Role, ALL_ROLES, isValidRole } from './roles.js';

/**
 * Role-based permission map.
 * Defines which roles have access to which endpoint patterns.
 * Admin has access to everything; other roles have scoped access.
 *
 * Mirrors PHP: TerraAI\Middleware\ROLE_PERMISSIONS
 */
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  admin: ['*'],
  vendor: ['/vendors/*', '/trips/*', '/uploads/*', '/notifications/*', '/chat/*'],
  business: ['/business/*', '/trips/*', '/uploads/*', '/notifications/*', '/chat/*'],
  rider: ['/trips/*', '/riders/*', '/uploads/*', '/notifications/*', '/chat/*'],
  customer: ['/trips/*', '/customers/*', '/uploads/*', '/notifications/*', '/chat/*'],
} as const;

/**
 * Token validation status.
 */
export type TokenStatus = 'valid' | 'expired' | 'invalid' | 'missing';

/**
 * Result of an access control check.
 */
export interface AccessControlResult {
  /** HTTP status code: 200 for granted, 401 for auth failure, 403 for forbidden */
  statusCode: 200 | 401 | 403;
  /** Whether access is granted */
  granted: boolean;
  /** Error message if access is denied */
  error?: string;
}

/**
 * Checks whether a given role has permission to access the specified path.
 * Mirrors PHP function `hasPermission()` in auth.php.
 *
 * @param role - The user's role from custom:role claim
 * @param path - The request path being accessed (after /terra prefix stripped)
 * @returns True if the role has permission for the path
 */
export function hasPermission(role: string | null | undefined, path: string): boolean {
  if (!role || !isValidRole(role)) {
    return false;
  }

  const allowedPatterns = ROLE_PERMISSIONS[role] ?? [];

  for (const pattern of allowedPatterns) {
    if (pattern === '*') {
      return true;
    }

    if (matchPath(pattern, path)) {
      return true;
    }
  }

  return false;
}

/**
 * Matches a path against a pattern with wildcard support.
 * Patterns use * as a wildcard matching any characters.
 * Mirrors PHP function `matchPath()` in auth.php.
 *
 * @param pattern - The pattern (e.g., '/trips/*')
 * @param path - The actual request path
 * @returns True if the path matches the pattern
 */
export function matchPath(pattern: string, path: string): boolean {
  // Convert pattern to regex: escape special chars, then replace \* with .*
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexStr = '^' + escaped.replace(/\\\*/g, '.*') + '$';
  const regex = new RegExp(regexStr);
  return regex.test(path);
}

/**
 * Performs a full access control check combining token validation and role permission.
 *
 * Logic:
 * - If token is missing/invalid/expired → 401
 * - If token is valid but role lacks permission → 403
 * - If token is valid and role has permission → 200 (granted)
 *
 * @param tokenStatus - The validation status of the JWT token
 * @param role - The user's role extracted from the token (null if token is invalid)
 * @param path - The request path being accessed
 * @returns AccessControlResult with status code and grant decision
 */
export function checkAccess(
  tokenStatus: TokenStatus,
  role: string | null | undefined,
  path: string
): AccessControlResult {
  // Invalid/expired/missing tokens → 401
  if (tokenStatus === 'missing') {
    return {
      statusCode: 401,
      granted: false,
      error: 'Authentication credentials required',
    };
  }

  if (tokenStatus === 'invalid') {
    return {
      statusCode: 401,
      granted: false,
      error: 'Invalid token format',
    };
  }

  if (tokenStatus === 'expired') {
    return {
      statusCode: 401,
      granted: false,
      error: 'Token expired',
    };
  }

  // Token is valid — check role permissions
  if (!hasPermission(role, path)) {
    return {
      statusCode: 403,
      granted: false,
      error: 'Insufficient permissions',
    };
  }

  return {
    statusCode: 200,
    granted: true,
  };
}
