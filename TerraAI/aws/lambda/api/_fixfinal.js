/**
 * Final hardening of index.js:
 * 1. getBody() — handle EVERY possible format: JSON, form, base64, query string, raw string
 * 2. Root "/" handler — return API info instead of 404
 * 3. Remove echo/debug endpoint
 * 4. getPath() — handle all path prefix variants cleanly
 */
const fs  = require('fs');
const qs  = require('querystring');
let code  = fs.readFileSync('aws/lambda/api/index.js', 'utf8');

// ── Fix 1: Bulletproof getBody ───────────────────────────────────────────────
const OLD_GETBODY = code.match(/function getBody\(e\) \{[\s\S]*?\n\}/)?.[0];
const NEW_GETBODY = `function getBody(e) {
  try {
    // 1. Try event.body (main payload)
    let raw = e.body || '';

    // 2. base64 decode if needed
    if (e.isBase64Encoded && raw) {
      raw = Buffer.from(raw, 'base64').toString('utf8');
    }

    if (raw) {
      // 3. Detect content type
      const headers = e.headers || {};
      const ct = (headers['content-type'] || headers['Content-Type'] || '').toLowerCase();

      // 4a. Form-urlencoded
      if (ct.includes('application/x-www-form-urlencoded')) {
        return qs.parse(raw);
      }

      // 4b. Try JSON parse (works for application/json and text/plain with JSON)
      if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
        return JSON.parse(raw);
      }

      // 4c. Fall back to querystring parse
      const parsed = qs.parse(raw);
      if (Object.keys(parsed).length > 0) return parsed;
    }

    // 5. Try queryStringParameters
    if (e.queryStringParameters && Object.keys(e.queryStringParameters).length > 0) {
      return e.queryStringParameters;
    }

    return {};
  } catch (_) {
    return e.queryStringParameters || {};
  }
}`;

if (OLD_GETBODY) {
  code = code.replace(OLD_GETBODY, NEW_GETBODY);
  process.stdout.write('✅ getBody() replaced with bulletproof version\n');
} else {
  process.stdout.write('⚠️  getBody not matched by regex\n');
}

// ── Fix 2: Root "/" returns API info instead of 404 ─────────────────────────
const OLD_DEFAULT = `    default: return err('Route not found: /'+route,'404');`;
const NEW_DEFAULT = `    case '':
    case '/': {
      return ok({
        service: 'aimobility API',
        version: '2.0.0',
        status: 'healthy',
        docs: 'POST /api/{endpoint} with JSON body',
        endpoints: ['health','login','registerUser','getRestaurants','showRideTypes','placeFoodOrder','placeParcelOrder','showCountries'],
        timestamp: new Date().toISOString(),
      });
    }
    default: return err('Route not found: /'+route,'404');`;

code = code.replace(OLD_DEFAULT, NEW_DEFAULT);
process.stdout.write('✅ Root "/" now returns API info\n');

// ── Fix 3: Remove echo/debug endpoint ───────────────────────────────────────
if (code.includes("case 'echo': case 'debug':")) {
  code = code.replace(/\s*case 'echo': case 'debug': \{[\s\S]*?\}\n/, '\n');
  process.stdout.write('✅ Echo/debug endpoint removed\n');
} else {
  process.stdout.write('ℹ️  No echo endpoint to remove\n');
}

// ── Fix 4: Revert handleRoute signature (remove extra event param if added) ──
code = code.replace(
  'async function handleRoute(path, body, event) {',
  'async function handleRoute(path, body) {'
);
code = code.replace(
  'try { return await handleRoute(getPath(event), getBody(event), event); }',
  'try { return await handleRoute(getPath(event), getBody(event)); }'
);
process.stdout.write('✅ handleRoute signature cleaned\n');

// ── Fix 5: Harden getPath to strip ALL prefix variants ──────────────────────
const OLD_GETPATH = `function getPath(e) { const p=e.rawPath||e.path||(e.pathParameters?.proxy?'/'+e.pathParameters.proxy:'/'); return p.replace(/^\\/prod/,'').replace(/^\\/api/,''); }`;
const NEW_GETPATH = `function getPath(e) {
  let p = e.rawPath || e.path || (e.pathParameters && e.pathParameters.proxy ? '/' + e.pathParameters.proxy : '/');
  // strip /prod prefix (added by API GW stage)
  p = p.replace(/^\\/prod/, '');
  // strip /api prefix
  p = p.replace(/^\\/api/, '');
  return p || '/';
}`;
code = code.replace(OLD_GETPATH, NEW_GETPATH);
process.stdout.write('✅ getPath() hardened\n');

fs.writeFileSync('aws/lambda/api/index.js', Buffer.from(code));
process.stdout.write('✅ index.js saved — ' + fs.statSync('aws/lambda/api/index.js').size + ' bytes\n');
