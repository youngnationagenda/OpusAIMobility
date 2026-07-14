/**
 * TERRA-030: Deploy TerraCarbon.sol to Celo Alfajores
 * Full deploy + AWS Secrets Manager + Lambda env update
 */
const { ethers } = require('hardhat');
const {
  SecretsManagerClient, PutSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const {
  LambdaClient, UpdateFunctionConfigurationCommand, GetFunctionConfigurationCommand,
} = require('@aws-sdk/client-lambda');

const REGION          = 'us-east-1';
const SECRET_NAME     = 'terraai/celo-contract';
const LAMBDA_FUNCTION = 'omniride-api';

async function main() {
  console.log('\n🚀 Deploying TerraCarbon to Celo Alfajores...\n');

  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);
  const balCELO    = ethers.formatEther(balance);

  console.log('Deployer:', deployer.address);
  console.log('Balance: ', balCELO, 'CELO');

  if (parseFloat(balCELO) < 0.01) {
    console.error('\n❌ Insufficient CELO balance!');
    console.error('   Fund your wallet at: https://faucet.celo.org/alfajores');
    console.error('   Wallet address:', deployer.address);
    process.exit(1);
  }

  // Deploy TerraCarbon contract
  console.log('\n📦 Deploying TerraCarbon...');
  const TerraCarbon = await ethers.getContractFactory('TerraCarbon');
  const contract    = await TerraCarbon.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash  = contract.deploymentTransaction()?.hash;

  console.log('\n✅ TerraCarbon deployed!');
  console.log('   Address: ', address);
  console.log('   Admin:   ', deployer.address);
  console.log('   Tx hash: ', txHash);
  console.log('   Explorer: https://alfajores.celoscan.io/address/' + address);

  // Verify initial state
  const stats = await contract.getStats();
  console.log('\n📊 Contract State:');
  console.log('   Total Supply: ', ethers.formatEther(stats[0]), 'TCRBN');
  console.log('   Market Rate:  $', (Number(stats[4]) / 1e6).toFixed(4), 'per TCRBN');

  // Update AWS Secrets Manager
  const sm = new SecretsManagerClient({ region: REGION });
  const secretValue = JSON.stringify({
    ContractAddress:  address,
    AdminAddress:     deployer.address,
    Network:          'alfajores',
    ChainId:          44787,
    CeloRpcUrl:       'https://celo-alfajores.drpc.org',
    DeployedAt:       new Date().toISOString(),
    TxHash:           txHash,
    CeloscanUrl:      `https://alfajores.celoscan.io/address/${address}`,
  });

  await sm.send(new PutSecretValueCommand({ SecretId: SECRET_NAME, SecretString: secretValue }));
  console.log('\n✅ Secrets Manager updated:', SECRET_NAME);

  // Update Lambda env
  const lambdaClient = new LambdaClient({ region: REGION });
  const cfg = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: LAMBDA_FUNCTION }));
  const currentEnv = cfg.Environment?.Variables || {};

  await lambdaClient.send(new UpdateFunctionConfigurationCommand({
    FunctionName: LAMBDA_FUNCTION,
    Environment: {
      Variables: {
        ...currentEnv,
        CELO_CONTRACT_ADDRESS: address,
        CELO_NETWORK:          'alfajores',
        CELO_CHAIN_ID:         '44787',
        CELO_RPC_URL:          'https://celo-alfajores.drpc.org',
      },
    },
  }));
  console.log('✅ Lambda env updated:', LAMBDA_FUNCTION);

  console.log('\n📋 Next Steps:');
  console.log('  1. Verify contract: npx hardhat verify --network alfajores', address, deployer.address);
  console.log('  2. Grant MINTER_ROLE to Lambda wallet');
  console.log('  3. Test mintForTrip via Lambda');
  console.log('\n🎉 TERRA-030 Complete!\n');
}

main().catch(e => { console.error('Deploy failed:', e.message); process.exit(1); });
