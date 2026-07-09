/**
 * Property 2: Constraint Violation Detection and Halt
 *
 * For any dataset containing at least one referential integrity violation or data type mismatch,
 * the migration import logic SHALL detect the violation, halt processing, and produce a report
 * identifying the affected table and record(s).
 *
 * Validates: Requirements 1.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { classifyMySQLError, extractTableName } from '../../scripts/migrate/import-db';

/**
 * MySQL error codes mapped to their expected violation types.
 * These correspond to the CONSTRAINT_ERROR_CODES in import-db.ts.
 */
const FOREIGN_KEY_ERROR_CODES = [1216, 1217, 1451, 1452];
const DATA_TYPE_MISMATCH_CODES = [1264, 1265, 1366, 1406];
const UNIQUE_CONSTRAINT_CODES = [1062];
const NOT_NULL_CODES = [1048];

const ALL_CONSTRAINT_CODES = [
  ...FOREIGN_KEY_ERROR_CODES,
  ...DATA_TYPE_MISMATCH_CODES,
  ...UNIQUE_CONSTRAINT_CODES,
  ...NOT_NULL_CODES,
];

/**
 * Arbitrary generator for a MySQL error object with a constraint violation error code.
 */
const arbConstraintError = fc.record({
  errno: fc.constantFrom(...ALL_CONSTRAINT_CODES),
  code: fc.stringMatching(/^ER_[A-Z_]+$/),
  sqlMessage: fc.string({ minLength: 1, maxLength: 200 }),
});

/**
 * Arbitrary generator for a table name (valid SQL identifiers).
 */
const arbTableName = fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]{0,30}$/);

/**
 * Arbitrary generator for SQL INSERT statements that include a valid table name.
 */
const arbInsertStatement = arbTableName.chain((table) =>
  fc.record({
    table: fc.constant(table),
    statement: fc.constant(`INSERT INTO \`${table}\` (id, name) VALUES (1, 'test')`),
  })
);

/**
 * Arbitrary generator for SQL CREATE TABLE statements.
 */
const arbCreateStatement = arbTableName.chain((table) =>
  fc.record({
    table: fc.constant(table),
    statement: fc.constant(`CREATE TABLE \`${table}\` (id INT PRIMARY KEY)`),
  })
);

/**
 * Arbitrary generator for SQL ALTER TABLE statements.
 */
const arbAlterStatement = arbTableName.chain((table) =>
  fc.record({
    table: fc.constant(table),
    statement: fc.constant(`ALTER TABLE \`${table}\` ADD COLUMN name VARCHAR(100)`),
  })
);

/**
 * Arbitrary generator for SQL UPDATE statements.
 */
const arbUpdateStatement = arbTableName.chain((table) =>
  fc.record({
    table: fc.constant(table),
    statement: fc.constant(`UPDATE \`${table}\` SET name = 'test' WHERE id = 1`),
  })
);

/**
 * Arbitrary generator for SQL DELETE statements.
 */
const arbDeleteStatement = arbTableName.chain((table) =>
  fc.record({
    table: fc.constant(table),
    statement: fc.constant(`DELETE FROM \`${table}\` WHERE id = 1`),
  })
);

/**
 * Arbitrary generator for any SQL statement with an associated table name.
 */
const arbSqlStatement = fc.oneof(
  arbInsertStatement,
  arbCreateStatement,
  arbAlterStatement,
  arbUpdateStatement,
  arbDeleteStatement
);

/**
 * Arbitrary generator for MySQL error codes that are NOT constraint violations.
 * These should NOT be classified as constraint violations.
 */
const arbNonConstraintErrorCode = fc
  .integer({ min: 1000, max: 2000 })
  .filter((code) => !ALL_CONSTRAINT_CODES.includes(code));

describe('Feature: terraai-opusaimobility-consolidation, Property 2: Constraint violation detection', () => {
  it('classifyMySQLError detects constraint violations for all known error codes', () => {
    fc.assert(
      fc.property(arbConstraintError, arbSqlStatement, (error, { table, statement }) => {
        const result = classifyMySQLError(error, statement);

        // The function MUST detect and return a violation
        expect(result).toBeDefined();

        // The violation MUST identify the affected table
        expect(result!.table).toBe(table);

        // The violation MUST have a valid violation type
        expect(['foreign_key', 'data_type_mismatch', 'unique_constraint', 'not_null']).toContain(
          result!.violationType
        );

        // The violation MUST include affected records
        expect(result!.affectedRecords).toBeDefined();
        expect(result!.affectedRecords.length).toBeGreaterThan(0);

        // The violation MUST include an error message
        expect(result!.message).toBeDefined();
        expect(result!.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('classifyMySQLError correctly maps FK error codes to foreign_key violation type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FOREIGN_KEY_ERROR_CODES),
        arbSqlStatement,
        (errno, { statement }) => {
          const error = { errno, code: 'ER_FK', sqlMessage: 'FK violation' };
          const result = classifyMySQLError(error, statement);

          expect(result).toBeDefined();
          expect(result!.violationType).toBe('foreign_key');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('classifyMySQLError correctly maps data type error codes to data_type_mismatch violation type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DATA_TYPE_MISMATCH_CODES),
        arbSqlStatement,
        (errno, { statement }) => {
          const error = { errno, code: 'ER_DATA', sqlMessage: 'Data type mismatch' };
          const result = classifyMySQLError(error, statement);

          expect(result).toBeDefined();
          expect(result!.violationType).toBe('data_type_mismatch');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('classifyMySQLError correctly maps unique constraint error code', () => {
    fc.assert(
      fc.property(arbSqlStatement, ({ statement }) => {
        const error = { errno: 1062, code: 'ER_DUP_ENTRY', sqlMessage: 'Duplicate entry' };
        const result = classifyMySQLError(error, statement);

        expect(result).toBeDefined();
        expect(result!.violationType).toBe('unique_constraint');
      }),
      { numRuns: 100 }
    );
  });

  it('classifyMySQLError correctly maps not_null error code', () => {
    fc.assert(
      fc.property(arbSqlStatement, ({ statement }) => {
        const error = { errno: 1048, code: 'ER_BAD_NULL_ERROR', sqlMessage: 'Column cannot be null' };
        const result = classifyMySQLError(error, statement);

        expect(result).toBeDefined();
        expect(result!.violationType).toBe('not_null');
      }),
      { numRuns: 100 }
    );
  });

  it('classifyMySQLError returns undefined for non-constraint error codes', () => {
    fc.assert(
      fc.property(arbNonConstraintErrorCode, arbSqlStatement, (errno, { statement }) => {
        const error = { errno, code: 'ER_UNKNOWN', sqlMessage: 'Some other error' };
        const result = classifyMySQLError(error, statement);

        // Non-constraint errors should NOT be classified as violations
        expect(result).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('classifyMySQLError returns undefined for null/undefined/non-object errors', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.constant(undefined), fc.string(), fc.integer()),
        arbSqlStatement,
        (error, { statement }) => {
          const result = classifyMySQLError(error, statement);
          expect(result).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('extractTableName correctly extracts table names from arbitrary SQL statements', () => {
    fc.assert(
      fc.property(arbSqlStatement, ({ table, statement }) => {
        const extracted = extractTableName(statement);
        expect(extracted).toBe(table);
      }),
      { numRuns: 100 }
    );
  });
});
