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
exports.Browser = void 0;
const artifact_1 = require("./artifact");
const browserContext_1 = require("./browserContext");
const cdpSession_1 = require("./cdpSession");
const channelOwner_1 = require("./channelOwner");
const errors_1 = require("./errors");
const events_1 = require("./events");
const fileUtils_1 = require("./fileUtils");
class Browser extends channelOwner_1.ChannelOwner {
    _contexts = new Set();
    _isConnected = true;
    _closedPromise;
    _shouldCloseConnectionOnClose = false;
    _browserType;
    _options = {};
    _name;
    _path;
    _closeReason;
    static from(browser) {
        return browser._object;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._name = initializer.name;
        this._channel.on('context', ({ context }) => this._didCreateContext(browserContext_1.BrowserContext.from(context)));
        this._channel.on('close', () => this._didClose());
        this._closedPromise = new Promise(f => this.once(events_1.Events.Browser.Disconnected, f));
    }
    browserType() {
        return this._browserType;
    }
    async newContext(options = {}) {
        return await this._innerNewContext(options, false);
    }
    async _newContextForReuse(options = {}) {
        return await this._innerNewContext(options, true);
    }
    async _disconnectFromReusedContext(reason) {
        const context = [...this._contexts].find(context => context._forReuse);
        if (!context)
            return;
        await this._instrumentation.runBeforeCloseBrowserContext(context);
        for (const page of context.pages())
            page._onClose();
        context._onClose();
        await this._channel.disconnectFromReusedContext({ reason });
    }
    async _innerNewContext(userOptions = {}, forReuse) {
        const options = this._browserType._copilotbrowser.selectors._withSelectorOptions(userOptions);
        await this._instrumentation.runBeforeCreateBrowserContext(options);
        const contextOptions = await (0, browserContext_1.prepareBrowserContextParams)(this._platform, options);
        const response = forReuse ? await this._channel.newContextForReuse(contextOptions) : await this._channel.newContext(contextOptions);
        const context = browserContext_1.BrowserContext.from(response.context);
        if (forReuse)
            context._forReuse = true;
        if (options.logger)
            context._logger = options.logger;
        await context._initializeHarFromOptions(options.recordHar);
        await this._instrumentation.runAfterCreateBrowserContext(context);
        return context;
    }
    _connectToBrowserType(browserType, browserOptions, logger) {
        // Note: when using connect(), `browserType` is different from `this._parent`.
        // This is why browser type is not wired up in the constructor,
        // and instead this separate method is called later on.
        this._browserType = browserType;
        this._options = browserOptions;
        this._logger = logger;
        for (const context of this._contexts)
            this._setupBrowserContext(context);
    }
    _didCreateContext(context) {
        context._browser = this;
        this._contexts.add(context);
        // Note: when connecting to a browser, initial contexts arrive before `browserType` is set,
        // and will be configured later in `_connectToBrowserType`.
        if (this._browserType)
            this._setupBrowserContext(context);
    }
    _setupBrowserContext(context) {
        context._logger = this._logger;
        context.tracing._tracesDir = this._options.tracesDir;
        this._browserType._contexts.add(context);
        this._browserType._copilotbrowser.selectors._contextsForSelectors.add(context);
        context.setDefaultTimeout(this._browserType._copilotbrowser._defaultContextTimeout);
        context.setDefaultNavigationTimeout(this._browserType._copilotbrowser._defaultContextNavigationTimeout);
    }
    contexts() {
        return [...this._contexts];
    }
    version() {
        return this._initializer.version;
    }
    async newPage(options = {}) {
        return await this._wrapApiCall(async () => {
            const context = await this.newContext(options);
            const page = await context.newPage();
            page._ownedContext = context;
            context._ownerPage = page;
            return page;
        }, { title: 'Create page' });
    }
    isConnected() {
        return this._isConnected;
    }
    async newBrowserCDPSession() {
        return cdpSession_1.CDPSession.from((await this._channel.newBrowserCDPSession()).session);
    }
    async startTracing(page, options = {}) {
        this._path = options.path;
        await this._channel.startTracing({ ...options, page: page ? page._channel : undefined });
    }
    async stopTracing() {
        const artifact = artifact_1.Artifact.from((await this._channel.stopTracing()).artifact);
        const buffer = await artifact.readIntoBuffer();
        await artifact.delete();
        if (this._path) {
            await (0, fileUtils_1.mkdirIfNeeded)(this._platform, this._path);
            await this._platform.fs().promises.writeFile(this._path, buffer);
            this._path = undefined;
        }
        return buffer;
    }
    async [Symbol.asyncDispose]() {
        await this.close();
    }
    async close(options = {}) {
        this._closeReason = options.reason;
        try {
            if (this._shouldCloseConnectionOnClose)
                this._connection.close();
            else
                await this._channel.close(options);
            await this._closedPromise;
        }
        catch (e) {
            if ((0, errors_1.isTargetClosedError)(e))
                return;
            throw e;
        }
    }
    _didClose() {
        this._isConnected = false;
        this.emit(events_1.Events.Browser.Disconnected, this);
    }
}
exports.Browser = Browser;
