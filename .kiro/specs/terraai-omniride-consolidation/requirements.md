# Requirements Document

## Introduction

This document defines the requirements for consolidating TerraAI (a PHP-based API with MySQL/MariaDB database) into the existing OpusAIMobility AWS-hosted platform. The consolidation unifies both systems into a single application: one monorepo hosting Rider and Customer apps, one AWS backend (ECS Fargate or Lambda for PHP, existing Lambda for Node.js), one relational database on Amazon RDS, unified authentication via Cognito, and a single CI/CD pipeline. The result is a super-app that inherits OpusAIMobility's existing AWS infrastructure while absorbing TerraAI's data, services, and customer-facing mobile app.

## Glossary

- **OpusAIMobility_Platform**: The existing AWS-hosted React/TypeScript frontend and Node.js Lambda backend providing ride-hailing, logistics, food delivery, errand services, and related features.
- **TerraAI_API**: The existing PHP-based REST API that serves TerraAI's business logic, currently running on a separate host with its own MySQL/MariaDB database.
- **TerraAI_Database**: The MySQL or MariaDB relational database backing TerraAI_API, containing customer data, trip records, and service configurations.
- **Customer_App**: The TerraAI mobile application (Android APK) used by end-customers to book rides and interact with TerraAI services.
- **Debug_APK**: A debug-signed Android build of the Customer_App used for internal testing and QA.
- **Consolidated_Backend**: The unified backend combining OpusAIMobility's Node.js Lambda and TerraAI's PHP API, deployed on AWS within the same VPC.
- **RDS_Instance**: An Amazon RDS MySQL or Aurora Serverless instance hosting the migrated TerraAI_Database.
- **API_Gateway**: The AWS API Gateway routing external and internal HTTP requests to the appropriate Lambda function or ECS Fargate service.
- **Monorepo**: The single OpusAIMobility repository restructured to contain both the Rider app and Customer_App source code under a unified directory layout.
- **CI_CD_Pipeline**: The automated build, test, and deployment pipeline using GitHub Actions and/or AWS CodePipeline.
- **VPC**: The AWS Virtual Private Cloud network enclosing all backend services, databases, and internal communication channels.
- **Cognito_Pool**: The Amazon Cognito User Pool providing unified authentication and authorization for Rider and Customer users.
- **S3_Distribution_Bucket**: An Amazon S3 bucket used to store and distribute built APK artifacts via CloudFront.
- **Migration_Script**: An automated script that exports TerraAI_Database schema and data and imports it into the RDS_Instance.

## Requirements

### Requirement 1: Database Schema Export and Import

**User Story:** As a platform engineer, I want to migrate TerraAI's database to AWS RDS, so that all TerraAI data is hosted alongside OpusAIMobility's backend within the same cloud environment.

#### Acceptance Criteria

1. WHEN a migration is initiated, THE Migration_Script SHALL export the complete TerraAI_Database schema — including tables, indexes, constraints, stored procedures, views, triggers, and functions — using mysqldump or equivalent tooling.
2. WHEN the export completes successfully, THE Migration_Script SHALL verify the exported file is not corrupted (file size greater than zero and parseable by the target import tool) and then import the exported schema and data into the RDS_Instance such that source and destination row counts match per table.
3. WHEN the import is complete, THE RDS_Instance SHALL contain all tables, rows, and relationships from the original TerraAI_Database with referential integrity preserved, verified by confirming all foreign key constraints are valid and zero orphaned records exist.
4. IF the import encounters a constraint violation or data type mismatch, THEN THE Migration_Script SHALL log the specific error, halt the import, and produce a report identifying the affected records.
5. WHEN the migration is verified, THE Migration_Script SHALL produce a comparison report showing source row counts per table versus destination row counts per table with zero discrepancy.
6. IF the export fails or is interrupted before completion, THEN THE Migration_Script SHALL log the error, discard any partial export file, and report the failure reason and the last successfully exported object.

### Requirement 2: TerraAI API Connection String Reconfiguration

**User Story:** As a platform engineer, I want TerraAI's PHP API to connect to the AWS RDS endpoint, so that the API reads from and writes to the migrated database without code changes to business logic.

#### Acceptance Criteria

1. WHEN TerraAI_API is deployed to the Consolidated_Backend, THE TerraAI_API SHALL read database connection parameters (host, port, database name, username, and password) from environment variables rather than hardcoded values.
2. WHEN the environment variables point to the RDS_Instance endpoint, THE TerraAI_API SHALL establish a successful database connection within 5 seconds of the application process starting.
3. IF the RDS_Instance does not respond to a connection attempt within 5 seconds, THEN THE TerraAI_API SHALL return an HTTP 503 response with a JSON body containing an error field indicating database connectivity failure, and SHALL NOT expose internal host addresses or credentials in the response.
4. THE TerraAI_API SHALL use TLS 1.2 or higher for all connections to the RDS_Instance.
5. IF any required database environment variable (host, port, database name, username, or password) is missing or empty at application startup, THEN THE TerraAI_API SHALL refuse to start and SHALL log an error message identifying which variable is missing.

### Requirement 3: TerraAI PHP API Deployment on AWS

**User Story:** As a platform engineer, I want TerraAI's PHP API deployed on AWS within the same VPC as OpusAIMobility, so that internal service communication is fast and secure.

#### Acceptance Criteria

1. THE Consolidated_Backend SHALL host TerraAI_API as a containerized PHP service running on ECS Fargate or as a Lambda function using a custom PHP runtime container image, allocated between 512 MB and 2048 MB of memory and between 0.25 and 1 vCPU per task or function instance.
2. THE TerraAI_API container or function SHALL reside in private subnets within the same VPC as the OpusAIMobility_Platform Lambda and the RDS_Instance.
3. WHEN an HTTP request arrives at the API_Gateway targeting a configured TerraAI route prefix, THE API_Gateway SHALL route the request to the TerraAI_API service with a maximum integration timeout of 29 seconds.
4. WHEN OpusAIMobility_Platform Lambda invokes a TerraAI endpoint, THE request SHALL traverse the private VPC network without exiting to the public internet.
5. THE TerraAI_API service SHALL scale horizontally from a minimum of 0 to a maximum of 10 concurrent task instances (Fargate) or concurrency units (Lambda), triggering scale-out when average CPU utilization exceeds 70% and scale-in after utilization remains below 40% for 60 seconds.
6. THE TerraAI_API service SHALL expose a health check endpoint that returns an HTTP 200 response within 5 seconds, and the orchestration layer (ECS or Lambda) SHALL mark the service as unhealthy after 3 consecutive failed health checks.
7. IF the API_Gateway receives no response from the TerraAI_API service within the integration timeout, THEN THE API_Gateway SHALL return an error response indicating service unavailability to the caller without retrying the request.
8. IF the OpusAIMobility_Platform Lambda receives no response from the TerraAI_API within 10 seconds, THEN THE OpusAIMobility_Platform Lambda SHALL treat the invocation as failed and return an error indication to its caller.

### Requirement 4: Unified API Routing

**User Story:** As a developer, I want a single API Gateway exposing both OpusAIMobility and TerraAI endpoints, so that frontend clients use one base URL for all backend services.

#### Acceptance Criteria

1. THE API_Gateway SHALL route requests with path prefix `/terra/` to the TerraAI_API service, stripping the `/terra` prefix before forwarding (e.g., `/terra/chat` forwards as `/chat` to TerraAI_API).
2. THE API_Gateway SHALL route all requests that do not match the `/terra/` prefix to the existing OpusAIMobility_Platform Lambda function, preserving the original request path.
3. IF the TerraAI_API service does not respond within 29 seconds, THEN THE API_Gateway SHALL return an HTTP 504 response with a JSON body containing an error message indicating a gateway timeout.
4. IF a request path does not match any route handled by either the TerraAI_API service or the OpusAIMobility_Platform Lambda function, THEN THE API_Gateway SHALL return an HTTP 404 response with a JSON body containing an error message indicating the path was not found.
5. THE API_Gateway SHALL include CORS response headers on all responses: Access-Control-Allow-Origin set to `*`, Access-Control-Allow-Methods set to `GET, POST, PUT, PATCH, DELETE, OPTIONS`, and Access-Control-Allow-Headers set to `Content-Type, Authorization`.
6. THE API_Gateway SHALL support both HTTP/1.1 and HTTP/2 protocols for client connections.
7. WHEN the API_Gateway receives an OPTIONS request on any path, THE API_Gateway SHALL return an HTTP 200 response with the CORS headers specified in criterion 5 and an empty body.

### Requirement 5: Customer App Integration into Monorepo

**User Story:** As a mobile developer, I want the Customer_App source code housed within the OpusAIMobility monorepo, so that shared code, dependencies, and build tooling are managed in one place.

#### Acceptance Criteria

1. WHEN the Customer_App source code has been committed to the monorepo, THE Monorepo SHALL contain the complete Customer_App source tree under the path `/apps/customer/`, including all application modules, resource files, and a project-level build configuration file.
2. WHEN the Customer_App integration is committed, THE Monorepo SHALL retain the existing OpusAIMobility Rider app source under its current path structure, and the Rider app build command executed from the monorepo root SHALL complete without errors and produce its expected output artifacts unchanged.
3. WHEN a developer executes the Customer_App build command defined in the monorepo root workspace scripts (e.g., a workspace-scoped build task targeting the `customer` app), THE build system SHALL produce a signed release APK and a debug APK in the `/apps/customer/build/outputs/apk/` directory within 300 seconds on a clean build.
4. IF the Customer_App build command fails due to a missing shared dependency from the `/packages/` directory, THEN THE build system SHALL output an error message indicating which dependency is missing and the expected package path.
5. THE Customer_App SHALL reference shared libraries or utilities exclusively from a single common `/packages/` directory within the Monorepo, with at least one shared module extracted and imported by the Customer_App.

### Requirement 6: Debug APK Storage and Distribution

**User Story:** As a QA engineer, I want Debug APK builds stored in S3 and accessible via CloudFront, so that testers can download the latest build from a stable URL.

#### Acceptance Criteria

1. WHEN a Debug_APK build completes successfully in CI, THE CI_CD_Pipeline SHALL upload the Debug_APK to the S3_Distribution_Bucket under the path `/apks/customer/debug/` with the filename format `<app-name>-debug-<build-number>.apk`.
2. THE S3_Distribution_Bucket SHALL serve APK files through a CloudFront distribution with HTTPS enabled, returning responses with content-type `application/vnd.android.package-archive` and a Content-Disposition header that triggers a file download.
3. WHEN a tester requests the latest Debug_APK URL at the stable path `/apks/customer/debug/latest.apk`, THE CloudFront distribution SHALL return the most recently uploaded Debug_APK file with a cache TTL of no more than 5 minutes.
4. THE S3_Distribution_Bucket SHALL retain the 10 most recent Debug_APK builds per customer path, with older builds automatically removed by an S3 lifecycle policy.
5. IF the Debug_APK upload to S3_Distribution_Bucket fails during the CI build, THEN THE CI_CD_Pipeline SHALL fail the build job and report an error message indicating the upload failure reason within 30 seconds of the failed attempt.
6. WHEN the CI_CD_Pipeline uploads a new Debug_APK, THE CI_CD_Pipeline SHALL copy the uploaded file to the stable path `/apks/customer/debug/latest.apk` so that the stable URL always resolves to the most recent build.

### Requirement 7: Unified Authentication via Cognito

**User Story:** As an end-user, I want to log in once with the same credentials across Rider and Customer apps, so that I have a seamless experience regardless of which app I use.

#### Acceptance Criteria

1. THE Cognito_Pool SHALL authenticate users for both the Rider app and the Customer_App using the same user pool and identity records, such that a single set of credentials (email and password) grants access to both applications.
2. WHEN a user registered through the Customer_App attempts to sign in via the Rider app, THE Cognito_Pool SHALL authenticate the user successfully and issue JWT tokens without requiring re-registration.
3. THE Cognito_Pool SHALL issue JWT tokens containing a single-value `custom:role` attribute (maximum 50 characters) set to one of: `rider`, `customer`, `vendor`, `business`, or `admin`.
4. WHEN TerraAI_API receives a request with a valid, non-expired Cognito JWT in the Authorization header, THE TerraAI_API SHALL validate the token signature and expiration against the Cognito_Pool and grant access only to resources permitted for the user's `custom:role` value.
5. IF a token is expired or has an invalid signature, THEN THE TerraAI_API SHALL return an HTTP 401 response with a JSON body containing an `error` field indicating the reason for rejection.
6. IF the Authorization header is missing or the token is malformed (not a valid JWT structure), THEN THE TerraAI_API SHALL return an HTTP 401 response with a JSON body containing an `error` field indicating that authentication credentials are required.
7. IF a user presents a valid token but their `custom:role` does not have permission for the requested resource, THEN THE TerraAI_API SHALL return an HTTP 403 response with a JSON body containing an `error` field indicating insufficient permissions.

### Requirement 8: TerraAI User Data Migration to Cognito

**User Story:** As a platform engineer, I want existing TerraAI users migrated into the Cognito user pool, so that they can log in to the consolidated platform without resetting credentials.

#### Acceptance Criteria

1. WHEN user migration is executed, THE Migration_Script SHALL create Cognito user records for each user in the TerraAI_Database whose account status is not suspended or deleted, preserving email as the username, name as the `name` attribute, phone number as the `phone_number` attribute, and role mapped to the `custom:role` attribute.
2. WHEN a legacy TerraAI user signs in for the first time after migration, THE Cognito user migration Lambda trigger SHALL validate the supplied credentials against the TerraAI_Database password hashes and, upon successful validation, return the user attributes to Cognito within 5 seconds.
3. WHEN a migrated user signs in for the first time, THE Cognito_Pool SHALL confirm the user account and set the status to CONFIRMED without requiring email re-verification.
4. IF a TerraAI user's email already exists in the Cognito_Pool (from OpusAIMobility registration), THEN THE Migration_Script SHALL retain the existing Cognito record's password and login configuration, append the TerraAI `custom:role` value to the user's role attribute, copy any TerraAI-only attributes (phone number, name) that are absent in the existing record, and log the merge event including the TerraAI user ID and Cognito username.
5. IF the Migration_Script fails to create or merge a user record due to missing required fields or a Cognito API error, THEN THE Migration_Script SHALL skip that user, log the user identifier and failure reason, and continue processing remaining users.
6. WHEN user migration is complete, THE Migration_Script SHALL produce a summary report listing the total users processed, the count of successfully created records, the count of merged records, and the count of failed records with their identifiers.

### Requirement 9: File Storage Migration to S3

**User Story:** As a platform engineer, I want all TerraAI file uploads migrated to S3, so that file storage is centralized, durable, and served via CloudFront.

#### Acceptance Criteria

1. WHEN file migration is executed, THE Migration_Script SHALL copy all files from TerraAI's existing upload directory to the designated S3 bucket, preserving the original directory structure as key prefixes, and SHALL produce a report listing total files copied, total bytes transferred, and any files that failed to copy.
2. WHEN TerraAI_API processes a new file upload request, THE TerraAI_API SHALL store the file in the S3 bucket using the AWS SDK rather than local filesystem storage, rejecting files larger than 50 MB with an HTTP 413 response.
3. WHEN a client requests a previously uploaded file, THE TerraAI_API SHALL return a pre-signed S3 URL with an expiration of 1 hour or a CloudFront URL pointing to the file; IF the requested file does not exist, THE TerraAI_API SHALL return an HTTP 404 response.
4. THE S3 bucket storing uploads SHALL have versioning enabled and a lifecycle policy transitioning objects older than 90 days to S3 Infrequent Access.
5. IF a file upload to S3 fails due to a network or service error, THEN THE TerraAI_API SHALL retry the upload up to 3 times with exponential backoff and, if all retries fail, return an HTTP 502 response indicating the upload could not be completed.

### Requirement 10: Push Notification Unification

**User Story:** As an end-user, I want to receive push notifications from the consolidated platform regardless of whether I use the Customer or Rider app, so that I stay informed about rides, orders, and promotions.

#### Acceptance Criteria

1. WHEN TerraAI_API needs to send a push notification, THE TerraAI_API SHALL publish the notification payload (containing at minimum a title, a body message, and a notification type identifier) to the existing OpusAIMobility SNS topic.
2. THE Consolidated_Backend SHALL use SNS platform applications to deliver push notifications to both Android (FCM) and iOS (APNs) device endpoints, supporting up to 10 registered devices per user.
3. WHEN a user installs the Customer_App or Rider app and grants notification permissions, THE app SHALL register the device token with the Consolidated_Backend for the authenticated user within 10 seconds of permission grant.
4. IF a device token is invalid or expired (detected by an EndpointDisabled or InvalidParameter response from SNS during a publish attempt), THEN THE Consolidated_Backend SHALL remove the stale token from the user's registered endpoints and emit a structured log entry recording the user ID, the removed endpoint ARN, and the removal timestamp.
5. IF the SNS service is unreachable when TerraAI_API attempts to publish a notification, THEN THE TerraAI_API SHALL retry delivery up to 3 times with incremental back-off and, if all retries fail, log the failure and route the payload to a dead-letter queue for later reprocessing.
6. WHEN a user reinstalls an app or the device token is rotated by the OS, THE app SHALL re-register the new token with the Consolidated_Backend, and THE Consolidated_Backend SHALL replace the previous token for that device without creating a duplicate endpoint.

### Requirement 11: CI/CD Pipeline for Monorepo

**User Story:** As a developer, I want a single CI/CD pipeline that builds, tests, and deploys all components of the consolidated platform, so that releases are automated and consistent.

#### Acceptance Criteria

1. WHEN code is pushed to the `main` branch, THE CI_CD_Pipeline SHALL build the OpusAIMobility frontend, the Customer_App APK, and the TerraAI_API container image.
2. WHEN the build completes successfully, THE CI_CD_Pipeline SHALL deploy the OpusAIMobility frontend to S3, the TerraAI_API container to ECS Fargate or Lambda, and upload APK artifacts to the S3_Distribution_Bucket.
3. WHEN a pull request is opened or updated (synchronized) against `main`, THE CI_CD_Pipeline SHALL run type-checking, linting, and unit tests for all changed components without deploying.
4. THE CI_CD_Pipeline SHALL use path-based filtering so that changes only to `/apps/customer/` trigger only the Customer_App build, and changes only to `/aws/lambda/` trigger only the Lambda deploy; changes to shared paths (root config files, `/packages/`) SHALL trigger builds for all dependent components.
5. IF any build or test step fails, THEN THE CI_CD_Pipeline SHALL halt the pipeline, mark the run as failed, and post a summary of failures to the pull request or commit status.
6. THE CI_CD_Pipeline SHALL enforce a maximum build timeout of 20 minutes per component; IF a component build exceeds this timeout, THEN THE pipeline SHALL cancel that step and mark it as failed.
7. WHEN deployment completes for the TerraAI_API service, THE CI_CD_Pipeline SHALL invoke the health check endpoint and confirm an HTTP 200 response before marking the deployment as successful.

### Requirement 12: Monitoring and Observability

**User Story:** As an operations engineer, I want unified monitoring across all consolidated services, so that I can detect, diagnose, and resolve issues from a single dashboard.

#### Acceptance Criteria

1. THE TerraAI_API service SHALL emit structured logs to CloudWatch Logs in JSON format including request ID, endpoint path, response status code, and latency in milliseconds, with a log retention period of at least 30 days.
2. THE TerraAI_API service SHALL emit custom CloudWatch metrics with a 60-second aggregation period for request count, error count (HTTP 5xx responses), and P95 latency per endpoint.
3. WHERE X-Ray tracing is enabled, THE Consolidated_Backend SHALL propagate trace headers between the API_Gateway, OpusAIMobility Lambda, TerraAI_API, and the RDS_Instance such that a single trace ID links all segments of a request path.
4. WHEN the TerraAI_API HTTP 5xx response rate exceeds 5% of requests within a 5-minute evaluation window with a minimum of 10 requests in that window, THE CloudWatch alarm SHALL trigger a notification to the operations SNS topic.
5. THE Consolidated_Backend SHALL enable AWS GuardDuty for threat detection across the VPC, S3 buckets, and IAM activity, and WHEN GuardDuty generates a finding with severity HIGH or CRITICAL, THE Consolidated_Backend SHALL publish a notification to the operations SNS topic within 5 minutes of finding generation.
6. THE Consolidated_Backend SHALL provide a CloudWatch dashboard that displays TerraAI_API request count, error count, P95 latency, active alarm states, and X-Ray service map in a single view.

### Requirement 13: Network Security and Isolation

**User Story:** As a security engineer, I want all backend services isolated in private subnets with least-privilege networking, so that the attack surface is minimized.

#### Acceptance Criteria

1. THE RDS_Instance SHALL reside in private subnets with no public IP address and accept connections only from the VPC security group assigned to the Consolidated_Backend services.
2. THE TerraAI_API ECS tasks or Lambda functions SHALL reside in private subnets, access the internet only through a NAT Gateway for outbound calls, and restrict outbound security group rules to only the specific destination ports required by external dependencies (e.g., port 443 for HTTPS to payment providers) rather than allowing all outbound traffic.
3. THE API_Gateway SHALL be the sole public-facing entry point for all backend services, and no other resource within the VPC (including the RDS_Instance, ECS tasks, and Lambda functions) SHALL have a public IP address or be reachable from the internet on any port.
4. WHEN a security group rule is created for service-to-service communication, THE rule SHALL permit traffic only on the specific port required (e.g., 3306 for MySQL, 443 for HTTPS) and only from the source service's security group.
5. THE Consolidated_Backend SHALL store all secrets (database credentials, API keys, Cognito client secrets) in AWS Secrets Manager with automatic rotation enabled at an interval not exceeding 90 days, and SHALL NOT store secrets in environment variable plaintext or source code.
6. THE VPC SHALL have VPC Flow Logs enabled and publishing to CloudWatch Logs with a retention period of at least 30 days, capturing rejected traffic for security audit and anomaly detection.

### Requirement 14: Data Rollback and Recovery

**User Story:** As a platform engineer, I want the ability to roll back the database migration if critical issues are discovered post-migration, so that data integrity is preserved.

#### Acceptance Criteria

1. WHEN the migration is initiated, THE Migration_Script SHALL create a full snapshot of the RDS_Instance before importing TerraAI data; IF the snapshot creation fails, THEN THE Migration_Script SHALL halt and not proceed with the import.
2. IF a rollback is requested within 72 hours of migration, THEN THE platform team SHALL be able to restore the RDS_Instance to the pre-migration snapshot within 30 minutes, and after restoration THE Migration_Script SHALL verify the restored instance is accessible and contains the expected pre-migration table set.
3. THE RDS_Instance SHALL have automated daily backups enabled with a retention period of at least 7 days.
4. WHEN the migration is verified as successful (comparison report shows zero discrepancy and health check endpoint returns HTTP 200), THE Migration_Script SHALL tag the pre-migration snapshot as `migration-baseline` for future reference.
5. IF a rollback is requested after the 72-hour window has elapsed, THEN THE platform team SHALL use the most recent automated daily backup to restore the RDS_Instance and SHALL document any data created after the backup that will be lost.
