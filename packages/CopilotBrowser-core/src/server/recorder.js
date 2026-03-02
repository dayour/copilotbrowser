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
exports.Recorder = exports.RecorderEvent = void 0;
const events_1 = __importDefault(require("events"));
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("../utils");
const browserContext_1 = require("./browserContext");
const debugger_1 = require("./debugger");
const recorderUtils_1 = require("./recorder/recorderUtils");
const locatorParser_1 = require("../utils/isomorphic/locatorParser");
const selectorParser_1 = require("../utils/isomorphic/selectorParser");
const progress_1 = require("./progress");
const recorderSignalProcessor_1 = require("./recorder/recorderSignalProcessor");
const rawRecorderSource = __importStar(require("./../generated/pollingRecorderSource"));
const utils_2 = require("./../utils");
const frames_1 = require("./frames");
const page_1 = require("./page");
const recorderRunner_1 = require("./recorder/recorderRunner");
const recorderSymbol = Symbol('recorderSymbol');
exports.RecorderEvent = {
    PausedStateChanged: 'pausedStateChanged',
    ModeChanged: 'modeChanged',
    ElementPicked: 'elementPicked',
    CallLogsUpdated: 'callLogsUpdated',
    UserSourcesChanged: 'userSourcesChanged',
    ActionAdded: 'actionAdded',
    SignalAdded: 'signalAdded',
    PageNavigated: 'pageNavigated',
    ContextClosed: 'contextClosed',
};
class Recorder extends events_1.default {
    handleSIGINT;
    _context;
    _params;
    _mode;
    _highlightedElement = {};
    _overlayState = { offsetX: 0 };
    _currentCallsMetadata = new Map();
    _userSources = new Map();
    _debugger;
    _omitCallTracking = false;
    _currentLanguage = 'javascript';
    _recorderMode;
    _signalProcessor;
    _pageAliases = new Map();
    _lastPopupOrdinal = 0;
    _lastDialogOrdinal = -1;
    _lastDownloadOrdinal = -1;
    _listeners = [];
    _enabled = false;
    _callLogs = [];
    static forContext(context, params) {
        let recorderPromise = context[recorderSymbol];
        if (!recorderPromise) {
            recorderPromise = Recorder._create(context, params);
            context[recorderSymbol] = recorderPromise;
        }
        return recorderPromise;
    }
    static async existingForContext(context) {
        const recorderPromise = context[recorderSymbol];
        return await recorderPromise;
    }
    static async _create(context, params = {}) {
        const recorder = new Recorder(context, params);
        await recorder._install();
        return recorder;
    }
    constructor(context, params) {
        super();
        this._context = context;
        this._params = params;
        this._mode = params.mode || 'none';
        this._recorderMode = params.recorderMode ?? 'default';
        this.handleSIGINT = params.handleSIGINT;
        this._signalProcessor = new recorderSignalProcessor_1.RecorderSignalProcessor({
            addAction: (actionInContext) => {
                if (this._enabled)
                    this.emit(exports.RecorderEvent.ActionAdded, actionInContext);
            },
            addSignal: (signal) => {
                if (this._enabled)
                    this.emit(exports.RecorderEvent.SignalAdded, signal);
            },
        });
        context.on(browserContext_1.BrowserContext.Events.BeforeClose, () => {
            this.emit(exports.RecorderEvent.ContextClosed);
        });
        this._listeners.push(utils_2.eventsHelper.addEventListener(process, 'exit', () => {
            this.emit(exports.RecorderEvent.ContextClosed);
        }));
        this._setEnabled(params.mode === 'recording');
        this._omitCallTracking = !!params.omitCallTracking;
        this._debugger = context.debugger();
        context.instrumentation.addListener(this, context);
        if ((0, utils_1.isUnderTest)()) {
            // Most of our tests put elements at the top left, so get out of the way.
            this._overlayState.offsetX = 200;
        }
    }
    async _debugLog(...args) {
        if ((0, utils_1.isUnderTest)())
            // eslint-disable-next-line no-console
            console.log((0, utils_2.monotonicTime)(), ...args);
    }
    async _install() {
        this.emit(exports.RecorderEvent.ModeChanged, this._mode);
        this.emit(exports.RecorderEvent.PausedStateChanged, this._debugger.isPaused());
        this._context.once(browserContext_1.BrowserContext.Events.Close, () => {
            utils_2.eventsHelper.removeEventListeners(this._listeners);
            this._context.instrumentation.removeListener(this);
            this.emit(exports.RecorderEvent.ContextClosed);
        });
        const controller = new progress_1.ProgressController();
        await controller.run(async (progress) => {
            if ((0, utils_1.isUnderTest)()) {
                await this._context.exposeBinding(progress, '__pw_recorderLog', false, async ({ frame }, args) => {
                    this._debugLog('__pw_recorderLog', ...args);
                });
            }
            await this._context.exposeBinding(progress, '__pw_recorderState', false, async (source) => {
                let actionSelector;
                let actionPoint;
                const hasActiveScreenshotCommand = [...this._currentCallsMetadata.keys()].some(isScreenshotCommand);
                if (!hasActiveScreenshotCommand) {
                    actionSelector = await this._scopeHighlightedSelectorToFrame(source.frame);
                    for (const [metadata, sdkObject] of this._currentCallsMetadata) {
                        if (source.page === sdkObject.attribution.page) {
                            actionPoint = metadata.point || actionPoint;
                            actionSelector = actionSelector || metadata.params.selector;
                        }
                    }
                }
                const uiState = {
                    mode: this._mode,
                    actionPoint,
                    actionSelector,
                    ariaTemplate: this._highlightedElement.ariaTemplate,
                    language: this._currentLanguage,
                    testIdAttributeName: this._testIdAttributeName(),
                    overlay: this._overlayState,
                };
                this._debugLog('__pw_recorderState', uiState);
                return uiState;
            });
            await this._context.exposeBinding(progress, '__pw_recorderElementPicked', false, async ({ frame }, elementInfo) => {
                this._debugLog('__pw_recorderElementPicked', elementInfo);
                const selectorChain = await (0, recorderUtils_1.generateFrameSelector)(frame);
                this._debugLog('__pw_recorderElementPicked selector', selectorChain);
                this.emit(exports.RecorderEvent.ElementPicked, { selector: (0, recorderUtils_1.buildFullSelector)(selectorChain, elementInfo.selector), ariaSnapshot: elementInfo.ariaSnapshot }, true);
            });
            await this._context.exposeBinding(progress, '__pw_recorderSetMode', false, async ({ frame }, mode) => {
                this._debugLog('__pw_recorderSetMode', mode);
                if (frame.parentFrame())
                    return;
                this.setMode(mode);
            });
            await this._context.exposeBinding(progress, '__pw_recorderSetOverlayState', false, async ({ frame }, state) => {
                this._debugLog('__pw_recorderSetOverlayState', state);
                if (frame.parentFrame())
                    return;
                this._overlayState = state;
            });
            await this._context.exposeBinding(progress, '__pw_resume', false, () => {
                this._debugLog('__pw_resume');
                this._debugger.resume(false);
            });
            this._context.on(browserContext_1.BrowserContext.Events.Page, (page) => this._onPage(page));
            for (const page of this._context.pages())
                this._onPage(page);
            this._context.dialogManager.addDialogHandler(dialog => {
                this._onDialog(dialog.page());
                // Not handling the dialog, let it automatically close.
                return false;
            });
            // Input actions that potentially lead to navigation are intercepted on the page and are
            // performed by the copilotbrowser.
            await this._context.exposeBinding(progress, '__pw_recorderPerformAction', false, (source, action) => this._performAction(source.frame, action));
            // Other non-essential actions are simply being recorded.
            await this._context.exposeBinding(progress, '__pw_recorderRecordAction', false, (source, action) => this._recordAction(source.frame, action));
            await this._context.extendInjectedScript(rawRecorderSource.source, { recorderMode: this._recorderMode });
        });
        if (this._debugger.isPaused())
            this._pausedStateChanged();
        this._debugger.on(debugger_1.Debugger.Events.PausedStateChanged, () => this._pausedStateChanged());
    }
    _pausedStateChanged() {
        this._debugLog('_pausedStateChanged');
        // If we are called upon page.pause, we don't have metadatas, populate them.
        for (const { metadata, sdkObject } of this._debugger.pausedDetails()) {
            if (!this._currentCallsMetadata.has(metadata))
                this.onBeforeCall(sdkObject, metadata);
        }
        this.emit(exports.RecorderEvent.PausedStateChanged, this._debugger.isPaused());
        this._updateUserSources();
        this.updateCallLog([...this._currentCallsMetadata.keys()]);
    }
    mode() {
        return this._mode;
    }
    setMode(mode) {
        this._debugLog('setMode', mode);
        if (this._mode === mode)
            return;
        this._highlightedElement = {};
        this._mode = mode;
        this.emit(exports.RecorderEvent.ModeChanged, this._mode);
        this._setEnabled(this._isRecording());
        this._debugger.setMuted(this._isRecording());
        if (this._mode !== 'none' && this._mode !== 'standby' && this._context.pages().length === 1)
            this._context.pages()[0].bringToFront().catch(() => { });
        this._refreshOverlay();
    }
    url() {
        const page = this._context.pages()[0];
        return page?.mainFrame().url();
    }
    setHighlightedSelector(selector) {
        this._debugLog('setHighlightedSelector', selector);
        this._highlightedElement = { selector: (0, locatorParser_1.locatorOrSelectorAsSelector)(this._currentLanguage, selector, this._context.selectors().testIdAttributeName()) };
        this._refreshOverlay();
    }
    setHighlightedAriaTemplate(ariaTemplate) {
        this._highlightedElement = { ariaTemplate };
        this._refreshOverlay();
    }
    step() {
        this._debugger.resume(true);
    }
    setLanguage(language) {
        this._currentLanguage = language;
        this._refreshOverlay();
    }
    resume() {
        this._debugger.resume(false);
    }
    pause() {
        this._debugger.pauseOnNextStatement();
    }
    paused() {
        return this._debugger.isPaused();
    }
    close() {
        this._debugger.resume(false);
    }
    hideHighlightedSelector() {
        this._highlightedElement = {};
        this._refreshOverlay();
    }
    pausedSourceId() {
        for (const { metadata } of this._debugger.pausedDetails()) {
            if (!metadata.location)
                continue;
            const source = this._userSources.get(metadata.location.file);
            if (!source)
                continue;
            return source.id;
        }
    }
    userSources() {
        return [...this._userSources.values()];
    }
    callLog() {
        return this._callLogs;
    }
    async _scopeHighlightedSelectorToFrame(frame) {
        if (!this._highlightedElement.selector)
            return;
        try {
            const mainFrame = frame._page.mainFrame();
            const resolved = await mainFrame.selectors.resolveFrameForSelector(this._highlightedElement.selector);
            // selector couldn't be found, don't highlight anything
            if (!resolved)
                return '';
            // selector points to no specific frame, highlight in all frames
            if (resolved?.frame === mainFrame)
                return (0, selectorParser_1.stringifySelector)(resolved.info.parsed);
            // selector points to this frame, highlight it
            if (resolved?.frame === frame)
                return (0, selectorParser_1.stringifySelector)(resolved.info.parsed);
            // selector points to a different frame, highlight nothing
            return '';
        }
        catch {
            return '';
        }
    }
    _refreshOverlay() {
        for (const page of this._context.pages()) {
            for (const frame of page.frames())
                frame.evaluateExpression('window.__pw_refreshOverlay()').catch(() => { });
        }
    }
    async onBeforeCall(sdkObject, metadata) {
        if (this._omitCallTracking || this._isRecording())
            return;
        this._debugLog('onBeforeCall', metadata.method, metadata.params);
        this._currentCallsMetadata.set(metadata, sdkObject);
        this._updateUserSources();
        this.updateCallLog([metadata]);
        if (isScreenshotCommand(metadata))
            this.hideHighlightedSelector();
        else if (metadata.params && metadata.params.selector)
            this._highlightedElement = { selector: metadata.params.selector };
    }
    async onAfterCall(sdkObject, metadata) {
        if (this._omitCallTracking || this._isRecording())
            return;
        this._debugLog('onAfterCall', metadata.method, metadata.params);
        if (!metadata.error)
            this._currentCallsMetadata.delete(metadata);
        this._updateUserSources();
        this.updateCallLog([metadata]);
    }
    _updateUserSources() {
        // Remove old decorations.
        for (const source of this._userSources.values()) {
            source.highlight = [];
            source.revealLine = undefined;
        }
        // Apply new decorations.
        for (const metadata of this._currentCallsMetadata.keys()) {
            if (!metadata.location)
                continue;
            const { file, line } = metadata.location;
            let source = this._userSources.get(file);
            if (!source) {
                source = { isRecorded: false, label: file, id: file, text: this._readSource(file), highlight: [], language: languageForFile(file) };
                this._userSources.set(file, source);
            }
            if (line) {
                const paused = this._debugger.isPaused(metadata);
                source.highlight.push({ line, type: metadata.error ? 'error' : (paused ? 'paused' : 'running') });
                source.revealLine = line;
            }
        }
        this.emit(exports.RecorderEvent.UserSourcesChanged, this.userSources(), this.pausedSourceId());
    }
    async onBeforeInputAction(sdkObject, metadata) {
    }
    async onCallLog(sdkObject, metadata, logName, message) {
        this.updateCallLog([metadata]);
    }
    updateCallLog(metadatas) {
        if (this._isRecording())
            return;
        const logs = [];
        for (const metadata of metadatas) {
            if (!metadata.method || metadata.internal)
                continue;
            let status = 'done';
            if (this._currentCallsMetadata.has(metadata))
                status = 'in-progress';
            if (this._debugger.isPaused(metadata))
                status = 'paused';
            logs.push((0, recorderUtils_1.metadataToCallLog)(metadata, status));
        }
        this._callLogs = logs;
        this.emit(exports.RecorderEvent.CallLogsUpdated, logs);
    }
    _isRecording() {
        return ['recording', 'assertingText', 'assertingVisibility', 'assertingValue', 'assertingSnapshot'].includes(this._mode);
    }
    _readSource(fileName) {
        try {
            return fs_1.default.readFileSync(fileName, 'utf-8');
        }
        catch (e) {
            return '// No source available';
        }
    }
    _setEnabled(enabled) {
        this._enabled = enabled;
    }
    async _onPage(page) {
        this._debugLog('_onPage', page.guid);
        // First page is called page, others are called popup1, popup2, etc.
        const frame = page.mainFrame();
        page.on(page_1.Page.Events.Close, () => {
            this._debugLog('close');
            this._signalProcessor.addAction({
                frame: this._describeMainFrame(page),
                action: {
                    name: 'closePage',
                    signals: [],
                },
                startTime: (0, utils_2.monotonicTime)()
            });
            this._pageAliases.delete(page);
            this._filePrimaryURLChanged();
        });
        frame.on(frames_1.Frame.Events.InternalNavigation, event => {
            this._debugLog('internal navigation');
            if (event.isPublic) {
                this._onFrameNavigated(frame, page);
                this._filePrimaryURLChanged();
            }
        });
        page.on(page_1.Page.Events.Download, () => this._onDownload(page));
        const suffix = this._pageAliases.size ? String(++this._lastPopupOrdinal) : '';
        const pageAlias = 'page' + suffix;
        this._pageAliases.set(page, pageAlias);
        if (page.opener()) {
            this._onPopup(page.opener(), page);
        }
        else {
            this._signalProcessor.addAction({
                frame: this._describeMainFrame(page),
                action: {
                    name: 'openPage',
                    url: page.mainFrame().url(),
                    signals: [],
                },
                startTime: (0, utils_2.monotonicTime)()
            });
        }
        this._filePrimaryURLChanged();
    }
    _filePrimaryURLChanged() {
        const page = this._context.pages()[0];
        this.emit(exports.RecorderEvent.PageNavigated, page?.mainFrame().url());
    }
    clear() {
        if (this._params.mode === 'recording') {
            for (const page of this._context.pages())
                this._onFrameNavigated(page.mainFrame(), page);
        }
    }
    _describeMainFrame(page) {
        return {
            pageGuid: page.guid,
            pageAlias: this._pageAliases.get(page),
            framePath: [],
        };
    }
    async _describeFrame(frame) {
        return {
            pageGuid: frame._page.guid,
            pageAlias: this._pageAliases.get(frame._page),
            framePath: await (0, recorderUtils_1.generateFrameSelector)(frame),
        };
    }
    _testIdAttributeName() {
        return this._params.testIdAttributeName || this._context.selectors().testIdAttributeName() || 'data-testid';
    }
    async _createActionInContext(frame, action) {
        const frameDescription = await this._describeFrame(frame);
        const actionInContext = {
            frame: frameDescription,
            action,
            description: undefined,
            startTime: (0, utils_2.monotonicTime)(),
        };
        return actionInContext;
    }
    async _performAction(frame, action) {
        this._debugLog('_performAction', action);
        const actionInContext = await this._createActionInContext(frame, action);
        this._signalProcessor.addAction(actionInContext);
        if (actionInContext.action.name !== 'openPage' && actionInContext.action.name !== 'closePage')
            await (0, recorderRunner_1.performAction)(this._pageAliases, actionInContext);
        actionInContext.endTime = (0, utils_2.monotonicTime)();
    }
    async _recordAction(frame, action) {
        this._debugLog('_recordAction', action);
        const actionInContext = await this._createActionInContext(frame, action);
        this._signalProcessor.addAction(actionInContext);
    }
    _onFrameNavigated(frame, page) {
        const pageAlias = this._pageAliases.get(page);
        this._signalProcessor.signal(pageAlias, frame, { name: 'navigation', url: frame.url() });
    }
    _onPopup(page, popup) {
        this._debugLog('popup');
        const pageAlias = this._pageAliases.get(page);
        const popupAlias = this._pageAliases.get(popup);
        this._signalProcessor.signal(pageAlias, page.mainFrame(), { name: 'popup', popupAlias });
    }
    _onDownload(page) {
        this._debugLog('download');
        const pageAlias = this._pageAliases.get(page);
        ++this._lastDownloadOrdinal;
        this._signalProcessor.signal(pageAlias, page.mainFrame(), { name: 'download', downloadAlias: this._lastDownloadOrdinal ? String(this._lastDownloadOrdinal) : '' });
    }
    _onDialog(page) {
        this._debugLog('onDialog');
        const pageAlias = this._pageAliases.get(page);
        ++this._lastDialogOrdinal;
        this._signalProcessor.signal(pageAlias, page.mainFrame(), { name: 'dialog', dialogAlias: this._lastDialogOrdinal ? String(this._lastDialogOrdinal) : '' });
    }
}
exports.Recorder = Recorder;
function isScreenshotCommand(metadata) {
    return metadata.method.toLowerCase().includes('screenshot');
}
function languageForFile(file) {
    if (file.endsWith('.py'))
        return 'python';
    if (file.endsWith('.java'))
        return 'java';
    if (file.endsWith('.cs'))
        return 'csharp';
    return 'javascript';
}
