import fs from 'fs';
import path from 'path';
import glob from 'glob';

const backendDir = path.resolve('./'); // Current directory

// Scan all JS files recursively, ignoring node_modules
glob(`${backendDir}/**/*.js`, { ignore: '**/node_modules/**' }, (err, files) => {
  if (err) {
    console.error('Error scanning files:', err);
    return;
  }

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for colon routes
      const colonMatch = line.match(/router\.(get|post|put|delete|patch).*:\/?([^\s]*)/);
      if (colonMatch) {
        const routePart = colonMatch[0];
        // Detect missing parameter name
        if (routePart.includes('/:') && !routePart.match(/\/:[a-zA-Z0-9_]+/)) {
          console.log(`⚠️ Missing parameter name in file: ${file}:${index + 1}`);
          console.log(`   ${line.trim()}`);
        }
      }

      // Check for wildcard routes
      const wildcardMatch = line.match(/router\.(get|post|put|delete|patch).*\/\*/);
      if (wildcardMatch) {
        // Detect unnamed wildcard
        if (!line.match(/\/\*[a-zA-Z0-9_]+/)) {
          console.log(`⚠️ Unnamed wildcard route in file: ${file}:${index + 1}`);
          console.log(`   ${line.trim()}`);
        }
      }
    });
  });

  console.log('✅ Route scan completed.');
});
