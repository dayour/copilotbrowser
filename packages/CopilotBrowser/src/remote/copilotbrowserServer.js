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
Object.defineProperty(exports, "__esModule", { value: true });
exports.copilotbrowserServer = void 0;
const copilotbrowserConnection_1 = require("./copilotbrowserConnection");
const copilotbrowser_1 = require("../server/copilotbrowser");
const semaphore_1 = require("../utils/isomorphic/semaphore");
const time_1 = require("../utils/isomorphic/time");
const wsServer_1 = require("../server/utils/wsServer");
const ascii_1 = require("../server/utils/ascii");
const userAgent_1 = require("../server/utils/userAgent");
const utils_1 = require("../utils");
const socksProxy_1 = require("../server/utils/socksProxy");
const browser_1 = require("../server/browser");
const progress_1 = require("../server/progress");
class copilotbrowserServer {
    _copilotbrowser;
    _options;
    _wsServer;
    _dontReuseBrowsers = new Set();
    constructor(options) {
        this._options = options;
        if (options.preLaunchedBrowser) {
            this._copilotbrowser = options.preLaunchedBrowser.attribution.copilotbrowser;
            this._dontReuse(options.preLaunchedBrowser);
        }
        if (options.preLaunchedAndroidDevice)
            this._copilotbrowser = options.preLaunchedAndroidDevice._android.attribution.copilotbrowser;
        this._copilotbrowser ??= (0, copilotbrowser_1.createcopilotbrowser)({ sdkLanguage: 'javascript', isServer: true });
        const browserSemaphore = new semaphore_1.Semaphore(this._options.maxConnections);
        const controllerSemaphore = new semaphore_1.Semaphore(1);
        const reuseBrowserSemaphore = new semaphore_1.Semaphore(1);
        this._wsServer = new wsServer_1.WSServer({
            onRequest: (request, response) => {
                if (request.method === 'GET' && request.url === '/json') {
                    response.setHeader('Content-Type', 'application/json');
                    response.end(JSON.stringify({
                        wsEndpointPath: this._options.path,
                    }));
                    return;
                }
                response.end('Running');
            },
            onUpgrade: (request, socket) => {
                const uaError = userAgentVersionMatchesErrorMessage(request.headers['user-agent'] || '');
                if (uaError)
                    return { error: `HTTP/${request.httpVersion} 428 Precondition Required\r\n\r\n${uaError}` };
            },
            onHeaders: headers => {
                if (process.env.PWTEST_SERVER_WS_HEADERS)
                    headers.push(process.env.PWTEST_SERVER_WS_HEADERS);
            },
            onConnection: (request, url, ws, id) => {
                const browserHeader = request.headers['x-copilotbrowser-browser'];
                const browserName = url.searchParams.get('browser') || (Array.isArray(browserHeader) ? browserHeader[0] : browserHeader) || null;
                const proxyHeader = request.headers['x-copilotbrowser-proxy'];
                const proxyValue = url.searchParams.get('proxy') || (Array.isArray(proxyHeader) ? proxyHeader[0] : proxyHeader);
                const launchOptionsHeader = request.headers['x-copilotbrowser-launch-options'] || '';
                const launchOptionsHeaderValue = Array.isArray(launchOptionsHeader) ? launchOptionsHeader[0] : launchOptionsHeader;
                const launchOptionsParam = url.searchParams.get('launch-options');
                let launchOptions = { timeout: time_1.DEFAULT_copilotbrowser_LAUNCH_TIMEOUT };
                try {
                    launchOptions = JSON.parse(launchOptionsParam || launchOptionsHeaderValue);
                    if (!launchOptions.timeout)
                        launchOptions.timeout = time_1.DEFAULT_copilotbrowser_LAUNCH_TIMEOUT;
                }
                catch (e) {
                }
                const isExtension = this._options.mode === 'extension';
                const allowFSPaths = isExtension;
                launchOptions = filterLaunchOptions(launchOptions, allowFSPaths);
                if (isExtension) {
                    const connectFilter = url.searchParams.get('connect');
                    if (connectFilter) {
                        if (connectFilter !== 'first')
                            throw new Error(`Unknown connect filter: ${connectFilter}`);
                        return new copilotbrowserConnection_1.copilotbrowserConnection(browserSemaphore, ws, false, this._copilotbrowser, () => this._initConnectMode(id, connectFilter, browserName, launchOptions), id);
                    }
                    if (url.searchParams.has('debug-controller')) {
                        return new copilotbrowserConnection_1.copilotbrowserConnection(controllerSemaphore, ws, true, this._copilotbrowser, async () => { throw new Error('shouldnt be used'); }, id);
                    }
                    return new copilotbrowserConnection_1.copilotbrowserConnection(reuseBrowserSemaphore, ws, false, this._copilotbrowser, () => this._initReuseBrowsersMode(browserName, launchOptions, id), id);
                }
                if (this._options.mode === 'launchServer' || this._options.mode === 'launchServerShared') {
                    if (this._options.preLaunchedBrowser) {
                        return new copilotbrowserConnection_1.copilotbrowserConnection(browserSemaphore, ws, false, this._copilotbrowser, () => this._initPreLaunchedBrowserMode(id), id);
                    }
                    return new copilotbrowserConnection_1.copilotbrowserConnection(browserSemaphore, ws, false, this._copilotbrowser, () => this._initPreLaunchedAndroidMode(id), id);
                }
                return new copilotbrowserConnection_1.copilotbrowserConnection(browserSemaphore, ws, false, this._copilotbrowser, () => this._initLaunchBrowserMode(browserName, proxyValue, launchOptions, id), id);
            },
        });
    }
    async _initReuseBrowsersMode(browserName, launchOptions, id) {
        // Note: reuse browser mode does not support socks proxy, because
        // clients come and go, while the browser stays the same.
        utils_1.debugLogger.log('server', `[${id}] engaged reuse browsers mode for ${browserName}`);
        const requestedOptions = launchOptionsHash(launchOptions);
        let browser = this._copilotbrowser.allBrowsers().find(b => {
            if (b.options.name !== browserName)
                return false;
            if (this._dontReuseBrowsers.has(b))
                return false;
            const existingOptions = launchOptionsHash({ ...b.options.originalLaunchOptions, timeout: time_1.DEFAULT_copilotbrowser_LAUNCH_TIMEOUT });
            return existingOptions === requestedOptions;
        });
        // Close remaining browsers of this type+channel. Keep different browser types for the speed.
        for (const b of this._copilotbrowser.allBrowsers()) {
            if (b === browser)
                continue;
            if (this._dontReuseBrowsers.has(b))
                continue;
            if (b.options.name === browserName && b.options.channel === launchOptions.channel)
                await b.close({ reason: 'Connection terminated' });
        }
        if (!browser) {
            const browserType = this._copilotbrowser[(browserName || 'chromium')];
            const controller = new progress_1.ProgressController();
            browser = await controller.run(progress => browserType.launch(progress, {
                ...launchOptions,
                headless: !!process.env.PW_DEBUG_CONTROLLER_HEADLESS,
            }), launchOptions.timeout);
        }
        return {
            preLaunchedBrowser: browser,
            denyLaunch: true,
            dispose: async () => {
                // Don't close the pages so that user could debug them,
                // but close all the empty contexts to clean up.
                // keep around browser so it can be reused by the next connection.
                for (const context of browser.contexts()) {
                    if (!context.pages().length)
                        await context.close({ reason: 'Connection terminated' });
                }
            }
        };
    }
    async _initConnectMode(id, filter, browserName, launchOptions) {
        browserName ??= 'chromium';
        utils_1.debugLogger.log('server', `[${id}] engaged connect mode`);
        let browser = this._copilotbrowser.allBrowsers().find(b => b.options.name === browserName);
        if (!browser) {
            const browserType = this._copilotbrowser[browserName];
            const controller = new progress_1.ProgressController();
            browser = await controller.run(progress => browserType.launch(progress, launchOptions), launchOptions.timeout);
            this._dontReuse(browser);
        }
        return {
            preLaunchedBrowser: browser,
            denyLaunch: true,
            sharedBrowser: true,
        };
    }
    async _initPreLaunchedBrowserMode(id) {
        utils_1.debugLogger.log('server', `[${id}] engaged pre-launched (browser) mode`);
        const browser = this._options.preLaunchedBrowser;
        // In pre-launched mode, keep only the pre-launched browser.
        for (const b of this._copilotbrowser.allBrowsers()) {
            if (b !== browser)
                await b.close({ reason: 'Connection terminated' });
        }
        return {
            preLaunchedBrowser: browser,
            socksProxy: this._options.preLaunchedSocksProxy,
            sharedBrowser: this._options.mode === 'launchServerShared',
            denyLaunch: true,
        };
    }
    async _initPreLaunchedAndroidMode(id) {
        utils_1.debugLogger.log('server', `[${id}] engaged pre-launched (Android) mode`);
        const androidDevice = this._options.preLaunchedAndroidDevice;
        return {
            preLaunchedAndroidDevice: androidDevice,
            denyLaunch: true,
        };
    }
    async _initLaunchBrowserMode(browserName, proxyValue, launchOptions, id) {
        utils_1.debugLogger.log('server', `[${id}] engaged launch mode for "${browserName}"`);
        let socksProxy;
        if (proxyValue) {
            socksProxy = new socksProxy_1.SocksProxy();
            socksProxy.setPattern(proxyValue);
            launchOptions.socksProxyPort = await socksProxy.listen(0);
            utils_1.debugLogger.log('server', `[${id}] started socks proxy on port ${launchOptions.socksProxyPort}`);
        }
        else {
            launchOptions.socksProxyPort = undefined;
        }
        const browserType = this._copilotbrowser[browserName];
        const controller = new progress_1.ProgressController();
        const browser = await controller.run(progress => browserType.launch(progress, launchOptions), launchOptions.timeout);
        this._dontReuseBrowsers.add(browser);
        return {
            preLaunchedBrowser: browser,
            socksProxy,
            denyLaunch: true,
            dispose: async () => {
                await browser.close({ reason: 'Connection terminated' });
                socksProxy?.close();
            },
        };
    }
    _dontReuse(browser) {
        this._dontReuseBrowsers.add(browser);
        browser.on(browser_1.Browser.Events.Disconnected, () => {
            this._dontReuseBrowsers.delete(browser);
        });
    }
    async listen(port = 0, hostname) {
        return this._wsServer.listen(port, hostname, this._options.path);
    }
    async close() {
        await this._wsServer.close();
    }
}
exports.copilotbrowserServer = copilotbrowserServer;
function userAgentVersionMatchesErrorMessage(userAgent) {
    const match = userAgent.match(/^copilotbrowser\/(\d+\.\d+\.\d+)/);
    if (!match) {
        // Cannot parse user agent - be lax.
        return;
    }
    const received = match[1].split('.').slice(0, 2).join('.');
    const expected = (0, userAgent_1.getcopilotbrowserVersion)(true);
    if (received !== expected) {
        return (0, ascii_1.wrapInASCIIBox)([
            `copilotbrowser version mismatch:`,
            `  - server version: v${expected}`,
            `  - client version: v${received}`,
            ``,
            `If you are using VSCode extension, restart VSCode.`,
            ``,
            `If you are connecting to a remote service,`,
            `keep your local copilotbrowser version in sync`,
            `with the remote service version.`,
            ``,
            `<3 copilotbrowser Team`
        ].join('\n'), 1);
    }
}
function launchOptionsHash(options) {
    const copy = { ...options };
    for (const k of Object.keys(copy)) {
        const key = k;
        if (copy[key] === defaultLaunchOptions[key])
            delete copy[key];
    }
    for (const key of optionsThatAllowBrowserReuse)
        delete copy[key];
    return JSON.stringify(copy);
}
function filterLaunchOptions(options, allowFSPaths) {
    return {
        channel: options.channel,
        args: options.args,
        ignoreAllDefaultArgs: options.ignoreAllDefaultArgs,
        ignoreDefaultArgs: options.ignoreDefaultArgs,
        timeout: options.timeout,
        headless: options.headless,
        proxy: options.proxy,
        chromiumSandbox: options.chromiumSandbox,
        firefoxUserPrefs: options.firefoxUserPrefs,
        slowMo: options.slowMo,
        executablePath: ((0, utils_1.isUnderTest)() || allowFSPaths) ? options.executablePath : undefined,
        downloadsPath: allowFSPaths ? options.downloadsPath : undefined,
    };
}
const defaultLaunchOptions = {
    ignoreAllDefaultArgs: false,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
    headless: true,
};
const optionsThatAllowBrowserReuse = [
    'headless',
    'timeout',
    'tracesDir',
];
