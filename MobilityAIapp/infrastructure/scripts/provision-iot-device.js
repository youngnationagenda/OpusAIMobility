'use strict';
/**
 * TERRA-010: IoT Device Certificate Provisioning per Rider
 * ─────────────────────────────────────────────────────────
 * Creates an AWS IoT Thing + X.509 certificate for each rider device.
 *
 * Usage:
 *   node aws/scripts/provision-iot-device.js --rider-id <RIDER_ID> --vehicle <VEHICLE_MODEL>
 *
 * What this does:
 *   1. Creates an IoT Thing of type 'opusaimobility-ev-rider'
 *   2. Generates an X.509 certificate + private key
 *   3. Attaches policy 'opusaimobility-rider-iot-policy' to the certificate
 *   4. Attaches the certificate to the Thing
 *   5. Stores certificate + private key in Secrets Manager
 *   6. Returns the IoT endpoint + clientId for the Android app
 */

const {
  IoTClient,
  CreateThingCommand,
  CreateKeysAndCertificateCommand,
  AttachPolicyCommand,
  AttachThingPrincipalCommand,
  DescribeEndpointCommand,
} = require('@aws-sdk/client-iot');
const {
  SecretsManagerClient,
  CreateSecretCommand,
  PutSecretValueCommand,
  DescribeSecretCommand,
} = require('@aws-sdk/client-secrets-manager');

const REGION      = 'us-east-1';
const THING_TYPE  = 'opusaimobility-ev-rider';
const IOT_POLICY  = 'opusaimobility-rider-iot-policy';

const iot = new IoTClient({ region: REGION });
const sm  = new SecretsManagerClient({ region: REGION });

function parseArgs() {
  const args = process.argv.slice(2);
  let riderId = '', vehicle = 'EV Rider';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rider-id') riderId = args[++i] ?? '';
    if (args[i] === '--vehicle')  vehicle  = args[++i] ?? '';
  }
  if (!riderId) {
    // Generate a test rider ID
    riderId = 'rider-demo-' + Date.now().toString(36);
    console.log(`ℹ️  No --rider-id provided, using: ${riderId}`);
  }
  return { riderId, vehicle };
}

async function provisionRider(riderId, vehicle) {
  const thingName = `opusaimobility-rider-${riderId}`;
  const secretId  = `opusaimobility/iot-cert/${riderId}`;

  console.log(`\n🔧 Provisioning IoT device for rider: ${riderId}\n`);

  // 1. Create IoT Thing
  try {
    await iot.send(new CreateThingCommand({
      thingName,
      thingTypeName: THING_TYPE,
      attributePayload: {
        // IoT attribute values: alphanumeric + limited specials only
        attributes: { riderId, vehicleModel: vehicle.replace(/[^a-zA-Z0-9_.,@/#=\-]/g, '_') },
      },
    }));
    console.log(`✅ IoT Thing created: ${thingName}`);
  } catch (e) {
    if (e.name === 'ResourceAlreadyExistsException') {
      console.log(`ℹ️  Thing already exists: ${thingName}`);
    } else throw e;
  }

  // 2. Create X.509 certificate
  const certRes = await iot.send(new CreateKeysAndCertificateCommand({ setAsActive: true }));
  const certArn  = certRes.certificateArn;
  const certId   = certRes.certificateId;
  const certPem  = certRes.certificatePem;
  const privKey  = certRes.keyPair?.PrivateKey;
  const pubKey   = certRes.keyPair?.PublicKey;
  console.log(`✅ Certificate created: ${certId.slice(0, 16)}...`);

  // 3. Attach policy to certificate
  await iot.send(new AttachPolicyCommand({ policyName: IOT_POLICY, target: certArn }));
  console.log(`✅ Policy attached: ${IOT_POLICY}`);

  // 4. Attach certificate to Thing
  await iot.send(new AttachThingPrincipalCommand({ thingName, principal: certArn }));
  console.log(`✅ Certificate attached to thing: ${thingName}`);

  // 5. Get IoT endpoint
  const ep = await iot.send(new DescribeEndpointCommand({ endpointType: 'iot:Data-ATS' }));
  const iotEndpoint = ep.endpointAddress;

  // 6. Store credentials in Secrets Manager
  const secretPayload = JSON.stringify({
    riderId,
    thingName,
    certId,
    certArn,
    certificatePem: certPem,
    privateKey:     privKey,
    publicKey:      pubKey,
    iotEndpoint,
    clientId:       thingName,
    provisionedAt:  new Date().toISOString(),
  });

  try {
    await sm.send(new DescribeSecretCommand({ SecretId: secretId }));
    await sm.send(new PutSecretValueCommand({ SecretId: secretId, SecretString: secretPayload }));
    console.log(`✅ Secrets Manager updated: ${secretId}`);
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') {
      await sm.send(new CreateSecretCommand({
        Name:         secretId,
        Description:  `IoT X.509 credentials for rider ${riderId}`,
        SecretString: secretPayload,
      }));
      console.log(`✅ Secrets Manager created: ${secretId}`);
    } else throw e;
  }

  console.log(`\n🎉 TERRA-010: Rider ${riderId} IoT device provisioned!\n`);
  console.log('Android configuration:');
  console.log(`  IoT Endpoint:  ${iotEndpoint}`);
  console.log(`  Client ID:     ${thingName}`);
  console.log(`  Certificate:   Retrieve from Secrets Manager: ${secretId}`);
  console.log(`  Topics:        opusaimobility/telemetry/${thingName}`);
  console.log(`                 opusaimobility/location/${thingName}`);
  console.log(`                 opusaimobility/notifications/${thingName}\n`);

  return { riderId, thingName, iotEndpoint, certId, secretId };
}

async function run() {
  const { riderId, vehicle } = parseArgs();
  try {
    const result = await provisionRider(riderId, vehicle);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('❌ Provisioning failed:', e.message);
    process.exit(1);
  }
}

run();
