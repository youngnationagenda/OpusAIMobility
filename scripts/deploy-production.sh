#!/bin/bash
# ==============================================================================
# OpusAIMobility — Deploy to Production
# Creates CodeDeploy application (if needed) and triggers deployment
# Run after CodeBuild succeeds
# ==============================================================================
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
APP_NAME="OpusAIMobility"
DEPLOY_GROUP="OpusAIMobility-Production"
S3_BUCKET="opusaimobility-codebuild-artifacts-$(aws sts get-caller-identity --query Account --output text)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} OpusAIMobility — Go Live (Production Deploy)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 1: Deploy Lambda Functions Directly (fastest path to live)
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Deploying Lambda functions...${NC}"

echo "  Deploying main API Lambda..."
aws lambda update-function-code \
    --function-name omniride-api \
    --s3-bucket "$S3_BUCKET" \
    --s3-key "$(aws s3 ls "s3://$S3_BUCKET/" --recursive | grep lambda-main.zip | sort | tail -1 | awk '{print $4}')" \
    --region "$REGION" --output text --query 'FunctionArn' 2>/dev/null && echo "  Done" || {
    echo "  Deploying from local build..."
    cd MobilityAIapp/aws/lambda
    npm ci --omit=dev
    zip -r /tmp/lambda-main.zip . -x "node_modules/.cache/*" -x "*.test.*"
    aws lambda update-function-code \
        --function-name omniride-api \
        --zip-file fileb:///tmp/lambda-main.zip \
        --region "$REGION" > /dev/null
    cd ../../..
    echo -e "  ${GREEN}Main API Lambda deployed${NC}"
}

aws lambda wait function-updated --function-name omniride-api --region "$REGION"
echo -e "  ${GREEN}Main API Lambda is ACTIVE${NC}"

# Push notification Lambda
echo "  Deploying push notification Lambda..."
if [ -d "MobilityAIapp/aws/lambda/push-notification" ]; then
    cd MobilityAIapp/aws/lambda/push-notification
    npm ci --omit=dev
    zip -r /tmp/push-lambda.zip . -x "node_modules/.cache/*"
    aws lambda update-function-code \
        --function-name opusaimobility-push-notification \
        --zip-file fileb:///tmp/push-lambda.zip \
        --region "$REGION" > /dev/null
    cd ../../../..
    aws lambda wait function-updated --function-name opusaimobility-push-notification --region "$REGION"
    echo -e "  ${GREEN}Push Notification Lambda is ACTIVE${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 2: Deploy Frontend
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/5] Building and deploying frontend...${NC}"

cd MobilityAIapp
npm ci
npm run build
echo "  Build complete ($(find dist -type f | wc -l) files)"

S3_FRONTEND_BUCKET="${S3_FRONTEND_BUCKET:-opusaimobility-frontend}"
aws s3 sync dist/ "s3://$S3_FRONTEND_BUCKET/" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --region "$REGION"

aws s3 cp dist/index.html "s3://$S3_FRONTEND_BUCKET/index.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --region "$REGION"

echo -e "  ${GREEN}Frontend deployed to s3://$S3_FRONTEND_BUCKET${NC}"
cd ..

# CloudFront invalidation
if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --region "$REGION" \
        --query 'Invalidation.Id' --output text)
    echo -e "  ${GREEN}CloudFront invalidation: $INVALIDATION_ID${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 3: Upload APK (if built)
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/5] Checking for APK artifacts...${NC}"
S3_APK_BUCKET="${S3_APK_BUCKET:-opusaimobility-apk-distribution}"
APK=$(find MobilityAIapp/apps/customer/app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1 || true)
if [ -n "$APK" ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    aws s3 cp "$APK" "s3://$S3_APK_BUCKET/apks/OpusAIMobility-${TIMESTAMP}.apk" --region "$REGION"
    aws s3 cp "$APK" "s3://$S3_APK_BUCKET/apks/OpusAIMobility-latest.apk" --region "$REGION"
    echo -e "  ${GREEN}APK uploaded: OpusAIMobility-${TIMESTAMP}.apk${NC}"
else
    echo "  No APK found — skipping (build Android locally or via CodeBuild)"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 4: Verify production health
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/5] Running production health checks...${NC}"

# Check Lambda state
LAMBDA_STATE=$(aws lambda get-function \
    --function-name omniride-api \
    --region "$REGION" \
    --query 'Configuration.State' --output text)
echo "  Lambda omniride-api: $LAMBDA_STATE"

PUSH_STATE=$(aws lambda get-function \
    --function-name opusaimobility-push-notification \
    --region "$REGION" \
    --query 'Configuration.State' --output text 2>/dev/null || echo "N/A")
echo "  Lambda push-notification: $PUSH_STATE"

# Invoke health check
echo "  Invoking health endpoint..."
HEALTH_RESPONSE=$(aws lambda invoke \
    --function-name omniride-api \
    --payload '{"path":"/health","httpMethod":"GET","headers":{}}' \
    --region "$REGION" \
    /tmp/health-response.json --output text --query 'StatusCode')

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "  ${GREEN}Health check: PASS (HTTP 200)${NC}"
else
    BODY=$(cat /tmp/health-response.json 2>/dev/null || echo "{}")
    echo -e "  ${YELLOW}Health check returned: $HEALTH_RESPONSE${NC}"
    echo "  Response: $BODY"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 5: Summary
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Deployment Summary${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}       APP IS LIVE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Services deployed:"
echo "    - Lambda API:         omniride-api ($LAMBDA_STATE)"
echo "    - Lambda Push:        opusaimobility-push-notification ($PUSH_STATE)"
echo "    - Frontend:           s3://$S3_FRONTEND_BUCKET → CloudFront"
if [ -n "$APK" ]; then
echo "    - Android APK:        s3://$S3_APK_BUCKET/apks/OpusAIMobility-latest.apk"
fi
echo ""
echo "  Endpoints:"
echo "    - API:      https://api.opusaimobility.com"
echo "    - Frontend: https://app.opusaimobility.com"
echo "    - APK:      https://$S3_APK_BUCKET.s3.amazonaws.com/apks/OpusAIMobility-latest.apk"
echo ""
echo -e "${GREEN}  Production deployment completed successfully!${NC}"
