/**
 * Debug Lambda — logs the raw event structure from API Gateway
 * Deploy temporarily to see what API GW actually sends
 */
const fs = require('fs');
const code = fs.readFileSync('aws/admin-panel/index.js', 'utf8');

// Check how cookies are being read
const cookieLine = code.split('\n').find(l => l.includes('cookie') && l.includes('headers'));
process.stdout.write('Cookie read line: ' + cookieLine + '\n\n');

// The issue: API Gateway HTTP API v2 sends cookies in event.cookies[] array
// AND in event.headers.cookie — but the header key might be lowercase
// Let's check all cookie-related lines
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('cookie')) {
    process.stdout.write(i + ': ' + l.trim() + '\n');
  }
});
