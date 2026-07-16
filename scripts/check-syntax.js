#!/usr/bin/env node
// This project has no build step and no `next`/TypeScript toolchain
// installed (see README.md) — there is no `next lint` or `tsc` to run.
// This is the closest equivalent: parse every JS file this project
// actually ships (root scripts + api/ serverless functions +
// review-system/) with Node's own parser, so a syntax error can never
// reach production.

const { execFileSync } = require('child_process');
const { globSync } = (() => {
  // Minimal recursive glob — avoids adding a dependency just for this.
  const fs = require('fs');
  const path = require('path');
  function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (entry.name.endsWith('.js')) out.push(full);
    }
  }
  return {
    globSync(dirs) {
      const out = [];
      for (const d of dirs) {
        if (require('fs').existsSync(d)) walk(d, out);
      }
      return out;
    }
  };
})();

const path = require('path');
const root = path.join(__dirname, '..');
const targets = globSync([
  path.join(root, 'api'),
  path.join(root, 'scripts'),
  path.join(root, 'review-system', 'src')
]).concat([
  path.join(root, 'app.js'),
  path.join(root, 'chatbot.js'),
  path.join(root, 'chatbot-kb.js')
].filter((f) => require('fs').existsSync(f)));

let failed = 0;
for (const file of targets) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    console.log(`  ✓ ${path.relative(root, file)}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${path.relative(root, file)}`);
    console.error(String(err.stderr || err.message).trim().split('\n').map((l) => `      ${l}`).join('\n'));
  }
}

console.log(`\n${targets.length - failed}/${targets.length} files parsed cleanly.\n`);
process.exit(failed === 0 ? 0 : 1);
