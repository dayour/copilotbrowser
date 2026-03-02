const path = require('path');
const fs = require('fs');
const Module = require('module');

const workspaceRoot = path.resolve(__dirname, '..');

const stubOutput = [];
const stubStatusBar = { show: () => stubOutput.push('statusbar.show'), hide: () => stubOutput.push('statusbar.hide'), dispose: () => {}, text: '', tooltip: '', backgroundColor: undefined };

const configStore = {
  'copilotbrowser.mcp.browser': 'msedge',
  'copilotbrowser.mcp.headless': true,
  'copilotbrowser.mcp.capabilities': [],
  'copilotbrowser.mcp.extraArgs': ['--timeout-action=30000'],
  'copilotbrowser.env': { FOO: 'BAR' },
};

const stubConfig = {
  get: (key, def) => (key in configStore ? configStore[key] : def),
};

// Capture provider registered by extension
let capturedProvider;
const stubLm = {
  registerMcpServerDefinitionProvider: (id, provider) => {
    stubOutput.push(`lm.register provider id=${id}`);
    capturedProvider = provider;
    return { dispose: () => stubOutput.push('lm.dispose') };
  }
};

class EventEmitter {
  constructor() { this._listeners = []; this.event = (listener) => { this._listeners.push(listener); return { dispose: () => {} }; }; }
  fire(...args) { this._listeners.forEach(fn => fn(...args)); }
  dispose() { this._listeners = []; }
}

const stubVscode = {
  window: {
    createOutputChannel: (name) => ({ appendLine: (msg) => stubOutput.push(`out:${msg}`), append: (msg) => stubOutput.push(`out:${msg}`), show: () => {}, dispose: () => {} }),
    createStatusBarItem: () => stubStatusBar,
    showInformationMessage: (msg) => stubOutput.push(`info:${msg}`),
    showErrorMessage: (msg) => stubOutput.push(`error:${msg}`),
    showQuickPick: async () => ({ label: 'dummy' }),
    activeTextEditor: undefined,
  },
  workspace: {
    getConfiguration: () => stubConfig,
    workspaceFolders: [{ uri: { fsPath: workspaceRoot } }],
    onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
  },
  commands: {
    registerCommand: (id, fn) => { stubOutput.push(`commands.register:${id}`); return { dispose: () => {} }; },
    executeCommand: async (id, ...args) => { stubOutput.push(`commands.exec:${id}`); return { id, args }; },
  },
  lm: stubLm,
  StatusBarAlignment: { Right: 1 },
  ThemeColor: class ThemeColor { constructor(val) { this.val = val; }},
  EventEmitter,
};

// Patch module loader for 'vscode'
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'vscode') return stubVscode;
  return originalLoad.call(this, request, parent, isMain);
};

(async () => {
  const ext = require('../packages/vscode-extension/out/extension.js');
  await ext.activate({ subscriptions: [] });
  if (!capturedProvider) throw new Error('Provider was not registered');
  const defs = await capturedProvider.provideMcpServerDefinitions({});
  console.log('MCP defs:', defs);
  const def = defs[0];
  if (!def.command.includes('node') && !def.command.endsWith('.cmd')) throw new Error('Unexpected command');
  if (!Array.isArray(def.args) || def.args[1] !== 'run-mcp-server') throw new Error('Args missing run-mcp-server');
  const cliPath = def.args[0];
  if (!fs.existsSync(cliPath)) throw new Error('CLI path does not exist: ' + cliPath);
  console.log('✅ extension provider resolved CLI path:', cliPath);
  console.log('✅ extension provider args:', def.args);
  console.log('✅ extension provider env:', def.env);
  console.log('Output log:', stubOutput.join('\n'));
})();
