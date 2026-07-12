/**
 * Environment variable names used across the consolidated platform.
 * Centralizing these prevents typos and makes refactoring easier.
 */

/** Required database environment variables for TerraAI API */
export const DB_ENV_VARS = {
  HOST: 'DB_HOST',
  PORT: 'DB_PORT',
  NAME: 'DB_NAME',
  USER: 'DB_USER',
  PASS: 'DB_PASS',
} as const;

/** All required DB env vars as an array (for validation loops) */
export const REQUIRED_DB_ENV_VARS: readonly string[] = Object.values(DB_ENV_VARS);

/** Cognito-related environment variables */
export const COGNITO_ENV_VARS = {
  USER_POOL_ID: 'COGNITO_USER_POOL_ID',
  REGION: 'COGNITO_REGION',
  CLIENT_ID_RIDER: 'COGNITO_CLIENT_ID_RIDER',
  CLIENT_ID_CUSTOMER: 'COGNITO_CLIENT_ID_CUSTOMER',
} as const;

/** S3-related environment variables */
export const S3_ENV_VARS = {
  UPLOAD_BUCKET: 'S3_UPLOAD_BUCKET',
  APK_BUCKET: 'S3_APK_BUCKET',
} as const;

/** SNS-related environment variables */
export const SNS_ENV_VARS = {
  TOPIC_ARN: 'SNS_TOPIC_ARN',
  OPS_ALERTS_TOPIC_ARN: 'SNS_OPS_ALERTS_TOPIC_ARN',
} as const;

/** ECS/deployment environment variables */
export const DEPLOY_ENV_VARS = {
  ECR_REPOSITORY: 'ECR_REPOSITORY',
  ECS_CLUSTER: 'ECS_CLUSTER',
  ECS_SERVICE: 'ECS_SERVICE',
  TERRA_HEALTH_URL: 'TERRA_HEALTH_URL',
} as const;

/** General application environment variables */
export const APP_ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  LOG_LEVEL: 'LOG_LEVEL',
  APP_PORT: 'APP_PORT',
} as const;
