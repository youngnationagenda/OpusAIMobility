'use strict';
/**
 * TERRA-080: Setup FCM → SNS + Lambda wiring (Firebase HTTP v1)
 * ──────────────────────────────────────────────────────────────
 * This script wires everything together after the Firebase service account
 * has been loaded into AWS Secrets Manager.
 *
 * Service account location in Secrets Manager:
 *   opusaimobility/firebase-service-account
 *
 * What this script does:
 *   1. Verifies service account is loaded in Secrets Manager
 *   2. Confirms opusaimobility-push-endpoints DynamoDB table exists
 *   3. Updates opusaimobility-push-notification Lambda env with FCM project ID
 *   4. Ensures aimobility-push Lambda knows to route through opusaimobility-push-notification
 *   5. Prints a summary of the full push delivery pipeline
 *
 * NOTE: Firebase HTTP v1 API does NOT use a legacy "Server Key".
 *       It uses OAuth2 access tokens derived from the service account private key.
 *       SNS Platform Application is NOT needed for FCM HTTP v1.
 *       The opusaimobility-push-notification Lambda handles FCM directly.
 *
 * Run: node aws/scripts/setup-fcm-sns.js
 */

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const {
  DynamoDBClient,
  DescribeTableCommand,
} = require('@aws-sdk/client-dynamodb');
const {
  LambdaClient,
  GetFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommand,
} = require('@aws-sdk/client-lambda');

const REGION = 'us-east-1';
const FCM_SECRET_ID  = 'opusaimobility/firebase-service-account';
const PUSH_TABLE     = 'opusaimobility-push-endpoints';
const PUSH_LAMBDA    = 'opusaimobility-push-notification';
const OLD_LAMBDA     = 'aimobility-push';

const sm     = new SecretsManagerClient({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });
const lambda = new LambdaClient({ region: REGION });

async function run() {
  console.log('\n🔔 TERRA-080: FCM HTTP v1 Wiring Setup\n');

  // ── 1. Verify service account in Secrets Manager ──────────────────────────
  let serviceAccount;
  try {
    const secret = await sm.send(new GetSecretValueCommand({ SecretId: FCM_SECRET_ID }));
    serviceAccount = JSON.parse(secret.SecretString);
    console.log(`✅ Firebase service account loaded`);
    console.log(`   Project:       ${serviceAccount.project_id}`);
    console.log(`   Client email:  ${serviceAccount.client_email}`);
    console.log(`   Key ID:        ${serviceAccount.private_key_id}`);
  } catch (e) {
    console.error('❌ Service account not found in Secrets Manager:', e.message);
    console.error(`   Expected secret: ${FCM_SECRET_ID}`);
    process.exit(1);
  }

  // ── 2. Confirm opusaimobility-push-endpoints table ────────────────────────
  try {
    const table = await dynamo.send(new DescribeTableCommand({ TableName: PUSH_TABLE }));
    console.log(`✅ DynamoDB table: ${PUSH_TABLE} (${table.Table.TableStatus})`);
  } catch (e) {
    console.error(`❌ DynamoDB table missing: ${PUSH_TABLE}`, e.message);
    console.error('   Run: aws dynamodb create-table --table-name opusaimobility-push-endpoints ...');
    process.exit(1);
  }

  // ── 3. Update opusaimobility-push-notification Lambda env ─────────────────
  const pushConfig = await lambda.send(new GetFunctionConfigurationCommand({
    FunctionName: PUSH_LAMBDA,
  }));
  const currentEnv = pushConfig.Environment?.Variables || {};
  const newPushEnv  = {
    ...currentEnv,
    FCM_PROJECT_ID:          serviceAccount.project_id,
    FCM_SERVICE_ACCOUNT_SECRET: FCM_SECRET_ID,
    PUSH_ENDPOINTS_TABLE:    PUSH_TABLE,
  };

  await lambda.send(new UpdateFunctionConfigurationCommand({
    FunctionName: PUSH_LAMBDA,
    Environment:  { Variables: newPushEnv },
  }));
  console.log(`✅ ${PUSH_LAMBDA} Lambda updated with FCM env vars`);

  // ── 4. Update aimobility-push Lambda to indicate FCM v1 routing ───────────
  try {
    const oldConfig = await lambda.send(new GetFunctionConfigurationCommand({
      FunctionName: OLD_LAMBDA,
    }));
    const oldEnv = oldConfig.Environment?.Variables || {};
    const newOldEnv = {
      ...oldEnv,
      SNS_PLATFORM_APP_ARN:      'FCM_V1_VIA_OPUSAIMOBILITY_PUSH_NOTIFICATION',
      FCM_PROJECT_ID:            serviceAccount.project_id,
      FCM_SERVICE_ACCOUNT_SECRET: FCM_SECRET_ID,
    };
    await lambda.send(new UpdateFunctionConfigurationCommand({
      FunctionName: OLD_LAMBDA,
      Environment:  { Variables: newOldEnv },
    }));
    console.log(`✅ ${OLD_LAMBDA} Lambda updated (PENDING_FCM_KEY → v1 routing)`);
  } catch (e) {
    console.warn(`⚠️  Could not update ${OLD_LAMBDA}: ${e.message} (non-fatal)`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 TERRA-080 Complete! FCM HTTP v1 pipeline is ready.\n');
  console.log('Push Notification Delivery Stack:');
  console.log('  Android App → POST /devices/token  (register FCM token)');
  console.log('         ↓  opusaimobility-push-endpoints DynamoDB');
  console.log('  Backend → SNS opusaimobility-notifications topic');
  console.log('         ↓  opusaimobility-push-notification Lambda');
  console.log('         ├─ FCM HTTP v1 → Android device (real push)');
  console.log('         ├─ IoT Core MQTT → in-app real-time');
  console.log('         └─ WebSocket    → active browser session');
  console.log('\nFCM project:     ', serviceAccount.project_id);
  console.log('Service account: ', serviceAccount.client_email);
  console.log('Secret:          ', FCM_SECRET_ID);
  console.log('Secrets ARN:      arn:aws:secretsmanager:us-east-1:683541453923:secret:opusaimobility/firebase-service-account-gmC4Ui');
  console.log('Push table:      ', PUSH_TABLE);
  console.log('Push Lambda:     ', PUSH_LAMBDA, '\n');
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
