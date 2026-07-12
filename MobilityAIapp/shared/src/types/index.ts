/**
 * Shared TypeScript interfaces for the OpusAIMobility consolidated platform.
 */
export type {
  TableMigrationResult,
  DatabaseMigrationResult,
  UserMigrationFailure,
  UserMigrationResult,
  FileMigrationFailure,
  FileMigrationResult,
  MigrationStatus,
  MigrationReport,
  ConstraintViolation,
  ImportErrorReport,
} from './migration-report.js';

export type {
  UserStatus,
  TerraAIUserRecord,
  CognitoUserAttributes,
  UserMigrationOutcome,
  UserMergeEvent,
} from './user-record.js';

export type {
  FileUploadRecord,
  S3FileMetadata,
  FileRetrievalResponse,
  FileUploadValidation,
  FileMigrationEntry,
} from './file-metadata.js';

export { MAX_FILE_SIZE_BYTES } from './file-metadata.js';
