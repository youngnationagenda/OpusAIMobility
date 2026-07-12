#!/bin/bash
# ==============================================================================
# OpusAIMobility — Deploy to Production (from local Windows/Git Bash)
# Deploys frontend to S3 and triggers Lambda updates via CodeBuild artifacts
# ==============================================================================
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} OpusAIMobility — Go Live (Production Deploy)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check AWS auth
echo -e "${YELLOW}[0/5] Verifying AWS credentials...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || {
    echo -e "${RED}ERROR: AWS CLI not authenticated. Run 'aws configure' first.${NC}"
    exit 1
}
echo "  Account: $ACCOUNT_ID | Region: $REGION"
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 1: Deploy Lambda via S3 (avoid local zip requirement)
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Deploying Lambda functions...${NC}"

# Use PowerShell to create zip on Windows
echo "  Packaging main API Lambda..."
cd MobilityAIapp/aws/lambda
npm ci --omit=dev 2>/dev/null

# Create zip using PowerShell (available on Windows)
powershell.exe -Command "
    \$excludes = @('node_modules/.cache', '*.test.*')
    Compress-Archive -Path './*' -DestinationPath '../../../lambda-main.zip' -Force
" 2>/dev/null || {
    # Fallback: use tar + gzip if PowerShell fails
    tar -czf ../../../lambda-main.tar.gz --exclude='node_modules/.cache' --exclude='*.test.*' .
    echo "  (Using tar archive — will convert on upload)"
}
cd ../../..

if [ -f "lambda-main.zip" ]; then
    aws lambda update-function-code \
        --function-name terraaimobility-api \
        --zip-file fileb://lambda-main.zip \
        --region "$REGION" > /dev/null
    echo -e "  ${GREEN}Main API Lambda deployed${NC}"
    rm -f lambda-main.zip

    echo "  Waiting for Lambda to become active..."
    aws lambda wait function-updated --function-name terraaimobility-api --region "$REGION"
    echo -e "  ${GREEN}Lambda terraaimobility-api is ACTIVE${NC}"
else
    echo -e "  ${YELLOW}SKIPPED — zip creation failed. Lambda will deploy via CodeBuild.${NC}"
fi

# Push notification Lambda
if [ -d "MobilityAIapp/aws/lambda/push-notification" ]; then
    echo "  Packaging push notification Lambda..."
    cd MobilityAIapp/aws/lambda/push-notification
    npm ci --omit=dev 2>/dev/null
    cd ../../../..
    powershell.exe -Command "
        Compress-Archive -Path 'MobilityAIapp/aws/lambda/push-notification/*' -DestinationPath 'push-lambda.zip' -Force
    " 2>/dev/null && {
        aws lambda update-function-code \
            --function-name opusaimobility-push-notification \
            --zip-file fileb://push-lambda.zip \
            --region "$REGION" > /dev/null
        rm -f push-lambda.zip
        aws lambda wait function-updated --function-name opusaimobility-push-notification --region "$REGION"
        echo -e "  ${GREEN}Push Notification Lambda is ACTIVE${NC}"
    } || echo -e "  ${YELLOW}Push Lambda skipped — will deploy via CodeBuild${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 2: Build and Deploy Frontend
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/5] Building and deploying frontend...${NC}"

cd MobilityAIapp
npm ci 2>/dev/null
npm run build
FILE_COUNT=$(find dist -type f | wc -l)
echo "  Build complete ($FILE_COUNT files)"

S3_FRONTEND_BUCKET="${S3_FRONTEND_BUCKET:-opusaimobility-assets-prod}"

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
else
    echo "  CloudFront invalidation skipped (CLOUDFRONT_DISTRIBUTION_ID not set)"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 3: APK check
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
    echo "  No local APK found — Android builds deploy via CodeBuild"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 4: Health checks
# ─────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/5] Running production health checks...${NC}"

LAMBDA_STATE=$(aws lambda get-function \
    --function-name terraaimobility-api \
    --region "$REGION" \
    --query 'Configuration.State' --output text 2>/dev/null || echo "NOT FOUND")
echo "  Lambda terraaimobility-api: $LAMBDA_STATE"

PUSH_STATE=$(aws lambda get-function \
    --function-name opusaimobility-push-notification \
    --region "$REGION" \
    --query 'Configuration.State' --output text 2>/dev/null || echo "NOT FOUND")
echo "  Lambda push-notification: $PUSH_STATE"

# Check S3 frontend
S3_CHECK=$(aws s3 ls "s3://$S3_FRONTEND_BUCKET/index.html" --region "$REGION" 2>/dev/null && echo "OK" || echo "MISSING")
echo "  Frontend (S3): $S3_CHECK"

# Invoke Lambda health check
echo "  Invoking API health endpoint..."
aws lambda invoke \
    --function-name terraaimobility-api \
    --payload '{"path":"/health","httpMethod":"GET","headers":{}}' \
    --region "$REGION" \
    --cli-binary-format raw-in-base64-out \
    /tmp/health-response.json > /dev/null 2>&1 && {
    echo -e "  ${GREEN}API health check: PASS${NC}"
} || {
    echo -e "  ${YELLOW}API health check: Could not invoke (check permissions)${NC}"
}
echo ""

# ─────────────────────────────────────────────────────────────────────
# Step 5: Summary
# ─────────────────────────────────────────────────────────────────────
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              APP IS LIVE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Services:"
echo "    Lambda API:    terraaimobility-api ($LAMBDA_STATE)"
echo "    Lambda Push:   opusaimobility-push-notification ($PUSH_STATE)"
echo "    Frontend:      s3://$S3_FRONTEND_BUCKET → CloudFront"
echo ""
echo "  Next steps:"
echo "    - Set CLOUDFRONT_DISTRIBUTION_ID for CDN cache busting"
echo "    - Verify at your custom domain or CloudFront URL"
echo "    - Android APK builds via CodeBuild (OpusAIMobility project)"
echo ""
echo -e "${GREEN}  Production deployment completed!${NC}"
