/**
 * OpusAIMobility — Full AWS Deployment Script
 * Run: node aws/deploy.js
 *
 * Executes in order:
 *  1.  Cognito User Pool + App Client
 *  2.  IAM Role + Policy for Lambda
 *  3.  DynamoDB Tables (10 tables)
 *  4.  Secrets Manager (Gemini API key)
 *  5.  S3 Bucket (assets)
 *  6.  SNS Topic (notifications)
 *  7.  Lambda function (zip + deploy)
 *  8.  HTTP API Gateway + routes
 *  9.  Lambda permissions for API Gateway
 * 10.  Write .env.local with all real values
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const REGION  = 'us-east-1';
const ACCOUNT = '683541453923';
const PREFIX  = 'opusaimobility';
const ROOT    = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function run(cmd, label) {
  console.log(`\n▶ ${label || cmd.slice(0, 80)}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    return out.trim();
  } catch (e) {
    const msg = e.stderr || e.stdout || e.message;
    if (msg && (msg.includes('already exists') || msg.includes('ResourceInUseException') ||
        msg.includes('EntityAlreadyExists') || msg.includes('BucketAlreadyOwnedByYou'))) {
      console.log(`  ↩ Already exists — skipping`);
      return null;
    }
    console.error(`  ✗ FAILED: ${msg.slice(0, 300)}`);
    throw new Error(label + ' failed');
  }
}

function aws(cmd) {
  return run(`aws ${cmd} --region ${REGION} --output json`, cmd.split(' ').slice(0, 4).join(' '));
}

function json(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

const env = {};   // accumulates all values we write to .env.local at the end

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Cognito User Pool
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 1 — Cognito User Pool');
console.log('═══════════════════════════════════════════════════');

let userPoolId;
const listPools = json(aws(`cognito-idp list-user-pools --max-results 60`));
const existing  = (listPools.UserPools || []).find(p => p.Name === `${PREFIX}-users`);

if (existing) {
  userPoolId = existing.Id;
  console.log(`  ↩ User pool already exists: ${userPoolId}`);
} else {
  const poolDef = path.join(__dirname, 'cognito-pool.json').replace(/\\/g, '/');
  const created = json(
    run(`aws cognito-idp create-user-pool --cli-input-json "file://${poolDef}" --region ${REGION} --output json`,
        'Create Cognito User Pool')
  );
  userPoolId = created?.UserPool?.Id;
  console.log(`  ✔ User Pool: ${userPoolId}`);
}
env.VITE_COGNITO_USER_POOL_ID = userPoolId;

// App Client
let clientId;
const listClients = json(aws(`cognito-idp list-user-pool-clients --user-pool-id ${userPoolId} --max-results 20`));
const existingClient = (listClients.UserPoolClients || []).find(c => c.ClientName === `${PREFIX}-web`);

if (existingClient) {
  clientId = existingClient.ClientId;
  console.log(`  ↩ App client already exists: ${clientId}`);
} else {
  const clientRes = json(aws(
    `cognito-idp create-user-pool-client --user-pool-id ${userPoolId} --client-name ${PREFIX}-web` +
    ` --no-generate-secret` +
    ` --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH` +
    ` --token-validity-units "AccessToken=hours,IdToken=hours,RefreshToken=days"` +
    ` --access-token-validity 1 --id-token-validity 1 --refresh-token-validity 30`
  ));
  clientId = clientRes?.UserPoolClient?.ClientId;
  console.log(`  ✔ App Client: ${clientId}`);
}
env.VITE_COGNITO_CLIENT_ID = clientId;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — IAM Role for Lambda
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 2 — IAM Role & Policy for Lambda');
console.log('═══════════════════════════════════════════════════');

const roleName   = `${PREFIX}-lambda-role`;
const policyName = `${PREFIX}-lambda-policy`;
let   lambdaRoleArn;

try {
  const roleRes = json(run(
    `aws iam create-role --role-name ${roleName}` +
    ` --assume-role-policy-document file://${path.join(__dirname,'lambda-trust-policy.json')}` +
    ` --output json`,
    'Create IAM Role'
  ));
  lambdaRoleArn = roleRes?.Role?.Arn;
  console.log(`  ✔ Role ARN: ${lambdaRoleArn}`);
} catch {
  const r = json(run(`aws iam get-role --role-name ${roleName} --output json`, 'Get existing IAM Role'));
  lambdaRoleArn = r?.Role?.Arn;
  console.log(`  ↩ Using existing role: ${lambdaRoleArn}`);
}

// Attach inline policy
run(
  `aws iam put-role-policy --role-name ${roleName} --policy-name ${policyName}` +
  ` --policy-document file://${path.join(__dirname,'lambda-policy.json')}`,
  'Attach inline policy to Lambda role'
);

// Attach managed basic execution
run(
  `aws iam attach-role-policy --role-name ${roleName}` +
  ` --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`,
  'Attach AWSLambdaBasicExecutionRole'
);

console.log('  Waiting 12 s for IAM role propagation...');
execSync('ping 127.0.0.1 -n 13 > nul 2>&1 || sleep 12');

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — DynamoDB Tables
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 3 — DynamoDB Tables');
console.log('═══════════════════════════════════════════════════');

const tables = [
  { name: 'opusaimobility-users',        pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-trips',        pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-orders',       pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-errands',      pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-transactions', pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-swap-stations',pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-inventory',    pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-blockchain',   pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-audit-logs',   pk: 'id',         billing: 'PAY_PER_REQUEST' },
  { name: 'opusaimobility-platform',     pk: 'configKey',  billing: 'PAY_PER_REQUEST' },
];

for (const t of tables) {
  try {
    aws(
      `dynamodb create-table --table-name ${t.name}` +
      ` --attribute-definitions AttributeName=${t.pk},AttributeType=S` +
      ` --key-schema AttributeName=${t.pk},KeyType=HASH` +
      ` --billing-mode ${t.billing}`
    );
    console.log(`  ✔ Table: ${t.name}`);
  } catch {
    console.log(`  ↩ Table exists: ${t.name}`);
  }
}

// Seed platform config
console.log('  Seeding platform config...');
try {
  aws(
    `dynamodb put-item --table-name opusaimobility-platform --item` +
    ` "{\"configKey\":{\"S\":\"settings\"},\"deductionTime\":{\"S\":\"23:59\"},\"systemWeeklyFee\":{\"N\":\"10\"},\"autoSettlementEnabled\":{\"BOOL\":true}}"`
  );
  console.log('  ✔ Platform config seeded');
} catch (e) {
  console.log('  ↩ Platform config seed skipped:', e.message.slice(0,60));
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Secrets Manager (Gemini API Key)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 4 — Secrets Manager');
console.log('═══════════════════════════════════════════════════');

const secretName = 'opusaimobility/gemini-api-key';
try {
  aws(`secretsmanager create-secret --name ${secretName} --secret-string PLACEHOLDER_SET_IN_CONSOLE`);
  console.log(`  ✔ Secret created: ${secretName}`);
  console.log(`  ⚠  Set the real Gemini key in AWS Secrets Manager console:`);
  console.log(`     https://console.aws.amazon.com/secretsmanager/home?region=us-east-1#!/secret?name=${secretName}`);
} catch {
  console.log(`  ↩ Secret already exists: ${secretName}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — S3 Bucket
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 5 — S3 Assets Bucket');
console.log('═══════════════════════════════════════════════════');

const bucketName = `opusaimobility-assets-prod`;
try {
  // us-east-1 does NOT take CreateBucketConfiguration
  run(`aws s3api create-bucket --bucket ${bucketName} --region ${REGION} --output json`, 'Create S3 bucket');
  console.log(`  ✔ Bucket: ${bucketName}`);
} catch {
  console.log(`  ↩ Bucket already exists`);
}

// Block all public access
run(`aws s3api put-public-access-block --bucket ${bucketName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`,
    'Block public access on S3');

env.VITE_S3_BUCKET    = bucketName;
env.VITE_S3_BASE_URL  = `https://${bucketName}.s3.${REGION}.amazonaws.com`;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — SNS Topic
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 6 — SNS Topic');
console.log('═══════════════════════════════════════════════════');

let snsArn;
const snsRes = json(aws(`sns create-topic --name opusaimobility-notifications`));
snsArn = snsRes?.TopicArn || `arn:aws:sns:${REGION}:${ACCOUNT}:opusaimobility-notifications`;
console.log(`  ✔ SNS Topic: ${snsArn}`);
env.VITE_SNS_TOPIC_ARN = snsArn;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — Lambda Function
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 7 — Lambda Function');
console.log('═══════════════════════════════════════════════════');

const lambdaDir  = path.join(__dirname, 'lambda');
const lambdaZip  = path.join(__dirname, 'lambda.zip');
const functionName = `${PREFIX}-api`;

// Package lambda
console.log('  Packaging Lambda...');
try { fs.unlinkSync(lambdaZip); } catch {}
run(`cd "${lambdaDir}" && node -e "const AdmZip=require('adm-zip');const z=new AdmZip();z.addLocalFolder('.');z.writeZip('${lambdaZip.replace(/\\/g,'/')}');console.log('zipped');"`,
    'Zip Lambda package');

// Deploy or update
let lambdaArn;
try {
  const created = json(
    run(`aws lambda create-function --function-name ${functionName}` +
        ` --runtime nodejs20.x --handler index.handler` +
        ` --role ${lambdaRoleArn}` +
        ` --zip-file fileb://${lambdaZip}` +
        ` --timeout 30 --memory-size 512` +
        ` --environment "Variables={REGION=${REGION},USER_POOL_ID=${userPoolId},CLIENT_ID=${clientId},S3_BUCKET=${bucketName},SNS_TOPIC_ARN=${snsArn},GEMINI_SECRET_NAME=${secretName}}"` +
        ` --region ${REGION} --output json`,
        'Create Lambda function')
  );
  lambdaArn = created?.FunctionArn;
  console.log(`  ✔ Lambda created: ${lambdaArn}`);
} catch {
  // Update existing
  run(`aws lambda update-function-code --function-name ${functionName}` +
      ` --zip-file fileb://${lambdaZip} --region ${REGION}`,
      'Update Lambda code');
  run(`aws lambda update-function-configuration --function-name ${functionName}` +
      ` --environment "Variables={REGION=${REGION},USER_POOL_ID=${userPoolId},CLIENT_ID=${clientId},S3_BUCKET=${bucketName},SNS_TOPIC_ARN=${snsArn},GEMINI_SECRET_NAME=${secretName}}"` +
      ` --region ${REGION}`,
      'Update Lambda env vars');
  const fn = json(run(`aws lambda get-function --function-name ${functionName} --region ${REGION} --output json`, 'Get Lambda ARN'));
  lambdaArn = fn?.Configuration?.FunctionArn;
  console.log(`  ↩ Lambda updated: ${lambdaArn}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8 — HTTP API Gateway (API GW v2)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 8 — HTTP API Gateway');
console.log('═══════════════════════════════════════════════════');

let apiId, apiUrl;

// Check existing
const apis = json(aws(`apigatewayv2 get-apis`));
const existingApi = (apis.Items || []).find(a => a.Name === `${PREFIX}-http-api`);

if (existingApi) {
  apiId  = existingApi.ApiId;
  apiUrl = existingApi.ApiEndpoint;
  console.log(`  ↩ API already exists: ${apiId}`);
} else {
  const apiRes = json(aws(
    `apigatewayv2 create-api --name ${PREFIX}-http-api` +
    ` --protocol-type HTTP` +
    ` --cors-configuration AllowOrigins=*,AllowMethods=*,AllowHeaders=*` +
    ` --target ${lambdaArn}`
  ));
  apiId  = apiRes?.ApiId;
  apiUrl = apiRes?.ApiEndpoint;
  console.log(`  ✔ API created: ${apiId}  →  ${apiUrl}`);
}

// Create $default stage with auto-deploy
try {
  aws(`apigatewayv2 create-stage --api-id ${apiId} --stage-name prod --auto-deploy`);
  console.log('  ✔ Stage: prod (auto-deploy)');
} catch {
  console.log('  ↩ Stage already exists');
}

// Create Lambda integration
let integrationId;
try {
  const intRes = json(aws(
    `apigatewayv2 create-integration --api-id ${apiId}` +
    ` --integration-type AWS_PROXY --integration-uri ${lambdaArn}` +
    ` --payload-format-version 2.0`
  ));
  integrationId = intRes?.IntegrationId;
  console.log(`  ✔ Integration: ${integrationId}`);
} catch {
  const ints = json(aws(`apigatewayv2 get-integrations --api-id ${apiId}`));
  integrationId = ints?.Items?.[0]?.IntegrationId;
  console.log(`  ↩ Integration exists: ${integrationId}`);
}

// Create catch-all route  ANY /{proxy+}
try {
  aws(`apigatewayv2 create-route --api-id ${apiId} --route-key "ANY /{proxy+}" --target integrations/${integrationId}`);
  console.log('  ✔ Route: ANY /{proxy+}');
} catch {
  console.log('  ↩ Route already exists');
}

const prodUrl = `${apiUrl}/prod`;
env.VITE_API_BASE_URL = prodUrl;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9 — Lambda permission for API Gateway
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 9 — Lambda Invoke Permission');
console.log('═══════════════════════════════════════════════════');

try {
  aws(
    `lambda add-permission --function-name ${functionName}` +
    ` --statement-id AllowAPIGW --action lambda:InvokeFunction` +
    ` --principal apigateway.amazonaws.com` +
    ` --source-arn arn:aws:execute-api:${REGION}:${ACCOUNT}:${apiId}/*/*`
  );
  console.log('  ✔ Lambda invoke permission added');
} catch {
  console.log('  ↩ Permission already exists');
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 10 — IoT Endpoint (already exists — just capture it)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 10 — IoT Core Endpoint');
console.log('═══════════════════════════════════════════════════');

const iotRes = json(aws(`iot describe-endpoint --endpoint-type iot:Data-ATS`));
const iotHost = iotRes?.endpointAddress;
env.VITE_IOT_ENDPOINT = `wss://${iotHost}/mqtt`;
env.VITE_AWS_REGION   = REGION;
console.log(`  ✔ IoT endpoint: ${iotHost}`);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 11 — Write .env.local
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════');
console.log(' STEP 11 — Writing .env.local');
console.log('═══════════════════════════════════════════════════');

const envContent = `# ─────────────────────────────────────────────────────────────────────────────
# OpusAIMobility — AWS Environment (auto-generated by aws/deploy.js)
# Generated: ${new Date().toISOString()}
# Account:   ${ACCOUNT}
# Region:    ${REGION}
# ─────────────────────────────────────────────────────────────────────────────

VITE_API_BASE_URL=${env.VITE_API_BASE_URL}
VITE_AWS_REGION=${env.VITE_AWS_REGION}
VITE_COGNITO_USER_POOL_ID=${env.VITE_COGNITO_USER_POOL_ID}
VITE_COGNITO_CLIENT_ID=${env.VITE_COGNITO_CLIENT_ID}
VITE_S3_BUCKET=${env.VITE_S3_BUCKET}
VITE_S3_BASE_URL=${env.VITE_S3_BASE_URL}
VITE_IOT_ENDPOINT=${env.VITE_IOT_ENDPOINT}
VITE_SNS_TOPIC_ARN=${env.VITE_SNS_TOPIC_ARN}

# ─── Gemini key is now in Secrets Manager ─────────────────────────────────────
# Set the real key at:
# https://console.aws.amazon.com/secretsmanager/home?region=us-east-1#!/secret?name=opusaimobility/gemini-api-key
GEMINI_API_KEY=SEE_SECRETS_MANAGER
`;

fs.writeFileSync(path.join(ROOT, '.env.local'), envContent, 'utf8');
console.log(`  ✔ .env.local written with all live AWS values`);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║          OpusAIMobility AWS Deployment Complete        ║');
console.log('╠══════════════════════════════════════════════════╣');
console.log(`║  Cognito Pool  : ${env.VITE_COGNITO_USER_POOL_ID}`);
console.log(`║  App Client    : ${env.VITE_COGNITO_CLIENT_ID}`);
console.log(`║  API Gateway   : ${env.VITE_API_BASE_URL}`);
console.log(`║  S3 Bucket     : ${env.VITE_S3_BUCKET}`);
console.log(`║  IoT Endpoint  : ${iotHost}`);
console.log(`║  SNS Topic     : opusaimobility-notifications`);
console.log('╠══════════════════════════════════════════════════╣');
console.log('║  NEXT STEPS:                                     ║');
console.log('║  1. Set Gemini key in Secrets Manager            ║');
console.log('║  2. npm run build   (in project root)            ║');
console.log('║  3. npm run dev     (for local testing)          ║');
console.log('╚══════════════════════════════════════════════════╝');
