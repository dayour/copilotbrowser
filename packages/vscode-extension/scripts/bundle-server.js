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

// --- 1b. Rewrite self-referencing requires in bundled JS files ---
// The compiled JS uses require("@copilotbrowser/copilotbrowser/lib/...") and
// require.resolve("copilotbrowser/..."). These are self-references that resolve
// via the monorepo workspace but fail inside the VSIX. Rewrite them to relative
// paths so they resolve without node_modules.
const libDir = p.join(to, 'lib');
function rewriteRequires(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = p.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteRequires(full);
      continue;
    }
    if (!entry.name.endsWith('.js'))
      continue;
    let content = fs.readFileSync(full, 'utf8');
    const orig = content;
    // Compute relative path from this file's directory back to the package root
    const relToRoot = p.relative(p.dirname(full), to).replace(/\\/g, '/') || '.';
    // @copilotbrowser/copilotbrowser/lib/foo → ./relative/lib/foo
    content = content.replace(/require\(["']@copilotbrowser\/copilotbrowser\/([^"']+)["']\)/g,
      (_, subpath) => `require("${relToRoot}/${subpath}")`);
    // require("@copilotbrowser/copilotbrowser") bare → require("./relative")
    content = content.replace(/require\(["']@copilotbrowser\/copilotbrowser["']\)/g,
      `require("${relToRoot}")`);
    // require.resolve("copilotbrowser/...") → require.resolve("./relative/...")
    content = content.replace(/require\.resolve\(["']copilotbrowser\/([^"']+)["']\)/g,
      (_, subpath) => `require.resolve("${relToRoot}/${subpath}")`);
    // require("copilotbrowser/...") without .resolve
    content = content.replace(/require\(["']copilotbrowser\/([^"']+)["']\)/g,
      (_, subpath) => `require("${relToRoot}/${subpath}")`);
    // require.resolve("copilotbrowser") bare
    content = content.replace(/require\.resolve\(["']copilotbrowser["']\)/g,
      `require.resolve("${relToRoot}/package.json")`);
    // require("copilotbrowser") bare
    content = content.replace(/require\(["']copilotbrowser["']\)/g,
      `require("${relToRoot}")`);
    if (content !== orig)
      fs.writeFileSync(full, content, 'utf8');
  }
}
rewriteRequires(to);
console.log('Rewrote self-referencing requires to relative paths');

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
