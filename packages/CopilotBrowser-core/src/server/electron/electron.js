"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Electron = exports.ElectronApplication = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const readline = __importStar(require("readline"));
const utils_1 = require("../../utils");
const ascii_1 = require("../utils/ascii");
const debugLogger_1 = require("../utils/debugLogger");
const eventsHelper_1 = require("../utils/eventsHelper");
const browserContext_1 = require("../browserContext");
const crBrowser_1 = require("../chromium/crBrowser");
const crConnection_1 = require("../chromium/crConnection");
const crExecutionContext_1 = require("../chromium/crExecutionContext");
const crProtocolHelper_1 = require("../chromium/crProtocolHelper");
const console_1 = require("../console");
const helper_1 = require("../helper");
const instrumentation_1 = require("../instrumentation");
const js = __importStar(require("../javascript"));
const processLauncher_1 = require("../utils/processLauncher");
const transport_1 = require("../transport");
const ARTIFACTS_FOLDER = path_1.default.join(os_1.default.tmpdir(), 'copilotbrowser-artifacts-');
class ElectronApplication extends instrumentation_1.SdkObject {
    static Events = {
        Close: 'close',
        Console: 'console',
    };
    _browserContext;
    _nodeConnection;
    _nodeSession;
    _nodeExecutionContext;
    _nodeElectronHandlePromise = new utils_1.ManualPromise();
    _process;
    constructor(parent, browser, nodeConnection, process) {
        super(parent, 'electron-app');
        this._process = process;
        this._browserContext = browser._defaultContext;
        this._nodeConnection = nodeConnection;
        this._nodeSession = nodeConnection.rootSession;
        this._nodeSession.on('Runtime.executionContextCreated', async (event) => {
            if (!event.context.auxData || !event.context.auxData.isDefault)
                return;
            const crExecutionContext = new crExecutionContext_1.CRExecutionContext(this._nodeSession, event.context);
            this._nodeExecutionContext = new js.ExecutionContext(this, crExecutionContext, 'electron');
            const { result: remoteObject } = await crExecutionContext._client.send('Runtime.evaluate', {
                expression: `require('electron')`,
                contextId: event.context.id,
                // Needed after Electron 28 to get access to require: https://github.com/dayour/copilotbrowser/issues/28048
                includeCommandLineAPI: true,
            });
            this._nodeElectronHandlePromise.resolve(new js.JSHandle(this._nodeExecutionContext, 'object', 'ElectronModule', remoteObject.objectId));
        });
        this._nodeSession.on('Runtime.consoleAPICalled', event => this._onConsoleAPI(event));
        const appClosePromise = new Promise(f => this.once(ElectronApplication.Events.Close, f));
        this._browserContext.setCustomCloseHandler(async () => {
            await this._browserContext.stopVideoRecording();
            const electronHandle = await this._nodeElectronHandlePromise;
            await electronHandle.evaluate(({ app }) => app.quit()).catch(() => { });
            this._nodeConnection.close();
            await appClosePromise;
        });
    }
    async _onConsoleAPI(event) {
        if (event.executionContextId === 0) {
            // DevTools protocol stores the last 1000 console messages. These
            // messages are always reported even for removed execution contexts. In
            // this case, they are marked with executionContextId = 0 and are
            // reported upon enabling Runtime agent.
            //
            // Ignore these messages since:
            // - there's no execution context we can use to operate with message
            //   arguments
            // - these messages are reported before copilotbrowser clients can subscribe
            //   to the 'console'
            //   page event.
            //
            // @see https://github.com/GoogleChrome/puppeteer/issues/3865
            return;
        }
        if (!this._nodeExecutionContext)
            return;
        const args = event.args.map(arg => (0, crExecutionContext_1.createHandle)(this._nodeExecutionContext, arg));
        const message = new console_1.ConsoleMessage(null, null, event.type, undefined, args, (0, crProtocolHelper_1.toConsoleMessageLocation)(event.stackTrace), event.timestamp);
        this.emit(ElectronApplication.Events.Console, message);
    }
    async initialize() {
        await this._nodeSession.send('Runtime.enable', {});
        // Delay loading the app until browser is started and the browser targets are configured to auto-attach.
        await this._nodeSession.send('Runtime.evaluate', { expression: '__copilotbrowser_run()' });
    }
    process() {
        return this._process;
    }
    context() {
        return this._browserContext;
    }
    async close() {
        // This will call BrowserContext.setCustomCloseHandler.
        await this._browserContext.close({ reason: 'Application exited' });
    }
    async browserWindow(page) {
        // Assume CRPage as Electron is always Chromium.
        const targetId = page.delegate._targetId;
        const electronHandle = await this._nodeElectronHandlePromise;
        return await electronHandle.evaluateHandle(({ BrowserWindow, webContents }, targetId) => {
            const wc = webContents.fromDevToolsTargetId(targetId);
            return BrowserWindow.fromWebContents(wc);
        }, targetId);
    }
}
exports.ElectronApplication = ElectronApplication;
class Electron extends instrumentation_1.SdkObject {
    constructor(copilotbrowser) {
        super(copilotbrowser, 'electron');
        this.logName = 'browser';
    }
    async launch(progress, options) {
        let app = undefined;
        // --inspect=0 must be the last copilotbrowser's argument, loader.ts relies on it.
        let electronArguments = ['--inspect=0', ...(options.args || [])];
        if (os_1.default.platform() === 'linux') {
            if (!options.chromiumSandbox && electronArguments.indexOf('--no-sandbox') === -1)
                electronArguments.unshift('--no-sandbox');
        }
        const artifactsDir = await progress.race(fs_1.default.promises.mkdtemp(ARTIFACTS_FOLDER));
        const browserLogsCollector = new debugLogger_1.RecentLogsCollector();
        const env = options.env ? (0, processLauncher_1.envArrayToObject)(options.env) : process.env;
        let command;
        if (options.executablePath) {
            command = options.executablePath;
        }
        else {
            try {
                // By default we fallback to the Electron App executable path.
                // 'electron/index.js' resolves to the actual Electron App.
                command = require('electron/index.js');
            }
            catch (error) {
                if (error?.code === 'MODULE_NOT_FOUND') {
                    throw new Error('\n' + (0, ascii_1.wrapInASCIIBox)([
                        'Electron executablePath not found!',
                        'Please install it using `npm install -D electron` or set the executablePath to your Electron executable.',
                    ].join('\n'), 1));
                }
                throw error;
            }
            // Only use our own loader for non-packaged apps.
            // Packaged apps might have their own command line handling.
            electronArguments.unshift('-r', require.resolve('./loader'));
        }
        let shell = false;
        if (process.platform === 'win32') {
            // On Windows in order to run .cmd files, shell: true is required.
            // https://github.com/nodejs/node/issues/52554
            shell = true;
            // On Windows, we need to quote the executable path and arguments due to shell: true.
            // We allso pass the arguments as a single string due to DEP0190,
            // see https://github.com/dayour/copilotbrowser/issues/38278.
            command = [command, ...electronArguments].map(arg => `"${escapeDoubleQuotes(arg)}"`).join(' ');
            electronArguments = [];
        }
        // When debugging copilotbrowser test that runs Electron, NODE_OPTIONS
        // will make the debugger attach to Electron's Node. But copilotbrowser
        // also needs to attach to drive the automation. Disable external debugging.
        delete env.NODE_OPTIONS;
        const { launchedProcess, gracefullyClose, kill } = await (0, processLauncher_1.launchProcess)({
            command,
            args: electronArguments,
            env,
            log: (message) => {
                progress.log(message);
                browserLogsCollector.log(message);
            },
            shell,
            stdio: 'pipe',
            cwd: options.cwd,
            tempDirectories: [artifactsDir],
            attemptToGracefullyClose: () => app.close(),
            handleSIGINT: true,
            handleSIGTERM: true,
            handleSIGHUP: true,
            onExit: () => app?.emit(ElectronApplication.Events.Close),
        });
        // All waitForLines must be started immediately.
        // Otherwise the lines might come before we are ready.
        const waitForXserverError = waitForLine(progress, launchedProcess, /Unable to open X display/).then(() => {
            throw new Error([
                'Unable to open X display!',
                `================================`,
                'Most likely this is because there is no X server available.',
                "Use 'xvfb-run' on Linux to launch your tests with an emulated display server.",
                "For example: 'xvfb-run npm run test:e2e'",
                `================================`,
                progress.metadata.log
            ].join('\n'));
        });
        const nodeMatchPromise = waitForLine(progress, launchedProcess, /^Debugger listening on (ws:\/\/.*)$/);
        const chromeMatchPromise = waitForLine(progress, launchedProcess, /^DevTools listening on (ws:\/\/.*)$/);
        const debuggerDisconnectPromise = waitForLine(progress, launchedProcess, /Waiting for the debugger to disconnect\.\.\./);
        try {
            const nodeMatch = await nodeMatchPromise;
            const nodeTransport = await transport_1.WebSocketTransport.connect(progress, nodeMatch[1]);
            const nodeConnection = new crConnection_1.CRConnection(this, nodeTransport, helper_1.helper.debugProtocolLogger(), browserLogsCollector);
            // Immediately release exiting process under debug.
            debuggerDisconnectPromise.then(() => {
                nodeTransport.close();
            }).catch(() => { });
            const chromeMatch = await Promise.race([
                chromeMatchPromise,
                waitForXserverError,
            ]);
            const chromeTransport = await transport_1.WebSocketTransport.connect(progress, chromeMatch[1]);
            const browserProcess = {
                onclose: undefined,
                process: launchedProcess,
                close: gracefullyClose,
                kill
            };
            const contextOptions = {
                ...options,
                noDefaultViewport: true,
            };
            const browserOptions = {
                name: 'electron',
                isChromium: true,
                headful: true,
                persistent: contextOptions,
                browserProcess,
                protocolLogger: helper_1.helper.debugProtocolLogger(),
                browserLogsCollector,
                artifactsDir,
                downloadsPath: artifactsDir,
                tracesDir: options.tracesDir || artifactsDir,
                originalLaunchOptions: {},
            };
            (0, browserContext_1.validateBrowserContextOptions)(contextOptions, browserOptions);
            const browser = await progress.race(crBrowser_1.CRBrowser.connect(this.attribution.copilotbrowser, chromeTransport, browserOptions));
            app = new ElectronApplication(this, browser, nodeConnection, launchedProcess);
            await progress.race(app.initialize());
            return app;
        }
        catch (error) {
            await kill();
            throw error;
        }
    }
}
exports.Electron = Electron;
async function waitForLine(progress, process, regex) {
    const promise = new utils_1.ManualPromise();
    // eslint-disable-next-line no-restricted-properties
    const rl = readline.createInterface({ input: process.stderr });
    const failError = new Error('Process failed to launch!');
    const listeners = [
        eventsHelper_1.eventsHelper.addEventListener(rl, 'line', onLine),
        eventsHelper_1.eventsHelper.addEventListener(rl, 'close', () => promise.reject(failError)),
        eventsHelper_1.eventsHelper.addEventListener(process, 'exit', () => promise.reject(failError)),
        // It is Ok to remove error handler because we did not create process and there is another listener.
        eventsHelper_1.eventsHelper.addEventListener(process, 'error', () => promise.reject(failError)),
    ];
    function onLine(line) {
        const match = line.match(regex);
        if (match)
            promise.resolve(match);
    }
    try {
        return await progress.race(promise);
    }
    finally {
        eventsHelper_1.eventsHelper.removeEventListeners(listeners);
    }
}
function escapeDoubleQuotes(str) {
    return str.replace(/"/g, '\\"');
}
