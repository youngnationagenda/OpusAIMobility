#!/usr/bin/env bash
# =============================================================================
# set-github-secrets.sh — OpusAIMobility GitHub Actions Secrets Setup
#
# Sets every required GitHub Actions secret for the CI/CD pipeline using
# the GitHub CLI (gh). Secrets are sourced directly from live AWS resources
# and the local keystore.b64 file — nothing is hardcoded except non-sensitive
# IDs already public in the workflow YAML.
#
# Prerequisites:
#   gh auth login            (GitHub CLI authenticated)
#   aws configure            (AWS CLI authenticated as dev — already done)
#   REPO variable below set to your GitHub repo (owner/repo)
#
# Usage:
#   chmod +x .github/scripts/set-github-secrets.sh
#   REPO=your-org/your-repo bash .github/scripts/set-github-secrets.sh
#
# Safe to re-run — gh secret set overwrites existing values.
# =============================================================================

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
REPO="${REPO:-}"
KEYSTORE_B64_PATH="${KEYSTORE_B64_PATH:-keystore.b64}"  # relative to project root
AWS_REGION="us-east-1"
AWS_ACCOUNT="683541453923"

# ── Colour helpers ───────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${NC}"; }

# ── Preflight checks ─────────────────────────────────────────────────────────
header "=== OpusAIMobility — GitHub Secrets Setup ==="

if [ -z "$REPO" ]; then
  error "REPO is not set. Run as: REPO=owner/repo bash .github/scripts/set-github-secrets.sh"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  error "GitHub CLI (gh) is not installed. Install from https://cli.github.com"
  exit 1
fi

if ! command -v aws &>/dev/null; then
  error "AWS CLI is not installed or not in PATH."
  exit 1
fi

info "Target repo : ${BOLD}$REPO${NC}"
info "AWS account : $AWS_ACCOUNT"
info "AWS region  : $AWS_REGION"
echo ""

# ── Helper: set one secret ───────────────────────────────────────────────────
set_secret() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    warn "Skipping $name — value is empty"
    return
  fi
  printf '%s' "$value" | gh secret set "$name" --repo "$REPO"
  success "Set $name"
}

# =============================================================================
# GROUP 1 — No AWS keys (OIDC)
# =============================================================================
header "── Group 1: OIDC Authentication (no secrets needed) ──"
info "Deploy role  : arn:aws:iam::${AWS_ACCOUNT}:role/opusaimobility-github-deploy"
info "OIDC provider: arn:aws:iam::${AWS_ACCOUNT}:oidc-provider/token.actions.githubusercontent.com"
info "No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY will be set — OIDC only."

# =============================================================================
# GROUP 2 — Container & ECS
# =============================================================================
header "── Group 2: ECR / ECS ──"

set_secret "ECR_REPOSITORY" "opusaimobility/terra-api"
set_secret "ECS_CLUSTER"    "opusaimobility"

# ECS service — discover dynamically
info "Looking up ECS services in cluster opusaimobility..."
ECS_SERVICE=$(aws ecs list-services \
  --cluster opusaimobility \
  --region "$AWS_REGION" \
  --query "serviceArns[0]" \
  --output text 2>/dev/null | sed 's|.*/||' || true)

if [ -z "$ECS_SERVICE" ] || [ "$ECS_SERVICE" = "None" ]; then
  warn "No ECS service found in cluster — setting placeholder 'opusaimobility-terra-api'"
  ECS_SERVICE="opusaimobility-terra-api"
fi
set_secret "ECS_SERVICE" "$ECS_SERVICE"

set_secret "TERRA_HEALTH_URL" \
  "https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/terra/health"

# =============================================================================
# GROUP 3 — Frontend (S3 + CloudFront)
# =============================================================================
header "── Group 3: Frontend Deploy ──"

set_secret "S3_FRONTEND_BUCKET"         "omniride-assets-prod"
set_secret "CLOUDFRONT_DISTRIBUTION_ID" "E1TIJJKJ2UEIO7"

# =============================================================================
# GROUP 4 — APK Distribution
# =============================================================================
header "── Group 4: APK Distribution ──"

set_secret "S3_APK_BUCKET" "opusaimobility-assets-prod"

# =============================================================================
# GROUP 5 — Android Signing (from AWS Secrets Manager)
# =============================================================================
header "── Group 5: Android Signing Keystore ──"

info "Fetching keystore metadata from Secrets Manager..."
KEYSTORE_JSON=$(aws secretsmanager get-secret-value \
  --secret-id opusaimobility/android-keystore \
  --region "$AWS_REGION" \
  --query "SecretString" \
  --output text 2>/dev/null || true)

if [ -z "$KEYSTORE_JSON" ]; then
  warn "Could not read opusaimobility/android-keystore from Secrets Manager — skipping signing secrets"
else
  STORE_PASSWORD=$(echo "$KEYSTORE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['storePassword'])" 2>/dev/null || true)
  KEY_PASSWORD=$(echo   "$KEYSTORE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['keyPassword'])"   2>/dev/null || true)
  KEY_ALIAS=$(echo      "$KEYSTORE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['keyAlias'])"       2>/dev/null || true)
  KEYSTORE_B64=$(echo   "$KEYSTORE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['keystoreBase64'])" 2>/dev/null || true)

  set_secret "KEYSTORE_PASSWORD" "$STORE_PASSWORD"
  set_secret "KEY_PASSWORD"      "$KEY_PASSWORD"
  set_secret "KEY_ALIAS"         "$KEY_ALIAS"

  # Prefer local keystore.b64 file if it exists; fall back to Secrets Manager value
  if [ -f "$KEYSTORE_B64_PATH" ]; then
    info "Using local $KEYSTORE_B64_PATH for KEYSTORE_FILE"
    set_secret "KEYSTORE_FILE" "$(cat "$KEYSTORE_B64_PATH")"
  elif [ -n "$KEYSTORE_B64" ]; then
    info "Using keystoreBase64 from Secrets Manager for KEYSTORE_FILE"
    set_secret "KEYSTORE_FILE" "$KEYSTORE_B64"
  else
    warn "No keystore base64 found — KEYSTORE_FILE not set. Provide $KEYSTORE_B64_PATH or update Secrets Manager."
  fi
fi

# =============================================================================
# SUMMARY
# =============================================================================
header "=== Summary ==="
echo ""
echo "Verifying secrets are registered in GitHub..."
echo ""

gh secret list --repo "$REPO" --json name \
  --jq '.[] | .name' 2>/dev/null | sort | while read -r name; do
  echo -e "  ${GREEN}✓${NC} $name"
done

echo ""
echo -e "${BOLD}Pipeline is ready.${NC}"
echo ""
echo "Next: push a commit to main or run the workflow manually:"
echo "  gh workflow run deploy.yml --repo $REPO --ref main"
echo ""
echo "Amazon Q Connection ARN: arn:aws:codeconnections:us-east-1:683541453923:connection/106cbfc4-0ec6-492a-bf08-43ba86575ea1"
echo "OIDC Role              : arn:aws:iam::683541453923:role/opusaimobility-github-deploy"
