"use strict";
/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chromium = void 0;
exports.waitForReadyState = waitForReadyState;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const chromiumSwitches_1 = require("./chromiumSwitches");
const crBrowser_1 = require("./crBrowser");
const crConnection_1 = require("./crConnection");
const utils_1 = require("../../utils");
const ascii_1 = require("../utils/ascii");
const debugLogger_1 = require("../utils/debugLogger");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
const network_1 = require("../utils/network");
const userAgent_1 = require("../utils/userAgent");
const browserContext_1 = require("../browserContext");
const browserType_1 = require("../browserType");
const helper_1 = require("../helper");
const registry_1 = require("../registry");
const transport_1 = require("../transport");
const crDevTools_1 = require("./crDevTools");
const browser_1 = require("../browser");
const fileUtils_1 = require("../utils/fileUtils");
const processLauncher_1 = require("../utils/processLauncher");
const ARTIFACTS_FOLDER = path_1.default.join(os_1.default.tmpdir(), 'copilotbrowser-artifacts-');
class Chromium extends browserType_1.BrowserType {
    _devtools;
    _bidiChromium;
    constructor(parent, bidiChromium) {
        super(parent, 'chromium');
        this._bidiChromium = bidiChromium;
        if ((0, utils_1.debugMode)() === 'inspector')
            this._devtools = this._createDevTools();
    }
    launch(progress, options, protocolLogger) {
        if (options.channel?.startsWith('bidi-'))
            return this._bidiChromium.launch(progress, options, protocolLogger);
        return super.launch(progress, options, protocolLogger);
    }
    async launchPersistentContext(progress, userDataDir, options) {
        if (options.channel?.startsWith('bidi-'))
            return this._bidiChromium.launchPersistentContext(progress, userDataDir, options);
        return super.launchPersistentContext(progress, userDataDir, options);
    }
    async connectOverCDP(progress, endpointURL, options) {
        return await this._connectOverCDPInternal(progress, endpointURL, options);
    }
    async _connectOverCDPInternal(progress, endpointURL, options, onClose) {
        let headersMap;
        if (options.headers)
            headersMap = (0, utils_1.headersArrayToObject)(options.headers, false);
        if (!headersMap)
            headersMap = { 'User-Agent': (0, userAgent_1.getUserAgent)() };
        else if (headersMap && !Object.keys(headersMap).some(key => key.toLowerCase() === 'user-agent'))
            headersMap['User-Agent'] = (0, userAgent_1.getUserAgent)();
        const wsEndpoint = await urlToWSEndpoint(progress, endpointURL, headersMap);
        const chromeTransport = await transport_1.WebSocketTransport.connect(progress, wsEndpoint, { headers: headersMap });
        const closeAndWait = async () => await chromeTransport.closeAndWait();
        return this._connectOverCDPImpl(progress, chromeTransport, closeAndWait, options, onClose);
    }
    async _connectOverCDPImpl(progress, transport, closeAndWait, options, onClose) {
        const artifactsDir = await progress.race(fs_1.default.promises.mkdtemp(ARTIFACTS_FOLDER));
        const doCleanup = async () => {
            await (0, fileUtils_1.removeFolders)([artifactsDir]);
            const cb = onClose;
            onClose = undefined; // Make sure to only call onClose once.
            await cb?.();
        };
        const doClose = async () => {
            await closeAndWait();
            await doCleanup();
        };
        try {
            const browserProcess = { close: doClose, kill: doClose };
            const persistent = { noDefaultViewport: true };
            const browserOptions = {
                slowMo: options.slowMo,
                name: 'chromium',
                isChromium: true,
                persistent,
                browserProcess,
                protocolLogger: helper_1.helper.debugProtocolLogger(),
                browserLogsCollector: new debugLogger_1.RecentLogsCollector(),
                artifactsDir,
                downloadsPath: options.downloadsPath || artifactsDir,
                tracesDir: options.tracesDir || artifactsDir,
                originalLaunchOptions: {},
            };
            (0, browserContext_1.validateBrowserContextOptions)(persistent, browserOptions);
            const browser = await progress.race(crBrowser_1.CRBrowser.connect(this.attribution.copilotbrowser, transport, browserOptions));
            if (!options.isLocal)
                browser._isCollocatedWithServer = false;
            browser.on(browser_1.Browser.Events.Disconnected, doCleanup);
            return browser;
        }
        catch (error) {
            await doClose().catch(() => { });
            throw error;
        }
    }
    async connectOverCDPTransport(progress, transport) {
        const closeAndWait = async () => transport.close();
        return this._connectOverCDPImpl(progress, transport, closeAndWait, { isLocal: true });
    }
    _createDevTools() {
        // TODO: this is totally wrong when using channels.
        const directory = registry_1.registry.findExecutable('chromium').directory;
        return directory ? new crDevTools_1.CRDevTools(path_1.default.join(directory, 'devtools-preferences.json')) : undefined;
    }
    async connectToTransport(transport, options, browserLogsCollector) {
        try {
            return await crBrowser_1.CRBrowser.connect(this.attribution.copilotbrowser, transport, options, this._devtools);
        }
        catch (e) {
            if (browserLogsCollector.recentLogs().some(log => log.includes('Failed to create a ProcessSingleton for your profile directory.'))) {
                throw new Error('Failed to create a ProcessSingleton for your profile directory. ' +
                    'This usually means that the profile is already in use by another instance of Chromium.');
            }
            throw e;
        }
    }
    doRewriteStartupLog(logs) {
        if (logs.includes('Missing X server'))
            logs = '\n' + (0, ascii_1.wrapInASCIIBox)(browserType_1.kNoXServerRunningError, 1);
        // These error messages are taken from Chromium source code as of July, 2020:
        // https://github.com/chromium/chromium/blob/70565f67e79f79e17663ad1337dc6e63ee207ce9/content/browser/zygote_host/zygote_host_impl_linux.cc
        if (!logs.includes('crbug.com/357670') && !logs.includes('No usable sandbox!') && !logs.includes('crbug.com/638180'))
            return logs;
        return [
            `Chromium sandboxing failed!`,
            `================================`,
            `To avoid the sandboxing issue, do either of the following:`,
            `  - (preferred): Configure your environment to support sandboxing`,
            `  - (alternative): Launch Chromium without sandbox using 'chromiumSandbox: false' option`,
            `================================`,
            ``,
        ].join('\n');
    }
    amendEnvironment(env) {
        return env;
    }
    attemptToGracefullyCloseBrowser(transport) {
        // Note that it's fine to reuse the transport, since our connection ignores kBrowserCloseMessageId.
        const message = { method: 'Browser.close', id: crConnection_1.kBrowserCloseMessageId, params: {} };
        transport.send(message);
    }
    async _launchWithSeleniumHub(progress, hubUrl, options) {
        if (!hubUrl.endsWith('/'))
            hubUrl = hubUrl + '/';
        const args = this._innerDefaultArgs(options);
        args.push('--remote-debugging-port=0');
        const isEdge = options.channel && options.channel.startsWith('msedge');
        let desiredCapabilities = {
            'browserName': isEdge ? 'MicrosoftEdge' : 'chrome',
            [isEdge ? 'ms:edgeOptions' : 'goog:chromeOptions']: { args }
        };
        if (process.env.SELENIUM_REMOTE_CAPABILITIES) {
            const remoteCapabilities = parseSeleniumRemoteParams({ name: 'capabilities', value: process.env.SELENIUM_REMOTE_CAPABILITIES }, progress);
            if (remoteCapabilities)
                desiredCapabilities = { ...desiredCapabilities, ...remoteCapabilities };
        }
        let headers = {};
        if (process.env.SELENIUM_REMOTE_HEADERS) {
            const remoteHeaders = parseSeleniumRemoteParams({ name: 'headers', value: process.env.SELENIUM_REMOTE_HEADERS }, progress);
            if (remoteHeaders)
                headers = remoteHeaders;
        }
        progress.log(`<selenium> connecting to ${hubUrl}`);
        const response = await (0, network_1.fetchData)(progress, {
            url: hubUrl + 'session',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                ...headers,
            },
            data: JSON.stringify({
                capabilities: { alwaysMatch: desiredCapabilities }
            }),
        }, seleniumErrorHandler);
        const value = JSON.parse(response).value;
        const sessionId = value.sessionId;
        progress.log(`<selenium> connected to sessionId=${sessionId}`);
        const disconnectFromSelenium = async () => {
            progress.log(`<selenium> disconnecting from sessionId=${sessionId}`);
            // Do not pass "progress" to disconnect even after the progress has aborted.
            await (0, network_1.fetchData)(undefined, {
                url: hubUrl + 'session/' + sessionId,
                method: 'DELETE',
                headers,
            }).catch(error => progress.log(`<error disconnecting from selenium>: ${error}`));
            progress.log(`<selenium> disconnected from sessionId=${sessionId}`);
            processLauncher_1.gracefullyCloseSet.delete(disconnectFromSelenium);
        };
        processLauncher_1.gracefullyCloseSet.add(disconnectFromSelenium);
        try {
            const capabilities = value.capabilities;
            let endpointURL;
            if (capabilities['se:cdp']) {
                // Selenium 4 - use built-in CDP websocket proxy.
                progress.log(`<selenium> using selenium v4`);
                const endpointURLString = addProtocol(capabilities['se:cdp']);
                endpointURL = new URL(endpointURLString);
                if (endpointURL.hostname === 'localhost' || endpointURL.hostname === '127.0.0.1')
                    endpointURL.hostname = new URL(hubUrl).hostname;
                progress.log(`<selenium> retrieved endpoint ${endpointURL.toString()} for sessionId=${sessionId}`);
            }
            else {
                // Selenium 3 - resolve target node IP to use instead of localhost ws url.
                progress.log(`<selenium> using selenium v3`);
                const maybeChromeOptions = capabilities['goog:chromeOptions'];
                const chromeOptions = maybeChromeOptions && typeof maybeChromeOptions === 'object' ? maybeChromeOptions : undefined;
                const debuggerAddress = chromeOptions && typeof chromeOptions.debuggerAddress === 'string' ? chromeOptions.debuggerAddress : undefined;
                const chromeOptionsURL = typeof maybeChromeOptions === 'string' ? maybeChromeOptions : undefined;
                // TODO(dgozman): figure out if we can make ChromeDriver to return 127.0.0.1 instead of localhost.
                const endpointURLString = addProtocol(debuggerAddress || chromeOptionsURL).replace('localhost', '127.0.0.1');
                progress.log(`<selenium> retrieved endpoint ${endpointURLString} for sessionId=${sessionId}`);
                endpointURL = new URL(endpointURLString);
                if (endpointURL.hostname === 'localhost' || endpointURL.hostname === '127.0.0.1') {
                    const sessionInfoUrl = new URL(hubUrl).origin + '/grid/api/testsession?session=' + sessionId;
                    try {
                        const sessionResponse = await (0, network_1.fetchData)(progress, {
                            url: sessionInfoUrl,
                            method: 'GET',
                            headers,
                        }, seleniumErrorHandler);
                        const proxyId = JSON.parse(sessionResponse).proxyId;
                        endpointURL.hostname = new URL(proxyId).hostname;
                        progress.log(`<selenium> resolved endpoint ip ${endpointURL.toString()} for sessionId=${sessionId}`);
                    }
                    catch (e) {
                        progress.log(`<selenium> unable to resolve endpoint ip for sessionId=${sessionId}, running in standalone?`);
                    }
                }
            }
            return await this._connectOverCDPInternal(progress, endpointURL.toString(), {
                ...options,
                headers: (0, utils_1.headersObjectToArray)(headers),
            }, disconnectFromSelenium);
        }
        catch (e) {
            await disconnectFromSelenium();
            throw e;
        }
    }
    async defaultArgs(options, isPersistent, userDataDir) {
        const chromeArguments = this._innerDefaultArgs(options);
        chromeArguments.push(`--user-data-dir=${userDataDir}`);
        if (options.cdpPort !== undefined)
            chromeArguments.push(`--remote-debugging-port=${options.cdpPort}`);
        else
            chromeArguments.push('--remote-debugging-pipe');
        if (isPersistent)
            chromeArguments.push('about:blank');
        else
            chromeArguments.push('--no-startup-window');
        return chromeArguments;
    }
    _innerDefaultArgs(options) {
        const { args = [] } = options;
        const userDataDirArg = args.find(arg => arg.startsWith('--user-data-dir'));
        if (userDataDirArg)
            throw this._createUserDataDirArgMisuseError('--user-data-dir');
        if (args.find(arg => arg.startsWith('--remote-debugging-pipe')))
            throw new Error('copilotbrowser manages remote debugging connection itself.');
        if (args.find(arg => !arg.startsWith('-')))
            throw new Error('Arguments can not specify page to be opened');
        const chromeArguments = [...(0, chromiumSwitches_1.chromiumSwitches)(options.assistantMode, options.channel)];
        if (os_1.default.platform() !== 'darwin' || !(0, utils_1.hasGpuMac)()) {
            // See https://issues.chromium.org/issues/40277080
            chromeArguments.push('--enable-unsafe-swiftshader');
        }
        if (options.headless) {
            chromeArguments.push('--headless');
            chromeArguments.push('--hide-scrollbars', '--mute-audio', '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4');
        }
        if (options.chromiumSandbox !== true)
            chromeArguments.push('--no-sandbox');
        const proxy = options.proxyOverride || options.proxy;
        if (proxy) {
            const proxyURL = new URL(proxy.server);
            const isSocks = proxyURL.protocol === 'socks5:';
            // https://www.chromium.org/developers/design-documents/network-settings
            if (isSocks && !options.socksProxyPort) {
                // https://www.chromium.org/developers/design-documents/network-stack/socks-proxy
                chromeArguments.push(`--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE ${proxyURL.hostname}"`);
            }
            chromeArguments.push(`--proxy-server=${proxy.server}`);
            const proxyBypassRules = [];
            // https://source.chromium.org/chromium/chromium/src/+/master:net/docs/proxy.md;l=548;drc=71698e610121078e0d1a811054dcf9fd89b49578
            if (options.socksProxyPort)
                proxyBypassRules.push('<-loopback>');
            if (proxy.bypass)
                proxyBypassRules.push(...proxy.bypass.split(',').map(t => t.trim()).map(t => t.startsWith('.') ? '*' + t : t));
            if (!process.env.copilotbrowser_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK && !proxyBypassRules.includes('<-loopback>'))
                proxyBypassRules.push('<-loopback>');
            if (proxyBypassRules.length > 0)
                chromeArguments.push(`--proxy-bypass-list=${proxyBypassRules.join(';')}`);
        }
        chromeArguments.push(...args);
        return chromeArguments;
    }
    async waitForReadyState(options, browserLogsCollector) {
        return waitForReadyState(options, browserLogsCollector);
    }
    getExecutableName(options) {
        if (options.channel && registry_1.registry.isChromiumAlias(options.channel))
            return 'chromium';
        if (options.channel === 'chromium-tip-of-tree')
            return options.headless ? 'chromium-tip-of-tree-headless-shell' : 'chromium-tip-of-tree';
        if (options.channel)
            return options.channel;
        return options.headless ? 'chromium-headless-shell' : 'chromium';
    }
}
exports.Chromium = Chromium;
async function waitForReadyState(options, browserLogsCollector) {
    if (options.cdpPort === undefined && !options.args?.some(a => a.startsWith('--remote-debugging-port')))
        return {};
    const result = new manualPromise_1.ManualPromise();
    browserLogsCollector.onMessage(message => {
        if (message.includes('Failed to create a ProcessSingleton for your profile directory.')) {
            result.reject(new Error('Failed to create a ProcessSingleton for your profile directory. ' +
                'This usually means that the profile is already in use by another instance of Chromium.'));
        }
        const match = message.match(/DevTools listening on (.*)/);
        if (match)
            result.resolve({ wsEndpoint: match[1] });
    });
    return result;
}
async function urlToWSEndpoint(progress, endpointURL, headers) {
    if (endpointURL.startsWith('ws'))
        return endpointURL;
    progress.log(`<ws preparing> retrieving websocket url from ${endpointURL}`);
    const url = new URL(endpointURL);
    if (!url.pathname.endsWith('/'))
        url.pathname += '/';
    url.pathname += 'json/version/';
    const httpURL = url.toString();
    const json = await (0, network_1.fetchData)(progress, {
        url: httpURL,
        headers,
    }, async (_, resp) => new Error(`Unexpected status ${resp.statusCode} when connecting to ${httpURL}.\n` +
        `This does not look like a DevTools server, try connecting via ws://.`));
    return JSON.parse(json).webSocketDebuggerUrl;
}
async function seleniumErrorHandler(params, response) {
    const body = await streamToString(response);
    let message = body;
    try {
        const json = JSON.parse(body);
        message = json.value.localizedMessage || json.value.message;
    }
    catch (e) {
    }
    return new Error(`Error connecting to Selenium at ${params.url}: ${message}`);
}
function addProtocol(url) {
    if (!['ws://', 'wss://', 'http://', 'https://'].some(protocol => url.startsWith(protocol)))
        return 'http://' + url;
    return url;
}
function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}
function parseSeleniumRemoteParams(env, progress) {
    try {
        const parsed = JSON.parse(env.value);
        progress.log(`<selenium> using additional ${env.name} "${env.value}"`);
        return parsed;
    }
    catch (e) {
        progress.log(`<selenium> ignoring additional ${env.name} "${env.value}": ${e}`);
    }
}
