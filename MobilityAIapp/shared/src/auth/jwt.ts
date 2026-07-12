/**
 * JWT decode utilities for Cognito tokens.
 * These are lightweight helpers that decode without verification —
 * signature verification should be done by the auth middleware using JWKS.
 */

export interface CognitoJwtPayload {
  sub: string;
  iss: string;
  aud?: string;
  client_id?: string;
  token_use: 'id' | 'access';
  auth_time: number;
  exp: number;
  iat: number;
  email?: string;
  'custom:role'?: string;
  'custom:permissions'?: string;
  name?: string;
  phone_number?: string;
  [key: string]: unknown;
}

export interface JwtHeader {
  alg: string;
  kid: string;
  typ?: string;
}

export interface DecodedJwt {
  header: JwtHeader;
  payload: CognitoJwtPayload;
  signature: string;
}

/**
 * Decodes a JWT token without verifying the signature.
 * Use this for extracting claims only — always verify signatures server-side.
 *
 * @throws Error if the token is not a valid JWT structure (3 base64url-encoded parts)
 */
export function decodeJwt(token: string): DecodedJwt {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT: token must have exactly 3 parts');
  }

  const [headerB64, payloadB64, signature] = parts;

  const header = JSON.parse(base64UrlDecode(headerB64)) as JwtHeader;
  const payload = JSON.parse(base64UrlDecode(payloadB64)) as CognitoJwtPayload;

  return { header, payload, signature };
}

/**
 * Checks whether a JWT token has expired based on its `exp` claim.
 * Returns true if expired, false otherwise.
 *
 * @param payload - The decoded JWT payload
 * @param nowSeconds - Current time in seconds since epoch (defaults to Date.now() / 1000)
 */
export function isTokenExpired(
  payload: Pick<CognitoJwtPayload, 'exp'>,
  nowSeconds?: number
): boolean {
  const now = nowSeconds ?? Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Extracts the user's role from a decoded Cognito JWT payload.
 * Returns undefined if the custom:role claim is not present.
 */
export function extractRole(payload: CognitoJwtPayload): string | undefined {
  return payload['custom:role'];
}

/**
 * Decodes a base64url-encoded string to UTF-8.
 */
function base64UrlDecode(input: string): string {
  // Replace base64url characters with standard base64
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Pad with '=' to make length a multiple of 4
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }

  // Decode using Buffer (Node.js) or atob (browser)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}
