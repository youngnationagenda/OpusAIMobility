/**
 * Property 15: Device Token Limit Per User
 *
 * For any user, the notification system SHALL store at most 10 device tokens.
 * When an 11th token is registered, the oldest token SHALL be removed before
 * adding the new one.
 *
 * Validates: Requirements 10.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  registerDeviceToken,
  MAX_TOKENS_PER_USER,
  type DeviceToken,
} from '@opusaimobility/common/device-tokens.js';

/**
 * Generates a DeviceToken with a unique deviceId and token, using an index
 * to produce deterministic but distinct timestamps for ordering.
 */
function makeDeviceToken(index: number, deviceId: string, token: string): DeviceToken {
  // Use index to create ordered timestamps so we can reason about "oldest"
  const date = new Date(2024, 0, 1, 0, 0, index);
  return {
    token,
    deviceId,
    endpointArn: `arn:aws:sns:us-east-1:123456789:endpoint/${token}`,
    registeredAt: date.toISOString(),
  };
}

/**
 * Arbitrary generator for a sequence of unique device tokens exceeding MAX_TOKENS_PER_USER.
 * Each token has a unique deviceId to avoid rotation behavior.
 */
const arbTokenSequence: fc.Arbitrary<DeviceToken[]> = fc
  .integer({ min: MAX_TOKENS_PER_USER + 1, max: 25 })
  .chain((count) =>
    fc
      .array(
        fc.tuple(
          fc.stringMatching(/^[a-zA-Z0-9]{8,16}$/),
          fc.stringMatching(/^[a-zA-Z0-9]{16,32}$/)
        ),
        { minLength: count, maxLength: count }
      )
      .map((pairs) =>
        pairs.map(([deviceSuffix, tokenSuffix], i) =>
          makeDeviceToken(i, `device-${i}-${deviceSuffix}`, `token-${i}-${tokenSuffix}`)
        )
      )
  );

describe('Feature: terraai-opusaimobility-consolidation, Property 15: Device token limit', () => {
  it('at most MAX_TOKENS_PER_USER tokens are stored after any sequence of registrations', () => {
    fc.assert(
      fc.property(arbTokenSequence, (tokens: DeviceToken[]) => {
        let currentTokens: DeviceToken[] = [];

        // Register all tokens sequentially
        for (const newToken of tokens) {
          const result = registerDeviceToken(currentTokens, newToken);
          currentTokens = result.tokens;

          // Invariant: never exceed MAX_TOKENS_PER_USER
          expect(currentTokens.length).toBeLessThanOrEqual(MAX_TOKENS_PER_USER);
        }

        // After all registrations, should still be at most 10
        expect(currentTokens.length).toBeLessThanOrEqual(MAX_TOKENS_PER_USER);
      }),
      { numRuns: 100 }
    );
  });

  it('when 11th token is added, the oldest token is removed', () => {
    fc.assert(
      fc.property(arbTokenSequence, (tokens: DeviceToken[]) => {
        let currentTokens: DeviceToken[] = [];

        // Register first MAX_TOKENS_PER_USER tokens
        for (let i = 0; i < MAX_TOKENS_PER_USER && i < tokens.length; i++) {
          const result = registerDeviceToken(currentTokens, tokens[i]);
          currentTokens = result.tokens;
        }

        // Should have exactly MAX_TOKENS_PER_USER tokens now
        expect(currentTokens.length).toBe(MAX_TOKENS_PER_USER);

        // Identify the oldest token before adding the 11th
        const sortedBefore = [...currentTokens].sort(
          (a, b) =>
            new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
        );
        const oldestToken = sortedBefore[0];

        // Register the 11th token
        if (tokens.length > MAX_TOKENS_PER_USER) {
          const eleventhToken = tokens[MAX_TOKENS_PER_USER];
          const result = registerDeviceToken(currentTokens, eleventhToken);

          // Should still have exactly MAX_TOKENS_PER_USER tokens
          expect(result.tokens.length).toBe(MAX_TOKENS_PER_USER);

          // The oldest token should have been removed
          const hasOldest = result.tokens.some((t) => t.token === oldestToken.token);
          expect(hasOldest).toBe(false);

          // The removed token should be reported
          expect(result.removedToken).not.toBeNull();
          expect(result.removedToken!.token).toBe(oldestToken.token);

          // The new token should be present
          const hasNew = result.tokens.some((t) => t.token === eleventhToken.token);
          expect(hasNew).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('token count never exceeds 10 regardless of how many tokens are registered', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 15, max: 30 }),
        (count: number) => {
          let currentTokens: DeviceToken[] = [];

          for (let i = 0; i < count; i++) {
            const token = makeDeviceToken(i, `device-${i}`, `token-${i}`);
            const result = registerDeviceToken(currentTokens, token);
            currentTokens = result.tokens;

            // Invariant must hold at every step
            expect(currentTokens.length).toBeLessThanOrEqual(MAX_TOKENS_PER_USER);
          }

          // Final count should be exactly MAX_TOKENS_PER_USER
          expect(currentTokens.length).toBe(MAX_TOKENS_PER_USER);
        }
      ),
      { numRuns: 100 }
    );
  });
});
