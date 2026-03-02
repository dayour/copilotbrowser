"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
exports.BrowserDispatcher = void 0;
const browser_1 = require("../browser");
const browserContextDispatcher_1 = require("./browserContextDispatcher");
const cdpSessionDispatcher_1 = require("./cdpSessionDispatcher");
const dispatcher_1 = require("./dispatcher");
const browserContext_1 = require("../browserContext");
const artifactDispatcher_1 = require("./artifactDispatcher");
class BrowserDispatcher extends dispatcher_1.Dispatcher {
    _type_Browser = true;
    _options;
    _isolatedContexts = new Set();
    constructor(scope, browser, options = {}) {
        super(scope, browser, 'Browser', { version: browser.version(), name: browser.options.name });
        this._options = options;
        if (!options.isolateContexts) {
            this.addObjectListener(browser_1.Browser.Events.Context, (context) => this._dispatchEvent('context', { context: browserContextDispatcher_1.BrowserContextDispatcher.from(this, context) }));
            this.addObjectListener(browser_1.Browser.Events.Disconnected, () => this._didClose());
            if (browser._defaultContext)
                this._dispatchEvent('context', { context: browserContextDispatcher_1.BrowserContextDispatcher.from(this, browser._defaultContext) });
            for (const context of browser.contexts())
                this._dispatchEvent('context', { context: browserContextDispatcher_1.BrowserContextDispatcher.from(this, context) });
        }
    }
    _didClose() {
        this._dispatchEvent('close');
        this._dispose();
    }
    async newContext(params, progress) {
        if (params.recordVideo && this._object.attribution.copilotbrowser.options.isServer)
            params.recordVideo.dir = this._object.options.artifactsDir;
        if (!this._options.isolateContexts) {
            const context = await this._object.newContext(progress, params);
            const contextDispatcher = browserContextDispatcher_1.BrowserContextDispatcher.from(this, context);
            return { context: contextDispatcher };
        }
        const context = await this._object.newContext(progress, params);
        this._isolatedContexts.add(context);
        context.on(browserContext_1.BrowserContext.Events.Close, () => this._isolatedContexts.delete(context));
        const contextDispatcher = browserContextDispatcher_1.BrowserContextDispatcher.from(this, context);
        this._dispatchEvent('context', { context: contextDispatcher });
        return { context: contextDispatcher };
    }
    async newContextForReuse(params, progress) {
        const context = await this._object.newContextForReuse(progress, params);
        const contextDispatcher = browserContextDispatcher_1.BrowserContextDispatcher.from(this, context);
        this._dispatchEvent('context', { context: contextDispatcher });
        return { context: contextDispatcher };
    }
    async disconnectFromReusedContext(params, progress) {
        const context = this._object.contextForReuse();
        const contextDispatcher = context ? this.connection.existingDispatcher(context) : undefined;
        if (contextDispatcher) {
            await contextDispatcher.stopPendingOperations(new Error(params.reason));
            contextDispatcher._dispose();
        }
    }
    async close(params, progress) {
        if (this._options.ignoreStopAndKill)
            return;
        progress.metadata.potentiallyClosesScope = true;
        await this._object.close(params);
    }
    async killForTests(params, progress) {
        if (this._options.ignoreStopAndKill)
            return;
        progress.metadata.potentiallyClosesScope = true;
        await this._object.killForTests();
    }
    async defaultUserAgentForTest() {
        return { userAgent: this._object.userAgent() };
    }
    async newBrowserCDPSession(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        if (!this._object.options.isChromium)
            throw new Error(`CDP session is only available in Chromium`);
        const crBrowser = this._object;
        return { session: new cdpSessionDispatcher_1.CDPSessionDispatcher(this, await crBrowser.newBrowserCDPSession()) };
    }
    async startTracing(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        if (!this._object.options.isChromium)
            throw new Error(`Tracing is only available in Chromium`);
        const crBrowser = this._object;
        await crBrowser.startTracing(params.page ? params.page._object : undefined, params);
    }
    async stopTracing(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        if (!this._object.options.isChromium)
            throw new Error(`Tracing is only available in Chromium`);
        const crBrowser = this._object;
        return { artifact: artifactDispatcher_1.ArtifactDispatcher.from(this, await crBrowser.stopTracing()) };
    }
    async cleanupContexts() {
        await Promise.all(Array.from(this._isolatedContexts).map(context => context.close({ reason: 'Global context cleanup (connection terminated)' })));
    }
}
exports.BrowserDispatcher = BrowserDispatcher;
