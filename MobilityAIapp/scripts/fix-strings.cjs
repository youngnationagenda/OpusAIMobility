// Fix the corrupted strings.xml — remove malformed <string name="<!-- ... -->"> tag
var fs = require('fs');
var path = require('path');

var abs = path.resolve(__dirname, '../android/customer/app/src/main/res/values/strings.xml');
console.log('Reading:', abs);

var c = fs.readFileSync(abs, 'utf8');
console.log('File length:', c.length);

// Find the corrupted tag
var badStart = c.indexOf('       <string name="<!-- google_map_key');
var goodNext = c.indexOf('\r\n    <string name="google_map_route_key');

console.log('badStart:', badStart, 'goodNext:', goodNext);

if (badStart < 0) {
  console.log('Bad tag NOT found - file may already be clean');
  // Check for any remaining issues
  var hasStaticKey = c.includes('<string name="google_map_key"');
  console.log('Has static google_map_key:', hasStaticKey);
  process.exit(0);
}

// Replace the corrupted section with a clean comment
var fixed = c.slice(0, badStart) +
  '    <!-- google_map_key is injected via resValue in app/build.gradle -->\n' +
  '    <!-- Do NOT declare it here statically: causes AAPT ResourceCompilationException -->' +
  c.slice(goodNext);

fs.writeFileSync(abs, fixed, 'utf8');

// Verify
var v = fs.readFileSync(abs, 'utf8');
console.log('RESULT:');
console.log('  has_bad_tag:', v.includes('<string name="<!-- google_map_key'));
console.log('  has_static_key:', v.includes('<string name="google_map_key"'));
console.log('  has_comment:', v.includes('injected via resValue'));
console.log('  has_route_key:', v.includes('google_map_route_key'));
console.log('  new_length:', v.length);

// Show the fixed area
var idx = v.indexOf('for map functionality');
console.log('Fixed area:\n' + v.substring(idx, idx + 300));
