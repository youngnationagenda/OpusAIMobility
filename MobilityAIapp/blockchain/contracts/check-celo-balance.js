const { ethers, network } = require('hardhat');
async function main() {
  const wallet = '0x5b4bf10FE7b795D006BC904f7C058943f09851AF';
  console.log('Network:', network.name);
  console.log('RPC:', network.config?.url || 'local');
  try {
    const balance = await ethers.provider.getBalance(wallet);
    const celo = ethers.formatEther(balance);
    console.log(`Wallet:  ${wallet}`);
    console.log(`Balance: ${celo} CELO`);
    if (parseFloat(celo) > 0.01) console.log('✅ Ready to deploy!');
    else {
      console.log('⚠️  Needs CELO. Visit: https://faucet.celo.org/alfajores');
      console.log('   Wallet:', wallet);
    }
  } catch (e) {
    console.log('RPC error:', e.code || e.message?.slice(0,100));
    console.log('⚠️  Fund wallet at: https://faucet.celo.org/alfajores →', wallet);
  }
}
main();
