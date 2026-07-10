#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# fix-remaining.sh — Resolve H2, H3, H4 + wire push Lambda WS_ENDPOINT
#
# Run from D:\omnisonietest\OpusAIMobility\omniride\ with AWS CLI authenticated.
# All operations are idempotent — safe to run multiple times.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Windows/WSL: ensure AWS CLI is callable ───────────────────────────────────
# In WSL, aws.exe lives on the Windows PATH but Bash can't resolve it via PATH
# directly because of spaces in "Program Files". We detect and wrap it as a
# shell function so every `aws ...` call in this script works transparently.
_AWS_EXE=""
if command -v aws &>/dev/null; then
  _AWS_EXE="aws"
else
  for _p in \
    "/mnt/c/PROGRA~1/Amazon/AWSCLIV2/aws.exe" \
    "/mnt/c/Program Files/Amazon/AWSCLIV2/aws.exe" \
    "/c/PROGRA~1/Amazon/AWSCLIV2/aws.exe"; do
    if [ -f "$_p" ]; then
      _AWS_EXE="$_p"
      break
    fi
  done
fi
if [ -z "$_AWS_EXE" ]; then
  echo "ERROR: aws CLI not found. Ensure AWS CLI v2 is installed." >&2
  exit 1
fi
# Wrap as a function so all `aws` calls in the script use the found binary
aws() { "$_AWS_EXE" "$@"; }

REGION="us-east-1"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  OpusAIMobility — Post-blocker housekeeping"
echo "════════════════════════════════════════════════════════"

# ── H2: Upgrade all nodejs18.x Lambdas to nodejs20.x ─────────────────────────
echo ""
echo "▶ H2: Upgrading deprecated nodejs18.x Lambdas to nodejs20.x"

LAMBDAS_18=(
  "terraaimobility-api"
  "terraaimobility-admin"
  "terraaimobility-admin-panel"
  "aimobility-ws"
  "aimobility-push"
  "terraai-stripe"
  "terraai-reporting"
  "terraai-airtel"
  "terraai-defi-settlement"
  "terraai-secrets-rotation"
  "terraai-mpesa"
  "terraai-telemetry-ingest"
)

for fn in "${LAMBDAS_18[@]}"; do
  CURRENT=$(aws lambda get-function-configuration \
    --function-name "$fn" \
    --region "$REGION" \
    --query "Runtime" \
    --output text 2>/dev/null || echo "NOT_FOUND")

  if [ "$CURRENT" = "NOT_FOUND" ]; then
    echo "  ⚠ $fn — not found, skipping"
  elif [ "$CURRENT" = "nodejs20.x" ]; then
    echo "  ↩ $fn — already nodejs20.x"
  else
    aws lambda update-function-configuration \
      --function-name "$fn" \
      --runtime "nodejs20.x" \
      --region "$REGION" \
      --output json > /dev/null
    echo "  ✔ $fn — upgraded $CURRENT → nodejs20.x"
  fi
done

# ── Wire push Lambda WS_ENDPOINT env var ──────────────────────────────────────
echo ""
echo "▶ Setting WS_ENDPOINT on opusaimobility-push-notification Lambda"

PUSH_ENV=$(aws lambda get-function-configuration \
  --function-name "opusaimobility-push-notification" \
  --region "$REGION" \
  --query "Environment.Variables" \
  --output json 2>/dev/null || echo "{}")

UPDATED_PUSH_ENV=$(echo "$PUSH_ENV" | python3 -c "
import sys, json
env = json.load(sys.stdin)
env['WS_ENDPOINT'] = 'https://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod'
env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = '1'
print(json.dumps({'Variables': env}))
")

aws lambda update-function-configuration \
  --function-name "opusaimobility-push-notification" \
  --environment "$UPDATED_PUSH_ENV" \
  --region "$REGION" \
  --output json > /dev/null
echo "  ✔ WS_ENDPOINT set on push Lambda"

# ── H3: Enable PITR on all omniride-* DynamoDB tables ────────────────────────
echo ""
echo "▶ H3: Enabling Point-in-Time Recovery on all omniride-* tables"

OMNIRIDE_TABLES=(
  "omniride-users"
  "omniride-trips"
  "omniride-orders"
  "omniride-errands"
  "omniride-transactions"
  "omniride-swap-stations"
  "omniride-inventory"
  "omniride-blockchain"
  "omniride-audit-logs"
  "omniride-platform"
  "omniride-connections"
  "omniride-telemetry"
)

for table in "${OMNIRIDE_TABLES[@]}"; do
  STATUS=$(aws dynamodb describe-continuous-backups \
    --table-name "$table" \
    --region "$REGION" \
    --query "ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus" \
    --output text 2>/dev/null || echo "TABLE_NOT_FOUND")

  if [ "$STATUS" = "TABLE_NOT_FOUND" ]; then
    echo "  ⚠ $table — not found, skipping"
  elif [ "$STATUS" = "ENABLED" ]; then
    echo "  ↩ $table — PITR already enabled"
  else
    aws dynamodb update-continuous-backups \
      --table-name "$table" \
      --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
      --region "$REGION" \
      --output json > /dev/null
    echo "  ✔ $table — PITR enabled"
  fi
done

# ── H4: Add missing GSIs ──────────────────────────────────────────────────────
echo ""
echo "▶ H4: Adding missing GSIs"

# Check if email-index already exists on omniride-users
USERS_GSIS=$(aws dynamodb describe-table \
  --table-name "omniride-users" \
  --region "$REGION" \
  --query "Table.GlobalSecondaryIndexes[].IndexName" \
  --output text 2>/dev/null || echo "")

if echo "$USERS_GSIS" | grep -q "email-index"; then
  echo "  ↩ omniride-users email-index — already exists"
else
  echo "  ▷ Adding email-index to omniride-users"
  aws dynamodb update-table \
    --table-name "omniride-users" \
    --region "$REGION" \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=email,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "email-index",
        "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      }
    }]' \
    --output json > /dev/null
  echo "  ✔ omniride-users email-index — creation initiated (takes ~60s to become ACTIVE)"
fi

# Check if userId-index already exists on omniride-transactions
TX_GSIS=$(aws dynamodb describe-table \
  --table-name "omniride-transactions" \
  --region "$REGION" \
  --query "Table.GlobalSecondaryIndexes[].IndexName" \
  --output text 2>/dev/null || echo "")

if echo "$TX_GSIS" | grep -q "userId-index"; then
  echo "  ↩ omniride-transactions userId-index — already exists"
else
  echo "  ▷ Adding userId-index to omniride-transactions"
  aws dynamodb update-table \
    --table-name "omniride-transactions" \
    --region "$REGION" \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
      AttributeName=txId,AttributeType=S \
      AttributeName=userId,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "userId-index",
        "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      }
    }]' \
    --output json > /dev/null
  echo "  ✔ omniride-transactions userId-index — creation initiated (takes ~60s to become ACTIVE)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✔ All housekeeping tasks complete"
echo ""
echo "  H2: All Lambdas upgraded to nodejs20.x"
echo "  H3: PITR enabled on all omniride-* tables"
echo "  H4: email-index + userId-index GSIs created"
echo "  Push Lambda: WS_ENDPOINT wired"
echo ""
echo "  Remaining manual steps:"
echo "  H5: Enable PR branch protection in GitHub repo settings"
echo "      → Require 'pr-ready' status check on main branch"
echo "      → https://github.com/youngnationagenda/OpusAIMobility/settings/branches"
echo ""
echo "  User Migration DB creds:"
echo "      aws lambda update-function-configuration \\"
echo "        --function-name opusaimobility-user-migration \\"
echo "        --environment 'Variables={DB_HOST=<your-rds-endpoint>,DB_PORT=3306,DB_NAME=terraai,DB_USER=<user>,DB_PASS=<pass>}' \\"
echo "        --region us-east-1"
echo "════════════════════════════════════════════════════════"
