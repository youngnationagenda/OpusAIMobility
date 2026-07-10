/**
 * Property 17: Device Token Rotation Without Duplicates
 *
 * For any user re-registering a device token (same device, new token), the previous token
 * for that device SHALL be replaced by the new token without creating a duplicate endpoint entry.
 *
 * Validates: Requirements 10.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { registerDeviceToken, DeviceToken } from '@opusaimobility/common/device-tokens.js';

/**
 * Generates a DeviceToken with a specified deviceId index to ensure uniqueness.
 */
function makeToken(deviceIndex: number, tokenSuffix: string, dateOffset: number): DeviceToken {
  return {
    token: `tok-${deviceIndex}-${tokenSuffix}`,
    deviceId: `device-${deviceIndex}`,
    endpointArn: `arn:aws:sns:us-east-1:123456789012:endpoint/dev${deviceIndex}-${tokenSuffix}`,
    registeredAt: new Date(Date.UTC(2024, 0, 1) + dateOffset * 60000).toISOString(),
  };
}

/**
 * Generates a rotation scenario: a list of existing tokens with unique device IDs,
 * plus a new token for one of those devices (same deviceId, different token value).
 */
const arbRotationScenario: fc.Arbitrary<{ existing: DeviceToken[]; newToken: DeviceToken }> = fc
  .record({
    count: fc.integer({ min: 1, max: 9 }),
    rotateIndex: fc.nat(),
    tokenSuffixes: fc.array(fc.stringMatching(/^[a-z0-9]{4,8}$/), {
      minLength: 10,
      maxLength: 10,
    }),
    newSuffix: fc.stringMatching(/^[a-z0-9]{4,8}$/),
  })
  .map(({ count, rotateIndex, tokenSuffixes, newSuffix }) => {
    const existing: DeviceToken[] = [];
    for (let i = 0; i < count; i++) {
      existing.push(makeToken(i, tokenSuffixes[i] ?? `base${i}`, i));
    }
    const targetIndex = rotateIndex % count;
    const newToken: DeviceToken = {
      token: `tok-${targetIndex}-new-${newSuffix}`,
      deviceId: `device-${targetIndex}`,
      endpointArn: `arn:aws:sns:us-east-1:123456789012:endpoint/dev${targetIndex}-new-${newSuffix}`,
      registeredAt: new Date(Date.UTC(2024, 6, 1)).toISOString(),
    };
    return { existing, newToken };
  });

describe('Feature: terraai-opusaimobility-consolidation, Property 17: Token rotation', () => {
  it('re-registering a token for the same device replaces old token without duplicates', () => {
    fc.assert(
      fc.property(arbRotationScenario, ({ existing, newToken }) => {
        const result = registerDeviceToken(existing, newToken);

        // The result should indicate this was a rotation
        expect(result.wasRotation).toBe(true);

        // No duplicate device IDs in the result
        const deviceIds = result.tokens.map((t) => t.deviceId);
        const uniqueDeviceIds = new Set(deviceIds);
        expect(uniqueDeviceIds.size).toBe(deviceIds.length);

        // The new token should be present for the rotated device
        const rotatedEntry = result.tokens.find((t) => t.deviceId === newToken.deviceId);
        expect(rotatedEntry).toBeDefined();
        expect(rotatedEntry!.token).toBe(newToken.token);
        expect(rotatedEntry!.endpointArn).toBe(newToken.endpointArn);
      }),
      { numRuns: 100 }
    );
  });

  it('rotation does not increase the token count', () => {
    fc.assert(
      fc.property(arbRotationScenario, ({ existing, newToken }) => {
        const result = registerDeviceToken(existing, newToken);

        // Token count should stay the same after rotation (replace, not add)
        expect(result.tokens.length).toBe(existing.length);
      }),
      { numRuns: 100 }
    );
  });

  it('removed token in result matches the old token for the rotated device', () => {
    fc.assert(
      fc.property(arbRotationScenario, ({ existing, newToken }) => {
        const result = registerDeviceToken(existing, newToken);

        const oldToken = existing.find((t) => t.deviceId === newToken.deviceId);
        expect(oldToken).toBeDefined();

        // The removedToken should be the old token from the same device
        expect(result.removedToken).not.toBeNull();
        expect(result.removedToken!.deviceId).toBe(newToken.deviceId);
        expect(result.removedToken!.token).toBe(oldToken!.token);
      }),
      { numRuns: 100 }
    );
  });
});
