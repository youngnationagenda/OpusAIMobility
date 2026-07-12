#!/bin/bash
# ==============================================================================
# Validate Service — Health checks to confirm deployment is live
# ==============================================================================
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
RETRIES=5
DELAY=10

echo "============================================"
echo " Production Health Checks"
echo "============================================"

PASSED=0
FAILED=0

# 1. Check Lambda is responding
echo ""
echo "[1/3] Checking Main Lambda..."
if [ -n "${LAMBDA_FUNCTION_NAME:-}" ]; then
    STATE=$(aws lambda get-function \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --region "$REGION" \
        --query 'Configuration.State' --output text 2>/dev/null)
    if [ "$STATE" = "Active" ]; then
        echo "  PASS — Lambda state: Active"
        PASSED=$((PASSED + 1))
    else
        echo "  FAIL — Lambda state: $STATE"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  SKIP — LAMBDA_FUNCTION_NAME not set"
fi

# 2. Check API Gateway health endpoint
echo ""
echo "[2/3] Checking API Health Endpoint..."
if [ -n "${API_ENDPOINT:-}" ]; then
    for i in $(seq 1 $RETRIES); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/health" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo "  PASS — /health returned 200"
            PASSED=$((PASSED + 1))
            break
        fi
        if [ "$i" -eq "$RETRIES" ]; then
            echo "  FAIL — /health returned $HTTP_CODE after $RETRIES retries"
            FAILED=$((FAILED + 1))
        else
            echo "  Retry $i/$RETRIES (got $HTTP_CODE)..."
            sleep $DELAY
        fi
    done
else
    echo "  SKIP — API_ENDPOINT not set"
fi

# 3. Check Frontend is accessible
echo ""
echo "[3/3] Checking Frontend..."
if [ -n "${FRONTEND_URL:-}" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "  PASS — Frontend returned 200"
        PASSED=$((PASSED + 1))
    else
        echo "  FAIL — Frontend returned $HTTP_CODE"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  SKIP — FRONTEND_URL not set"
fi

# Summary
echo ""
echo "============================================"
echo " Results: $PASSED passed, $FAILED failed"
echo "============================================"

if [ "$FAILED" -gt 0 ]; then
    echo "DEPLOYMENT VALIDATION FAILED"
    exit 1
fi

echo "ALL CHECKS PASSED — APP IS LIVE"
exit 0
