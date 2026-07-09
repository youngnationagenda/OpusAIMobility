const { ethers, network } = require('hardhat');
async function main() {
  console.log('Testing RPC:', network.config?.url);
  const block = await ethers.provider.getBlockNumber();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log('✅ Connected! Block:', block, 'ChainId:', chainId.toString());
}
main().catch(e => {
  console.log('❌ RPC failed:', e.code, e.message?.slice(0,100));
  console.log('Network config URL:', require('hardhat').network.config?.url);
});
