/**
 * Role constants for the unified Cognito user pool.
 * These roles are stored in the `custom:role` JWT claim (max 50 chars).
 */

export const ROLES = {
  RIDER: 'rider',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  BUSINESS: 'business',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** All valid role values */
export const ALL_ROLES: readonly Role[] = Object.values(ROLES);

/**
 * Checks whether a string is a valid Role value.
 */
export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && ALL_ROLES.includes(value as Role);
}
