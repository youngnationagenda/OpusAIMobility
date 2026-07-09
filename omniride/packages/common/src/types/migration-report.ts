/**
 * TypeScript interfaces for migration reports.
 * Matches the Migration Report Schema defined in the design document.
 */


/** Row count comparison for a single database table */
export interface TableMigrationResult {
  /** Table name */
  name: string;
  /** Number of rows in the source database */
  sourceRowCount: number;
  /** Number of rows in the destination database */
  destRowCount: number;
  /** Difference between source and destination (source - dest) */
  discrepancy: number;
}

/** Database migration verification results */
export interface DatabaseMigrationResult {
  /** Per-table row count comparison */
  tables: TableMigrationResult[];
  /** Sum of all non-zero discrepancies */
  totalDiscrepancies: number;
  /** Whether all FK constraints are valid (no orphaned records) */
  foreignKeyValid: boolean;
  /** Count of orphaned records found (records referencing non-existent parents) */
  orphanedRecords: number;
}

/** A single user migration failure */
export interface UserMigrationFailure {
  /** The user's identifier (email or database ID) */
  userId: string;
  /** Reason for the failure */
  reason: string;
}

/** User migration summary */
export interface UserMigrationResult {
  /** Total users processed (created + merged + failed) */
  totalProcessed: number;
  /** Users successfully created in Cognito */
  created: number;
  /** Users merged with existing Cognito records */
  merged: number;
  /** Users that failed to migrate with reasons */
  failed: UserMigrationFailure[];
}

/** A single file migration failure */
export interface FileMigrationFailure {
  /** Path of the file that failed */
  path: string;
  /** Reason for the failure */
  reason: string;
}

/** File migration summary */
export interface FileMigrationResult {
  /** Total number of files copied */
  totalFiles: number;
  /** Total bytes transferred */
  totalBytes: number;
  /** Files that failed to copy */
  failed: FileMigrationFailure[];
}

/** Migration completion status */
export type MigrationStatus = 'success' | 'partial' | 'failed';

/** Complete migration report */
export interface MigrationReport {
  /** Unique migration run identifier (UUID) */
  migrationId: string;
  /** ISO 8601 timestamp when migration started */
  startedAt: string;
  /** ISO 8601 timestamp when migration completed (or failed) */
  completedAt: string;
  /** Database migration results */
  database: DatabaseMigrationResult;
  /** User migration results */
  users: UserMigrationResult;
  /** File migration results */
  files: FileMigrationResult;
  /** AWS snapshot ID of the pre-migration backup */
  snapshotId: string;
  /** Overall migration status */
  status: MigrationStatus;
}

/** Constraint violation details reported during import */
export interface ConstraintViolation {
  /** Table where the violation occurred */
  table: string;
  /** The specific record(s) that caused the violation */
  affectedRecords: string[];
  /** Type of violation */
  violationType: 'foreign_key' | 'data_type_mismatch' | 'unique_constraint' | 'not_null';
  /** Human-readable error message */
  message: string;
}

/** Import error report generated when import is halted */
export interface ImportErrorReport {
  /** Table being imported when the error occurred */
  table: string;
  /** Violations found */
  violations: ConstraintViolation[];
  /** Whether the import was halted */
  halted: boolean;
  /** Timestamp of the halt */
  timestamp: string;
}
