/**
 * TERRA-030: CarbonToken Celo Deployment Lambda
 * ─────────────────────────────────────────────
 * Deploys TerraCarbon.sol to Celo Sepolia Testnet from within AWS Lambda
 * (which has unrestricted outbound internet to Celo RPC nodes).
 *
 * Invoke: aws lambda invoke --function-name opusaimobility-celo-deploy ...
 *
 * Deployer wallet: 0x57651B018Fa4aC931Ec585da641078988Ef1213B
 * Network: Celo Sepolia Testnet (Chain ID: 44787)
 * Faucet: https://faucet.celo.org/sepolia
 */

import { ethers }                   from 'ethers';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { LambdaClient, UpdateFunctionConfigurationCommand, GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { requestFaucet }            from './faucet.mjs';

const REGION           = process.env.AWS_REGION       || 'us-east-1';
const SECRET_CELO      = 'terraai/celo-contract';
const SECRET_DEPLOYER  = 'opusaimobility/celo-deployer';
const LAMBDA_FUNCTION  = 'omniride-api';
// Celo Alfajores Testnet RPC (override via env var if needed)
const CELO_RPC = process.env.CELO_RPC || process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org';

// Celo Alfajores Testnet ecosystem contracts
const CELO_SEPOLIA = {
  chainId: 44787,
  rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  blockExplorer: 'https://alfajores.celoscan.io',
  deployer: '0x5b4bf10FE7b795D006BC904f7C058943f09851AF',
  uniswap: {
    factoryV3: '0xE0af690969AFff1A07b23555a6B7C716395Af80D',
    wrappedNativeToken: '0x2cE73DC897A3E10b3FF3F86470847c36ddB735cf',
    nonfungiblePositionManager: '0xf1C20CEb0eeB7f0e5f2A093cEe5B5B96C16C1786',
    swapRouter: '0x3504bB166247eEe664D027D36505925d5A6728B2',
    quoterV2: '0x2b8aeaF519F6Ea889FC76d50F671543F0f965E51',
  },
  tokens: {
    NTC: '0xde6dBD244fBE84141a97DDe4043029D9c61767AE',
    NTEV: '0xCdB1d119Eda8f7A04a820b5002ef2ea8b189bb18',
    USDC: '0x01C5C0122039549AD1493B8220cABEdD739BC44E',
    USDm: '0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80',
    WETH: '0x2cE73DC897A3E10b3FF3F86470847c36ddB735cf',
  },
};

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

    // Connect to Celo Alfajores Testnet (chain ID 44787)
    const chainId = parseInt(process.env.CELO_CHAIN_ID || '44787');
    const networkName = 'alfajores';
    const provider = new ethers.JsonRpcProvider(CELO_RPC, { chainId, name: networkName });
    const wallet   = new ethers.Wallet(deployerPk, provider);

    const balance  = await provider.getBalance(wallet.address);
    const balCELO  = ethers.formatEther(balance);
    console.log('[Deploy] Deployer:', wallet.address, 'Balance:', balCELO, 'CELO');

    if (parseFloat(balCELO) < 0.01) {
      // Auto-attempt faucet funding (Lambda has outbound internet)
      console.log('[Deploy] Balance too low, attempting faucet auto-fund...');
      const faucetResult = await requestFaucet(wallet.address);
      console.log('[Deploy] Faucet result:', JSON.stringify(faucetResult));

      if (faucetResult.success) {
        // Wait 15s for faucet tx to propagate, then re-check
        await new Promise(r => setTimeout(r, 15000));
        const newBalance = await provider.getBalance(wallet.address);
        const newCELO    = ethers.formatEther(newBalance);
        console.log('[Deploy] Balance after faucet:', newCELO, 'CELO');
        if (parseFloat(newCELO) < 0.01) {
          return {
            statusCode: 400,
            body: `Faucet sent funds but balance still low (${newCELO} CELO). Try again in ~30s.`,
          };
        }
      } else {
        return {
          statusCode: 400,
          body: `Insufficient CELO: ${balCELO}. Fund ${wallet.address} at https://faucet.celo.org/alfajores`,
        };
      }
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
        Ecosystem:       CELO_SEPOLIA,
      }),
    }));

    // Update omniride-api Lambda env with contract + ecosystem addresses
    const cfg = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: LAMBDA_FUNCTION }));
    await lambda.send(new UpdateFunctionConfigurationCommand({
      FunctionName: LAMBDA_FUNCTION,
      Environment: {
        Variables: {
          ...cfg.Environment?.Variables,
          CELO_CONTRACT_ADDRESS:  address,
          CELO_NETWORK:           'alfajores',
          CELO_CHAIN_ID:          '44787',
          CELO_RPC_URL:           CELO_RPC,
          CELO_SWAP_ROUTER:       CELO_SEPOLIA.uniswap.swapRouter,
          CELO_USDC_ADDRESS:      CELO_SEPOLIA.tokens.USDC,
          CELO_WETH_ADDRESS:      CELO_SEPOLIA.tokens.WETH,
          CELO_NTC_ADDRESS:       CELO_SEPOLIA.tokens.NTC,
          CELO_NTEV_ADDRESS:      CELO_SEPOLIA.tokens.NTEV,
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
        message:         'TerraCarbon deployed to Celo Sepolia Testnet ✅',
      }),
    };

  } catch (e) {
    console.error('[Deploy] Error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
