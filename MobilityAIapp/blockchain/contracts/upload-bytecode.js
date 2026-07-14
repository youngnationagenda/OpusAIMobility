/**
 * Upload compiled TerraCarbon bytecode to AWS Secrets Manager
 * Run this after: npx hardhat compile
 * Then deploy from Lambda via: aws lambda invoke ...opusaimobility-celo-deploy
 */
const fs   = require('fs');
const path = require('path');
const { SecretsManagerClient, CreateSecretCommand, PutSecretValueCommand, DescribeSecretCommand } = require('@aws-sdk/client-secrets-manager');

const ARTIFACT_PATH = path.join(__dirname, 'artifacts/contracts/CarbonToken.sol/TerraCarbon.json');
const SECRET_ID     = 'opusaimobility/celo-bytecode';
const REGION        = 'us-east-1';

async function main() {
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'));
  console.log('Bytecode length:', artifact.bytecode.length);
  console.log('ABI functions:  ', artifact.abi.filter(x => x.type === 'function').length);

  const payload = JSON.stringify({ bytecode: artifact.bytecode, abi: artifact.abi });
  console.log('Payload size:   ', Math.round(payload.length / 1024), 'KB');

  const sm = new SecretsManagerClient({ region: REGION });

  try {
    await sm.send(new DescribeSecretCommand({ SecretId: SECRET_ID }));
    await sm.send(new PutSecretValueCommand({ SecretId: SECRET_ID, SecretString: payload }));
    console.log('✅ Bytecode updated in Secrets Manager:', SECRET_ID);
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') {
      await sm.send(new CreateSecretCommand({
        Name: SECRET_ID,
        Description: 'TerraCarbon compiled bytecode for Lambda deployment (TERRA-030)',
        SecretString: payload,
      }));
      console.log('✅ Bytecode stored in Secrets Manager:', SECRET_ID);
    } else throw e;
  }
}

main().catch(e => { console.error('Failed:', e.message); process.exit(1); });
