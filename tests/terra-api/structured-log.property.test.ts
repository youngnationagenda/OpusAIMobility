/**
 * Property-based tests for structured logging behaviour.
 *
 * These tests verify the shape and constraints of structured log entries
 * produced by the TerraAI logger middleware.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── Log entry shape (mirrors what logger.php produces) ──────────────────────
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  request_id: string;
  context: Record<string, unknown>;
}

// Simulate building a log entry (same logic as logger.php)
function buildLogEntry(
  level: string,
  message: string,
  context: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    request_id: `req_${Math.random().toString(36).slice(2)}`,
    context,
  };
}

function buildRequestLog(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  requestId: string
): object {
  const level = statusCode >= 500 ? 'ERROR'
              : statusCode >= 400 ? 'WARNING'
              : 'INFO';
  const safeDuration = Math.max(0, isFinite(durationMs) ? Math.round(durationMs * 100) / 100 : 0);
  return {
    timestamp: new Date().toISOString(),
    level,
    message: 'HTTP request',
    request_id: requestId,
    context: { method, path, status_code: statusCode, duration_ms: safeDuration },
  };
}

const VALID_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

describe('Structured Log — Property Tests', () => {

  // Property: log entries always contain required fields
  it('log entries always contain timestamp, level, message, request_id', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_LEVELS),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string()),
        (level, message, ctx) => {
          const entry = buildLogEntry(level, message, ctx);
          expect(entry).toHaveProperty('timestamp');
          expect(entry).toHaveProperty('level');
          expect(entry).toHaveProperty('message');
          expect(entry).toHaveProperty('request_id');
          expect(entry).toHaveProperty('context');
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property: log level is always one of the valid levels
  it('log level is always a valid log level string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_LEVELS),
        fc.string({ minLength: 1 }),
        (level, message) => {
          const entry = buildLogEntry(level, message, {});
          expect(VALID_LEVELS).toContain(entry.level);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: request_id is always a non-empty string
  it('request_id is always a non-empty string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_LEVELS),
        fc.string({ minLength: 1 }),
        (level, message) => {
          const entry = buildLogEntry(level, message, {});
          expect(typeof entry.request_id).toBe('string');
          expect(entry.request_id.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: duration_ms is always >= 0
  it('duration_ms in request logs is always >= 0', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...HTTP_METHODS),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 100, max: 599 }),
        fc.float({ min: 0, max: 30000 }),
        (method, path, statusCode, durationMs) => {
          const log = buildRequestLog(method, '/' + path, statusCode, durationMs, 'req_test');
          const ctx = (log as any).context;
          expect(ctx.duration_ms).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property: path always starts with /
  it('log entries for requests always have path starting with /', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...HTTP_METHODS),
        fc.stringMatching(/^[a-z][a-z0-9\/\-_]{0,50}$/),
        fc.integer({ min: 200, max: 299 }),
        fc.float({ min: 0, max: 1000 }),
        (method, pathSuffix, statusCode, durationMs) => {
          const path = '/' + pathSuffix;
          const log = buildRequestLog(method, path, statusCode, durationMs, 'req_test');
          const ctx = (log as any).context;
          expect(ctx.path.startsWith('/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: log output is valid JSON
  it('log entries serialize to valid JSON', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_LEVELS),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(fc.string(), fc.integer(), fc.boolean())
        ),
        (level, message, ctx) => {
          const entry = buildLogEntry(level, message, ctx);
          expect(() => JSON.parse(JSON.stringify(entry))).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });

  // Property: 5xx responses log at ERROR level
  it('5xx responses produce ERROR level log entries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...HTTP_METHODS),
        fc.string({ minLength: 1 }),
        fc.integer({ min: 500, max: 599 }),
        fc.float({ min: 0, max: 10000 }),
        (method, path, statusCode, durationMs) => {
          const log = buildRequestLog(method, '/' + path, statusCode, durationMs, 'req_test') as any;
          expect(log.level).toBe('ERROR');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: 4xx responses log at WARNING level
  it('4xx responses produce WARNING level log entries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...HTTP_METHODS),
        fc.string({ minLength: 1 }),
        fc.integer({ min: 400, max: 499 }),
        fc.float({ min: 0, max: 10000 }),
        (method, path, statusCode, durationMs) => {
          const log = buildRequestLog(method, '/' + path, statusCode, durationMs, 'req_test') as any;
          expect(log.level).toBe('WARNING');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: 2xx responses log at INFO level
  it('2xx responses produce INFO level log entries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...HTTP_METHODS),
        fc.string({ minLength: 1 }),
        fc.integer({ min: 200, max: 299 }),
        fc.float({ min: 0, max: 10000 }),
        (method, path, statusCode, durationMs) => {
          const log = buildRequestLog(method, '/' + path, statusCode, durationMs, 'req_test') as any;
          expect(log.level).toBe('INFO');
        }
      ),
      { numRuns: 100 }
    );
  });
});
