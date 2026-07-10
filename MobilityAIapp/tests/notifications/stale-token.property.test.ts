/**
 * Property 16: Stale Device Token Cleanup
 *
 * For any user with a device token that returns EndpointDisabled or InvalidParameter
 * from SNS during a publish attempt, the system SHALL remove that token from the user's
 * registered endpoints and emit a log entry with user ID, endpoint ARN, and removal timestamp.
 *
 * Validates: Requirements 10.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  removeStaleToken,
  STALE_TOKEN_ERROR_CODES,
  type DeviceToken,
  type StaleTokenErrorCode,
} from '@opusaimobility/common/device-tokens.js';

/**
 * Arbitrary ISO timestamp generator using integer range to avoid invalid date issues.
 */
const arbIsoTimestamp = (minYear = 2023, maxYear = 2025): fc.Arbitrary<string> =>
  fc
    .integer({
      min: new Date(`${minYear}-01-01T00:00:00Z`).getTime(),
      max: new Date(`${maxYear}-12-31T23:59:59Z`).getTime(),
    })
    .map((ms) => new Date(ms).toISOString());

/**
 * Arbitrary generator for a device token.
 */
const arbDeviceToken: fc.Arbitrary<DeviceToken> = fc.record({
  token: fc.stringMatching(/^[a-zA-Z0-9]{16,64}$/),
  deviceId: fc.stringMatching(/^device-[a-zA-Z0-9]{8}$/),
  endpointArn: fc.stringMatching(/^arn:aws:sns:us-east-1:\d{12}:endpoint\/[A-Za-z0-9-]{8,32}$/),
  registeredAt: arbIsoTimestamp(),
});

/**
 * Arbitrary generator for a user with 1–10 device tokens (unique endpointArns).
 */
const arbUserWithTokens: fc.Arbitrary<{ userId: string; tokens: DeviceToken[] }> = fc
  .record({
    userId: fc.stringMatching(/^user-[a-zA-Z0-9]{8,16}$/),
    tokens: fc
      .array(arbDeviceToken, { minLength: 1, maxLength: 10 })
      .map((tokens) => {
        // Ensure unique endpointArns by appending index
        return tokens.map((t, i) => ({
          ...t,
          endpointArn: `arn:aws:sns:us-east-1:123456789012:endpoint/tok-${i}-${t.deviceId}`,
        }));
      }),
  });

/**
 * Arbitrary stale token error code (EndpointDisabled or InvalidParameter).
 */
const arbStaleReason: fc.Arbitrary<StaleTokenErrorCode> = fc.constantFrom(
  ...STALE_TOKEN_ERROR_CODES
);

/**
 * Arbitrary ISO timestamp for the removal event.
 */
const arbTimestamp: fc.Arbitrary<string> = arbIsoTimestamp(2024, 2025);

describe('Feature: terraai-opusaimobility-consolidation, Property 16: Stale token cleanup', () => {
  it('stale token is removed from user tokens when EndpointDisabled/InvalidParameter detected', () => {
    fc.assert(
      fc.property(
        arbUserWithTokens,
        arbStaleReason,
        arbTimestamp,
        ({ userId, tokens }, reason, timestamp) => {
          // Pick a random token to mark as stale (use the first one for determinism)
          const staleToken = tokens[0];
          const staleArn = staleToken.endpointArn;

          const result = removeStaleToken(tokens, staleArn, userId, reason, timestamp);

          // Result should not be null since the token exists
          expect(result).not.toBeNull();

          // The stale token should be removed from the returned tokens
          const remainingArns = result!.tokens.map((t) => t.endpointArn);
          expect(remainingArns).not.toContain(staleArn);

          // The removed token should match the stale one
          expect(result!.removedToken.endpointArn).toBe(staleArn);

          // Token count should decrease by exactly 1
          expect(result!.tokens.length).toBe(tokens.length - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('log entry is emitted with user ID, ARN, and timestamp on stale token removal', () => {
    fc.assert(
      fc.property(
        arbUserWithTokens,
        arbStaleReason,
        arbTimestamp,
        ({ userId, tokens }, reason, timestamp) => {
          const staleToken = tokens[0];
          const staleArn = staleToken.endpointArn;

          const result = removeStaleToken(tokens, staleArn, userId, reason, timestamp);

          expect(result).not.toBeNull();

          // Log entry must contain user ID
          expect(result!.logEntry.userId).toBe(userId);

          // Log entry must contain the endpoint ARN
          expect(result!.logEntry.endpointArn).toBe(staleArn);

          // Log entry must contain removal timestamp
          expect(result!.logEntry.removedAt).toBe(timestamp);

          // Log entry must contain the reason
          expect(result!.logEntry.reason).toBe(reason);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns null when the stale ARN does not exist in user tokens', () => {
    fc.assert(
      fc.property(
        arbUserWithTokens,
        arbStaleReason,
        arbTimestamp,
        ({ userId, tokens }, reason, timestamp) => {
          // Use an ARN that does not match any token in the list
          const nonExistentArn = 'arn:aws:sns:us-east-1:999999999999:endpoint/non-existent-arn';

          const result = removeStaleToken(tokens, nonExistentArn, userId, reason, timestamp);

          // Should return null when the token is not found
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('other tokens remain unchanged after stale token removal', () => {
    fc.assert(
      fc.property(
        arbUserWithTokens.filter(({ tokens }) => tokens.length >= 2),
        arbStaleReason,
        arbTimestamp,
        ({ userId, tokens }, reason, timestamp) => {
          const staleToken = tokens[0];
          const staleArn = staleToken.endpointArn;

          const result = removeStaleToken(tokens, staleArn, userId, reason, timestamp);

          expect(result).not.toBeNull();

          // All non-stale tokens should be preserved
          const expectedRemaining = tokens.filter((t) => t.endpointArn !== staleArn);
          expect(result!.tokens).toEqual(expectedRemaining);
        }
      ),
      { numRuns: 100 }
    );
  });
});
