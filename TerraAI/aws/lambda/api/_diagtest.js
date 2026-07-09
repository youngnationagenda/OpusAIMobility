/**
 * Reproduce the exact 500 error:
 * "ExpressionAttributeValues must not be empty"
 * This happens when email is undefined/null/empty in getUserByEmail()
 */
const https = require('https');

function post(host, path, body, extraHeaders) {
  return new Promise(resolve => {
    const b = JSON.stringify(body);
    const h = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b), ...extraHeaders };
    const req = https.request({ hostname: host, path, method: 'POST', headers: h }, res => {
      let d = ''; res.on('data', x => d += x); res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.write(b); req.end();
  });
}

const H = 'api.yna.co.ke';

async function run() {
  process.stdout.write('\n🔬 Diagnosing loginVendor 500 error\n\n');

  const tests = [
    // Correct call
    { label: 'Correct email+password',            body: { email: 'admin@aimobility.app', password: 'Admin@2024' } },
    // Empty email — triggers ExpressionAttributeValues must not be empty
    { label: 'Empty email ""',                    body: { email: '', password: 'Admin@2024' } },
    // Missing email field
    { label: 'Missing email field',               body: { password: 'Admin@2024' } },
    // null email
    { label: 'Null email',                        body: { email: null, password: 'Admin@2024' } },
    // undefined → becomes missing when JSON stringified
    { label: 'Undefined email (key present)',      body: { email: undefined, password: 'Admin@2024' } },
    // Wrong content-type (form data as string)
    { label: 'Form body string (not JSON)',        body: 'email=admin%40aimobility.app&password=Admin%402024', isString: true },
    // GET request body
    { label: 'Empty body {}',                     body: {} },
  ];

  for (const t of tests) {
    let bodyStr = t.isString ? t.body : JSON.stringify(t.body);
    const ct = t.isString ? 'application/x-www-form-urlencoded' : 'application/json';
    const r = await new Promise(resolve => {
      const h = { 'Content-Type': ct, 'Content-Length': Buffer.byteLength(bodyStr) };
      const req = https.request({ hostname: H, path: '/api/loginVendor', method: 'POST', headers: h }, res => {
        let d = ''; res.on('data', x => d += x); res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch(e) { resolve({ status: res.statusCode, body: d }); }
        });
      });
      req.on('error', e => resolve({ status: 0, body: e.message }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
      req.write(bodyStr); req.end();
    });
    const ok = r.body && r.body.code === '200';
    const icon = ok ? '✅' : r.body && r.body.code === '500' ? '💥' : '⚠️ ';
    process.stdout.write(icon + ' ' + t.label + '\n');
    process.stdout.write('   → code:' + (r.body && r.body.code) + ' msg:' + JSON.stringify(r.body && r.body.msg).slice(0, 80) + '\n\n');
  }
}

run().catch(e => process.stdout.write('FATAL: ' + e.message + '\n'));
