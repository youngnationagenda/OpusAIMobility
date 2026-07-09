#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-fcm-sns.sh — Fix C1: Create SNS Platform Application for FCM
#
# What this does:
#   1. Reads the FCM server key from Secrets Manager (terraai/fcm-server-key)
#   2. Creates an SNS Platform Application of type GCM (FCM uses GCM protocol)
#   3. Updates the aimobility-push Lambda env var SNS_PLATFORM_APP_ARN
#
# Prerequisites:
#   - AWS CLI configured with account 683541453923 credentials
#   - Secret 'terraai/fcm-server-key' must exist and contain: {"ServerKey":"AIza..."}
#
# Usage:
#   chmod +x scripts/setup/setup-fcm-sns.sh
#   ./scripts/setup/setup-fcm-sns.sh
#
# Optionally provide the FCM key directly (skips Secrets Manager lookup):
#   FCM_SERVER_KEY="AIzaXXX..." ./scripts/setup/setup-fcm-sns.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REGION="us-east-1"
ACCOUNT="683541453923"
PUSH_LAMBDA="aimobility-push"
SNS_APP_NAME="aimobility-fcm"
SECRET_ID="terraai/fcm-server-key"

echo "════════════════════════════════════════════"
echo "  OpusAIMobility — FCM SNS Platform Setup"
echo "════════════════════════════════════════════"

# ── Step 1: Get FCM Server Key ────────────────────────────────────────────────
if [ -n "${FCM_SERVER_KEY:-}" ]; then
  echo "▶ Using FCM_SERVER_KEY from environment variable"
  FCM_KEY="$FCM_SERVER_KEY"
else
  echo "▶ Reading FCM server key from Secrets Manager: $SECRET_ID"
  SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_ID" \
    --region "$REGION" \
    --query SecretString \
    --output text)

  # Extract ServerKey from JSON: {"ServerKey":"AIza..."}
  FCM_KEY=$(echo "$SECRET_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['ServerKey'])" 2>/dev/null \
    || echo "$SECRET_JSON" | grep -oP '"ServerKey"\s*:\s*"\K[^"]+')

  if [ -z "$FCM_KEY" ]; then
    echo "✗ ERROR: Could not extract ServerKey from secret '$SECRET_ID'"
    echo "  Expected format: {\"ServerKey\": \"AIzaXXXXXX...\"}"
    exit 1
  fi
  echo "  ✔ FCM key retrieved (${#FCM_KEY} chars)"
fi

# ── Step 2: Check if SNS Platform Application already exists ──────────────────
echo ""
echo "▶ Checking for existing SNS Platform Application: $SNS_APP_NAME"
EXISTING_ARN=$(aws sns list-platform-applications \
  --region "$REGION" \
  --query "PlatformApplications[?contains(PlatformApplicationArn, '$SNS_APP_NAME')].PlatformApplicationArn" \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_ARN" ] && [ "$EXISTING_ARN" != "None" ]; then
  echo "  ↩ Already exists: $EXISTING_ARN"
  PLATFORM_APP_ARN="$EXISTING_ARN"
else
  # ── Step 3: Create SNS Platform Application ─────────────────────────────────
  echo ""
  echo "▶ Creating SNS Platform Application (GCM/FCM)"
  PLATFORM_APP_ARN=$(aws sns create-platform-application \
    --name "$SNS_APP_NAME" \
    --platform "GCM" \
    --attributes "PlatformCredential=$FCM_KEY" \
    --region "$REGION" \
    --query PlatformApplicationArn \
    --output text)

  if [ -z "$PLATFORM_APP_ARN" ]; then
    echo "✗ ERROR: Failed to create SNS Platform Application"
    exit 1
  fi
  echo "  ✔ Created: $PLATFORM_APP_ARN"
fi

# ── Step 4: Update push Lambda environment variable ───────────────────────────
echo ""
echo "▶ Updating $PUSH_LAMBDA Lambda env: SNS_PLATFORM_APP_ARN"

# Get current env vars
CURRENT_ENV=$(aws lambda get-function-configuration \
  --function-name "$PUSH_LAMBDA" \
  --region "$REGION" \
  --query 'Environment.Variables' \
  --output json 2>/dev/null || echo "{}")

# Merge new value
UPDATED_ENV=$(echo "$CURRENT_ENV" | python3 -c "
import sys, json
env = json.load(sys.stdin)
env['SNS_PLATFORM_APP_ARN'] = '$PLATFORM_APP_ARN'
print(json.dumps({'Variables': env}))
" 2>/dev/null || echo "{\"Variables\":{\"SNS_PLATFORM_APP_ARN\":\"$PLATFORM_APP_ARN\"}}")

aws lambda update-function-configuration \
  --function-name "$PUSH_LAMBDA" \
  --environment "$UPDATED_ENV" \
  --region "$REGION" \
  --output json > /dev/null

echo "  ✔ Lambda env updated"

# ── Step 5: Verify ────────────────────────────────────────────────────────────
echo ""
echo "▶ Verifying Lambda configuration"
VERIFIED=$(aws lambda get-function-configuration \
  --function-name "$PUSH_LAMBDA" \
  --region "$REGION" \
  --query "Environment.Variables.SNS_PLATFORM_APP_ARN" \
  --output text)

echo "  SNS_PLATFORM_APP_ARN = $VERIFIED"

echo ""
echo "════════════════════════════════════════════"
echo "  ✔ C1 RESOLVED — FCM SNS Platform App set up"
echo "  ARN: $PLATFORM_APP_ARN"
echo "  Lambda: $PUSH_LAMBDA updated"
echo "════════════════════════════════════════════"
echo ""
echo "Next: Test push notification via:"
echo "  curl -X POST https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/notifications/push \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"action\":\"health\"}'"
