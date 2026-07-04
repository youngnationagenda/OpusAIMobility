/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OmniRide Audit Service  —  CloudWatch via API Gateway / Lambda
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every significant platform action is logged here.
 * Logs are:
 *  • Written immediately to a local in-memory + localStorage buffer
 *  • Shipped asynchronously to Lambda → CloudWatch Logs
 *  • Retrievable by admin from DynamoDB: omniride-audit-logs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { AuditLog } from '../types';
import { awsPost, awsGet } from './awsClient';
import { LAMBDA_ROUTES } from './awsConfig';

const CACHE_KEY = 'omniride-audit-logs';

// ── Seed in-memory store with cache on startup ──────────────────────────────
let memoryLogs: AuditLog[] = (() => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]') as AuditLog[];
  } catch {
    return [];
  }
})();

// ── Fallback seed records (shown before first API response) ─────────────────
if (memoryLogs.length === 0) {
  memoryLogs = [
    {
      id: 'LOG-BOOT-001',
      userId: 'adm_root',
      userName: 'Root Admin',
      action: 'SYSTEM_INIT',
      target: 'Platform',
      timestamp: Date.now() - 3_600_000,
      details: 'Platform initialised with AWS backend.',
      severity: 'low',
    },
    {
      id: 'LOG-BOOT-002',
      userId: 'adm_root',
      userName: 'Root Admin',
      action: 'UPDATE_PRICING',
      target: 'Platform Settings',
      timestamp: Date.now() - 7_200_000,
      details: 'Base fee adjusted from $2.00 to $2.50',
      severity: 'medium',
    },
    {
      id: 'LOG-BOOT-003',
      userId: 'adm_root',
      userName: 'Root Admin',
      action: 'ADMIN_REGISTER',
      target: 'RBAC Interface',
      timestamp: Date.now() - 86_400_000,
      details: 'Created new Fleet Manager account',
      severity: 'high',
    },
  ];
}

export const auditApi = {

  /**
   * Return all logs sorted newest-first.
   * Tries to fetch latest batch from DynamoDB via Lambda;
   * falls back to memory/cache on network failure.
   */
  getLogs: async (): Promise<AuditLog[]> => {
    const { data, error } = await awsGet<AuditLog[]>(
      LAMBDA_ROUTES.AUDIT_LOGS,
      CACHE_KEY,
    );

    if (!error && data && Array.isArray(data)) {
      memoryLogs = data;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* quota */ }
    }

    return [...memoryLogs].sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Log a platform action.
   * Writes immediately to memory/localStorage, then ships to CloudWatch
   * via Lambda (fire-and-forget — UI never waits for this).
   */
  logAction: (log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog => {
    const newLog: AuditLog = {
      ...log,
      id:        `LOG-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now()}`,
      timestamp: Date.now(),
    };

    // Immediate in-memory write (synchronous — always works offline)
    memoryLogs = [newLog, ...memoryLogs];
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(memoryLogs.slice(0, 500)), // cap at 500 local entries
      );
    } catch { /* quota */ }

    // Async ship to Lambda → CloudWatch + DynamoDB (non-blocking)
    awsPost(LAMBDA_ROUTES.AUDIT_LOG_ACTION, newLog)
      .catch(err => console.warn('[Audit] Remote log failed (offline?):', err));

    return newLog;
  },
};
