const https = require('https');
const WALLET = '0x5b4bf10FE7b795D006BC904f7C058943f09851AF';
// Alternative Alfajores RPC endpoints
const endpoints = [
  { hostname: 'alfajores.celoscan.io', path: '/api', query: `?module=account&action=balance&address=${WALLET}&tag=latest` },
];

for (const ep of endpoints) {
  const url = `https://${ep.hostname}${ep.path}${ep.query || ''}`;
  https.get(url, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const r = JSON.parse(d);
        if (r.result) {
          const balCELO = Number(BigInt(r.result)) / 1e18;
          console.log(`Wallet: ${WALLET}`);
          console.log(`Balance on Alfajores: ${balCELO.toFixed(4)} CELO`);
          if (balCELO > 0.1) console.log('✅ Ready to deploy!');
          else console.log('⚠️  Get testnet CELO: https://faucet.celo.org/alfajores  →  Paste:', WALLET);
        }
      } catch { console.log('Response:', d.slice(0, 200)); }
    });
  }).on('error', e => console.log(`${ep.hostname} error:`, e.message));
}
