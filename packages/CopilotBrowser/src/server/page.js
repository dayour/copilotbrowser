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
exports.InitScript = exports.PageBinding = exports.Worker = exports.WorkerEvent = exports.Page = void 0;
const browserContext_1 = require("./browserContext");
const console_1 = require("./console");
const errors_1 = require("./errors");
const fileChooser_1 = require("./fileChooser");
const frames = __importStar(require("./frames"));
const helper_1 = require("./helper");
const input = __importStar(require("./input"));
const instrumentation_1 = require("./instrumentation");
const js = __importStar(require("./javascript"));
const screenshotter_1 = require("./screenshotter");
const utils_1 = require("../utils");
const utils_2 = require("../utils");
const comparators_1 = require("./utils/comparators");
const debugLogger_1 = require("./utils/debugLogger");
const selectorParser_1 = require("../utils/isomorphic/selectorParser");
const manualPromise_1 = require("../utils/isomorphic/manualPromise");
const utilityScriptSerializers_1 = require("../utils/isomorphic/utilityScriptSerializers");
const callLog_1 = require("./callLog");
const rawBindingsControllerSource = __importStar(require("../generated/bindingsControllerSource"));
const screencast_1 = require("./screencast");
const PageEvent = {
    Close: 'close',
    Crash: 'crash',
    Download: 'download',
    EmulatedSizeChanged: 'emulatedsizechanged',
    FileChooser: 'filechooser',
    FrameAttached: 'frameattached',
    FrameDetached: 'framedetached',
    InternalFrameNavigatedToNewDocument: 'internalframenavigatedtonewdocument',
    LocatorHandlerTriggered: 'locatorhandlertriggered',
    ScreencastFrame: 'screencastframe',
    WebSocket: 'websocket',
    Worker: 'worker',
};
class Page extends instrumentation_1.SdkObject {
    static Events = PageEvent;
    _closedState = 'open';
    _closedPromise = new manualPromise_1.ManualPromise();
    _initialized;
    _initializedPromise = new manualPromise_1.ManualPromise();
    _consoleMessages = [];
    _pageErrors = [];
    _crashed = false;
    openScope = new utils_1.LongStandingScope();
    browserContext;
    keyboard;
    mouse;
    touchscreen;
    delegate;
    _emulatedSize;
    _extraHTTPHeaders;
    _emulatedMedia = {};
    _fileChooserInterceptedBy = new Set();
    _pageBindings = new Map();
    initScripts = [];
    screenshotter;
    frameManager;
    _workers = new Map();
    pdf;
    coverage;
    requestInterceptors = [];
    video;
    _opener;
    isStorageStatePage;
    _locatorHandlers = new Map();
    _lastLocatorHandlerUid = 0;
    _locatorHandlerRunningCounter = 0;
    _networkRequests = [];
    screencast;
    _closeReason;
    constructor(delegate, browserContext) {
        super(browserContext, 'page');
        this.attribution.page = this;
        this.delegate = delegate;
        this.browserContext = browserContext;
        this.keyboard = new input.Keyboard(delegate.rawKeyboard, this);
        this.mouse = new input.Mouse(delegate.rawMouse, this);
        this.touchscreen = new input.Touchscreen(delegate.rawTouchscreen, this);
        this.screenshotter = new screenshotter_1.Screenshotter(this);
        this.frameManager = new frames.FrameManager(this);
        this.screencast = new screencast_1.Screencast(this);
        if (delegate.pdf)
            this.pdf = delegate.pdf.bind(delegate);
        this.coverage = delegate.coverage ? delegate.coverage() : null;
        this.isStorageStatePage = browserContext.isCreatingStorageStatePage();
    }
    async reportAsNew(opener, error) {
        if (opener) {
            const openerPageOrError = await opener.waitForInitializedOrError();
            if (openerPageOrError instanceof Page && !openerPageOrError.isClosed())
                this._opener = openerPageOrError;
        }
        this._markInitialized(error);
    }
    _markInitialized(error = undefined) {
        if (error) {
            // Initialization error could have happened because of
            // context/browser closure. Just ignore the page.
            if (this.browserContext.isClosingOrClosed())
                return;
            this.frameManager.createDummyMainFrameIfNeeded();
        }
        this._initialized = error || this;
        this.emitOnContext(browserContext_1.BrowserContext.Events.Page, this);
        for (const pageError of this._pageErrors)
            this.emitOnContext(browserContext_1.BrowserContext.Events.PageError, pageError, this);
        for (const message of this._consoleMessages)
            this.emitOnContext(browserContext_1.BrowserContext.Events.Console, message);
        // It may happen that page initialization finishes after Close event has already been sent,
        // in that case we fire another Close event to ensure that each reported Page will have
        // corresponding Close event after it is reported on the context.
        if (this.isClosed())
            this.emit(Page.Events.Close);
        else
            this.instrumentation.onPageOpen(this);
        // Note: it is important to resolve _initializedPromise at the end,
        // so that anyone who awaits waitForInitializedOrError got a ready and reported page.
        this._initializedPromise.resolve(this._initialized);
    }
    initializedOrUndefined() {
        return this._initialized ? this : undefined;
    }
    waitForInitializedOrError() {
        return this._initializedPromise;
    }
    emitOnContext(event, ...args) {
        if (this.isStorageStatePage)
            return;
        this.browserContext.emit(event, ...args);
    }
    async resetForReuse(progress) {
        // Re-navigate once init scripts are gone.
        await this.mainFrame().gotoImpl(progress, 'about:blank', {});
        this._emulatedSize = undefined;
        this._emulatedMedia = {};
        this._extraHTTPHeaders = undefined;
        await Promise.all([
            this.delegate.updateEmulatedViewportSize(),
            this.delegate.updateEmulateMedia(),
            this.delegate.updateExtraHTTPHeaders(),
        ]);
        await this.delegate.resetForReuse(progress);
    }
    _didClose() {
        this.frameManager.dispose();
        this.screencast.stopFrameThrottler();
        (0, utils_1.assert)(this._closedState !== 'closed', 'Page closed twice');
        this._closedState = 'closed';
        this.emit(Page.Events.Close);
        this.browserContext.emit(browserContext_1.BrowserContext.Events.PageClosed, this);
        this._closedPromise.resolve();
        this.instrumentation.onPageClose(this);
        this.openScope.close(new errors_1.TargetClosedError(this.closeReason()));
    }
    _didCrash() {
        this.frameManager.dispose();
        this.screencast.stopFrameThrottler();
        this.emit(Page.Events.Crash);
        this._crashed = true;
        this.instrumentation.onPageClose(this);
        this.openScope.close(new Error('Page crashed'));
    }
    async _onFileChooserOpened(handle) {
        let multiple;
        try {
            multiple = await handle.evaluate(element => !!element.multiple);
        }
        catch (e) {
            // Frame/context may be gone during async processing. Do not throw.
            return;
        }
        if (!this.listenerCount(Page.Events.FileChooser)) {
            handle.dispose();
            return;
        }
        const fileChooser = new fileChooser_1.FileChooser(this, handle, multiple);
        this.emit(Page.Events.FileChooser, fileChooser);
    }
    opener() {
        return this._opener;
    }
    mainFrame() {
        return this.frameManager.mainFrame();
    }
    frames() {
        return this.frameManager.frames();
    }
    async exposeBinding(progress, name, needsHandle, copilotbrowserBinding) {
        if (this._pageBindings.has(name))
            throw new Error(`Function "${name}" has been already registered`);
        if (this.browserContext._pageBindings.has(name))
            throw new Error(`Function "${name}" has been already registered in the browser context`);
        await progress.race(this.browserContext.exposecopilotbrowserBindingIfNeeded());
        const binding = new PageBinding(name, copilotbrowserBinding, needsHandle);
        this._pageBindings.set(name, binding);
        try {
            await progress.race(this.delegate.addInitScript(binding.initScript));
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
        await this.delegate.removeInitScripts(bindings.map(binding => binding.initScript));
        const cleanup = bindings.map(binding => `{ ${binding.cleanupScript} };\n`).join('');
        await this.safeNonStallingEvaluateInAllFrames(cleanup, 'main');
    }
    async setExtraHTTPHeaders(progress, headers) {
        const oldHeaders = this._extraHTTPHeaders;
        try {
            this._extraHTTPHeaders = headers;
            await progress.race(this.delegate.updateExtraHTTPHeaders());
        }
        catch (error) {
            this._extraHTTPHeaders = oldHeaders;
            // Note: no await, headers will be updated in the background as soon as possible.
            this.delegate.updateExtraHTTPHeaders().catch(() => { });
            throw error;
        }
    }
    extraHTTPHeaders() {
        return this._extraHTTPHeaders;
    }
    addNetworkRequest(request) {
        this._networkRequests.push(request);
        ensureArrayLimit(this._networkRequests, 100);
    }
    networkRequests() {
        return this._networkRequests;
    }
    async onBindingCalled(payload, context) {
        if (this._closedState === 'closed')
            return;
        await PageBinding.dispatch(this, payload, context);
    }
    addConsoleMessage(worker, type, args, location, text, timestamp) {
        const message = new console_1.ConsoleMessage(this, worker, type, text, args, location, timestamp);
        const intercepted = this.frameManager.interceptConsoleMessage(message);
        if (intercepted) {
            args.forEach(arg => arg.dispose());
            return;
        }
        this._consoleMessages.push(message);
        ensureArrayLimit(this._consoleMessages, 200); // Avoid unbounded memory growth.
        // Console messages may come before the page is ready. In this case,
        // we'll dispatch them to the client later, either on the live Page,
        // or on the "errored" Page.
        if (this._initialized)
            this.emitOnContext(browserContext_1.BrowserContext.Events.Console, message);
    }
    clearConsoleMessages() {
        this._consoleMessages.length = 0;
    }
    consoleMessages() {
        return this._consoleMessages;
    }
    addPageError(pageError) {
        this._pageErrors.push(pageError);
        ensureArrayLimit(this._pageErrors, 200); // Avoid unbounded memory growth.
        // Page errors may come before the page is ready. In this case,
        // we'll dispatch them to the client later, either on the live Page,
        // or on the "errored" Page.
        if (this._initialized)
            this.emitOnContext(browserContext_1.BrowserContext.Events.PageError, pageError, this);
    }
    clearPageErrors() {
        this._pageErrors.length = 0;
    }
    pageErrors() {
        return this._pageErrors;
    }
    async reload(progress, options) {
        return this.mainFrame().raceNavigationAction(progress, async () => {
            // Note: waitForNavigation may fail before we get response to reload(),
            // so we should await it immediately.
            const [response] = await Promise.all([
                // Reload must be a new document, and should not be confused with a stray pushState.
                this.mainFrame()._waitForNavigation(progress, true /* requiresNewDocument */, options),
                progress.race(this.delegate.reload()),
            ]);
            return response;
        });
    }
    async goBack(progress, options) {
        return this.mainFrame().raceNavigationAction(progress, async () => {
            // Note: waitForNavigation may fail before we get response to goBack,
            // so we should catch it immediately.
            let error;
            const waitPromise = this.mainFrame()._waitForNavigation(progress, false /* requiresNewDocument */, options).catch(e => {
                error = e;
                return null;
            });
            const result = await progress.race(this.delegate.goBack());
            if (!result) {
                waitPromise.catch(() => { }); // Avoid an unhandled rejection.
                return null;
            }
            const response = await waitPromise;
            if (error)
                throw error;
            return response;
        });
    }
    async goForward(progress, options) {
        return this.mainFrame().raceNavigationAction(progress, async () => {
            // Note: waitForNavigation may fail before we get response to goForward,
            // so we should catch it immediately.
            let error;
            const waitPromise = this.mainFrame()._waitForNavigation(progress, false /* requiresNewDocument */, options).catch(e => {
                error = e;
                return null;
            });
            const result = await progress.race(this.delegate.goForward());
            if (!result) {
                waitPromise.catch(() => { }); // Avoid an unhandled rejection.
                return null;
            }
            const response = await waitPromise;
            if (error)
                throw error;
            return response;
        });
    }
    requestGC() {
        return this.delegate.requestGC();
    }
    registerLocatorHandler(selector, noWaitAfter) {
        const uid = ++this._lastLocatorHandlerUid;
        this._locatorHandlers.set(uid, { selector, noWaitAfter });
        return uid;
    }
    resolveLocatorHandler(uid, remove) {
        const handler = this._locatorHandlers.get(uid);
        if (remove)
            this._locatorHandlers.delete(uid);
        if (handler) {
            handler.resolved?.resolve();
            handler.resolved = undefined;
        }
    }
    unregisterLocatorHandler(uid) {
        this._locatorHandlers.delete(uid);
    }
    async performActionPreChecks(progress) {
        await this._performWaitForNavigationCheck(progress);
        await this._performLocatorHandlersCheckpoint(progress);
        // Wait once again, just in case a locator handler caused a navigation.
        await this._performWaitForNavigationCheck(progress);
    }
    async _performWaitForNavigationCheck(progress) {
        if (process.env.copilotbrowser_SKIP_NAVIGATION_CHECK)
            return;
        const mainFrame = this.frameManager.mainFrame();
        if (!mainFrame || !mainFrame.pendingDocument())
            return;
        const url = mainFrame.pendingDocument()?.request?.url();
        const toUrl = url ? `" ${(0, utils_1.trimStringWithEllipsis)(url, 200)}"` : '';
        progress.log(`  waiting for${toUrl} navigation to finish...`);
        await helper_1.helper.waitForEvent(progress, mainFrame, frames.Frame.Events.InternalNavigation, (e) => {
            if (!e.isPublic)
                return false;
            if (!e.error)
                progress.log(`  navigated to "${(0, utils_1.trimStringWithEllipsis)(mainFrame.url(), 200)}"`);
            return true;
        }).promise;
    }
    async _performLocatorHandlersCheckpoint(progress) {
        // Do not run locator handlers from inside locator handler callbacks to avoid deadlocks.
        if (this._locatorHandlerRunningCounter)
            return;
        for (const [uid, handler] of this._locatorHandlers) {
            if (!handler.resolved) {
                if (await this.mainFrame().isVisibleInternal(progress, handler.selector, { strict: true })) {
                    handler.resolved = new manualPromise_1.ManualPromise();
                    this.emit(Page.Events.LocatorHandlerTriggered, uid);
                }
            }
            if (handler.resolved) {
                ++this._locatorHandlerRunningCounter;
                progress.log(`  found ${(0, utils_2.asLocator)(this.browserContext._browser.sdkLanguage(), handler.selector)}, intercepting action to run the handler`);
                const promise = handler.resolved.then(async () => {
                    if (!handler.noWaitAfter) {
                        progress.log(`  locator handler has finished, waiting for ${(0, utils_2.asLocator)(this.browserContext._browser.sdkLanguage(), handler.selector)} to be hidden`);
                        await this.mainFrame().waitForSelector(progress, handler.selector, false, { state: 'hidden' });
                    }
                    else {
                        progress.log(`  locator handler has finished`);
                    }
                });
                await progress.race(this.openScope.race(promise)).finally(() => --this._locatorHandlerRunningCounter);
                progress.log(`  interception handler has finished, continuing`);
            }
        }
    }
    async emulateMedia(progress, options) {
        const oldEmulatedMedia = { ...this._emulatedMedia };
        if (options.media !== undefined)
            this._emulatedMedia.media = options.media;
        if (options.colorScheme !== undefined)
            this._emulatedMedia.colorScheme = options.colorScheme;
        if (options.reducedMotion !== undefined)
            this._emulatedMedia.reducedMotion = options.reducedMotion;
        if (options.forcedColors !== undefined)
            this._emulatedMedia.forcedColors = options.forcedColors;
        if (options.contrast !== undefined)
            this._emulatedMedia.contrast = options.contrast;
        try {
            await progress.race(this.delegate.updateEmulateMedia());
        }
        catch (error) {
            this._emulatedMedia = oldEmulatedMedia;
            // Note: no await, emulated media will be updated in the background as soon as possible.
            this.delegate.updateEmulateMedia().catch(() => { });
            throw error;
        }
    }
    emulatedMedia() {
        const contextOptions = this.browserContext._options;
        return {
            media: this._emulatedMedia.media || 'no-override',
            colorScheme: this._emulatedMedia.colorScheme !== undefined ? this._emulatedMedia.colorScheme : contextOptions.colorScheme ?? 'light',
            reducedMotion: this._emulatedMedia.reducedMotion !== undefined ? this._emulatedMedia.reducedMotion : contextOptions.reducedMotion ?? 'no-preference',
            forcedColors: this._emulatedMedia.forcedColors !== undefined ? this._emulatedMedia.forcedColors : contextOptions.forcedColors ?? 'none',
            contrast: this._emulatedMedia.contrast !== undefined ? this._emulatedMedia.contrast : contextOptions.contrast ?? 'no-preference',
        };
    }
    async setViewportSize(progress, viewportSize) {
        const oldEmulatedSize = this._emulatedSize;
        try {
            this._setEmulatedSize({ viewport: { ...viewportSize }, screen: { ...viewportSize } });
            await progress.race(this.delegate.updateEmulatedViewportSize());
        }
        catch (error) {
            this._emulatedSize = oldEmulatedSize;
            // Note: no await, emulated size will be updated in the background as soon as possible.
            this.delegate.updateEmulatedViewportSize().catch(() => { });
            throw error;
        }
    }
    setEmulatedSizeFromWindowOpen(emulatedSize) {
        this._setEmulatedSize(emulatedSize);
    }
    _setEmulatedSize(emulatedSize) {
        this._emulatedSize = emulatedSize;
        this.emit(Page.Events.EmulatedSizeChanged);
    }
    emulatedSize() {
        if (this._emulatedSize)
            return this._emulatedSize;
        const contextOptions = this.browserContext._options;
        return contextOptions.viewport ? { viewport: contextOptions.viewport, screen: contextOptions.screen || contextOptions.viewport } : undefined;
    }
    async bringToFront() {
        await this.delegate.bringToFront();
    }
    async addInitScript(progress, source) {
        const initScript = new InitScript(source);
        this.initScripts.push(initScript);
        try {
            await progress.race(this.delegate.addInitScript(initScript));
        }
        catch (error) {
            // Note: no await, script will be removed in the background as soon as possible.
            this.removeInitScripts([initScript]).catch(() => { });
            throw error;
        }
        return initScript;
    }
    async removeInitScripts(initScripts) {
        const set = new Set(initScripts);
        this.initScripts = this.initScripts.filter(script => !set.has(script));
        await this.delegate.removeInitScripts(initScripts);
    }
    needsRequestInterception() {
        return this.requestInterceptors.length > 0 || this.browserContext.requestInterceptors.length > 0;
    }
    async addRequestInterceptor(progress, handler, prepend) {
        // Note: progress is intentionally ignored, because this operation is not cancellable and should not block in the browser anyway.
        if (prepend)
            this.requestInterceptors.unshift(handler);
        else
            this.requestInterceptors.push(handler);
        await this.delegate.updateRequestInterception();
    }
    async removeRequestInterceptor(handler) {
        const index = this.requestInterceptors.indexOf(handler);
        if (index === -1)
            return;
        this.requestInterceptors.splice(index, 1);
        await this.browserContext.notifyRoutesInFlightAboutRemovedHandler(handler);
        await this.delegate.updateRequestInterception();
    }
    async expectScreenshot(progress, options) {
        const locator = options.locator;
        const rafrafScreenshot = locator ? async (timeout) => {
            return await locator.frame.rafrafTimeoutScreenshotElementWithProgress(progress, locator.selector, timeout, options || {});
        } : async (timeout) => {
            await this.performActionPreChecks(progress);
            await this.mainFrame().rafrafTimeout(progress, timeout);
            return await this.screenshotter.screenshotPage(progress, options || {});
        };
        const comparator = (0, comparators_1.getComparator)('image/png');
        if (!options.expected && options.isNot)
            return { errorMessage: '"not" matcher requires expected result' };
        try {
            const format = (0, screenshotter_1.validateScreenshotOptions)(options || {});
            if (format !== 'png')
                throw new Error('Only PNG screenshots are supported');
        }
        catch (error) {
            return { errorMessage: error.message };
        }
        let intermediateResult;
        const areEqualScreenshots = (actual, expected, previous) => {
            const comparatorResult = actual && expected ? comparator(actual, expected, options) : undefined;
            if (comparatorResult !== undefined && !!comparatorResult === !!options.isNot)
                return true;
            if (comparatorResult)
                intermediateResult = { errorMessage: comparatorResult.errorMessage, diff: comparatorResult.diff, actual, previous };
            return false;
        };
        try {
            let actual;
            let previous;
            const pollIntervals = [0, 100, 250, 500];
            progress.log(`${(0, utils_1.renderTitleForCall)(progress.metadata)}${options.timeout ? ` with timeout ${options.timeout}ms` : ''}`);
            if (options.expected)
                progress.log(`  verifying given screenshot expectation`);
            else
                progress.log(`  generating new stable screenshot expectation`);
            let isFirstIteration = true;
            while (true) {
                if (this.isClosed())
                    throw new Error('The page has closed');
                const screenshotTimeout = pollIntervals.shift() ?? 1000;
                if (screenshotTimeout)
                    progress.log(`waiting ${screenshotTimeout}ms before taking screenshot`);
                previous = actual;
                actual = await rafrafScreenshot(screenshotTimeout).catch(e => {
                    if (this.mainFrame().isNonRetriableError(e))
                        throw e;
                    progress.log(`failed to take screenshot - ` + e.message);
                    return undefined;
                });
                if (!actual)
                    continue;
                // Compare against expectation for the first iteration.
                const expectation = options.expected && isFirstIteration ? options.expected : previous;
                if (areEqualScreenshots(actual, expectation, previous))
                    break;
                if (intermediateResult)
                    progress.log(intermediateResult.errorMessage);
                isFirstIteration = false;
            }
            if (!isFirstIteration)
                progress.log(`captured a stable screenshot`);
            if (!options.expected)
                return { actual };
            if (isFirstIteration) {
                progress.log(`screenshot matched expectation`);
                return {};
            }
            if (areEqualScreenshots(actual, options.expected, undefined)) {
                progress.log(`screenshot matched expectation`);
                return {};
            }
            throw new Error(intermediateResult.errorMessage);
        }
        catch (e) {
            // Q: Why not throw upon isNonRetriableError(e) as in other places?
            // A: We want user to receive a friendly diff between actual and expected/previous.
            if (js.isJavaScriptErrorInEvaluate(e) || (0, selectorParser_1.isInvalidSelectorError)(e))
                throw e;
            let errorMessage = e.message;
            if (e instanceof errors_1.TimeoutError && intermediateResult?.previous)
                errorMessage = `Failed to take two consecutive stable screenshots.`;
            return {
                log: (0, callLog_1.compressCallLog)(e.message ? [...progress.metadata.log, e.message] : progress.metadata.log),
                ...intermediateResult,
                errorMessage,
                timedOut: (e instanceof errors_1.TimeoutError),
            };
        }
    }
    async screenshot(progress, options) {
        return await this.screenshotter.screenshotPage(progress, options);
    }
    async close(options = {}) {
        if (this._closedState === 'closed')
            return;
        if (options.reason)
            this._closeReason = options.reason;
        const runBeforeUnload = !!options.runBeforeUnload;
        if (this._closedState !== 'closing') {
            // If runBeforeUnload is true, we don't know if we will close, so don't modify the state
            if (!runBeforeUnload)
                this._closedState = 'closing';
            // This might throw if the browser context containing the page closes
            // while we are trying to close the page.
            await this.delegate.closePage(runBeforeUnload).catch(e => debugLogger_1.debugLogger.log('error', e));
        }
        if (!runBeforeUnload)
            await this._closedPromise;
    }
    isClosed() {
        return this._closedState === 'closed';
    }
    hasCrashed() {
        return this._crashed;
    }
    isClosedOrClosingOrCrashed() {
        return this._closedState !== 'open' || this._crashed;
    }
    addWorker(workerId, worker) {
        this._workers.set(workerId, worker);
        this.emit(Page.Events.Worker, worker);
    }
    removeWorker(workerId) {
        const worker = this._workers.get(workerId);
        if (!worker)
            return;
        worker.didClose();
        this._workers.delete(workerId);
    }
    clearWorkers() {
        for (const [workerId, worker] of this._workers) {
            worker.didClose();
            this._workers.delete(workerId);
        }
    }
    async setFileChooserInterceptedBy(enabled, by) {
        const wasIntercepted = this.fileChooserIntercepted();
        if (enabled)
            this._fileChooserInterceptedBy.add(by);
        else
            this._fileChooserInterceptedBy.delete(by);
        if (wasIntercepted !== this.fileChooserIntercepted())
            await this.delegate.updateFileChooserInterception();
    }
    fileChooserIntercepted() {
        return this._fileChooserInterceptedBy.size > 0;
    }
    frameNavigatedToNewDocument(frame) {
        this.emit(Page.Events.InternalFrameNavigatedToNewDocument, frame);
        this.browserContext.emit(browserContext_1.BrowserContext.Events.InternalFrameNavigatedToNewDocument, frame, this);
        const origin = frame.origin();
        if (origin)
            this.browserContext.addVisitedOrigin(origin);
    }
    allInitScripts() {
        const bindings = [...this.browserContext._pageBindings.values(), ...this._pageBindings.values()].map(binding => binding.initScript);
        if (this.browserContext.bindingsInitScript)
            bindings.unshift(this.browserContext.bindingsInitScript);
        return [...bindings, ...this.browserContext.initScripts, ...this.initScripts];
    }
    getBinding(name) {
        return this._pageBindings.get(name) || this.browserContext._pageBindings.get(name);
    }
    async safeNonStallingEvaluateInAllFrames(expression, world, options = {}) {
        await Promise.all(this.frames().map(async (frame) => {
            try {
                await frame.nonStallingEvaluateInExistingContext(expression, world);
            }
            catch (e) {
                if (options.throwOnJSErrors && js.isJavaScriptErrorInEvaluate(e))
                    throw e;
            }
        }));
    }
    async hideHighlight() {
        await Promise.all(this.frames().map(frame => frame.hideHighlight().catch(() => { })));
    }
    async snapshotForAI(progress, options = {}) {
        const snapshot = await snapshotFrameForAI(progress, this.mainFrame(), options);
        return { full: snapshot.full.join('\n'), incremental: snapshot.incremental?.join('\n') };
    }
    async setDockTile(image) {
        await this.delegate.setDockTile(image);
    }
}
exports.Page = Page;
exports.WorkerEvent = {
    Close: 'close',
};
class Worker extends instrumentation_1.SdkObject {
    static Events = exports.WorkerEvent;
    url;
    _executionContextPromise = new manualPromise_1.ManualPromise();
    _workerScriptLoaded = false;
    existingExecutionContext = null;
    openScope = new utils_1.LongStandingScope();
    constructor(parent, url) {
        super(parent, 'worker');
        this.url = url;
    }
    createExecutionContext(delegate) {
        this.existingExecutionContext = new js.ExecutionContext(this, delegate, 'worker');
        if (this._workerScriptLoaded)
            this._executionContextPromise.resolve(this.existingExecutionContext);
        return this.existingExecutionContext;
    }
    workerScriptLoaded() {
        this._workerScriptLoaded = true;
        if (this.existingExecutionContext)
            this._executionContextPromise.resolve(this.existingExecutionContext);
    }
    didClose() {
        if (this.existingExecutionContext)
            this.existingExecutionContext.contextDestroyed('Worker was closed');
        this.emit(Worker.Events.Close, this);
        this.openScope.close(new Error('Worker closed'));
    }
    async evaluateExpression(expression, isFunction, arg) {
        return js.evaluateExpression(await this._executionContextPromise, expression, { returnByValue: true, isFunction }, arg);
    }
    async evaluateExpressionHandle(expression, isFunction, arg) {
        return js.evaluateExpression(await this._executionContextPromise, expression, { returnByValue: false, isFunction }, arg);
    }
}
exports.Worker = Worker;
class PageBinding {
    static kController = '__copilotbrowser__binding__controller__';
    static kBindingName = '__copilotbrowser__binding__';
    static createInitScript() {
        return new InitScript(`
      (() => {
        const module = {};
        ${rawBindingsControllerSource.source}
        const property = '${PageBinding.kController}';
        if (!globalThis[property])
          globalThis[property] = new (module.exports.BindingsController())(globalThis, '${PageBinding.kBindingName}');
      })();
    `);
    }
    name;
    copilotbrowserFunction;
    initScript;
    needsHandle;
    cleanupScript;
    forClient;
    constructor(name, copilotbrowserFunction, needsHandle) {
        this.name = name;
        this.copilotbrowserFunction = copilotbrowserFunction;
        this.initScript = new InitScript(`globalThis['${PageBinding.kController}'].addBinding(${JSON.stringify(name)}, ${needsHandle})`);
        this.needsHandle = needsHandle;
        this.cleanupScript = `globalThis['${PageBinding.kController}'].removeBinding(${JSON.stringify(name)})`;
    }
    static async dispatch(page, payload, context) {
        const { name, seq, serializedArgs } = JSON.parse(payload);
        try {
            (0, utils_1.assert)(context.world);
            const binding = page.getBinding(name);
            if (!binding)
                throw new Error(`Function "${name}" is not exposed`);
            let result;
            if (binding.needsHandle) {
                const handle = await context.evaluateExpressionHandle(`arg => globalThis['${PageBinding.kController}'].takeBindingHandle(arg)`, { isFunction: true }, { name, seq }).catch(e => null);
                result = await binding.copilotbrowserFunction({ frame: context.frame, page, context: page.browserContext }, handle);
            }
            else {
                if (!Array.isArray(serializedArgs))
                    throw new Error(`serializedArgs is not an array. This can happen when Array.prototype.toJSON is defined incorrectly`);
                const args = serializedArgs.map(a => (0, utilityScriptSerializers_1.parseEvaluationResultValue)(a));
                result = await binding.copilotbrowserFunction({ frame: context.frame, page, context: page.browserContext }, ...args);
            }
            context.evaluateExpressionHandle(`arg => globalThis['${PageBinding.kController}'].deliverBindingResult(arg)`, { isFunction: true }, { name, seq, result }).catch(e => debugLogger_1.debugLogger.log('error', e));
        }
        catch (error) {
            context.evaluateExpressionHandle(`arg => globalThis['${PageBinding.kController}'].deliverBindingResult(arg)`, { isFunction: true }, { name, seq, error }).catch(e => debugLogger_1.debugLogger.log('error', e));
        }
    }
}
exports.PageBinding = PageBinding;
class InitScript {
    source;
    constructor(source) {
        this.source = `(() => {
      ${source}
    })();`;
    }
}
exports.InitScript = InitScript;
async function snapshotFrameForAI(progress, frame, options = {}) {
    // Only await the topmost navigations, inner frames will be empty when racing.
    const snapshot = await frame.retryWithProgressAndTimeouts(progress, [1000, 2000, 4000, 8000], async (continuePolling) => {
        try {
            const context = await progress.race(frame._utilityContext());
            const injectedScript = await progress.race(context.injectedScript());
            const snapshotOrRetry = await progress.race(injectedScript.evaluate((injected, options) => {
                const node = injected.document.body;
                if (!node)
                    return true;
                return injected.incrementalAriaSnapshot(node, { mode: 'ai', ...options });
            }, { refPrefix: frame.seq ? 'f' + frame.seq : '', track: options.track, doNotRenderActive: options.doNotRenderActive }));
            if (snapshotOrRetry === true)
                return continuePolling;
            return snapshotOrRetry;
        }
        catch (e) {
            if (frame.isNonRetriableError(e))
                throw e;
            return continuePolling;
        }
    });
    const childSnapshotPromises = snapshot.iframeRefs.map(ref => snapshotFrameRefForAI(progress, frame, ref, options));
    const childSnapshots = await Promise.all(childSnapshotPromises);
    const full = [];
    let incremental;
    if (snapshot.incremental !== undefined) {
        incremental = snapshot.incremental.split('\n');
        for (let i = 0; i < snapshot.iframeRefs.length; i++) {
            const childSnapshot = childSnapshots[i];
            if (childSnapshot.incremental)
                incremental.push(...childSnapshot.incremental);
            else if (childSnapshot.full.length)
                incremental.push('- <changed> iframe [ref=' + snapshot.iframeRefs[i] + ']:', ...childSnapshot.full.map(l => '  ' + l));
        }
    }
    for (const line of snapshot.full.split('\n')) {
        const match = line.match(/^(\s*)- iframe (?:\[active\] )?\[ref=([^\]]*)\]/);
        if (!match) {
            full.push(line);
            continue;
        }
        const leadingSpace = match[1];
        const ref = match[2];
        const childSnapshot = childSnapshots[snapshot.iframeRefs.indexOf(ref)] ?? { full: [] };
        full.push(childSnapshot.full.length ? line + ':' : line);
        full.push(...childSnapshot.full.map(l => leadingSpace + '  ' + l));
    }
    return { full, incremental };
}
async function snapshotFrameRefForAI(progress, parentFrame, frameRef, options) {
    const frameSelector = `aria-ref=${frameRef} >> internal:control=enter-frame`;
    const frameBodySelector = `${frameSelector} >> body`;
    const child = await progress.race(parentFrame.selectors.resolveFrameForSelector(frameBodySelector, { strict: true }));
    if (!child)
        return { full: [] };
    try {
        return await snapshotFrameForAI(progress, child.frame, options);
    }
    catch {
        return { full: [] };
    }
}
function ensureArrayLimit(array, limit) {
    if (array.length > limit)
        return array.splice(0, limit / 10);
    return [];
}
