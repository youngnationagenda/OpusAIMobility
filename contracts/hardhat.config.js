/**
 * Hardhat configuration — TERRA-030
 * Deploy CarbonToken.sol to Celo Alfajores Testnet
 *
 * Networks:
 *   alfajores  — Celo testnet (chain 44787)  ← deploy here first
 *   celo       — Celo mainnet (chain 42220)  ← production
 *   hardhat    — local testing
 *
 * Usage:
 *   npx hardhat compile
 *   npx hardhat test
 *   npx hardhat run scripts/deploy.js --network alfajores
 *   npx hardhat verify --network alfajores <CONTRACT_ADDRESS> <ADMIN_ADDRESS>
 */

require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: '.env.deploy' });

const DEPLOYER_PK   = process.env.DEPLOYER_PRIVATE_KEY || '0x' + '0'.repeat(64);
// Public Alfajores RPC endpoints (in order of preference)
const CELO_RPC_ALFAJORES = process.env.CELO_RPC_ALFAJORES
  || 'https://alfajores-forno.celo-testnet.org';
const CELO_RPC_MAINNET   = 'https://forno.celo.org';

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
    alfajores: {
      url:      CELO_RPC_ALFAJORES,
      chainId:  44787,
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
      alfajores: process.env.CELOSCAN_API_KEY || 'PLACEHOLDER',
      celo:      process.env.CELOSCAN_API_KEY || 'PLACEHOLDER',
    },
    customChains: [
      {
        network: 'alfajores',
        chainId: 44787,
        urls: {
          apiURL:     'https://api-alfajores.celoscan.io/api',
          browserURL: 'https://alfajores.celoscan.io',
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
