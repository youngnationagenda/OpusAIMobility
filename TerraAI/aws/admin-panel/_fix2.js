const fs = require('fs');
const code = fs.readFileSync('aws/admin-panel/index.js', 'utf8');
const fixed = code.replace(
  "process.stdout.write('index.js complete: '+require('fs').statSync(F).size+' bytes\\n');\n",
  ''
);
fs.writeFileSync('aws/admin-panel/index.js', Buffer.from(fixed));
process.stdout.write('Removed generator line. Size: ' + fixed.length + '\n');
