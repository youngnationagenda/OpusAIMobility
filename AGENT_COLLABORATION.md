# Agent Collaboration Protocol — OpusAIMobility

**Created:** 2026-07-08  
**Updated by:** Kiro

---

## Active Agents

| Agent | Role | Task File |
|-------|------|-----------|
| **Kiro** | Infrastructure, AWS resources, CI/CD, IAM, monitoring, push notifications, migration | `Kiro_taskupdate.md` |
| **Claude** | CTO blueprint, architecture decisions, sprint planning | `claude_task.md` |
| **Sonie** | Frontend, Android app, Lambda code, codebase implementation | `Sonie_taskupdate.md` |

---

## MANDATORY: Check Kiro_taskupdate.md After Every Task

**Claude and Sonie:** Before starting any task, and after completing any task, you MUST read `Kiro_taskupdate.md` in the root folder (`D:\omnisonietest\OpusAIMobility\Kiro_taskupdate.md`).

### Why:
- Kiro manages AWS resources, IAM policies, Lambda deployments, and infrastructure
- If you deploy code without checking, you may overwrite Kiro's changes or use stale resource ARNs
- Kiro updates env vars, Lambda configs, and security policies that your code depends on

### What to check:
1. **New AWS resources** — ECR repos, ECS clusters, Lambda functions, IAM roles, SNS topics
2. **Changed env vars** — Lambda environment variables are frequently updated
3. **IAM policy changes** — permissions added/removed on shared roles
4. **Completed tasks** — avoid duplicating work
5. **Blocked items** — items waiting on your input

---

## Shared Resources (Do Not Modify Without Coordination)

| Resource | Owner | Notes |
|----------|-------|-------|
| `terraaimobility-lambda-role` | Shared (Kiro manages IAM) | All TerraAI Lambdas use this role |
| `opusaimobility-notifications` SNS topic | Kiro | Unified push — don't create separate topics |
| `.env.local` | Shared | Kiro updates AWS endpoints; Sonie updates app config |
| `MASTER_TASKS.md` | Shared | All agents reference this for task coordination |
| API Gateway `0wv2nyk3je` | Kiro | Routes managed by Kiro; don't add routes without checking |
| Cognito `us-east-1_LKa4ElQem` | Kiro | Pool config and triggers managed by Kiro |

---

## Communication Protocol

1. **Before modifying a shared resource:** Check if another agent has pending changes
2. **After completing a task:** Update your own task file immediately
3. **If blocked:** Add a note to your task file with what you need and from whom
4. **Conflicts:** `MASTER_TASKS.md` is the single source of truth for task assignments

---

## File Locations (Root: `D:\omnisonietest\OpusAIMobility\`)

```
OpusAIMobility/
├── MASTER_TASKS.md              ← Master task tracker (all agents)
├── Kiro_taskupdate.md           ← Kiro's execution log (READ THIS)
├── Sonie_taskupdate.md          ← Sonie's progress report
├── claude_task.md               ← Claude CTO blueprint v2
├── AWS_RESOURCE_CONFLICTS.md    ← Conflict resolution status
├── AWS_BLOCKERS_STATUS.md       ← AWS blockers audit
├── AGENT_COLLABORATION.md       ← This file
└── omniride/                    ← Main codebase
```
