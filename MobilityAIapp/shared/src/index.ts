/**
 * @opusaimobility/common - Shared utilities for the OpusAIMobility consolidated platform
 *
 * This package provides shared auth helpers, constants, and TypeScript interfaces
 * used by both the OpusAIMobility Node.js backend and TerraAI PHP migration tooling.
 */

// Auth helpers — JWT decode, role constants, Cognito config types
export {
  ROLES,
  ALL_ROLES,
  isValidRole,
  decodeJwt,
  isTokenExpired,
  extractRole,
  buildJwksUri,
  buildIssuerUrl,
  createPoolConfig,
} from './auth/index.js';

export type {
  Role,
  CognitoJwtPayload,
  JwtHeader,
  DecodedJwt,
  CognitoPoolConfig,
  CognitoAppClientConfig,
} from './auth/index.js';

// Constants — error codes, HTTP status mappings, environment variable names
export {
  ERROR_CODES,
  HTTP_STATUS,
  ERROR_CODE_TO_HTTP_STATUS,
  ERROR_MESSAGES,
  DB_ENV_VARS,
  REQUIRED_DB_ENV_VARS,
  COGNITO_ENV_VARS,
  S3_ENV_VARS,
  SNS_ENV_VARS,
  DEPLOY_ENV_VARS,
  APP_ENV_VARS,
} from './constants/index.js';

export type { ErrorCode, HttpStatusCode } from './constants/index.js';

// Shared TypeScript interfaces
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
  UserStatus,
  TerraAIUserRecord,
  CognitoUserAttributes,
  UserMigrationOutcome,
  UserMergeEvent,
  FileUploadRecord,
  S3FileMetadata,
  FileRetrievalResponse,
  FileUploadValidation,
  FileMigrationEntry,
} from './types/index.js';

export { MAX_FILE_SIZE_BYTES } from './types/index.js';

// Routing — path routing utilities for unified API Gateway
export {
  TERRA_PATH_PREFIX,
  SUPPORTED_METHODS,
  CORS_CONFIG,
  resolveRoute,
  buildCorsHeaders,
} from './routing.js';

export type {
  HttpMethod,
  RouteTarget,
  RouteResult,
} from './routing.js';

// CORS middleware — apply CORS headers and handle preflight requests
export {
  applyCorsHeaders,
  handlePreflight,
} from './cors.js';

export type {
  CorsResponse,
  PreflightResponse,
} from './cors.js';

// Environment variable validation — mirrors PHP bootstrap.php behavior
export { validateEnvVars } from './env-validation.js';

export type { EnvValidationResult } from './env-validation.js';

// Device token management — push notification token CRUD
export {
  MAX_TOKENS_PER_USER,
  STALE_TOKEN_ERROR_CODES,
  registerDeviceToken,
  removeStaleToken,
  isStaleTokenError,
} from './device-tokens.js';

export type {
  StaleTokenErrorCode,
  DeviceToken,
  StaleTokenLogEntry,
  TokenRegistrationResult,
  StaleTokenRemovalResult,
} from './device-tokens.js';

// File retrieval logic — pre-signed URL or 404 decision
export {
  MAX_PRESIGNED_URL_EXPIRY_MS,
  MAX_PRESIGNED_URL_EXPIRY_SECONDS,
  resolveFileRetrieval,
  getExpiryDurationSeconds,
} from './file-retrieval.js';

export type {
  FileRetrievalSuccess,
  FileRetrievalNotFound,
  FileRetrievalResult,
  PreSignedUrlOptions,
} from './file-retrieval.js';

// File upload validation — mirrors PHP validateFileSize behavior
export { validateFileSize } from './file-validation.js';

export type { FileSizeValidationResult } from './file-validation.js';

// CI path filter — determines build jobs from changed file paths
export {
  BUILD_JOBS,
  ALL_BUILD_JOBS,
  getTriggeredJobs,
} from './ci-path-filter.js';

export type { BuildJob } from './ci-path-filter.js';
