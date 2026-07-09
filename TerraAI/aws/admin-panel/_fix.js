const fs = require('fs');
const lines = fs.readFileSync('aws/admin-panel/index.js', 'utf8').split('\n');
const newEsc = "function esc(s){if(!s&&s!==0)return'';var r=String(s),o='';for(var i=0;i<r.length;i++){var c=r.charCodeAt(i);if(c===38)o+='&amp;';else if(c===60)o+='&lt;';else if(c===62)o+='&gt;';else o+=r[i];}return o;}";
lines[11] = newEsc;
fs.writeFileSync('aws/admin-panel/index.js', Buffer.from(lines.join('\n')));
process.stdout.write('Fixed line 11: ' + lines[11].slice(0, 60) + '\n');
