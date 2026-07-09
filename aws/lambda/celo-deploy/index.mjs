/**
 * TERRA-030: CarbonToken Celo Deployment Lambda
 * ─────────────────────────────────────────────
 * Deploys TerraCarbon.sol to Celo Alfajores testnet from within AWS Lambda
 * (which has unrestricted outbound internet to Celo RPC nodes).
 *
 * Invoke: aws lambda invoke --function-name opusaimobility-celo-deploy ...
 */

import { ethers }                   from 'ethers';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { LambdaClient, UpdateFunctionConfigurationCommand, GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';

const REGION           = process.env.AWS_REGION       || 'us-east-1';
const SECRET_CELO      = 'terraai/celo-contract';
const SECRET_DEPLOYER  = 'opusaimobility/celo-deployer';
const LAMBDA_FUNCTION  = 'omniride-api';
// Support runtime override via env var (for switching RPC endpoints)
const CELO_RPC = process.env.CELO_RPC || process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org';

// Minimal TerraCarbon ABI + bytecode (compiled artifact)
// Full artifact stored in contracts/artifacts after local compile
const DEPLOYER_PK = process.env.CELO_DEPLOYER_PK; // Set in Lambda env vars

// TerraCarbon constructor ABI
const ABI = [
  'constructor(address admin)',
  'function getStats() view returns (uint256, uint256, uint256, uint256, uint256)',
  'function mintForTrip(address rider, uint256 distanceKm, string calldata tripId, string calldata vehicleId) external',
  'function grantRole(bytes32 role, address account) external',
  'function MINTER_ROLE() view returns (bytes32)',
];

export const handler = async (event) => {
  const sm     = new SecretsManagerClient({ region: REGION });
  const lambda = new LambdaClient({ region: REGION });

  try {
    // Get deployer private key from Secrets Manager (or env)
    let deployerPk = DEPLOYER_PK;
    if (!deployerPk) {
      const sec = await sm.send(new GetSecretValueCommand({ SecretId: SECRET_DEPLOYER }));
      const creds = JSON.parse(sec.SecretString);
      deployerPk = creds.privateKey;
    }

    if (!deployerPk || deployerPk.includes('PLACEHOLDER')) {
      return { statusCode: 400, body: 'CELO_DEPLOYER_PK not set. Fund wallet and set key.' };
    }

    // Connect to Celo Alfajores
    // Detect chain from env or use mainnet (42220) with forno, testnet (44787) with alfajores RPC
    const chainId = parseInt(process.env.CELO_CHAIN_ID || '42220');
    const networkName = chainId === 44787 ? 'alfajores' : 'celo';
    const provider = new ethers.JsonRpcProvider(CELO_RPC, { chainId, name: networkName });
    const wallet   = new ethers.Wallet(deployerPk, provider);

    const balance  = await provider.getBalance(wallet.address);
    const balCELO  = ethers.formatEther(balance);
    console.log('[Deploy] Deployer:', wallet.address, 'Balance:', balCELO, 'CELO');

    if (parseFloat(balCELO) < 0.01) {
      return {
        statusCode: 400,
        body: `Insufficient CELO: ${balCELO}. Fund ${wallet.address} at https://faucet.celo.org/alfajores`,
      };
    }

    // Get compiled bytecode from Secrets Manager (stored after local compile)
    const bytecodeSec = await sm.send(new GetSecretValueCommand({ SecretId: 'opusaimobility/celo-bytecode' })).catch(() => null);
    if (!bytecodeSec) {
      return { statusCode: 400, body: 'Bytecode not found. Run: node aws/lambda/celo-deploy/upload-bytecode.js first.' };
    }
    const { bytecode, abi } = JSON.parse(bytecodeSec.SecretString);

    // Deploy contract
    const factory  = new ethers.ContractFactory(abi || ABI, bytecode, wallet);
    const contract = await factory.deploy(wallet.address);
    await contract.waitForDeployment();

    const address  = await contract.getAddress();
    const txHash   = contract.deploymentTransaction()?.hash;
    console.log('[Deploy] TerraCarbon deployed at:', address);

    // Update Secrets Manager with contract info
    await sm.send(new PutSecretValueCommand({
      SecretId: SECRET_CELO,
      SecretString: JSON.stringify({
        ContractAddress: address,
        AdminAddress:    wallet.address,
        Network:         'alfajores',
        ChainId:         44787,
        CeloRpcUrl:      CELO_RPC,
        DeployedAt:      new Date().toISOString(),
        TxHash:          txHash,
        CeloscanUrl:     `https://alfajores.celoscan.io/address/${address}`,
      }),
    }));

    // Update omniride-api Lambda env
    const cfg = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: LAMBDA_FUNCTION }));
    await lambda.send(new UpdateFunctionConfigurationCommand({
      FunctionName: LAMBDA_FUNCTION,
      Environment: {
        Variables: {
          ...cfg.Environment?.Variables,
          CELO_CONTRACT_ADDRESS: address,
          CELO_NETWORK:          'alfajores',
          CELO_CHAIN_ID:         '44787',
          CELO_RPC_URL:          CELO_RPC,
        },
      },
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success:         true,
        contractAddress: address,
        txHash,
        deployer:        wallet.address,
        celoscanUrl:     `https://alfajores.celoscan.io/address/${address}`,
        message:         'TerraCarbon deployed to Celo Alfajores ✅',
      }),
    };

  } catch (e) {
    console.error('[Deploy] Error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
