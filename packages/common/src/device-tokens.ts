/**
 * Device Token Management Module
 *
 * Implements token management logic for push notifications:
 * - Store at most 10 device tokens per user
 * - When 11th registered, remove oldest token
 * - On token rotation (same device, new token): replace previous token without duplicate
 * - On stale token detection (EndpointDisabled/InvalidParameter): remove token, log event
 *
 * Requirements: 10.2, 10.3, 10.4, 10.6
 */

/** Maximum number of device tokens allowed per user */
export const MAX_TOKENS_PER_USER = 10;

/** SNS error codes indicating a stale/invalid endpoint */
export const STALE_TOKEN_ERROR_CODES = ['EndpointDisabled', 'InvalidParameter'] as const;
export type StaleTokenErrorCode = (typeof STALE_TOKEN_ERROR_CODES)[number];

/** Represents a registered device token */
export interface DeviceToken {
  /** Unique token string from the device/OS */
  token: string;
  /** Device identifier (stable across token rotations) */
  deviceId: string;
  /** SNS platform endpoint ARN */
  endpointArn: string;
  /** Timestamp when the token was registered (ISO 8601) */
  registeredAt: string;
}

/** Log entry emitted when a stale token is removed */
export interface StaleTokenLogEntry {
  userId: string;
  endpointArn: string;
  removedAt: string;
  reason: StaleTokenErrorCode;
}

/** Result of a token registration operation */
export interface TokenRegistrationResult {
  /** The updated list of tokens for the user */
  tokens: DeviceToken[];
  /** Token that was removed (if any) due to limit or rotation */
  removedToken: DeviceToken | null;
  /** Whether this was a rotation (same device, new token) */
  wasRotation: boolean;
}

/** Result of a stale token removal operation */
export interface StaleTokenRemovalResult {
  /** The updated list of tokens for the user */
  tokens: DeviceToken[];
  /** The token that was removed */
  removedToken: DeviceToken;
  /** The log entry for the removal event */
  logEntry: StaleTokenLogEntry;
}

/**
 * Registers a new device token for a user.
 *
 * Rules:
 * 1. If the same deviceId already has a token, replace it (rotation) — no duplicate.
 * 2. After adding, if count exceeds MAX_TOKENS_PER_USER, remove the oldest token.
 * 3. At most MAX_TOKENS_PER_USER tokens are stored.
 *
 * @param existingTokens - Current tokens for the user (sorted oldest-first by registeredAt)
 * @param newToken - The new device token to register
 * @returns Registration result with updated token list
 */
export function registerDeviceToken(
  existingTokens: DeviceToken[],
  newToken: DeviceToken
): TokenRegistrationResult {
  let tokens = [...existingTokens];
  let removedToken: DeviceToken | null = null;
  let wasRotation = false;

  // Check for token rotation: same device, new token
  const existingIndex = tokens.findIndex((t) => t.deviceId === newToken.deviceId);

  if (existingIndex !== -1) {
    // Rotation: replace previous token for this device
    removedToken = tokens[existingIndex];
    tokens.splice(existingIndex, 1);
    wasRotation = true;
  }

  // Add the new token
  tokens.push(newToken);

  // Enforce the limit: if more than MAX_TOKENS_PER_USER, remove oldest
  if (tokens.length > MAX_TOKENS_PER_USER) {
    // Sort by registeredAt to find the oldest
    tokens.sort(
      (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
    );
    // Remove the oldest (first in sorted order)
    const oldest = tokens.shift()!;
    // Only set removedToken if we didn't already set it from rotation
    if (!wasRotation) {
      removedToken = oldest;
    } else {
      // In rare case of rotation + over-limit, the oldest was removed
      // but we already tracked the rotated one; overwrite with the limit removal
      removedToken = oldest;
    }
  }

  return { tokens, removedToken, wasRotation };
}

/**
 * Removes a stale device token detected via SNS error response.
 *
 * Called when SNS returns EndpointDisabled or InvalidParameter during a publish attempt.
 * Removes the token and produces a log entry with user ID, endpoint ARN, and timestamp.
 *
 * @param existingTokens - Current tokens for the user
 * @param staleEndpointArn - The ARN that returned an error
 * @param userId - The user ID owning the token
 * @param reason - The SNS error code that triggered removal
 * @param timestamp - The removal timestamp (ISO 8601)
 * @returns Removal result with updated tokens and log entry, or null if token not found
 */
export function removeStaleToken(
  existingTokens: DeviceToken[],
  staleEndpointArn: string,
  userId: string,
  reason: StaleTokenErrorCode,
  timestamp: string
): StaleTokenRemovalResult | null {
  const staleIndex = existingTokens.findIndex((t) => t.endpointArn === staleEndpointArn);

  if (staleIndex === -1) {
    return null;
  }

  const removedToken = existingTokens[staleIndex];
  const tokens = existingTokens.filter((_, i) => i !== staleIndex);

  const logEntry: StaleTokenLogEntry = {
    userId,
    endpointArn: staleEndpointArn,
    removedAt: timestamp,
    reason,
  };

  return { tokens, removedToken, logEntry };
}

/**
 * Checks if an SNS error code indicates a stale/invalid token.
 *
 * @param errorCode - The error code from SNS
 * @returns True if the error code indicates a stale token
 */
export function isStaleTokenError(errorCode: string): boolean {
  return (STALE_TOKEN_ERROR_CODES as readonly string[]).includes(errorCode);
}
