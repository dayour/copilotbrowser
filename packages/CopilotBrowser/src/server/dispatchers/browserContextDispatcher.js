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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserContextDispatcher = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const browserContext_1 = require("../browserContext");
const artifactDispatcher_1 = require("./artifactDispatcher");
const cdpSessionDispatcher_1 = require("./cdpSessionDispatcher");
const dialogDispatcher_1 = require("./dialogDispatcher");
const dispatcher_1 = require("./dispatcher");
const frameDispatcher_1 = require("./frameDispatcher");
const networkDispatchers_1 = require("./networkDispatchers");
const pageDispatcher_1 = require("./pageDispatcher");
const crBrowser_1 = require("../chromium/crBrowser");
const errors_1 = require("../errors");
const tracingDispatcher_1 = require("./tracingDispatcher");
const webSocketRouteDispatcher_1 = require("./webSocketRouteDispatcher");
const writableStreamDispatcher_1 = require("./writableStreamDispatcher");
const crypto_1 = require("../utils/crypto");
const urlMatch_1 = require("../../utils/isomorphic/urlMatch");
const recorder_1 = require("../recorder");
const recorderApp_1 = require("../recorder/recorderApp");
const elementHandlerDispatcher_1 = require("./elementHandlerDispatcher");
const jsHandleDispatcher_1 = require("./jsHandleDispatcher");
class BrowserContextDispatcher extends dispatcher_1.Dispatcher {
    _type_EventTarget = true;
    _type_BrowserContext = true;
    _context;
    _subscriptions = new Set();
    _webSocketInterceptionPatterns = [];
    _bindings = [];
    _initScripts = [];
    _dialogHandler;
    _clockPaused = false;
    _requestInterceptor;
    _interceptionUrlMatchers = [];
    _routeWebSocketInitScript;
    static from(parentScope, context) {
        const result = parentScope.connection.existingDispatcher(context);
        return result || new BrowserContextDispatcher(parentScope, context);
    }
    constructor(parentScope, context) {
        // We will reparent these to the context below.
        const requestContext = networkDispatchers_1.APIRequestContextDispatcher.from(parentScope, context.fetchRequest);
        const tracing = tracingDispatcher_1.TracingDispatcher.from(parentScope, context.tracing);
        super(parentScope, context, 'BrowserContext', {
            isChromium: context._browser.options.isChromium,
            requestContext,
            tracing,
            options: context._options,
        });
        this.adopt(requestContext);
        this.adopt(tracing);
        this._requestInterceptor = (route, request) => {
            const matchesSome = this._interceptionUrlMatchers.some(urlMatch => (0, urlMatch_1.urlMatches)(this._context._options.baseURL, request.url(), urlMatch));
            // If there is already a dispatcher, that means we've already routed this request through page.
            // Client expects a single `route` event, either on the page or on the context, so we can just fallback here.
            const routeDispatcher = this.connection.existingDispatcher(route);
            if (!matchesSome || routeDispatcher) {
                route.continue({ isFallback: true }).catch(() => { });
                return;
            }
            this._dispatchEvent('route', { route: new networkDispatchers_1.RouteDispatcher(networkDispatchers_1.RequestDispatcher.from(this, request), route) });
        };
        this._context = context;
        // Note: when launching persistent context, or connecting to an existing browser,
        // dispatcher is created very late, so we can already have pages, videos and everything else.
        for (const page of context.pages())
            this._dispatchEvent('page', { page: pageDispatcher_1.PageDispatcher.from(this, page) });
        this.addObjectListener(browserContext_1.BrowserContext.Events.Page, page => {
            this._dispatchEvent('page', { page: pageDispatcher_1.PageDispatcher.from(this, page) });
        });
        this.addObjectListener(browserContext_1.BrowserContext.Events.Close, () => {
            this._dispatchEvent('close');
            this._dispose();
        });
        this.addObjectListener(browserContext_1.BrowserContext.Events.PageError, (error, page) => {
            this._dispatchEvent('pageError', { error: (0, errors_1.serializeError)(error), page: pageDispatcher_1.PageDispatcher.from(this, page) });
        });
        this.addObjectListener(browserContext_1.BrowserContext.Events.Console, (message) => {
            const pageDispatcher = pageDispatcher_1.PageDispatcher.fromNullable(this, message.page());
            const workerDispatcher = pageDispatcher_1.WorkerDispatcher.fromNullable(this, message.worker());
            if (this._shouldDispatchEvent(message.page(), 'console') || workerDispatcher?._subscriptions.has('console')) {
                this._dispatchEvent('console', {
                    page: pageDispatcher,
                    worker: workerDispatcher,
                    ...this.serializeConsoleMessage(message, workerDispatcher || pageDispatcher),
                });
            }
        });
        this._dialogHandler = dialog => {
            if (!this._shouldDispatchEvent(dialog.page(), 'dialog'))
                return false;
            this._dispatchEvent('dialog', { dialog: new dialogDispatcher_1.DialogDispatcher(this, dialog) });
            return true;
        };
        context.dialogManager.addDialogHandler(this._dialogHandler);
        if (context._browser.options.name === 'chromium' && this._object._browser instanceof crBrowser_1.CRBrowser) {
            for (const serviceWorker of context.serviceWorkers())
                this._dispatchEvent('serviceWorker', { worker: new pageDispatcher_1.WorkerDispatcher(this, serviceWorker) });
            this.addObjectListener(crBrowser_1.CRBrowserContext.CREvents.ServiceWorker, serviceWorker => this._dispatchEvent('serviceWorker', { worker: new pageDispatcher_1.WorkerDispatcher(this, serviceWorker) }));
        }
        this.addObjectListener(browserContext_1.BrowserContext.Events.Request, (request) => {
            // Create dispatcher, if:
            // - There are listeners to the requests.
            // - We are redirected from a reported request so that redirectedTo was updated on client.
            // - We are a navigation request and dispatcher will be reported as a part of the goto return value and newDocument param anyways.
            //   By the time requestFinished is triggered to update the request, we should have a request on the client already.
            const redirectFromDispatcher = request.redirectedFrom() && this.connection.existingDispatcher(request.redirectedFrom());
            if (!redirectFromDispatcher && !this._shouldDispatchNetworkEvent(request, 'request') && !request.isNavigationRequest())
                return;
            const requestDispatcher = networkDispatchers_1.RequestDispatcher.from(this, request);
            this._dispatchEvent('request', {
                request: requestDispatcher,
                page: pageDispatcher_1.PageDispatcher.fromNullable(this, request.frame()?._page.initializedOrUndefined())
            });
        });
        this.addObjectListener(browserContext_1.BrowserContext.Events.Response, (response) => {
            const requestDispatcher = this.connection.existingDispatcher(response.request());
            if (!requestDispatcher && !this._shouldDispatchNetworkEvent(response.request(), 'response'))
                return;
            this._dispatchEvent('response', {
                response: networkDispatchers_1.ResponseDispatcher.from(this, response),
                page: pageDispatcher_1.PageDispatcher.fromNullable(this, response.frame()?._page.initializedOrUndefined())
            });
        });
        this.addObjectListener(browserContext_1.BrowserContext.Events.RequestFailed, (request) => {
            const requestDispatcher = this.connection.existingDispatcher(request);
            if (!requestDispatcher && !this._shouldDispatchNetworkEvent(request, 'requestFailed'))
                return;
            this._dispatchEvent('requestFailed', {
                request: networkDispatchers_1.RequestDispatcher.from(this, request),
                failureText: request._failureText || undefined,
                responseEndTiming: request._responseEndTiming,
                page: pageDispatcher_1.PageDispatcher.fromNullable(this, request.frame()?._page.initializedOrUndefined())
            });
        });
        this.addObjectListener(browserContext_1.BrowserContext.Events.RequestFinished, ({ request, response }) => {
            const requestDispatcher = this.connection.existingDispatcher(request);
            if (!requestDispatcher && !this._shouldDispatchNetworkEvent(request, 'requestFinished'))
                return;
            this._dispatchEvent('requestFinished', {
                request: networkDispatchers_1.RequestDispatcher.from(this, request),
                response: networkDispatchers_1.ResponseDispatcher.fromNullable(this, response),
                responseEndTiming: request._responseEndTiming,
                page: pageDispatcher_1.PageDispatcher.fromNullable(this, request.frame()?._page.initializedOrUndefined()),
            });
        });
        this.addObjectListener(browserContext_1.BrowserContext.Events.RecorderEvent, ({ event, data, page, code }) => {
            this._dispatchEvent('recorderEvent', { event, data, code, page: pageDispatcher_1.PageDispatcher.from(this, page) });
        });
    }
    _shouldDispatchNetworkEvent(request, event) {
        return this._shouldDispatchEvent(request.frame()?._page?.initializedOrUndefined(), event);
    }
    _shouldDispatchEvent(page, event) {
        if (this._subscriptions.has(event))
            return true;
        const pageDispatcher = page ? this.connection.existingDispatcher(page) : undefined;
        if (pageDispatcher?._subscriptions.has(event))
            return true;
        return false;
    }
    serializeConsoleMessage(message, jsScope) {
        return {
            type: message.type(),
            text: message.text(),
            args: message.args().map(a => {
                const elementHandle = a.asElement();
                if (elementHandle)
                    return elementHandlerDispatcher_1.ElementHandleDispatcher.from(frameDispatcher_1.FrameDispatcher.from(this, elementHandle._frame), elementHandle);
                return jsHandleDispatcher_1.JSHandleDispatcher.fromJSHandle(jsScope, a);
            }),
            location: message.location(),
            timestamp: message.timestamp(),
        };
    }
    async createTempFiles(params, progress) {
        const dir = this._context._browser.options.artifactsDir;
        const tmpDir = path_1.default.join(dir, 'upload-' + (0, crypto_1.createGuid)());
        const tempDirWithRootName = params.rootDirName ? path_1.default.join(tmpDir, path_1.default.basename(params.rootDirName)) : tmpDir;
        await progress.race(fs_1.default.promises.mkdir(tempDirWithRootName, { recursive: true }));
        this._context._tempDirs.push(tmpDir);
        return {
            rootDir: params.rootDirName ? new writableStreamDispatcher_1.WritableStreamDispatcher(this, tempDirWithRootName) : undefined,
            writableStreams: await Promise.all(params.items.map(async (item) => {
                await progress.race(fs_1.default.promises.mkdir(path_1.default.dirname(path_1.default.join(tempDirWithRootName, item.name)), { recursive: true }));
                const file = fs_1.default.createWriteStream(path_1.default.join(tempDirWithRootName, item.name));
                return new writableStreamDispatcher_1.WritableStreamDispatcher(this, file, item.lastModifiedMs);
            }))
        };
    }
    async exposeBinding(params, progress) {
        const binding = await this._context.exposeBinding(progress, params.name, !!params.needsHandle, (source, ...args) => {
            // When reusing the context, we might have some bindings called late enough,
            // after context and page dispatchers have been disposed.
            if (this._disposed)
                return;
            const pageDispatcher = pageDispatcher_1.PageDispatcher.from(this, source.page);
            const binding = new pageDispatcher_1.BindingCallDispatcher(pageDispatcher, params.name, !!params.needsHandle, source, args);
            this._dispatchEvent('bindingCall', { binding });
            return binding.promise();
        });
        this._bindings.push(binding);
    }
    async newPage(params, progress) {
        return { page: pageDispatcher_1.PageDispatcher.from(this, await this._context.newPage(progress)) };
    }
    async cookies(params, progress) {
        return { cookies: await progress.race(this._context.cookies(params.urls)) };
    }
    async addCookies(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        await this._context.addCookies(params.cookies);
    }
    async clearCookies(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        const nameRe = params.nameRegexSource !== undefined && params.nameRegexFlags !== undefined ? new RegExp(params.nameRegexSource, params.nameRegexFlags) : undefined;
        const domainRe = params.domainRegexSource !== undefined && params.domainRegexFlags !== undefined ? new RegExp(params.domainRegexSource, params.domainRegexFlags) : undefined;
        const pathRe = params.pathRegexSource !== undefined && params.pathRegexFlags !== undefined ? new RegExp(params.pathRegexSource, params.pathRegexFlags) : undefined;
        await this._context.clearCookies({
            name: nameRe || params.name,
            domain: domainRe || params.domain,
            path: pathRe || params.path,
        });
    }
    async grantPermissions(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        await this._context.grantPermissions(params.permissions, params.origin);
    }
    async clearPermissions(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        await this._context.clearPermissions();
    }
    async setGeolocation(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        await this._context.setGeolocation(params.geolocation);
    }
    async setExtraHTTPHeaders(params, progress) {
        await this._context.setExtraHTTPHeaders(progress, params.headers);
    }
    async setOffline(params, progress) {
        await this._context.setOffline(progress, params.offline);
    }
    async setHTTPCredentials(params, progress) {
        // Note: this operation is deprecated, so we do not properly cleanup.
        await progress.race(this._context.setHTTPCredentials(params.httpCredentials));
    }
    async addInitScript(params, progress) {
        this._initScripts.push(await this._context.addInitScript(progress, params.source));
    }
    async setNetworkInterceptionPatterns(params, progress) {
        const hadMatchers = this._interceptionUrlMatchers.length > 0;
        if (!params.patterns.length) {
            // Note: it is important to remove the interceptor when there are no patterns,
            // because that disables the slow-path interception in the browser itself.
            if (hadMatchers)
                await this._context.removeRequestInterceptor(this._requestInterceptor);
            this._interceptionUrlMatchers = [];
        }
        else {
            this._interceptionUrlMatchers = params.patterns.map(urlMatch_1.deserializeURLMatch);
            if (!hadMatchers)
                await this._context.addRequestInterceptor(progress, this._requestInterceptor);
        }
    }
    async setWebSocketInterceptionPatterns(params, progress) {
        this._webSocketInterceptionPatterns = params.patterns;
        if (params.patterns.length && !this._routeWebSocketInitScript)
            this._routeWebSocketInitScript = await webSocketRouteDispatcher_1.WebSocketRouteDispatcher.install(progress, this.connection, this._context);
    }
    async storageState(params, progress) {
        return await progress.race(this._context.storageState(progress, params.indexedDB));
    }
    async setStorageState(params, progress) {
        await this._context.setStorageState(progress, params.storageState, 'api');
    }
    async close(params, progress) {
        progress.metadata.potentiallyClosesScope = true;
        await this._context.close(params);
    }
    async enableRecorder(params, progress) {
        await recorderApp_1.RecorderApp.show(this._context, params);
    }
    async disableRecorder(params, progress) {
        const recorder = await recorder_1.Recorder.existingForContext(this._context);
        if (recorder)
            recorder.setMode('none');
    }
    async exposeConsoleApi(params, progress) {
        await this._context.exposeConsoleApi();
    }
    async pause(params, progress) {
        // Debugger will take care of this.
    }
    async newCDPSession(params, progress) {
        if (!this._object._browser.options.isChromium)
            throw new Error(`CDP session is only available in Chromium`);
        if (!params.page && !params.frame || params.page && params.frame)
            throw new Error(`CDP session must be initiated with either Page or Frame, not none or both`);
        const crBrowserContext = this._object;
        return { session: new cdpSessionDispatcher_1.CDPSessionDispatcher(this, await progress.race(crBrowserContext.newCDPSession((params.page ? params.page : params.frame)._object))) };
    }
    async harStart(params, progress) {
        const harId = this._context.harStart(params.page ? params.page._object : null, params.options);
        return { harId };
    }
    async harExport(params, progress) {
        const artifact = await progress.race(this._context.harExport(params.harId));
        if (!artifact)
            throw new Error('No HAR artifact. Ensure record.harPath is set.');
        return { artifact: artifactDispatcher_1.ArtifactDispatcher.from(this, artifact) };
    }
    async clockFastForward(params, progress) {
        await this._context.clock.fastForward(progress, params.ticksString ?? params.ticksNumber ?? 0);
    }
    async clockInstall(params, progress) {
        await this._context.clock.install(progress, params.timeString ?? params.timeNumber ?? undefined);
    }
    async clockPauseAt(params, progress) {
        await this._context.clock.pauseAt(progress, params.timeString ?? params.timeNumber ?? 0);
        this._clockPaused = true;
    }
    async clockResume(params, progress) {
        await this._context.clock.resume(progress);
        this._clockPaused = false;
    }
    async clockRunFor(params, progress) {
        await this._context.clock.runFor(progress, params.ticksString ?? params.ticksNumber ?? 0);
    }
    async clockSetFixedTime(params, progress) {
        await this._context.clock.setFixedTime(progress, params.timeString ?? params.timeNumber ?? 0);
    }
    async clockSetSystemTime(params, progress) {
        await this._context.clock.setSystemTime(progress, params.timeString ?? params.timeNumber ?? 0);
    }
    async devtoolsStart(params, progress) {
        const url = await this._context.devtoolsStart();
        return { url };
    }
    async updateSubscription(params, progress) {
        if (params.enabled)
            this._subscriptions.add(params.event);
        else
            this._subscriptions.delete(params.event);
    }
    async registerSelectorEngine(params, progress) {
        this._object.selectors().register(params.selectorEngine);
    }
    async setTestIdAttributeName(params, progress) {
        this._object.selectors().setTestIdAttributeName(params.testIdAttributeName);
    }
    _onDispose() {
        // Avoid protocol calls for the closed context.
        if (this._context.isClosingOrClosed())
            return;
        // Cleanup properly and leave the page in a good state. Other clients may still connect and use it.
        this._context.dialogManager.removeDialogHandler(this._dialogHandler);
        this._interceptionUrlMatchers = [];
        this._context.removeRequestInterceptor(this._requestInterceptor).catch(() => { });
        this._context.removeExposedBindings(this._bindings).catch(() => { });
        this._bindings = [];
        this._context.removeInitScripts(this._initScripts).catch(() => { });
        this._initScripts = [];
        if (this._routeWebSocketInitScript)
            webSocketRouteDispatcher_1.WebSocketRouteDispatcher.uninstall(this.connection, this._context, this._routeWebSocketInitScript).catch(() => { });
        this._routeWebSocketInitScript = undefined;
        if (this._clockPaused)
            this._context.clock.resumeNoReply();
        this._clockPaused = false;
    }
}
exports.BrowserContextDispatcher = BrowserContextDispatcher;
