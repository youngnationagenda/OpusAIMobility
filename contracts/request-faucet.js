/**
 * Request testnet CELO from Alfajores faucet
 * Wallet: 0x5b4bf10FE7b795D006BC904f7C058943f09851AF
 *
 * NOTE: The faucet requires a browser/CAPTCHA interaction at:
 *       https://faucet.celo.org/alfajores
 *
 * This script tries known API endpoints as a convenience —
 * if all fail, use the manual URL above.
 */
const https = require('https');
const WALLET = '0x5b4bf10FE7b795D006BC904f7C058943f09851AF';

const ENDPOINTS = [
  { host: 'faucet.celo.org', path: '/api/fund',          body: { beneficiary: WALLET, token: 'CELO' } },
  { host: 'faucet.celo.org', path: '/api/requestTokens', body: { address: WALLET, network: 'alfajores' } },
  { host: 'faucet.celo.org', path: '/api/request',       body: { address: WALLET } },
];

function tryEndpoint({ host, path, body }) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: host,
        path,
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent':     'OpusAIMobility-FaucetScript/1.0',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 300) }));
      }
    );
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: 0, body: 'TIMEOUT' }); });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('🪙  Requesting testnet CELO for:', WALLET);
  console.log('');

  for (const ep of ENDPOINTS) {
    process.stdout.write(`Trying https://${ep.host}${ep.path} ... `);
    const result = await tryEndpoint(ep);
    console.log(`HTTP ${result.status}`);
    if (result.body) console.log('   ', result.body.slice(0, 120));

    if (result.status >= 200 && result.status < 300) {
      console.log('\n✅ CELO requested successfully for', WALLET);
      console.log('   Wait ~30s then check balance with:');
      console.log('   npx hardhat run check-celo-balance.js --network alfajores');
      return;
    }
  }

  console.log('\n⚠️  All API endpoints failed (faucet may require browser/CAPTCHA).');
  console.log('   → Fund manually at: https://faucet.celo.org/alfajores');
  console.log('   → Paste wallet:     ', WALLET);
  console.log('');
  console.log('   After funding, re-invoke Lambda:');
  console.log('   aws lambda invoke --function-name opusaimobility-celo-deploy --payload "{}" --cli-binary-format raw-in-base64-out celo-out.json');
}

main().catch(console.error);
