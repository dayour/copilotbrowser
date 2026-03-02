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
exports.CRPage = void 0;
const assert_1 = require("../../utils/isomorphic/assert");
const eventsHelper_1 = require("../utils/eventsHelper");
const stackTrace_1 = require("../../utils/isomorphic/stackTrace");
const dialog = __importStar(require("../dialog"));
const dom = __importStar(require("../dom"));
const frames = __importStar(require("../frames"));
const helper_1 = require("../helper");
const network = __importStar(require("../network"));
const page_1 = require("../page");
const crCoverage_1 = require("./crCoverage");
const crDragDrop_1 = require("./crDragDrop");
const crExecutionContext_1 = require("./crExecutionContext");
const crInput_1 = require("./crInput");
const crNetworkManager_1 = require("./crNetworkManager");
const crPdf_1 = require("./crPdf");
const crProtocolHelper_1 = require("./crProtocolHelper");
const defaultFontFamilies_1 = require("./defaultFontFamilies");
const errors_1 = require("../errors");
const protocolError_1 = require("../protocolError");
class CRPage {
    utilityWorldName;
    _mainFrameSession;
    _sessions = new Map();
    _page;
    rawMouse;
    rawKeyboard;
    rawTouchscreen;
    _targetId;
    _opener;
    _networkManager;
    _pdf;
    _coverage;
    _browserContext;
    // Holds window features for the next popup being opened via window.open,
    // until the popup target arrives. This could be racy if two oopifs
    // simultaneously call window.open with window features: the order
    // of their Page.windowOpen events is not guaranteed to match the order
    // of new popup targets.
    _nextWindowOpenPopupFeatures = [];
    static mainFrameSession(page) {
        const crPage = page.delegate;
        return crPage._mainFrameSession;
    }
    constructor(client, targetId, browserContext, opener, bits) {
        this._targetId = targetId;
        this._opener = opener;
        const dragManager = new crDragDrop_1.DragManager(this);
        this.rawKeyboard = new crInput_1.RawKeyboardImpl(client, browserContext._browser._platform() === 'mac', dragManager);
        this.rawMouse = new crInput_1.RawMouseImpl(this, client, dragManager);
        this.rawTouchscreen = new crInput_1.RawTouchscreenImpl(client);
        this._pdf = new crPdf_1.CRPDF(client);
        this._coverage = new crCoverage_1.CRCoverage(client);
        this._browserContext = browserContext;
        this._page = new page_1.Page(this, browserContext);
        // Create a unique utility world for this copilotbrowser instance, just in case there
        // are multiple instances of copilotbrowser connected to the same browser page.
        this.utilityWorldName = `__copilotbrowser_utility_world_${this._page.guid}`;
        this._networkManager = new crNetworkManager_1.CRNetworkManager(this._page, null);
        // Sync any browser context state to the network manager. This does not talk over CDP because
        // we have not connected any sessions to the network manager yet.
        this.updateOffline();
        this.updateExtraHTTPHeaders();
        this.updateHttpCredentials();
        this.updateRequestInterception();
        this._mainFrameSession = new FrameSession(this, client, targetId, null);
        this._sessions.set(targetId, this._mainFrameSession);
        if (opener && !browserContext._options.noDefaultViewport) {
            const features = opener._nextWindowOpenPopupFeatures.shift() || [];
            const viewportSize = helper_1.helper.getViewportSizeFromWindowFeatures(features);
            if (viewportSize)
                this._page.setEmulatedSizeFromWindowOpen({ viewport: viewportSize, screen: viewportSize });
        }
        this._mainFrameSession._initialize(bits.hasUIWindow).then(() => this._page.reportAsNew(this._opener?._page, undefined), error => this._page.reportAsNew(this._opener?._page, error));
    }
    async _forAllFrameSessions(cb) {
        const frameSessions = Array.from(this._sessions.values());
        await Promise.all(frameSessions.map(frameSession => {
            if (frameSession._isMainFrame())
                return cb(frameSession);
            return cb(frameSession).catch(e => {
                // Broadcasting a message to the closed iframe should be a noop.
                if ((0, protocolError_1.isSessionClosedError)(e))
                    return;
                throw e;
            });
        }));
    }
    _sessionForFrame(frame) {
        // Frame id equals target id.
        while (!this._sessions.has(frame._id)) {
            const parent = frame.parentFrame();
            if (!parent)
                throw new Error(`Frame has been detached.`);
            frame = parent;
        }
        return this._sessions.get(frame._id);
    }
    _sessionForHandle(handle) {
        const frame = handle._context.frame;
        return this._sessionForFrame(frame);
    }
    willBeginDownload() {
        this._mainFrameSession._willBeginDownload();
    }
    didClose() {
        for (const session of this._sessions.values())
            session.dispose();
        this._page._didClose();
    }
    async navigateFrame(frame, url, referrer) {
        return this._sessionForFrame(frame)._navigate(frame, url, referrer);
    }
    async updateExtraHTTPHeaders() {
        const headers = network.mergeHeaders([
            this._browserContext._options.extraHTTPHeaders,
            this._page.extraHTTPHeaders()
        ]);
        await this._networkManager.setExtraHTTPHeaders(headers);
    }
    async updateGeolocation() {
        await this._forAllFrameSessions(frame => frame._updateGeolocation(false));
    }
    async updateOffline() {
        await this._networkManager.setOffline(!!this._browserContext._options.offline);
    }
    async updateHttpCredentials() {
        await this._networkManager.authenticate(this._browserContext._options.httpCredentials || null);
    }
    async updateEmulatedViewportSize(preserveWindowBoundaries) {
        await this._mainFrameSession._updateViewport(preserveWindowBoundaries);
    }
    async bringToFront() {
        await this._mainFrameSession._client.send('Page.bringToFront');
    }
    async updateEmulateMedia() {
        await this._forAllFrameSessions(frame => frame._updateEmulateMedia());
    }
    async updateUserAgent() {
        await this._forAllFrameSessions(frame => frame._updateUserAgent());
    }
    async updateRequestInterception() {
        await this._networkManager.setRequestInterception(this._page.needsRequestInterception());
    }
    async updateFileChooserInterception() {
        await this._forAllFrameSessions(frame => frame._updateFileChooserInterception(false));
    }
    async reload() {
        await this._mainFrameSession._client.send('Page.reload');
    }
    async _go(delta) {
        const history = await this._mainFrameSession._client.send('Page.getNavigationHistory');
        const entry = history.entries[history.currentIndex + delta];
        if (!entry)
            return false;
        await this._mainFrameSession._client.send('Page.navigateToHistoryEntry', { entryId: entry.id });
        return true;
    }
    goBack() {
        return this._go(-1);
    }
    goForward() {
        return this._go(+1);
    }
    async requestGC() {
        await this._mainFrameSession._client.send('HeapProfiler.collectGarbage');
    }
    async addInitScript(initScript, world = 'main') {
        await this._forAllFrameSessions(frame => frame._evaluateOnNewDocument(initScript, world));
    }
    async exposecopilotbrowserBinding() {
        await this._forAllFrameSessions(frame => frame.exposecopilotbrowserBinding());
    }
    async removeInitScripts(initScripts) {
        await this._forAllFrameSessions(frame => frame._removeEvaluatesOnNewDocument(initScripts));
    }
    async closePage(runBeforeUnload) {
        if (runBeforeUnload)
            await this._mainFrameSession._client.send('Page.close');
        else
            await this._browserContext._browser._closePage(this);
    }
    async setBackgroundColor(color) {
        await this._mainFrameSession._client.send('Emulation.setDefaultBackgroundColorOverride', { color });
    }
    async takeScreenshot(progress, format, documentRect, viewportRect, quality, fitsViewport, scale) {
        const { visualViewport, contentSize, cssContentSize } = await progress.race(this._mainFrameSession._client.send('Page.getLayoutMetrics'));
        if (!documentRect) {
            documentRect = {
                x: visualViewport.pageX + viewportRect.x,
                y: visualViewport.pageY + viewportRect.y,
                ...helper_1.helper.enclosingIntSize({
                    width: viewportRect.width / visualViewport.scale,
                    height: viewportRect.height / visualViewport.scale,
                })
            };
        }
        // When taking screenshots with documentRect (based on the page content, not viewport),
        // ignore current page scale.
        const clip = { ...documentRect, scale: viewportRect ? visualViewport.scale : 1 };
        if (scale === 'css') {
            // deviceScaleFactor override does not affect layout metrics, so if it is set,
            // we use its value rather than computed one.
            const deviceScaleFactor = this._mainFrameSession._metricsOverride?.deviceScaleFactor || contentSize.width / cssContentSize.width || 1;
            clip.scale /= deviceScaleFactor;
        }
        const result = await progress.race(this._mainFrameSession._client.send('Page.captureScreenshot', { format, quality, clip, captureBeyondViewport: !fitsViewport }));
        return Buffer.from(result.data, 'base64');
    }
    async getContentFrame(handle) {
        return this._sessionForHandle(handle)._getContentFrame(handle);
    }
    async getOwnerFrame(handle) {
        return this._sessionForHandle(handle)._getOwnerFrame(handle);
    }
    async getBoundingBox(handle) {
        return this._sessionForHandle(handle)._getBoundingBox(handle);
    }
    async scrollRectIntoViewIfNeeded(handle, rect) {
        return this._sessionForHandle(handle)._scrollRectIntoViewIfNeeded(handle, rect);
    }
    async startScreencast(options) {
        await this._mainFrameSession._client.send('Page.startScreencast', {
            format: 'jpeg',
            quality: options.quality,
            maxWidth: options.width,
            maxHeight: options.height,
        });
    }
    async stopScreencast() {
        await this._mainFrameSession._client._sendMayFail('Page.stopScreencast');
    }
    rafCountForStablePosition() {
        return 1;
    }
    async getContentQuads(handle) {
        return this._sessionForHandle(handle)._getContentQuads(handle);
    }
    async setInputFilePaths(handle, files) {
        const frame = await handle.ownerFrame();
        if (!frame)
            throw new Error('Cannot set input files to detached input element');
        const parentSession = this._sessionForFrame(frame);
        await parentSession._client.send('DOM.setFileInputFiles', {
            objectId: handle._objectId,
            files
        });
    }
    async adoptElementHandle(handle, to) {
        return this._sessionForHandle(handle)._adoptElementHandle(handle, to);
    }
    async inputActionEpilogue() {
        await this._mainFrameSession._client.send('Page.enable').catch(e => { });
    }
    async resetForReuse(progress) {
        // See https://github.com/dayour/copilotbrowser/issues/22432.
        await this.rawMouse.move(progress, -1, -1, 'none', new Set(), new Set(), true);
    }
    async pdf(options) {
        return this._pdf.generate(options);
    }
    coverage() {
        return this._coverage;
    }
    async getFrameElement(frame) {
        let parent = frame.parentFrame();
        if (!parent)
            throw new Error('Frame has been detached.');
        const parentSession = this._sessionForFrame(parent);
        const { backendNodeId } = await parentSession._client.send('DOM.getFrameOwner', { frameId: frame._id }).catch(e => {
            if (e instanceof Error && e.message.includes('Frame with the given id was not found.'))
                (0, stackTrace_1.rewriteErrorMessage)(e, 'Frame has been detached.');
            throw e;
        });
        parent = frame.parentFrame();
        if (!parent)
            throw new Error('Frame has been detached.');
        return parentSession._adoptBackendNodeId(backendNodeId, await parent._mainContext());
    }
    shouldToggleStyleSheetToSyncAnimations() {
        return false;
    }
    async setDockTile(image) {
        await this._mainFrameSession._client.send('Browser.setDockTile', { image: image.toString('base64') });
    }
}
exports.CRPage = CRPage;
class FrameSession {
    _client;
    _crPage;
    _page;
    _parentSession;
    _childSessions = new Set();
    _contextIdToContext = new Map();
    _eventListeners = [];
    _targetId;
    _firstNonInitialNavigationCommittedPromise;
    _firstNonInitialNavigationCommittedFulfill = () => { };
    _firstNonInitialNavigationCommittedReject = (e) => { };
    _windowId;
    // Marks the oopif session that remote -> local transition has happened in the parent.
    // See Target.detachedFromTarget handler for details.
    _swappedIn = false;
    _metricsOverride;
    _workerSessions = new Map();
    _initScriptIds = new Map();
    _bufferedAttachedToTargetEvents;
    constructor(crPage, client, targetId, parentSession) {
        this._client = client;
        this._crPage = crPage;
        this._page = crPage._page;
        this._targetId = targetId;
        this._parentSession = parentSession;
        if (parentSession)
            parentSession._childSessions.add(this);
        this._firstNonInitialNavigationCommittedPromise = new Promise((f, r) => {
            this._firstNonInitialNavigationCommittedFulfill = f;
            this._firstNonInitialNavigationCommittedReject = r;
        });
        // The Promise is not always awaited (e.g. FrameSession._initialize can throw)
        // so we catch errors here to prevent unhandled promise rejection.
        this._firstNonInitialNavigationCommittedPromise.catch(() => { });
    }
    _isMainFrame() {
        return this._targetId === this._crPage._targetId;
    }
    _addRendererListeners() {
        this._eventListeners.push(...[
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Log.entryAdded', event => this._onLogEntryAdded(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.fileChooserOpened', event => this._onFileChooserOpened(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.frameAttached', event => this._onFrameAttached(event.frameId, event.parentFrameId)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.frameDetached', event => this._onFrameDetached(event.frameId, event.reason)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.frameNavigated', event => this._onFrameNavigated(event.frame, false)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.frameRequestedNavigation', event => this._onFrameRequestedNavigation(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.javascriptDialogOpening', event => this._onDialog(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.navigatedWithinDocument', event => this._onFrameNavigatedWithinDocument(event.frameId, event.url)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Runtime.bindingCalled', event => this._onBindingCalled(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Runtime.consoleAPICalled', event => this._onConsoleAPI(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Runtime.exceptionThrown', exception => this._handleException(exception.exceptionDetails)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Runtime.executionContextCreated', event => this._onExecutionContextCreated(event.context)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Runtime.executionContextDestroyed', event => this._onExecutionContextDestroyed(event.executionContextId)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Runtime.executionContextsCleared', event => this._onExecutionContextsCleared()),
        ]);
    }
    _addBrowserListeners() {
        this._eventListeners.push(...[
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Target.attachedToTarget', event => this._onAttachedToTarget(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Target.detachedFromTarget', event => this._onDetachedFromTarget(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Inspector.targetCrashed', event => this._onTargetCrashed()),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.screencastFrame', event => this._onScreencastFrame(event)),
            eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.windowOpen', event => this._onWindowOpen(event)),
        ]);
    }
    async _initialize(hasUIWindow) {
        if (!this._page.isStorageStatePage && hasUIWindow &&
            !this._crPage._browserContext._browser.isClank() &&
            !this._crPage._browserContext._options.noDefaultViewport) {
            const { windowId } = await this._client.send('Browser.getWindowForTarget');
            this._windowId = windowId;
        }
        let videoOptions;
        if (this._isMainFrame() && hasUIWindow && !this._page.isStorageStatePage)
            videoOptions = this._crPage._page.screencast.launchAutomaticVideoRecorder();
        let lifecycleEventsEnabled;
        if (!this._isMainFrame())
            this._addRendererListeners();
        this._addBrowserListeners();
        // Buffer attachedToTarget events until we receive the frame tree.
        // This way we'll know where to insert oopif targets in the frame hierarchy.
        // Note that we cannot send Target.setAutoAttach after Runtime.runIfWaitingForDebugger,
        // so we have to buffer events instead.
        this._bufferedAttachedToTargetEvents = [];
        const promises = [
            this._client.send('Page.enable'),
            this._client.send('Page.getFrameTree').then(({ frameTree }) => {
                if (this._isMainFrame()) {
                    this._handleFrameTree(frameTree);
                    this._addRendererListeners();
                }
                // Now that we have the frame tree, it is possible to insert oopif targets at the right place.
                const attachedToTargetEvents = this._bufferedAttachedToTargetEvents || [];
                this._bufferedAttachedToTargetEvents = undefined;
                for (const event of attachedToTargetEvents)
                    this._onAttachedToTarget(event);
                const localFrames = this._isMainFrame() ? this._page.frames() : [this._page.frameManager.frame(this._targetId)];
                for (const frame of localFrames) {
                    // Note: frames might be removed before we send these.
                    this._client._sendMayFail('Page.createIsolatedWorld', {
                        frameId: frame._id,
                        grantUniveralAccess: true,
                        worldName: this._crPage.utilityWorldName,
                    });
                }
                const isInitialEmptyPage = this._isMainFrame() && this._page.mainFrame().url() === ':';
                if (isInitialEmptyPage) {
                    // Ignore lifecycle events, worlds and bindings for the initial empty page. It is never the final page
                    // hence we are going to get more lifecycle updates after the actual navigation has
                    // started (even if the target url is about:blank).
                    lifecycleEventsEnabled.catch(e => { }).then(() => {
                        this._eventListeners.push(eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.lifecycleEvent', event => this._onLifecycleEvent(event)));
                    });
                }
                else {
                    this._firstNonInitialNavigationCommittedFulfill();
                    this._eventListeners.push(eventsHelper_1.eventsHelper.addEventListener(this._client, 'Page.lifecycleEvent', event => this._onLifecycleEvent(event)));
                }
            }),
            this._client.send('Log.enable', {}),
            lifecycleEventsEnabled = this._client.send('Page.setLifecycleEventsEnabled', { enabled: true }),
            this._client.send('Runtime.enable', {}),
            this._client.send('Page.addScriptToEvaluateOnNewDocument', {
                source: '',
                worldName: this._crPage.utilityWorldName,
            }),
            this._crPage._networkManager.addSession(this._client, undefined, this._isMainFrame()),
            this._client.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }),
        ];
        if (!this._page.isStorageStatePage) {
            if (this._crPage._browserContext.needscopilotbrowserBinding())
                promises.push(this.exposecopilotbrowserBinding());
            if (this._isMainFrame())
                promises.push(this._client.send('Emulation.setFocusEmulationEnabled', { enabled: true }));
            const options = this._crPage._browserContext._options;
            if (options.bypassCSP)
                promises.push(this._client.send('Page.setBypassCSP', { enabled: true }));
            if (options.ignoreHTTPSErrors || options.internalIgnoreHTTPSErrors)
                promises.push(this._client.send('Security.setIgnoreCertificateErrors', { ignore: true }));
            if (this._isMainFrame())
                promises.push(this._updateViewport());
            if (options.hasTouch)
                promises.push(this._client.send('Emulation.setTouchEmulationEnabled', { enabled: true }));
            if (options.javaScriptEnabled === false)
                promises.push(this._client.send('Emulation.setScriptExecutionDisabled', { value: true }));
            if (options.userAgent || options.locale)
                promises.push(this._updateUserAgent());
            if (options.locale)
                promises.push(emulateLocale(this._client, options.locale));
            if (options.timezoneId)
                promises.push(emulateTimezone(this._client, options.timezoneId));
            if (!this._crPage._browserContext._browser.options.headful)
                promises.push(this._setDefaultFontFamilies(this._client));
            promises.push(this._updateGeolocation(true));
            promises.push(this._updateEmulateMedia());
            promises.push(this._updateFileChooserInterception(true));
            for (const initScript of this._crPage._page.allInitScripts())
                promises.push(this._evaluateOnNewDocument(initScript, 'main', true /* runImmediately */));
            if (videoOptions)
                promises.push(this._crPage._page.screencast.startVideoRecording(videoOptions));
        }
        promises.push(this._client.send('Runtime.runIfWaitingForDebugger'));
        promises.push(this._firstNonInitialNavigationCommittedPromise);
        await Promise.all(promises);
    }
    dispose() {
        this._firstNonInitialNavigationCommittedReject(new errors_1.TargetClosedError(this._page.closeReason()));
        for (const childSession of this._childSessions)
            childSession.dispose();
        if (this._parentSession)
            this._parentSession._childSessions.delete(this);
        eventsHelper_1.eventsHelper.removeEventListeners(this._eventListeners);
        this._crPage._networkManager.removeSession(this._client);
        this._crPage._sessions.delete(this._targetId);
        this._client.dispose();
    }
    async _navigate(frame, url, referrer) {
        const response = await this._client.send('Page.navigate', { url, referrer, frameId: frame._id, referrerPolicy: 'unsafeUrl' });
        if (response.isDownload)
            throw new frames.NavigationAbortedError(response.loaderId, 'Download is starting');
        if (response.errorText)
            throw new frames.NavigationAbortedError(response.loaderId, `${response.errorText} at ${url}`);
        return { newDocumentId: response.loaderId };
    }
    _onLifecycleEvent(event) {
        if (this._eventBelongsToStaleFrame(event.frameId))
            return;
        if (event.name === 'load')
            this._page.frameManager.frameLifecycleEvent(event.frameId, 'load');
        else if (event.name === 'DOMContentLoaded')
            this._page.frameManager.frameLifecycleEvent(event.frameId, 'domcontentloaded');
    }
    _handleFrameTree(frameTree) {
        this._onFrameAttached(frameTree.frame.id, frameTree.frame.parentId || null);
        this._onFrameNavigated(frameTree.frame, true);
        if (!frameTree.childFrames)
            return;
        for (const child of frameTree.childFrames)
            this._handleFrameTree(child);
    }
    _eventBelongsToStaleFrame(frameId) {
        const frame = this._page.frameManager.frame(frameId);
        // Subtree may be already gone because some ancestor navigation destroyed the oopif.
        if (!frame)
            return true;
        // When frame goes remote, parent process may still send some events
        // related to the local frame before it sends frameDetached.
        // In this case, we already have a new session for this frame, so events
        // in the old session should be ignored.
        const session = this._crPage._sessionForFrame(frame);
        return session && session !== this && !session._swappedIn;
    }
    _onFrameAttached(frameId, parentFrameId) {
        const frameSession = this._crPage._sessions.get(frameId);
        if (frameSession && frameId !== this._targetId) {
            // This is a remote -> local frame transition.
            frameSession._swappedIn = true;
            const frame = this._page.frameManager.frame(frameId);
            // Frame or even a whole subtree may be already gone, because some ancestor did navigate.
            if (frame)
                this._page.frameManager.removeChildFramesRecursively(frame);
            return;
        }
        if (parentFrameId && !this._page.frameManager.frame(parentFrameId)) {
            // Parent frame may be gone already because some ancestor frame navigated and
            // destroyed the whole subtree of some oopif, while oopif's process is still sending us events.
            // Be careful to not confuse this with "main frame navigated cross-process" scenario
            // where parentFrameId is null.
            return;
        }
        this._page.frameManager.frameAttached(frameId, parentFrameId);
    }
    _onFrameNavigated(framePayload, initial) {
        if (this._eventBelongsToStaleFrame(framePayload.id))
            return;
        this._page.frameManager.frameCommittedNewDocumentNavigation(framePayload.id, framePayload.url + (framePayload.urlFragment || ''), framePayload.name || '', framePayload.loaderId, initial);
        if (!initial)
            this._firstNonInitialNavigationCommittedFulfill();
    }
    _onFrameRequestedNavigation(payload) {
        if (this._eventBelongsToStaleFrame(payload.frameId))
            return;
        if (payload.disposition === 'currentTab')
            this._page.frameManager.frameRequestedNavigation(payload.frameId);
    }
    _onFrameNavigatedWithinDocument(frameId, url) {
        if (this._eventBelongsToStaleFrame(frameId))
            return;
        this._page.frameManager.frameCommittedSameDocumentNavigation(frameId, url);
    }
    _onFrameDetached(frameId, reason) {
        if (this._crPage._sessions.has(frameId)) {
            // This is a local -> remote frame transition, where
            // Page.frameDetached arrives after Target.attachedToTarget.
            // We've already handled the new target and frame reattach - nothing to do here.
            return;
        }
        if (reason === 'swap') {
            // This is a local -> remote frame transition, where
            // Page.frameDetached arrives before Target.attachedToTarget.
            // We should keep the frame in the tree, and it will be used for the new target.
            const frame = this._page.frameManager.frame(frameId);
            if (frame)
                this._page.frameManager.removeChildFramesRecursively(frame);
            return;
        }
        // Just a regular frame detach.
        this._page.frameManager.frameDetached(frameId);
    }
    _onExecutionContextCreated(contextPayload) {
        const frame = contextPayload.auxData ? this._page.frameManager.frame(contextPayload.auxData.frameId) : null;
        if (!frame || this._eventBelongsToStaleFrame(frame._id))
            return;
        const delegate = new crExecutionContext_1.CRExecutionContext(this._client, contextPayload);
        let worldName = null;
        if (contextPayload.auxData && !!contextPayload.auxData.isDefault)
            worldName = 'main';
        else if (contextPayload.name === this._crPage.utilityWorldName)
            worldName = 'utility';
        const context = new dom.FrameExecutionContext(delegate, frame, worldName);
        if (worldName)
            frame._contextCreated(worldName, context);
        this._contextIdToContext.set(contextPayload.id, context);
    }
    _onExecutionContextDestroyed(executionContextId) {
        const context = this._contextIdToContext.get(executionContextId);
        if (!context)
            return;
        this._contextIdToContext.delete(executionContextId);
        context.frame._contextDestroyed(context);
    }
    _onExecutionContextsCleared() {
        for (const contextId of Array.from(this._contextIdToContext.keys()))
            this._onExecutionContextDestroyed(contextId);
    }
    _onAttachedToTarget(event) {
        if (this._bufferedAttachedToTargetEvents) {
            this._bufferedAttachedToTargetEvents.push(event);
            return;
        }
        const session = this._client.createChildSession(event.sessionId);
        if (event.targetInfo.type === 'iframe') {
            // Frame id equals target id.
            const targetId = event.targetInfo.targetId;
            let frame = this._page.frameManager.frame(targetId);
            if (!frame && event.targetInfo.parentFrameId) {
                // When connecting to an existing page with an iframe, there is an "iframe" target,
                // but no local frame is reported in getFrameTree. We can create a remote frame here.
                frame = this._page.frameManager.frameAttached(targetId, event.targetInfo.parentFrameId);
            }
            if (!frame)
                return; // Subtree may be already gone due to renderer/browser race.
            this._page.frameManager.removeChildFramesRecursively(frame);
            for (const [contextId, context] of this._contextIdToContext) {
                if (context.frame === frame)
                    this._onExecutionContextDestroyed(contextId);
            }
            const frameSession = new FrameSession(this._crPage, session, targetId, this);
            this._crPage._sessions.set(targetId, frameSession);
            frameSession._initialize(false).catch(e => e);
            return;
        }
        if (event.targetInfo.type !== 'worker') {
            session.detach().catch(() => { });
            return;
        }
        const url = event.targetInfo.url;
        const worker = new page_1.Worker(this._page, url);
        this._page.addWorker(event.sessionId, worker);
        this._workerSessions.set(event.sessionId, session);
        session.once('Runtime.executionContextCreated', async (event) => {
            worker.createExecutionContext(new crExecutionContext_1.CRExecutionContext(session, event.context));
        });
        if (this._crPage._browserContext._browser.majorVersion() >= 143)
            session.on('Inspector.workerScriptLoaded', () => worker.workerScriptLoaded());
        else
            worker.workerScriptLoaded();
        // This might fail if the target is closed before we initialize.
        session._sendMayFail('Runtime.enable');
        // TODO: attribute workers to the right frame.
        this._crPage._networkManager.addSession(session, this._page.frameManager.frame(this._targetId) ?? undefined).catch(() => { });
        session._sendMayFail('Runtime.runIfWaitingForDebugger');
        session._sendMayFail('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
        session.on('Target.attachedToTarget', event => this._onAttachedToTarget(event));
        session.on('Target.detachedFromTarget', event => this._onDetachedFromTarget(event));
        session.on('Runtime.consoleAPICalled', event => {
            const args = event.args.map(o => (0, crExecutionContext_1.createHandle)(worker.existingExecutionContext, o));
            this._page.addConsoleMessage(worker, event.type, args, (0, crProtocolHelper_1.toConsoleMessageLocation)(event.stackTrace), undefined, event.timestamp);
        });
        session.on('Runtime.exceptionThrown', exception => this._page.addPageError((0, crProtocolHelper_1.exceptionToError)(exception.exceptionDetails)));
    }
    _onDetachedFromTarget(event) {
        // This might be a worker...
        const workerSession = this._workerSessions.get(event.sessionId);
        if (workerSession) {
            workerSession.dispose();
            this._page.removeWorker(event.sessionId);
            return;
        }
        // ... or an oopif.
        const childFrameSession = this._crPage._sessions.get(event.targetId);
        if (!childFrameSession)
            return;
        // Usually, we get frameAttached in this session first and mark child as swappedIn.
        if (childFrameSession._swappedIn) {
            childFrameSession.dispose();
            return;
        }
        // However, sometimes we get detachedFromTarget before frameAttached.
        // In this case we don't know whether this is a remote frame detach,
        // or just a remote -> local transition. In the latter case, frameAttached
        // is already inflight, so let's make a safe roundtrip to ensure it arrives.
        this._client.send('Page.enable').catch(e => null).then(() => {
            // Child was not swapped in - that means frameAttached did not happen and
            // this is remote detach rather than remote -> local swap.
            if (!childFrameSession._swappedIn)
                this._page.frameManager.frameDetached(event.targetId);
            childFrameSession.dispose();
        });
    }
    _onWindowOpen(event) {
        this._crPage._nextWindowOpenPopupFeatures.push(event.windowFeatures);
    }
    async _onConsoleAPI(event) {
        if (event.executionContextId === 0) {
            // DevTools protocol stores the last 1000 console messages. These
            // messages are always reported even for removed execution contexts. In
            // this case, they are marked with executionContextId = 0 and are
            // reported upon enabling Runtime agent.
            //
            // Ignore these messages since:
            // - there's no execution context we can use to operate with message
            //   arguments
            // - these messages are reported before copilotbrowser clients can subscribe
            //   to the 'console'
            //   page event.
            //
            // @see https://github.com/GoogleChrome/puppeteer/issues/3865
            return;
        }
        const context = this._contextIdToContext.get(event.executionContextId);
        if (!context)
            return;
        const values = event.args.map(arg => (0, crExecutionContext_1.createHandle)(context, arg));
        this._page.addConsoleMessage(null, event.type, values, (0, crProtocolHelper_1.toConsoleMessageLocation)(event.stackTrace), undefined, event.timestamp);
    }
    async _onBindingCalled(event) {
        const pageOrError = await this._crPage._page.waitForInitializedOrError();
        if (!(pageOrError instanceof Error)) {
            const context = this._contextIdToContext.get(event.executionContextId);
            if (context)
                await this._page.onBindingCalled(event.payload, context);
        }
    }
    _onDialog(event) {
        if (!this._page.frameManager.frame(this._targetId))
            return; // Our frame/subtree may be gone already.
        this._page.browserContext.dialogManager.dialogDidOpen(new dialog.Dialog(this._page, event.type, event.message, async (accept, promptText) => {
            // TODO: this should actually be a CDP event that notifies about a cancelled navigation attempt.
            if (this._isMainFrame() && event.type === 'beforeunload' && !accept)
                this._page.frameManager.frameAbortedNavigation(this._page.mainFrame()._id, 'navigation cancelled by beforeunload dialog');
            await this._client.send('Page.handleJavaScriptDialog', { accept, promptText });
        }, event.defaultPrompt));
    }
    _handleException(exceptionDetails) {
        this._page.addPageError((0, crProtocolHelper_1.exceptionToError)(exceptionDetails));
    }
    async _onTargetCrashed() {
        this._client._markAsCrashed();
        this._page._didCrash();
    }
    _onLogEntryAdded(event) {
        const { level, text, args, source, url, lineNumber } = event.entry;
        if (args)
            args.map(arg => (0, crProtocolHelper_1.releaseObject)(this._client, arg.objectId));
        if (source !== 'worker') {
            const location = {
                url: url || '',
                lineNumber: lineNumber || 0,
                columnNumber: 0,
            };
            this._page.addConsoleMessage(null, level, [], location, text, event.entry.timestamp);
        }
    }
    async _onFileChooserOpened(event) {
        if (!event.backendNodeId)
            return;
        const frame = this._page.frameManager.frame(event.frameId);
        if (!frame)
            return;
        let handle;
        try {
            const utilityContext = await frame._utilityContext();
            handle = await this._adoptBackendNodeId(event.backendNodeId, utilityContext);
        }
        catch (e) {
            // During async processing, frame/context may go away. We should not throw.
            return;
        }
        await this._page._onFileChooserOpened(handle);
    }
    _willBeginDownload() {
        if (!this._crPage._page.initializedOrUndefined()) {
            // Resume the page creation with an error. The page will automatically close right
            // after the download begins.
            this._firstNonInitialNavigationCommittedReject(new Error('Starting new page download'));
        }
    }
    _onScreencastFrame(payload) {
        this._page.screencast.throttleFrameAck(() => {
            this._client._sendMayFail('Page.screencastFrameAck', { sessionId: payload.sessionId });
        });
        const buffer = Buffer.from(payload.data, 'base64');
        this._page.emit(page_1.Page.Events.ScreencastFrame, {
            buffer,
            frameSwapWallTime: payload.metadata.timestamp ? payload.metadata.timestamp * 1000 : Date.now(),
            width: payload.metadata.deviceWidth,
            height: payload.metadata.deviceHeight,
        });
    }
    async _updateGeolocation(initial) {
        const geolocation = this._crPage._browserContext._options.geolocation;
        if (!initial || geolocation)
            await this._client.send('Emulation.setGeolocationOverride', geolocation || {});
    }
    async _updateViewport(preserveWindowBoundaries) {
        if (this._crPage._browserContext._browser.isClank())
            return;
        (0, assert_1.assert)(this._isMainFrame());
        const options = this._crPage._browserContext._options;
        const emulatedSize = this._page.emulatedSize();
        if (!emulatedSize)
            return;
        const viewportSize = emulatedSize.viewport;
        const screenSize = emulatedSize.screen;
        const isLandscape = screenSize.width > screenSize.height;
        const metricsOverride = {
            mobile: !!options.isMobile,
            width: viewportSize.width,
            height: viewportSize.height,
            screenWidth: screenSize.width,
            screenHeight: screenSize.height,
            deviceScaleFactor: options.deviceScaleFactor || 1,
            screenOrientation: !!options.isMobile ? (isLandscape ? { angle: 90, type: 'landscapePrimary' } : { angle: 0, type: 'portraitPrimary' }) : { angle: 0, type: 'landscapePrimary' },
            dontSetVisibleSize: preserveWindowBoundaries
        };
        if (JSON.stringify(this._metricsOverride) === JSON.stringify(metricsOverride))
            return;
        const promises = [];
        if (!preserveWindowBoundaries && this._windowId) {
            let insets = { width: 0, height: 0 };
            if (this._crPage._browserContext._browser.options.headful) {
                // TODO: popup windows have their own insets.
                insets = { width: 24, height: 88 };
                if (process.platform === 'win32')
                    insets = { width: 16, height: 88 };
                else if (process.platform === 'linux')
                    insets = { width: 8, height: 85 };
                else if (process.platform === 'darwin')
                    insets = { width: 2, height: 80 };
                if (this._crPage._browserContext.isPersistentContext()) {
                    // FIXME: Chrome bug: OOPIF router is confused when hit target is
                    // outside browser window.
                    // Account for the infobar here to work around the bug.
                    insets.height += 46;
                }
            }
            promises.push(this.setWindowBounds({
                width: viewportSize.width + insets.width,
                height: viewportSize.height + insets.height
            }));
        }
        // Make sure that the viewport emulationis set after the embedder window resize.
        promises.push(this._client.send('Emulation.setDeviceMetricsOverride', metricsOverride));
        await Promise.all(promises);
        this._metricsOverride = metricsOverride;
    }
    async windowBounds() {
        const { bounds } = await this._client.send('Browser.getWindowBounds', {
            windowId: this._windowId
        });
        return bounds;
    }
    async setWindowBounds(bounds) {
        return await this._client.send('Browser.setWindowBounds', {
            windowId: this._windowId,
            bounds
        });
    }
    async _updateEmulateMedia() {
        const emulatedMedia = this._page.emulatedMedia();
        // Empty string disables the override.
        const media = emulatedMedia.media === 'no-override' ? '' : emulatedMedia.media;
        const colorScheme = emulatedMedia.colorScheme === 'no-override' ? '' : emulatedMedia.colorScheme;
        const reducedMotion = emulatedMedia.reducedMotion === 'no-override' ? '' : emulatedMedia.reducedMotion;
        const forcedColors = emulatedMedia.forcedColors === 'no-override' ? '' : emulatedMedia.forcedColors;
        const contrast = emulatedMedia.contrast === 'no-override' ? '' : emulatedMedia.contrast;
        const features = [
            { name: 'prefers-color-scheme', value: colorScheme },
            { name: 'prefers-reduced-motion', value: reducedMotion },
            { name: 'forced-colors', value: forcedColors },
            { name: 'prefers-contrast', value: contrast },
        ];
        await this._client.send('Emulation.setEmulatedMedia', { media, features });
    }
    async _updateUserAgent() {
        const options = this._crPage._browserContext._options;
        await this._client.send('Emulation.setUserAgentOverride', {
            userAgent: options.userAgent || '',
            acceptLanguage: options.locale,
            userAgentMetadata: calculateUserAgentMetadata(options),
        });
    }
    async _setDefaultFontFamilies(session) {
        const fontFamilies = defaultFontFamilies_1.platformToFontFamilies[this._crPage._browserContext._browser._platform()];
        await session.send('Page.setFontFamilies', fontFamilies);
    }
    async _updateFileChooserInterception(initial) {
        const enabled = this._page.fileChooserIntercepted();
        if (initial && !enabled)
            return;
        await this._client.send('Page.setInterceptFileChooserDialog', { enabled }).catch(() => { }); // target can be closed.
    }
    async _evaluateOnNewDocument(initScript, world, runImmediately) {
        const worldName = world === 'utility' ? this._crPage.utilityWorldName : undefined;
        const { identifier } = await this._client.send('Page.addScriptToEvaluateOnNewDocument', { source: initScript.source, worldName, runImmediately });
        this._initScriptIds.set(initScript, identifier);
    }
    async _removeEvaluatesOnNewDocument(initScripts) {
        const ids = [];
        for (const script of initScripts) {
            const id = this._initScriptIds.get(script);
            if (id)
                ids.push(id);
            this._initScriptIds.delete(script);
        }
        await Promise.all(ids.map(identifier => this._client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier }).catch(() => { }))); // target can be closed
    }
    async exposecopilotbrowserBinding() {
        await this._client.send('Runtime.addBinding', { name: page_1.PageBinding.kBindingName });
    }
    async _getContentFrame(handle) {
        const nodeInfo = await this._client.send('DOM.describeNode', {
            objectId: handle._objectId
        });
        if (!nodeInfo || typeof nodeInfo.node.frameId !== 'string')
            return null;
        return this._page.frameManager.frame(nodeInfo.node.frameId);
    }
    async _getOwnerFrame(handle) {
        // document.documentElement has frameId of the owner frame.
        const documentElement = await handle.evaluateHandle(node => {
            const doc = node;
            if (doc.documentElement && doc.documentElement.ownerDocument === doc)
                return doc.documentElement;
            return node.ownerDocument ? node.ownerDocument.documentElement : null;
        });
        if (!documentElement)
            return null;
        if (!documentElement._objectId)
            return null;
        const nodeInfo = await this._client.send('DOM.describeNode', {
            objectId: documentElement._objectId
        });
        const frameId = nodeInfo && typeof nodeInfo.node.frameId === 'string' ?
            nodeInfo.node.frameId : null;
        documentElement.dispose();
        return frameId;
    }
    async _getBoundingBox(handle) {
        const result = await this._client._sendMayFail('DOM.getBoxModel', {
            objectId: handle._objectId
        });
        if (!result)
            return null;
        const quad = result.model.border;
        const x = Math.min(quad[0], quad[2], quad[4], quad[6]);
        const y = Math.min(quad[1], quad[3], quad[5], quad[7]);
        const width = Math.max(quad[0], quad[2], quad[4], quad[6]) - x;
        const height = Math.max(quad[1], quad[3], quad[5], quad[7]) - y;
        const position = await this._framePosition();
        if (!position)
            return null;
        return { x: x + position.x, y: y + position.y, width, height };
    }
    async _framePosition() {
        const frame = this._page.frameManager.frame(this._targetId);
        if (!frame)
            return null;
        if (frame === this._page.mainFrame())
            return { x: 0, y: 0 };
        const element = await frame.frameElement();
        const box = await element.boundingBox();
        return box;
    }
    async _scrollRectIntoViewIfNeeded(handle, rect) {
        return await this._client.send('DOM.scrollIntoViewIfNeeded', {
            objectId: handle._objectId,
            rect,
        }).then(() => 'done').catch(e => {
            if (e instanceof Error && e.message.includes('Node does not have a layout object'))
                return 'error:notvisible';
            if (e instanceof Error && e.message.includes('Node is detached from document'))
                return 'error:notconnected';
            throw e;
        });
    }
    async _getContentQuads(handle) {
        const result = await this._client._sendMayFail('DOM.getContentQuads', {
            objectId: handle._objectId
        });
        if (!result)
            return null;
        const position = await this._framePosition();
        if (!position)
            return null;
        return result.quads.map(quad => [
            { x: quad[0] + position.x, y: quad[1] + position.y },
            { x: quad[2] + position.x, y: quad[3] + position.y },
            { x: quad[4] + position.x, y: quad[5] + position.y },
            { x: quad[6] + position.x, y: quad[7] + position.y }
        ]);
    }
    async _adoptElementHandle(handle, to) {
        const nodeInfo = await this._client.send('DOM.describeNode', {
            objectId: handle._objectId,
        });
        return this._adoptBackendNodeId(nodeInfo.node.backendNodeId, to);
    }
    async _adoptBackendNodeId(backendNodeId, to) {
        const result = await this._client._sendMayFail('DOM.resolveNode', {
            backendNodeId,
            executionContextId: to.delegate._contextId,
        });
        if (!result || result.object.subtype === 'null')
            throw new Error(dom.kUnableToAdoptErrorMessage);
        return (0, crExecutionContext_1.createHandle)(to, result.object).asElement();
    }
}
async function emulateLocale(session, locale) {
    try {
        await session.send('Emulation.setLocaleOverride', { locale });
    }
    catch (exception) {
        // All pages in the same renderer share locale. All such pages belong to the same
        // context and if locale is overridden for one of them its value is the same as
        // we are trying to set so it's not a problem.
        if (exception.message.includes('Another locale override is already in effect'))
            return;
        throw exception;
    }
}
async function emulateTimezone(session, timezoneId) {
    try {
        await session.send('Emulation.setTimezoneOverride', { timezoneId: timezoneId });
    }
    catch (exception) {
        if (exception.message.includes('Timezone override is already in effect'))
            return;
        if (exception.message.includes('Invalid timezone'))
            throw new Error(`Invalid timezone ID: ${timezoneId}`);
        throw exception;
    }
}
// Chromium reference: https://source.chromium.org/chromium/chromium/src/+/main:components/embedder_support/user_agent_utils.cc;l=434;drc=70a6711e08e9f9e0d8e4c48e9ba5cab62eb010c2
function calculateUserAgentMetadata(options) {
    const ua = options.userAgent;
    if (!ua)
        return undefined;
    const metadata = {
        mobile: !!options.isMobile,
        model: '',
        architecture: 'x86',
        platform: 'Windows',
        platformVersion: '',
    };
    const androidMatch = ua.match(/Android (\d+(\.\d+)?(\.\d+)?)/);
    const iPhoneMatch = ua.match(/iPhone OS (\d+(_\d+)?)/);
    const iPadMatch = ua.match(/iPad; CPU OS (\d+(_\d+)?)/);
    const macOSMatch = ua.match(/Mac OS X (\d+(_\d+)?(_\d+)?)/);
    const windowsMatch = ua.match(/Windows\D+(\d+(\.\d+)?(\.\d+)?)/);
    if (androidMatch) {
        metadata.platform = 'Android';
        metadata.platformVersion = androidMatch[1];
        metadata.architecture = 'arm';
    }
    else if (iPhoneMatch) {
        metadata.platform = 'iOS';
        metadata.platformVersion = iPhoneMatch[1];
        metadata.architecture = 'arm';
    }
    else if (iPadMatch) {
        metadata.platform = 'iOS';
        metadata.platformVersion = iPadMatch[1];
        metadata.architecture = 'arm';
    }
    else if (macOSMatch) {
        metadata.platform = 'macOS';
        metadata.platformVersion = macOSMatch[1];
        if (!ua.includes('Intel'))
            metadata.architecture = 'arm';
    }
    else if (windowsMatch) {
        metadata.platform = 'Windows';
        metadata.platformVersion = windowsMatch[1];
    }
    else if (ua.toLowerCase().includes('linux')) {
        metadata.platform = 'Linux';
    }
    if (ua.includes('ARM'))
        metadata.architecture = 'arm';
    return metadata;
}
