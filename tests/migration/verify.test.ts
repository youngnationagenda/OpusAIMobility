/**
 * Unit tests for the database verification script.
 * Tests the compareRowCounts function and validates correct discrepancy detection.
 *
 * Requirements: 1.3, 1.5
 */

import { describe, it, expect } from 'vitest';
import { compareRowCounts } from '../../scripts/migrate/verify';

describe('compareRowCounts', () => {
  it('should report zero discrepancy when source and destination counts match', () => {
    const source = { users: 100, trips: 500, uploads: 25 };
    const dest = { users: 100, trips: 500, uploads: 25 };

    const result = compareRowCounts(source, dest);

    expect(result.totalDiscrepancies).toBe(0);
    expect(result.foreignKeyValid).toBe(true);
    expect(result.orphanedRecords).toBe(0);
    for (const table of result.tables) {
      expect(table.discrepancy).toBe(0);
    }
  });

  it('should detect discrepancies between source and destination', () => {
    const source = { users: 100, trips: 500, uploads: 25 };
    const dest = { users: 98, trips: 500, uploads: 20 };

    const result = compareRowCounts(source, dest);

    expect(result.totalDiscrepancies).toBe(7); // |100-98| + |25-20| = 2 + 5
    const usersTable = result.tables.find((t) => t.name === 'users');
    expect(usersTable?.discrepancy).toBe(2);
    const uploadsTable = result.tables.find((t) => t.name === 'uploads');
    expect(uploadsTable?.discrepancy).toBe(5);
    const tripsTable = result.tables.find((t) => t.name === 'trips');
    expect(tripsTable?.discrepancy).toBe(0);
  });

  it('should handle tables that exist in source but not destination', () => {
    const source = { users: 50, trips: 200 };
    const dest = { users: 50 };

    const result = compareRowCounts(source, dest);

    expect(result.totalDiscrepancies).toBe(200);
    const tripsTable = result.tables.find((t) => t.name === 'trips');
    expect(tripsTable?.sourceRowCount).toBe(200);
    expect(tripsTable?.destRowCount).toBe(0);
    expect(tripsTable?.discrepancy).toBe(200);
  });

  it('should handle tables that exist in destination but not source', () => {
    const source = { users: 50 };
    const dest = { users: 50, extra_table: 10 };

    const result = compareRowCounts(source, dest);

    expect(result.totalDiscrepancies).toBe(10);
    const extraTable = result.tables.find((t) => t.name === 'extra_table');
    expect(extraTable?.sourceRowCount).toBe(0);
    expect(extraTable?.destRowCount).toBe(10);
    expect(extraTable?.discrepancy).toBe(-10);
  });

  it('should handle empty source and destination maps', () => {
    const result = compareRowCounts({}, {});

    expect(result.tables).toHaveLength(0);
    expect(result.totalDiscrepancies).toBe(0);
    expect(result.foreignKeyValid).toBe(true);
    expect(result.orphanedRecords).toBe(0);
  });

  it('should pass through foreignKeyValid and orphanedRecords values', () => {
    const source = { users: 10 };
    const dest = { users: 10 };

    const result = compareRowCounts(source, dest, false, 3);

    expect(result.foreignKeyValid).toBe(false);
    expect(result.orphanedRecords).toBe(3);
  });

  it('should sort tables alphabetically', () => {
    const source = { zebra: 1, alpha: 2, middle: 3 };
    const dest = { zebra: 1, alpha: 2, middle: 3 };

    const result = compareRowCounts(source, dest);

    const tableNames = result.tables.map((t) => t.name);
    expect(tableNames).toEqual(['alpha', 'middle', 'zebra']);
  });

  it('should handle negative discrepancies (more rows in dest than source)', () => {
    const source = { users: 10 };
    const dest = { users: 15 };

    const result = compareRowCounts(source, dest);

    const usersTable = result.tables.find((t) => t.name === 'users');
    expect(usersTable?.discrepancy).toBe(-5);
    // totalDiscrepancies should use absolute value
    expect(result.totalDiscrepancies).toBe(5);
  });
});
