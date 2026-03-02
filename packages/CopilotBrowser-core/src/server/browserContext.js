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
exports.BrowserContext = void 0;
exports.validateBrowserContextOptions = validateBrowserContextOptions;
exports.validateVideoSize = validateVideoSize;
exports.verifyGeolocation = verifyGeolocation;
exports.verifyClientCertificates = verifyClientCertificates;
exports.normalizeProxySettings = normalizeProxySettings;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("./utils/crypto");
const debug_1 = require("./utils/debug");
const clock_1 = require("./clock");
const debugger_1 = require("./debugger");
const dialog_1 = require("./dialog");
const fetch_1 = require("./fetch");
const fileUtils_1 = require("./utils/fileUtils");
const stackTrace_1 = require("../utils/isomorphic/stackTrace");
const harRecorder_1 = require("./har/harRecorder");
const helper_1 = require("./helper");
const instrumentation_1 = require("./instrumentation");
const network = __importStar(require("./network"));
const page_1 = require("./page");
const page_2 = require("./page");
const recorderApp_1 = require("./recorder/recorderApp");
const selectors_1 = require("./selectors");
const tracing_1 = require("./trace/recorder/tracing");
const devtoolsController_1 = require("./devtoolsController");
const rawStorageSource = __importStar(require("../generated/storageScriptSource"));
const BrowserContextEvent = {
    Console: 'console',
    Close: 'close',
    Page: 'page',
    // Can't use just 'error' due to node.js special treatment of error events.
    // @see https://nodejs.org/api/events.html#events_error_events
    PageError: 'pageerror',
    Request: 'request',
    Response: 'response',
    RequestFailed: 'requestfailed',
    RequestFinished: 'requestfinished',
    RequestAborted: 'requestaborted',
    RequestFulfilled: 'requestfulfilled',
    RequestContinued: 'requestcontinued',
    BeforeClose: 'beforeclose',
    RecorderEvent: 'recorderevent',
    PageClosed: 'pageclosed',
    InternalFrameNavigatedToNewDocument: 'internalframenavigatedtonewdocument',
};
class BrowserContext extends instrumentation_1.SdkObject {
    static Events = BrowserContextEvent;
    _pageBindings = new Map();
    _options;
    requestInterceptors = [];
    _isPersistentContext;
    _closedStatus = 'open';
    _closePromise;
    _closePromiseFulfill;
    _permissions = new Map();
    _downloads = new Set();
    _browser;
    _browserContextId;
    _selectors;
    _origins = new Set();
    _harRecorders = new Map();
    tracing;
    fetchRequest;
    _customCloseHandler;
    _tempDirs = [];
    _creatingStorageStatePage = false;
    bindingsInitScript;
    initScripts = [];
    _routesInFlight = new Set();
    _debugger;
    _closeReason;
    clock;
    _clientCertificatesProxy;
    _copilotbrowserBindingExposed;
    dialogManager;
    _consoleApiExposed = false;
    _devtools;
    constructor(browser, options, browserContextId) {
        super(browser, 'browser-context');
        this.attribution.context = this;
        this._browser = browser;
        this._options = options;
        this._browserContextId = browserContextId;
        this._isPersistentContext = !browserContextId;
        this._closePromise = new Promise(fulfill => this._closePromiseFulfill = fulfill);
        this._selectors = new selectors_1.Selectors(options.selectorEngines || [], options.testIdAttributeName);
        this._devtools = new devtoolsController_1.DevToolsController(this);
        this.fetchRequest = new fetch_1.BrowserContextAPIRequestContext(this);
        this.tracing = new tracing_1.Tracing(this, browser.options.tracesDir);
        this.clock = new clock_1.Clock(this);
        this.dialogManager = new dialog_1.DialogManager(this.instrumentation);
    }
    isPersistentContext() {
        return this._isPersistentContext;
    }
    selectors() {
        return this._selectors;
    }
    async _initialize() {
        if (this.attribution.copilotbrowser.options.isInternalcopilotbrowser)
            return;
        // Debugger will pause execution upon page.pause in headed mode.
        this._debugger = new debugger_1.Debugger(this);
        // When PWDEBUG=1, show inspector for each context.
        if ((0, debug_1.debugMode)() === 'inspector')
            await recorderApp_1.RecorderApp.show(this, { pauseOnNextStatement: true });
        // When paused, show inspector.
        if (this._debugger.isPaused())
            recorderApp_1.RecorderApp.showInspectorNoReply(this);
        this._debugger.on(debugger_1.Debugger.Events.PausedStateChanged, () => {
            if (this._debugger.isPaused())
                recorderApp_1.RecorderApp.showInspectorNoReply(this);
        });
        if ((0, debug_1.debugMode)() === 'console')
            await this.exposeConsoleApi();
        if (this._options.serviceWorkers === 'block')
            await this.addInitScript(undefined, `\nif (navigator.serviceWorker) navigator.serviceWorker.register = async () => { console.warn('Service Worker registration blocked by copilotbrowser'); };\n`);
        if (this._options.permissions)
            await this.grantPermissions(this._options.permissions);
    }
    debugger() {
        return this._debugger;
    }
    async exposeConsoleApi() {
        if (this._consoleApiExposed)
            return;
        this._consoleApiExposed = true;
        await this.extendInjectedScript(`
      function installConsoleApi(injectedScript) { injectedScript.consoleApi.install(); }
      module.exports = { default: () => installConsoleApi };
    `);
    }
    async _ensureVideosPath() {
        if (this._options.recordVideo)
            await (0, fileUtils_1.mkdirIfNeeded)(path_1.default.join(this._options.recordVideo.dir, 'dummy'));
    }
    canResetForReuse() {
        if (this._closedStatus !== 'open')
            return false;
        return true;
    }
    static reusableContextHash(params) {
        const paramsCopy = { ...params };
        if (paramsCopy.selectorEngines?.length === 0)
            delete paramsCopy.selectorEngines;
        for (const k of Object.keys(paramsCopy)) {
            const key = k;
            if (paramsCopy[key] === defaultNewContextParamValues[key])
                delete paramsCopy[key];
        }
        for (const key of paramsThatAllowContextReuse)
            delete paramsCopy[key];
        return JSON.stringify(paramsCopy);
    }
    async resetForReuse(progress, params) {
        await this.tracing.resetForReuse(progress);
        if (params) {
            for (const key of paramsThatAllowContextReuse)
                this._options[key] = params[key];
            if (params.testIdAttributeName)
                this.selectors().setTestIdAttributeName(params.testIdAttributeName);
        }
        // Close extra pages early.
        let page = this.pages()[0];
        const otherPages = this.possiblyUninitializedPages().filter(p => p !== page);
        for (const p of otherPages)
            await p.close();
        if (page && page.hasCrashed()) {
            await page.close();
            page = undefined;
        }
        // Navigate to about:blank first to ensure no page scripts are running after this point.
        await page?.mainFrame().gotoImpl(progress, 'about:blank', {});
        // Note: we only need to reset properties from the "paramsThatAllowContextReuse" list.
        // All other properties force a new context.
        await this.clock.uninstall(progress);
        await progress.race(this.setUserAgent(this._options.userAgent));
        await progress.race(this.doUpdateDefaultEmulatedMedia());
        await progress.race(this.doUpdateDefaultViewport());
        await this.setStorageState(progress, this._options.storageState, 'resetForReuse');
        await page?.resetForReuse(progress);
    }
    _browserClosed() {
        for (const page of this.pages())
            page._didClose();
        this._didCloseInternal();
    }
    _didCloseInternal() {
        if (this._closedStatus === 'closed') {
            // We can come here twice if we close browser context and browser
            // at the same time.
            return;
        }
        this._clientCertificatesProxy?.close().catch(() => { });
        this.tracing.abort();
        if (this._isPersistentContext)
            this.onClosePersistent();
        this._closePromiseFulfill(new Error('Context closed'));
        this.emit(BrowserContext.Events.Close);
    }
    pages() {
        return this.possiblyUninitializedPages().filter(page => page.initializedOrUndefined());
    }
    async cookies(urls = []) {
        if (urls && !Array.isArray(urls))
            urls = [urls];
        return await this.doGetCookies(urls);
    }
    async clearCookies(options) {
        const currentCookies = await this.cookies();
        await this.doClearCookies();
        const matches = (cookie, prop, value) => {
            if (!value)
                return true;
            if (value instanceof RegExp) {
                value.lastIndex = 0;
                return value.test(cookie[prop]);
            }
            return cookie[prop] === value;
        };
        const cookiesToReadd = currentCookies.filter(cookie => {
            return !matches(cookie, 'name', options.name)
                || !matches(cookie, 'domain', options.domain)
                || !matches(cookie, 'path', options.path);
        });
        await this.addCookies(cookiesToReadd);
    }
    setHTTPCredentials(httpCredentials) {
        return this.doSetHTTPCredentials(httpCredentials);
    }
    getBindingClient(name) {
        return this._pageBindings.get(name)?.forClient;
    }
    async exposecopilotbrowserBindingIfNeeded() {
        this._copilotbrowserBindingExposed ??= (async () => {
            await this.doExposecopilotbrowserBinding();
            this.bindingsInitScript = page_2.PageBinding.createInitScript();
            this.initScripts.push(this.bindingsInitScript);
            await this.doAddInitScript(this.bindingsInitScript);
            await this.safeNonStallingEvaluateInAllFrames(this.bindingsInitScript.source, 'main');
        })();
        return await this._copilotbrowserBindingExposed;
    }
    needscopilotbrowserBinding() {
        return this._copilotbrowserBindingExposed !== undefined;
    }
    async exposeBinding(progress, name, needsHandle, copilotbrowserBinding, forClient) {
        if (this._pageBindings.has(name))
            throw new Error(`Function "${name}" has been already registered`);
        for (const page of this.pages()) {
            if (page.getBinding(name))
                throw new Error(`Function "${name}" has been already registered in one of the pages`);
        }
        await progress.race(this.exposecopilotbrowserBindingIfNeeded());
        const binding = new page_2.PageBinding(name, copilotbrowserBinding, needsHandle);
        binding.forClient = forClient;
        this._pageBindings.set(name, binding);
        try {
            await progress.race(this.doAddInitScript(binding.initScript));
            await progress.race(this.safeNonStallingEvaluateInAllFrames(binding.initScript.source, 'main'));
            return binding;
        }
        catch (error) {
            this._pageBindings.delete(name);
            throw error;
        }
    }
    async removeExposedBindings(bindings) {
        bindings = bindings.filter(binding => this._pageBindings.get(binding.name) === binding);
        for (const binding of bindings)
            this._pageBindings.delete(binding.name);
        await this.doRemoveInitScripts(bindings.map(binding => binding.initScript));
        const cleanup = bindings.map(binding => `{ ${binding.cleanupScript} };\n`).join('');
        await this.safeNonStallingEvaluateInAllFrames(cleanup, 'main');
    }
    async grantPermissions(permissions, origin) {
        let resolvedOrigin = '*';
        if (origin) {
            const url = new URL(origin);
            resolvedOrigin = url.origin;
        }
        const existing = new Set(this._permissions.get(resolvedOrigin) || []);
        permissions.forEach(p => existing.add(p));
        const list = [...existing.values()];
        this._permissions.set(resolvedOrigin, list);
        await this.doGrantPermissions(resolvedOrigin, list);
    }
    async clearPermissions() {
        this._permissions.clear();
        await this.doClearPermissions();
    }
    async setExtraHTTPHeaders(progress, headers) {
        const oldHeaders = this._options.extraHTTPHeaders;
        this._options.extraHTTPHeaders = headers;
        try {
            await progress.race(this.doUpdateExtraHTTPHeaders());
        }
        catch (error) {
            this._options.extraHTTPHeaders = oldHeaders;
            // Note: no await, headers will be reset in the background as soon as possible.
            this.doUpdateExtraHTTPHeaders().catch(() => { });
            throw error;
        }
    }
    async setOffline(progress, offline) {
        const oldOffline = this._options.offline;
        this._options.offline = offline;
        try {
            await progress.race(this.doUpdateOffline());
        }
        catch (error) {
            this._options.offline = oldOffline;
            // Note: no await, offline will be reset in the background as soon as possible.
            this.doUpdateOffline().catch(() => { });
            throw error;
        }
    }
    async _loadDefaultContextAsIs(progress) {
        if (!this.possiblyUninitializedPages().length) {
            const waitForEvent = helper_1.helper.waitForEvent(progress, this, BrowserContext.Events.Page);
            // Race against BrowserContext.close
            await Promise.race([waitForEvent.promise, this._closePromise]);
        }
        const page = this.possiblyUninitializedPages()[0];
        if (!page)
            return;
        const pageOrError = await progress.race(page.waitForInitializedOrError());
        if (pageOrError instanceof Error)
            throw pageOrError;
        await page.mainFrame().waitForLoadState(progress, 'load');
        return page;
    }
    async _loadDefaultContext(progress) {
        const defaultPage = await this._loadDefaultContextAsIs(progress);
        if (!defaultPage)
            return;
        const browserName = this._browser.options.name;
        if ((this._options.isMobile && browserName === 'chromium') || (this._options.locale && browserName === 'webkit')) {
            // Workaround for:
            // - chromium fails to change isMobile for existing page;
            // - webkit fails to change locale for existing page.
            await this.newPage(progress);
            await defaultPage.close();
        }
    }
    _authenticateProxyViaHeader() {
        const proxy = this._options.proxy || this._browser.options.proxy || { username: undefined, password: undefined };
        const { username, password } = proxy;
        if (username) {
            this._options.httpCredentials = { username, password: password };
            const token = Buffer.from(`${username}:${password}`).toString('base64');
            this._options.extraHTTPHeaders = network.mergeHeaders([
                this._options.extraHTTPHeaders,
                network.singleHeader('Proxy-Authorization', `Basic ${token}`),
            ]);
        }
    }
    _authenticateProxyViaCredentials() {
        const proxy = this._options.proxy || this._browser.options.proxy;
        if (!proxy)
            return;
        const { username, password } = proxy;
        if (username)
            this._options.httpCredentials = { username, password: password || '' };
    }
    async addInitScript(progress, source) {
        const initScript = new page_1.InitScript(source);
        this.initScripts.push(initScript);
        try {
            const promise = this.doAddInitScript(initScript);
            if (progress)
                await progress.race(promise);
            else
                await promise;
            return initScript;
        }
        catch (error) {
            // Note: no await, init script will be removed in the background as soon as possible.
            this.removeInitScripts([initScript]).catch(() => { });
            throw error;
        }
    }
    async removeInitScripts(initScripts) {
        const set = new Set(initScripts);
        this.initScripts = this.initScripts.filter(script => !set.has(script));
        await this.doRemoveInitScripts(initScripts);
    }
    async addRequestInterceptor(progress, handler) {
        // Note: progress is intentionally ignored, because this operation is not cancellable and should not block in the browser anyway.
        this.requestInterceptors.push(handler);
        await this.doUpdateRequestInterception();
    }
    async removeRequestInterceptor(handler) {
        const index = this.requestInterceptors.indexOf(handler);
        if (index === -1)
            return;
        this.requestInterceptors.splice(index, 1);
        await this.notifyRoutesInFlightAboutRemovedHandler(handler);
        await this.doUpdateRequestInterception();
    }
    async devtoolsStart() {
        const size = validateVideoSize(undefined, undefined);
        return await this._devtools.start({ width: size.width, height: size.height, quality: 90 });
    }
    isClosingOrClosed() {
        return this._closedStatus !== 'open';
    }
    async _deleteAllDownloads() {
        await Promise.all(Array.from(this._downloads).map(download => download.artifact.deleteOnContextClose()));
    }
    async _deleteAllTempDirs() {
        await Promise.all(this._tempDirs.map(async (dir) => await fs_1.default.promises.unlink(dir).catch(e => { })));
    }
    setCustomCloseHandler(handler) {
        this._customCloseHandler = handler;
    }
    async close(options) {
        if (this._closedStatus === 'open') {
            if (options.reason)
                this._closeReason = options.reason;
            this.emit(BrowserContext.Events.BeforeClose);
            this._closedStatus = 'closing';
            await this._devtools.dispose();
            for (const harRecorder of this._harRecorders.values())
                await harRecorder.flush();
            await this.tracing.flush();
            // Cleanup.
            const promises = [];
            for (const { context, artifact } of this._browser._idToVideo.values()) {
                // Wait for the videos to finish.
                if (context === this)
                    promises.push(artifact.finishedPromise());
            }
            if (this._customCloseHandler) {
                await this._customCloseHandler();
            }
            else {
                // Close the context.
                await this.doClose(options.reason);
            }
            // We delete downloads after context closure
            // so that browser does not write to the download file anymore.
            promises.push(this._deleteAllDownloads());
            promises.push(this._deleteAllTempDirs());
            await Promise.all(promises);
            // Custom handler should trigger didCloseInternal itself.
            if (!this._customCloseHandler)
                this._didCloseInternal();
        }
        await this._closePromise;
    }
    async newPage(progress, forStorageState) {
        let page;
        try {
            this._creatingStorageStatePage = !!forStorageState;
            page = await progress.race(this.doCreateNewPage());
            const pageOrError = await progress.race(page.waitForInitializedOrError());
            if (pageOrError instanceof page_2.Page) {
                if (pageOrError.isClosed())
                    throw new Error('Page has been closed.');
                return pageOrError;
            }
            throw pageOrError;
        }
        catch (error) {
            await page?.close({ reason: 'Failed to create page' }).catch(() => { });
            throw error;
        }
        finally {
            this._creatingStorageStatePage = false;
        }
    }
    addVisitedOrigin(origin) {
        this._origins.add(origin);
    }
    async storageState(progress, indexedDB = false) {
        const result = {
            cookies: await this.cookies(),
            origins: []
        };
        const originsToSave = new Set(this._origins);
        const collectScript = `(() => {
      const module = {};
      ${rawStorageSource.source}
      const script = new (module.exports.StorageScript())(${this._browser.options.name === 'firefox'});
      return script.collect(${indexedDB});
    })()`;
        // First try collecting storage stage from existing pages.
        for (const page of this.pages()) {
            const origin = page.mainFrame().origin();
            if (!origin || !originsToSave.has(origin))
                continue;
            try {
                const storage = await page.mainFrame().nonStallingEvaluateInExistingContext(collectScript, 'utility');
                if (storage.localStorage.length || storage.indexedDB?.length)
                    result.origins.push({ origin, localStorage: storage.localStorage, indexedDB: storage.indexedDB });
                originsToSave.delete(origin);
            }
            catch {
                // When failed on the live page, we'll retry on the blank page below.
            }
        }
        // If there are still origins to save, create a blank page to iterate over origins.
        if (originsToSave.size) {
            const page = await this.newPage(progress, true /* forStorageState */);
            try {
                await page.addRequestInterceptor(progress, route => {
                    route.fulfill({ body: '<html></html>' }).catch(() => { });
                }, 'prepend');
                for (const origin of originsToSave) {
                    const frame = page.mainFrame();
                    await frame.gotoImpl(progress, origin, {});
                    const storage = await progress.race(frame.evaluateExpression(collectScript, { world: 'utility' }));
                    if (storage.localStorage.length || storage.indexedDB?.length)
                        result.origins.push({ origin, localStorage: storage.localStorage, indexedDB: storage.indexedDB });
                }
            }
            finally {
                await page.close();
            }
        }
        return result;
    }
    isCreatingStorageStatePage() {
        return this._creatingStorageStatePage;
    }
    async setStorageState(progress, state, mode) {
        let page;
        let interceptor;
        try {
            if (mode !== 'initial') {
                await progress.race(this.clearCache());
                await progress.race(this.doClearCookies());
            }
            if (state?.cookies)
                await progress.race(this.addCookies(state.cookies));
            const newOrigins = new Map(state?.origins?.map(p => [p.origin, p]) || []);
            const allOrigins = new Set([...this._origins, ...newOrigins.keys()]);
            if (allOrigins.size) {
                if (mode === 'resetForReuse')
                    page = this.pages()[0];
                if (!page)
                    page = await this.newPage(progress, mode !== 'resetForReuse' /* forStorageState */);
                interceptor = (route) => {
                    route.fulfill({ body: '<html></html>' }).catch(() => { });
                };
                await page.addRequestInterceptor(progress, interceptor, 'prepend');
                for (const origin of allOrigins) {
                    const frame = page.mainFrame();
                    await frame.gotoImpl(progress, origin, {});
                    const restoreScript = `(() => {
            const module = {};
            ${rawStorageSource.source}
            const script = new (module.exports.StorageScript())(${this._browser.options.name === 'firefox'});
            return script.restore(${JSON.stringify(newOrigins.get(origin))});
          })()`;
                    await progress.race(frame.evaluateExpression(restoreScript, { world: 'utility' }));
                }
            }
            this._origins = new Set([...newOrigins.keys()]);
        }
        catch (error) {
            (0, stackTrace_1.rewriteErrorMessage)(error, `Error setting storage state:\n` + error.message);
            throw error;
        }
        finally {
            if (mode !== 'resetForReuse')
                await page?.close();
            else if (interceptor)
                await page?.removeRequestInterceptor(interceptor);
        }
    }
    async extendInjectedScript(source, arg) {
        const installInFrame = (frame) => frame.extendInjectedScript(source, arg).catch(() => { });
        const installInPage = (page) => {
            page.on(page_2.Page.Events.InternalFrameNavigatedToNewDocument, installInFrame);
            return Promise.all(page.frames().map(installInFrame));
        };
        this.on(BrowserContext.Events.Page, installInPage);
        return Promise.all(this.pages().map(installInPage));
    }
    async safeNonStallingEvaluateInAllFrames(expression, world, options = {}) {
        await Promise.all(this.pages().map(page => page.safeNonStallingEvaluateInAllFrames(expression, world, options)));
    }
    harStart(page, options) {
        const harId = (0, crypto_1.createGuid)();
        this._harRecorders.set(harId, new harRecorder_1.HarRecorder(this, page, options));
        return harId;
    }
    async harExport(harId) {
        const recorder = this._harRecorders.get(harId || '');
        return recorder.export();
    }
    addRouteInFlight(route) {
        this._routesInFlight.add(route);
    }
    removeRouteInFlight(route) {
        this._routesInFlight.delete(route);
    }
    async notifyRoutesInFlightAboutRemovedHandler(handler) {
        await Promise.all([...this._routesInFlight].map(route => route.removeHandler(handler)));
    }
}
exports.BrowserContext = BrowserContext;
function validateBrowserContextOptions(options, browserOptions) {
    if (options.noDefaultViewport && options.deviceScaleFactor !== undefined)
        throw new Error(`"deviceScaleFactor" option is not supported with null "viewport"`);
    if (options.noDefaultViewport && !!options.isMobile)
        throw new Error(`"isMobile" option is not supported with null "viewport"`);
    if (options.acceptDownloads === undefined && browserOptions.name !== 'electron')
        options.acceptDownloads = 'accept';
    // Electron requires explicit acceptDownloads: true since we wait for
    // https://github.com/electron/electron/pull/41718 to be widely shipped.
    // In 6-12 months, we can remove this check.
    else if (options.acceptDownloads === undefined && browserOptions.name === 'electron')
        options.acceptDownloads = 'internal-browser-default';
    if (!options.viewport && !options.noDefaultViewport)
        options.viewport = { width: 1280, height: 720 };
    if (options.recordVideo)
        options.recordVideo.size = validateVideoSize(options.recordVideo.size, options.viewport);
    if (options.proxy)
        options.proxy = normalizeProxySettings(options.proxy);
    verifyGeolocation(options.geolocation);
}
function validateVideoSize(size, viewport) {
    if (!size) {
        viewport ??= { width: 800, height: 600 };
        const scale = Math.min(1, 800 / Math.max(viewport.width, viewport.height));
        size = {
            width: Math.floor(viewport.width * scale),
            height: Math.floor(viewport.height * scale)
        };
    }
    // Make sure both dimensions are odd, this is required for vp8
    return {
        width: size.width & ~1,
        height: size.height & ~1
    };
}
function verifyGeolocation(geolocation) {
    if (!geolocation)
        return;
    geolocation.accuracy = geolocation.accuracy || 0;
    const { longitude, latitude, accuracy } = geolocation;
    if (longitude < -180 || longitude > 180)
        throw new Error(`geolocation.longitude: precondition -180 <= LONGITUDE <= 180 failed.`);
    if (latitude < -90 || latitude > 90)
        throw new Error(`geolocation.latitude: precondition -90 <= LATITUDE <= 90 failed.`);
    if (accuracy < 0)
        throw new Error(`geolocation.accuracy: precondition 0 <= ACCURACY failed.`);
}
function verifyClientCertificates(clientCertificates) {
    if (!clientCertificates)
        return;
    for (const cert of clientCertificates) {
        if (!cert.origin)
            throw new Error(`clientCertificates.origin is required`);
        if (!cert.cert && !cert.key && !cert.passphrase && !cert.pfx)
            throw new Error('None of cert, key, passphrase or pfx is specified');
        if (cert.cert && !cert.key)
            throw new Error('cert is specified without key');
        if (!cert.cert && cert.key)
            throw new Error('key is specified without cert');
        if (cert.pfx && (cert.cert || cert.key))
            throw new Error('pfx is specified together with cert, key or passphrase');
    }
}
function normalizeProxySettings(proxy) {
    let { server, bypass } = proxy;
    let url;
    try {
        // new URL('127.0.0.1:8080') throws
        // new URL('localhost:8080') fails to parse host or protocol
        // In both of these cases, we need to try re-parse URL with `http://` prefix.
        url = new URL(server);
        if (!url.host || !url.protocol)
            url = new URL('http://' + server);
    }
    catch (e) {
        url = new URL('http://' + server);
    }
    if (url.protocol === 'socks4:' && (proxy.username || proxy.password))
        throw new Error(`Socks4 proxy protocol does not support authentication`);
    if (url.protocol === 'socks5:' && (proxy.username || proxy.password))
        throw new Error(`Browser does not support socks5 proxy authentication`);
    server = url.protocol + '//' + url.host;
    if (bypass)
        bypass = bypass.split(',').map(t => t.trim()).join(',');
    return { ...proxy, server, bypass };
}
const paramsThatAllowContextReuse = [
    'colorScheme',
    'forcedColors',
    'reducedMotion',
    'contrast',
    'screen',
    'userAgent',
    'viewport',
    'testIdAttributeName',
];
const defaultNewContextParamValues = {
    noDefaultViewport: false,
    ignoreHTTPSErrors: false,
    javaScriptEnabled: true,
    bypassCSP: false,
    offline: false,
    isMobile: false,
    hasTouch: false,
    acceptDownloads: 'accept',
    strictSelectors: false,
    serviceWorkers: 'allow',
    locale: 'en-US',
};
