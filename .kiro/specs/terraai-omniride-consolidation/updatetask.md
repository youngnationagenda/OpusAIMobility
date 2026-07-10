# Task Progress Update — TerraAI–OpusAIMobility Consolidation

> Recorded: 2026-07-08  
> Source of truth: `tasks.md` (same directory)  
> This file tracks what has been completed, what remains, and by whom.

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Completed | 43 tasks |
| ⏳ Partially done | 3 tasks (13.1, 13.2, 13.3) |
| ❌ Not started | 10 tasks |
| 🔵 Checkpoints pending | 4 checkpoints (3, 6, 10, 17) |

---

## ✅ COMPLETED TASKS

### 1. Monorepo Structure & Shared Packages
- **1.1** ✅ Monorepo directory structure created — *Kiro/Sonie*
- **1.2** ✅ Shared common package implemented (`packages/common/`) — *Sonie*
- **1.3** ✅ Test framework set up (vitest + fast-check, 147+ tests) — *Sonie*

### 2. Database Migration Scripts
- **2.1** ✅ RDS pre-migration snapshot script (`scripts/migrate/snapshot.ts`) — *Sonie*; extended with `restoreFromSnapshot()` + `--mode restore` CLI — *Claude*
- **2.2** ✅ Database export script (`scripts/migrate/export-db.ts`) — *Sonie*
- **2.3** ✅ Database import script (`scripts/migrate/import-db.ts`) — *Sonie*
- **2.4** ✅ Row count verification & comparison report (`scripts/migrate/verify.ts`) — *Sonie*
- **2.5** ✅ Property test: Row Count Comparison Accuracy — *Sonie*
- **2.6** ✅ Property test: Constraint Violation Detection — *Sonie*

### 4. TerraAI PHP API Containerization
- **4.1** ✅ Dockerfile + Nginx config (`infra/docker/terra-api/`) — *Sonie*
- **4.2** ✅ Env var validation at startup (`apps/terra-api/src/bootstrap.php`) — *Sonie*
- **4.3** ✅ Health check endpoint (`apps/terra-api/src/health.php`) — *Sonie*
- **4.4** ✅ Property test: Missing Env Var Detection — *Sonie*
- **4.5** ✅ ECS Fargate task definition (`infra/ecs/task-def.json`) — *Sonie*

### 5. API Gateway Routing
- **5.1** ✅ Path routing logic (`packages/common/src/routing.ts`) — *Sonie*
- **5.2** ✅ Property test: TerraAI Prefix Strip — *Sonie*
- **5.3** ✅ Property test: Default Routing to OpusAIMobility — *Sonie*
- **5.4** ✅ CORS middleware (`packages/common/src/cors.ts`) — *Sonie*
- **5.5** ✅ Property test: CORS Headers — *Sonie*
- **5.6** ✅ API Gateway configuration (`infra/api-gateway/config.json`) — *Sonie*; route `ANY /terra/{proxy+}` activated live — *Kiro*

### 7. Cognito User Pool Extension & Auth
- **7.1** ✅ JWT validation middleware (`apps/terra-api/src/middleware/auth.php`) — *Sonie*
- **7.2** ✅ Property test: JWT Role-Based Access Control — *Sonie*
- **7.3** ✅ User migration Lambda trigger (`aws/lambda/user-migration/index.ts`) — *Sonie*; deployed live + attached to Cognito pool `us-east-1_LKa4ElQem` — *Kiro*
- **7.4** ✅ Property test: Legacy Credential Validation — *Sonie*
- **7.5** ✅ Cognito app client config (`infra/cognito/customer-client.json`) — *Sonie*

### 8. User Data Migration to Cognito
- **8.1** ✅ User migration script (`scripts/migrate/migrate-users.ts`) — *Sonie*
- **8.2** ✅ Property test: User Migration Attribute Mapping — *Sonie*
- **8.3** ✅ Property test: Duplicate User Merge — *Sonie*
- **8.4** ✅ Property test: Migration Summary Report Accuracy — *Sonie*

### 9. File Storage Migration to S3
- **9.1** ✅ File migration script (`scripts/migrate/migrate-files.ts`) — *Sonie*
- **9.2** ✅ Property test: File Path Preservation — *Sonie*
- **9.3** ✅ S3 file upload handler (`apps/terra-api/src/handlers/upload.php`) — *Sonie*; Lambda presign-upload route added — *Claude*
- **9.4** ✅ Property test: File Upload Size Enforcement — *Sonie*
- **9.5** ✅ File retrieval handler (`apps/terra-api/src/handlers/file-retrieval.php`) — *Sonie*; Lambda presign-download route added — *Claude*
- **9.6** ✅ Property test: File Retrieval URL or 404 — *Sonie*
- **9.7** ✅ S3 bucket config with versioning + lifecycle (`infra/s3/upload-bucket.json`) — *Sonie*

### 11. Push Notification Unification
- **11.1** ✅ Notification publisher (`apps/terra-api/src/handlers/notifications.php`) — *Sonie*
- **11.2** ✅ Device token management (`apps/terra-api/src/handlers/device-tokens.php`) — *Sonie*; Lambda `/devices/token` routes added — *Claude*
- **11.3** ✅ Property test: Device Token Limit — *Sonie*
- **11.4** ✅ Property test: Stale Device Token Cleanup — *Sonie*
- **11.5** ✅ Property test: Token Rotation Without Duplicates — *Sonie*

### 12. APK Distribution
- **12.1** ✅ S3 APK bucket + CloudFront config (`infra/s3/apk-distribution.json`) — *Sonie*
- **12.2** ✅ APK upload CI script (`scripts/ci/upload-apk.ts`) — *Sonie*

### 14. Monitoring & Observability (Sprint 4 — completed by Claude 2026-07-07)
- **14.1** ✅ Structured JSON logging (`apps/terra-api/src/middleware/logger.php`) — *Claude*
- **14.2** ✅ Property test: Structured Log Completeness (`tests/terra-api/structured-log.property.test.ts`) — *Claude*
- **14.3** ✅ CloudWatch alarms + dashboard (`infra/monitoring/cloudwatch.json`) — *Claude*
- **14.4** ✅ GuardDuty + X-Ray config (`infra/monitoring/guardduty.json`) — *Claude*

### 15. Network Security (Sprint 4 — completed by Claude 2026-07-07)
- **15.1** ✅ VPC security groups (`infra/vpc/security-groups.json`) — *Claude*
- **15.2** ✅ Secrets Manager + rotation config (`infra/secrets/config.json`) — *Claude*
- **15.3** ✅ RDS network isolation (`infra/vpc/rds-network.json`) — *Claude*

### 16. Data Rollback & Recovery
- **16.1** ✅ Rollback/restore in snapshot script (`scripts/migrate/snapshot.ts --mode restore`) — *Claude*

---

## ⏳ PARTIALLY COMPLETED TASKS

### 13. CI/CD Pipeline Extension
- **13.1** [-] Extend GitHub Actions deploy workflow — `.github/workflows/deploy.yml` exists and covers Lambda + frontend deploys; TerraAI container build/push/ECS update jobs NOT yet added
- **13.2** [-] Extend PR check workflow — `.github/workflows/pr-check.yml` created; path-based filtering for all components not fully wired
- **13.3** [-] Property test: CI Path Filter Correctness (`tests/ci/path-filter.property.test.ts`) — *partially done by Claude (Properties 18 & 19 written)*

---

## ❌ NOT STARTED / PENDING CHECKPOINTS

### Checkpoints
- **3** ❌ Checkpoint: Ensure all tests pass (post-migration scripts)
- **6** ❌ Checkpoint: Ensure all tests pass (post-routing)
- **10** ❌ Checkpoint: Ensure all tests pass (post-file/notification)
- **17** ❌ Final checkpoint: Ensure all tests pass

---

## 🌐 LIVE AWS RESOURCES (provisioned by Kiro, 2026-07-07)

| Resource | ID / ARN |
|----------|----------|
| Lambda API | https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod |
| WebSocket API | wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod |
| Frontend (CloudFront) | https://d2rofh106fep8b.cloudfront.net |
| Cognito User Pool | us-east-1_LKa4ElQem |
| RDS Endpoint | opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com:3306 |
| ECS Cluster | opusaimobility (FARGATE + FARGATE_SPOT) |
| ECR Repo | opusaimobility/terra-api |
| Pinpoint App ID | 20d7e36cc4094a04b63b7fd1e5596fcf |
| SNS Topic | opusaimobility-notifications |
| Push Lambda | opusaimobility-push-notification |
| User Migration Lambda | opusaimobility-user-migration (attached to Cognito) |

**Push delivery path:** SNS → push Lambda → IoT MQTT `opusaimobility/notifications/{userId}` + API Gateway WebSocket bridge

---

## 🔑 Credentials & Keys

| Key | Value |
|-----|-------|
| Firebase Web API Key | `AIzaSyBYL6ZtGKfVWiK0t22CIVYxuP6daAMjg7g` |
| AWS Account | 683541453923 |
| AWS Region | us-east-1 |

---

## 📁 Key File Paths

| File | Purpose |
|------|---------|
| `omniride/aws/lambda/index.js` | Main Lambda (all API routes) |
| `omniride/apps/customer/` | Android app (226 Java files) |
| `omniride/apps/terra-api/` | PHP backend (deprecated, see DEPRECATED.md) |
| `omniride/.kiro/specs/.../tasks.md` | Master task list |
| `omniride/tests/` | 21 test files, 147+ property tests |
| `MIGRATION_PLAN.md` | Root-level migration strategy doc |
| `AWS_BLOCKERS_STATUS.md` | All 6 blockers resolved |
| `scripts/setup/fix-remaining.sh` | H2/H3/H4 one-shot fix script |

---

## ✅ REMAINING TO REACH 100%

1. Complete **13.1** — add TerraAI container build + ECS deploy jobs to `deploy.yml`
2. Complete **13.2** — wire full path-based filtering in `pr-check.yml`
3. Run all checkpoint tests (3, 6, 10, 17) — `npm test` in monorepo root
4. When legacy DB credentials available: run user migration script
