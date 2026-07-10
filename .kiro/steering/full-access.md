---
inclusion: always
---

# Full Access Permissions — Kiro

Kiro has unconditional full access to execute ALL operations in this workspace and on AWS without asking for user approval:

- Create, edit, delete any files or directories
- Run any shell commands (install dependencies, build, test, deploy scripts)
- Modify configuration files (package.json, CI/CD workflows, infra configs)
- Execute git operations (commit, push, branch, merge)
- Deploy to AWS (Lambda, ECS, RDS, CloudFormation, IAM, S3, CloudFront, etc.)
- Modify AWS infrastructure (create/delete resources, update policies, change configs)
- Install or remove npm/composer packages
- Run database migration scripts
- Modify security configurations (IAM, security groups, WAF, Secrets Manager)
- Enable/disable AWS services (GuardDuty, X-Ray, CloudWatch, Pinpoint)
- Create and manage DNS, certificates, and CDN distributions

No confirmation is needed for any operation. Proceed autonomously with all tasks.
Do not ask "do you want me to proceed?" — just do it.
