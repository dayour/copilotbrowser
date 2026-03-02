"use strict";
/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
let outputChannel;
let statusBarItem;
let runningProcess;
// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------
function activate(context) {
    outputChannel = vscode.window.createOutputChannel('copilotbrowser');
    // Status bar: shows MCP server availability
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'copilotbrowser.showMcpConfig';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();
    // Register MCP server definition provider so copilotbrowser shows up in
    // VS Code's MCP server list (GitHub Copilot, Copilot Chat, etc.).
    const mcpProvider = new copilotbrowserMcpProvider();
    const lm = vscode.lm;
    if (typeof lm.registerMcpServerDefinitionProvider === 'function') {
        context.subscriptions.push(lm.registerMcpServerDefinitionProvider('copilotbrowser', mcpProvider));
    }
    // Watch for workspace/config changes to refresh MCP definitions
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        mcpProvider.refresh();
        updateStatusBar();
    }), vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('copilotbrowser'))
            mcpProvider.refresh();
    }));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('copilotbrowser.install', installBrowsers), vscode.commands.registerCommand('copilotbrowser.runTests', runTests), vscode.commands.registerCommand('copilotbrowser.showTrace', showTrace), vscode.commands.registerCommand('copilotbrowser.codegen', codegen), vscode.commands.registerCommand('copilotbrowser.openInspector', openInspector), vscode.commands.registerCommand('copilotbrowser.refreshMcp', () => {
        mcpProvider.refresh();
        vscode.window.showInformationMessage('copilotbrowser MCP server definitions refreshed.');
    }), vscode.commands.registerCommand('copilotbrowser.showMcpConfig', showMcpConfig));
    outputChannel.appendLine('copilotbrowser extension activated');
    outputChannel.appendLine(`MCP provider registered: ${typeof lm.registerMcpServerDefinitionProvider === 'function'}`);
}
function deactivate() {
    runningProcess?.kill();
    outputChannel?.dispose();
    statusBarItem?.dispose();
}
// ---------------------------------------------------------------------------
// MCP Server Definition Provider
// ---------------------------------------------------------------------------
class copilotbrowserMcpProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChangeMcpServerDefinitions = this._onDidChange.event;
    }
    refresh() {
        this._onDidChange.fire();
        updateStatusBar();
    }
    async provideMcpServerDefinitions(_token) {
        const config = vscode.workspace.getConfiguration('copilotbrowser');
        const mcpArgs = buildMcpArgs(config);
        // Prefer the locally installed CLI from the workspace node_modules
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            const cliPath = findcopilotbrowserCli(folder.uri.fsPath);
            if (cliPath) {
                outputChannel.appendLine(`MCP: using local CLI at ${cliPath}`);
                return [{
                        label: 'copilotbrowser',
                        command: resolveNode(), // resolved from running process — no hard-coded path
                        args: [cliPath, 'run-mcp-server', ...mcpArgs],
                        env: buildMcpEnv(config),
                        version: '2.0.0',
                    }];
            }
        }
        // Fall back to npx (works when package is installed globally or in npm cache)
        outputChannel.appendLine('MCP: no local copilotbrowser found, falling back to npx');
        return [{
                label: 'copilotbrowser',
                command: resolveNpx(),
                args: ['-y', 'copilotbrowser@2', 'run-mcp-server', ...mcpArgs],
                env: buildMcpEnv(config),
                version: '2.0.0',
            }];
    }
    async resolveMcpServerDefinition(server, _token) {
        // Opportunity to do auth/lazy resolution here; for now pass through
        return server;
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Find the copilotbrowser CLI script in a workspace folder's node_modules.
 * Returns the absolute path to `cli.js` or undefined if not installed.
 *
 * Only `cli.js` (a plain JS module) is returned so that the caller can
 * invoke it with `process.execPath` (the Node.js binary).  The `.bin`
 * shims are shell scripts on all platforms and must NOT be executed by
 * Node.js directly.
 */
function findcopilotbrowserCli(workspaceRoot) {
    // Resolve the real package directory via the workspace symlink so that
    // the returned path is always absolute and not bound to any hard-coded
    // drive letter or directory name.
    const candidates = [
        path.join(workspaceRoot, 'packages', 'copilotbrowser', 'cli.js'),
        path.join(workspaceRoot, 'node_modules', 'copilotbrowser', 'cli.js'),
        // Global/npm-link installs expose the package under a scoped dir too
        path.join(workspaceRoot, 'node_modules', '@copilotbrowser', 'test', 'cli.js'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate))
            return candidate;
    }
    return undefined;
}
/** Build the --browser, --headless, --caps, and extra args for the MCP server */
function buildMcpArgs(config) {
    const args = [];
    const browser = config.get('mcp.browser', 'chromium');
    if (browser && browser !== 'chromium')
        args.push('--browser', browser);
    if (config.get('mcp.headless', true))
        args.push('--headless');
    const caps = config.get('mcp.capabilities', []);
    if (caps.length > 0)
        args.push('--caps', caps.join(','));
    const extra = config.get('mcp.extraArgs', []);
    args.push(...extra);
    return args;
}
/** Build environment variables to pass to the MCP server process */
function buildMcpEnv(config) {
    return {
        ...config.get('env', {}),
    };
}
/** Resolve the npx binary path using PATH so no directory is hard-coded. */
function resolveNpx() {
    // On Windows the npm-installed shim is npx.cmd; on POSIX it is npx.
    // Both are resolved from PATH at spawn time — no absolute directory needed.
    return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}
/** Resolve the node binary path using the running process so it is never hard-coded. */
function resolveNode() {
    // process.execPath always points to the Node.js binary that is
    // running this extension process — no absolute path ever hard-coded.
    return process.execPath;
}
/** Update the status bar to reflect copilotbrowser availability */
function updateStatusBar() {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const hasLocal = folders.some(f => !!findcopilotbrowserCli(f.uri.fsPath));
    if (hasLocal) {
        statusBarItem.text = '$(browser) copilotbrowser MCP';
        statusBarItem.tooltip = 'copilotbrowser MCP server is available in this workspace.\nClick to see configuration.';
        statusBarItem.backgroundColor = undefined;
    }
    else {
        statusBarItem.text = '$(browser) copilotbrowser';
        statusBarItem.tooltip = 'copilotbrowser will use npx if not installed locally.\nClick to see configuration.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    statusBarItem.show();
}
/** Show a quick-pick with the current MCP server configuration */
async function showMcpConfig() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const browser = config.get('mcp.browser', 'chromium');
    const headless = config.get('mcp.headless', true);
    const caps = config.get('mcp.capabilities', []);
    const folders = vscode.workspace.workspaceFolders ?? [];
    let cliLocation = 'npx (fallback — copilotbrowser not found in node_modules)';
    for (const folder of folders) {
        const cli = findcopilotbrowserCli(folder.uri.fsPath);
        if (cli) {
            cliLocation = cli;
            break;
        }
    }
    const args = buildMcpArgs(config);
    const serverCommand = `${cliLocation === cliLocation ? process.execPath : resolveNpx()} ... run-mcp-server ${args.join(' ')}`.trim();
    const items = [
        { label: '$(info) copilotbrowser MCP Configuration', kind: vscode.QuickPickItemKind.Separator },
        { label: `$(browser) Browser`, description: browser, detail: 'copilotbrowser.mcp.browser setting' },
        { label: `$(eye) Headless`, description: String(headless), detail: 'copilotbrowser.mcp.headless setting' },
        { label: `$(symbol-misc) Capabilities`, description: caps.length ? caps.join(', ') : 'none', detail: 'copilotbrowser.mcp.capabilities setting' },
        { label: `$(file-code) CLI`, description: cliLocation, detail: 'Resolved from workspace node_modules' },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
        { label: '$(settings-gear) Open Settings', description: 'Configure copilotbrowser MCP' },
        { label: '$(refresh) Refresh MCP Servers', description: 'Re-discover and refresh server definitions' },
        { label: '$(cloud-download) Install Browsers', description: 'Install browser binaries' },
    ];
    const selected = await vscode.window.showQuickPick(items, {
        title: 'copilotbrowser MCP Server',
        placeHolder: serverCommand,
    });
    if (!selected)
        return;
    if (selected.label.includes('Open Settings'))
        await vscode.commands.executeCommand('workbench.action.openSettings', 'copilotbrowser.mcp');
    else if (selected.label.includes('Refresh'))
        await vscode.commands.executeCommand('copilotbrowser.refreshMcp');
    else if (selected.label.includes('Install'))
        await vscode.commands.executeCommand('copilotbrowser.install');
}
// ---------------------------------------------------------------------------
// Existing commands
// ---------------------------------------------------------------------------
function getWorkspaceRoot() {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}
function getcopilotbrowserBin(cwd) {
    // Prefer the local cli.js (invoked via node) so no system-level binary
    // with a hard-coded path is needed.  Fall back to the platform .cmd shim
    // (Windows) or bare name (POSIX) which are resolved from PATH at spawn time.
    const cliJs = path.join(cwd, 'node_modules', 'copilotbrowser', 'cli.js');
    if (fs.existsSync(cliJs))
        return cliJs;
    const binShim = path.join(cwd, 'node_modules', '.bin', process.platform === 'win32' ? 'copilotbrowser.cmd' : 'copilotbrowser');
    return fs.existsSync(binShim) ? binShim : 'copilotbrowser';
}
function runCommand(bin, args, cwd) {
    runningProcess?.kill();
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const env = { ...process.env, ...config.get('env', {}) };
    const proc = (0, child_process_1.spawn)(bin, args, { cwd, env, shell: true });
    proc.stdout?.on('data', (data) => {
        outputChannel.append(data.toString());
    });
    proc.stderr?.on('data', (data) => {
        outputChannel.append(data.toString());
    });
    proc.on('close', (code) => {
        outputChannel.appendLine(`\nProcess exited with code ${code}`);
        if (proc === runningProcess)
            runningProcess = undefined;
    });
    runningProcess = proc;
    outputChannel.show(true);
    return proc;
}
async function installBrowsers() {
    const cwd = getWorkspaceRoot();
    if (!cwd)
        return vscode.window.showErrorMessage('No workspace folder open');
    runCommand(getcopilotbrowserBin(cwd), ['install'], cwd);
}
async function runTests() {
    const cwd = getWorkspaceRoot();
    if (!cwd)
        return vscode.window.showErrorMessage('No workspace folder open');
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const args = ['test'];
    if (config.get('showBrowser'))
        args.push('--headed');
    const editor = vscode.window.activeTextEditor;
    if (editor?.document.fileName.match(/\.spec\.(ts|js|mjs)$/))
        args.push(editor.document.fileName);
    runCommand(getcopilotbrowserBin(cwd), args, cwd);
}
async function showTrace() {
    const cwd = getWorkspaceRoot();
    if (!cwd)
        return vscode.window.showErrorMessage('No workspace folder open');
    const traceFiles = await vscode.workspace.findFiles('**/test-results/**/trace.zip', '**/node_modules/**', 10);
    if (traceFiles.length === 0)
        return vscode.window.showInformationMessage('No trace files found. Run tests with tracing enabled first.');
    const items = traceFiles.map(f => ({
        label: path.relative(cwd, f.fsPath),
        uri: f,
    }));
    const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Select a trace file' });
    if (selected)
        runCommand(getcopilotbrowserBin(cwd), ['show-trace', selected.uri.fsPath], cwd);
}
async function codegen() {
    const cwd = getWorkspaceRoot();
    if (!cwd)
        return vscode.window.showErrorMessage('No workspace folder open');
    const url = await vscode.window.showInputBox({
        prompt: 'Enter the URL to record',
        placeHolder: 'https://example.com',
    });
    const args = ['codegen'];
    if (url)
        args.push(url);
    runCommand(getcopilotbrowserBin(cwd), args, cwd);
}
async function openInspector() {
    const cwd = getWorkspaceRoot();
    if (!cwd)
        return vscode.window.showErrorMessage('No workspace folder open');
    runCommand(getcopilotbrowserBin(cwd), ['open', '--inspector'], cwd);
}
//# sourceMappingURL=extension.js.map