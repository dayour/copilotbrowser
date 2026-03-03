"use strict";
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
exports.SharedContextFactory = void 0;
exports.contextFactory = contextFactory;
exports.identityBrowserContextFactory = identityBrowserContextFactory;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const net_1 = __importDefault(require("net"));
const path_1 = __importDefault(require("path"));
const copilotbrowser = __importStar(require("@copilotbrowser/copilotbrowser"));
const index_1 = require("@copilotbrowser/copilotbrowser/lib/server/registry/index");
const server_1 = require("@copilotbrowser/copilotbrowser/lib/server");
const log_1 = require("../log");
const config_1 = require("./config");
const server_2 = require("../sdk/server");
function contextFactory(config) {
    if (config.sharedBrowserContext)
        return SharedContextFactory.create(config);
    if (config.browser.remoteEndpoint)
        return new RemoteContextFactory(config);
    if (config.browser.cdpEndpoint)
        return new CdpContextFactory(config);
    if (config.browser.isolated)
        return new IsolatedContextFactory(config);
    return new PersistentContextFactory(config);
}
function identityBrowserContextFactory(browserContext) {
    return {
        createContext: async (clientInfo, abortSignal, options) => {
            return {
                browserContext,
                close: async () => { }
            };
        }
    };
}
class BaseContextFactory {
    config;
    _logName;
    _browserPromise;
    constructor(name, config) {
        this._logName = name;
        this.config = config;
    }
    async _obtainBrowser(clientInfo, options) {
        if (this._browserPromise)
            return this._browserPromise;
        (0, log_1.testDebug)(`obtain browser (${this._logName})`);
        this._browserPromise = this._doObtainBrowser(clientInfo, options);
        void this._browserPromise.then(browser => {
            browser.on('disconnected', () => {
                this._browserPromise = undefined;
            });
        }).catch(() => {
            this._browserPromise = undefined;
        });
        return this._browserPromise;
    }
    async _doObtainBrowser(clientInfo, options) {
        throw new Error('Not implemented');
    }
    async createContext(clientInfo, _, options) {
        (0, log_1.testDebug)(`create browser context (${this._logName})`);
        const browser = await this._obtainBrowser(clientInfo, options);
        const browserContext = await this._doCreateContext(browser, clientInfo);
        await addInitScript(browserContext, this.config.browser.initScript);
        return {
            browserContext,
            close: () => this._closeBrowserContext(browserContext, browser)
        };
    }
    async _doCreateContext(browser, clientInfo) {
        throw new Error('Not implemented');
    }
    async _closeBrowserContext(browserContext, browser) {
        (0, log_1.testDebug)(`close browser context (${this._logName})`);
        if (browser.contexts().length === 1)
            this._browserPromise = undefined;
        await browserContext.close().catch(log_1.logUnhandledError);
        if (browser.contexts().length === 0) {
            (0, log_1.testDebug)(`close browser (${this._logName})`);
            await browser.close().catch(log_1.logUnhandledError);
        }
    }
}
class IsolatedContextFactory extends BaseContextFactory {
    constructor(config) {
        super('isolated', config);
    }
    async _doObtainBrowser(clientInfo, options) {
        await injectCdpPort(this.config.browser);
        const browserType = copilotbrowser[this.config.browser.browserName];
        const tracesDir = await computeTracesDir(this.config, clientInfo);
        if (tracesDir && this.config.saveTrace)
            await startTraceServer(this.config, tracesDir);
        return browserType.launch({
            tracesDir,
            ...this.config.browser.launchOptions,
            handleSIGINT: false,
            handleSIGTERM: false,
        }).catch(error => {
            if (error.message.includes('Executable doesn\'t exist'))
                throwBrowserIsNotInstalledError(this.config);
            throw error;
        });
    }
    async _doCreateContext(browser, clientInfo) {
        return browser.newContext(await browserContextOptionsFromConfig(this.config, clientInfo));
    }
}
class CdpContextFactory extends BaseContextFactory {
    constructor(config) {
        super('cdp', config);
    }
    async _doObtainBrowser() {
        return copilotbrowser.chromium.connectOverCDP(this.config.browser.cdpEndpoint, {
            headers: this.config.browser.cdpHeaders,
            timeout: this.config.browser.cdpTimeout
        });
    }
    async _doCreateContext(browser) {
        return this.config.browser.isolated ? await browser.newContext() : browser.contexts()[0];
    }
}
class RemoteContextFactory extends BaseContextFactory {
    constructor(config) {
        super('remote', config);
    }
    async _doObtainBrowser() {
        const url = new URL(this.config.browser.remoteEndpoint);
        url.searchParams.set('browser', this.config.browser.browserName);
        if (this.config.browser.launchOptions)
            url.searchParams.set('launch-options', JSON.stringify(this.config.browser.launchOptions));
        return copilotbrowser[this.config.browser.browserName].connect(String(url));
    }
    async _doCreateContext(browser) {
        return browser.newContext();
    }
}
class PersistentContextFactory {
    config;
    name = 'persistent';
    description = 'Create a new persistent browser context';
    _userDataDirs = new Set();
    constructor(config) {
        this.config = config;
    }
    async createContext(clientInfo, abortSignal, options) {
        await injectCdpPort(this.config.browser);
        (0, log_1.testDebug)('create browser context (persistent)');
        const userDataDir = this.config.browser.userDataDir ?? await this._createUserDataDir(clientInfo);
        const tracesDir = await computeTracesDir(this.config, clientInfo);
        if (tracesDir && this.config.saveTrace)
            await startTraceServer(this.config, tracesDir);
        this._userDataDirs.add(userDataDir);
        (0, log_1.testDebug)('lock user data dir', userDataDir);
        const browserType = copilotbrowser[this.config.browser.browserName];
        for (let i = 0; i < 5; i++) {
            const launchOptions = {
                tracesDir,
                ...this.config.browser.launchOptions,
                ...await browserContextOptionsFromConfig(this.config, clientInfo),
                handleSIGINT: false,
                handleSIGTERM: false,
                ignoreDefaultArgs: [
                    '--disable-extensions',
                ],
                assistantMode: true,
            };
            try {
                const browserContext = await browserType.launchPersistentContext(userDataDir, launchOptions);
                await addInitScript(browserContext, this.config.browser.initScript);
                const close = () => this._closeBrowserContext(browserContext, userDataDir);
                return { browserContext, close };
            }
            catch (error) {
                if (error.message.includes('Executable doesn\'t exist'))
                    throwBrowserIsNotInstalledError(this.config);
                if (error.message.includes('cannot open shared object file: No such file or directory')) {
                    const browserName = launchOptions.channel ?? this.config.browser.browserName;
                    throw new Error(`Missing system dependencies required to run browser ${browserName}. Install them with: sudo npx copilotbrowser install-deps ${browserName}`);
                }
                if (error.message.includes('ProcessSingleton') ||
                    // On Windows the process exits silently with code 21 when the profile is in use.
                    error.message.includes('exitCode=21')) {
                    // User data directory is already in use, try again.
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                if (error.message.includes('exitCode=0') && error.message.includes('Opening in existing browser session')) {
                    // Edge joined an existing session instead of launching a new one. Kill existing
                    // Edge processes using the same user-data-dir and retry.
                    await killEdgeProcessesForUserDataDir(userDataDir);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                throw error;
            }
        }
        throw new Error(`Browser is already in use for ${userDataDir}, use --isolated to run multiple instances of the same browser`);
    }
    async _closeBrowserContext(browserContext, userDataDir) {
        (0, log_1.testDebug)('close browser context (persistent)');
        (0, log_1.testDebug)('release user data dir', userDataDir);
        await browserContext.close().catch(() => { });
        this._userDataDirs.delete(userDataDir);
        if (process.env.PWMCP_PROFILES_DIR_FOR_TEST && userDataDir.startsWith(process.env.PWMCP_PROFILES_DIR_FOR_TEST))
            await fs_1.default.promises.rm(userDataDir, { recursive: true }).catch(log_1.logUnhandledError);
        (0, log_1.testDebug)('close browser context complete (persistent)');
    }
    async _createUserDataDir(clientInfo) {
        const dir = process.env.PWMCP_PROFILES_DIR_FOR_TEST ?? index_1.registryDirectory;
        const browserToken = this.config.browser.launchOptions?.channel ?? this.config.browser?.browserName;
        // Hesitant putting hundreds of files into the user's workspace, so using it for hashing instead.
        const rootPath = (0, server_2.firstRootPath)(clientInfo);
        const rootPathToken = rootPath ? `-${createHash(rootPath)}` : '';
        const result = path_1.default.join(dir, `mcp-${browserToken}${rootPathToken}`);
        await fs_1.default.promises.mkdir(result, { recursive: true });
        return result;
    }
}
async function injectCdpPort(browserConfig) {
    if (browserConfig.browserName === 'chromium')
        browserConfig.launchOptions.cdpPort = await findFreePort();
}
async function findFreePort() {
    return new Promise((resolve, reject) => {
        const server = net_1.default.createServer();
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on('error', reject);
    });
}
async function startTraceServer(config, tracesDir) {
    if (!config.saveTrace)
        return;
    const server = await (0, server_1.startTraceViewerServer)();
    const urlPrefix = server.urlPrefix('human-readable');
    const url = urlPrefix + '/trace/index.html?trace=' + tracesDir + '/trace.json';
    // eslint-disable-next-line no-console
    console.error('\nTrace viewer listening on ' + url);
}
function createHash(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex').slice(0, 7);
}
async function addInitScript(browserContext, initScript) {
    for (const scriptPath of initScript ?? [])
        await browserContext.addInitScript({ path: path_1.default.resolve(scriptPath) });
}
async function killEdgeProcessesForUserDataDir(userDataDir) {
    // Kill Edge/Chromium processes that hold a lock on the given user-data-dir.
    try {
        const { execSync } = require('child_process');
        const normalizedDir = path_1.default.normalize(userDataDir);
        if (process.platform === 'win32') {
            const output = execSync('wmic process where "name like \'%msedge%\' or name like \'%chrome%\'" get ProcessId,CommandLine /format:csv', { encoding: 'utf-8', timeout: 5000 }).toString();
            for (const line of output.split('\n')) {
                if (line.includes(normalizedDir)) {
                    const parts = line.trim().split(',');
                    const pid = parseInt(parts[parts.length - 1], 10);
                    if (pid)
                        process.kill(pid);
                }
            }
        }
        else {
            execSync(`pkill -f "${normalizedDir.replace(/"/g, '\\"')}" || true`, { timeout: 5000 });
        }
    }
    catch {
        // Best-effort: if we can't kill the processes, the retry will still attempt to launch.
    }
}
class SharedContextFactory {
    _contextPromise;
    _baseFactory;
    static _instance;
    static create(config) {
        if (SharedContextFactory._instance)
            throw new Error('SharedContextFactory already exists');
        const baseConfig = { ...config, sharedBrowserContext: false };
        const baseFactory = contextFactory(baseConfig);
        SharedContextFactory._instance = new SharedContextFactory(baseFactory);
        return SharedContextFactory._instance;
    }
    constructor(baseFactory) {
        this._baseFactory = baseFactory;
    }
    async createContext(clientInfo, abortSignal, options) {
        if (!this._contextPromise) {
            (0, log_1.testDebug)('create shared browser context');
            this._contextPromise = this._baseFactory.createContext(clientInfo, abortSignal, options);
        }
        const { browserContext } = await this._contextPromise;
        (0, log_1.testDebug)(`shared context client connected`);
        return {
            browserContext,
            close: async () => {
                (0, log_1.testDebug)(`shared context client disconnected`);
            },
        };
    }
    static async dispose() {
        await SharedContextFactory._instance?._dispose();
    }
    async _dispose() {
        const contextPromise = this._contextPromise;
        this._contextPromise = undefined;
        if (!contextPromise)
            return;
        const { close } = await contextPromise;
        await close();
    }
}
exports.SharedContextFactory = SharedContextFactory;
async function computeTracesDir(config, clientInfo) {
    return path_1.default.resolve((0, config_1.outputDir)(config, clientInfo), 'traces');
}
async function browserContextOptionsFromConfig(config, clientInfo) {
    const result = { ...config.browser.contextOptions };
    if (config.saveVideo) {
        const dir = await (0, config_1.outputFile)(config, clientInfo, `videos`, { origin: 'code' });
        result.recordVideo = {
            dir,
            size: config.saveVideo,
        };
    }
    return result;
}
function throwBrowserIsNotInstalledError(config) {
    const channel = config.browser.launchOptions?.channel ?? config.browser.browserName;
    if (config.skillMode)
        throw new Error(`Browser "${channel}" is not installed. Run \`copilotbrowser-cli install-browser ${channel}\` to install`);
    else
        throw new Error(`Browser "${channel}" is not installed. Either install it (likely) or change the config.`);
}
