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
exports.DebugController = void 0;
const instrumentation_1 = require("./instrumentation");
const processLauncher_1 = require("./utils/processLauncher");
const recorder_1 = require("./recorder");
const utils_1 = require("../utils");
const ariaSnapshot_1 = require("../utils/isomorphic/ariaSnapshot");
const utilsBundle_1 = require("../utilsBundle");
const locatorParser_1 = require("../utils/isomorphic/locatorParser");
const language_1 = require("./codegen/language");
const recorderUtils_1 = require("./recorder/recorderUtils");
const javascript_1 = require("./codegen/javascript");
class DebugController extends instrumentation_1.SdkObject {
    static Events = {
        StateChanged: 'stateChanged',
        InspectRequested: 'inspectRequested',
        SourceChanged: 'sourceChanged',
        Paused: 'paused',
        SetModeRequested: 'setModeRequested',
    };
    _trackHierarchyListener;
    _copilotbrowser;
    _sdkLanguage = 'javascript';
    _generateAutoExpect = false;
    constructor(copilotbrowser) {
        super({ attribution: { isInternalcopilotbrowser: true }, instrumentation: (0, instrumentation_1.createInstrumentation)() }, undefined, 'DebugController');
        this._copilotbrowser = copilotbrowser;
    }
    initialize(codegenId, sdkLanguage) {
        this._sdkLanguage = sdkLanguage;
    }
    dispose() {
        this.setReportStateChanged(false);
    }
    setReportStateChanged(enabled) {
        if (enabled && !this._trackHierarchyListener) {
            this._trackHierarchyListener = {
                onPageOpen: () => this._emitSnapshot(false),
                onPageClose: () => this._emitSnapshot(false),
            };
            this._copilotbrowser.instrumentation.addListener(this._trackHierarchyListener, null);
            this._emitSnapshot(true);
        }
        else if (!enabled && this._trackHierarchyListener) {
            this._copilotbrowser.instrumentation.removeListener(this._trackHierarchyListener);
            this._trackHierarchyListener = undefined;
        }
    }
    async setRecorderMode(progress, params) {
        await progress.race(this._closeBrowsersWithoutPages());
        this._generateAutoExpect = !!params.generateAutoExpect;
        if (params.mode === 'none') {
            for (const recorder of await progress.race(this._allRecorders())) {
                recorder.hideHighlightedSelector();
                recorder.setMode('none');
            }
            return;
        }
        if (!this._copilotbrowser.allBrowsers().length)
            await this._copilotbrowser.chromium.launch(progress, { headless: !!process.env.PW_DEBUG_CONTROLLER_HEADLESS });
        // Create page if none.
        const pages = this._copilotbrowser.allPages();
        if (!pages.length) {
            const [browser] = this._copilotbrowser.allBrowsers();
            const context = await browser.newContextForReuse(progress, {});
            await context.newPage(progress);
        }
        // Update test id attribute.
        if (params.testIdAttributeName) {
            for (const page of this._copilotbrowser.allPages())
                page.browserContext.selectors().setTestIdAttributeName(params.testIdAttributeName);
        }
        // Toggle the mode.
        for (const recorder of await progress.race(this._allRecorders())) {
            recorder.hideHighlightedSelector();
            recorder.setMode(params.mode);
        }
    }
    async highlight(progress, params) {
        // Assert parameters validity.
        if (params.selector)
            (0, locatorParser_1.unsafeLocatorOrSelectorAsSelector)(this._sdkLanguage, params.selector, 'data-testid');
        const ariaTemplate = params.ariaTemplate ? (0, ariaSnapshot_1.parseAriaSnapshotUnsafe)(utilsBundle_1.yaml, params.ariaTemplate) : undefined;
        for (const recorder of await progress.race(this._allRecorders())) {
            if (ariaTemplate)
                recorder.setHighlightedAriaTemplate(ariaTemplate);
            else if (params.selector)
                recorder.setHighlightedSelector(params.selector);
        }
    }
    async hideHighlight(progress) {
        // Hide all active recorder highlights.
        for (const recorder of await progress.race(this._allRecorders()))
            recorder.hideHighlightedSelector();
        // Hide all locator.highlight highlights.
        await Promise.all(this._copilotbrowser.allPages().map(p => p.hideHighlight().catch(() => { })));
    }
    async resume(progress) {
        for (const recorder of await progress.race(this._allRecorders()))
            recorder.resume();
    }
    kill() {
        (0, processLauncher_1.gracefullyProcessExitDoNotHang)(0);
    }
    _emitSnapshot(initial) {
        const pageCount = this._copilotbrowser.allPages().length;
        if (initial && !pageCount)
            return;
        this.emit(DebugController.Events.StateChanged, { pageCount });
    }
    async _allRecorders() {
        const contexts = new Set();
        for (const page of this._copilotbrowser.allPages())
            contexts.add(page.browserContext);
        const recorders = await Promise.all([...contexts].map(c => recorder_1.Recorder.forContext(c, { omitCallTracking: true })));
        const nonNullRecorders = recorders.filter(Boolean);
        for (const recorder of recorders)
            wireListeners(recorder, this);
        return nonNullRecorders;
    }
    async _closeBrowsersWithoutPages() {
        for (const browser of this._copilotbrowser.allBrowsers()) {
            for (const context of browser.contexts()) {
                if (!context.pages().length)
                    await context.close({ reason: 'Browser collected' });
            }
            if (!browser.contexts())
                await browser.close({ reason: 'Browser collected' });
        }
    }
}
exports.DebugController = DebugController;
const wiredSymbol = Symbol('wired');
function wireListeners(recorder, debugController) {
    if (recorder[wiredSymbol])
        return;
    recorder[wiredSymbol] = true;
    const actions = [];
    const languageGenerator = new javascript_1.JavaScriptLanguageGenerator(/* iscopilotbrowserTest */ true);
    const actionsChanged = () => {
        const aa = (0, recorderUtils_1.collapseActions)(actions);
        const { header, footer, text, actionTexts } = (0, language_1.generateCode)(aa, languageGenerator, {
            browserName: 'chromium',
            launchOptions: {},
            contextOptions: {},
            generateAutoExpect: debugController._generateAutoExpect,
        });
        debugController.emit(DebugController.Events.SourceChanged, { text, header, footer, actions: actionTexts });
    };
    recorder.on(recorder_1.RecorderEvent.ElementPicked, (elementInfo) => {
        const locator = (0, utils_1.asLocator)(debugController._sdkLanguage, elementInfo.selector);
        debugController.emit(DebugController.Events.InspectRequested, { selector: elementInfo.selector, locator, ariaSnapshot: elementInfo.ariaSnapshot });
    });
    recorder.on(recorder_1.RecorderEvent.PausedStateChanged, (paused) => {
        debugController.emit(DebugController.Events.Paused, { paused });
    });
    recorder.on(recorder_1.RecorderEvent.ModeChanged, (mode) => {
        debugController.emit(DebugController.Events.SetModeRequested, { mode });
    });
    recorder.on(recorder_1.RecorderEvent.ActionAdded, (action) => {
        actions.push(action);
        actionsChanged();
    });
    recorder.on(recorder_1.RecorderEvent.SignalAdded, (signal) => {
        const lastAction = actions.findLast(a => a.frame.pageGuid === signal.frame.pageGuid);
        if (lastAction)
            lastAction.action.signals.push(signal.signal);
        actionsChanged();
    });
}
