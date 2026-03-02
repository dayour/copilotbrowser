#!/usr/bin/env node
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// When stdin is not a TTY (piped — e.g. spawned by VS Code, Copilot Chat, or any
// MCP client), and no explicit subcommand was given, default to the MCP server.
// This lets `npx copilotbrowser [options]` act as the MCP server directly,
// matching the darbot-browser-mcp invocation pattern.
if (!process.stdin.isTTY) {
  const knownSubcommands = new Set([
    'test', 'show-report', 'merge-reports', 'clear-cache',
    'install', 'uninstall', 'install-deps',
    'cr', 'ff', 'wk', 'screenshot', 'pdf', 'show-trace', 'codegen', 'open',
    'init-agents', 'run-mcp-server', 'run-cli-server', 'run-test-mcp-server',
    'dev-server', 'test-server', 'help',
  ]);
  const firstNonFlag = process.argv.slice(2).find(a => !a.startsWith('-'));
  if (!firstNonFlag || !knownSubcommands.has(firstNonFlag))
    process.argv.splice(2, 0, 'run-mcp-server');
}

const { program } = require('./lib/program');
program.parse(process.argv);
