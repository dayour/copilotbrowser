/**
 * Bundle the copilotbrowser server and copilotbrowser-cli into the extension's
 * server/ directory so the VSIX is fully self-contained.
 */
const fs = require('fs');
const p = require('path');

const extDir = p.join(__dirname, '..');
const serverDir = p.join(extDir, 'server');

// Clean previous bundle
if (fs.existsSync(serverDir))
  fs.rmSync(serverDir, { recursive: true });

// --- 1. Bundle copilotbrowser from monorepo packages ---
const from = p.join(extDir, '..', 'copilotbrowser');
const to = p.join(serverDir, 'copilotbrowser');
fs.cpSync(from, to, {
  recursive: true,
  filter: (s) => !s.includes('node_modules') && !s.includes(p.sep + 'src' + p.sep),
});

// No extra wiring needed — the bundled copilotbrowser directory has its own
// package.json with name "copilotbrowser", so require('copilotbrowser') and
// require('copilotbrowser/lib/...') resolve naturally via Node's resolution.

console.log('Bundled copilotbrowser server into', serverDir);

// --- 2. Bundle copilotbrowser-cli entry point ---
// Create a thin wrapper that resolves the bundled copilotbrowser via relative
// path so the CLI works without a global or workspace npm install.
const cliWrapper = `#!/usr/bin/env node
/**
 * Bundled copilotbrowser-cli entry point.
 * Uses a relative require to the co-bundled copilotbrowser package.
 */
const { program } = require('./copilotbrowser/lib/program');
program.parse(process.argv);
`;
fs.writeFileSync(p.join(serverDir, 'copilotbrowser-cli.js'), cliWrapper, 'utf8');
console.log('Bundled copilotbrowser-cli.js');

// --- 3. Copy copilotbrowser-cli skills if the repo is a sibling ---
const cliRepoDir = p.join(extDir, '..', '..', '..', 'copilotbrowser-cli');
const skillsSrc = p.join(cliRepoDir, 'skills');
if (fs.existsSync(skillsSrc)) {
  const skillsDst = p.join(serverDir, 'copilotbrowser-cli-skills');
  fs.cpSync(skillsSrc, skillsDst, { recursive: true });
  console.log('Bundled copilotbrowser-cli skills from', skillsSrc);
} else {
  console.log('copilotbrowser-cli skills not found at', skillsSrc, '(skipped)');
}
