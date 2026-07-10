/**
 * Unit tests for Cognito User Migration Lambda Trigger
 *
 * Tests the core logic functions: password validation, phone formatting,
 * Cognito attribute building, and handler behavior.
 *
 * Validates: Requirements 8.2, 8.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  validatePassword,
  formatPhoneE164,
  buildCognitoAttributes,
  findUserByEmail,
  handler,
  type TerraAIUser,
  type CognitoUserMigrationEvent,
} from '../../aws/lambda/user-migration/index.js';

describe('User Migration Lambda Trigger', () => {
  describe('validatePassword', () => {
    it('returns true for correct password against bcrypt hash', async () => {
      const password = 'mySecurePassword123';
      const hash = await bcrypt.hash(password, 10);

      const result = await validatePassword(password, hash);
      expect(result).toBe(true);
    });

    it('returns false for incorrect password against bcrypt hash', async () => {
      const password = 'mySecurePassword123';
      const hash = await bcrypt.hash(password, 10);

      const result = await validatePassword('wrongPassword', hash);
      expect(result).toBe(false);
    });

    it('returns false for empty password', async () => {
      const hash = await bcrypt.hash('somePassword', 10);

      const result = await validatePassword('', hash);
      expect(result).toBe(false);
    });
  });

  describe('formatPhoneE164', () => {
    it('returns null for null input', () => {
      expect(formatPhoneE164(null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(formatPhoneE164('')).toBeNull();
    });

    it('returns null for whitespace-only string', () => {
      expect(formatPhoneE164('   ')).toBeNull();
    });

    it('preserves phone number already in E.164 format', () => {
      expect(formatPhoneE164('+1234567890')).toBe('+1234567890');
    });

    it('adds + prefix to number without it', () => {
      expect(formatPhoneE164('1234567890')).toBe('+1234567890');
    });

    it('strips spaces and dashes', () => {
      expect(formatPhoneE164('+1 234-567-890')).toBe('+1234567890');
    });

    it('strips parentheses', () => {
      expect(formatPhoneE164('+1 (234) 567-890')).toBe('+1234567890');
    });
  });

  describe('buildCognitoAttributes', () => {
    const baseUser: TerraAIUser = {
      id: 1,
      email: 'user@example.com',
      password_hash: '$2a$10$...',
      name: 'John Doe',
      phone: '+254712345678',
      role: 'customer',
      status: 'active',
    };

    it('maps email correctly', () => {
      const attrs = buildCognitoAttributes(baseUser);
      expect(attrs.email).toBe('user@example.com');
    });

    it('maps name correctly', () => {
      const attrs = buildCognitoAttributes(baseUser);
      expect(attrs.name).toBe('John Doe');
    });

    it('maps role to custom:role', () => {
      const attrs = buildCognitoAttributes(baseUser);
      expect(attrs['custom:role']).toBe('customer');
    });

    it('sets email_verified to true', () => {
      const attrs = buildCognitoAttributes(baseUser);
      expect(attrs.email_verified).toBe('true');
    });

    it('sets custom:permissions to empty array', () => {
      const attrs = buildCognitoAttributes(baseUser);
      expect(attrs['custom:permissions']).toBe('[]');
    });

    it('includes phone_number when phone is provided', () => {
      const attrs = buildCognitoAttributes(baseUser);
      expect(attrs['phone_number']).toBe('+254712345678');
      expect(attrs['phone_number_verified']).toBe('true');
    });

    it('excludes phone_number when phone is null', () => {
      const userNoPhone: TerraAIUser = { ...baseUser, phone: null };
      const attrs = buildCognitoAttributes(userNoPhone);
      expect(attrs['phone_number']).toBeUndefined();
      expect(attrs['phone_number_verified']).toBeUndefined();
    });

    it('excludes phone_number when phone is empty string', () => {
      const userEmptyPhone: TerraAIUser = { ...baseUser, phone: '' };
      const attrs = buildCognitoAttributes(userEmptyPhone);
      expect(attrs['phone_number']).toBeUndefined();
    });

    it('maps all roles correctly', () => {
      const roles = ['customer', 'rider', 'vendor', 'admin'] as const;
      for (const role of roles) {
        const user: TerraAIUser = { ...baseUser, role };
        const attrs = buildCognitoAttributes(user);
        expect(attrs['custom:role']).toBe(role);
      }
    });
  });

  describe('findUserByEmail', () => {
    it('returns null when no rows found', async () => {
      const mockConnection = {
        execute: vi.fn().mockResolvedValue([[], []]),
      } as any;

      const result = await findUserByEmail(mockConnection, 'notfound@example.com');
      expect(result).toBeNull();
    });

    it('returns null when user status is suspended', async () => {
      const mockConnection = {
        execute: vi.fn().mockResolvedValue([[{
          id: 1,
          email: 'user@example.com',
          password_hash: '$2a$10$...',
          name: 'Test User',
          phone: '+1234567890',
          role: 'customer',
          status: 'suspended',
        }], []]),
      } as any;

      const result = await findUserByEmail(mockConnection, 'user@example.com');
      expect(result).toBeNull();
    });

    it('returns null when user status is deleted', async () => {
      const mockConnection = {
        execute: vi.fn().mockResolvedValue([[{
          id: 1,
          email: 'user@example.com',
          password_hash: '$2a$10$...',
          name: 'Test User',
          phone: '+1234567890',
          role: 'customer',
          status: 'deleted',
        }], []]),
      } as any;

      const result = await findUserByEmail(mockConnection, 'user@example.com');
      expect(result).toBeNull();
    });

    it('returns user when status is active', async () => {
      const activeUser = {
        id: 1,
        email: 'user@example.com',
        password_hash: '$2a$10$...',
        name: 'Test User',
        phone: '+1234567890',
        role: 'customer',
        status: 'active',
      };
      const mockConnection = {
        execute: vi.fn().mockResolvedValue([[activeUser], []]),
      } as any;

      const result = await findUserByEmail(mockConnection, 'user@example.com');
      expect(result).toEqual(activeUser);
    });

    it('uses parameterized query with email', async () => {
      const mockConnection = {
        execute: vi.fn().mockResolvedValue([[], []]),
      } as any;

      await findUserByEmail(mockConnection, 'test@example.com');
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = ?'),
        ['test@example.com']
      );
    });
  });

  describe('handler', () => {
    const createEvent = (
      triggerSource: string,
      userName: string,
      password?: string
    ): CognitoUserMigrationEvent => ({
      version: '1',
      triggerSource: triggerSource as any,
      region: 'us-east-1',
      userPoolId: 'us-east-1_test123',
      userName,
      callerContext: {
        awsSdkVersion: '3.0.0',
        clientId: 'test-client-id',
      },
      request: {
        password,
      },
      response: {},
    });

    it('throws for unknown trigger source', async () => {
      const event = createEvent('UnknownTrigger', 'user@test.com', 'pass123');

      await expect(handler(event)).rejects.toThrow('Unknown trigger source');
    });

    it('throws when no password provided for authentication trigger', async () => {
      // Mock env vars so createDbConnection will work (it will still fail but after password check)
      const event = createEvent('UserMigration_Authentication', 'user@test.com', undefined);

      await expect(handler(event)).rejects.toThrow('Bad password');
    });
  });
});
