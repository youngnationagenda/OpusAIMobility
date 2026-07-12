/**
 * Celo Alfajores Faucet Helper
 * Called from within Lambda (AWS has outbound internet to faucet.celo.org)
 * Tries multiple known faucet API endpoints.
 */

import https from 'https';

const FAUCET_ENDPOINTS = [
  { host: 'faucet.celo.org',       path: '/api/fund',          bodyKey: 'beneficiary' },
  { host: 'faucet.celo.org',       path: '/api/requestTokens', bodyKey: 'address'     },
  { host: 'faucet.celo.org',       path: '/fund',              bodyKey: 'beneficiary' },
];

function postJson(host, path, body, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: host,
        path,
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent':     'OpusAIMobility/1.0',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 500) }));
      }
    );
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ status: 0, body: 'TIMEOUT' }); });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.write(payload);
    req.end();
  });
}

export async function requestFaucet(walletAddress) {
  console.log('[Faucet] Requesting testnet CELO for', walletAddress);

  for (const ep of FAUCET_ENDPOINTS) {
    const body = { [ep.bodyKey]: walletAddress, token: 'CELO', network: 'alfajores' };
    console.log(`[Faucet] Trying https://${ep.host}${ep.path} ...`);
    const result = await postJson(ep.host, ep.path, body);
    console.log(`[Faucet] → ${result.status}: ${result.body.slice(0, 120)}`);

    if (result.status >= 200 && result.status < 300) {
      return { success: true, endpoint: `https://${ep.host}${ep.path}`, response: result.body };
    }
  }

  return {
    success: false,
    message: 'All faucet endpoints failed. Fund manually at https://faucet.celo.org/alfajores',
    wallet:  walletAddress,
  };
}
