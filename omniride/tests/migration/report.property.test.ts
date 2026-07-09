/**
 * Property 11: Migration Summary Report Accuracy
 *
 * For any set of migration outcomes (N created, M merged, K failed with specific IDs),
 * the summary report SHALL list totals that equal N+M+K for total processed, and SHALL
 * include all K failed identifiers with their failure reasons.
 *
 * Validates: Requirements 8.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildSummaryReport } from '../../scripts/migrate/migrate-users';
import type { UserMigrationResult, UserMigrationFailure } from '@opusaimobility/common';

/**
 * Arbitrary generator for a UserMigrationFailure entry.
 * Generates a userId (email-like string) and a non-empty reason string.
 */
const arbFailure: fc.Arbitrary<UserMigrationFailure> = fc.record({
  userId: fc.emailAddress(),
  reason: fc.string({ minLength: 1, maxLength: 200 }),
});

/**
 * Arbitrary generator for a complete UserMigrationResult.
 * Generates N created, M merged, and K failed entries where
 * totalProcessed = N + M + K.
 */
const arbMigrationResult: fc.Arbitrary<{
  created: number;
  merged: number;
  failed: UserMigrationFailure[];
}> = fc.record({
  created: fc.nat({ max: 500 }),
  merged: fc.nat({ max: 500 }),
  failed: fc.array(arbFailure, { minLength: 0, maxLength: 50 }),
});

describe('Feature: terraai-opusaimobility-consolidation, Property 11: Report accuracy', () => {
  it('totalProcessed equals created + merged + failed.length', () => {
    fc.assert(
      fc.property(arbMigrationResult, ({ created, merged, failed }) => {
        const input: UserMigrationResult = {
          totalProcessed: created + merged + failed.length,
          created,
          merged,
          failed,
        };

        const report = buildSummaryReport(input);

        expect(report.totalProcessed).toBe(created + merged + failed.length);
        expect(report.totalProcessed).toBe(report.created + report.merged + report.failed.length);
      }),
      { numRuns: 100 }
    );
  });

  it('all failed entries have userId and reason properties', () => {
    fc.assert(
      fc.property(arbMigrationResult, ({ created, merged, failed }) => {
        const input: UserMigrationResult = {
          totalProcessed: created + merged + failed.length,
          created,
          merged,
          failed,
        };

        const report = buildSummaryReport(input);

        // Every failed entry must have a non-empty userId and a non-empty reason
        for (const entry of report.failed) {
          expect(entry).toHaveProperty('userId');
          expect(entry).toHaveProperty('reason');
          expect(typeof entry.userId).toBe('string');
          expect(typeof entry.reason).toBe('string');
          expect(entry.userId.length).toBeGreaterThan(0);
          expect(entry.reason.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('report preserves all K failed identifiers exactly', () => {
    fc.assert(
      fc.property(arbMigrationResult, ({ created, merged, failed }) => {
        const input: UserMigrationResult = {
          totalProcessed: created + merged + failed.length,
          created,
          merged,
          failed,
        };

        const report = buildSummaryReport(input);

        // The count of failed entries must match K
        expect(report.failed.length).toBe(failed.length);

        // Each original failed entry must appear in the report
        for (let i = 0; i < failed.length; i++) {
          expect(report.failed[i].userId).toBe(failed[i].userId);
          expect(report.failed[i].reason).toBe(failed[i].reason);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('report created + merged counts are preserved correctly', () => {
    fc.assert(
      fc.property(arbMigrationResult, ({ created, merged, failed }) => {
        const input: UserMigrationResult = {
          totalProcessed: created + merged + failed.length,
          created,
          merged,
          failed,
        };

        const report = buildSummaryReport(input);

        expect(report.created).toBe(created);
        expect(report.merged).toBe(merged);
      }),
      { numRuns: 100 }
    );
  });

  it('totalProcessed is always non-negative and consistent', () => {
    fc.assert(
      fc.property(arbMigrationResult, ({ created, merged, failed }) => {
        const input: UserMigrationResult = {
          totalProcessed: created + merged + failed.length,
          created,
          merged,
          failed,
        };

        const report = buildSummaryReport(input);

        // totalProcessed must be non-negative
        expect(report.totalProcessed).toBeGreaterThanOrEqual(0);

        // Must be at least as large as any single component
        expect(report.totalProcessed).toBeGreaterThanOrEqual(report.created);
        expect(report.totalProcessed).toBeGreaterThanOrEqual(report.merged);
        expect(report.totalProcessed).toBeGreaterThanOrEqual(report.failed.length);
      }),
      { numRuns: 100 }
    );
  });
});
