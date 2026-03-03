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
exports.Frame = void 0;
exports.verifyLoadState = verifyLoadState;
const eventEmitter_1 = require("./eventEmitter");
const channelOwner_1 = require("./channelOwner");
const clientHelper_1 = require("./clientHelper");
const elementHandle_1 = require("./elementHandle");
const events_1 = require("./events");
const jsHandle_1 = require("./jsHandle");
const locator_1 = require("./locator");
const network = __importStar(require("./network"));
const types_1 = require("./types");
const waiter_1 = require("./waiter");
const assert_1 = require("../utils/isomorphic/assert");
const locatorUtils_1 = require("../utils/isomorphic/locatorUtils");
const urlMatch_1 = require("../utils/isomorphic/urlMatch");
const timeoutSettings_1 = require("./timeoutSettings");
class Frame extends channelOwner_1.ChannelOwner {
    _eventEmitter;
    _loadStates;
    _parentFrame = null;
    _url = '';
    _name = '';
    _detached = false;
    _childFrames = new Set();
    _page;
    static from(frame) {
        return frame._object;
    }
    static fromNullable(frame) {
        return frame ? Frame.from(frame) : null;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._eventEmitter = new eventEmitter_1.EventEmitter(parent._platform);
        this._eventEmitter.setMaxListeners(0);
        this._parentFrame = Frame.fromNullable(initializer.parentFrame);
        if (this._parentFrame)
            this._parentFrame._childFrames.add(this);
        this._name = initializer.name;
        this._url = initializer.url;
        this._loadStates = new Set(initializer.loadStates);
        this._channel.on('loadstate', event => {
            if (event.add) {
                this._loadStates.add(event.add);
                this._eventEmitter.emit('loadstate', event.add);
            }
            if (event.remove)
                this._loadStates.delete(event.remove);
            if (!this._parentFrame && event.add === 'load' && this._page)
                this._page.emit(events_1.Events.Page.Load, this._page);
            if (!this._parentFrame && event.add === 'domcontentloaded' && this._page)
                this._page.emit(events_1.Events.Page.DOMContentLoaded, this._page);
        });
        this._channel.on('navigated', event => {
            this._url = event.url;
            this._name = event.name;
            this._eventEmitter.emit('navigated', event);
            if (!event.error && this._page)
                this._page.emit(events_1.Events.Page.FrameNavigated, this);
        });
    }
    page() {
        return this._page;
    }
    _timeout(options) {
        const timeoutSettings = this._page?._timeoutSettings || new timeoutSettings_1.TimeoutSettings(this._platform);
        return timeoutSettings.timeout(options || {});
    }
    _navigationTimeout(options) {
        const timeoutSettings = this._page?._timeoutSettings || new timeoutSettings_1.TimeoutSettings(this._platform);
        return timeoutSettings.navigationTimeout(options || {});
    }
    async goto(url, options = {}) {
        const waitUntil = verifyLoadState('waitUntil', options.waitUntil === undefined ? 'load' : options.waitUntil);
        this.page().context()._checkUrlAllowed(url);
        return network.Response.fromNullable((await this._channel.goto({ url, ...options, waitUntil, timeout: this._navigationTimeout(options) })).response);
    }
    _setupNavigationWaiter(options) {
        const waiter = new waiter_1.Waiter(this._page, '');
        if (this._page.isClosed())
            waiter.rejectImmediately(this._page._closeErrorWithReason());
        waiter.rejectOnEvent(this._page, events_1.Events.Page.Close, () => this._page._closeErrorWithReason());
        waiter.rejectOnEvent(this._page, events_1.Events.Page.Crash, new Error('Navigation failed because page crashed!'));
        waiter.rejectOnEvent(this._page, events_1.Events.Page.FrameDetached, new Error('Navigating frame was detached!'), frame => frame === this);
        const timeout = this._page._timeoutSettings.navigationTimeout(options);
        waiter.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded.`);
        return waiter;
    }
    async waitForNavigation(options = {}) {
        return await this._page._wrapApiCall(async () => {
            const waitUntil = verifyLoadState('waitUntil', options.waitUntil === undefined ? 'load' : options.waitUntil);
            const waiter = this._setupNavigationWaiter(options);
            const toUrl = typeof options.url === 'string' ? ` to "${options.url}"` : '';
            waiter.log(`waiting for navigation${toUrl} until "${waitUntil}"`);
            const navigatedEvent = await waiter.waitForEvent(this._eventEmitter, 'navigated', event => {
                // Any failed navigation results in a rejection.
                if (event.error)
                    return true;
                waiter.log(`  navigated to "${event.url}"`);
                return (0, urlMatch_1.urlMatches)(this._page?.context()._options.baseURL, event.url, options.url);
            });
            if (navigatedEvent.error) {
                const e = new Error(navigatedEvent.error);
                e.stack = '';
                await waiter.waitForPromise(Promise.reject(e));
            }
            if (!this._loadStates.has(waitUntil)) {
                await waiter.waitForEvent(this._eventEmitter, 'loadstate', s => {
                    waiter.log(`  "${s}" event fired`);
                    return s === waitUntil;
                });
            }
            const request = navigatedEvent.newDocument ? network.Request.fromNullable(navigatedEvent.newDocument.request) : null;
            const response = request ? await waiter.waitForPromise(request._finalRequest()._internalResponse()) : null;
            waiter.dispose();
            return response;
        }, { title: 'Wait for navigation' });
    }
    async waitForLoadState(state = 'load', options = {}) {
        state = verifyLoadState('state', state);
        return await this._page._wrapApiCall(async () => {
            const waiter = this._setupNavigationWaiter(options);
            if (this._loadStates.has(state)) {
                waiter.log(`  not waiting, "${state}" event already fired`);
            }
            else {
                await waiter.waitForEvent(this._eventEmitter, 'loadstate', s => {
                    waiter.log(`  "${s}" event fired`);
                    return s === state;
                });
            }
            waiter.dispose();
        }, { title: `Wait for load state "${state}"` });
    }
    async waitForURL(url, options = {}) {
        if ((0, urlMatch_1.urlMatches)(this._page?.context()._options.baseURL, this.url(), url))
            return await this.waitForLoadState(options.waitUntil, options);
        await this.waitForNavigation({ url, ...options });
    }
    async frameElement() {
        return elementHandle_1.ElementHandle.from((await this._channel.frameElement()).element);
    }
    async evaluateHandle(pageFunction, arg) {
        (0, jsHandle_1.assertMaxArguments)(arguments.length, 2);
        const result = await this._channel.evaluateExpressionHandle({ expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return jsHandle_1.JSHandle.from(result.handle);
    }
    async evaluate(pageFunction, arg) {
        (0, jsHandle_1.assertMaxArguments)(arguments.length, 2);
        const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return (0, jsHandle_1.parseResult)(result.value);
    }
    async _evaluateFunction(functionDeclaration) {
        const result = await this._channel.evaluateExpression({ expression: functionDeclaration, isFunction: true, arg: (0, jsHandle_1.serializeArgument)(undefined) });
        return (0, jsHandle_1.parseResult)(result.value);
    }
    async _evaluateExposeUtilityScript(pageFunction, arg) {
        (0, jsHandle_1.assertMaxArguments)(arguments.length, 2);
        const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return (0, jsHandle_1.parseResult)(result.value);
    }
    async $(selector, options) {
        const result = await this._channel.querySelector({ selector, ...options });
        return elementHandle_1.ElementHandle.fromNullable(result.element);
    }
    async waitForSelector(selector, options = {}) {
        if (options.visibility)
            throw new Error('options.visibility is not supported, did you mean options.state?');
        if (options.waitFor && options.waitFor !== 'visible')
            throw new Error('options.waitFor is not supported, did you mean options.state?');
        const result = await this._channel.waitForSelector({ selector, ...options, timeout: this._timeout(options) });
        return elementHandle_1.ElementHandle.fromNullable(result.element);
    }
    async dispatchEvent(selector, type, eventInit, options = {}) {
        await this._channel.dispatchEvent({ selector, type, eventInit: (0, jsHandle_1.serializeArgument)(eventInit), ...options, timeout: this._timeout(options) });
    }
    async $eval(selector, pageFunction, arg) {
        (0, jsHandle_1.assertMaxArguments)(arguments.length, 3);
        const result = await this._channel.evalOnSelector({ selector, expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return (0, jsHandle_1.parseResult)(result.value);
    }
    async $$eval(selector, pageFunction, arg) {
        (0, jsHandle_1.assertMaxArguments)(arguments.length, 3);
        const result = await this._channel.evalOnSelectorAll({ selector, expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return (0, jsHandle_1.parseResult)(result.value);
    }
    async $$(selector) {
        const result = await this._channel.querySelectorAll({ selector });
        return result.elements.map(e => elementHandle_1.ElementHandle.from(e));
    }
    async _queryCount(selector, options) {
        return (await this._channel.queryCount({ selector, ...options })).value;
    }
    async content() {
        return (await this._channel.content()).value;
    }
    async setContent(html, options = {}) {
        const waitUntil = verifyLoadState('waitUntil', options.waitUntil === undefined ? 'load' : options.waitUntil);
        await this._channel.setContent({ html, ...options, waitUntil, timeout: this._navigationTimeout(options) });
    }
    name() {
        return this._name || '';
    }
    url() {
        return this._url;
    }
    parentFrame() {
        return this._parentFrame;
    }
    childFrames() {
        return Array.from(this._childFrames);
    }
    isDetached() {
        return this._detached;
    }
    async addScriptTag(options = {}) {
        const copy = { ...options };
        if (copy.path) {
            copy.content = (await this._platform.fs().promises.readFile(copy.path)).toString();
            copy.content = (0, clientHelper_1.addSourceUrlToScript)(copy.content, copy.path);
        }
        return elementHandle_1.ElementHandle.from((await this._channel.addScriptTag({ ...copy })).element);
    }
    async addStyleTag(options = {}) {
        const copy = { ...options };
        if (copy.path) {
            copy.content = (await this._platform.fs().promises.readFile(copy.path)).toString();
            copy.content += '/*# sourceURL=' + copy.path.replace(/\n/g, '') + '*/';
        }
        return elementHandle_1.ElementHandle.from((await this._channel.addStyleTag({ ...copy })).element);
    }
    async click(selector, options = {}) {
        return await this._channel.click({ selector, ...options, timeout: this._timeout(options) });
    }
    async dblclick(selector, options = {}) {
        return await this._channel.dblclick({ selector, ...options, timeout: this._timeout(options) });
    }
    async dragAndDrop(source, target, options = {}) {
        return await this._channel.dragAndDrop({ source, target, ...options, timeout: this._timeout(options) });
    }
    async tap(selector, options = {}) {
        return await this._channel.tap({ selector, ...options, timeout: this._timeout(options) });
    }
    async fill(selector, value, options = {}) {
        return await this._channel.fill({ selector, value, ...options, timeout: this._timeout(options) });
    }
    async _highlight(selector) {
        return await this._channel.highlight({ selector });
    }
    locator(selector, options) {
        return new locator_1.Locator(this, selector, options);
    }
    getByTestId(testId) {
        return this.locator((0, locatorUtils_1.getByTestIdSelector)((0, locator_1.testIdAttributeName)(), testId));
    }
    getByAltText(text, options) {
        return this.locator((0, locatorUtils_1.getByAltTextSelector)(text, options));
    }
    getByLabel(text, options) {
        return this.locator((0, locatorUtils_1.getByLabelSelector)(text, options));
    }
    getByPlaceholder(text, options) {
        return this.locator((0, locatorUtils_1.getByPlaceholderSelector)(text, options));
    }
    getByText(text, options) {
        return this.locator((0, locatorUtils_1.getByTextSelector)(text, options));
    }
    getByTitle(text, options) {
        return this.locator((0, locatorUtils_1.getByTitleSelector)(text, options));
    }
    getByRole(role, options = {}) {
        return this.locator((0, locatorUtils_1.getByRoleSelector)(role, options));
    }
    frameLocator(selector) {
        return new locator_1.FrameLocator(this, selector);
    }
    async focus(selector, options = {}) {
        await this._channel.focus({ selector, ...options, timeout: this._timeout(options) });
    }
    async textContent(selector, options = {}) {
        const value = (await this._channel.textContent({ selector, ...options, timeout: this._timeout(options) })).value;
        return value === undefined ? null : value;
    }
    async innerText(selector, options = {}) {
        return (await this._channel.innerText({ selector, ...options, timeout: this._timeout(options) })).value;
    }
    async innerHTML(selector, options = {}) {
        return (await this._channel.innerHTML({ selector, ...options, timeout: this._timeout(options) })).value;
    }
    async getAttribute(selector, name, options = {}) {
        const value = (await this._channel.getAttribute({ selector, name, ...options, timeout: this._timeout(options) })).value;
        return value === undefined ? null : value;
    }
    async inputValue(selector, options = {}) {
        return (await this._channel.inputValue({ selector, ...options, timeout: this._timeout(options) })).value;
    }
    async isChecked(selector, options = {}) {
        return (await this._channel.isChecked({ selector, ...options, timeout: this._timeout(options) })).value;
    }
    async isDisabled(selector, options = {}) {
        return (await this._channel.isDisabled({ selector, ...options, timeout: this._timeout(options) })).value;
    }
    async isEditable(selector, options = {}) {
        return (await this._channel.isEditable({ selector, ...options, timeout: this._timeout(options) })).value;
    }
    async isEnabled(selector, options = {}) {
        return (await this._channel.isEnabled({ selector, ...options, timeout: this._timeout(options) })).value;
    }
    async isHidden(selector, options = {}) {
        return (await this._channel.isHidden({ selector, ...options })).value;
    }
    async isVisible(selector, options = {}) {
        return (await this._channel.isVisible({ selector, ...options })).value;
    }
    async hover(selector, options = {}) {
        await this._channel.hover({ selector, ...options, timeout: this._timeout(options) });
    }
    async selectOption(selector, values, options = {}) {
        return (await this._channel.selectOption({ selector, ...(0, elementHandle_1.convertSelectOptionValues)(values), ...options, timeout: this._timeout(options) })).values;
    }
    async setInputFiles(selector, files, options = {}) {
        const converted = await (0, elementHandle_1.convertInputFiles)(this._platform, files, this.page().context());
        await this._channel.setInputFiles({ selector, ...converted, ...options, timeout: this._timeout(options) });
    }
    async type(selector, text, options = {}) {
        await this._channel.type({ selector, text, ...options, timeout: this._timeout(options) });
    }
    async press(selector, key, options = {}) {
        await this._channel.press({ selector, key, ...options, timeout: this._timeout(options) });
    }
    async check(selector, options = {}) {
        await this._channel.check({ selector, ...options, timeout: this._timeout(options) });
    }
    async uncheck(selector, options = {}) {
        await this._channel.uncheck({ selector, ...options, timeout: this._timeout(options) });
    }
    async setChecked(selector, checked, options) {
        if (checked)
            await this.check(selector, options);
        else
            await this.uncheck(selector, options);
    }
    async waitForTimeout(timeout) {
        await this._channel.waitForTimeout({ waitTimeout: timeout });
    }
    async waitForFunction(pageFunction, arg, options = {}) {
        if (typeof options.polling === 'string')
            (0, assert_1.assert)(options.polling === 'raf', 'Unknown polling option: ' + options.polling);
        const result = await this._channel.waitForFunction({
            ...options,
            pollingInterval: options.polling === 'raf' ? undefined : options.polling,
            expression: String(pageFunction),
            isFunction: typeof pageFunction === 'function',
            arg: (0, jsHandle_1.serializeArgument)(arg),
            timeout: this._timeout(options),
        });
        return jsHandle_1.JSHandle.from(result.handle);
    }
    async title() {
        return (await this._channel.title()).value;
    }
    async _expect(expression, options) {
        const params = { expression, ...options, isNot: !!options.isNot };
        params.expectedValue = (0, jsHandle_1.serializeArgument)(options.expectedValue);
        const result = (await this._channel.expect(params));
        if (result.received !== undefined)
            result.received = (0, jsHandle_1.parseResult)(result.received);
        return result;
    }
}
exports.Frame = Frame;
function verifyLoadState(name, waitUntil) {
    if (waitUntil === 'networkidle0')
        waitUntil = 'networkidle';
    if (!types_1.kLifecycleEvents.has(waitUntil))
        throw new Error(`${name}: expected one of (load|domcontentloaded|networkidle|commit)`);
    return waitUntil;
}
