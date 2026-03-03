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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgrammaticRecorderApp = exports.RecorderApp = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const debug_1 = require("../utils/debug");
const utilsBundle_1 = require("../../utilsBundle");
const launchApp_1 = require("../launchApp");
const launchApp_2 = require("../launchApp");
const progress_1 = require("../progress");
const throttledFile_1 = require("./throttledFile");
const languages_1 = require("../codegen/languages");
const recorderUtils_1 = require("./recorderUtils");
const language_1 = require("../codegen/language");
const recorder_1 = require("../recorder");
const browserContext_1 = require("../browserContext");
class RecorderApp {
    _recorder;
    _page;
    wsEndpointForTest;
    _languageGeneratorOptions;
    _throttledOutputFile = null;
    _actions = [];
    _userSources = [];
    _recorderSources = [];
    _primaryGeneratorId;
    _selectedGeneratorId;
    _frontend;
    constructor(recorder, params, page, wsEndpointForTest) {
        this._page = page;
        this._recorder = recorder;
        this._frontend = createRecorderFrontend(page);
        this.wsEndpointForTest = wsEndpointForTest;
        // Make a copy of options to modify them later.
        this._languageGeneratorOptions = {
            browserName: params.browserName,
            launchOptions: { headless: false, ...params.launchOptions, tracesDir: undefined },
            contextOptions: { ...params.contextOptions },
            deviceName: params.device,
            saveStorage: params.saveStorage,
        };
        this._throttledOutputFile = params.outputFile ? new throttledFile_1.ThrottledFile(params.outputFile) : null;
        this._primaryGeneratorId = process.env.TEST_INSPECTOR_LANGUAGE || params.language || determinePrimaryGeneratorId(params.sdkLanguage);
        this._selectedGeneratorId = this._primaryGeneratorId;
        for (const languageGenerator of (0, languages_1.languageSet)()) {
            if (languageGenerator.id === this._primaryGeneratorId)
                this._recorder.setLanguage(languageGenerator.highlighter);
        }
    }
    async _init(inspectedContext) {
        await (0, launchApp_1.syncLocalStorageWithSettings)(this._page, 'recorder');
        const controller = new progress_1.ProgressController();
        await controller.run(async (progress) => {
            await this._page.addRequestInterceptor(progress, route => {
                if (!route.request().url().startsWith('https://copilotbrowser/')) {
                    route.continue({ isFallback: true }).catch(() => { });
                    return;
                }
                const uri = route.request().url().substring('https://copilotbrowser/'.length);
                const file = require.resolve('../../vite/recorder/' + uri);
                fs_1.default.promises.readFile(file).then(buffer => {
                    route.fulfill({
                        status: 200,
                        headers: [
                            { name: 'Content-Type', value: utilsBundle_1.mime.getType(path_1.default.extname(file)) || 'application/octet-stream' }
                        ],
                        body: buffer.toString('base64'),
                        isBase64: true
                    }).catch(() => { });
                });
            });
            await this._createDispatcher(progress);
            this._page.once('close', () => {
                this._recorder.close();
                this._page.browserContext.close({ reason: 'Recorder window closed' }).catch(() => { });
                delete inspectedContext[recorderAppSymbol];
            });
            await this._page.mainFrame().goto(progress, 'https://copilotbrowser/index.html');
        });
        const url = this._recorder.url();
        if (url)
            this._frontend.pageNavigated({ url });
        this._frontend.modeChanged({ mode: this._recorder.mode() });
        this._frontend.pauseStateChanged({ paused: this._recorder.paused() });
        this._updateActions('reveal');
        // Update paused sources *after* generated ones, to reveal the currently paused source if any.
        this._onUserSourcesChanged(this._recorder.userSources(), this._recorder.pausedSourceId());
        this._frontend.callLogsUpdated({ callLogs: this._recorder.callLog() });
        this._wireListeners(this._recorder);
    }
    async _createDispatcher(progress) {
        const dispatcher = {
            clear: async () => {
                this._actions = [];
                this._updateActions('reveal');
                this._recorder.clear();
            },
            fileChanged: async (params) => {
                const source = [...this._recorderSources, ...this._userSources].find(s => s.id === params.fileId);
                if (source) {
                    if (source.isRecorded)
                        this._selectedGeneratorId = source.id;
                    this._recorder.setLanguage(source.language);
                }
            },
            setAutoExpect: async (params) => {
                this._languageGeneratorOptions.generateAutoExpect = params.autoExpect;
                this._updateActions();
            },
            setMode: async (params) => {
                this._recorder.setMode(params.mode);
            },
            resume: async () => {
                this._recorder.resume();
            },
            pause: async () => {
                this._recorder.pause();
            },
            step: async () => {
                this._recorder.step();
            },
            highlightRequested: async (params) => {
                if (params.selector)
                    this._recorder.setHighlightedSelector(params.selector);
                if (params.ariaTemplate)
                    this._recorder.setHighlightedAriaTemplate(params.ariaTemplate);
            },
        };
        await this._page.exposeBinding(progress, 'sendCommand', false, async (_, data) => {
            const { method, params } = data;
            return await dispatcher[method].call(dispatcher, params);
        });
    }
    static async show(context, params) {
        if (process.env.PW_CODEGEN_NO_INSPECTOR)
            return;
        const recorder = await recorder_1.Recorder.forContext(context, params);
        if (params.recorderMode === 'api') {
            const browserName = context._browser.options.name;
            await ProgrammaticRecorderApp.run(context, recorder, browserName, params);
            return;
        }
        await RecorderApp._show(recorder, context, params);
    }
    async close() {
        await this._page.close();
    }
    static showInspectorNoReply(context) {
        if (process.env.PW_CODEGEN_NO_INSPECTOR)
            return;
        void recorder_1.Recorder.forContext(context, {}).then(recorder => RecorderApp._show(recorder, context, {})).catch(() => { });
    }
    static async _show(recorder, inspectedContext, params) {
        if (inspectedContext[recorderAppSymbol])
            return;
        inspectedContext[recorderAppSymbol] = true;
        const sdkLanguage = inspectedContext._browser.sdkLanguage();
        const headed = !!inspectedContext._browser.options.headful;
        const recordercopilotbrowser = require('../copilotbrowser').createcopilotbrowser({ sdkLanguage: 'javascript', isInternalcopilotbrowser: true });
        const { context: appContext, page } = await (0, launchApp_2.launchApp)(recordercopilotbrowser.chromium, {
            sdkLanguage,
            windowSize: { width: 600, height: 600 },
            windowPosition: { x: 1020, y: 10 },
            persistentContextOptions: {
                noDefaultViewport: true,
                headless: !!process.env.PWTEST_CLI_HEADLESS || ((0, debug_1.isUnderTest)() && !headed),
                cdpPort: (0, debug_1.isUnderTest)() ? 0 : undefined,
                handleSIGINT: params.handleSIGINT,
                executablePath: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.customExecutablePath : undefined,
                // Use the same channel as the inspected context to guarantee that the browser is installed.
                channel: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.channel : undefined,
            }
        });
        const controller = new progress_1.ProgressController();
        await controller.run(async (progress) => {
            await appContext._browser._defaultContext._loadDefaultContextAsIs(progress);
        });
        const appParams = {
            browserName: inspectedContext._browser.options.name,
            sdkLanguage: inspectedContext._browser.sdkLanguage(),
            wsEndpointForTest: inspectedContext._browser.options.wsEndpoint,
            headed: !!inspectedContext._browser.options.headful,
            executablePath: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.customExecutablePath : undefined,
            channel: inspectedContext._browser.options.isChromium ? inspectedContext._browser.options.channel : undefined,
            ...params,
        };
        const recorderApp = new RecorderApp(recorder, appParams, page, appContext._browser.options.wsEndpoint);
        await recorderApp._init(inspectedContext);
        inspectedContext.recorderAppForTest = recorderApp;
    }
    _wireListeners(recorder) {
        recorder.on(recorder_1.RecorderEvent.ActionAdded, (action) => {
            this._onActionAdded(action);
        });
        recorder.on(recorder_1.RecorderEvent.SignalAdded, (signal) => {
            this._onSignalAdded(signal);
        });
        recorder.on(recorder_1.RecorderEvent.PageNavigated, (url) => {
            this._frontend.pageNavigated({ url });
        });
        recorder.on(recorder_1.RecorderEvent.ContextClosed, () => {
            this._throttledOutputFile?.flush();
            this._page.browserContext.close({ reason: 'Recorder window closed' }).catch(() => { });
        });
        recorder.on(recorder_1.RecorderEvent.ModeChanged, (mode) => {
            this._frontend.modeChanged({ mode });
        });
        recorder.on(recorder_1.RecorderEvent.PausedStateChanged, (paused) => {
            this._frontend.pauseStateChanged({ paused });
        });
        recorder.on(recorder_1.RecorderEvent.UserSourcesChanged, (sources, pausedSourceId) => {
            this._onUserSourcesChanged(sources, pausedSourceId);
        });
        recorder.on(recorder_1.RecorderEvent.ElementPicked, (elementInfo, userGesture) => {
            if (userGesture)
                this._page.bringToFront();
            this._frontend.elementPicked({ elementInfo, userGesture });
        });
        recorder.on(recorder_1.RecorderEvent.CallLogsUpdated, (callLogs) => {
            this._frontend.callLogsUpdated({ callLogs });
        });
    }
    _onActionAdded(action) {
        this._actions.push(action);
        this._updateActions('reveal');
    }
    _onSignalAdded(signal) {
        const lastAction = this._actions.findLast(a => a.frame.pageGuid === signal.frame.pageGuid);
        if (lastAction)
            lastAction.action.signals.push(signal.signal);
        this._updateActions();
    }
    _onUserSourcesChanged(sources, pausedSourceId) {
        if (!sources.length && !this._userSources.length)
            return;
        this._userSources = sources;
        this._pushAllSources();
        this._revealSource(pausedSourceId);
    }
    _pushAllSources() {
        const sources = [...this._userSources, ...this._recorderSources];
        this._frontend.sourcesUpdated({ sources });
    }
    _revealSource(sourceId) {
        if (!sourceId)
            return;
        this._frontend.sourceRevealRequested({ sourceId });
    }
    _updateActions(reveal) {
        const recorderSources = [];
        const actions = (0, recorderUtils_1.collapseActions)(this._actions);
        let revealSourceId;
        for (const languageGenerator of (0, languages_1.languageSet)()) {
            const { header, footer, actionTexts, text } = (0, language_1.generateCode)(actions, languageGenerator, this._languageGeneratorOptions);
            const source = {
                isRecorded: true,
                label: languageGenerator.name,
                group: languageGenerator.groupName,
                id: languageGenerator.id,
                text,
                header,
                footer,
                actions: actionTexts,
                language: languageGenerator.highlighter,
                highlight: []
            };
            source.revealLine = text.split('\n').length - 1;
            recorderSources.push(source);
            if (languageGenerator.id === this._primaryGeneratorId)
                this._throttledOutputFile?.setContent(source.text);
            if (reveal === 'reveal' && source.id === this._selectedGeneratorId)
                revealSourceId = source.id;
        }
        this._recorderSources = recorderSources;
        this._pushAllSources();
        this._revealSource(revealSourceId);
    }
}
exports.RecorderApp = RecorderApp;
// For example, if the SDK language is 'javascript', this returns 'copilotbrowser-test'.
function determinePrimaryGeneratorId(sdkLanguage) {
    for (const language of (0, languages_1.languageSet)()) {
        if (language.highlighter === sdkLanguage)
            return language.id;
    }
    return sdkLanguage;
}
class ProgrammaticRecorderApp {
    static async run(inspectedContext, recorder, browserName, params) {
        let lastAction = null;
        const languages = [...(0, languages_1.languageSet)()];
        const languageGeneratorOptions = {
            browserName: browserName,
            launchOptions: { headless: false, ...params.launchOptions, tracesDir: undefined },
            contextOptions: { ...params.contextOptions },
            deviceName: params.device,
            saveStorage: params.saveStorage,
        };
        const languageGenerator = languages.find(l => l.id === params.language) ?? languages.find(l => l.id === 'copilotbrowser-test');
        recorder.on(recorder_1.RecorderEvent.ActionAdded, action => {
            const page = findPageByGuid(inspectedContext, action.frame.pageGuid);
            if (!page)
                return;
            const { actionTexts } = (0, language_1.generateCode)([action], languageGenerator, languageGeneratorOptions);
            if (!lastAction || !(0, recorderUtils_1.shouldMergeAction)(action, lastAction))
                inspectedContext.emit(browserContext_1.BrowserContext.Events.RecorderEvent, { event: 'actionAdded', data: action, page, code: actionTexts.join('\n') });
            else
                inspectedContext.emit(browserContext_1.BrowserContext.Events.RecorderEvent, { event: 'actionUpdated', data: action, page, code: actionTexts.join('\n') });
            lastAction = action;
        });
        recorder.on(recorder_1.RecorderEvent.SignalAdded, signal => {
            const page = findPageByGuid(inspectedContext, signal.frame.pageGuid);
            if (!page)
                return;
            inspectedContext.emit(browserContext_1.BrowserContext.Events.RecorderEvent, { event: 'signalAdded', data: signal, page, code: '' });
        });
    }
}
exports.ProgrammaticRecorderApp = ProgrammaticRecorderApp;
function findPageByGuid(context, guid) {
    return context.pages().find(p => p.guid === guid);
}
function createRecorderFrontend(page) {
    return new Proxy({}, {
        get: (_target, prop) => {
            if (typeof prop !== 'string')
                return undefined;
            return (params) => {
                page.mainFrame().evaluateExpression(((event) => {
                    window.dispatch(event);
                }).toString(), { isFunction: true }, { method: prop, params }).catch(() => { });
            };
        },
    });
}
const recorderAppSymbol = Symbol('recorderApp');
