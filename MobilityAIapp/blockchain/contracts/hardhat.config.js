/**
 * Hardhat configuration — TERRA-030
 * Deploy CarbonToken.sol to Celo Sepolia Testnet
 *
 * Networks:
 *   celo-sepolia — Celo Sepolia testnet (chain 44787)  <- deploy here first
 *   celo         — Celo mainnet (chain 42220)          <- production
 *   hardhat      — local testing
 *
 * Deployer wallet: 0x57651B018Fa4aC931Ec585da641078988Ef1213B
 *
 * Usage:
 *   npx hardhat compile
 *   npx hardhat test
 *   npx hardhat run scripts/deploy.js --network celo-sepolia
 *   npx hardhat verify --network celo-sepolia <CONTRACT_ADDRESS> <ADMIN_ADDRESS>
 */

require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: '.env.deploy' });

const DEPLOYER_PK   = process.env.DEPLOYER_PRIVATE_KEY || '0x' + '0'.repeat(64);
// Celo Sepolia RPC (replaces deprecated Alfajores)
const CELO_RPC_SEPOLIA = process.env.CELO_RPC_SEPOLIA
  || 'https://forno.celo-sepolia.celo-testnet.org';
const CELO_RPC_MAINNET = 'https://forno.celo.org';

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    'celo-sepolia': {
      url:      CELO_RPC_SEPOLIA,
      chainId:  11142220,
      accounts: [DEPLOYER_PK],
      gasPrice: 5_000_000_000, // 5 gwei
    },
    celo: {
      url:      CELO_RPC_MAINNET,
      chainId:  42220,
      accounts: [DEPLOYER_PK],
      gasPrice: 5_000_000_000,
    },
  },
  etherscan: {
    apiKey: {
      'celo-sepolia': process.env.CELOSCAN_API_KEY || 'PLACEHOLDER',
      celo:           process.env.CELOSCAN_API_KEY || 'PLACEHOLDER',
    },
    customChains: [
      {
        network: 'celo-sepolia',
        chainId: 11142220,
        urls: {
          apiURL:     'https://api-sepolia.celoscan.io/api',
          browserURL: 'https://sepolia.celoscan.io',
        },
      },
      {
        network: 'celo',
        chainId: 42220,
        urls: {
          apiURL:     'https://api.celoscan.io/api',
          browserURL: 'https://celoscan.io',
        },
      },
    ],
  },
  paths: {
    sources:  './contracts',
    tests:    './test',
    cache:    './cache',
    artifacts:'./artifacts',
  },
};
