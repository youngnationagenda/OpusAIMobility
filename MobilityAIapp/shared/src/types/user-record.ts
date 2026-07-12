/**
 * TypeScript interfaces for user records.
 * Covers both the TerraAI MySQL source schema and the Cognito target attributes.
 */

import type { Role } from '../auth/roles.js';

/** User status values from the TerraAI database */
export type UserStatus = 'active' | 'suspended' | 'deleted';

/**
 * TerraAI database user record (source).
 * Maps to the `users` table in the TerraAI MySQL database.
 */
export interface TerraAIUserRecord {
  /** Auto-increment primary key */
  id: number;
  /** Unique email address */
  email: string;
  /** bcrypt-hashed password */
  passwordHash: string;
  /** User's full name */
  name: string;
  /** Phone number (may not be in E.164 format) */
  phone: string | null;
  /** User role */
  role: Role;
  /** Account status */
  status: UserStatus;
  /** ISO timestamp of account creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Cognito user attributes (target).
 * These are the attributes set when creating or migrating a user into Cognito.
 */
export interface CognitoUserAttributes {
  /** Email used as the username */
  email: string;
  /** User's display name */
  name: string;
  /** Phone number in E.164 format (e.g., +1234567890) */
  phoneNumber: string | null;
  /** User's role(s) stored in custom:role attribute */
  role: string;
  /** JSON-encoded permissions array stored in custom:permissions */
  permissions: string;
}

/**
 * Represents the result of processing a single user during migration.
 */
export interface UserMigrationOutcome {
  /** The user's email */
  email: string;
  /** The TerraAI user ID */
  sourceId: number;
  /** What action was taken */
  action: 'created' | 'merged' | 'skipped';
  /** If merged, the existing Cognito username */
  cognitoUsername?: string;
  /** If skipped, the reason */
  reason?: string;
}

/**
 * Merge event logged when a TerraAI user's email already exists in Cognito.
 */
export interface UserMergeEvent {
  /** TerraAI user ID */
  terraUserId: number;
  /** Cognito username (typically the same email) */
  cognitoUsername: string;
  /** Attributes that were copied from TerraAI to Cognito */
  copiedAttributes: string[];
  /** The role that was appended */
  appendedRole: string;
  /** ISO timestamp of the merge */
  timestamp: string;
}
