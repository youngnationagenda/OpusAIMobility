/**
 * Shared constants — error codes, HTTP status mappings, environment variable names.
 */
export { ERROR_CODES } from './error-codes.js';
export type { ErrorCode } from './error-codes.js';

export { HTTP_STATUS, ERROR_CODE_TO_HTTP_STATUS, ERROR_MESSAGES } from './http-status.js';
export type { HttpStatusCode } from './http-status.js';

export {
  DB_ENV_VARS,
  REQUIRED_DB_ENV_VARS,
  COGNITO_ENV_VARS,
  S3_ENV_VARS,
  SNS_ENV_VARS,
  DEPLOY_ENV_VARS,
  APP_ENV_VARS,
} from './env-vars.js';
