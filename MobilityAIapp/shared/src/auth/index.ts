/**
 * Auth helper utilities — JWT decode, role constants, Cognito config types, RBAC.
 */
export { ROLES, ALL_ROLES, isValidRole } from './roles.js';
export type { Role } from './roles.js';

export {
  decodeJwt,
  isTokenExpired,
  extractRole,
} from './jwt.js';
export type { CognitoJwtPayload, JwtHeader, DecodedJwt } from './jwt.js';

export {
  buildJwksUri,
  buildIssuerUrl,
  createPoolConfig,
} from './cognito-config.js';
export type { CognitoPoolConfig, CognitoAppClientConfig } from './cognito-config.js';

export {
  ROLE_PERMISSIONS,
  hasPermission,
  matchPath,
  checkAccess,
} from './rbac.js';
export type { TokenStatus, AccessControlResult } from './rbac.js';
