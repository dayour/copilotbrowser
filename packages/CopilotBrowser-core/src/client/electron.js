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
exports.ElectronApplication = exports.Electron = void 0;
const browserContext_1 = require("./browserContext");
const channelOwner_1 = require("./channelOwner");
const clientHelper_1 = require("./clientHelper");
const consoleMessage_1 = require("./consoleMessage");
const errors_1 = require("./errors");
const events_1 = require("./events");
const jsHandle_1 = require("./jsHandle");
const waiter_1 = require("./waiter");
const timeoutSettings_1 = require("./timeoutSettings");
class Electron extends channelOwner_1.ChannelOwner {
    _copilotbrowser;
    static from(electron) {
        return electron._object;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
    }
    async launch(options = {}) {
        options = this._copilotbrowser.selectors._withSelectorOptions(options);
        const params = {
            ...await (0, browserContext_1.prepareBrowserContextParams)(this._platform, options),
            env: (0, clientHelper_1.envObjectToArray)(options.env ? options.env : this._platform.env),
            tracesDir: options.tracesDir,
            timeout: new timeoutSettings_1.TimeoutSettings(this._platform).launchTimeout(options),
        };
        const app = ElectronApplication.from((await this._channel.launch(params)).electronApplication);
        this._copilotbrowser.selectors._contextsForSelectors.add(app._context);
        app.once(events_1.Events.ElectronApplication.Close, () => this._copilotbrowser.selectors._contextsForSelectors.delete(app._context));
        await app._context._initializeHarFromOptions(options.recordHar);
        app._context.tracing._tracesDir = options.tracesDir;
        return app;
    }
}
exports.Electron = Electron;
class ElectronApplication extends channelOwner_1.ChannelOwner {
    _context;
    _windows = new Set();
    _timeoutSettings;
    static from(electronApplication) {
        return electronApplication._object;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._timeoutSettings = new timeoutSettings_1.TimeoutSettings(this._platform);
        this._context = browserContext_1.BrowserContext.from(initializer.context);
        for (const page of this._context._pages)
            this._onPage(page);
        this._context.on(events_1.Events.BrowserContext.Page, page => this._onPage(page));
        this._channel.on('close', () => {
            this.emit(events_1.Events.ElectronApplication.Close);
        });
        this._channel.on('console', event => this.emit(events_1.Events.ElectronApplication.Console, new consoleMessage_1.ConsoleMessage(this._platform, event, null, null)));
        this._setEventToSubscriptionMapping(new Map([
            [events_1.Events.ElectronApplication.Console, 'console'],
        ]));
    }
    process() {
        return this._connection.toImpl?.(this)?.process();
    }
    _onPage(page) {
        this._windows.add(page);
        this.emit(events_1.Events.ElectronApplication.Window, page);
        page.once(events_1.Events.Page.Close, () => this._windows.delete(page));
    }
    windows() {
        // TODO: add ElectronPage class inheriting from Page.
        return [...this._windows];
    }
    async firstWindow(options) {
        if (this._windows.size)
            return this._windows.values().next().value;
        return await this.waitForEvent('window', options);
    }
    context() {
        return this._context;
    }
    async [Symbol.asyncDispose]() {
        await this.close();
    }
    async close() {
        try {
            await this._context.close();
        }
        catch (e) {
            if ((0, errors_1.isTargetClosedError)(e))
                return;
            throw e;
        }
    }
    async waitForEvent(event, optionsOrPredicate = {}) {
        return await this._wrapApiCall(async () => {
            const timeout = this._timeoutSettings.timeout(typeof optionsOrPredicate === 'function' ? {} : optionsOrPredicate);
            const predicate = typeof optionsOrPredicate === 'function' ? optionsOrPredicate : optionsOrPredicate.predicate;
            const waiter = waiter_1.Waiter.createForEvent(this, event);
            waiter.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded while waiting for event "${event}"`);
            if (event !== events_1.Events.ElectronApplication.Close)
                waiter.rejectOnEvent(this, events_1.Events.ElectronApplication.Close, () => new errors_1.TargetClosedError());
            const result = await waiter.waitForEvent(this, event, predicate);
            waiter.dispose();
            return result;
        });
    }
    async browserWindow(page) {
        const result = await this._channel.browserWindow({ page: page._channel });
        return jsHandle_1.JSHandle.from(result.handle);
    }
    async evaluate(pageFunction, arg) {
        const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return (0, jsHandle_1.parseResult)(result.value);
    }
    async evaluateHandle(pageFunction, arg) {
        const result = await this._channel.evaluateExpressionHandle({ expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return jsHandle_1.JSHandle.from(result.handle);
    }
}
exports.ElectronApplication = ElectronApplication;
