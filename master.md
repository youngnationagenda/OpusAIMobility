# OpusAIMobility — Master Coordination Document

> **Purpose:** Housekeeping rules for all agents (Kiro, Sonie, Claude) working on this project.  
> **Last updated:** 2026-07-08  
> **Source of truth for tasks:** `MASTER_TASKS.md` (root) — conflicts, open items, and priority order  
> **Source of truth for sprint spec:** `omniride/.kiro/specs/terraai-omniride-consolidation/tasks.md`  
> **IMPORTANT:** All agents MUST read `MASTER_TASKS.md` before starting work — it contains unresolved conflicts that override earlier plans.

---

## Golden Rules

### 1. Ownership by Directory — NO Exceptions

Each agent has exclusive write access to their assigned directories. If you need something changed in another agent's area, **do NOT edit it yourself**. Instead, add a `## REQUEST` entry at the bottom of your own task file. The owning agent will handle it.

### 2. Branch Strategy

| Agent | Branch Name | Base |
|-------|-------------|------|
| Kiro | `kiro/infra-deploy` | `main` |
| Sonie | `sonie/tests-firebase` | `main` |
| Claude | `claude/cicd-pipeline` | `main` |

- Always pull latest `main` before starting work
- Never push directly to `main` — use PRs
- If your work depends on another agent's PR, mark it as `BLOCKED_BY: [agent]/[branch]` in your task file

### 3. Communication Protocol

- **Before starting:** Read your `[agent].OpusAImobilitytask.md` file
- **While working:** Update your task file status (`[ ]` → `[x]`) as you complete items
- **When blocked:** Add a `## REQUEST` or `## BLOCKED` entry to your task file
- **When done:** Add a `## COMPLETED` summary at the top of your task file with date and what changed

### 4. Conflict Zones — SHARED FILES (touch with care)

These files may be touched by multiple agents. Coordinate before editing:

| File | Primary Owner | Others May Edit? |
|------|---------------|-----------------|
| `omniride/package.json` | Sonie | Only to add deps for your area |
| `omniride/.gitignore` | Claude | Only to add patterns |
| `omniride/aws/lambda/index.js` | Sonie | Kiro may add env vars |
| `.github/workflows/deploy.yml` | Claude | Kiro to validate secrets |

If you MUST edit a shared file, add a comment with your name and date:
```
// [Kiro 2026-07-08] Added ECR_REPOSITORY env var
```

### 5. Testing Protocol

- Sonie owns test execution and fixes
- Before marking ANY task complete, verify it doesn't break existing tests
- If you add infrastructure that needs a test, add a `## REQUEST` to Sonie's task file

### 6. Secrets & Credentials

- NEVER commit secrets to git
- Service account JSON files: `.gitignore` pattern `*-service-account.json` is active
- Environment variables go in `.env.local` (also gitignored)
- For AWS secrets deployed live: use Secrets Manager — coordinate with Kiro

### 7. File Naming Convention

- Infrastructure configs: `kebab-case.json`
- Scripts: `kebab-case.ts` or `kebab-case.sh`
- Source code: follows existing conventions in each directory
- Task/docs: `PascalCase` or as specified

---

## Directory Ownership Map

```
OpusAIMobility/
├── .github/workflows/          → Claude
├── omniride/
│   ├── apps/
│   │   ├── customer/           → Sonie (Android app code)
│   │   └── terra-api/          → Sonie (PHP backend, deprecated)
│   ├── aws/
│   │   ├── lambda/             → Sonie (code) / Kiro (deploy)
│   │   └── lambda/push-notification/ → Sonie (code) / Kiro (deploy)
│   ├── infra/
│   │   ├── api-gateway/        → Kiro
│   │   ├── cognito/            → Kiro
│   │   ├── docker/             → Sonie (Dockerfile) / Kiro (build & push)
│   │   ├── ecs/                → Kiro
│   │   ├── github/             → Claude
│   │   ├── iam/                → Kiro
│   │   ├── monitoring/         → Kiro (deploy) / Claude (config updates)
│   │   ├── s3/                 → Kiro
│   │   ├── secrets/            → Kiro
│   │   └── vpc/                → Kiro
│   ├── packages/common/        → Sonie
│   ├── scripts/
│   │   ├── ci/                 → Claude
│   │   ├── migrate/            → Sonie
│   │   └── setup/              → Kiro
│   └── tests/                  → Sonie
├── master.md                   → Claude (this file)
├── kiro.OpusAImobilitytask.md  → Kiro
├── sonie.OpusAImobilitytask.md → Sonie
└── claude.OpusAImobilitytask.md → Claude
```

---

## Current Project Status

- **82% complete** (43/53 tasks done from master tasks.md)
- **Live AWS resources** all provisioned and operational
- **Firebase Admin SDK** service account added (not yet wired to push Lambda code)
- **Remaining:** CI/CD pipeline completion (13.1, 13.2, 13.3) + all checkpoints (3, 6, 10, 17)

---

## Quick Reference — Live Resources

| Resource | Endpoint |
|----------|----------|
| Lambda API | `https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod` |
| WebSocket | `wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod` |
| Frontend | `https://d2rofh106fep8b.cloudfront.net` |
| Cognito Pool | `us-east-1_LKa4ElQem` |
| RDS | `opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com:3306` |
| AWS Account | `683541453923` / `us-east-1` |
| Firebase Project | `opusaimobility` |
| Firebase API Key | `AIzaSyBYL6ZtGKfVWiK0t22CIVYxuP6daAMjg7g` |
