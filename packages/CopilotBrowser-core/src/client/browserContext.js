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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserContext = void 0;
exports.prepareBrowserContextParams = prepareBrowserContextParams;
exports.toClientCertificatesProtocol = toClientCertificatesProtocol;
const artifact_1 = require("./artifact");
const cdpSession_1 = require("./cdpSession");
const channelOwner_1 = require("./channelOwner");
const clientHelper_1 = require("./clientHelper");
const clock_1 = require("./clock");
const consoleMessage_1 = require("./consoleMessage");
const dialog_1 = require("./dialog");
const errors_1 = require("./errors");
const events_1 = require("./events");
const fetch_1 = require("./fetch");
const frame_1 = require("./frame");
const harRouter_1 = require("./harRouter");
const network = __importStar(require("./network"));
const page_1 = require("./page");
const tracing_1 = require("./tracing");
const waiter_1 = require("./waiter");
const webError_1 = require("./webError");
const worker_1 = require("./worker");
const timeoutSettings_1 = require("./timeoutSettings");
const fileUtils_1 = require("./fileUtils");
const headers_1 = require("../utils/isomorphic/headers");
const urlMatch_1 = require("../utils/isomorphic/urlMatch");
const rtti_1 = require("../utils/isomorphic/rtti");
const stackTrace_1 = require("../utils/isomorphic/stackTrace");
class BrowserContext extends channelOwner_1.ChannelOwner {
    _pages = new Set();
    _routes = [];
    _webSocketRoutes = [];
    // Browser is null for browser contexts created outside of normal browser, e.g. android or electron.
    _browser = null;
    _bindings = new Map();
    _timeoutSettings;
    _ownerPage;
    _forReuse = false;
    _closedPromise;
    _options;
    request;
    tracing;
    clock;
    _serviceWorkers = new Set();
    _harRecorders = new Map();
    _closingStatus = 'none';
    _closeReason;
    _harRouters = [];
    _onRecorderEventSink;
    _allowedProtocols;
    _allowedDirectories;
    static from(context) {
        return context._object;
    }
    static fromNullable(context) {
        return context ? BrowserContext.from(context) : null;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._options = initializer.options;
        this._timeoutSettings = new timeoutSettings_1.TimeoutSettings(this._platform);
        this.tracing = tracing_1.Tracing.from(initializer.tracing);
        this.request = fetch_1.APIRequestContext.from(initializer.requestContext);
        this.request._timeoutSettings = this._timeoutSettings;
        this.request._checkUrlAllowed = (url) => this._checkUrlAllowed(url);
        this.clock = new clock_1.Clock(this);
        this._channel.on('bindingCall', ({ binding }) => this._onBinding(page_1.BindingCall.from(binding)));
        this._channel.on('close', () => this._onClose());
        this._channel.on('page', ({ page }) => this._onPage(page_1.Page.from(page)));
        this._channel.on('route', ({ route }) => this._onRoute(network.Route.from(route)));
        this._channel.on('webSocketRoute', ({ webSocketRoute }) => this._onWebSocketRoute(network.WebSocketRoute.from(webSocketRoute)));
        this._channel.on('serviceWorker', ({ worker }) => {
            const serviceWorker = worker_1.Worker.from(worker);
            serviceWorker._context = this;
            this._serviceWorkers.add(serviceWorker);
            this.emit(events_1.Events.BrowserContext.ServiceWorker, serviceWorker);
        });
        this._channel.on('console', event => {
            const worker = worker_1.Worker.fromNullable(event.worker);
            const page = page_1.Page.fromNullable(event.page);
            const consoleMessage = new consoleMessage_1.ConsoleMessage(this._platform, event, page, worker);
            worker?.emit(events_1.Events.Worker.Console, consoleMessage);
            page?.emit(events_1.Events.Page.Console, consoleMessage);
            if (worker && this._serviceWorkers.has(worker)) {
                const scope = this._serviceWorkerScope(worker);
                for (const page of this._pages) {
                    if (scope && page.url().startsWith(scope))
                        page.emit(events_1.Events.Page.Console, consoleMessage);
                }
            }
            this.emit(events_1.Events.BrowserContext.Console, consoleMessage);
        });
        this._channel.on('pageError', ({ error, page }) => {
            const pageObject = page_1.Page.from(page);
            const parsedError = (0, errors_1.parseError)(error);
            this.emit(events_1.Events.BrowserContext.WebError, new webError_1.WebError(pageObject, parsedError));
            if (pageObject)
                pageObject.emit(events_1.Events.Page.PageError, parsedError);
        });
        this._channel.on('dialog', ({ dialog }) => {
            const dialogObject = dialog_1.Dialog.from(dialog);
            let hasListeners = this.emit(events_1.Events.BrowserContext.Dialog, dialogObject);
            const page = dialogObject.page();
            if (page)
                hasListeners = page.emit(events_1.Events.Page.Dialog, dialogObject) || hasListeners;
            if (!hasListeners) {
                // Although we do similar handling on the server side, we still need this logic
                // on the client side due to a possible race condition between two async calls:
                // a) removing "dialog" listener subscription (client->server)
                // b) actual "dialog" event (server->client)
                if (dialogObject.type() === 'beforeunload')
                    dialog.accept({}).catch(() => { });
                else
                    dialog.dismiss().catch(() => { });
            }
        });
        this._channel.on('request', ({ request, page }) => this._onRequest(network.Request.from(request), page_1.Page.fromNullable(page)));
        this._channel.on('requestFailed', ({ request, failureText, responseEndTiming, page }) => this._onRequestFailed(network.Request.from(request), responseEndTiming, failureText, page_1.Page.fromNullable(page)));
        this._channel.on('requestFinished', params => this._onRequestFinished(params));
        this._channel.on('response', ({ response, page }) => this._onResponse(network.Response.from(response), page_1.Page.fromNullable(page)));
        this._channel.on('recorderEvent', ({ event, data, page, code }) => {
            if (event === 'actionAdded')
                this._onRecorderEventSink?.actionAdded?.(page_1.Page.from(page), data, code);
            else if (event === 'actionUpdated')
                this._onRecorderEventSink?.actionUpdated?.(page_1.Page.from(page), data, code);
            else if (event === 'signalAdded')
                this._onRecorderEventSink?.signalAdded?.(page_1.Page.from(page), data);
        });
        this._closedPromise = new Promise(f => this.once(events_1.Events.BrowserContext.Close, f));
        this._setEventToSubscriptionMapping(new Map([
            [events_1.Events.BrowserContext.Console, 'console'],
            [events_1.Events.BrowserContext.Dialog, 'dialog'],
            [events_1.Events.BrowserContext.Request, 'request'],
            [events_1.Events.BrowserContext.Response, 'response'],
            [events_1.Events.BrowserContext.RequestFinished, 'requestFinished'],
            [events_1.Events.BrowserContext.RequestFailed, 'requestFailed'],
        ]));
    }
    async _initializeHarFromOptions(recordHar) {
        if (!recordHar)
            return;
        const defaultContent = recordHar.path.endsWith('.zip') ? 'attach' : 'embed';
        await this._recordIntoHAR(recordHar.path, null, {
            url: recordHar.urlFilter,
            updateContent: recordHar.content ?? (recordHar.omitContent ? 'omit' : defaultContent),
            updateMode: recordHar.mode ?? 'full',
        });
    }
    _onPage(page) {
        this._pages.add(page);
        this.emit(events_1.Events.BrowserContext.Page, page);
        if (page._opener && !page._opener.isClosed())
            page._opener.emit(events_1.Events.Page.Popup, page);
    }
    _onRequest(request, page) {
        this.emit(events_1.Events.BrowserContext.Request, request);
        if (page)
            page.emit(events_1.Events.Page.Request, request);
    }
    _onResponse(response, page) {
        this.emit(events_1.Events.BrowserContext.Response, response);
        if (page)
            page.emit(events_1.Events.Page.Response, response);
    }
    _onRequestFailed(request, responseEndTiming, failureText, page) {
        request._failureText = failureText || null;
        request._setResponseEndTiming(responseEndTiming);
        this.emit(events_1.Events.BrowserContext.RequestFailed, request);
        if (page)
            page.emit(events_1.Events.Page.RequestFailed, request);
    }
    _onRequestFinished(params) {
        const { responseEndTiming } = params;
        const request = network.Request.from(params.request);
        const response = network.Response.fromNullable(params.response);
        const page = page_1.Page.fromNullable(params.page);
        request._setResponseEndTiming(responseEndTiming);
        this.emit(events_1.Events.BrowserContext.RequestFinished, request);
        if (page)
            page.emit(events_1.Events.Page.RequestFinished, request);
        if (response)
            response._finishedPromise.resolve(null);
    }
    async _onRoute(route) {
        route._context = this;
        const page = route.request()._safePage();
        const routeHandlers = this._routes.slice();
        for (const routeHandler of routeHandlers) {
            // If the page or the context was closed we stall all requests right away.
            if (page?._closeWasCalled || this._closingStatus !== 'none')
                return;
            if (!routeHandler.matches(route.request().url()))
                continue;
            const index = this._routes.indexOf(routeHandler);
            if (index === -1)
                continue;
            if (routeHandler.willExpire())
                this._routes.splice(index, 1);
            const handled = await routeHandler.handle(route);
            if (!this._routes.length)
                this._updateInterceptionPatterns({ internal: true }).catch(() => { });
            if (handled)
                return;
        }
        // If the page is closed or unrouteAll() was called without waiting and interception disabled,
        // the method will throw an error - silence it.
        await route._innerContinue(true /* isFallback */).catch(() => { });
    }
    async _onWebSocketRoute(webSocketRoute) {
        const routeHandler = this._webSocketRoutes.find(route => route.matches(webSocketRoute.url()));
        if (routeHandler)
            await routeHandler.handle(webSocketRoute);
        else
            webSocketRoute.connectToServer();
    }
    async _onBinding(bindingCall) {
        const func = this._bindings.get(bindingCall._initializer.name);
        if (!func)
            return;
        await bindingCall.call(func);
    }
    _serviceWorkerScope(serviceWorker) {
        try {
            let url = new URL('.', serviceWorker.url()).href;
            if (!url.endsWith('/'))
                url += '/';
            return url;
        }
        catch {
            return null;
        }
    }
    setDefaultNavigationTimeout(timeout) {
        this._timeoutSettings.setDefaultNavigationTimeout(timeout);
    }
    setDefaultTimeout(timeout) {
        this._timeoutSettings.setDefaultTimeout(timeout);
    }
    browser() {
        return this._browser;
    }
    pages() {
        return [...this._pages];
    }
    async newPage() {
        if (this._ownerPage)
            throw new Error('Please use browser.newContext()');
        return page_1.Page.from((await this._channel.newPage()).page);
    }
    async cookies(urls) {
        if (!urls)
            urls = [];
        if (urls && typeof urls === 'string')
            urls = [urls];
        return (await this._channel.cookies({ urls: urls })).cookies;
    }
    async addCookies(cookies) {
        await this._channel.addCookies({ cookies });
    }
    async clearCookies(options = {}) {
        await this._channel.clearCookies({
            name: (0, rtti_1.isString)(options.name) ? options.name : undefined,
            nameRegexSource: (0, rtti_1.isRegExp)(options.name) ? options.name.source : undefined,
            nameRegexFlags: (0, rtti_1.isRegExp)(options.name) ? options.name.flags : undefined,
            domain: (0, rtti_1.isString)(options.domain) ? options.domain : undefined,
            domainRegexSource: (0, rtti_1.isRegExp)(options.domain) ? options.domain.source : undefined,
            domainRegexFlags: (0, rtti_1.isRegExp)(options.domain) ? options.domain.flags : undefined,
            path: (0, rtti_1.isString)(options.path) ? options.path : undefined,
            pathRegexSource: (0, rtti_1.isRegExp)(options.path) ? options.path.source : undefined,
            pathRegexFlags: (0, rtti_1.isRegExp)(options.path) ? options.path.flags : undefined,
        });
    }
    async grantPermissions(permissions, options) {
        await this._channel.grantPermissions({ permissions, ...options });
    }
    async clearPermissions() {
        await this._channel.clearPermissions();
    }
    async setGeolocation(geolocation) {
        await this._channel.setGeolocation({ geolocation: geolocation || undefined });
    }
    async setExtraHTTPHeaders(headers) {
        network.validateHeaders(headers);
        await this._channel.setExtraHTTPHeaders({ headers: (0, headers_1.headersObjectToArray)(headers) });
    }
    async setOffline(offline) {
        await this._channel.setOffline({ offline });
    }
    async setHTTPCredentials(httpCredentials) {
        await this._channel.setHTTPCredentials({ httpCredentials: httpCredentials || undefined });
    }
    async addInitScript(script, arg) {
        const source = await (0, clientHelper_1.evaluationScript)(this._platform, script, arg);
        await this._channel.addInitScript({ source });
    }
    async exposeBinding(name, callback, options = {}) {
        await this._channel.exposeBinding({ name, needsHandle: options.handle });
        this._bindings.set(name, callback);
    }
    async exposeFunction(name, callback) {
        await this._channel.exposeBinding({ name });
        const binding = (source, ...args) => callback(...args);
        this._bindings.set(name, binding);
    }
    async route(url, handler, options = {}) {
        this._routes.unshift(new network.RouteHandler(this._platform, this._options.baseURL, url, handler, options.times));
        await this._updateInterceptionPatterns({ title: 'Route requests' });
    }
    async routeWebSocket(url, handler) {
        this._webSocketRoutes.unshift(new network.WebSocketRouteHandler(this._options.baseURL, url, handler));
        await this._updateWebSocketInterceptionPatterns({ title: 'Route WebSockets' });
    }
    async _recordIntoHAR(har, page, options = {}) {
        const { harId } = await this._channel.harStart({
            page: page?._channel,
            options: {
                zip: har.endsWith('.zip'),
                content: options.updateContent ?? 'attach',
                urlGlob: (0, rtti_1.isString)(options.url) ? options.url : undefined,
                urlRegexSource: (0, rtti_1.isRegExp)(options.url) ? options.url.source : undefined,
                urlRegexFlags: (0, rtti_1.isRegExp)(options.url) ? options.url.flags : undefined,
                mode: options.updateMode ?? 'minimal',
            },
        });
        this._harRecorders.set(harId, { path: har, content: options.updateContent ?? 'attach' });
    }
    async routeFromHAR(har, options = {}) {
        const localUtils = this._connection.localUtils();
        if (!localUtils)
            throw new Error('Route from har is not supported in thin clients');
        if (options.update) {
            await this._recordIntoHAR(har, null, options);
            return;
        }
        const harRouter = await harRouter_1.HarRouter.create(localUtils, har, options.notFound || 'abort', { urlMatch: options.url });
        this._harRouters.push(harRouter);
        await harRouter.addContextRoute(this);
    }
    _disposeHarRouters() {
        this._harRouters.forEach(router => router.dispose());
        this._harRouters = [];
    }
    async unrouteAll(options) {
        await this._unrouteInternal(this._routes, [], options?.behavior);
        this._disposeHarRouters();
    }
    async unroute(url, handler) {
        const removed = [];
        const remaining = [];
        for (const route of this._routes) {
            if ((0, urlMatch_1.urlMatchesEqual)(route.url, url) && (!handler || route.handler === handler))
                removed.push(route);
            else
                remaining.push(route);
        }
        await this._unrouteInternal(removed, remaining, 'default');
    }
    async _unrouteInternal(removed, remaining, behavior) {
        this._routes = remaining;
        if (behavior && behavior !== 'default') {
            const promises = removed.map(routeHandler => routeHandler.stop(behavior));
            await Promise.all(promises);
        }
        await this._updateInterceptionPatterns({ title: 'Unroute requests' });
    }
    async _updateInterceptionPatterns(options) {
        const patterns = network.RouteHandler.prepareInterceptionPatterns(this._routes);
        await this._wrapApiCall(() => this._channel.setNetworkInterceptionPatterns({ patterns }), options);
    }
    async _updateWebSocketInterceptionPatterns(options) {
        const patterns = network.WebSocketRouteHandler.prepareInterceptionPatterns(this._webSocketRoutes);
        await this._wrapApiCall(() => this._channel.setWebSocketInterceptionPatterns({ patterns }), options);
    }
    _effectiveCloseReason() {
        return this._closeReason || this._browser?._closeReason;
    }
    async waitForEvent(event, optionsOrPredicate = {}) {
        return await this._wrapApiCall(async () => {
            const timeout = this._timeoutSettings.timeout(typeof optionsOrPredicate === 'function' ? {} : optionsOrPredicate);
            const predicate = typeof optionsOrPredicate === 'function' ? optionsOrPredicate : optionsOrPredicate.predicate;
            const waiter = waiter_1.Waiter.createForEvent(this, event);
            waiter.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded while waiting for event "${event}"`);
            if (event !== events_1.Events.BrowserContext.Close)
                waiter.rejectOnEvent(this, events_1.Events.BrowserContext.Close, () => new errors_1.TargetClosedError(this._effectiveCloseReason()));
            const result = await waiter.waitForEvent(this, event, predicate);
            waiter.dispose();
            return result;
        });
    }
    async storageState(options = {}) {
        const state = await this._channel.storageState({ indexedDB: options.indexedDB });
        if (options.path) {
            await (0, fileUtils_1.mkdirIfNeeded)(this._platform, options.path);
            await this._platform.fs().promises.writeFile(options.path, JSON.stringify(state, undefined, 2), 'utf8');
        }
        return state;
    }
    async setStorageState(storageState) {
        const state = await prepareStorageState(this._platform, storageState);
        await this._channel.setStorageState({ storageState: state });
    }
    backgroundPages() {
        return [];
    }
    serviceWorkers() {
        return [...this._serviceWorkers];
    }
    async newCDPSession(page) {
        // channelOwner.ts's validation messages don't handle the pseudo-union type, so we're explicit here
        if (!(page instanceof page_1.Page) && !(page instanceof frame_1.Frame))
            throw new Error('page: expected Page or Frame');
        const result = await this._channel.newCDPSession(page instanceof page_1.Page ? { page: page._channel } : { frame: page._channel });
        return cdpSession_1.CDPSession.from(result.session);
    }
    _onClose() {
        this._closingStatus = 'closed';
        this._browser?._contexts.delete(this);
        this._browser?._browserType._contexts.delete(this);
        this._browser?._browserType._copilotbrowser.selectors._contextsForSelectors.delete(this);
        this._disposeHarRouters();
        this.tracing._resetStackCounter();
        this.emit(events_1.Events.BrowserContext.Close, this);
    }
    async [Symbol.asyncDispose]() {
        await this.close();
    }
    async close(options = {}) {
        if (this._closingStatus !== 'none')
            return;
        this._closeReason = options.reason;
        this._closingStatus = 'closing';
        await this.request.dispose(options);
        await this._instrumentation.runBeforeCloseBrowserContext(this);
        await this._wrapApiCall(async () => {
            for (const [harId, harParams] of this._harRecorders) {
                const har = await this._channel.harExport({ harId });
                const artifact = artifact_1.Artifact.from(har.artifact);
                // Server side will compress artifact if content is attach or if file is .zip.
                const isCompressed = harParams.content === 'attach' || harParams.path.endsWith('.zip');
                const needCompressed = harParams.path.endsWith('.zip');
                if (isCompressed && !needCompressed) {
                    const localUtils = this._connection.localUtils();
                    if (!localUtils)
                        throw new Error('Uncompressed har is not supported in thin clients');
                    await artifact.saveAs(harParams.path + '.tmp');
                    await localUtils.harUnzip({ zipFile: harParams.path + '.tmp', harFile: harParams.path });
                }
                else {
                    await artifact.saveAs(harParams.path);
                }
                await artifact.delete();
            }
        }, { internal: true });
        await this._channel.close(options);
        await this._closedPromise;
    }
    async _enableRecorder(params, eventSink) {
        if (eventSink)
            this._onRecorderEventSink = eventSink;
        await this._channel.enableRecorder(params);
    }
    async _disableRecorder() {
        this._onRecorderEventSink = undefined;
        await this._channel.disableRecorder();
    }
    async _exposeConsoleApi() {
        await this._channel.exposeConsoleApi();
    }
    _setAllowedProtocols(protocols) {
        this._allowedProtocols = protocols;
    }
    _checkUrlAllowed(url) {
        if (!this._allowedProtocols)
            return;
        let parsedURL;
        try {
            parsedURL = new URL(url);
        }
        catch (e) {
            throw new Error(`Access to ${url} is blocked. Invalid URL: ${e.message}`);
        }
        if (!this._allowedProtocols.includes(parsedURL.protocol))
            throw new Error(`Access to "${parsedURL.protocol}" URL is blocked. Allowed protocols: ${this._allowedProtocols.join(', ')}. Attempted URL: ${url}`);
    }
    _setAllowedDirectories(rootDirectories) {
        this._allowedDirectories = rootDirectories;
    }
    _checkFileAccess(filePath) {
        if (!this._allowedDirectories)
            return;
        const path = this._platform.path().resolve(filePath);
        const isInsideDir = (container, child) => {
            const path = this._platform.path();
            const rel = path.relative(container, child);
            return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
        };
        if (this._allowedDirectories.some(root => isInsideDir(root, path)))
            return;
        throw new Error(`File access denied: ${filePath} is outside allowed roots. Allowed roots: ${this._allowedDirectories.length ? this._allowedDirectories.join(', ') : 'none'}`);
    }
    async _devtoolsStart() {
        return await this._channel.devtoolsStart();
    }
}
exports.BrowserContext = BrowserContext;
async function prepareStorageState(platform, storageState) {
    if (typeof storageState !== 'string')
        return storageState;
    try {
        return JSON.parse(await platform.fs().promises.readFile(storageState, 'utf8'));
    }
    catch (e) {
        (0, stackTrace_1.rewriteErrorMessage)(e, `Error reading storage state from ${storageState}:\n` + e.message);
        throw e;
    }
}
async function prepareBrowserContextParams(platform, options) {
    if (options.videoSize && !options.videosPath)
        throw new Error(`"videoSize" option requires "videosPath" to be specified`);
    if (options.extraHTTPHeaders)
        network.validateHeaders(options.extraHTTPHeaders);
    const contextParams = {
        ...options,
        viewport: options.viewport === null ? undefined : options.viewport,
        noDefaultViewport: options.viewport === null,
        extraHTTPHeaders: options.extraHTTPHeaders ? (0, headers_1.headersObjectToArray)(options.extraHTTPHeaders) : undefined,
        storageState: options.storageState ? await prepareStorageState(platform, options.storageState) : undefined,
        serviceWorkers: options.serviceWorkers,
        colorScheme: options.colorScheme === null ? 'no-override' : options.colorScheme,
        reducedMotion: options.reducedMotion === null ? 'no-override' : options.reducedMotion,
        forcedColors: options.forcedColors === null ? 'no-override' : options.forcedColors,
        contrast: options.contrast === null ? 'no-override' : options.contrast,
        acceptDownloads: toAcceptDownloadsProtocol(options.acceptDownloads),
        clientCertificates: await toClientCertificatesProtocol(platform, options.clientCertificates),
    };
    if (!contextParams.recordVideo && options.videosPath) {
        contextParams.recordVideo = {
            dir: options.videosPath,
            size: options.videoSize
        };
    }
    if (contextParams.recordVideo && contextParams.recordVideo.dir)
        contextParams.recordVideo.dir = platform.path().resolve(contextParams.recordVideo.dir);
    return contextParams;
}
function toAcceptDownloadsProtocol(acceptDownloads) {
    if (acceptDownloads === undefined)
        return undefined;
    if (acceptDownloads)
        return 'accept';
    return 'deny';
}
async function toClientCertificatesProtocol(platform, certs) {
    if (!certs)
        return undefined;
    const bufferizeContent = async (value, path) => {
        if (value)
            return value;
        if (path)
            return await platform.fs().promises.readFile(path);
    };
    return await Promise.all(certs.map(async (cert) => ({
        origin: cert.origin,
        cert: await bufferizeContent(cert.cert, cert.certPath),
        key: await bufferizeContent(cert.key, cert.keyPath),
        pfx: await bufferizeContent(cert.pfx, cert.pfxPath),
        passphrase: cert.passphrase,
    })));
}
