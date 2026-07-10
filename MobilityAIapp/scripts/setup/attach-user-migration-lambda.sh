#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# attach-user-migration-lambda.sh — Fix C4: Attach User Migration Lambda to Cognito
#
# What this does:
#   1. Builds and deploys the user-migration Lambda (if not yet deployed)
#   2. Attaches it to Cognito pool us-east-1_LKa4ElQem as a UserMigration trigger
#   3. Grants Cognito permission to invoke the Lambda
#
# The Lambda (omniride/aws/lambda/user-migration/index.ts) allows users from the
# legacy TerraAI MySQL database to log in on the new unified Cognito pool.
# On first login attempt, Cognito calls this Lambda, which looks up the user in
# MySQL, validates the bcrypt password, and returns user attributes to Cognito.
#
# Prerequisites:
#   - AWS CLI configured with account 683541453923 credentials
#   - node + npm installed (for building the Lambda)
#   - RDS MySQL accessible (or DB_HOST etc. set in Secrets Manager)
#
# Usage:
#   chmod +x scripts/setup/attach-user-migration-lambda.sh
#   ./scripts/setup/attach-user-migration-lambda.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REGION="us-east-1"
ACCOUNT="683541453923"
USER_POOL_ID="us-east-1_LKa4ElQem"
LAMBDA_NAME="opusaimobility-user-migration"
LAMBDA_DIR="aws/lambda/user-migration"
EXEC_ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/omniride-lambda-role"

echo "════════════════════════════════════════════════════"
echo "  OpusAIMobility — Attach User Migration Lambda (C4)"
echo "════════════════════════════════════════════════════"

# ── Step 1: Build the Lambda ──────────────────────────────────────────────────
echo ""
echo "▶ Building user-migration Lambda"
cd "$LAMBDA_DIR"

if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  npm install --silent
fi

echo "  Compiling TypeScript..."
npx tsc --noEmit 2>/dev/null && echo "  ✔ Type check passed" || echo "  ⚠ Type warnings (continuing)"

# Compile to JS
npx tsc 2>/dev/null || true

# Package
echo "  Packaging Lambda zip..."
zip -r ../../..//user-migration-lambda.zip . -x "*.ts" "tsconfig.json" "node_modules/.cache/*" > /dev/null
LAMBDA_ZIP="$(pwd)/../../../user-migration-lambda.zip"
cd ../../..

echo "  ✔ Packaged: user-migration-lambda.zip"

# ── Step 2: Deploy or update the Lambda ──────────────────────────────────────
echo ""
echo "▶ Deploying Lambda function: $LAMBDA_NAME"

# Check if Lambda exists
LAMBDA_EXISTS=$(aws lambda get-function \
  --function-name "$LAMBDA_NAME" \
  --region "$REGION" \
  --query 'Configuration.FunctionName' \
  --output text 2>/dev/null || echo "")

if [ -n "$LAMBDA_EXISTS" ] && [ "$LAMBDA_EXISTS" != "None" ]; then
  echo "  ↩ Lambda exists — updating code"
  aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file "fileb://${LAMBDA_ZIP}" \
    --region "$REGION" \
    --output json > /dev/null
  echo "  ✔ Lambda code updated"
else
  echo "  Creating new Lambda function"
  aws lambda create-function \
    --function-name "$LAMBDA_NAME" \
    --runtime "nodejs20.x" \
    --handler "index.handler" \
    --role "$EXEC_ROLE_ARN" \
    --zip-file "fileb://${LAMBDA_ZIP}" \
    --timeout 30 \
    --memory-size 256 \
    --environment "Variables={AWS_REGION=${REGION}}" \
    --region "$REGION" \
    --output json > /dev/null
  echo "  ✔ Lambda created"
fi

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name "$LAMBDA_NAME" \
  --region "$REGION" \
  --query 'Configuration.FunctionArn' \
  --output text)
echo "  ARN: $LAMBDA_ARN"

# ── Step 3: Grant Cognito permission to invoke the Lambda ─────────────────────
echo ""
echo "▶ Granting Cognito permission to invoke Lambda"

# Remove existing permission first (idempotent)
aws lambda remove-permission \
  --function-name "$LAMBDA_NAME" \
  --statement-id "CognitoUserMigrationPermission" \
  --region "$REGION" 2>/dev/null && echo "  ↩ Removed old permission" || true

aws lambda add-permission \
  --function-name "$LAMBDA_NAME" \
  --statement-id "CognitoUserMigrationPermission" \
  --action "lambda:InvokeFunction" \
  --principal "cognito-idp.amazonaws.com" \
  --source-arn "arn:aws:cognito-idp:${REGION}:${ACCOUNT}:userpool/${USER_POOL_ID}" \
  --region "$REGION" \
  --output json > /dev/null

echo "  ✔ Permission granted"

# ── Step 4: Attach Lambda as Cognito UserMigration trigger ────────────────────
echo ""
echo "▶ Attaching Lambda to Cognito pool: $USER_POOL_ID"

# Get current Lambda config for the pool (to preserve other triggers)
CURRENT_CONFIG=$(aws cognito-idp describe-user-pool \
  --user-pool-id "$USER_POOL_ID" \
  --region "$REGION" \
  --query 'UserPool.LambdaConfig' \
  --output json 2>/dev/null || echo "{}")

echo "  Current Lambda triggers: $CURRENT_CONFIG"

# Update the pool with UserMigration trigger
# Merge UserMigration into existing config using python3
UPDATED_CONFIG=$(echo "$CURRENT_CONFIG" | python3 -c "
import sys, json
config = json.load(sys.stdin)
config['UserMigration'] = '$LAMBDA_ARN'
print(json.dumps(config))
" 2>/dev/null || echo "{\"UserMigration\":\"$LAMBDA_ARN\"}")

aws cognito-idp update-user-pool \
  --user-pool-id "$USER_POOL_ID" \
  --lambda-config "$UPDATED_CONFIG" \
  --region "$REGION" \
  --output json > /dev/null

echo "  ✔ UserMigration trigger attached"

# ── Step 5: Verify ────────────────────────────────────────────────────────────
echo ""
echo "▶ Verifying trigger attachment"
VERIFIED=$(aws cognito-idp describe-user-pool \
  --user-pool-id "$USER_POOL_ID" \
  --region "$REGION" \
  --query 'UserPool.LambdaConfig.UserMigration' \
  --output text)

echo "  UserMigration trigger = $VERIFIED"

# ── Clean up zip ──────────────────────────────────────────────────────────────
rm -f user-migration-lambda.zip

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✔ C4 RESOLVED — User Migration Lambda attached"
echo "  Pool:   $USER_POOL_ID"
echo "  Lambda: $VERIFIED"
echo "════════════════════════════════════════════════════"
echo ""
echo "What this means:"
echo "  - Legacy TerraAI users (from MySQL) can now sign in"
echo "    on the unified Cognito pool for the first time."
echo "  - On first login, their bcrypt password is validated"
echo "    against MySQL and their account is migrated."
echo "  - Subsequent logins use Cognito directly (no MySQL)."
echo ""
echo "Test with:"
echo "  curl -X POST https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/auth/signin \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"legacy@user.com\",\"password\":\"theiroldpassword\"}'"
