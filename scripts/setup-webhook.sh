#!/bin/bash
# ==============================================================================
# OpusAIMobility — Register GitHub PAT + Create CodeBuild Webhook
#
# Run this ONCE with a GitHub Personal Access Token that has:
#   - repo (or public_repo for public repos)
#   - admin:repo_hook
#
# Create token at: https://github.com/settings/tokens/new
#   → Select: repo  (or just public_repo)
#   → Select: admin:repo_hook
#
# Usage:
#   GITHUB_TOKEN=ghp_xxxxxxxxxxxx bash scripts/setup-webhook.sh
# ==============================================================================
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="OpusAIMobility"
BRANCH="main"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} OpusAIMobility — CodeBuild Webhook Setup${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo -e "${RED}ERROR: GITHUB_TOKEN is not set.${NC}"
  echo ""
  echo "  1. Go to: https://github.com/settings/tokens/new"
  echo "  2. Select scopes: repo (or public_repo) + admin:repo_hook"
  echo "  3. Run: GITHUB_TOKEN=ghp_xxxx bash scripts/setup-webhook.sh"
  exit 1
fi

# Step 1 — Remove any stale credential
echo -e "${YELLOW}[1/3] Clearing stale GitHub credentials...${NC}"
EXISTING=$(aws codebuild list-source-credentials \
  --query "sourceCredentialsInfos[?serverType=='GITHUB'].arn" \
  --output text --region "$REGION" 2>/dev/null || echo "")

if [ -n "$EXISTING" ]; then
  aws codebuild delete-source-credentials --arn "$EXISTING" --region "$REGION" > /dev/null
  echo "  Removed: $EXISTING"
else
  echo "  No stale credentials found."
fi

# Step 2 — Register PAT
echo ""
echo -e "${YELLOW}[2/3] Registering GitHub PAT with CodeBuild...${NC}"
CRED_ARN=$(aws codebuild import-source-credentials \
  --server-type GITHUB \
  --auth-type PERSONAL_ACCESS_TOKEN \
  --token "$GITHUB_TOKEN" \
  --region "$REGION" \
  --query "arn" --output text)
echo -e "  ${GREEN}Registered: $CRED_ARN${NC}"

# Step 3 — Create webhook
echo ""
echo -e "${YELLOW}[3/3] Creating webhook on $PROJECT_NAME → branch: $BRANCH...${NC}"
WEBHOOK=$(aws codebuild create-webhook \
  --project-name "$PROJECT_NAME" \
  --filter-groups "[[{\"type\":\"EVENT\",\"pattern\":\"PUSH\"},{\"type\":\"HEAD_REF\",\"pattern\":\"^refs/heads/${BRANCH}$\"}]]" \
  --build-type BUILD \
  --region "$REGION" \
  --output json)

WEBHOOK_URL=$(echo "$WEBHOOK" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).webhook.payloadUrl))")
SECRET=$(echo "$WEBHOOK" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).webhook.secret))")

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} Webhook Created Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Project:     $PROJECT_NAME"
echo "  Branch:      $BRANCH"
echo "  Trigger:     Every push to main → auto-build"
echo "  Payload URL: $WEBHOOK_URL"
echo ""
echo -e "${YELLOW}  Webhook secret is managed by AWS — no manual GitHub setup needed.${NC}"
echo -e "${GREEN}  From now on, every 'git push origin main' triggers a build automatically!${NC}"
echo ""
