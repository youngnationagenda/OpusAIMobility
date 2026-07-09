# Implementation Plan: TerraAI–OpusAIMobility Consolidation

## Overview

This plan implements the full consolidation of TerraAI into the OpusAIMobility platform: monorepo restructuring, database migration scripts, PHP API containerization on ECS Fargate, unified API Gateway routing, Cognito user pool extension, S3/CloudFront APK distribution, CI/CD pipeline, monitoring, and network security. Property-based tests validate all 19 correctness properties defined in the design.

## Tasks

- [x] 1. Set up monorepo structure and shared packages
  - [x] 1.1 Create monorepo directory structure
    - Create `/apps/customer/` directory with placeholder build configuration for Android app
    - Create `/apps/terra-api/` directory for TerraAI PHP API source
    - Create `/infra/docker/terra-api/` for Dockerfile and nginx.conf
    - Create `/infra/ecs/` for ECS task definition
    - Create `/packages/common/` for shared utilities
    - Create `/scripts/migrate/` for migration tooling
    - Update root `package.json` with workspace configuration pointing to `packages/*` and `scripts/*`
    - _Requirements: 5.1, 5.5_

  - [x] 1.2 Implement shared common package
    - Create `/packages/common/package.json` with TypeScript configuration
    - Implement auth helper utilities (JWT decode, role constants, Cognito config types)
    - Implement shared constants (error codes, HTTP status mappings, environment variable names)
    - Implement shared TypeScript interfaces for migration reports, user records, and file metadata
    - Export all utilities from package entry point
    - _Requirements: 5.5_

  - [x] 1.3 Set up test framework with fast-check
    - Install `vitest` and `fast-check` as devDependencies in root workspace
    - Configure `vitest.config.ts` at root with path aliases for packages
    - Create `/tests/` directory structure matching design: `tests/migration/`, `tests/terra-api/`, `tests/routing/`, `tests/auth/`, `tests/notifications/`, `tests/ci/`
    - Add test script to root `package.json`: `"test": "vitest --run"`
    - _Requirements: 11.3_

- [x] 2. Implement database migration scripts
  - [x] 2.1 Implement RDS pre-migration snapshot script
    - Create `/scripts/migrate/snapshot.ts` that calls AWS SDK `createDBSnapshot` on target RDS instance
    - Accept RDS instance identifier and snapshot name as CLI arguments
    - Wait for snapshot status to become `available` before resolving
    - If snapshot creation fails, log error and exit with non-zero code
    - Tag successful snapshot with `migration-baseline` tag
    - _Requirements: 14.1, 14.4_

  - [x] 2.2 Implement database export script
    - Create `/scripts/migrate/export-db.ts` that executes `mysqldump` against source TerraAI database
    - Export complete schema including tables, indexes, constraints, stored procedures, views, triggers, and functions
    - Verify exported file: check file size > 0 and parseable (basic SQL syntax validation)
    - If export fails or is interrupted, discard partial file and log error with last successfully exported object
    - _Requirements: 1.1, 1.6_

  - [x] 2.3 Implement database import script
    - Create `/scripts/migrate/import-db.ts` that streams exported SQL into target RDS MySQL instance
    - Detect and handle constraint violations and data type mismatches: log specific error, halt import, produce error report with affected records
    - On successful import, proceed to verification step
    - _Requirements: 1.2, 1.4_

  - [x] 2.4 Implement row count verification and comparison report
    - Create `/scripts/migrate/verify.ts` that queries source and destination databases for row counts per table
    - Compare counts and produce a comparison report JSON showing per-table source vs destination counts
    - Report zero discrepancy for success or list tables with non-zero discrepancy
    - Verify referential integrity: check all FK constraints are valid and zero orphaned records exist
    - _Requirements: 1.3, 1.5_

  - [x] 2.5 Write property test for row count comparison accuracy
    - **Property 1: Row Count Comparison Accuracy**
    - **Validates: Requirements 1.2, 1.5**
    - Create `tests/migration/row-count.property.test.ts`
    - Generate arbitrary pairs of source/destination row count maps
    - Assert comparison function correctly identifies matching vs discrepant tables

  - [x] 2.6 Write property test for constraint violation detection
    - **Property 2: Constraint Violation Detection and Halt**
    - **Validates: Requirements 1.4**
    - Create `tests/migration/constraint-violation.property.test.ts`
    - Generate arbitrary datasets with at least one FK violation or type mismatch
    - Assert import logic detects violation, halts, and reports affected table/record

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement TerraAI PHP API containerization
  - [x] 4.1 Create TerraAI API Dockerfile and Nginx configuration
    - Create `/infra/docker/terra-api/Dockerfile` based on `php:8.2-fpm-alpine`
    - Install extensions: `pdo_mysql`, `mysqli`, AWS X-Ray SDK
    - Create `/infra/docker/terra-api/nginx.conf` with PHP-FPM upstream and health check location
    - Expose port 80, configure CMD to start both php-fpm and nginx
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Implement environment variable validation at startup
    - Create `/apps/terra-api/src/bootstrap.php` that validates all required env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
    - If any required variable is missing or empty, log which variable is missing and exit with non-zero code
    - Implement TLS connection to RDS using `MYSQLI_CLIENT_SSL` flag
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 4.3 Implement health check endpoint
    - Create `/apps/terra-api/src/health.php` that tests DB connection and returns `{"status": "ok"}` (HTTP 200)
    - If DB connection fails within 5 seconds, return HTTP 503 with `{"error": "Database connectivity failure"}` (no internal addresses/credentials)
    - _Requirements: 3.6, 2.3_

  - [x] 4.4 Write property test for missing environment variable detection
    - **Property 3: Missing Environment Variable Detection**
    - **Validates: Requirements 2.5**
    - Create `tests/terra-api/env-validation.property.test.ts`
    - Generate arbitrary subsets of required env vars with at least one missing/empty
    - Assert startup logic refuses to start and logs which variable is missing

  - [x] 4.5 Create ECS Fargate task definition
    - Create `/infra/ecs/task-def.json` with: 1024 MB memory, 0.5 vCPU, PHP-FPM + Nginx container
    - Configure environment variables sourced from Secrets Manager ARNs
    - Configure CloudWatch log driver pointing to `/ecs/terraai-api` log group
    - Set health check command: `curl -f http://localhost/health || exit 1` with 3 retries
    - Configure auto-scaling: min 0, max 10, scale-out at CPU > 70%, scale-in at CPU < 40% for 60s
    - _Requirements: 3.1, 3.5, 3.6_

- [x] 5. Implement API Gateway routing
  - [x] 5.1 Implement path routing logic module
    - Create `/packages/common/src/routing.ts` with functions: `routeRequest(path)` returns `{target: 'terra' | 'opusaimobility', forwardedPath: string}`
    - For paths starting with `/terra/`, strip prefix and return target `terra`
    - For all other paths, return target `opusaimobility` with original path unchanged
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Write property test for TerraAI prefix strip
    - **Property 4: API Gateway Path Routing — TerraAI Prefix Strip**
    - **Validates: Requirements 4.1**
    - Create `tests/routing/terra-prefix.property.test.ts`
    - Generate arbitrary paths starting with `/terra/`
    - Assert prefix is stripped and remainder forwarded correctly

  - [x] 5.3 Write property test for default routing to OpusAIMobility
    - **Property 5: API Gateway Path Routing — Default to OpusAIMobility**
    - **Validates: Requirements 4.2**
    - Create `tests/routing/default-route.property.test.ts`
    - Generate arbitrary paths NOT starting with `/terra/`
    - Assert path is forwarded unchanged to OpusAIMobility Lambda

  - [x] 5.4 Implement CORS middleware
    - Create `/packages/common/src/cors.ts` with function `applyCorsHeaders(response)` that adds required headers
    - Add `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization`
    - Implement OPTIONS preflight handler returning HTTP 200 with CORS headers and empty body
    - _Requirements: 4.5, 4.7_

  - [x] 5.5 Write property test for CORS headers
    - **Property 6: CORS Headers Present on All Responses**
    - **Validates: Requirements 4.5, 4.7**
    - Create `tests/routing/cors.property.test.ts`
    - Generate arbitrary HTTP methods and paths
    - Assert all responses include required CORS headers; OPTIONS returns 200 with empty body

  - [x] 5.6 Create API Gateway configuration
    - Create `/infra/api-gateway/config.json` with HTTP API configuration
    - Add route `ANY /terra/{proxy+}` with VPC Link integration to ALB, 29s timeout, path rewrite removing `/terra`
    - Verify `$default` route continues pointing to existing OpusAIMobility Lambda
    - Add 404 fallback returning `{"error": "Path not found"}`
    - Configure CORS settings at gateway level
    - Configure HTTP/1.1 and HTTP/2 support
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Cognito user pool extension and auth
  - [x] 7.1 Implement JWT validation middleware for TerraAI API
    - Create `/apps/terra-api/src/middleware/auth.php` that validates Cognito JWT tokens
    - Validate token signature against Cognito JWKS endpoint, check expiration
    - Extract `custom:role` from token claims
    - Return HTTP 401 for missing/malformed/expired tokens with appropriate error messages
    - Return HTTP 403 for valid tokens with insufficient role
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [x] 7.2 Write property test for JWT role-based access control
    - **Property 7: JWT Role-Based Access Control**
    - **Validates: Requirements 7.4, 7.5, 7.7**
    - Create `tests/auth/rbac.property.test.ts`
    - Generate arbitrary role/endpoint combinations with defined permission requirements
    - Assert: valid token + permitted role → access granted; invalid/expired → 401; insufficient role → 403

  - [x] 7.3 Implement user migration Lambda trigger
    - Create `/aws/lambda/user-migration/index.ts` — Cognito User Migration Lambda Trigger
    - On sign-in when user not found locally: query TerraAI RDS for user by email
    - Validate supplied password against stored bcrypt hash
    - If valid, return user attributes (email, name, phone_number, custom:role) to Cognito
    - Set user status to CONFIRMED without email re-verification
    - If invalid credentials, deny authentication
    - _Requirements: 8.2, 8.3_

  - [x] 7.4 Write property test for legacy credential validation
    - **Property 9: Legacy Credential Validation Round-Trip**
    - **Validates: Requirements 8.2**
    - Create `tests/auth/legacy-credentials.property.test.ts`
    - Generate arbitrary passwords, hash with bcrypt, validate against hash
    - Assert correct passwords validate successfully, incorrect passwords fail

  - [x] 7.5 Create Cognito app client configuration for Customer App
    - Create `/infra/cognito/customer-client.json` defining `opusaimobility-customer-client` app client
    - Configure same user pool as existing rider client, separate client ID
    - Configure allowed OAuth flows and scopes matching rider client
    - _Requirements: 7.1, 7.2_

- [x] 8. Implement user data migration to Cognito
  - [x] 8.1 Implement user migration script
    - Create `/scripts/migrate/migrate-users.ts` that reads active users from TerraAI DB (status not suspended/deleted)
    - For each user: create Cognito record with email as username, name, phone_number (E.164 format), custom:role
    - Handle duplicates: if email exists in Cognito, preserve existing password, append TerraAI role, copy missing attributes, log merge event
    - On individual failure: skip user, log identifier + reason, continue processing
    - Produce summary report: total processed, created, merged, failed (with identifiers)
    - _Requirements: 8.1, 8.4, 8.5, 8.6_

  - [x] 8.2 Write property test for user migration attribute mapping
    - **Property 8: User Migration Attribute Mapping**
    - **Validates: Requirements 8.1**
    - Create `tests/migration/user-mapping.property.test.ts`
    - Generate arbitrary active TerraAI user records
    - Assert Cognito record has: email as username, name, phone_number (E.164), role as custom:role

  - [x] 8.3 Write property test for duplicate user merge
    - **Property 10: Duplicate User Merge Preserves Existing Credentials**
    - **Validates: Requirements 8.4**
    - Create `tests/migration/user-merge.property.test.ts`
    - Generate user existing in both TerraAI and Cognito
    - Assert: existing password preserved, role appended, TerraAI-only attributes copied, merge logged

  - [x] 8.4 Write property test for migration summary report accuracy
    - **Property 11: Migration Summary Report Accuracy**
    - **Validates: Requirements 8.6**
    - Create `tests/migration/report.property.test.ts`
    - Generate arbitrary sets of N created, M merged, K failed with specific IDs
    - Assert: totals = N+M+K, all K failed IDs listed with reasons

- [x] 9. Implement file storage migration to S3
  - [x] 9.1 Implement file migration script
    - Create `/scripts/migrate/migrate-files.ts` that copies all files from TerraAI upload directory to S3
    - Preserve original directory structure as S3 key prefixes
    - Produce report: total files copied, total bytes transferred, failed files
    - _Requirements: 9.1_

  - [x] 9.2 Write property test for file migration path preservation
    - **Property 12: File Migration Preserves Directory Structure**
    - **Validates: Requirements 9.1**
    - Create `tests/migration/file-path.property.test.ts`
    - Generate arbitrary relative file paths
    - Assert S3 key preserves directory structure as prefix

  - [x] 9.3 Implement S3 file upload handler in TerraAI API
    - Create `/apps/terra-api/src/handlers/upload.php` that stores files in S3 via AWS SDK
    - Reject files > 50 MB with HTTP 413 response before upload
    - Retry failed uploads up to 3 times with exponential backoff (1s, 2s, 4s)
    - If all retries fail, return HTTP 502
    - _Requirements: 9.2, 9.5_

  - [x] 9.4 Write property test for file upload size enforcement
    - **Property 13: File Upload Size Enforcement**
    - **Validates: Requirements 9.2**
    - Create `tests/terra-api/file-upload.property.test.ts`
    - Generate arbitrary file sizes
    - Assert: ≤ 50 MB stored successfully, > 50 MB rejected with HTTP 413

  - [x] 9.5 Implement file retrieval handler in TerraAI API
    - Create `/apps/terra-api/src/handlers/file-retrieval.php` that returns pre-signed S3 URL (1h expiry) for existing files
    - Return HTTP 404 if file key does not exist in S3
    - _Requirements: 9.3_

  - [x] 9.6 Write property test for file retrieval URL or 404
    - **Property 14: File Retrieval Returns URL or 404**
    - **Validates: Requirements 9.3**
    - Create `tests/terra-api/file-retrieval.property.test.ts`
    - Generate arbitrary file keys, mock S3 existence check
    - Assert: existing key → pre-signed URL with ≤ 1h expiry; non-existing key → HTTP 404

  - [x] 9.7 Create S3 bucket configuration with versioning and lifecycle policy
    - Create `/infra/s3/upload-bucket.json` with versioning enabled
    - Add lifecycle policy: transition objects older than 90 days to S3 Infrequent Access
    - _Requirements: 9.4_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement push notification unification
  - [x] 11.1 Implement notification publisher in TerraAI API
    - Create `/apps/terra-api/src/handlers/notifications.php` that publishes to OpusAIMobility SNS topic
    - Payload must include: title, body message, notification type identifier
    - Implement retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
    - If all retries fail, log failure and route to dead-letter queue
    - _Requirements: 10.1, 10.5_

  - [x] 11.2 Implement device token management
    - Create `/apps/terra-api/src/handlers/device-tokens.php` for token registration
    - Store at most 10 device tokens per user; when 11th registered, remove oldest
    - On token rotation (same device, new token): replace previous token without duplicate
    - On stale token detection (EndpointDisabled/InvalidParameter): remove token, log event with user ID, endpoint ARN, timestamp
    - _Requirements: 10.2, 10.3, 10.4, 10.6_

  - [x] 11.3 Write property test for device token limit
    - **Property 15: Device Token Limit Per User**
    - **Validates: Requirements 10.2**
    - Create `tests/notifications/token-limit.property.test.ts`
    - Generate arbitrary sequences of token registrations exceeding 10
    - Assert: at most 10 tokens stored; oldest removed when 11th added

  - [x] 11.4 Write property test for stale device token cleanup
    - **Property 16: Stale Device Token Cleanup**
    - **Validates: Requirements 10.4**
    - Create `tests/notifications/stale-token.property.test.ts`
    - Generate arbitrary user with tokens where one returns EndpointDisabled
    - Assert: stale token removed, log emitted with user ID, ARN, timestamp

  - [x] 11.5 Write property test for device token rotation without duplicates
    - **Property 17: Device Token Rotation Without Duplicates**
    - **Validates: Requirements 10.6**
    - Create `tests/notifications/token-rotation.property.test.ts`
    - Generate arbitrary same-device re-registrations
    - Assert: old token replaced by new, no duplicate endpoint created

- [x] 12. Implement S3/CloudFront APK distribution
  - [x] 12.1 Create S3 APK distribution bucket and CloudFront configuration
    - Create `/infra/s3/apk-distribution.json` with bucket `opusaimobility-apk-distribution`
    - Configure CloudFront behavior for `/apks/*`: cache TTL 300s for `latest.apk`, 31536000s for versioned
    - Set content-type `application/vnd.android.package-archive`, Content-Disposition for download
    - Create S3 lifecycle policy to retain only 10 most recent debug APKs
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 12.2 Implement APK upload step for CI pipeline
    - Create CI script `/scripts/ci/upload-apk.ts` that uploads built APK to S3 under `/apks/customer/debug/<app-name>-debug-<build-number>.apk`
    - Copy uploaded file to `/apks/customer/debug/latest.apk` for stable URL
    - If upload fails, exit with error within 30 seconds reporting failure reason
    - _Requirements: 6.1, 6.5, 6.6_

- [ ] 13. Implement CI/CD pipeline extension
  - [-] 13.1 Extend GitHub Actions deploy workflow
    - Modify `.github/workflows/deploy.yml` to add jobs: build TerraAI container, push to ECR, update ECS service, build Customer APK, upload APK to S3
    - Implement path-based filtering: `/apps/customer/**` → Customer APK only; `/aws/lambda/**` → Lambda only; `/infra/docker/terra-api/**` or `/apps/terra-api/**` → TerraAI container + ECS; `/packages/**` or root configs → all builds
    - Add post-deploy health check: invoke `/terra/health` and confirm HTTP 200
    - Set 20-minute timeout per component build
    - Add required secrets: `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `TERRA_HEALTH_URL`
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6, 11.7_

  - [-] 13.2 Extend PR check workflow
    - Modify `.github/workflows/pr-check.yml` to run type-checking, linting, and unit tests for all changed components on PR open/synchronize
    - Use path-based filtering consistent with deploy workflow
    - Halt and mark failed if any step fails, post summary to PR status
    - _Requirements: 11.3, 11.5_

  - [-] 13.3 Write property test for CI path filter correctness
    - **Property 18: CI Path Filter Correctness**
    - **Validates: Requirements 11.4**
    - Create `tests/ci/path-filter.property.test.ts`
    - Generate arbitrary sets of changed file paths
    - Assert: correct build jobs triggered for each path pattern; shared paths trigger all builds

- [ ] 14. Implement monitoring and observability
  - [ ] 14.1 Implement structured JSON logging in TerraAI API
    - Create `/apps/terra-api/src/middleware/logger.php` using Monolog with JSON formatter
    - Log each request with: `requestId`, `path`, `method`, `statusCode`, `latencyMs`, `timestamp`
    - Configure CloudWatch log group `/ecs/terraai-api` with 30-day retention in task definition
    - _Requirements: 12.1_

  - [ ] 14.2 Write property test for structured log completeness
    - **Property 19: Structured Log Completeness**
    - **Validates: Requirements 12.1**
    - Create `tests/terra-api/structured-log.property.test.ts`
    - Generate arbitrary HTTP requests with random paths, methods, status codes, latencies
    - Assert: emitted log is valid JSON containing `requestId` (non-empty), `path`, `statusCode` (integer), `latencyMs` (non-negative)

  - [ ] 14.3 Create CloudWatch metrics, alarms, and dashboard configuration
    - Create `/infra/monitoring/cloudwatch.json` with custom namespace `OpusAIMobility/TerraAI`
    - Define metrics: `RequestCount`, `ErrorCount` (5xx), `P95Latency` per endpoint at 60s period
    - Define alarm: 5xx rate > 5% within 5-min window (min 10 requests) → notify ops SNS topic
    - Define dashboard `OpusAIMobility-Consolidated` with widgets: request/error count, P95 latency, alarm status, X-Ray service map, RDS CPU/connections
    - _Requirements: 12.2, 12.4, 12.6_

  - [ ] 14.4 Configure X-Ray tracing and GuardDuty
    - Enable X-Ray on API Gateway and ECS task definition
    - Install `aws/aws-xray-sdk` in TerraAI PHP application (composer dependency)
    - Instrument outgoing MySQL and HTTP calls in PHP
    - Configure trace header propagation between API Gateway → Lambda → TerraAI → RDS
    - Enable GuardDuty for VPC, S3, IAM; create EventBridge rule to route HIGH/CRITICAL findings to ops SNS topic
    - _Requirements: 12.3, 12.5_

- [ ] 15. Implement network security configuration
  - [ ] 15.1 Create VPC security group definitions
    - Create `/infra/vpc/security-groups.json` defining all security groups per design:
    - `sg-terra-rds`: inbound 3306 from `sg-terra-ecs` and `sg-omni-lambda` only
    - `sg-terra-ecs`: inbound 80/443 from ALB SG and `sg-omni-lambda`; outbound 3306 to `sg-terra-rds`, 443 to NAT Gateway
    - `sg-omni-lambda`: outbound 443 to `sg-terra-ecs` and DynamoDB VPC endpoint
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 15.2 Configure Secrets Manager and VPC Flow Logs
    - Create `/infra/secrets/config.json` defining Secrets Manager secrets: DB credentials, API keys, Cognito client secrets
    - Configure automatic rotation at 90-day interval
    - Configure VPC Flow Logs to CloudWatch Logs with 30-day retention, capturing rejected traffic
    - _Requirements: 13.5, 13.6_

  - [ ] 15.3 Configure RDS network isolation
    - Define RDS subnet group in private data subnets (10.0.20.0/24, 10.0.21.0/24)
    - Confirm no public IP, Multi-AZ standby, automated daily backups with 7-day retention
    - Configure encryption with AWS-managed KMS key
    - _Requirements: 13.1, 14.3_

- [ ] 16. Implement data rollback and recovery
  - [ ] 16.1 Implement rollback procedures in migration script
    - Add rollback command to `/scripts/migrate/snapshot.ts` that restores RDS from pre-migration snapshot
    - Verify restored instance is accessible and contains expected pre-migration table set
    - Support restore within 30 minutes for requests within 72-hour window
    - For requests after 72 hours, restore from most recent daily backup and log data loss documentation
    - _Requirements: 14.1, 14.2, 14.5_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The TerraAI PHP API code lives in `/apps/terra-api/` while infrastructure config lives in `/infra/`
- Migration scripts are TypeScript/Node.js in `/scripts/migrate/`
- All property tests use fast-check with minimum 100 iterations per property

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "4.1", "5.1", "5.4"] },
    { "id": 3, "tasks": ["2.3", "4.2", "4.3", "5.2", "5.3", "5.5", "5.6"] },
    { "id": 4, "tasks": ["2.4", "4.4", "4.5", "7.1", "7.5"] },
    { "id": 5, "tasks": ["2.5", "2.6", "7.2", "7.3"] },
    { "id": 6, "tasks": ["7.4", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.5", "9.7"] },
    { "id": 9, "tasks": ["9.4", "9.6", "11.1", "11.2"] },
    { "id": 10, "tasks": ["11.3", "11.4", "11.5", "12.1", "12.2"] },
    { "id": 11, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 12, "tasks": ["14.1", "14.3", "14.4"] },
    { "id": 13, "tasks": ["14.2", "15.1", "15.2", "15.3"] },
    { "id": 14, "tasks": ["16.1"] }
  ]
}
```
