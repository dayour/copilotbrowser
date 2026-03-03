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
exports.BrowserType = void 0;
const browser_1 = require("./browser");
const browserContext_1 = require("./browserContext");
const channelOwner_1 = require("./channelOwner");
const clientHelper_1 = require("./clientHelper");
const events_1 = require("./events");
const assert_1 = require("../utils/isomorphic/assert");
const headers_1 = require("../utils/isomorphic/headers");
const time_1 = require("../utils/isomorphic/time");
const timeoutRunner_1 = require("../utils/isomorphic/timeoutRunner");
const webSocket_1 = require("./webSocket");
const timeoutSettings_1 = require("./timeoutSettings");
class BrowserType extends channelOwner_1.ChannelOwner {
    _serverLauncher;
    _contexts = new Set();
    _copilotbrowser;
    static from(browserType) {
        return browserType._object;
    }
    executablePath() {
        if (!this._initializer.executablePath)
            throw new Error('Browser is not supported on current platform');
        return this._initializer.executablePath;
    }
    name() {
        return this._initializer.name;
    }
    async launch(options = {}) {
        (0, assert_1.assert)(!options.userDataDir, 'userDataDir option is not supported in `browserType.launch`. Use `browserType.launchPersistentContext` instead');
        (0, assert_1.assert)(!options.port, 'Cannot specify a port without launching as a server.');
        const logger = options.logger || this._copilotbrowser._defaultLaunchOptions?.logger;
        options = { ...this._copilotbrowser._defaultLaunchOptions, ...options };
        const launchOptions = {
            ...options,
            ignoreDefaultArgs: Array.isArray(options.ignoreDefaultArgs) ? options.ignoreDefaultArgs : undefined,
            ignoreAllDefaultArgs: !!options.ignoreDefaultArgs && !Array.isArray(options.ignoreDefaultArgs),
            env: options.env ? (0, clientHelper_1.envObjectToArray)(options.env) : undefined,
            timeout: new timeoutSettings_1.TimeoutSettings(this._platform).launchTimeout(options),
        };
        return await this._wrapApiCall(async () => {
            const browser = browser_1.Browser.from((await this._channel.launch(launchOptions)).browser);
            browser._connectToBrowserType(this, options, logger);
            return browser;
        });
    }
    async launchServer(options = {}) {
        if (!this._serverLauncher)
            throw new Error('Launching server is not supported');
        options = { ...this._copilotbrowser._defaultLaunchOptions, ...options };
        return await this._serverLauncher.launchServer(options);
    }
    async launchPersistentContext(userDataDir, options = {}) {
        (0, assert_1.assert)(!options.port, 'Cannot specify a port without launching as a server.');
        options = this._copilotbrowser.selectors._withSelectorOptions({
            ...this._copilotbrowser._defaultLaunchOptions,
            ...options,
        });
        await this._instrumentation.runBeforeCreateBrowserContext(options);
        const logger = options.logger || this._copilotbrowser._defaultLaunchOptions?.logger;
        const contextParams = await (0, browserContext_1.prepareBrowserContextParams)(this._platform, options);
        const persistentParams = {
            ...contextParams,
            ignoreDefaultArgs: Array.isArray(options.ignoreDefaultArgs) ? options.ignoreDefaultArgs : undefined,
            ignoreAllDefaultArgs: !!options.ignoreDefaultArgs && !Array.isArray(options.ignoreDefaultArgs),
            env: options.env ? (0, clientHelper_1.envObjectToArray)(options.env) : undefined,
            channel: options.channel,
            userDataDir: (this._platform.path().isAbsolute(userDataDir) || !userDataDir) ? userDataDir : this._platform.path().resolve(userDataDir),
            timeout: new timeoutSettings_1.TimeoutSettings(this._platform).launchTimeout(options),
        };
        const context = await this._wrapApiCall(async () => {
            const result = await this._channel.launchPersistentContext(persistentParams);
            const browser = browser_1.Browser.from(result.browser);
            browser._connectToBrowserType(this, options, logger);
            const context = browserContext_1.BrowserContext.from(result.context);
            await context._initializeHarFromOptions(options.recordHar);
            return context;
        });
        await this._instrumentation.runAfterCreateBrowserContext(context);
        return context;
    }
    async connect(optionsOrWsEndpoint, options) {
        if (typeof optionsOrWsEndpoint === 'string')
            return await this._connect({ ...options, wsEndpoint: optionsOrWsEndpoint });
        (0, assert_1.assert)(optionsOrWsEndpoint.wsEndpoint, 'options.wsEndpoint is required');
        return await this._connect(optionsOrWsEndpoint);
    }
    async _connect(params) {
        const logger = params.logger;
        return await this._wrapApiCall(async () => {
            const deadline = params.timeout ? (0, time_1.monotonicTime)() + params.timeout : 0;
            const headers = { 'x-copilotbrowser-browser': this.name(), ...params.headers };
            const connectParams = {
                wsEndpoint: params.wsEndpoint,
                headers,
                exposeNetwork: params.exposeNetwork ?? params._exposeNetwork,
                slowMo: params.slowMo,
                timeout: params.timeout || 0,
            };
            if (params.__testHookRedirectPortForwarding)
                connectParams.socksProxyRedirectPortForTest = params.__testHookRedirectPortForwarding;
            const connection = await (0, webSocket_1.connectOverWebSocket)(this._connection, connectParams);
            let browser;
            connection.on('close', () => {
                // Emulate all pages, contexts and the browser closing upon disconnect.
                for (const context of browser?.contexts() || []) {
                    for (const page of context.pages())
                        page._onClose();
                    context._onClose();
                }
                setTimeout(() => browser?._didClose(), 0);
            });
            const result = await (0, timeoutRunner_1.raceAgainstDeadline)(async () => {
                // For tests.
                if (params.__testHookBeforeCreateBrowser)
                    await params.__testHookBeforeCreateBrowser();
                const copilotbrowser = await connection.initializecopilotbrowser();
                if (!copilotbrowser._initializer.preLaunchedBrowser) {
                    connection.close();
                    throw new Error('Malformed endpoint. Did you use BrowserType.launchServer method?');
                }
                copilotbrowser.selectors = this._copilotbrowser.selectors;
                browser = browser_1.Browser.from(copilotbrowser._initializer.preLaunchedBrowser);
                browser._connectToBrowserType(this, {}, logger);
                browser._shouldCloseConnectionOnClose = true;
                browser.on(events_1.Events.Browser.Disconnected, () => connection.close());
                return browser;
            }, deadline);
            if (!result.timedOut) {
                return result.result;
            }
            else {
                connection.close();
                throw new Error(`Timeout ${params.timeout}ms exceeded`);
            }
        });
    }
    async connectOverCDP(endpointURLOrOptions, options) {
        if (typeof endpointURLOrOptions === 'string')
            return await this._connectOverCDP(endpointURLOrOptions, options);
        const endpointURL = 'endpointURL' in endpointURLOrOptions ? endpointURLOrOptions.endpointURL : endpointURLOrOptions.wsEndpoint;
        (0, assert_1.assert)(endpointURL, 'Cannot connect over CDP without wsEndpoint.');
        return await this.connectOverCDP(endpointURL, endpointURLOrOptions);
    }
    async _connectOverCDP(endpointURL, params = {}) {
        if (this.name() !== 'chromium')
            throw new Error('Connecting over CDP is only supported in Chromium.');
        const headers = params.headers ? (0, headers_1.headersObjectToArray)(params.headers) : undefined;
        const result = await this._channel.connectOverCDP({
            endpointURL,
            headers,
            slowMo: params.slowMo,
            timeout: new timeoutSettings_1.TimeoutSettings(this._platform).timeout(params),
            isLocal: params.isLocal,
        });
        const browser = browser_1.Browser.from(result.browser);
        browser._connectToBrowserType(this, {}, params.logger);
        if (result.defaultContext)
            await this._instrumentation.runAfterCreateBrowserContext(browserContext_1.BrowserContext.from(result.defaultContext));
        return browser;
    }
    async _connectOverCDPTransport(transport) {
        if (this.name() !== 'chromium')
            throw new Error('Connecting over CDP is only supported in Chromium.');
        const result = await this._channel.connectOverCDPTransport({ transport });
        const browser = browser_1.Browser.from(result.browser);
        browser._connectToBrowserType(this, {}, undefined);
        if (result.defaultContext)
            await this._instrumentation.runAfterCreateBrowserContext(browserContext_1.BrowserContext.from(result.defaultContext));
        return browser;
    }
}
exports.BrowserType = BrowserType;
