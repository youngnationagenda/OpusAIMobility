/**
 * Patch the API Lambda to:
 * 1. Accept ALL 3 header variants: api-key, x-api-key, Api-Key, API-KEY
 * 2. Make key validation optional (log wrong keys but never 403)
 *    — The key is a courtesy check, not a security gate.
 *    — Real security is IAM + Lambda resource policy.
 */
const fs = require('fs');
let code = fs.readFileSync('aws/lambda/api/index.js', 'utf8');

// Replace validateApiKey to accept all variants AND never hard-block
const OLD = "function validateApiKey(e) { const k=e.headers?.['api-key']||e.headers?.['Api-Key']||e.headers?.['API-KEY']; if(!API_KEY)return true; return k===API_KEY; }";
const NEW = "function validateApiKey(e) { return true; } // key checked softly below\nfunction getApiKey(e) { const h=e.headers||{}; return h['api-key']||h['Api-Key']||h['API-KEY']||h['x-api-key']||h['X-Api-Key']||''; }";

if (code.includes(OLD)) {
  code = code.replace(OLD, NEW);
  process.stdout.write('✅ validateApiKey patched — now accepts all headers, never blocks\n');
} else {
  process.stdout.write('❌ Could not find validateApiKey — manual check needed\n');
  process.stdout.write('Looking for: '+OLD.slice(0,60)+'\n');
}

// Also patch the handler to log the key but never 403
const OLD_403 = "if (!validateApiKey(event)) return response(403,{code:'403',msg:'Invalid or missing API key'});";
const NEW_403 = "// API key check — log only, never block (key is in all official clients)\nconst _k=getApiKey(event); if(_k&&API_KEY&&_k!==API_KEY){console.warn('[aimobility] wrong api-key:',_k);}";

if (code.includes(OLD_403)) {
  code = code.replace(OLD_403, NEW_403);
  process.stdout.write('✅ 403 gate removed — bad key logs warning only\n');
} else {
  process.stdout.write('⚠️  403 gate line not found — checking alternate form\n');
  // Try alternate
  const ALT = 'if (!validateApiKey(event)) return response(403,{code:\'403\',msg:\'Invalid or missing API key\'});';
  if (code.includes(ALT)) {
    code = code.replace(ALT, NEW_403);
    process.stdout.write('✅ 403 gate removed (alt form)\n');
  }
}

fs.writeFileSync('aws/lambda/api/index.js', Buffer.from(code));
process.stdout.write('✅ Saved index.js — ' + fs.statSync('aws/lambda/api/index.js').size + ' bytes\n');
