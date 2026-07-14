const { ethers } = require('hardhat');
async function main() {
  const wallet = ethers.Wallet.createRandom();
  console.log('Address:   ', wallet.address);
  console.log('PrivateKey:', wallet.privateKey);
  console.log('Mnemonic:  ', wallet.mnemonic?.phrase || 'N/A');
}
main().catch(console.error);
