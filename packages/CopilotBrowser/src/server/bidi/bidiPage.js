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
exports.BidiPage = exports.kcopilotbrowserBindingChannel = void 0;
const debugLogger_1 = require("../utils/debugLogger");
const eventsHelper_1 = require("../utils/eventsHelper");
const dialog = __importStar(require("../dialog"));
const dom = __importStar(require("../dom"));
const bidiBrowser_1 = require("./bidiBrowser");
const page_1 = require("../page");
const bidiExecutionContext_1 = require("./bidiExecutionContext");
const bidiInput_1 = require("./bidiInput");
const bidiNetworkManager_1 = require("./bidiNetworkManager");
const bidiPdf_1 = require("./bidiPdf");
const network = __importStar(require("../network"));
const UTILITY_WORLD_NAME = '__copilotbrowser_utility_world__';
exports.kcopilotbrowserBindingChannel = 'copilotbrowserChannel';
class BidiPage {
    rawMouse;
    rawKeyboard;
    rawTouchscreen;
    _page;
    _session;
    _opener;
    _realmToContext;
    _realmToWorkerContext = new Map();
    _sessionListeners = [];
    _browserContext;
    _networkManager;
    _pdf;
    _initScriptIds = new Map();
    _fragmentNavigations = new Set();
    constructor(browserContext, bidiSession, opener) {
        this._session = bidiSession;
        this._opener = opener;
        this.rawKeyboard = new bidiInput_1.RawKeyboardImpl(bidiSession);
        this.rawMouse = new bidiInput_1.RawMouseImpl(bidiSession);
        this.rawTouchscreen = new bidiInput_1.RawTouchscreenImpl(bidiSession);
        this._realmToContext = new Map();
        this._page = new page_1.Page(this, browserContext);
        this._browserContext = browserContext;
        this._networkManager = new bidiNetworkManager_1.BidiNetworkManager(this._session, this._page);
        this._pdf = new bidiPdf_1.BidiPDF(this._session);
        this._page.on(page_1.Page.Events.FrameDetached, (frame) => this._removeContextsForFrame(frame, false));
        this._sessionListeners = [
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'script.realmCreated', this._onRealmCreated.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'script.message', this._onScriptMessage.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.contextDestroyed', this._onBrowsingContextDestroyed.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.navigationStarted', this._onNavigationStarted.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.navigationCommitted', this._onNavigationCommitted.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.navigationAborted', this._onNavigationAborted.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.navigationFailed', this._onNavigationFailed.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.fragmentNavigated', this._onFragmentNavigated.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.historyUpdated', this._onHistoryUpdated.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.domContentLoaded', this._onDomContentLoaded.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.load', this._onLoad.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.downloadWillBegin', this._onDownloadWillBegin.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.downloadEnd', this._onDownloadEnded.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'browsingContext.userPromptOpened', this._onUserPromptOpened.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'log.entryAdded', this._onLogEntryAdded.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'input.fileDialogOpened', this._onFileDialogOpened.bind(this)),
        ];
        // Initialize main frame.
        // TODO: Wait for first execution context to be created and maybe about:blank navigated.
        this._initialize().then(() => this._page.reportAsNew(this._opener?._page), error => this._page.reportAsNew(this._opener?._page, error));
    }
    async _initialize() {
        // Initialize main frame.
        this._onFrameAttached(this._session.sessionId, null);
        await Promise.all([
            this.updateHttpCredentials(),
            // If the page is created by the copilotbrowser client's call, some initialization
            // may be pending. Wait for it to complete before reporting the page as new.
        ]);
    }
    didClose() {
        this._session.dispose();
        eventsHelper_1.eventsHelper.removeEventListeners(this._sessionListeners);
        this._page._didClose();
    }
    _onFrameAttached(frameId, parentFrameId) {
        return this._page.frameManager.frameAttached(frameId, parentFrameId);
    }
    _removeContextsForFrame(frame, notifyFrame) {
        for (const [contextId, context] of this._realmToContext) {
            if (context.frame === frame) {
                this._realmToContext.delete(contextId);
                if (notifyFrame)
                    frame._contextDestroyed(context);
            }
        }
    }
    _onRealmCreated(realmInfo) {
        if (realmInfo.type === 'dedicated-worker') {
            const delegate = new bidiExecutionContext_1.BidiExecutionContext(this._session, realmInfo);
            const worker = new page_1.Worker(this._page, realmInfo.origin);
            this._realmToWorkerContext.set(realmInfo.realm, worker.createExecutionContext(delegate));
            worker.workerScriptLoaded();
            this._page.addWorker(realmInfo.realm, worker);
            return;
        }
        if (this._realmToContext.has(realmInfo.realm))
            return;
        if (realmInfo.type !== 'window')
            return;
        const frame = this._page.frameManager.frame(realmInfo.context);
        if (!frame)
            return;
        let worldName;
        if (!realmInfo.sandbox) {
            worldName = 'main';
            // Force creating utility world every time the main world is created (e.g. due to navigation).
            this._touchUtilityWorld(realmInfo.context);
        }
        else if (realmInfo.sandbox === UTILITY_WORLD_NAME) {
            worldName = 'utility';
        }
        else {
            return;
        }
        const delegate = new bidiExecutionContext_1.BidiExecutionContext(this._session, realmInfo);
        const context = new dom.FrameExecutionContext(delegate, frame, worldName);
        frame._contextCreated(worldName, context);
        this._realmToContext.set(realmInfo.realm, context);
    }
    async _touchUtilityWorld(context) {
        await this._session.sendMayFail('script.evaluate', {
            expression: '1 + 1',
            target: {
                context,
                sandbox: UTILITY_WORLD_NAME,
            },
            serializationOptions: {
                maxObjectDepth: 10,
                maxDomDepth: 10,
            },
            awaitPromise: true,
            userActivation: true,
        });
    }
    _onRealmDestroyed(params) {
        const context = this._realmToContext.get(params.realm);
        if (context) {
            this._realmToContext.delete(params.realm);
            context.frame._contextDestroyed(context);
            return true;
        }
        const existed = this._realmToWorkerContext.delete(params.realm);
        if (existed) {
            this._page.removeWorker(params.realm);
            return true;
        }
        return false;
    }
    // TODO: route the message directly to the browser
    _onBrowsingContextDestroyed(params) {
        this._browserContext._browser._onBrowsingContextDestroyed(params);
    }
    _onNavigationStarted(params) {
        const frameId = params.context;
        this._page.frameManager.frameRequestedNavigation(frameId, params.navigation);
    }
    _onNavigationCommitted(params) {
        const frameId = params.context;
        const frame = this._page.frameManager.frame(frameId);
        this._browserContext.doGrantGlobalPermissionsForURL(params.url).catch(error => debugLogger_1.debugLogger.log('error', error));
        this._page.frameManager.frameCommittedNewDocumentNavigation(frameId, params.url, frame._name, params.navigation, /* initial */ false);
    }
    _onDomContentLoaded(params) {
        const frameId = params.context;
        this._page.frameManager.frameLifecycleEvent(frameId, 'domcontentloaded');
    }
    _onLoad(params) {
        this._page.frameManager.frameLifecycleEvent(params.context, 'load');
    }
    _onNavigationAborted(params) {
        this._page.frameManager.frameAbortedNavigation(params.context, 'Navigation aborted', params.navigation || undefined);
    }
    _onNavigationFailed(params) {
        this._page.frameManager.frameAbortedNavigation(params.context, 'Navigation failed', params.navigation || undefined);
    }
    _onFragmentNavigated(params) {
        if (params.navigation)
            this._fragmentNavigations.add(params.navigation);
        this._page.frameManager.frameCommittedSameDocumentNavigation(params.context, params.url);
    }
    _onHistoryUpdated(params) {
        this._page.frameManager.frameCommittedSameDocumentNavigation(params.context, params.url);
    }
    _onUserPromptOpened(event) {
        this._page.browserContext.dialogManager.dialogDidOpen(new dialog.Dialog(this._page, event.type, event.message, async (accept, userText) => {
            await this._session.send('browsingContext.handleUserPrompt', { context: event.context, accept, userText });
        }, event.defaultValue));
    }
    _onDownloadWillBegin(event) {
        if (!event.navigation)
            return;
        this._page.frameManager.frameAbortedNavigation(event.context, 'Download is starting');
        let originPage = this._page.initializedOrUndefined();
        // If it's a new window download, report it on the opener page.
        if (!originPage && this._opener)
            originPage = this._opener._page.initializedOrUndefined();
        if (!originPage)
            return;
        this._browserContext._browser._downloadCreated(originPage, event.navigation, event.url, event.suggestedFilename);
    }
    _onDownloadEnded(event) {
        if (!event.navigation)
            return;
        this._browserContext._browser._downloadFinished(event.navigation, event.status === 'canceled' ? 'canceled' : undefined);
    }
    _onLogEntryAdded(params) {
        if (params.type === 'javascript' && params.level === 'error') {
            let errorName = '';
            let errorMessage;
            if (params.text?.includes(': ')) {
                const index = params.text.indexOf(': ');
                errorName = params.text.substring(0, index);
                errorMessage = params.text.substring(index + 2);
            }
            else {
                errorMessage = params.text ?? undefined;
            }
            const error = new Error(errorMessage);
            error.name = errorName;
            error.stack = `${params.text}\n${params.stackTrace?.callFrames.map(f => {
                const location = `${f.url}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
                return f.functionName ? `    at ${f.functionName} (${location})` : `    at ${location}`;
            }).join('\n')}`;
            this._page.addPageError(error);
            return;
        }
        if (params.type !== 'console')
            return;
        const entry = params;
        const context = this._realmToContext.get(params.source.realm) ?? this._realmToWorkerContext.get(params.source.realm);
        if (!context)
            return;
        const callFrame = params.stackTrace?.callFrames[0];
        const location = callFrame ?? { url: '', lineNumber: 1, columnNumber: 1 };
        this._page.addConsoleMessage(null, entry.method, entry.args.map(arg => (0, bidiExecutionContext_1.createHandle)(context, arg)), location, undefined, params.timestamp);
    }
    async _onFileDialogOpened(params) {
        if (!params.element)
            return;
        const frame = this._page.frameManager.frame(params.context);
        if (!frame)
            return;
        const executionContext = await frame._mainContext();
        try {
            const handle = await toBidiExecutionContext(executionContext).remoteObjectForNodeId(executionContext, { sharedId: params.element.sharedId });
            await this._page._onFileChooserOpened(handle);
        }
        catch { }
    }
    async navigateFrame(frame, url, referrer) {
        const { navigation } = await this._session.send('browsingContext.navigate', {
            context: frame._id,
            url,
        });
        if (navigation && this._fragmentNavigations.has(navigation)) {
            this._fragmentNavigations.delete(navigation);
            return {};
        }
        return { newDocumentId: navigation || undefined };
    }
    async updateExtraHTTPHeaders() {
        const allHeaders = network.mergeHeaders([
            this._browserContext._options.extraHTTPHeaders,
            this._page.extraHTTPHeaders(),
        ]);
        await this._session.send('network.setExtraHeaders', {
            headers: allHeaders.map(({ name, value }) => ({ name, value: { type: 'string', value } })),
            contexts: [this._session.sessionId],
        });
    }
    async updateEmulateMedia() {
    }
    async updateUserAgent() {
    }
    async bringToFront() {
        await this._session.send('browsingContext.activate', {
            context: this._session.sessionId,
        });
    }
    async updateEmulatedViewportSize() {
        const options = this._browserContext._options;
        const emulatedSize = this._page.emulatedSize();
        if (!emulatedSize)
            return;
        const screenSize = emulatedSize.screen;
        const viewportSize = emulatedSize.viewport;
        await Promise.all([
            this._session.send('browsingContext.setViewport', {
                context: this._session.sessionId,
                viewport: {
                    width: viewportSize.width,
                    height: viewportSize.height,
                },
                devicePixelRatio: options.deviceScaleFactor || 1
            }),
            this._session.send('emulation.setScreenOrientationOverride', {
                contexts: [this._session.sessionId],
                screenOrientation: (0, bidiBrowser_1.getScreenOrientation)(!!options.isMobile, screenSize)
            }),
            this._session.send('emulation.setScreenSettingsOverride', {
                contexts: [this._session.sessionId],
                screenArea: {
                    width: screenSize.width,
                    height: screenSize.height,
                }
            })
        ]);
    }
    async updateRequestInterception() {
        await this._networkManager.setRequestInterception(this._page.requestInterceptors.length > 0);
    }
    async updateOffline() {
    }
    async updateHttpCredentials() {
        await this._networkManager.setCredentials(this._browserContext._options.httpCredentials);
    }
    async updateFileChooserInterception() {
    }
    async reload() {
        await this._session.send('browsingContext.reload', {
            context: this._session.sessionId,
            // ignoreCache: true,
            wait: "interactive" /* bidi.BrowsingContext.ReadinessState.Interactive */,
        });
    }
    async goBack() {
        return await this._session.send('browsingContext.traverseHistory', {
            context: this._session.sessionId,
            delta: -1,
        }).then(() => true).catch(() => false);
    }
    async goForward() {
        return await this._session.send('browsingContext.traverseHistory', {
            context: this._session.sessionId,
            delta: +1,
        }).then(() => true).catch(() => false);
    }
    async requestGC() {
        const result = await this._session.send('script.evaluate', {
            expression: 'TestUtils.gc()',
            target: { context: this._session.sessionId },
            awaitPromise: true,
        });
        if (result.type === 'exception')
            throw new Error('Method not implemented.');
    }
    async _onScriptMessage(event) {
        if (event.channel !== exports.kcopilotbrowserBindingChannel)
            return;
        const pageOrError = await this._page.waitForInitializedOrError();
        if (pageOrError instanceof Error)
            return;
        const context = this._realmToContext.get(event.source.realm);
        if (!context)
            return;
        if (event.data.type !== 'string')
            return;
        await this._page.onBindingCalled(event.data.value, context);
    }
    async addInitScript(initScript) {
        const { script } = await this._session.send('script.addPreloadScript', {
            // TODO: remove function call from the source.
            functionDeclaration: `() => { return ${initScript.source} }`,
            // TODO: push to iframes?
            contexts: [this._session.sessionId],
        });
        this._initScriptIds.set(initScript, script);
    }
    async removeInitScripts(initScripts) {
        const ids = [];
        for (const script of initScripts) {
            const id = this._initScriptIds.get(script);
            if (id)
                ids.push(id);
            this._initScriptIds.delete(script);
        }
        await Promise.all(ids.map(script => this._session.send('script.removePreloadScript', { script })));
    }
    async closePage(runBeforeUnload) {
        if (runBeforeUnload) {
            this._session.sendMayFail('browsingContext.close', {
                context: this._session.sessionId,
                promptUnload: runBeforeUnload,
            });
        }
        else {
            await this._session.send('browsingContext.close', {
                context: this._session.sessionId,
                promptUnload: runBeforeUnload,
            });
        }
    }
    async setBackgroundColor(color) {
        if (color)
            throw new Error('Not implemented');
    }
    async takeScreenshot(progress, format, documentRect, viewportRect, quality, fitsViewport, scale) {
        const rect = (documentRect || viewportRect);
        const { data } = await progress.race(this._session.send('browsingContext.captureScreenshot', {
            context: this._session.sessionId,
            format: {
                type: `image/${format === 'png' ? 'png' : 'jpeg'}`,
                quality: quality ? quality / 100 : 0.8,
            },
            origin: documentRect ? 'document' : 'viewport',
            clip: {
                type: 'box',
                ...rect,
            }
        }));
        return Buffer.from(data, 'base64');
    }
    async getContentFrame(handle) {
        const executionContext = toBidiExecutionContext(handle._context);
        const frameId = await executionContext.contentFrameIdForFrame(handle);
        if (!frameId)
            return null;
        return this._page.frameManager.frame(frameId);
    }
    async getOwnerFrame(handle) {
        // TODO: switch to utility world?
        const windowHandle = await handle.evaluateHandle(node => {
            const doc = node.ownerDocument ?? node;
            return doc.defaultView;
        });
        if (!windowHandle)
            return null;
        const executionContext = toBidiExecutionContext(handle._context);
        return executionContext.frameIdForWindowHandle(windowHandle);
    }
    async getBoundingBox(handle) {
        const box = await handle.evaluate(element => {
            if (!(element instanceof Element))
                return null;
            const rect = element.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
        if (!box)
            return null;
        const position = await this._framePosition(handle._frame);
        if (!position)
            return null;
        box.x += position.x;
        box.y += position.y;
        return box;
    }
    // TODO: move to Frame.
    async _framePosition(frame) {
        if (frame === this._page.mainFrame())
            return { x: 0, y: 0 };
        const element = await frame.frameElement();
        const box = await element.boundingBox();
        if (!box)
            return null;
        const style = await element.evaluateInUtility(([injected, iframe]) => injected.describeIFrameStyle(iframe), {}).catch(e => 'error:notconnected');
        if (style === 'error:notconnected' || style === 'transformed')
            return null;
        // Content box is offset by border and padding widths.
        box.x += style.left;
        box.y += style.top;
        return box;
    }
    async scrollRectIntoViewIfNeeded(handle, rect) {
        return await handle.evaluateInUtility(([injected, node]) => {
            node.scrollIntoView({
                block: 'center',
                inline: 'center',
                behavior: 'instant',
            });
        }, null).then(() => 'done').catch(e => {
            if (e instanceof Error && e.message.includes('Node is detached from document'))
                return 'error:notconnected';
            if (e instanceof Error && e.message.includes('Node does not have a layout object'))
                return 'error:notvisible';
            throw e;
        });
    }
    async startScreencast(options) {
    }
    async stopScreencast() {
    }
    rafCountForStablePosition() {
        return 1;
    }
    async getContentQuads(handle) {
        const quads = await handle.evaluateInUtility(([injected, node]) => {
            if (!node.isConnected)
                return 'error:notconnected';
            const rects = node.getClientRects();
            if (!rects)
                return null;
            return [...rects].map(rect => [
                { x: rect.left, y: rect.top },
                { x: rect.right, y: rect.top },
                { x: rect.right, y: rect.bottom },
                { x: rect.left, y: rect.bottom },
            ]);
        }, null);
        if (!quads || quads === 'error:notconnected')
            return quads;
        // TODO: consider transforming quads to support clicks in iframes.
        const position = await this._framePosition(handle._frame);
        if (!position)
            return null;
        quads.forEach(quad => quad.forEach(point => {
            point.x += position.x;
            point.y += position.y;
        }));
        return quads;
    }
    async setInputFilePaths(handle, paths) {
        const fromContext = toBidiExecutionContext(handle._context);
        await this._session.send('input.setFiles', {
            context: this._session.sessionId,
            element: await fromContext.nodeIdForElementHandle(handle),
            files: paths,
        });
    }
    async adoptElementHandle(handle, to) {
        const fromContext = toBidiExecutionContext(handle._context);
        const nodeId = await fromContext.nodeIdForElementHandle(handle);
        const executionContext = toBidiExecutionContext(to);
        return await executionContext.remoteObjectForNodeId(to, nodeId);
    }
    async inputActionEpilogue() {
    }
    async resetForReuse(progress) {
    }
    async pdf(options) {
        return this._pdf.generate(options);
    }
    async getFrameElement(frame) {
        const parent = frame.parentFrame();
        if (!parent)
            throw new Error('Frame has been detached.');
        const node = await this._getFrameNode(frame);
        if (!node?.sharedId)
            throw new Error('Frame has been detached.');
        const parentFrameExecutionContext = await parent._mainContext();
        return await toBidiExecutionContext(parentFrameExecutionContext).remoteObjectForNodeId(parentFrameExecutionContext, { sharedId: node.sharedId });
    }
    async _getFrameNode(frame) {
        const parent = frame.parentFrame();
        if (!parent)
            return undefined;
        const result = await this._session.send('browsingContext.locateNodes', {
            context: parent._id,
            locator: { type: 'context', value: { context: frame._id } },
        });
        const node = result.nodes[0];
        return node;
    }
    shouldToggleStyleSheetToSyncAnimations() {
        return true;
    }
    async setDockTile(image) {
    }
}
exports.BidiPage = BidiPage;
function toBidiExecutionContext(executionContext) {
    return executionContext.delegate;
}
