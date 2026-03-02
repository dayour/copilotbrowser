#!/usr/bin/env node
/**
 * copilotbrowser Agent Builder Runner
 *
 * Reads an agent spec JSON file, connects to the copilotbrowser MCP server,
 * and runs the copilot-studio-creator automation to build the agent end-to-end.
 *
 * Usage:
 *   node runner.mjs <path-to-spec.json>
 *
 * Examples:
 *   node runner.mjs specs/retail-customer-service.json
 *   node runner.mjs specs/it-helpdesk.json
 *
 * Prerequisites:
 *   - Edge browser installed
 *   - Already authenticated in an Edge profile with Copilot Studio access
 *     (the runner uses --reuse-browser to attach to an existing session)
 *   - node >= 18
 */

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const copilotbrowser_CLI = resolve(__dirname, '../../packages/copilotbrowser/cli.js');
const CREATOR_SCRIPT = resolve(__dirname, 'copilot-studio-creator.js');

// ── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error('Usage: node runner.mjs <path-to-spec.json>');
    console.error('');
    console.error('Available specs:');
    console.error('  specs/retail-customer-service.json');
    console.error('  specs/it-helpdesk.json');
    console.error('  specs/policy-guidance.json');
    process.exit(1);
  }

  // ── Load spec ──────────────────────────────────────────────────────────────
  const specFile = resolve(process.cwd(), specPath);
  let spec;
  try {
    spec = JSON.parse(await readFile(specFile, 'utf-8'));
  } catch (e) {
    console.error(`Error reading spec file "${specFile}": ${e.message}`);
    process.exit(1);
  }
  console.log(`\n📋 Loaded spec: "${spec.name}"`);
  console.log(`   Environment: ${spec.environment.id}`);
  console.log(`   Base URL:    ${spec.environment.baseUrl || 'https://copilotstudio.microsoft.com'}`);

  // ── Load creator script and inject spec ───────────────────────────────────
  const creatorTemplate = await readFile(CREATOR_SCRIPT, 'utf-8');
  const injectedCode = creatorTemplate.replace('__SPEC__', JSON.stringify(spec, null, 2));

  // ── Connect to copilotbrowser MCP ─────────────────────────────────────────
  console.log('\n🌐 Starting copilotbrowser MCP server...');
  const transport = new StdioClientTransport({
    command: 'node',
    args: [
      copilotbrowser_CLI,
      'run-mcp-server',
      '--browser', 'msedge',
    ],
  });

  const client = new Client(
    { name: 'copilot-studio-agent-builder', version: '1.0.0' },
    { capabilities: {} },
  );

  await client.connect(transport);
  console.log('✅ Connected to copilotbrowser MCP');

  // ── Navigate to Copilot Studio (allow user to log in if needed) ────────────
  const baseUrl = spec.environment.baseUrl || 'https://copilotstudio.microsoft.com';
  const loginUrl = `${baseUrl}/environments/${spec.environment.id}/home`;

  console.log(`\n🔑 Opening Copilot Studio: ${loginUrl}`);
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: loginUrl },
  });

  console.log('\n⏳ Please complete authentication in the browser if prompted.');
  console.log('   Press ENTER here once you are logged in to Copilot Studio...');
  await waitForEnter();

  // ── Run the automation ─────────────────────────────────────────────────────
  console.log('\n🤖 Running agent builder automation...\n');
  const startTime = Date.now();

  let result;
  try {
    const toolResult = await client.callTool({
      name: 'browser_run_code',
      arguments: { code: injectedCode },
    });

    // Parse the JSON result from the tool
    const resultText = toolResult.content?.[0]?.text || '{}';
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { success: false, raw: resultText };
    }
  } catch (e) {
    result = { success: false, error: e.message };
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ── Report results ────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  if (result.success) {
    console.log(`✅ Agent created successfully in ${elapsed}s`);
    console.log(`   Name:    ${result.name}`);
    console.log(`   ID:      ${result.agentId}`);
    console.log(`   URL:     ${result.agentUrl}`);
    if (result.testResponse) {
      console.log(`\n   Test response preview:`);
      console.log(`   "${result.testResponse.slice(0, 200)}..."`);
    }
  } else {
    console.error(`❌ Agent creation failed after ${elapsed}s`);
    console.error(`   Error: ${result.error || 'unknown'}`);
    if (result.raw) console.error(`   Raw output: ${result.raw.slice(0, 500)}`);
  }
  console.log('═'.repeat(60) + '\n');

  await client.close();
  process.exit(result.success ? 0 : 1);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', resolve);
  });
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
