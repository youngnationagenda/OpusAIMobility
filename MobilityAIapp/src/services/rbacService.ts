/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility RBAC Service  —  AWS Cognito custom claims + Lambda authorizer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Permission model:
 *  • Roles are stored as Cognito User Pool custom attributes
 *  • Each admin action on API Gateway is validated by a Lambda authorizer
 *    that decodes the JWT and checks the `custom:permissions` claim
 *  • This file provides the frontend helpers for:
 *    - Displaying permission labels in AdminInterface
 *    - Local guard checks (prevent UI from rendering blocked routes)
 *    - Role → default permission mapping
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AdminRole, Permission } from '../types';

// ── Permission groups (displayed in AdminInterface RBAC panel) ───────────────
export const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  ops: {
    label:       'Operations & Fleet',
    permissions: ['fleet_read', 'fleet_write'],
  },
  merchants: {
    label:       'Vendor Management',
    permissions: ['vendor_read', 'vendor_write'],
  },
  finance: {
    label:       'Financials & Payouts',
    permissions: ['finance_read', 'payout_write'],
  },
  security: {
    label:       'Security & RBAC',
    permissions: ['audit_read', 'rbac_write', 'sys_config_write'],
  },
  collections: {
    label:       'Collection Accounts',
    permissions: ['wallet_approval', 'manage_collections'],
  },
};

// ── Default permission sets per role (mirrored in Lambda authorizer) ─────────
export const ROLE_DEFAULTS: Record<AdminRole, Permission[]> = {
  'Super Admin': [
    'fleet_read', 'fleet_write',
    'vendor_read', 'vendor_write',
    'finance_read', 'payout_write',
    'audit_read', 'rbac_write',
    'sys_config_write',
    'wallet_approval',
    'manage_collections',
  ],
  'Fleet Manager':  ['fleet_read', 'fleet_write', 'finance_read', 'audit_read'],
  'Vendor Liaison': ['vendor_read', 'vendor_write', 'fleet_read', 'audit_read'],
  'Support Lead':   ['fleet_read', 'vendor_read', 'audit_read'],
  'Finance Admin':  ['finance_read', 'payout_write', 'manage_collections', 'audit_read'],
};

// ── Human-readable labels (used in AdminInterface) ───────────────────────────
const PERMISSION_LABELS: Record<Permission, string> = {
  fleet_read:          'View Fleet Status',
  fleet_write:         'Modify Fleet / Drivers',
  vendor_read:         'View Merchants',
  vendor_write:        'Manage Merchant Menus',
  finance_read:        'Access Revenue Reports',
  payout_write:        'Approve Payouts',
  audit_read:          'View Audit Ledger',
  rbac_write:          'Manage Admin Roles',
  sys_config_write:    'Modify Platform Fees',
  wallet_approval:     'Approve Wallet Deposits',
  manage_collections:  'Manage Collection Accounts',
};

export const rbacApi = {

  getPermissionLabel: (p: Permission): string =>
    PERMISSION_LABELS[p] ?? p,

  /**
   * Frontend guard check.
   * NOTE: True authorisation happens in the Lambda authorizer that validates
   * the Cognito JWT `custom:permissions` claim on every API request.
   * This is only for hiding/showing UI elements.
   */
  hasPermission: (userPermissions: Permission[], required: Permission): boolean =>
    userPermissions.includes(required),

  /**
   * Returns the default permission set for a given admin role.
   * Used when creating new admin accounts in AdminInterface.
   */
  getDefaultPermissions: (role: AdminRole): Permission[] =>
    ROLE_DEFAULTS[role] ?? [],

  /**
   * Check if a Cognito JWT token's claims include the required permission.
   * Parses the JWT payload (base64) — does NOT verify signature (Lambda does that).
   */
  claimsHavePermission: (idToken: string, required: Permission): boolean => {
    try {
      const payload  = idToken.split('.')[1];
      const decoded  = JSON.parse(atob(payload));
      const perms: string[] = JSON.parse(decoded['custom:permissions'] ?? '[]');
      return perms.includes(required);
    } catch {
      return false;
    }
  },
};
