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
exports.FrameDispatcher = void 0;
const frames_1 = require("../frames");
const dispatcher_1 = require("./dispatcher");
const elementHandlerDispatcher_1 = require("./elementHandlerDispatcher");
const jsHandleDispatcher_1 = require("./jsHandleDispatcher");
const networkDispatchers_1 = require("./networkDispatchers");
const networkDispatchers_2 = require("./networkDispatchers");
const ariaSnapshot_1 = require("../../utils/isomorphic/ariaSnapshot");
const utilsBundle_1 = require("../../utilsBundle");
class FrameDispatcher extends dispatcher_1.Dispatcher {
    _type_Frame = true;
    _frame;
    _browserContextDispatcher;
    static from(scope, frame) {
        const result = scope.connection.existingDispatcher(frame);
        return result || new FrameDispatcher(scope, frame);
    }
    static fromNullable(scope, frame) {
        if (!frame)
            return;
        return FrameDispatcher.from(scope, frame);
    }
    constructor(scope, frame) {
        // Main frames are gc'ed separately from any other frames, so that
        // methods on Page that redirect to the main frame remain operational.
        // Note: we cannot check parentFrame() here because it may be null after the frame has been detached.
        const gcBucket = frame._page.mainFrame() === frame ? 'MainFrame' : 'Frame';
        const pageDispatcher = scope.connection.existingDispatcher(frame._page);
        super(pageDispatcher || scope, frame, 'Frame', {
            url: frame.url(),
            name: frame.name(),
            parentFrame: FrameDispatcher.fromNullable(scope, frame.parentFrame()),
            loadStates: Array.from(frame._firedLifecycleEvents),
        }, gcBucket);
        this._browserContextDispatcher = scope;
        this._frame = frame;
        this.addObjectListener(frames_1.Frame.Events.AddLifecycle, lifecycleEvent => {
            this._dispatchEvent('loadstate', { add: lifecycleEvent });
        });
        this.addObjectListener(frames_1.Frame.Events.RemoveLifecycle, lifecycleEvent => {
            this._dispatchEvent('loadstate', { remove: lifecycleEvent });
        });
        this.addObjectListener(frames_1.Frame.Events.InternalNavigation, (event) => {
            if (!event.isPublic)
                return;
            const params = { url: event.url, name: event.name, error: event.error ? event.error.message : undefined };
            if (event.newDocument)
                params.newDocument = { request: networkDispatchers_2.RequestDispatcher.fromNullable(this._browserContextDispatcher, event.newDocument.request || null) };
            this._dispatchEvent('navigated', params);
        });
    }
    async goto(params, progress) {
        return { response: networkDispatchers_1.ResponseDispatcher.fromNullable(this._browserContextDispatcher, await this._frame.goto(progress, params.url, params)) };
    }
    async frameElement(params, progress) {
        return { element: elementHandlerDispatcher_1.ElementHandleDispatcher.from(this, await progress.race(this._frame.frameElement())) };
    }
    async evaluateExpression(params, progress) {
        return { value: (0, jsHandleDispatcher_1.serializeResult)(await progress.race(this._frame.evaluateExpression(params.expression, { isFunction: params.isFunction }, (0, jsHandleDispatcher_1.parseArgument)(params.arg)))) };
    }
    async evaluateExpressionHandle(params, progress) {
        return { handle: elementHandlerDispatcher_1.ElementHandleDispatcher.fromJSOrElementHandle(this, await progress.race(this._frame.evaluateExpressionHandle(params.expression, { isFunction: params.isFunction }, (0, jsHandleDispatcher_1.parseArgument)(params.arg)))) };
    }
    async waitForSelector(params, progress) {
        return { element: elementHandlerDispatcher_1.ElementHandleDispatcher.fromNullable(this, await this._frame.waitForSelector(progress, params.selector, true, params)) };
    }
    async dispatchEvent(params, progress) {
        return this._frame.dispatchEvent(progress, params.selector, params.type, (0, jsHandleDispatcher_1.parseArgument)(params.eventInit), params);
    }
    async evalOnSelector(params, progress) {
        return { value: (0, jsHandleDispatcher_1.serializeResult)(await progress.race(this._frame.evalOnSelector(params.selector, !!params.strict, params.expression, params.isFunction, (0, jsHandleDispatcher_1.parseArgument)(params.arg)))) };
    }
    async evalOnSelectorAll(params, progress) {
        return { value: (0, jsHandleDispatcher_1.serializeResult)(await progress.race(this._frame.evalOnSelectorAll(params.selector, params.expression, params.isFunction, (0, jsHandleDispatcher_1.parseArgument)(params.arg)))) };
    }
    async querySelector(params, progress) {
        return { element: elementHandlerDispatcher_1.ElementHandleDispatcher.fromNullable(this, await progress.race(this._frame.querySelector(params.selector, params))) };
    }
    async querySelectorAll(params, progress) {
        const elements = await progress.race(this._frame.querySelectorAll(params.selector));
        return { elements: elements.map(e => elementHandlerDispatcher_1.ElementHandleDispatcher.from(this, e)) };
    }
    async queryCount(params, progress) {
        return { value: await progress.race(this._frame.queryCount(params.selector, params)) };
    }
    async content(params, progress) {
        return { value: await progress.race(this._frame.content()) };
    }
    async setContent(params, progress) {
        return await this._frame.setContent(progress, params.html, params);
    }
    async addScriptTag(params, progress) {
        return { element: elementHandlerDispatcher_1.ElementHandleDispatcher.from(this, await progress.race(this._frame.addScriptTag(params))) };
    }
    async addStyleTag(params, progress) {
        return { element: elementHandlerDispatcher_1.ElementHandleDispatcher.from(this, await progress.race(this._frame.addStyleTag(params))) };
    }
    async click(params, progress) {
        progress.metadata.potentiallyClosesScope = true;
        return await this._frame.click(progress, params.selector, params);
    }
    async dblclick(params, progress) {
        return await this._frame.dblclick(progress, params.selector, params);
    }
    async dragAndDrop(params, progress) {
        return await this._frame.dragAndDrop(progress, params.source, params.target, params);
    }
    async tap(params, progress) {
        return await this._frame.tap(progress, params.selector, params);
    }
    async fill(params, progress) {
        return await this._frame.fill(progress, params.selector, params.value, params);
    }
    async focus(params, progress) {
        await this._frame.focus(progress, params.selector, params);
    }
    async blur(params, progress) {
        await this._frame.blur(progress, params.selector, params);
    }
    async textContent(params, progress) {
        const value = await this._frame.textContent(progress, params.selector, params);
        return { value: value === null ? undefined : value };
    }
    async innerText(params, progress) {
        return { value: await this._frame.innerText(progress, params.selector, params) };
    }
    async innerHTML(params, progress) {
        return { value: await this._frame.innerHTML(progress, params.selector, params) };
    }
    async resolveSelector(params, progress) {
        return await this._frame.resolveSelector(progress, params.selector);
    }
    async getAttribute(params, progress) {
        const value = await this._frame.getAttribute(progress, params.selector, params.name, params);
        return { value: value === null ? undefined : value };
    }
    async inputValue(params, progress) {
        const value = await this._frame.inputValue(progress, params.selector, params);
        return { value };
    }
    async isChecked(params, progress) {
        return { value: await this._frame.isChecked(progress, params.selector, params) };
    }
    async isDisabled(params, progress) {
        return { value: await this._frame.isDisabled(progress, params.selector, params) };
    }
    async isEditable(params, progress) {
        return { value: await this._frame.isEditable(progress, params.selector, params) };
    }
    async isEnabled(params, progress) {
        return { value: await this._frame.isEnabled(progress, params.selector, params) };
    }
    async isHidden(params, progress) {
        return { value: await this._frame.isHidden(progress, params.selector, params) };
    }
    async isVisible(params, progress) {
        return { value: await this._frame.isVisible(progress, params.selector, params) };
    }
    async hover(params, progress) {
        return await this._frame.hover(progress, params.selector, params);
    }
    async selectOption(params, progress) {
        const elements = (params.elements || []).map(e => e._elementHandle);
        return { values: await this._frame.selectOption(progress, params.selector, elements, params.options || [], params) };
    }
    async setInputFiles(params, progress) {
        return await this._frame.setInputFiles(progress, params.selector, params);
    }
    async type(params, progress) {
        return await this._frame.type(progress, params.selector, params.text, params);
    }
    async press(params, progress) {
        return await this._frame.press(progress, params.selector, params.key, params);
    }
    async check(params, progress) {
        return await this._frame.check(progress, params.selector, params);
    }
    async uncheck(params, progress) {
        return await this._frame.uncheck(progress, params.selector, params);
    }
    async waitForTimeout(params, progress) {
        return await this._frame.waitForTimeout(progress, params.waitTimeout);
    }
    async waitForFunction(params, progress) {
        return { handle: elementHandlerDispatcher_1.ElementHandleDispatcher.fromJSOrElementHandle(this, await this._frame.waitForFunctionExpression(progress, params.expression, params.isFunction, (0, jsHandleDispatcher_1.parseArgument)(params.arg), params)) };
    }
    async title(params, progress) {
        return { value: await progress.race(this._frame.title()) };
    }
    async highlight(params, progress) {
        return await this._frame.highlight(progress, params.selector);
    }
    async expect(params, progress) {
        progress.metadata.potentiallyClosesScope = true;
        let expectedValue = params.expectedValue ? (0, jsHandleDispatcher_1.parseArgument)(params.expectedValue) : undefined;
        if (params.expression === 'to.match.aria' && expectedValue)
            expectedValue = (0, ariaSnapshot_1.parseAriaSnapshotUnsafe)(utilsBundle_1.yaml, expectedValue);
        const result = await this._frame.expect(progress, params.selector, { ...params, expectedValue, timeoutForLogs: params.timeout });
        if (result.received !== undefined)
            result.received = (0, jsHandleDispatcher_1.serializeResult)(result.received);
        return result;
    }
    async ariaSnapshot(params, progress) {
        return { snapshot: await this._frame.ariaSnapshot(progress, params.selector) };
    }
}
exports.FrameDispatcher = FrameDispatcher;
