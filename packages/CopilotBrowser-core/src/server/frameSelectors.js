"use strict";
/**
 * Copyright (c) Microsoft Corporation.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameSelectors = void 0;
const utils_1 = require("../utils");
const selectorParser_1 = require("../utils/isomorphic/selectorParser");
class FrameSelectors {
    frame;
    constructor(frame) {
        this.frame = frame;
    }
    _parseSelector(selector, options) {
        const strict = typeof options?.strict === 'boolean' ? options.strict : !!this.frame._page.browserContext._options.strictSelectors;
        return this.frame._page.browserContext.selectors().parseSelector(selector, strict);
    }
    async query(selector, options, scope) {
        const resolved = await this.resolveInjectedForSelector(selector, options, scope);
        // Be careful, |this.frame| can be different from |resolved.frame|.
        if (!resolved)
            return null;
        const handle = await resolved.injected.evaluateHandle((injected, { info, scope }) => {
            return injected.querySelector(info.parsed, scope || document, info.strict);
        }, { info: resolved.info, scope: resolved.scope });
        const elementHandle = handle.asElement();
        if (!elementHandle) {
            handle.dispose();
            return null;
        }
        return adoptIfNeeded(elementHandle, await resolved.frame._mainContext());
    }
    async queryArrayInMainWorld(selector, scope) {
        const resolved = await this.resolveInjectedForSelector(selector, { mainWorld: true }, scope);
        // Be careful, |this.frame| can be different from |resolved.frame|.
        if (!resolved)
            throw new Error(`Failed to find frame for selector "${selector}"`);
        return await resolved.injected.evaluateHandle((injected, { info, scope }) => {
            const elements = injected.querySelectorAll(info.parsed, scope || document);
            injected.checkDeprecatedSelectorUsage(info.parsed, elements);
            return elements;
        }, { info: resolved.info, scope: resolved.scope });
    }
    async queryCount(selector, options) {
        const resolved = await this.resolveInjectedForSelector(selector);
        // Be careful, |this.frame| can be different from |resolved.frame|.
        if (!resolved)
            throw new Error(`Failed to find frame for selector "${selector}"`);
        await options.__testHookBeforeQuery?.();
        return await resolved.injected.evaluate((injected, { info }) => {
            const elements = injected.querySelectorAll(info.parsed, document);
            injected.checkDeprecatedSelectorUsage(info.parsed, elements);
            return elements.length;
        }, { info: resolved.info });
    }
    async queryAll(selector, scope) {
        const resolved = await this.resolveInjectedForSelector(selector, {}, scope);
        // Be careful, |this.frame| can be different from |resolved.frame|.
        if (!resolved)
            return [];
        const arrayHandle = await resolved.injected.evaluateHandle((injected, { info, scope }) => {
            const elements = injected.querySelectorAll(info.parsed, scope || document);
            injected.checkDeprecatedSelectorUsage(info.parsed, elements);
            return elements;
        }, { info: resolved.info, scope: resolved.scope });
        const properties = await arrayHandle.getProperties();
        arrayHandle.dispose();
        // Note: adopting elements one by one may be slow. If we encounter the issue here,
        // we might introduce 'useMainContext' option or similar to speed things up.
        const targetContext = await resolved.frame._mainContext();
        const result = [];
        for (const property of properties.values()) {
            const elementHandle = property.asElement();
            if (elementHandle)
                result.push(adoptIfNeeded(elementHandle, targetContext));
            else
                property.dispose();
        }
        return Promise.all(result);
    }
    _jumpToAriaRefFrameIfNeeded(selector, info, frame) {
        if (info.parsed.parts[0].name !== 'aria-ref')
            return frame;
        const body = info.parsed.parts[0].body;
        const match = body.match(/^f(\d+)e\d+$/);
        if (!match)
            return frame;
        const frameSeq = +match[1];
        const jumptToFrame = this.frame._page.frameManager.frames().find(frame => frame.seq === frameSeq);
        if (!jumptToFrame)
            throw new selectorParser_1.InvalidSelectorError(`Invalid frame in aria-ref selector "${selector}"`);
        return jumptToFrame;
    }
    async resolveFrameForSelector(selector, options = {}, scope) {
        let frame = this.frame;
        const frameChunks = (0, selectorParser_1.splitSelectorByFrame)(selector);
        for (const chunk of frameChunks) {
            (0, selectorParser_1.visitAllSelectorParts)(chunk, (part, nested) => {
                if (nested && part.name === 'internal:control' && part.body === 'enter-frame') {
                    const locator = (0, utils_1.asLocator)(this.frame._page.browserContext._browser.sdkLanguage(), selector);
                    throw new selectorParser_1.InvalidSelectorError(`Frame locators are not allowed inside composite locators, while querying "${locator}"`);
                }
            });
        }
        for (let i = 0; i < frameChunks.length - 1; ++i) {
            const info = this._parseSelector(frameChunks[i], options);
            frame = this._jumpToAriaRefFrameIfNeeded(selector, info, frame);
            const context = await frame._context(info.world);
            const injectedScript = await context.injectedScript();
            const handle = await injectedScript.evaluateHandle((injected, { info, scope, selectorString }) => {
                const element = injected.querySelector(info.parsed, scope || document, info.strict);
                if (element && element.nodeName !== 'IFRAME' && element.nodeName !== 'FRAME')
                    throw injected.createStacklessError(`Selector "${selectorString}" resolved to ${injected.previewNode(element)}, <iframe> was expected`);
                return element;
            }, { info, scope: i === 0 ? scope : undefined, selectorString: (0, selectorParser_1.stringifySelector)(info.parsed) });
            const element = handle.asElement();
            if (!element)
                return null;
            const maybeFrame = await frame._page.delegate.getContentFrame(element);
            element.dispose();
            if (!maybeFrame)
                return null;
            frame = maybeFrame;
        }
        // If we end up in the different frame, we should start from the frame root, so throw away the scope.
        if (frame !== this.frame)
            scope = undefined;
        const lastChunk = frame.selectors._parseSelector(frameChunks[frameChunks.length - 1], options);
        frame = this._jumpToAriaRefFrameIfNeeded(selector, lastChunk, frame);
        return { frame, info: lastChunk, scope };
    }
    async resolveInjectedForSelector(selector, options, scope) {
        const resolved = await this.resolveFrameForSelector(selector, options, scope);
        // Be careful, |this.frame| can be different from |resolved.frame|.
        if (!resolved)
            return;
        const context = await resolved.frame._context(options?.mainWorld ? 'main' : resolved.info.world);
        const injected = await context.injectedScript();
        return { injected, info: resolved.info, frame: resolved.frame, scope: resolved.scope };
    }
}
exports.FrameSelectors = FrameSelectors;
async function adoptIfNeeded(handle, context) {
    if (handle._context === context)
        return handle;
    const adopted = await handle._page.delegate.adoptElementHandle(handle, context);
    handle.dispose();
    return adopted;
}
