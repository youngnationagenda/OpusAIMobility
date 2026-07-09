/**
 * Property 1: Row Count Comparison Accuracy
 *
 * For any pair of source and destination row count maps, the comparison function
 * SHALL correctly identify tables where counts match (discrepancy = 0) and tables
 * where counts differ (discrepancy ≠ 0), with totalDiscrepancies equal to the sum
 * of absolute discrepancies.
 *
 * Validates: Requirements 1.2, 1.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { compareRowCounts } from '../../scripts/migrate/verify';

/**
 * Arbitrary generator for table name → row count maps.
 * Generates between 1 and 20 tables with non-negative integer row counts.
 */
const arbRowCountMap: fc.Arbitrary<Record<string, number>> = fc
  .array(
    fc.tuple(
      fc.stringMatching(/^[a-z][a-z0-9_]{1,30}$/),
      fc.nat({ max: 1_000_000 })
    ),
    { minLength: 1, maxLength: 20 }
  )
  .map((entries) => Object.fromEntries(entries));

describe('Feature: terraai-opusaimobility-consolidation, Property 1: Row Count Comparison Accuracy', () => {
  it('correctly identifies matching tables (discrepancy = 0) when source and dest are identical', () => {
    fc.assert(
      fc.property(arbRowCountMap, (counts: Record<string, number>) => {
        const result = compareRowCounts(counts, counts);

        // Every table should have zero discrepancy when source === destination
        for (const table of result.tables) {
          expect(table.discrepancy).toBe(0);
          expect(table.sourceRowCount).toBe(table.destRowCount);
        }

        // Total discrepancies should be zero
        expect(result.totalDiscrepancies).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('correctly computes discrepancy as sourceRowCount - destRowCount for each table', () => {
    fc.assert(
      fc.property(arbRowCountMap, arbRowCountMap, (source, dest) => {
        const result = compareRowCounts(source, dest);

        // All tables from both maps should appear in result
        const allTableNames = new Set([
          ...Object.keys(source),
          ...Object.keys(dest),
        ]);
        const resultTableNames = new Set(result.tables.map((t) => t.name));
        expect(resultTableNames).toEqual(allTableNames);

        // Each table's discrepancy should be source - dest (defaulting to 0 for missing)
        for (const table of result.tables) {
          const expectedSource = source[table.name] ?? 0;
          const expectedDest = dest[table.name] ?? 0;
          expect(table.sourceRowCount).toBe(expectedSource);
          expect(table.destRowCount).toBe(expectedDest);
          expect(table.discrepancy).toBe(expectedSource - expectedDest);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('totalDiscrepancies equals sum of absolute discrepancies across all tables', () => {
    fc.assert(
      fc.property(arbRowCountMap, arbRowCountMap, (source, dest) => {
        const result = compareRowCounts(source, dest);

        const expectedTotal = result.tables.reduce(
          (sum, t) => sum + Math.abs(t.discrepancy),
          0
        );
        expect(result.totalDiscrepancies).toBe(expectedTotal);
      }),
      { numRuns: 100 }
    );
  });

  it('tables with discrepancy ≠ 0 have different source and dest counts', () => {
    fc.assert(
      fc.property(arbRowCountMap, arbRowCountMap, (source, dest) => {
        const result = compareRowCounts(source, dest);

        for (const table of result.tables) {
          if (table.discrepancy !== 0) {
            expect(table.sourceRowCount).not.toBe(table.destRowCount);
          } else {
            expect(table.sourceRowCount).toBe(table.destRowCount);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('tables only in source show destRowCount = 0', () => {
    fc.assert(
      fc.property(arbRowCountMap, (source) => {
        // Destination is empty — all source tables should show destRowCount = 0
        const result = compareRowCounts(source, {});

        for (const table of result.tables) {
          expect(table.destRowCount).toBe(0);
          expect(table.discrepancy).toBe(table.sourceRowCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('tables only in destination show sourceRowCount = 0', () => {
    fc.assert(
      fc.property(arbRowCountMap, (dest) => {
        // Source is empty — all dest tables should show sourceRowCount = 0
        const result = compareRowCounts({}, dest);

        for (const table of result.tables) {
          expect(table.sourceRowCount).toBe(0);
          expect(table.discrepancy).toBe(0 - table.destRowCount);
        }
      }),
      { numRuns: 100 }
    );
  });
});
