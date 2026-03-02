"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindingCallDispatcher = exports.WorkerDispatcher = exports.PageDispatcher = void 0;
const page_1 = require("../page");
const dispatcher_1 = require("./dispatcher");
const errors_1 = require("../errors");
const artifactDispatcher_1 = require("./artifactDispatcher");
const elementHandlerDispatcher_1 = require("./elementHandlerDispatcher");
const frameDispatcher_1 = require("./frameDispatcher");
const jsHandleDispatcher_1 = require("./jsHandleDispatcher");
const networkDispatchers_1 = require("./networkDispatchers");
const networkDispatchers_2 = require("./networkDispatchers");
const networkDispatchers_3 = require("./networkDispatchers");
const webSocketRouteDispatcher_1 = require("./webSocketRouteDispatcher");
const instrumentation_1 = require("../instrumentation");
const urlMatch_1 = require("../../utils/isomorphic/urlMatch");
const pageAgentDispatcher_1 = require("./pageAgentDispatcher");
class PageDispatcher extends dispatcher_1.Dispatcher {
    _type_EventTarget = true;
    _type_Page = true;
    _page;
    _subscriptions = new Set();
    _webSocketInterceptionPatterns = [];
    _bindings = [];
    _initScripts = [];
    _requestInterceptor;
    _interceptionUrlMatchers = [];
    _routeWebSocketInitScript;
    _locatorHandlers = new Set();
    _jsCoverageActive = false;
    _cssCoverageActive = false;
    static from(parentScope, page) {
        return PageDispatcher.fromNullable(parentScope, page);
    }
    static fromNullable(parentScope, page) {
        if (!page)
            return undefined;
        const result = parentScope.connection.existingDispatcher(page);
        return result || new PageDispatcher(parentScope, page);
    }
    constructor(parentScope, page) {
        // TODO: theoretically, there could be more than one frame already.
        // If we split pageCreated and pageReady, there should be no main frame during pageCreated.
        // We will reparent it to the page below using adopt.
        const mainFrame = frameDispatcher_1.FrameDispatcher.from(parentScope, page.mainFrame());
        super(parentScope, page, 'Page', {
            mainFrame,
            viewportSize: page.emulatedSize()?.viewport,
            isClosed: page.isClosed(),
            opener: PageDispatcher.fromNullable(parentScope, page.opener()),
            video: page.video ? createVideoDispatcher(parentScope, page.video) : undefined,
        });
        this.adopt(mainFrame);
        this._page = page;
        this._requestInterceptor = (route, request) => {
            const matchesSome = this._interceptionUrlMatchers.some(urlMatch => (0, urlMatch_1.urlMatches)(this._page.browserContext._options.baseURL, request.url(), urlMatch));
            if (!matchesSome) {
                route.continue({ isFallback: true }).catch(() => { });
                return;
            }
            this._dispatchEvent('route', { route: new networkDispatchers_3.RouteDispatcher(networkDispatchers_1.RequestDispatcher.from(this.parentScope(), request), route) });
        };
        this.addObjectListener(page_1.Page.Events.Close, () => {
            this._dispatchEvent('close');
            this._dispose();
        });
        this.addObjectListener(page_1.Page.Events.Crash, () => this._dispatchEvent('crash'));
        this.addObjectListener(page_1.Page.Events.Download, (download) => {
            // Artifact can outlive the page, so bind to the context scope.
            this._dispatchEvent('download', { url: download.url, suggestedFilename: download.suggestedFilename(), artifact: artifactDispatcher_1.ArtifactDispatcher.from(parentScope, download.artifact) });
        });
        this.addObjectListener(page_1.Page.Events.EmulatedSizeChanged, () => this._dispatchEvent('viewportSizeChanged', { viewportSize: page.emulatedSize()?.viewport }));
        this.addObjectListener(page_1.Page.Events.FileChooser, (fileChooser) => this._dispatchEvent('fileChooser', {
            element: elementHandlerDispatcher_1.ElementHandleDispatcher.from(mainFrame, fileChooser.element()),
            isMultiple: fileChooser.isMultiple()
        }));
        this.addObjectListener(page_1.Page.Events.FrameAttached, frame => this._onFrameAttached(frame));
        this.addObjectListener(page_1.Page.Events.FrameDetached, frame => this._onFrameDetached(frame));
        this.addObjectListener(page_1.Page.Events.LocatorHandlerTriggered, (uid) => this._dispatchEvent('locatorHandlerTriggered', { uid }));
        this.addObjectListener(page_1.Page.Events.WebSocket, webSocket => this._dispatchEvent('webSocket', { webSocket: new networkDispatchers_3.WebSocketDispatcher(this, webSocket) }));
        this.addObjectListener(page_1.Page.Events.Worker, worker => this._dispatchEvent('worker', { worker: new WorkerDispatcher(this, worker) }));
        // Ensure client knows about all frames.
        const frames = page.frameManager.frames();
        for (let i = 1; i < frames.length; i++)
            this._onFrameAttached(frames[i]);
    }
    page() {
        return this._page;
    }
    async exposeBinding(params, progress) {
        const binding = await this._page.exposeBinding(progress, params.name, !!params.needsHandle, (source, ...args) => {
            // When reusing the context, we might have some bindings called late enough,
            // after context and page dispatchers have been disposed.
            if (this._disposed)
                return;
            const binding = new BindingCallDispatcher(this, params.name, !!params.needsHandle, source, args);
            this._dispatchEvent('bindingCall', { binding });
            return binding.promise();
        });
        this._bindings.push(binding);
    }
    async setExtraHTTPHeaders(params, progress) {
        await this._page.setExtraHTTPHeaders(progress, params.headers);
    }
    async reload(params, progress) {
        return { response: networkDispatchers_2.ResponseDispatcher.fromNullable(this.parentScope(), await this._page.reload(progress, params)) };
    }
    async goBack(params, progress) {
        return { response: networkDispatchers_2.ResponseDispatcher.fromNullable(this.parentScope(), await this._page.goBack(progress, params)) };
    }
    async goForward(params, progress) {
        return { response: networkDispatchers_2.ResponseDispatcher.fromNullable(this.parentScope(), await this._page.goForward(progress, params)) };
    }
    async requestGC(params, progress) {
        await progress.race(this._page.requestGC());
    }
    async registerLocatorHandler(params, progress) {
        const uid = this._page.registerLocatorHandler(params.selector, params.noWaitAfter);
        this._locatorHandlers.add(uid);
        return { uid };
    }
    async resolveLocatorHandlerNoReply(params, progress) {
        this._page.resolveLocatorHandler(params.uid, params.remove);
    }
    async unregisterLocatorHandler(params, progress) {
        this._page.unregisterLocatorHandler(params.uid);
        this._locatorHandlers.delete(params.uid);
    }
    async emulateMedia(params, progress) {
        await this._page.emulateMedia(progress, {
            media: params.media,
            colorScheme: params.colorScheme,
            reducedMotion: params.reducedMotion,
            forcedColors: params.forcedColors,
            contrast: params.contrast,
        });
    }
    async setViewportSize(params, progress) {
        await this._page.setViewportSize(progress, params.viewportSize);
    }
    async addInitScript(params, progress) {
        this._initScripts.push(await this._page.addInitScript(progress, params.source));
    }
    async setNetworkInterceptionPatterns(params, progress) {
        const hadMatchers = this._interceptionUrlMatchers.length > 0;
        if (!params.patterns.length) {
            // Note: it is important to remove the interceptor when there are no patterns,
            // because that disables the slow-path interception in the browser itself.
            if (hadMatchers)
                await this._page.removeRequestInterceptor(this._requestInterceptor);
            this._interceptionUrlMatchers = [];
        }
        else {
            this._interceptionUrlMatchers = params.patterns.map(urlMatch_1.deserializeURLMatch);
            if (!hadMatchers)
                await this._page.addRequestInterceptor(progress, this._requestInterceptor);
        }
    }
    async setWebSocketInterceptionPatterns(params, progress) {
        this._webSocketInterceptionPatterns = params.patterns;
        if (params.patterns.length && !this._routeWebSocketInitScript)
            this._routeWebSocketInitScript = await webSocketRouteDispatcher_1.WebSocketRouteDispatcher.install(progress, this.connection, this._page);
    }
    async expectScreenshot(params, progress) {
        const mask = (params.mask || []).map(({ frame, selector }) => ({
            frame: frame._object,
            selector,
        }));
        const locator = params.locator ? {
            frame: params.locator.frame._object,
            selector: params.locator.selector,
        } : undefined;
        return await this._page.expectScreenshot(progress, {
            ...params,
            locator,
            mask,
        });
    }
    async screenshot(params, progress) {
        const mask = (params.mask || []).map(({ frame, selector }) => ({
            frame: frame._object,
            selector,
        }));
        return { binary: await this._page.screenshot(progress, { ...params, mask }) };
    }
    async close(params, progress) {
        if (!params.runBeforeUnload)
            progress.metadata.potentiallyClosesScope = true;
        await this._page.close(params);
    }
    async updateSubscription(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        if (params.event === 'fileChooser')
            await this._page.setFileChooserInterceptedBy(params.enabled, this);
        if (params.enabled)
            this._subscriptions.add(params.event);
        else
            this._subscriptions.delete(params.event);
    }
    async keyboardDown(params, progress) {
        await this._page.keyboard.down(progress, params.key);
    }
    async keyboardUp(params, progress) {
        await this._page.keyboard.up(progress, params.key);
    }
    async keyboardInsertText(params, progress) {
        await this._page.keyboard.insertText(progress, params.text);
    }
    async keyboardType(params, progress) {
        await this._page.keyboard.type(progress, params.text, params);
    }
    async keyboardPress(params, progress) {
        await this._page.keyboard.press(progress, params.key, params);
    }
    async clearConsoleMessages(params, progress) {
        this._page.clearConsoleMessages();
    }
    async consoleMessages(params, progress) {
        // Send all future console messages to the client, so that it can reliably receive all of them.
        // Otherwise, if subscription is added in a different task from this call (either before or after),
        // there is a chance for a duplicate or a lost console message.
        this._subscriptions.add('console');
        return { messages: this._page.consoleMessages().map(message => this.parentScope().serializeConsoleMessage(message, this)) };
    }
    async clearPageErrors(params, progress) {
        this._page.clearPageErrors();
    }
    async pageErrors(params, progress) {
        return { errors: this._page.pageErrors().map(error => (0, errors_1.serializeError)(error)) };
    }
    async mouseMove(params, progress) {
        progress.metadata.point = { x: params.x, y: params.y };
        await this._page.mouse.move(progress, params.x, params.y, params);
    }
    async mouseDown(params, progress) {
        progress.metadata.point = this._page.mouse.currentPoint();
        await this._page.mouse.down(progress, params);
    }
    async mouseUp(params, progress) {
        progress.metadata.point = this._page.mouse.currentPoint();
        await this._page.mouse.up(progress, params);
    }
    async mouseClick(params, progress) {
        progress.metadata.point = { x: params.x, y: params.y };
        await this._page.mouse.click(progress, params.x, params.y, params);
    }
    async mouseWheel(params, progress) {
        await this._page.mouse.wheel(progress, params.deltaX, params.deltaY);
    }
    async touchscreenTap(params, progress) {
        progress.metadata.point = { x: params.x, y: params.y };
        await this._page.touchscreen.tap(progress, params.x, params.y);
    }
    async pdf(params, progress) {
        if (!this._page.pdf)
            throw new Error('PDF generation is only supported for Headless Chromium');
        const buffer = await progress.race(this._page.pdf(params));
        return { pdf: buffer };
    }
    async requests(params, progress) {
        // Send all future requests to the client, so that it can reliably receive all of them.
        // Otherwise, if subscription is added in a different task from this call (either before or after),
        // there is a chance for a duplicate or a lost request.
        this._subscriptions.add('request');
        return { requests: this._page.networkRequests().map(request => networkDispatchers_1.RequestDispatcher.from(this.parentScope(), request)) };
    }
    async snapshotForAI(params, progress) {
        return await this._page.snapshotForAI(progress, params);
    }
    async bringToFront(params, progress) {
        await progress.race(this._page.bringToFront());
    }
    async videoStart(params, progress) {
        const artifact = await this._page.screencast.startExplicitVideoRecording(params);
        return { artifact: createVideoDispatcher(this.parentScope(), artifact) };
    }
    async videoStop(params, progress) {
        await this._page.screencast.stopExplicitVideoRecording();
    }
    async startJSCoverage(params, progress) {
        const coverage = this._page.coverage;
        await coverage.startJSCoverage(progress, params);
        this._jsCoverageActive = true;
    }
    async stopJSCoverage(params, progress) {
        this._jsCoverageActive = false;
        const coverage = this._page.coverage;
        return await coverage.stopJSCoverage();
    }
    async startCSSCoverage(params, progress) {
        const coverage = this._page.coverage;
        await coverage.startCSSCoverage(progress, params);
        this._cssCoverageActive = true;
    }
    async stopCSSCoverage(params, progress) {
        this._cssCoverageActive = false;
        const coverage = this._page.coverage;
        return await coverage.stopCSSCoverage();
    }
    async agent(params, progress) {
        return { agent: new pageAgentDispatcher_1.PageAgentDispatcher(this, params) };
    }
    _onFrameAttached(frame) {
        this._dispatchEvent('frameAttached', { frame: frameDispatcher_1.FrameDispatcher.from(this.parentScope(), frame) });
    }
    _onFrameDetached(frame) {
        this._dispatchEvent('frameDetached', { frame: frameDispatcher_1.FrameDispatcher.from(this.parentScope(), frame) });
    }
    _onDispose() {
        // Avoid protocol calls for the closed page.
        if (this._page.isClosedOrClosingOrCrashed())
            return;
        // Cleanup properly and leave the page in a good state. Other clients may still connect and use it.
        this._interceptionUrlMatchers = [];
        this._page.removeRequestInterceptor(this._requestInterceptor).catch(() => { });
        this._page.removeExposedBindings(this._bindings).catch(() => { });
        this._bindings = [];
        this._page.removeInitScripts(this._initScripts).catch(() => { });
        this._initScripts = [];
        if (this._routeWebSocketInitScript)
            webSocketRouteDispatcher_1.WebSocketRouteDispatcher.uninstall(this.connection, this._page, this._routeWebSocketInitScript).catch(() => { });
        this._routeWebSocketInitScript = undefined;
        for (const uid of this._locatorHandlers)
            this._page.unregisterLocatorHandler(uid);
        this._locatorHandlers.clear();
        this._page.setFileChooserInterceptedBy(false, this).catch(() => { });
        if (this._jsCoverageActive)
            this._page.coverage.stopJSCoverage().catch(() => { });
        this._jsCoverageActive = false;
        if (this._cssCoverageActive)
            this._page.coverage.stopCSSCoverage().catch(() => { });
        this._cssCoverageActive = false;
    }
    async setDockTile(params) {
        await this._page.setDockTile(params.image);
    }
}
exports.PageDispatcher = PageDispatcher;
class WorkerDispatcher extends dispatcher_1.Dispatcher {
    _type_Worker = true;
    _type_EventTarget = true;
    _subscriptions = new Set();
    static fromNullable(scope, worker) {
        if (!worker)
            return undefined;
        const result = scope.connection.existingDispatcher(worker);
        return result || new WorkerDispatcher(scope, worker);
    }
    constructor(scope, worker) {
        super(scope, worker, 'Worker', {
            url: worker.url
        });
        this.addObjectListener(page_1.Worker.Events.Close, () => this._dispatchEvent('close'));
    }
    async evaluateExpression(params, progress) {
        return { value: (0, jsHandleDispatcher_1.serializeResult)(await progress.race(this._object.evaluateExpression(params.expression, params.isFunction, (0, jsHandleDispatcher_1.parseArgument)(params.arg)))) };
    }
    async evaluateExpressionHandle(params, progress) {
        return { handle: jsHandleDispatcher_1.JSHandleDispatcher.fromJSHandle(this, await progress.race(this._object.evaluateExpressionHandle(params.expression, params.isFunction, (0, jsHandleDispatcher_1.parseArgument)(params.arg)))) };
    }
    async updateSubscription(params, progress) {
        if (params.enabled)
            this._subscriptions.add(params.event);
        else
            this._subscriptions.delete(params.event);
    }
}
exports.WorkerDispatcher = WorkerDispatcher;
class BindingCallDispatcher extends dispatcher_1.Dispatcher {
    _type_BindingCall = true;
    _resolve;
    _reject;
    _promise;
    constructor(scope, name, needsHandle, source, args) {
        const frameDispatcher = frameDispatcher_1.FrameDispatcher.from(scope.parentScope(), source.frame);
        super(scope, new instrumentation_1.SdkObject(scope._object, 'bindingCall'), 'BindingCall', {
            frame: frameDispatcher,
            name,
            args: needsHandle ? undefined : args.map(jsHandleDispatcher_1.serializeResult),
            handle: needsHandle ? elementHandlerDispatcher_1.ElementHandleDispatcher.fromJSOrElementHandle(frameDispatcher, args[0]) : undefined,
        });
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    promise() {
        return this._promise;
    }
    async resolve(params, progress) {
        this._resolve((0, jsHandleDispatcher_1.parseArgument)(params.result));
        this._dispose();
    }
    async reject(params, progress) {
        this._reject((0, errors_1.parseError)(params.error));
        this._dispose();
    }
}
exports.BindingCallDispatcher = BindingCallDispatcher;
function createVideoDispatcher(parentScope, video) {
    // Note: Video must outlive Page and BrowserContext, so that client can saveAs it
    // after closing the context. We use |scope| for it.
    return artifactDispatcher_1.ArtifactDispatcher.from(parentScope.parentScope(), video);
}
