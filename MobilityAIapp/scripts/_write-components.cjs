'use strict';
/**
 * _write-components.cjs
 * Scaffolding helper — writes/regenerates frontend React components.
 * Moved from project root → scripts/ for cleaner root directory.
 * Run from project root: node scripts/_write-components.cjs
 */
const fs = require('fs');
const path = require('path');

function w(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  console.log('wrote', file, content.length + 'b');
}

// Add component scaffolding calls here as needed.
console.log('_write-components: no components queued. Add w() calls to scaffold new files.');
