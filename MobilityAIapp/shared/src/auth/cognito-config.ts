/**
 * Cognito configuration types for the unified user pool.
 */

export interface CognitoPoolConfig {
  /** The Cognito User Pool ID (e.g., us-east-1_AbCdEfGhI) */
  userPoolId: string;
  /** AWS region where the pool resides */
  region: string;
  /** JWKS URI for token signature verification */
  jwksUri: string;
  /** Token issuer URL */
  issuer: string;
}

export interface CognitoAppClientConfig {
  /** Unique app client ID */
  clientId: string;
  /** Human-readable client name */
  clientName: string;
  /** Allowed OAuth flows */
  allowedOAuthFlows: ('code' | 'implicit' | 'client_credentials')[];
  /** Allowed OAuth scopes */
  allowedOAuthScopes: string[];
  /** Callback URLs for OAuth */
  callbackUrls: string[];
  /** Logout URLs */
  logoutUrls: string[];
}

/**
 * Builds the JWKS URI for a given Cognito User Pool.
 */
export function buildJwksUri(region: string, userPoolId: string): string {
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
}

/**
 * Builds the token issuer URL for a given Cognito User Pool.
 */
export function buildIssuerUrl(region: string, userPoolId: string): string {
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
}

/**
 * Creates a CognitoPoolConfig from region and user pool ID.
 */
export function createPoolConfig(region: string, userPoolId: string): CognitoPoolConfig {
  return {
    userPoolId,
    region,
    jwksUri: buildJwksUri(region, userPoolId),
    issuer: buildIssuerUrl(region, userPoolId),
  };
}
