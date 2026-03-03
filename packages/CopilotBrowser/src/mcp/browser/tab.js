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
exports.Tab = void 0;
exports.renderModalStates = renderModalStates;
exports.shouldIncludeMessage = shouldIncludeMessage;
const events_1 = require("events");
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
const utils_2 = require("./tools/utils");
const log_1 = require("../log");
const logFile_1 = require("./logFile");
const dialogs_1 = require("./tools/dialogs");
const files_1 = require("./tools/files");
const transform_1 = require("../../transform/transform");
const TabEvents = {
    modalState: 'modalState'
};
class Tab extends events_1.EventEmitter {
    context;
    page;
    _lastHeader = { title: 'about:blank', url: 'about:blank', current: false, console: { total: 0, warnings: 0, errors: 0 } };
    _downloads = [];
    _requests = [];
    _onPageClose;
    _modalStates = [];
    _initializedPromise;
    _needsFullSnapshot = false;
    _recentEventEntries = [];
    _consoleLog;
    constructor(context, page, onPageClose) {
        super();
        this.context = context;
        this.page = page;
        this._onPageClose = onPageClose;
        page.on('console', event => this._handleConsoleMessage(messageToConsoleMessage(event)));
        page.on('pageerror', error => this._handleConsoleMessage(pageErrorToConsoleMessage(error)));
        page.on('request', request => this._handleRequest(request));
        page.on('response', response => this._handleResponse(response));
        page.on('requestfailed', request => this._handleRequestFailed(request));
        page.on('close', () => this._onClose());
        page.on('filechooser', chooser => {
            this.setModalState({
                type: 'fileChooser',
                description: 'File chooser',
                fileChooser: chooser,
                clearedBy: { tool: files_1.uploadFile.schema.name, skill: 'upload' }
            });
        });
        page.on('dialog', dialog => this._dialogShown(dialog));
        page.on('download', download => {
            void this._downloadStarted(download);
        });
        page.setDefaultNavigationTimeout(this.context.config.timeouts.navigation);
        page.setDefaultTimeout(this.context.config.timeouts.action);
        page[tabSymbol] = this;
        const wallTime = Date.now();
        this._consoleLog = new logFile_1.LogFile(this.context, wallTime, 'console', 'Console');
        this._initializedPromise = this._initialize();
    }
    static forPage(page) {
        return page[tabSymbol];
    }
    static async collectConsoleMessages(page) {
        const result = [];
        const messages = await page.consoleMessages().catch(() => []);
        for (const message of messages)
            result.push(messageToConsoleMessage(message));
        const errors = await page.pageErrors().catch(() => []);
        for (const error of errors)
            result.push(pageErrorToConsoleMessage(error));
        return result;
    }
    async _initialize() {
        for (const message of await Tab.collectConsoleMessages(this.page))
            this._handleConsoleMessage(message);
        const requests = await this.page.requests().catch(() => []);
        for (const request of requests.filter(r => r.existingResponse() || r.failure()))
            this._requests.push(request);
        for (const initPage of this.context.config.browser.initPage || []) {
            try {
                const { default: func } = await (0, transform_1.requireOrImport)(initPage);
                await func({ page: this.page });
            }
            catch (e) {
                (0, log_1.logUnhandledError)(e);
            }
        }
    }
    modalStates() {
        return this._modalStates;
    }
    setModalState(modalState) {
        this._modalStates.push(modalState);
        this.emit(TabEvents.modalState, modalState);
    }
    clearModalState(modalState) {
        this._modalStates = this._modalStates.filter(state => state !== modalState);
    }
    _dialogShown(dialog) {
        this.setModalState({
            type: 'dialog',
            description: `"${dialog.type()}" dialog with message "${dialog.message()}"`,
            dialog,
            clearedBy: { tool: dialogs_1.handleDialog.schema.name, skill: 'dialog-accept or dialog-dismiss' }
        });
    }
    async _downloadStarted(download) {
        // Do not trust web names.
        const outputFile = await this.context.outputFile({ suggestedFilename: sanitizeForFilePath(download.suggestedFilename()), prefix: 'download', ext: 'bin' }, { origin: 'code' });
        const entry = {
            download,
            finished: false,
            outputFile,
        };
        this._downloads.push(entry);
        this._addLogEntry({ type: 'download-start', wallTime: Date.now(), download: entry });
        await download.saveAs(entry.outputFile);
        entry.finished = true;
        this._addLogEntry({ type: 'download-finish', wallTime: Date.now(), download: entry });
    }
    _clearCollectedArtifacts() {
        this._downloads.length = 0;
        this._requests.length = 0;
        this._recentEventEntries.length = 0;
        this._resetLogs();
    }
    _resetLogs() {
        const wallTime = Date.now();
        this._consoleLog.stop();
        this._consoleLog = new logFile_1.LogFile(this.context, wallTime, 'console', 'Console');
    }
    _handleRequest(request) {
        this._requests.push(request);
        // TODO: request start time is not available for fetch() before the
        // response is received, so we use Date.now() as a fallback.
        const wallTime = request.timing().startTime || Date.now();
        this._addLogEntry({ type: 'request', wallTime, request });
    }
    _handleResponse(response) {
        const timing = response.request().timing();
        const wallTime = timing.responseStart + timing.startTime;
        this._addLogEntry({ type: 'request', wallTime, request: response.request() });
    }
    _handleRequestFailed(request) {
        this._requests.push(request);
        const timing = request.timing();
        const wallTime = timing.responseEnd + timing.startTime;
        this._addLogEntry({ type: 'request', wallTime, request });
    }
    _handleConsoleMessage(message) {
        const wallTime = message.timestamp;
        this._addLogEntry({ type: 'console', wallTime, message });
        const level = consoleLevelForMessageType(message.type);
        if (level === 'error' || level === 'warning')
            this._consoleLog.appendLine(wallTime, () => message.toString());
    }
    _addLogEntry(entry) {
        this._recentEventEntries.push(entry);
    }
    _onClose() {
        this._clearCollectedArtifacts();
        this._onPageClose(this);
    }
    async headerSnapshot() {
        let title;
        await this._raceAgainstModalStates(async () => {
            title = await (0, utils_2.callOnPageNoTrace)(this.page, page => page.title());
        });
        const newHeader = {
            title: title ?? '',
            url: this.page.url(),
            current: this.isCurrentTab(),
            console: await this.consoleMessageCount()
        };
        if (!tabHeaderEquals(this._lastHeader, newHeader)) {
            this._lastHeader = newHeader;
            return { ...this._lastHeader, changed: true };
        }
        return { ...this._lastHeader, changed: false };
    }
    isCurrentTab() {
        return this === this.context.currentTab();
    }
    async waitForLoadState(state, options) {
        await this._initializedPromise;
        await (0, utils_2.callOnPageNoTrace)(this.page, page => page.waitForLoadState(state, options).catch(log_1.logUnhandledError));
    }
    async navigate(url) {
        await this._initializedPromise;
        await this.clearConsoleMessages();
        this._clearCollectedArtifacts();
        const { promise: downloadEvent, abort: abortDownloadEvent } = (0, utils_2.eventWaiter)(this.page, 'download', 3000);
        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
            abortDownloadEvent();
        }
        catch (_e) {
            const e = _e;
            const mightBeDownload = e.message.includes('net::ERR_ABORTED') // chromium
                || e.message.includes('Download is starting'); // firefox + webkit
            if (!mightBeDownload)
                throw e;
            // on chromium, the download event is fired *after* page.goto rejects, so we wait a lil bit
            const download = await downloadEvent;
            if (!download)
                throw e;
            // Make sure other "download" listeners are notified first.
            await new Promise(resolve => setTimeout(resolve, 500));
            return;
        }
        // Cap load event to 5 seconds, the page is operational at this point.
        await this.waitForLoadState('load', { timeout: 5000 });
    }
    async consoleMessageCount() {
        await this._initializedPromise;
        const messages = await this.page.consoleMessages();
        const pageErrors = await this.page.pageErrors();
        let errors = pageErrors.length;
        let warnings = 0;
        for (const message of messages) {
            if (message.type() === 'error')
                errors++;
            else if (message.type() === 'warning')
                warnings++;
        }
        return { total: messages.length + pageErrors.length, errors, warnings };
    }
    async consoleMessages(level) {
        await this._initializedPromise;
        const result = [];
        const messages = await this.page.consoleMessages();
        for (const message of messages) {
            const cm = messageToConsoleMessage(message);
            if (shouldIncludeMessage(level, cm.type))
                result.push(cm);
        }
        if (shouldIncludeMessage(level, 'error')) {
            const errors = await this.page.pageErrors();
            for (const error of errors)
                result.push(pageErrorToConsoleMessage(error));
        }
        return result;
    }
    async clearConsoleMessages() {
        await this._initializedPromise;
        await Promise.all([
            this.page.clearConsoleMessages(),
            this.page.clearPageErrors()
        ]);
    }
    async requests() {
        await this._initializedPromise;
        return this._requests;
    }
    async clearRequests() {
        await this._initializedPromise;
        this._requests.length = 0;
    }
    async captureSnapshot(relativeTo) {
        await this._initializedPromise;
        let tabSnapshot;
        const modalStates = await this._raceAgainstModalStates(async () => {
            const snapshot = await this.page._snapshotForAI({ track: 'response' });
            tabSnapshot = {
                ariaSnapshot: snapshot.full,
                ariaSnapshotDiff: this._needsFullSnapshot ? undefined : snapshot.incremental,
                modalStates: [],
                events: [],
            };
        });
        if (tabSnapshot) {
            tabSnapshot.consoleLink = await this._consoleLog.take(relativeTo);
            tabSnapshot.events = this._recentEventEntries;
            this._recentEventEntries = [];
        }
        // If we failed to capture a snapshot this time, make sure we do a full one next time,
        // to avoid reporting deltas against un-reported snapshot.
        this._needsFullSnapshot = !tabSnapshot;
        return tabSnapshot ?? {
            ariaSnapshot: '',
            ariaSnapshotDiff: '',
            modalStates,
            events: [],
        };
    }
    _javaScriptBlocked() {
        return this._modalStates.some(state => state.type === 'dialog');
    }
    async _raceAgainstModalStates(action) {
        if (this.modalStates().length)
            return this.modalStates();
        const promise = new utils_1.ManualPromise();
        const listener = (modalState) => promise.resolve([modalState]);
        this.once(TabEvents.modalState, listener);
        return await Promise.race([
            action().then(() => {
                this.off(TabEvents.modalState, listener);
                return [];
            }),
            promise,
        ]);
    }
    async waitForCompletion(callback) {
        await this._initializedPromise;
        await this._raceAgainstModalStates(() => (0, utils_2.waitForCompletion)(this, callback));
    }
    async refLocator(params) {
        await this._initializedPromise;
        return (await this.refLocators([params]))[0];
    }
    async refLocators(params) {
        await this._initializedPromise;
        return Promise.all(params.map(async (param) => {
            try {
                let locator = this.page.locator(`aria-ref=${param.ref}`);
                if (param.element)
                    locator = locator.describe(param.element);
                const { resolvedSelector } = await locator._resolveSelector();
                return { locator, resolved: (0, utils_1.asLocator)('javascript', resolvedSelector) };
            }
            catch (e) {
                throw new Error(`Ref ${param.ref} not found in the current page snapshot. The page may have changed since the last snapshot was taken (e.g. after navigation, reload, or dynamic content update). Use the browser_snapshot tool to capture a fresh snapshot and get updated refs.`);
            }
        }));
    }
    async waitForTimeout(time) {
        if (this._javaScriptBlocked()) {
            await new Promise(f => setTimeout(f, time));
            return;
        }
        await (0, utils_2.callOnPageNoTrace)(this.page, page => {
            return page.evaluate(() => new Promise(f => setTimeout(f, 1000))).catch(() => { });
        });
    }
}
exports.Tab = Tab;
function messageToConsoleMessage(message) {
    return {
        type: message.type(),
        timestamp: message.timestamp(),
        text: message.text(),
        toString: () => `[${message.type().toUpperCase()}] ${message.text()} @ ${message.location().url}:${message.location().lineNumber}`,
    };
}
function pageErrorToConsoleMessage(errorOrValue) {
    if (errorOrValue instanceof Error) {
        return {
            type: 'error',
            timestamp: Date.now(),
            text: errorOrValue.message,
            toString: () => errorOrValue.stack || errorOrValue.message,
        };
    }
    return {
        type: 'error',
        timestamp: Date.now(),
        text: String(errorOrValue),
        toString: () => String(errorOrValue),
    };
}
function renderModalStates(config, modalStates) {
    const result = [];
    if (modalStates.length === 0)
        result.push('- There is no modal state present');
    for (const state of modalStates)
        result.push(`- [${state.description}]: can be handled by ${config.skillMode ? state.clearedBy.skill : state.clearedBy.tool}`);
    return result;
}
const consoleMessageLevels = ['error', 'warning', 'info', 'debug'];
function shouldIncludeMessage(thresholdLevel, type) {
    const messageLevel = consoleLevelForMessageType(type);
    return consoleMessageLevels.indexOf(messageLevel) <= consoleMessageLevels.indexOf(thresholdLevel);
}
function consoleLevelForMessageType(type) {
    switch (type) {
        case 'assert':
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        case 'count':
        case 'dir':
        case 'dirxml':
        case 'info':
        case 'log':
        case 'table':
        case 'time':
        case 'timeEnd':
            return 'info';
        case 'clear':
        case 'debug':
        case 'endGroup':
        case 'profile':
        case 'profileEnd':
        case 'startGroup':
        case 'startGroupCollapsed':
        case 'trace':
            return 'debug';
        default:
            return 'info';
    }
}
const tabSymbol = Symbol('tabSymbol');
function sanitizeForFilePath(s) {
    const sanitize = (s) => s.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, '-');
    const separator = s.lastIndexOf('.');
    if (separator === -1)
        return sanitize(s);
    return sanitize(s.substring(0, separator)) + '.' + sanitize(s.substring(separator + 1));
}
function tabHeaderEquals(a, b) {
    return a.title === b.title &&
        a.url === b.url &&
        a.current === b.current &&
        a.console.errors === b.console.errors &&
        a.console.warnings === b.console.warnings &&
        a.console.total === b.console.total;
}
