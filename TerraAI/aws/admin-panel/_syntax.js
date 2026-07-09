const fs = require('fs');
const vm = require('vm');
try {
  const code = fs.readFileSync('aws/admin-panel/index.js', 'utf8');
  new vm.Script(code);
  process.stdout.write('✅ SYNTAX OK — ' + code.length + ' bytes\n');
} catch(e) {
  process.stdout.write('❌ SYNTAX ERROR: ' + e.message + '\n');
}
