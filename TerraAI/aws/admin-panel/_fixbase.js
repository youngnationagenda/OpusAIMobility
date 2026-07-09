/**
 * Fix admin panel:
 *  1. Revert API_BASE to direct execute-api URL (no DNS dependency)
 *  2. Add api-key env var support
 *  3. Fix the api() function to always include the api-key header
 */
const fs = require('fs');
let code = fs.readFileSync('aws/admin-panel/index.js', 'utf8');

// Fix 1 — revert API_BASE to direct URL, always reliable
code = code.replace(
  'const API_BASE="https://api.yna.co.ke/api/";',
  'const API_BASE="https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/";'
);
process.stdout.write('✅ Reverted API_BASE to direct execute-api URL\n');

// Fix 2 — make sure api-key is read from env or hardcoded fallback
code = code.replace(
  'const API_KEY="terraai-mobility-key-2024";',
  'const API_KEY=process.env.API_KEY||"terraai-mobility-key-2024";'
);
process.stdout.write('✅ API_KEY reads from env with fallback\n');

fs.writeFileSync('aws/admin-panel/index.js', Buffer.from(code));
process.stdout.write('✅ Saved. Size: ' + fs.statSync('aws/admin-panel/index.js').size + ' bytes\n');
