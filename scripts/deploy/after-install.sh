#!/bin/bash
# ==============================================================================
# After Install — Deploy all components to AWS production
# ==============================================================================
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"

echo "============================================"
echo " OpusAIMobility — Production Deployment"
echo " Region: $REGION"
echo "============================================"

# 1. Deploy Frontend to S3 + invalidate CloudFront
echo ""
echo "[1/4] Deploying Frontend to S3..."
if [ -n "${S3_FRONTEND_BUCKET:-}" ] && [ -d "/tmp/deploy/frontend" ]; then
    aws s3 sync /tmp/deploy/frontend/ "s3://$S3_FRONTEND_BUCKET/" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html" \
        --region "$REGION"
    # index.html should not be cached long-term
    aws s3 cp /tmp/deploy/frontend/index.html "s3://$S3_FRONTEND_BUCKET/index.html" \
        --cache-control "no-cache, no-store, must-revalidate" \
        --region "$REGION" 2>/dev/null || true
    echo "  Frontend deployed to s3://$S3_FRONTEND_BUCKET"

    if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
        aws cloudfront create-invalidation \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
            --paths "/*" \
            --region "$REGION" > /dev/null
        echo "  CloudFront invalidation triggered"
    fi
else
    echo "  SKIPPED — S3_FRONTEND_BUCKET not set or no frontend artifacts"
fi

# 2. Deploy Main Lambda
echo ""
echo "[2/4] Deploying Main API Lambda..."
if [ -n "${LAMBDA_FUNCTION_NAME:-}" ] && [ -f "/tmp/deploy/lambda/lambda-main.zip" ]; then
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file "fileb:///tmp/deploy/lambda/lambda-main.zip" \
        --region "$REGION" > /dev/null
    echo "  Lambda '$LAMBDA_FUNCTION_NAME' updated"

    # Wait for update to complete
    aws lambda wait function-updated \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$REGION"
    echo "  Lambda update confirmed active"
else
    echo "  SKIPPED — LAMBDA_FUNCTION_NAME not set or no zip"
fi

# 3. Deploy Push Notification Lambda
echo ""
echo "[3/4] Deploying Push Notification Lambda..."
if [ -f "/tmp/deploy/lambda-push/push-lambda.zip" ]; then
    aws lambda update-function-code \
        --function-name "opusaimobility-push-notification" \
        --zip-file "fileb:///tmp/deploy/lambda-push/push-lambda.zip" \
        --region "$REGION" > /dev/null
    echo "  Lambda 'opusaimobility-push-notification' updated"

    aws lambda wait function-updated \
        --function-name "opusaimobility-push-notification" \
        --region "$REGION"
    echo "  Push Lambda update confirmed active"
else
    echo "  SKIPPED — no push-lambda.zip found"
fi

# 4. Upload APK to distribution bucket
echo ""
echo "[4/4] Uploading APK to distribution..."
if [ -n "${S3_APK_BUCKET:-}" ]; then
    APK=$(find /tmp/deploy -name "*.apk" 2>/dev/null | head -1)
    if [ -n "$APK" ]; then
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        aws s3 cp "$APK" "s3://$S3_APK_BUCKET/apks/OpusAIMobility-${TIMESTAMP}.apk" --region "$REGION"
        aws s3 cp "$APK" "s3://$S3_APK_BUCKET/apks/OpusAIMobility-latest.apk" --region "$REGION"
        echo "  APK uploaded: OpusAIMobility-${TIMESTAMP}.apk"
    else
        echo "  SKIPPED — no APK artifact found"
    fi
else
    echo "  SKIPPED — S3_APK_BUCKET not set"
fi

echo ""
echo "============================================"
echo " Deployment Complete"
echo "============================================"
