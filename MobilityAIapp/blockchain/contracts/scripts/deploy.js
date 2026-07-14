/**
 * Deploy TerraCarbon.sol to Celo Alfajores
 * TICKET: TERRA-030
 *
 * Run: npx hardhat run scripts/deploy.js --network alfajores
 *
 * After deploy:
 *  1. Update Secrets Manager: terraai/celo-contract
 *  2. Update omniride-api Lambda env: CELO_CONTRACT_ADDRESS
 *  3. Run: npx hardhat verify --network alfajores <ADDRESS> <ADMIN>
 */

const { ethers } = require('hardhat');
const {
  SecretsManagerClient,
  PutSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} = require('@aws-sdk/client-lambda');

const REGION           = 'us-east-1';
const SECRET_NAME      = 'terraai/celo-contract';
const LAMBDA_FUNCTION  = 'omniride-api';

async function main() {
  console.log('\n🚀 Deploying TerraCarbon to Celo Alfajores...\n');

  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);

  console.log('Deployer:', deployer.address);
  console.log('Balance: ', ethers.formatEther(balance), 'CELO');

  if (balance === 0n) {
    console.warn('⚠️  Zero balance! Get test CELO from: https://faucet.celo.org');
    process.exit(1);
  }

  // Deploy contract
  const TerraCarbon = await ethers.getContractFactory('TerraCarbon');
  const contract    = await TerraCarbon.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\n✅ TerraCarbon deployed!');
  console.log('   Address:', address);
  console.log('   Admin:  ', deployer.address);
  console.log('   Network: Celo Alfajores (chainId: 44787)');
  console.log('   Explorer: https://alfajores.celoscan.io/address/' + address);

  // Verify initial state
  const stats = await contract.getStats();
  console.log('\n📊 Initial Stats:');
  console.log('   Total Supply:', ethers.formatEther(stats[0]), 'TCRBN');
  console.log('   Market Rate: $', (Number(stats[4]) / 1e6).toFixed(4));

  // Update AWS Secrets Manager
  try {
    const sm = new SecretsManagerClient({ region: REGION });
    const secretValue = JSON.stringify({
      ContractAddress:  address,
      AdminAddress:     deployer.address,
      Network:          'alfajores',
      ChainId:          44787,
      CeloRpcUrl:       'https://alfajores-forno.celo-testnet.org',
      DeployedAt:       new Date().toISOString(),
      ABI_Note:         'Full ABI in contracts/artifacts/contracts/CarbonToken.sol/TerraCarbon.json',
    });
    await sm.send(new PutSecretValueCommand({ SecretId: SECRET_NAME, SecretString: secretValue }));
    console.log('\n✅ Secrets Manager updated:', SECRET_NAME);
  } catch (e) {
    console.warn('⚠️  Could not update Secrets Manager:', e.message);
    console.log('   Manual update required: aws secretsmanager put-secret-value \\');
    console.log('     --secret-id', SECRET_NAME, '--secret-string', JSON.stringify({ ContractAddress: address }));
  }

  // Update Lambda env var
  try {
    const lambda = new LambdaClient({ region: REGION });
    await lambda.send(new UpdateFunctionConfigurationCommand({
      FunctionName: LAMBDA_FUNCTION,
      Environment:  { Variables: { CELO_CONTRACT_ADDRESS: address, CELO_NETWORK: 'alfajores' } },
    }));
    console.log('✅ Lambda env updated:', LAMBDA_FUNCTION, '→ CELO_CONTRACT_ADDRESS =', address);
  } catch (e) {
    console.warn('⚠️  Could not update Lambda env:', e.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('  1. npx hardhat verify --network alfajores', address, deployer.address);
  console.log('  2. Set MINTER_ROLE for Lambda wallet:');
  console.log('     contract.grantRole(MINTER_ROLE, <LAMBDA_WALLET_ADDRESS>)');
  console.log('  3. Fund Lambda wallet with CELO for gas');
  console.log('  4. Test: node scripts/test-contract.js');
  console.log('\n🎉 TERRA-030 deployment complete!\n');
}

main().catch(e => { console.error(e); process.exit(1); });
