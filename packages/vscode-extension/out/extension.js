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
let runningProcess; // explicit HTTP server (autoStart / manual commands)
let httpServerRunning = false;
let extensionPath; // set during activate(), used to locate bundled CLI
// Sidebar tree view providers (set during activate)
let targetsProvider;
let configProvider;
// MCP provider reference so config commands can trigger a refresh
let mcpProviderRef;
// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------
function activate(context) {
    extensionPath = context.extensionPath;
    outputChannel = vscode.window.createOutputChannel('copilotbrowser');
    context.subscriptions.push(outputChannel);
    // Status bar: shows MCP server availability / running state
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'copilotbrowser.showStatus';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();
    // Register MCP server definition provider so copilotbrowser shows up in
    // VS Code's MCP server list (GitHub Copilot, Copilot Chat, etc.).
    const mcpProvider = new copilotbrowserMcpProvider();
    const lm = vscode.lm;
    let providerRegistered = false;
    if (typeof lm.registerMcpServerDefinitionProvider === 'function') {
        try {
            context.subscriptions.push(lm.registerMcpServerDefinitionProvider('copilotbrowser', mcpProvider));
            providerRegistered = true;
            outputChannel.appendLine('MCP Server Definition Provider registered.');
        }
        catch (error) {
            outputChannel.appendLine(`MCP Server Definition Provider registration failed, using file-based config fallback: ${error}`);
        }
    }
    else {
        outputChannel.appendLine('MCP Server Definition Provider API not available — using file-based config fallback.');
    }
    // Provider API and file-based fallback are mutually exclusive to avoid
    // duplicate copilotbrowser entries in the MCP Servers UI.
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        if (providerRegistered)
            removeCopilotbrowserFromMcpConfigFiles(folder.uri.fsPath).catch(e => outputChannel.appendLine(`MCP config cleanup failed: ${e}`));
        else
            writeMcpConfigFiles(folder.uri.fsPath).catch(e => outputChannel.appendLine(`MCP config write failed: ${e}`));
    }
    // Configure global Copilot CLI MCP settings.
    void configureMcpGlobalSettings(context);
    // Watch for workspace/config changes to refresh MCP definitions and configs
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
        for (const added of e.added)
            if (providerRegistered)
                removeCopilotbrowserFromMcpConfigFiles(added.uri.fsPath).catch(e2 => outputChannel.appendLine(`MCP config cleanup failed: ${e2}`));
            else
                writeMcpConfigFiles(added.uri.fsPath).catch(e2 => outputChannel.appendLine(`MCP config write failed: ${e2}`));
        mcpProvider.refresh();
        updateStatusBar();
    }), vscode.workspace.onDidChangeConfiguration(e => {
        if (!e.affectsConfiguration('copilotbrowser'))
            return;
        mcpProvider.refresh();
        for (const folder of vscode.workspace.workspaceFolders ?? [])
            if (providerRegistered)
                removeCopilotbrowserFromMcpConfigFiles(folder.uri.fsPath).catch(e2 => outputChannel.appendLine(`MCP config cleanup failed: ${e2}`));
            else
                writeMcpConfigFiles(folder.uri.fsPath).catch(e2 => outputChannel.appendLine(`MCP config rewrite failed: ${e2}`));
        void updateMcpGlobalSettings();
    }));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('copilotbrowser.install', installBrowsers), vscode.commands.registerCommand('copilotbrowser.runTests', runTests), vscode.commands.registerCommand('copilotbrowser.showTrace', showTrace), vscode.commands.registerCommand('copilotbrowser.codegen', codegen), vscode.commands.registerCommand('copilotbrowser.openInspector', openInspector), vscode.commands.registerCommand('copilotbrowser.startMcpServer', startMcpServer), vscode.commands.registerCommand('copilotbrowser.stopMcpServer', stopMcpServer), vscode.commands.registerCommand('copilotbrowser.restartMcpServer', restartMcpServer), vscode.commands.registerCommand('copilotbrowser.refreshMcp', () => {
        mcpProvider.refresh();
        for (const folder of vscode.workspace.workspaceFolders ?? [])
            if (providerRegistered)
                removeCopilotbrowserFromMcpConfigFiles(folder.uri.fsPath).catch(e => outputChannel.appendLine(`MCP config cleanup failed: ${e}`));
            else
                writeMcpConfigFiles(folder.uri.fsPath).catch(e => outputChannel.appendLine(`MCP config rewrite failed: ${e}`));
        void updateMcpGlobalSettings();
        vscode.window.showInformationMessage('copilotbrowser MCP server definitions refreshed.');
    }), vscode.commands.registerCommand('copilotbrowser.showStatus', showStatus), vscode.commands.registerCommand('copilotbrowser.showMcpConfig', showMcpConfig), vscode.commands.registerCommand('copilotbrowser.openSettings', () => {
        void vscode.commands.executeCommand('workbench.action.openSettings', '@ext:dayour.copilotbrowser-vscode copilotbrowser');
    }), vscode.commands.registerCommand('copilotbrowser.openDocumentation', () => {
        void vscode.env.openExternal(vscode.Uri.parse('https://github.com/dayour/copilotbrowser#readme'));
    }), vscode.commands.registerCommand('copilotbrowser.reportBug', () => {
        void vscode.env.openExternal(vscode.Uri.parse('https://github.com/dayour/copilotbrowser/issues'));
    }), vscode.commands.registerCommand('copilotbrowser.showOutput', () => {
        outputChannel.show(true);
    }), vscode.commands.registerCommand('copilotbrowser.refreshSidebar', () => {
        targetsProvider?.refresh();
        configProvider?.refresh();
    }), vscode.commands.registerCommand('copilotbrowser.config.setBrowser', configSetBrowser), vscode.commands.registerCommand('copilotbrowser.config.toggleHeadless', configToggleHeadless), vscode.commands.registerCommand('copilotbrowser.config.toggleNoSandbox', configToggleNoSandbox), vscode.commands.registerCommand('copilotbrowser.config.setCapabilities', configSetCapabilities), vscode.commands.registerCommand('copilotbrowser.config.toggleAutoStart', configToggleAutoStart), vscode.commands.registerCommand('copilotbrowser.config.toggleProfileMode', configToggleProfileMode), vscode.commands.registerCommand('copilotbrowser.config.setConnectedProfile', configSetConnectedProfile), vscode.commands.registerCommand('copilotbrowser.installCliSkills', installCliSkills));
    // Store mcpProvider reference so config commands can trigger a refresh
    mcpProviderRef = mcpProvider;
    // Register sidebar tree view providers
    targetsProvider = new TargetsTreeProvider();
    configProvider = new ConfigTreeProvider();
    const toolsProvider = new ToolsTreeProvider();
    const helpProvider = new HelpTreeProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider('copilotbrowser.targetsView', targetsProvider), vscode.window.registerTreeDataProvider('copilotbrowser.configView', configProvider), vscode.window.registerTreeDataProvider('copilotbrowser.toolsView', toolsProvider), vscode.window.registerTreeDataProvider('copilotbrowser.helpView', helpProvider));
    // Auto-start HTTP MCP server if configured
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    if (config.get('autoStart', false))
        void startMcpServer();
    outputChannel.appendLine('copilotbrowser extension activated.');
}
function deactivate() {
    runningProcess?.kill();
    outputChannel?.dispose();
    statusBarItem?.dispose();
}
// ---------------------------------------------------------------------------
// Global MCP configuration
// Writes entries to:
//   1. .vscode/mcp.json (VS Code workspace discovery)
//   2. ~/.copilot/mcp-config.json (GitHub Copilot CLI discovery)
// ---------------------------------------------------------------------------
async function configureMcpGlobalSettings(context) {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    if (!config.get('autoConfigureMCP', true))
        return;
    // Write ~/.copilot/mcp-config.json so the Copilot CLI can discover
    // the extension's bundled MCP server automatically.
    await writeCopilotCliMcpConfig(config);
    const isFirstRun = !context.globalState.get('copilotbrowser.configured');
    if (isFirstRun) {
        await context.globalState.update('copilotbrowser.configured', true);
        outputChannel.appendLine('First-run configuration complete — MCP server available via provider API, .vscode/mcp.json, and ~/.copilot/mcp-config.json.');
    }
}
async function updateMcpGlobalSettings() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    if (!config.get('autoConfigureMCP', true))
        return;
    await writeCopilotCliMcpConfig(config);
}
/**
 * Write or update ~/.copilot/mcp-config.json so that `copilot` CLI
 * (GitHub Copilot CLI) discovers the extension's bundled MCP server.
 */
async function writeCopilotCliMcpConfig(config) {
    const homedir = process.env.HOME || process.env.USERPROFILE;
    if (!homedir)
        return;
    const configPath = path.join(homedir, '.copilot', 'mcp-config.json');
    const mcpArgs = buildMcpArgs(config);
    const cliPath = findcopilotbrowserCli();
    if (!cliPath)
        return;
    const serverEntry = {
        type: 'stdio',
        command: 'node',
        tools: ['*'],
        args: [cliPath, ...mcpArgs],
        env: {},
    };
    try {
        await fs.promises.mkdir(path.dirname(configPath), { recursive: true });
        let existing = { mcpServers: {} };
        try {
            const raw = await fs.promises.readFile(configPath, 'utf8');
            existing = JSON.parse(raw);
            if (!existing.mcpServers || typeof existing.mcpServers !== 'object')
                existing.mcpServers = {};
        }
        catch {
            // File doesn't exist yet — start fresh.
        }
        existing.mcpServers['copilotbrowser-mcp'] = serverEntry;
        await fs.promises.writeFile(configPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
        outputChannel.appendLine(`Copilot CLI MCP config written: ${configPath}`);
    }
    catch (err) {
        outputChannel.appendLine(`Could not write Copilot CLI MCP config: ${err}`);
    }
}
function runUtilityCommand(command, args) {
    return new Promise(resolve => {
        let stdout = '';
        let stderr = '';
        const proc = (0, child_process_1.spawn)(command, args, { shell: false, windowsHide: true });
        proc.stdout?.on('data', (d) => {
            stdout += d.toString();
        });
        proc.stderr?.on('data', (d) => {
            stderr += d.toString();
        });
        proc.on('error', err => {
            resolve({ stdout, stderr: `${stderr}\n${String(err)}`.trim(), code: -1 });
        });
        proc.on('close', code => {
            resolve({ stdout, stderr, code });
        });
    });
}
async function getListeningPidsOnPort(port) {
    if (process.platform === 'win32') {
        const result = await runUtilityCommand('netstat.exe', ['-ano', '-p', 'tcp']);
        const pids = new Set();
        for (const line of `${result.stdout}\n${result.stderr}`.split(/\r?\n/)) {
            if (!line.includes(`:${port}`) || !line.toUpperCase().includes('LISTENING'))
                continue;
            const match = line.match(/LISTENING\s+(\d+)\s*$/i);
            if (!match)
                continue;
            const pid = Number(match[1]);
            if (Number.isInteger(pid) && pid > 0)
                pids.add(pid);
        }
        return [...pids];
    }
    const result = await runUtilityCommand('lsof', ['-nP', '-i', `TCP:${port}`, '-sTCP:LISTEN', '-t']);
    const pids = new Set();
    for (const line of result.stdout.split(/\r?\n/)) {
        const pid = Number(line.trim());
        if (Number.isInteger(pid) && pid > 0)
            pids.add(pid);
    }
    return [...pids];
}
async function forceTerminatePid(pid) {
    if (process.platform === 'win32') {
        await runUtilityCommand('taskkill.exe', ['/PID', String(pid), '/F', '/T']);
        return;
    }
    try {
        process.kill(pid, 'SIGKILL');
    }
    catch {
        // Ignore already-dead or inaccessible process.
    }
}
async function clearPortConflicts(port) {
    const blockedPids = new Set([process.pid]);
    if (runningProcess?.pid)
        blockedPids.add(runningProcess.pid);
    const initial = (await getListeningPidsOnPort(port)).filter(pid => !blockedPids.has(pid));
    if (initial.length === 0)
        return;
    outputChannel.appendLine(`Port ${port} in use by PID(s): ${initial.join(', ')}. Terminating conflict...`);
    for (const pid of initial) {
        try {
            process.kill(pid, 'SIGTERM');
        }
        catch {
            // Ignore and escalate below.
        }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const remaining = (await getListeningPidsOnPort(port)).filter(pid => !blockedPids.has(pid));
    for (const pid of remaining)
        await forceTerminatePid(pid);
    await new Promise(resolve => setTimeout(resolve, 300));
    const stillInUse = (await getListeningPidsOnPort(port)).filter(pid => !blockedPids.has(pid));
    if (stillInUse.length > 0)
        throw new Error(`Port ${port} is still occupied by PID(s): ${stillInUse.join(', ')}`);
    outputChannel.appendLine(`Port ${port} conflict resolved.`);
}
async function startMcpServer() {
    if (httpServerRunning) {
        vscode.window.showInformationMessage('copilotbrowser MCP server is already running.');
        return;
    }
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const mcpArgs = buildMcpArgs(config);
    const cwd = getWorkspaceRoot() ?? process.cwd();
    // Prefer the extension's bundled CLI, then workspace, then fail
    const cliPath = findcopilotbrowserCli() ?? findcopilotbrowserCli(cwd);
    if (!cliPath) {
        vscode.window.showErrorMessage('copilotbrowser CLI not found. Run "Install Browsers" or install the package first.');
        return;
    }
    // Pick an available port and run in HTTP (SSE) mode so VS Code can connect
    const httpPort = 7890;
    const command = resolveNode();
    const args = [cliPath, ...mcpArgs, '--port', String(httpPort)];
    try {
        await clearPortConflicts(httpPort);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        outputChannel.appendLine(`Failed to clear port ${httpPort}: ${message}`);
        vscode.window.showErrorMessage(`Cannot start MCP server: ${message}`);
        return;
    }
    outputChannel.appendLine(`Starting HTTP MCP server on port ${httpPort}: ${command} ${args.join(' ')}`);
    outputChannel.show(true);
    let intentionallyStopped = false;
    const useShell = process.platform === 'win32';
    const spawnArgs = useShell
        ? args.map(a => a.includes(' ') ? `"${a}"` : a)
        : args;
    try {
        const proc = (0, child_process_1.spawn)(command, spawnArgs, {
            cwd,
            env: { ...process.env, ...buildMcpEnv(config) },
            shell: useShell,
        });
        proc.stdout?.on('data', (d) => outputChannel.append(d.toString()));
        proc.stderr?.on('data', (d) => outputChannel.append(d.toString()));
        proc.on('error', err => {
            outputChannel.appendLine(`MCP server error: ${err.message}`);
            vscode.window.showErrorMessage(`copilotbrowser MCP server failed to start: ${err.message}`);
            httpServerRunning = false;
            runningProcess = undefined;
            updateStatusBar();
        });
        proc.on('exit', (code, signal) => {
            if (!intentionallyStopped && code !== 0 && code !== null)
                vscode.window.showErrorMessage(`copilotbrowser MCP server exited unexpectedly (code ${code})`);
            else if (!intentionallyStopped && signal)
                vscode.window.showWarningMessage(`copilotbrowser MCP server terminated by signal ${signal}`);
            httpServerRunning = false;
            runningProcess = undefined;
            updateStatusBar();
        });
        const origKill = proc.kill.bind(proc);
        proc.kill = (...a) => {
            intentionallyStopped = true;
            return origKill(...a);
        };
        runningProcess = proc;
        httpServerRunning = true;
        updateStatusBar();
        vscode.window.showInformationMessage('copilotbrowser MCP server started. See "copilotbrowser" output for details.');
    }
    catch (err) {
        vscode.window.showErrorMessage(`Failed to start copilotbrowser MCP server: ${err}`);
        updateStatusBar();
    }
}
function stopMcpServer() {
    if (!httpServerRunning || !runningProcess) {
        vscode.window.showInformationMessage('copilotbrowser MCP server is not running.');
        return;
    }
    runningProcess.kill();
    runningProcess = undefined;
    httpServerRunning = false;
    updateStatusBar();
    vscode.window.showInformationMessage('copilotbrowser MCP server stopped.');
}
async function restartMcpServer() {
    if (httpServerRunning)
        stopMcpServer();
    await new Promise(r => setTimeout(r, 600));
    await startMcpServer();
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
        // Prefer the extension's own bundled CLI (self-contained MCP server)
        const bundledCli = findcopilotbrowserCli();
        if (bundledCli) {
            outputChannel.appendLine(`MCP: using bundled CLI at ${bundledCli}`);
            return [{
                    label: 'copilotbrowser',
                    command: resolveNode(),
                    args: [bundledCli, ...mcpArgs],
                    env: buildMcpEnv(config),
                    version: '2.0.0',
                }];
        }
        // Check workspace-local installs next (dev scenarios)
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            const cliPath = findcopilotbrowserCli(folder.uri.fsPath);
            if (cliPath) {
                outputChannel.appendLine(`MCP: using workspace CLI at ${cliPath}`);
                return [{
                        label: 'copilotbrowser',
                        command: resolveNode(),
                        args: [cliPath, ...mcpArgs],
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
                args: ['-y', 'copilotbrowser@2', ...mcpArgs],
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
 * Find the copilotbrowser CLI script.
 * Priority order:
 *   1. Bundled with the extension (node_modules/copilotbrowser/cli.js)
 *   2. Workspace node_modules or monorepo packages directory
 *   3. undefined → caller falls back to npx
 */
function findcopilotbrowserCli(workspaceRoot) {
    // 1. Check the extension's own bundled copy first — this makes the
    //    extension fully self-contained after installing from the marketplace.
    if (extensionPath) {
        const bundled = path.join(extensionPath, 'server', 'copilotbrowser', 'cli.js');
        if (fs.existsSync(bundled))
            return bundled;
    }
    if (!workspaceRoot)
        return undefined;
    // 2. Check workspace candidates (monorepo packages dir, node_modules)
    const candidates = [
        path.join(workspaceRoot, 'packages', 'copilotbrowser', 'cli.js'),
        path.join(workspaceRoot, 'node_modules', 'copilotbrowser', 'cli.js'),
        path.join(workspaceRoot, 'node_modules', '@copilotbrowser', 'test', 'cli.js'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate))
            return candidate;
    }
    return undefined;
}
/**
 * Find the bundled copilotbrowser-cli entry point.
 * This is a lightweight CLI wrapper co-bundled with the extension that lets
 * users run copilotbrowser-cli commands directly from the terminal.
 */
function findBundledCli() {
    if (!extensionPath)
        return undefined;
    const bundled = path.join(extensionPath, 'server', 'copilotbrowser-cli.js');
    if (fs.existsSync(bundled))
        return bundled;
    return undefined;
}
/**
 * Install copilotbrowser-cli skills into the current workspace.
 * Runs the bundled CLI with `install --skills` so coding agents (Claude Code,
 * GitHub Copilot, etc.) can discover and use the CLI via skill files.
 */
async function installCliSkills() {
    const cwd = getWorkspaceRoot();
    if (!cwd)
        return vscode.window.showErrorMessage('No workspace folder open.');
    const cliPath = findBundledCli();
    if (!cliPath) {
        return vscode.window.showErrorMessage('Bundled copilotbrowser-cli not found. Try reinstalling the extension.');
    }
    const proc = (0, child_process_1.spawn)(resolveNode(), [cliPath, 'install', '--skills'], {
        cwd,
        env: process.env,
        shell: process.platform === 'win32',
    });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (data) => {
        stdout += data.toString();
        outputChannel.append(data.toString());
    });
    proc.stderr?.on('data', (data) => {
        stderr += data.toString();
        outputChannel.append(data.toString());
    });
    proc.on('close', (code) => {
        if (code === 0) {
            vscode.window.showInformationMessage('copilotbrowser-cli skills installed into workspace.');
            outputChannel.appendLine('CLI skills installed successfully.');
        }
        else {
            vscode.window.showErrorMessage(`CLI skills installation failed (exit ${code}).`);
            outputChannel.appendLine(`CLI skills installation failed: ${stderr}`);
        }
    });
}
/** Build the --browser, --headless, --no-sandbox, --caps, and extra args for the MCP server */
function buildMcpArgs(config) {
    const args = [];
    const browser = config.get('mcp.browser', 'msedge');
    if (browser && browser !== 'chromium')
        args.push('--browser', browser);
    if (config.get('mcp.headless', false))
        args.push('--headless');
    if (config.get('mcp.noSandbox', false))
        args.push('--no-sandbox');
    // Profile mode: isolated (default) vs connected (reuse existing browser profile)
    const profileMode = config.get('mcp.profileMode', 'isolated');
    if (profileMode === 'connected' && (browser === 'msedge' || browser === 'chrome' || browser === 'chromium')) {
        const userDataDir = config.get('mcp.connectedUserDataDir', '').trim()
            || getDefaultUserDataDir(browser);
        if (userDataDir)
            args.push('--user-data-dir', userDataDir);
        const profile = config.get('mcp.connectedProfile', '').trim();
        if (profile)
            args.push('--profile-directory', profile);
    }
    else {
        // Explicit isolated flag so a temp profile is always used, even if
        // a previous connected session left a user-data-dir in extraArgs.
        args.push('--isolated');
    }
    const caps = config.get('mcp.capabilities', []);
    if (caps.length > 0)
        args.push('--caps', caps.join(','));
    const extra = config.get('mcp.extraArgs', []).filter(Boolean);
    args.push(...extra);
    return args;
}
/** Return the OS-default user-data directory for a given browser channel. */
function getDefaultUserDataDir(browser) {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
    if (browser === 'msedge') {
        if (process.platform === 'win32')
            return path.join(process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local'), 'Microsoft', 'Edge', 'User Data');
        if (process.platform === 'darwin')
            return path.join(home, 'Library', 'Application Support', 'Microsoft Edge');
        return path.join(home, '.config', 'microsoft-edge');
    }
    if (browser === 'chrome') {
        if (process.platform === 'win32')
            return path.join(process.env.LOCALAPPDATA ?? path.join(home, 'AppData', 'Local'), 'Google', 'Chrome', 'User Data');
        if (process.platform === 'darwin')
            return path.join(home, 'Library', 'Application Support', 'Google', 'Chrome');
        return path.join(home, '.config', 'google-chrome');
    }
    return '';
}
/** Build environment variables to pass to the MCP server process */
function buildMcpEnv(config) {
    return {
        ...config.get('env', {}),
    };
}
/**
 * Write (or update) the MCP config files so VS Code and GitHub Copilot
 * auto-discover copilotbrowser without any manual configuration:
 *
 *   • .vscode/mcp.json          — VS Code 1.99+ built-in MCP discovery
 *   • .github/copilot/mcp.json  — GitHub Copilot repo-level config
 *
 * Existing keys in `servers` are preserved; only the `copilotbrowser` entry
 * is added / overwritten.  All paths written to the JSON are relative to the
 * workspace root and use forward slashes so the files are portable across OSes
 * and safe to commit to version control.
 */
async function writeMcpConfigFiles(workspaceRoot) {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const mcpArgs = buildMcpArgs(config);
    const extraEnv = buildMcpEnv(config);
    // Prefer the extension's bundled CLI, then workspace-local
    const cliPath = findcopilotbrowserCli() ?? findcopilotbrowserCli(workspaceRoot);
    // Build the server entry.
    // We always use `node` as the command (resolved from PATH) and a
    // workspace-relative path as the first arg so the file is portable.
    const serverEntry = cliPath
        ? {
            type: 'stdio',
            command: 'node',
            args: [toRelativePosix(workspaceRoot, cliPath), ...mcpArgs],
            ...(Object.keys(extraEnv).length ? { env: extraEnv } : {}),
        }
        : {
            type: 'stdio',
            command: 'npx',
            args: ['-y', 'copilotbrowser@2', ...mcpArgs],
            ...(Object.keys(extraEnv).length ? { env: extraEnv } : {}),
        };
    // Paths to write
    const targets = [
        path.join(workspaceRoot, '.vscode', 'mcp.json'),
    ];
    // Only write .github/copilot/mcp.json if the .github directory already
    // exists (i.e. this is a git repo) to avoid cluttering non-git folders.
    const githubDir = path.join(workspaceRoot, '.github');
    if (fs.existsSync(githubDir))
        targets.push(path.join(githubDir, 'copilot', 'mcp.json'));
    for (const targetPath of targets) {
        try {
            await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
            // Read and merge existing config so other MCP servers are not removed.
            let existing = { servers: {} };
            try {
                const raw = await fs.promises.readFile(targetPath, 'utf8');
                existing = JSON.parse(raw);
                if (!existing.servers || typeof existing.servers !== 'object')
                    existing.servers = {};
            }
            catch {
                // File doesn't exist yet — start fresh.
            }
            existing.servers['copilotbrowser'] = serverEntry;
            await fs.promises.writeFile(targetPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
            outputChannel.appendLine(`MCP config written: ${targetPath}`);
        }
        catch (err) {
            outputChannel.appendLine(`MCP config write failed (${targetPath}): ${err}`);
        }
    }
}
/**
 * Remove copilotbrowser entries from workspace MCP config files.
 * Used when provider API is available to prevent duplicate server listing.
 */
async function removeCopilotbrowserFromMcpConfigFiles(workspaceRoot) {
    const targets = [
        path.join(workspaceRoot, '.vscode', 'mcp.json'),
        path.join(workspaceRoot, '.github', 'copilot', 'mcp.json'),
    ];
    for (const targetPath of targets) {
        try {
            if (!fs.existsSync(targetPath))
                continue;
            const raw = await fs.promises.readFile(targetPath, 'utf8');
            const parsed = JSON.parse(raw);
            let changed = false;
            if (parsed.servers && typeof parsed.servers === 'object' && 'copilotbrowser' in parsed.servers) {
                delete parsed.servers.copilotbrowser;
                changed = true;
            }
            if (parsed.mcpServers && typeof parsed.mcpServers === 'object' && 'copilotbrowser' in parsed.mcpServers) {
                delete parsed.mcpServers.copilotbrowser;
                changed = true;
            }
            if (changed) {
                await fs.promises.writeFile(targetPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
                outputChannel.appendLine(`Removed duplicate copilotbrowser MCP entry from ${targetPath}`);
            }
        }
        catch (err) {
            outputChannel.appendLine(`MCP config cleanup failed (${targetPath}): ${err}`);
        }
    }
}
/** Return a POSIX-style path relative to workspaceRoot (safe to embed in JSON). */
function toRelativePosix(workspaceRoot, absPath) {
    return path.relative(workspaceRoot, absPath).replace(/\\/g, '/');
}
/** Resolve the npx binary path using PATH so no directory is hard-coded. */
function resolveNpx() {
    // On Windows the npm-installed shim is npx.cmd; on POSIX it is npx.
    // Both are resolved from PATH at spawn time — no absolute directory needed.
    return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}
/** Resolve the node binary ('node' resolved from PATH). */
function resolveNode() {
    // Use 'node' from PATH rather than process.execPath which in VS Code
    // extension host context is the Electron binary, not a real Node binary.
    return process.platform === 'win32' ? 'node.exe' : 'node';
}
/** Update the status bar to reflect copilotbrowser availability and running state */
function updateStatusBar() {
    if (!statusBarItem)
        return;
    const hasBundled = !!findcopilotbrowserCli();
    const folders = vscode.workspace.workspaceFolders ?? [];
    const hasLocal = hasBundled || folders.some(f => !!findcopilotbrowserCli(f.uri.fsPath));
    if (httpServerRunning) {
        statusBarItem.text = '$(browser) copilotbrowser MCP: Running';
        statusBarItem.tooltip = 'copilotbrowser HTTP MCP server is running.\nClick to manage.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    }
    else if (hasLocal) {
        statusBarItem.text = '$(browser) copilotbrowser MCP: Stopped';
        statusBarItem.tooltip = hasBundled
            ? 'copilotbrowser MCP server ready (bundled with extension).\nClick to configure.'
            : 'copilotbrowser MCP server ready (local CLI).\nClick to configure.';
        statusBarItem.backgroundColor = undefined;
    }
    else {
        statusBarItem.text = '$(browser) copilotbrowser MCP: Stopped';
        statusBarItem.tooltip = 'copilotbrowser will use npx if not installed locally.\nClick to configure.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    statusBarItem.show();
    // Also refresh the sidebar tree views
    targetsProvider?.refresh();
    configProvider?.refresh();
}
/** Darbot-style status command shown from the status bar. */
function showStatus() {
    const isRunning = httpServerRunning;
    const status = isRunning ? 'Running' : 'Stopped';
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const browser = config.get('mcp.browser', 'msedge');
    const headless = config.get('mcp.headless', false);
    const noSandbox = config.get('mcp.noSandbox', false);
    const caps = config.get('mcp.capabilities', []);
    const profileMode = config.get('mcp.profileMode', 'isolated');
    const connectedProfile = config.get('mcp.connectedProfile', '');
    const profileInfo = profileMode === 'connected'
        ? `Connected (profile: ${connectedProfile || 'Default'})`
        : 'Isolated (temporary)';
    const statusMessage = [
        `copilotbrowser MCP Status: ${status}`,
        `Browser: ${browser}`,
        `Headless: ${headless}`,
        `No Sandbox: ${noSandbox}`,
        `Profile Mode: ${profileInfo}`,
        `Capabilities: ${caps.length ? caps.join(', ') : 'none'}`,
    ].join('\n');
    vscode.window.showInformationMessage(statusMessage, ...(isRunning ? ['Stop Server', 'Restart Server', 'Open Detailed Config'] : ['Start Server', 'Open Detailed Config'])).then(selection => {
        if (selection === 'Start Server')
            void startMcpServer();
        else if (selection === 'Stop Server')
            stopMcpServer();
        else if (selection === 'Restart Server')
            void restartMcpServer();
        else if (selection === 'Open Detailed Config')
            void showMcpConfig();
    });
}
/** Show a quick-pick with the current MCP server configuration and controls */
async function showMcpConfig() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const browser = config.get('mcp.browser', 'msedge');
    const headless = config.get('mcp.headless', false);
    const noSandbox = config.get('mcp.noSandbox', false);
    const caps = config.get('mcp.capabilities', []);
    const profileMode = config.get('mcp.profileMode', 'isolated');
    const connectedProfile = config.get('mcp.connectedProfile', '');
    const folders = vscode.workspace.workspaceFolders ?? [];
    let cliLocation = 'npx (fallback \u2014 copilotbrowser not found)';
    // Check bundled CLI first
    const bundledCli = findcopilotbrowserCli();
    if (bundledCli) {
        cliLocation = `${bundledCli} (bundled)`;
    }
    else {
        for (const folder of folders) {
            const cli = findcopilotbrowserCli(folder.uri.fsPath);
            if (cli) {
                cliLocation = cli;
                break;
            }
        }
    }
    const args = buildMcpArgs(config);
    const serverStatus = httpServerRunning ? 'Running' : 'Ready (stdio)';
    const items = [
        { label: '$(info) copilotbrowser MCP Status', kind: vscode.QuickPickItemKind.Separator },
        {
            label: '$(pulse) Server',
            description: serverStatus,
            detail: httpServerRunning
                ? 'An HTTP MCP server is active. Click Stop to shut it down.'
                : 'Managed by VS Code via stdio \u2014 no explicit server needed for Copilot Chat.',
        },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
        { label: '$(settings-gear) Configuration', kind: vscode.QuickPickItemKind.Separator },
        { label: '$(browser) Browser', description: browser, detail: 'copilotbrowser.mcp.browser' },
        { label: '$(eye) Headless', description: String(headless), detail: 'copilotbrowser.mcp.headless' },
        { label: '$(shield) No Sandbox', description: String(noSandbox), detail: 'copilotbrowser.mcp.noSandbox' },
        {
            label: `$(${profileMode === 'connected' ? 'account' : 'lock'}) Profile Mode`,
            description: profileMode,
            detail: profileMode === 'connected'
                ? `Connected — reusing profile: ${connectedProfile || 'Default'}  \u00b7  click to switch or change profile`
                : 'Isolated — fresh temporary profile each session  \u00b7  click to connect to your browser account',
        },
        { label: '$(symbol-misc) Capabilities', description: caps.length ? caps.join(', ') : 'none', detail: 'copilotbrowser.mcp.capabilities' },
        { label: '$(file-code) CLI', description: cliLocation, detail: `node cli.js ${args.join(' ')}` },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
        ...(httpServerRunning
            ? [
                { label: '$(stop) Stop MCP Server', description: 'Stop the running HTTP MCP server' },
                { label: '$(debug-restart) Restart MCP Server', description: 'Restart the HTTP MCP server' },
            ]
            : [
                { label: '$(run) Start MCP Server', description: 'Start an HTTP MCP server (optional \u2014 VS Code uses stdio automatically)' },
            ]),
        { label: '$(refresh) Refresh MCP Servers', description: 'Re-discover and refresh all server definitions' },
        { label: '$(cloud-download) Install Browsers', description: 'Install browser binaries via copilotbrowser install' },
        { label: '$(account) Toggle Profile Mode', description: `Switch between isolated and connected (current: ${profileMode})` },
        { label: '$(person) Select Connected Profile', description: 'Choose which browser profile to use when connected' },
        { label: '$(settings-gear) Open Settings', description: 'Configure copilotbrowser MCP settings' },
    ];
    const selected = await vscode.window.showQuickPick(items, {
        title: `copilotbrowser MCP \u2014 ${serverStatus}`,
        placeHolder: `node cli.js ${args.join(' ')}`,
    });
    if (!selected)
        return;
    if (selected.label.includes('Start MCP'))
        await vscode.commands.executeCommand('copilotbrowser.startMcpServer');
    else if (selected.label.includes('Stop MCP'))
        vscode.commands.executeCommand('copilotbrowser.stopMcpServer');
    else if (selected.label.includes('Restart'))
        await vscode.commands.executeCommand('copilotbrowser.restartMcpServer');
    else if (selected.label.includes('Refresh'))
        await vscode.commands.executeCommand('copilotbrowser.refreshMcp');
    else if (selected.label.includes('Install'))
        await vscode.commands.executeCommand('copilotbrowser.install');
    else if (selected.label.includes('Toggle Profile Mode'))
        await vscode.commands.executeCommand('copilotbrowser.config.toggleProfileMode');
    else if (selected.label.includes('Select Connected Profile'))
        await vscode.commands.executeCommand('copilotbrowser.config.setConnectedProfile');
    else if (selected.label.includes('Open Settings'))
        await vscode.commands.executeCommand('workbench.action.openSettings', 'copilotbrowser.mcp');
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
    const url = await vscode.window.showInputBox({
        prompt: 'URL to open in the inspector (leave blank for blank page)',
        placeHolder: 'https://example.com',
    });
    if (url === undefined)
        return; // user cancelled
    // PWDEBUG=1 activates the Playwright Inspector UI alongside the browser
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const env = { ...process.env, PWDEBUG: '1', ...config.get('env', {}) };
    const bin = getcopilotbrowserBin(cwd);
    const isScript = bin.endsWith('.js');
    const command = isScript ? resolveNode() : bin;
    const args = isScript
        ? [bin, 'open', ...(url ? [url] : [])]
        : ['open', ...(url ? [url] : [])];
    runningProcess?.kill();
    const proc = (0, child_process_1.spawn)(command, args, {
        cwd,
        env,
        shell: process.platform === 'win32',
    });
    proc.stdout?.on('data', (d) => outputChannel.append(d.toString()));
    proc.stderr?.on('data', (d) => outputChannel.append(d.toString()));
    proc.on('close', (code) => {
        outputChannel.appendLine(`\nInspector exited with code ${code}`);
        if (proc === runningProcess)
            runningProcess = undefined;
    });
    runningProcess = proc;
    outputChannel.show(true);
}
// ---------------------------------------------------------------------------
// Configuration quick-pick commands  (invoked by clicking sidebar config items)
// ---------------------------------------------------------------------------
/** Helper: apply a config change, refresh MCP definitions and config files */
async function applyConfigChange(key, value) {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    await config.update(key, value, vscode.ConfigurationTarget.Global);
    // Refresh MCP provider & config files through the existing refreshMcp handler
    await vscode.commands.executeCommand('copilotbrowser.refreshMcp');
    // If the HTTP server is already running, offer to restart with new config
    if (httpServerRunning) {
        const choice = await vscode.window.showInformationMessage('Configuration changed. Restart the MCP server to apply?', 'Restart Now', 'Later');
        if (choice === 'Restart Now')
            await restartMcpServer();
    }
}
async function configSetBrowser() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const current = config.get('mcp.browser', 'msedge');
    const options = [
        { label: 'chromium', description: 'Chromium (bundled with extension)', picked: current === 'chromium' },
        { label: 'chrome', description: 'Google Chrome (system install)', picked: current === 'chrome' },
        { label: 'msedge', description: 'Microsoft Edge (system install)', picked: current === 'msedge' },
        { label: 'firefox', description: 'Firefox (bundled with extension)', picked: current === 'firefox' },
        { label: 'webkit', description: 'WebKit / Safari (bundled with extension)', picked: current === 'webkit' },
    ];
    const selected = await vscode.window.showQuickPick(options, {
        title: 'CopilotBrowser: Select Browser',
        placeHolder: `Current: ${current}`,
    });
    if (!selected)
        return;
    await applyConfigChange('mcp.browser', selected.label);
}
async function configToggleHeadless() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const current = config.get('mcp.headless', false);
    const next = !current;
    const choice = await vscode.window.showQuickPick([
        { label: '$(eye) Visible (headed)', description: 'Show the browser window', picked: !current },
        { label: '$(eye-closed) Headless', description: 'Run without a visible window', picked: current },
    ], { title: 'CopilotBrowser: Headless Mode', placeHolder: `Current: ${current ? 'headless' : 'headed'}` });
    if (!choice)
        return;
    const newValue = choice.label.includes('Headless');
    if (newValue === current)
        return;
    await applyConfigChange('mcp.headless', newValue);
}
async function configToggleNoSandbox() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const current = config.get('mcp.noSandbox', false);
    const choice = await vscode.window.showQuickPick([
        { label: '$(shield) Sandbox enabled', description: 'Normal security sandbox (recommended)', picked: !current },
        { label: '$(shield-x) No Sandbox', description: 'Disable sandbox — use if you see sandbox errors', picked: current },
    ], { title: 'CopilotBrowser: Sandbox', placeHolder: `Current: ${current ? 'no sandbox' : 'sandbox enabled'}` });
    if (!choice)
        return;
    const newValue = choice.label.includes('No Sandbox');
    if (newValue === current)
        return;
    await applyConfigChange('mcp.noSandbox', newValue);
}
async function configSetCapabilities() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const current = config.get('mcp.capabilities', []);
    const options = [
        {
            label: 'vision',
            description: 'Screenshot-based vision for AI models that support images',
            picked: current.includes('vision'),
        },
        {
            label: 'pdf',
            description: 'Enable PDF capture and page-to-PDF tools',
            picked: current.includes('pdf'),
        },
        {
            label: 'devtools',
            description: 'Expose Chrome DevTools protocol tools',
            picked: current.includes('devtools'),
        },
    ];
    const selected = await vscode.window.showQuickPick(options, {
        title: 'CopilotBrowser: MCP Capabilities',
        placeHolder: `Current: ${current.length ? current.join(', ') : 'none'} — Space to toggle, Enter to confirm`,
        canPickMany: true,
    });
    if (!selected)
        return;
    await applyConfigChange('mcp.capabilities', selected.map(s => s.label));
}
async function configToggleAutoStart() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const current = config.get('autoStart', false);
    const choice = await vscode.window.showQuickPick([
        { label: '$(zap) Auto Start enabled', description: 'MCP server starts automatically with VS Code', picked: current },
        { label: '$(zap) Auto Start disabled', description: 'Start the MCP server manually when needed', picked: !current },
    ], { title: 'CopilotBrowser: Auto Start', placeHolder: `Current: ${current ? 'enabled' : 'disabled'}` });
    if (!choice)
        return;
    const newValue = choice.label.includes('enabled');
    if (newValue === current)
        return;
    await applyConfigChange('autoStart', newValue);
}
async function configToggleProfileMode() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const current = config.get('mcp.profileMode', 'isolated');
    const browser = config.get('mcp.browser', 'msedge');
    const supportsConnected = browser === 'msedge' || browser === 'chrome' || browser === 'chromium';
    const items = [
        {
            label: '$(lock) Isolated',
            description: 'Fresh temporary profile — no cookies, logins, or saved data',
            detail: 'Safe default. Every session starts clean.',
            picked: current === 'isolated',
        },
        {
            label: '$(account) Connected',
            description: 'Reuse your installed browser profile — stay signed in',
            detail: supportsConnected
                ? 'Uses your existing Edge/Chrome profile with all saved sessions and cookies.'
                : `⚠ Connected mode requires Edge or Chrome. Current browser: ${browser}.`,
            picked: current === 'connected',
        },
    ];
    const selected = await vscode.window.showQuickPick(items, {
        title: 'CopilotBrowser: Profile Mode',
        placeHolder: `Current: ${current}`,
    });
    if (!selected)
        return;
    const newValue = selected.label.includes('Connected') ? 'connected' : 'isolated';
    if (newValue === current)
        return;
    if (newValue === 'connected' && !supportsConnected) {
        vscode.window.showWarningMessage(`Connected profile mode requires Microsoft Edge or Chrome. Switch the browser setting first.`, 'Switch to Edge').then(choice => {
            if (choice === 'Switch to Edge')
                void configSetBrowser();
        });
        return;
    }
    await applyConfigChange('mcp.profileMode', newValue);
    if (newValue === 'connected') {
        const profileChoice = await vscode.window.showInformationMessage('Connected mode enabled. Would you like to select which browser profile to use?', 'Select Profile', 'Use Default');
        if (profileChoice === 'Select Profile')
            await configSetConnectedProfile();
    }
}
async function configSetConnectedProfile() {
    const config = vscode.workspace.getConfiguration('copilotbrowser');
    const browser = config.get('mcp.browser', 'msedge');
    const currentProfile = config.get('mcp.connectedProfile', '');
    const currentUdd = config.get('mcp.connectedUserDataDir', '');
    const userDataDir = currentUdd.trim() || getDefaultUserDataDir(browser);
    // Attempt to discover available profiles from the Local State file
    let profileItems = [
        {
            label: '$(person) Default',
            description: 'Default profile',
            detail: 'Uses the browser "Default" profile folder',
            picked: currentProfile === '' || currentProfile === 'Default',
        },
    ];
    if (userDataDir) {
        try {
            const localStatePath = path.join(userDataDir, 'Local State');
            const raw = fs.readFileSync(localStatePath, 'utf8');
            const localState = JSON.parse(raw);
            const infoCache = localState?.profile?.info_cache ?? {};
            profileItems = Object.entries(infoCache).map(([folderName, info]) => {
                const displayName = info.gaia_name ?? info.name ?? folderName;
                const email = info.user_name ? ` (${info.user_name})` : '';
                return {
                    label: `$(person) ${displayName}${email}`,
                    description: folderName,
                    detail: `Profile folder: ${folderName}`,
                    picked: currentProfile === folderName || (currentProfile === '' && folderName === 'Default'),
                };
            });
        }
        catch {
            // Local State not found or unreadable — fall back to manual entry
        }
    }
    profileItems.push({
        label: '$(edit) Enter manually…',
        description: 'Type a profile folder name (e.g. Profile 1)',
        detail: '',
        picked: false,
    });
    const selected = await vscode.window.showQuickPick(profileItems, {
        title: 'CopilotBrowser: Select Connected Profile',
        placeHolder: currentProfile ? `Current: ${currentProfile}` : 'Select a profile to use',
    });
    if (!selected)
        return;
    let profileFolder;
    if (selected.label.includes('Enter manually')) {
        const manual = await vscode.window.showInputBox({
            title: 'CopilotBrowser: Profile Folder Name',
            prompt: 'Enter the profile folder name (e.g. "Default", "Profile 1", "Profile 2")',
            value: currentProfile,
            placeHolder: 'Default',
        });
        if (manual === undefined)
            return;
        profileFolder = manual.trim();
    }
    else {
        // description holds the raw folder name
        profileFolder = selected.description === 'Default profile' ? 'Default' : (selected.description ?? '');
    }
    await applyConfigChange('mcp.connectedProfile', profileFolder);
    // Also prompt for custom user-data-dir if not the OS default
    const uddChoice = await vscode.window.showInformationMessage(`Profile set to: ${profileFolder || 'Default'}. User data directory: ${userDataDir || '(auto-detect)'}`, 'Change Directory', 'OK');
    if (uddChoice === 'Change Directory') {
        const customUdd = await vscode.window.showInputBox({
            title: 'CopilotBrowser: User Data Directory',
            prompt: 'Enter the full path to the browser user data directory',
            value: userDataDir,
            placeHolder: getDefaultUserDataDir(browser),
        });
        if (customUdd !== undefined)
            await applyConfigChange('mcp.connectedUserDataDir', customUdd.trim());
    }
}
// ---------------------------------------------------------------------------
// Sidebar Tree View Providers
// ---------------------------------------------------------------------------
class CopilotBrowserTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState = vscode.TreeItemCollapsibleState.None, options = {}) {
        super(label, collapsibleState);
        this.contextValue = options.contextValue;
        this.command = options.command;
        this.description = options.description;
        this.iconPath = options.iconPath;
        this.tooltip = options.tooltip;
    }
}
/** TARGETS view — shows MCP server status with inline start/stop/restart buttons */
class TargetsTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }
    getChildren(element) {
        if (element)
            return [];
        const running = httpServerRunning;
        const hasBundled = !!findcopilotbrowserCli();
        const folders = vscode.workspace.workspaceFolders ?? [];
        const hasLocal = hasBundled || folders.some(f => !!findcopilotbrowserCli(f.uri.fsPath));
        const statusLabel = running ? 'Running' : 'Stopped';
        const statusTooltip = running
            ? 'copilotbrowser HTTP MCP server is running. Use inline buttons to stop or restart.'
            : hasLocal
                ? 'copilotbrowser MCP is ready via stdio (bundled). Click ▶ to start an HTTP server.'
                : 'copilotbrowser MCP will use npx as a fallback. Click ▶ to start.';
        const serverItem = new CopilotBrowserTreeItem('copilotbrowser MCP', vscode.TreeItemCollapsibleState.None, {
            contextValue: running ? 'mcpRunning' : 'mcpStopped',
            description: statusLabel,
            iconPath: running
                ? new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('testing.iconPassed'))
                : new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('testing.iconSkipped')),
            tooltip: statusTooltip,
        });
        return [serverItem];
    }
}
/** CONFIGURATION view — shows current MCP settings with a link to open settings */
class ConfigTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }
    getChildren(element) {
        if (element)
            return [];
        const config = vscode.workspace.getConfiguration('copilotbrowser');
        const browser = config.get('mcp.browser', 'msedge');
        const headless = config.get('mcp.headless', false);
        const noSandbox = config.get('mcp.noSandbox', false);
        const caps = config.get('mcp.capabilities', []);
        const autoStart = config.get('autoStart', false);
        const profileMode = config.get('mcp.profileMode', 'isolated');
        const connectedProfile = config.get('mcp.connectedProfile', '');
        const items = [
            new CopilotBrowserTreeItem('Browser', vscode.TreeItemCollapsibleState.None, {
                description: browser,
                iconPath: new vscode.ThemeIcon('globe'),
                tooltip: 'Click to change browser — copilotbrowser.mcp.browser',
                contextValue: 'configItem',
                command: { command: 'copilotbrowser.config.setBrowser', title: 'Set Browser' },
            }),
            new CopilotBrowserTreeItem('Headless', vscode.TreeItemCollapsibleState.None, {
                description: String(headless),
                iconPath: new vscode.ThemeIcon(headless ? 'eye-closed' : 'eye'),
                tooltip: 'Click to toggle headless mode — copilotbrowser.mcp.headless',
                contextValue: 'configItem',
                command: { command: 'copilotbrowser.config.toggleHeadless', title: 'Toggle Headless' },
            }),
            new CopilotBrowserTreeItem('No Sandbox', vscode.TreeItemCollapsibleState.None, {
                description: String(noSandbox),
                iconPath: new vscode.ThemeIcon('shield'),
                tooltip: 'Click to toggle sandbox — copilotbrowser.mcp.noSandbox',
                contextValue: 'configItem',
                command: { command: 'copilotbrowser.config.toggleNoSandbox', title: 'Toggle No Sandbox' },
            }),
            new CopilotBrowserTreeItem('Profile Mode', vscode.TreeItemCollapsibleState.None, {
                description: profileMode,
                iconPath: new vscode.ThemeIcon(profileMode === 'connected' ? 'account' : 'lock'),
                tooltip: profileMode === 'connected'
                    ? 'Connected: reusing your installed browser profile — click to switch to isolated'
                    : 'Isolated: fresh temporary profile each session — click to switch to connected',
                contextValue: 'configItem',
                command: { command: 'copilotbrowser.config.toggleProfileMode', title: 'Toggle Profile Mode' },
            }),
        ];
        if (profileMode === 'connected') {
            items.push(new CopilotBrowserTreeItem('Connected Profile', vscode.TreeItemCollapsibleState.None, {
                description: connectedProfile || 'Default',
                iconPath: new vscode.ThemeIcon('person'),
                tooltip: 'Click to select which browser profile to connect to — copilotbrowser.mcp.connectedProfile',
                contextValue: 'configItem',
                command: { command: 'copilotbrowser.config.setConnectedProfile', title: 'Select Connected Profile' },
            }));
        }
        items.push(new CopilotBrowserTreeItem('Capabilities', vscode.TreeItemCollapsibleState.None, {
            description: caps.length ? caps.join(', ') : 'none',
            iconPath: new vscode.ThemeIcon('symbol-misc'),
            tooltip: 'Click to select capabilities (vision, pdf, devtools) — copilotbrowser.mcp.capabilities',
            contextValue: 'configItem',
            command: { command: 'copilotbrowser.config.setCapabilities', title: 'Set Capabilities' },
        }), new CopilotBrowserTreeItem('Auto Start', vscode.TreeItemCollapsibleState.None, {
            description: String(autoStart),
            iconPath: new vscode.ThemeIcon('zap'),
            tooltip: 'Click to toggle auto-start on VS Code startup — copilotbrowser.autoStart',
            contextValue: 'configItem',
            command: { command: 'copilotbrowser.config.toggleAutoStart', title: 'Toggle Auto Start' },
        }), new CopilotBrowserTreeItem('Open Settings', vscode.TreeItemCollapsibleState.None, {
            iconPath: new vscode.ThemeIcon('settings-gear'),
            command: { command: 'copilotbrowser.openSettings', title: 'Open Settings' },
            contextValue: 'openSettingsAction',
            tooltip: 'Open full copilotbrowser settings page',
        }));
        return items;
    }
}
/** TOOLS view — action buttons for browser automation tasks */
class ToolsTreeProvider {
    getTreeItem(element) { return element; }
    getChildren(element) {
        if (element)
            return [];
        return [
            new CopilotBrowserTreeItem('Install Browsers', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('cloud-download'),
                command: { command: 'copilotbrowser.install', title: 'Install Browsers' },
                tooltip: 'Download and install browser binaries (Chromium, Firefox, WebKit)',
                contextValue: 'toolAction',
            }),
            new CopilotBrowserTreeItem('Run Tests', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('play'),
                command: { command: 'copilotbrowser.runTests', title: 'Run Tests' },
                tooltip: 'Run copilotbrowser tests in the current workspace',
                contextValue: 'toolAction',
            }),
            new CopilotBrowserTreeItem('Show Trace Viewer', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('graph'),
                command: { command: 'copilotbrowser.showTrace', title: 'Show Trace Viewer' },
                tooltip: 'Open the copilotbrowser trace viewer for a recorded test trace',
                contextValue: 'toolAction',
            }),
            new CopilotBrowserTreeItem('Record New Test', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('record'),
                command: { command: 'copilotbrowser.codegen', title: 'Record New Test' },
                tooltip: 'Open a browser and record interactions as a copilotbrowser test',
                contextValue: 'toolAction',
            }),
            new CopilotBrowserTreeItem('Open Inspector', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('inspect'),
                command: { command: 'copilotbrowser.openInspector', title: 'Open Inspector' },
                tooltip: 'Open the copilotbrowser inspector for interactive browser exploration',
                contextValue: 'toolAction',
            }),
            new CopilotBrowserTreeItem('Install CLI Skills', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('extensions'),
                command: { command: 'copilotbrowser.installCliSkills', title: 'Install CLI Skills' },
                tooltip: 'Install copilotbrowser-cli skills into the workspace for coding agents',
                contextValue: 'toolAction',
            }),
        ];
    }
}
/** HELPFUL LINKS view — documentation, issue tracker, and output channel */
class HelpTreeProvider {
    getTreeItem(element) { return element; }
    getChildren(element) {
        if (element)
            return [];
        return [
            new CopilotBrowserTreeItem('Documentation', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('book'),
                command: { command: 'copilotbrowser.openDocumentation', title: 'Open Documentation' },
                tooltip: 'Open the copilotbrowser README and documentation on GitHub',
                contextValue: 'helpLink',
            }),
            new CopilotBrowserTreeItem('Report a Bug', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('bug'),
                command: { command: 'copilotbrowser.reportBug', title: 'Report a Bug' },
                tooltip: 'Open the GitHub issue tracker to report a problem',
                contextValue: 'helpLink',
            }),
            new CopilotBrowserTreeItem('Show Output', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('output'),
                command: { command: 'copilotbrowser.showOutput', title: 'Show Output' },
                tooltip: 'Show the copilotbrowser output channel for logs and diagnostics',
                contextValue: 'helpLink',
            }),
            new CopilotBrowserTreeItem('MCP Config Quick-Pick', vscode.TreeItemCollapsibleState.None, {
                iconPath: new vscode.ThemeIcon('settings-gear'),
                command: { command: 'copilotbrowser.showMcpConfig', title: 'Show MCP Config' },
                tooltip: 'Open the MCP server configuration quick-pick panel',
                contextValue: 'helpLink',
            }),
        ];
    }
}
//# sourceMappingURL=extension.js.map
