#!/usr/bin/env node
/**
 * Full smoke test for copilotbrowser npm package.
 * Tests: package exports, CLI, MCP server (ping/tools/navigate/snapshot/screenshot).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PKG = path.join(__dirname, '..', 'packages', 'copilotbrowser');
// MCP SDK lives in root node_modules (workspace hoisting)
const MCP_SDK = path.join(__dirname, '..', 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'cjs');

// ── 1. Package structure ──────────────────────────────────────────────────────
console.log('\n── 1. Package structure ─────────────────────────────────────────');
const pkg = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8'));
let missing = [];
for (const [key, val] of Object.entries(pkg.exports ?? {})) {
  const file = val?.require ?? val?.default ?? val;
  if (typeof file !== 'string' || file.endsWith('.d.ts') || key.includes('types')) continue;
  const abs = path.join(PKG, file);
  if (!fs.existsSync(abs)) missing.push(`  ${key} → ${file}`);
}
if (missing.length) { console.error('❌ Missing exports:\n' + missing.join('\n')); process.exit(1); }
console.log(`✅ All ${Object.keys(pkg.exports ?? {}).length} exports present`);

// ── 2. Core requires ─────────────────────────────────────────────────────────
console.log('\n── 2. Core module requires ──────────────────────────────────────');
const checks = [
  ['index.js',                     () => require(path.join(PKG, 'index.js'))],
  ['lib/utilsBundle.js (colors)',  () => { const u = require(path.join(PKG, 'lib/utilsBundle.js')); if (!u.colors?.dim) throw new Error('colors.dim missing'); }],
  ['lib/program.js',               () => require(path.join(PKG, 'lib/program.js'))],
  ['lib/server/index.js',          () => require(path.join(PKG, 'lib/server/index.js'))],
  ['lib/mcp/index.js',             () => require(path.join(PKG, 'lib/mcp/index.js'))],
];
for (const [label, fn] of checks) {
  try { fn(); console.log(`✅ ${label}`); }
  catch (e) { console.error(`❌ ${label}: ${e.message}`); process.exit(1); }
}

// ── 3. CLI --version ──────────────────────────────────────────────────────────
console.log('\n── 3. CLI ────────────────────────────────────────────────────────');
const { execSync } = require('child_process');
try {
  const ver = execSync(`node "${path.join(PKG, 'cli.js')}" --version`, { encoding: 'utf8' }).trim();
  console.log(`✅ CLI version: ${ver}`);
} catch (e) { console.error('❌ CLI --version failed:', e.message); process.exit(1); }

// ── 4. Install --list ─────────────────────────────────────────────────────────
try {
  const list = execSync(
    `node -e "const {program}=require('${path.join(PKG,'lib/program.js').replace(/\\/g,'/')}'); program.parse(['node','cli','install','--list'])"`,
    { encoding: 'utf8', env: { ...process.env } }
  );
  const hasBrowsers = list.includes('chromium') || list.includes('firefox') || list.includes('webkit');
  if (!hasBrowsers) throw new Error('No browsers listed');
  console.log(`✅ Browsers installed: ${list.match(/\bchromium\b|\bfirefox\b|\bwebkit\b/g)?.join(', ')}`);
} catch (e) { console.error('❌ install --list failed:', e.message); process.exit(1); }

// ── 5. MCP server: connect + listTools + navigate + snapshot + screenshot ─────
console.log('\n── 4. MCP server smoke test ─────────────────────────────────────');

const { Client } = require(path.join(MCP_SDK, 'client', 'index.js'));
const { StdioClientTransport } = require(path.join(MCP_SDK, 'client', 'stdio.js'));

const REQUIRED_TOOLS = [
  'browser_navigate', 'browser_click', 'browser_evaluate',
  'browser_snapshot', 'browser_take_screenshot', 'browser_network_requests',
  'browser_console_messages', 'browser_tabs',
];

(async () => {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.join(PKG, 'cli.js'), 'run-mcp-server', '--headless', '--browser=chromium'],
    env: { ...process.env, COPILOTBROWSER_SKIP_BROWSER_DOWNLOAD: '1' },
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', d => stderr += d.toString());

  const client = new Client({ name: 'smoketest', version: '1.0.0' });
  await client.connect(transport);
  await client.ping();
  console.log('✅ MCP ping');

  const tools = (await client.listTools()).tools ?? [];
  console.log(`✅ listTools: ${tools.length} tools`);
  const names = tools.map(t => t.name);
  const missingTools = REQUIRED_TOOLS.filter(t => !names.includes(t));
  if (missingTools.length) throw new Error('Missing tools: ' + missingTools.join(', '));
  console.log('✅ Required tools present:', REQUIRED_TOOLS.join(', '));

  console.log('\n  Navigating https://example.com …');
  const nav = await client.callTool({ name: 'browser_navigate', arguments: { url: 'https://example.com' }});
  if (nav.isError) throw new Error('browser_navigate: ' + nav.content?.[0]?.text);
  console.log('✅ browser_navigate ok');
  console.log('  result preview:', nav.content?.[0]?.text?.replace(/\n/g,' ').slice(0, 120));

  const snap = await client.callTool({ name: 'browser_snapshot', arguments: { maxLength: 1000 }});
  if (snap.isError) throw new Error('browser_snapshot: ' + snap.content?.[0]?.text);
  const snapText = snap.content?.[0]?.text ?? '';
  if (!snapText.includes('example')) throw new Error('Snapshot does not mention example.com');
  console.log('✅ browser_snapshot ok — excerpt:', snapText.slice(0, 150).replace(/\n/g,' '));

  const ss = await client.callTool({ name: 'browser_take_screenshot', arguments: { type: 'png', fullPage: false }});
  if (ss.isError) throw new Error('screenshot: ' + ss.content?.[0]?.text);
  const imgData = ss.content?.[0]?.data ?? '';
  if (imgData.length < 100) throw new Error('Screenshot data too short: ' + imgData.length);
  console.log(`✅ browser_take_screenshot ok — ${imgData.length} base64 chars`);

  const net = await client.callTool({ name: 'browser_network_requests', arguments: { includeStatic: false }});
  if (net.isError) throw new Error('network_requests: ' + net.content?.[0]?.text);
  console.log('✅ browser_network_requests ok');

  await client.close(); transport.close?.();

  if (stderr) console.log('\n  Server stderr (info):\n  ' + stderr.slice(0, 400).replace(/\n/g,'\n  '));

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('✅  ALL SMOKE TESTS PASSED — package is ready to publish');
  console.log('════════════════════════════════════════════════════════════════');
})().catch(e => {
  console.error('\n❌ SMOKE TEST FAILED:', e.message);
  if (e.stack) console.error(e.stack.split('\n').slice(1, 5).join('\n'));
  process.exit(1);
});
