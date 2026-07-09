/**
 * Property 8: User Migration Attribute Mapping
 *
 * For any active TerraAI user record, the migration logic SHALL produce a Cognito
 * record with: email as username, name, phone_number in E.164 format, and role
 * stored as custom:role.
 *
 * Validates: Requirements 8.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  mapUserToCognitoAttributes,
  normalizePhoneToE164,
} from '../../scripts/migrate/migrate-users';
import type { TerraAIUserRecord } from '@opusaimobility/common';
import { ALL_ROLES } from '@opusaimobility/common/auth/roles.js';

/**
 * Arbitrary generator for a valid E.164-style phone number (digits with optional leading +).
 * Generates phone numbers that include a country code (1-3 digits) and subscriber number (6-12 digits).
 */
const arbPhoneNumber: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('+', ''),
    fc.stringMatching(/^[1-9][0-9]{0,2}$/), // country code
    fc.stringMatching(/^[0-9]{6,12}$/) // subscriber number
  )
  .map(([prefix, country, subscriber]) => `${prefix}${country}${subscriber}`);

/**
 * Arbitrary generator for phone numbers with optional formatting characters.
 */
const arbFormattedPhone: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('+', ''),
    fc.stringMatching(/^[1-9][0-9]{0,2}$/),
    fc.stringMatching(/^[0-9]{6,12}$/)
  )
  .chain(([prefix, country, subscriber]) => {
    const raw = `${prefix}${country}${subscriber}`;
    return fc.constantFrom(
      raw,
      raw.replace(/(\d{3})(\d{3})/, '$1-$2'),
      raw.replace(/(\d{3})(\d{3})/, '($1) $2'),
      raw.replace(/(\d{3})(\d{3})/, '$1 $2')
    );
  });

/**
 * Arbitrary generator for a phone field that can be null or a formatted phone number.
 */
const arbPhoneField: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  arbFormattedPhone
);

/**
 * Arbitrary generator for a valid email address.
 */
const arbEmail: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9._]{1,15}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{1,10}$/),
    fc.constantFrom('com', 'org', 'net', 'io', 'dev')
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Arbitrary generator for a user's full name.
 */
const arbName: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[A-Z][a-z]{1,10}$/),
    fc.stringMatching(/^[A-Z][a-z]{1,15}$/)
  )
  .map(([first, last]) => `${first} ${last}`);

/**
 * Arbitrary generator for an active TerraAI user record.
 */
const arbActiveTerraAIUser: fc.Arbitrary<TerraAIUserRecord> = fc.record({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  email: arbEmail,
  passwordHash: fc.stringMatching(/^\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/),
  name: arbName,
  phone: arbPhoneField,
  role: fc.constantFrom(...ALL_ROLES),
  status: fc.constant('active' as const),
  createdAt: fc.integer({ min: 1577836800000, max: 1735689600000 }).map((ts) => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: 1577836800000, max: 1735689600000 }).map((ts) => new Date(ts).toISOString()),
});

describe('Feature: terraai-opusaimobility-consolidation, Property 8: User Migration Attribute Mapping', () => {
  it('mapUserToCognitoAttributes produces email attribute matching user email', () => {
    fc.assert(
      fc.property(arbActiveTerraAIUser, (user) => {
        const attributes = mapUserToCognitoAttributes(user);
        const emailAttr = attributes.find((a) => a.Name === 'email');

        expect(emailAttr).toBeDefined();
        expect(emailAttr!.Value).toBe(user.email);
      }),
      { numRuns: 100 }
    );
  });

  it('mapUserToCognitoAttributes produces name attribute matching user name', () => {
    fc.assert(
      fc.property(arbActiveTerraAIUser, (user) => {
        const attributes = mapUserToCognitoAttributes(user);
        const nameAttr = attributes.find((a) => a.Name === 'name');

        expect(nameAttr).toBeDefined();
        expect(nameAttr!.Value).toBe(user.name);
      }),
      { numRuns: 100 }
    );
  });

  it('mapUserToCognitoAttributes stores role as custom:role attribute', () => {
    fc.assert(
      fc.property(arbActiveTerraAIUser, (user) => {
        const attributes = mapUserToCognitoAttributes(user);
        const roleAttr = attributes.find((a) => a.Name === 'custom:role');

        expect(roleAttr).toBeDefined();
        expect(roleAttr!.Value).toBe(user.role);
      }),
      { numRuns: 100 }
    );
  });

  it('mapUserToCognitoAttributes produces phone_number in E.164 format when phone is provided', () => {
    // Generate only users with a non-null phone
    const arbUserWithPhone = arbActiveTerraAIUser.filter((u) => u.phone !== null && u.phone.trim() !== '');

    fc.assert(
      fc.property(arbUserWithPhone, (user) => {
        const attributes = mapUserToCognitoAttributes(user);
        const phoneAttr = attributes.find((a) => a.Name === 'phone_number');

        // Phone must be present in attributes
        expect(phoneAttr).toBeDefined();

        // E.164 format: starts with '+' followed by digits only
        expect(phoneAttr!.Value).toMatch(/^\+[0-9]+$/);
      }),
      { numRuns: 100 }
    );
  });

  it('mapUserToCognitoAttributes omits phone_number when phone is null', () => {
    const arbUserWithoutPhone: fc.Arbitrary<TerraAIUserRecord> = arbActiveTerraAIUser.map((u) => ({
      ...u,
      phone: null,
    }));

    fc.assert(
      fc.property(arbUserWithoutPhone, (user) => {
        const attributes = mapUserToCognitoAttributes(user);
        const phoneAttr = attributes.find((a) => a.Name === 'phone_number');

        // Phone should NOT be present when user.phone is null
        expect(phoneAttr).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('normalizePhoneToE164 always produces E.164 format for non-empty phone strings', () => {
    fc.assert(
      fc.property(arbFormattedPhone, (phone) => {
        const result = normalizePhoneToE164(phone);

        // Non-empty phones always produce a result
        expect(result).not.toBeNull();

        // Result must start with '+' and contain only digits after
        expect(result!).toMatch(/^\+[0-9]+$/);
      }),
      { numRuns: 100 }
    );
  });

  it('normalizePhoneToE164 returns null for null or empty phone', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t')
        ),
        (phone) => {
          const result = normalizePhoneToE164(phone);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all required Cognito attributes are present for any active user', () => {
    fc.assert(
      fc.property(arbActiveTerraAIUser, (user) => {
        const attributes = mapUserToCognitoAttributes(user);
        const attrNames = attributes.map((a) => a.Name);

        // Required attributes that must always be present
        expect(attrNames).toContain('email');
        expect(attrNames).toContain('name');
        expect(attrNames).toContain('custom:role');
        expect(attrNames).toContain('email_verified');

        // phone_number is conditionally present based on user.phone
        if (user.phone && user.phone.trim() !== '') {
          expect(attrNames).toContain('phone_number');
        }
      }),
      { numRuns: 100 }
    );
  });
});
