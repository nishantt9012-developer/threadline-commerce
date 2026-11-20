/** Verify relative import targets without requiring node_modules. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folders = ['src', 'server', 'tests'];
const extensions = ['.js', '.jsx', '.mjs', '.json', '.css'];
const failures = [];
let checkedFiles = 0;
let checkedImports = 0;

function visit(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(fullPath); continue; }
    if (!/\.(js|jsx|mjs)$/.test(entry.name)) continue;
    checkedFiles += 1;
    const source = fs.readFileSync(fullPath, 'utf8');
    const importRegex = /(?:\bimport\s*(?:[\s\S]*?\sfrom\s*)?|\bexport\s+(?:[\s\S]*?\sfrom\s*)?)['"](\.[^'"]+)['"]/g;
    for (const match of source.matchAll(importRegex)) {
      const request = match[1];
      checkedImports += 1;
      const target = path.resolve(path.dirname(fullPath), request);
      const targets = [target, ...extensions.map((extension) => target + extension),
        ...extensions.map((extension) => path.join(target, 'index' + extension))];
      if (!targets.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())) {
        failures.push(`${path.relative(root, fullPath)}: ${request}`);
      }
    }
  }
}
folders.forEach((directory) => visit(path.join(root, directory)));
if (failures.length) {
  console.error('Missing local imports:\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${checkedFiles} source files checked, ${checkedImports} local imports resolved.`);
  console.log('Note: this is a source integrity check, not a Vite production build.');
}
