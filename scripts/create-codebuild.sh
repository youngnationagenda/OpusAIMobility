#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# OpusAIMobility — Create CodeBuild Project & Execute First Build
# Prerequisites: AWS CLI configured with appropriate permissions
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

STACK_NAME="OpusAIMobility-CodeBuild"
TEMPLATE_FILE="MobilityAIapp/infra/codebuild/codebuild-project.yml"
REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="OpusAIMobility"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} OpusAIMobility — CodeBuild Project Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI not found. Install it from https://aws.amazon.com/cli/${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}ERROR: AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "  AWS Account: $ACCOUNT_ID"
echo "  Region: $REGION"
echo ""

# Deploy CloudFormation stack
echo -e "${YELLOW}[2/5] Deploying CloudFormation stack: ${STACK_NAME}...${NC}"
aws cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --parameter-overrides \
        GitHubRepoUrl="https://github.com/youngnationagenda/OpusAIMobility.git" \
        GitHubBranch="main" \
    --tags \
        Key=Project,Value=OpusAIMobility \
        Key=ManagedBy,Value=CloudFormation

echo -e "${GREEN}  Stack deployed successfully!${NC}"
echo ""

# Get outputs
echo -e "${YELLOW}[3/5] Retrieving stack outputs...${NC}"
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs" \
    --output json)

echo "$OUTPUTS" | python3 -c "
import json, sys
outputs = json.load(sys.stdin)
for o in outputs:
    print(f\"  {o['OutputKey']}: {o['OutputValue']}\")
"
echo ""

# Store secrets in Parameter Store (if not already set)
echo -e "${YELLOW}[4/5] Checking Parameter Store secrets...${NC}"
PARAMS_TO_CHECK=(
    "/opusaimobility/keystore-password"
    "/opusaimobility/key-alias"
    "/opusaimobility/key-password"
)

for param in "${PARAMS_TO_CHECK[@]}"; do
    if aws ssm get-parameter --name "$param" --region "$REGION" &> /dev/null; then
        echo "  $param — exists"
    else
        echo -e "  ${YELLOW}$param — NOT SET (Android release signing will be skipped)${NC}"
        echo "    To set: aws ssm put-parameter --name \"$param\" --value \"YOUR_VALUE\" --type SecureString"
    fi
done
echo ""

# Start first build
echo -e "${YELLOW}[5/5] Starting first build...${NC}"
BUILD_ID=$(aws codebuild start-build \
    --project-name "$PROJECT_NAME" \
    --region "$REGION" \
    --query 'build.id' \
    --output text)

echo -e "${GREEN}  Build started: ${BUILD_ID}${NC}"
echo ""
echo "  Monitor at:"
echo "    https://${REGION}.console.aws.amazon.com/codesuite/codebuild/projects/${PROJECT_NAME}/build/${BUILD_ID}"
echo ""

# Wait for build (optional)
echo -e "${YELLOW}Waiting for build to complete...${NC}"
echo "(Press Ctrl+C to stop waiting — build continues in background)"
echo ""

aws codebuild batch-get-builds \
    --ids "$BUILD_ID" \
    --region "$REGION" \
    --query 'builds[0].{Status:buildStatus,Phase:currentPhase,Start:startTime}' \
    --output table

# Poll until complete
while true; do
    STATUS=$(aws codebuild batch-get-builds \
        --ids "$BUILD_ID" \
        --region "$REGION" \
        --query 'builds[0].buildStatus' \
        --output text)

    if [ "$STATUS" != "IN_PROGRESS" ]; then
        break
    fi

    PHASE=$(aws codebuild batch-get-builds \
        --ids "$BUILD_ID" \
        --region "$REGION" \
        --query 'builds[0].currentPhase' \
        --output text)
    echo -e "  Status: IN_PROGRESS | Phase: ${PHASE}"
    sleep 15
done

echo ""
if [ "$STATUS" = "SUCCEEDED" ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN} BUILD SUCCEEDED${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED} BUILD ${STATUS}${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "View logs:"
    echo "  aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].logs'"
    exit 1
fi
