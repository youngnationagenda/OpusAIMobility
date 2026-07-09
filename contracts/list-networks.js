async function main() {
  const hre = require('hardhat');
  console.log('Config networks:', Object.keys(hre.config.networks));
}
main();
