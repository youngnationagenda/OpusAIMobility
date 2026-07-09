// Request testnet CELO from Alfajores faucet
const https = require('https');
const WALLET = '0x5b4bf10FE7b795D006BC904f7C058943f09851AF';

// Try the official Alfajores faucet API
const payload = JSON.stringify({ beneficiary: WALLET, token: 'CELO' });

const options = {
  hostname: 'faucet.celo.org',
  path:     '/api/fund',
  method:   'POST',
  headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Faucet HTTP:', res.statusCode);
    console.log('Response:', data.slice(0, 500));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ CELO sent to', WALLET);
    } else {
      console.log('ℹ️  Get testnet CELO manually: https://faucet.celo.org/alfajores');
    }
  });
});
req.on('error', e => {
  console.log('Faucet request failed:', e.message);
  console.log('ℹ️  Get testnet CELO manually at: https://faucet.celo.org/alfajores');
  console.log('    Wallet address:', WALLET);
});
req.write(payload);
req.end();
