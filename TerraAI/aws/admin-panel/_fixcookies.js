/**
 * THE ROOT CAUSE FIX:
 * API Gateway HTTP API v2 (payload format 2.0) sends cookies in event.cookies[]
 * NOT in event.headers.cookie. We must read from both sources.
 *
 * Also fixes: Set-Cookie must use the cookies array response format for v2
 */
const fs = require('fs');
let code = fs.readFileSync('aws/admin-panel/index.js', 'utf8');

// Fix 1: Read cookie from BOTH event.cookies[] (API GW v2) AND event.headers.cookie
const OLD_COOKIE_READ = 'var cookie=(event.headers||{}).cookie||(event.headers||{}).Cookie||"";';
const NEW_COOKIE_READ = [
  '// API Gateway HTTP API v2 sends cookies in event.cookies[] array',
  'var cookie="";',
  'if(event.cookies&&Array.isArray(event.cookies)&&event.cookies.length){',
  '  cookie=event.cookies.join("; ");',
  '}else{',
  '  cookie=(event.headers||{}).cookie||(event.headers||{}).Cookie||"";',
  '}'
].join('\n');

if (code.includes(OLD_COOKIE_READ)) {
  code = code.replace(OLD_COOKIE_READ, NEW_COOKIE_READ);
  process.stdout.write('✅ Fixed cookie reading (event.cookies[] + event.headers.cookie)\n');
} else {
  process.stdout.write('❌ Could not find cookie read line — checking what is there...\n');
  const line = code.split('\n').find(l => l.includes('cookie') && l.includes('event.headers'));
  process.stdout.write('Found: ' + line + '\n');
}

// Fix 2: The redirect response must also work with API GW v2 cookies
// In v2, cookies can be set via headers['Set-Cookie'] — this already works
// But ensure the redir function properly sets it
const OLD_REDIR = "function redir(l,k){var h={Location:l};if(k)h['Set-Cookie']=k;return{statusCode:302,headers:h,body:''};}";
const NEW_REDIR = "function redir(l,k){var h={Location:l};if(k)h['Set-Cookie']=k;return{statusCode:302,headers:h,body:'',cookies:k?[k]:[]};}";

if (code.includes(OLD_REDIR)) {
  code = code.replace(OLD_REDIR, NEW_REDIR);
  process.stdout.write('✅ Fixed redir() to also set cookies[] array for API GW v2\n');
}

fs.writeFileSync('aws/admin-panel/index.js', Buffer.from(code));
process.stdout.write('✅ Saved. Size: ' + fs.statSync('aws/admin-panel/index.js').size + ' bytes\n');
