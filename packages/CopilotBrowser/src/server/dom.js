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
exports.kUnableToAdoptErrorMessage = exports.ElementHandle = exports.FrameExecutionContext = exports.NonRecoverableDOMError = void 0;
exports.isNonRecoverableDOMError = isNonRecoverableDOMError;
exports.throwRetargetableDOMError = throwRetargetableDOMError;
exports.throwElementIsNotAttached = throwElementIsNotAttached;
exports.assertDone = assertDone;
const fs_1 = __importDefault(require("fs"));
const js = __importStar(require("./javascript"));
const utils_1 = require("../utils");
const fileUploadUtils_1 = require("./fileUploadUtils");
const rawInjectedScriptSource = __importStar(require("../generated/injectedScriptSource"));
class NonRecoverableDOMError extends Error {
}
exports.NonRecoverableDOMError = NonRecoverableDOMError;
function isNonRecoverableDOMError(error) {
    return error instanceof NonRecoverableDOMError;
}
class FrameExecutionContext extends js.ExecutionContext {
    frame;
    _injectedScriptPromise;
    world;
    constructor(delegate, frame, world) {
        super(frame, delegate, world || 'content-script');
        this.frame = frame;
        this.world = world;
    }
    adoptIfNeeded(handle) {
        if (handle instanceof ElementHandle && handle._context !== this)
            return this.frame._page.delegate.adoptElementHandle(handle, this);
        return null;
    }
    async evaluate(pageFunction, arg) {
        return js.evaluate(this, true /* returnByValue */, pageFunction, arg);
    }
    async evaluateHandle(pageFunction, arg) {
        return js.evaluate(this, false /* returnByValue */, pageFunction, arg);
    }
    async evaluateExpression(expression, options, arg) {
        return js.evaluateExpression(this, expression, { ...options, returnByValue: true }, arg);
    }
    async evaluateExpressionHandle(expression, options, arg) {
        return js.evaluateExpression(this, expression, { ...options, returnByValue: false }, arg);
    }
    injectedScript() {
        if (!this._injectedScriptPromise) {
            const customEngines = [];
            const selectorsRegistry = this.frame._page.browserContext.selectors();
            for (const [name, { source }] of selectorsRegistry._engines)
                customEngines.push({ name, source: `(${source})` });
            const sdkLanguage = this.frame._page.browserContext._browser.sdkLanguage();
            const options = {
                isUnderTest: (0, utils_1.isUnderTest)(),
                sdkLanguage,
                testIdAttributeName: selectorsRegistry.testIdAttributeName(),
                stableRafCount: this.frame._page.delegate.rafCountForStablePosition(),
                browserName: this.frame._page.browserContext._browser.options.name,
                isUtilityWorld: this.world === 'utility',
                customEngines,
            };
            const source = `
        (() => {
        const module = {};
        ${rawInjectedScriptSource.source}
        return new (module.exports.InjectedScript())(globalThis, ${JSON.stringify(options)});
        })();
      `;
            this._injectedScriptPromise = this.rawEvaluateHandle(source)
                .then(handle => {
                handle._setPreview('InjectedScript');
                return handle;
            });
        }
        return this._injectedScriptPromise;
    }
}
exports.FrameExecutionContext = FrameExecutionContext;
class ElementHandle extends js.JSHandle {
    __elementhandle = true;
    _page;
    _frame;
    constructor(context, objectId) {
        super(context, 'node', undefined, objectId);
        this._page = context.frame._page;
        this._frame = context.frame;
        this._initializePreview().catch(e => { });
    }
    async _initializePreview() {
        const utility = await this._context.injectedScript();
        this._setPreview(await utility.evaluate((injected, e) => 'JSHandle@' + injected.previewNode(e), this));
    }
    asElement() {
        return this;
    }
    async evaluateInUtility(pageFunction, arg) {
        try {
            const utility = await this._frame._utilityContext();
            return await utility.evaluate(pageFunction, [await utility.injectedScript(), this, arg]);
        }
        catch (e) {
            if (this._frame.isNonRetriableError(e))
                throw e;
            return 'error:notconnected';
        }
    }
    async evaluateHandleInUtility(pageFunction, arg) {
        try {
            const utility = await this._frame._utilityContext();
            return await utility.evaluateHandle(pageFunction, [await utility.injectedScript(), this, arg]);
        }
        catch (e) {
            if (this._frame.isNonRetriableError(e))
                throw e;
            return 'error:notconnected';
        }
    }
    async ownerFrame() {
        const frameId = await this._page.delegate.getOwnerFrame(this);
        if (!frameId)
            return null;
        const frame = this._page.frameManager.frame(frameId);
        if (frame)
            return frame;
        for (const page of this._page.browserContext.pages()) {
            const frame = page.frameManager.frame(frameId);
            if (frame)
                return frame;
        }
        return null;
    }
    async isIframeElement() {
        return this.evaluateInUtility(([injected, node]) => node && (node.nodeName === 'IFRAME' || node.nodeName === 'FRAME'), {});
    }
    async contentFrame() {
        const isFrameElement = throwRetargetableDOMError(await this.isIframeElement());
        if (!isFrameElement)
            return null;
        return this._page.delegate.getContentFrame(this);
    }
    async getAttribute(progress, name) {
        return this._frame.getAttribute(progress, ':scope', name, {}, this);
    }
    async inputValue(progress) {
        return this._frame.inputValue(progress, ':scope', {}, this);
    }
    async textContent(progress) {
        return this._frame.textContent(progress, ':scope', {}, this);
    }
    async innerText(progress) {
        return this._frame.innerText(progress, ':scope', {}, this);
    }
    async innerHTML(progress) {
        return this._frame.innerHTML(progress, ':scope', {}, this);
    }
    async dispatchEvent(progress, type, eventInit = {}) {
        return this._frame.dispatchEvent(progress, ':scope', type, eventInit, {}, this);
    }
    async _scrollRectIntoViewIfNeeded(progress, rect) {
        return await progress.race(this._page.delegate.scrollRectIntoViewIfNeeded(this, rect));
    }
    async _waitAndScrollIntoViewIfNeeded(progress, waitForVisible) {
        const result = await this._retryAction(progress, 'scroll into view', async () => {
            progress.log(`  waiting for element to be stable`);
            const waitResult = await progress.race(this.evaluateInUtility(async ([injected, node, { waitForVisible }]) => {
                return await injected.checkElementStates(node, waitForVisible ? ['visible', 'stable'] : ['stable']);
            }, { waitForVisible }));
            if (waitResult)
                return waitResult;
            return await this._scrollRectIntoViewIfNeeded(progress);
        }, {});
        assertDone(throwRetargetableDOMError(result));
    }
    async scrollIntoViewIfNeeded(progress) {
        await this._waitAndScrollIntoViewIfNeeded(progress, false /* waitForVisible */);
    }
    async _clickablePoint() {
        const intersectQuadWithViewport = (quad) => {
            return quad.map(point => ({
                x: Math.min(Math.max(point.x, 0), metrics.width),
                y: Math.min(Math.max(point.y, 0), metrics.height),
            }));
        };
        const computeQuadArea = (quad) => {
            // Compute sum of all directed areas of adjacent triangles
            // https://en.wikipedia.org/wiki/Polygon#Simple_polygons
            let area = 0;
            for (let i = 0; i < quad.length; ++i) {
                const p1 = quad[i];
                const p2 = quad[(i + 1) % quad.length];
                area += (p1.x * p2.y - p2.x * p1.y) / 2;
            }
            return Math.abs(area);
        };
        const [quads, metrics] = await Promise.all([
            this._page.delegate.getContentQuads(this),
            this._page.mainFrame()._utilityContext().then(utility => utility.evaluate(() => ({ width: innerWidth, height: innerHeight }))),
        ]);
        if (quads === 'error:notconnected')
            return quads;
        if (!quads || !quads.length)
            return 'error:notvisible';
        // Allow 1x1 elements. Compensate for rounding errors by comparing with 0.99 instead.
        const filtered = quads.map(quad => intersectQuadWithViewport(quad)).filter(quad => computeQuadArea(quad) > 0.99);
        if (!filtered.length)
            return 'error:notinviewport';
        if (this._page.browserContext._browser.options.name === 'firefox') {
            // Firefox internally uses integer coordinates, so 8.x is converted to 8 or 9 when clicking.
            //
            // This does not work nicely for small elements. For example, 1x1 square with corners
            // (8;8) and (9;9) is targeted when clicking at (8;8) but not when clicking at (9;9).
            // So, clicking at (8.x;8.y) will sometimes click at (9;9) and miss the target.
            //
            // Therefore, we try to find an integer point within a quad to make sure we click inside the element.
            for (const quad of filtered) {
                const integerPoint = findIntegerPointInsideQuad(quad);
                if (integerPoint)
                    return integerPoint;
            }
        }
        // Return the middle point of the first quad.
        return quadMiddlePoint(filtered[0]);
    }
    async _offsetPoint(offset) {
        const [box, border] = await Promise.all([
            this.boundingBox(),
            this.evaluateInUtility(([injected, node]) => injected.getElementBorderWidth(node), {}).catch(e => { }),
        ]);
        if (!box || !border)
            return 'error:notvisible';
        if (border === 'error:notconnected')
            return border;
        // Make point relative to the padding box to align with offsetX/offsetY.
        return {
            x: box.x + border.left + offset.x,
            y: box.y + border.top + offset.y,
        };
    }
    async _retryAction(progress, actionName, action, options) {
        let retry = 0;
        // We progressively wait longer between retries, up to 500ms.
        const waitTime = [0, 20, 100, 100, 500];
        const noAutoWaiting = options.__testHookNoAutoWaiting ?? options.noAutoWaiting;
        while (true) {
            if (retry) {
                progress.log(`retrying ${actionName} action${options.trial ? ' (trial run)' : ''}`);
                const timeout = waitTime[Math.min(retry - 1, waitTime.length - 1)];
                if (timeout) {
                    progress.log(`  waiting ${timeout}ms`);
                    const result = await progress.race(this.evaluateInUtility(([injected, node, timeout]) => new Promise(f => setTimeout(f, timeout)), timeout));
                    if (result === 'error:notconnected')
                        return result;
                }
            }
            else {
                progress.log(`attempting ${actionName} action${options.trial ? ' (trial run)' : ''}`);
            }
            if (!options.skipActionPreChecks && !options.force && !noAutoWaiting)
                await this._frame._page.performActionPreChecks(progress);
            const result = await action(retry);
            ++retry;
            if (result === 'error:notvisible') {
                if (options.force || noAutoWaiting)
                    throw new NonRecoverableDOMError('Element is not visible');
                progress.log('  element is not visible');
                continue;
            }
            if (result === 'error:notinviewport') {
                if (options.force || noAutoWaiting)
                    throw new NonRecoverableDOMError('Element is outside of the viewport');
                progress.log('  element is outside of the viewport');
                continue;
            }
            if (result === 'error:optionsnotfound') {
                if (noAutoWaiting)
                    throw new NonRecoverableDOMError('Did not find some options');
                progress.log('  did not find some options');
                continue;
            }
            if (result === 'error:optionnotenabled') {
                if (noAutoWaiting)
                    throw new NonRecoverableDOMError('Option being selected is not enabled');
                progress.log('  option being selected is not enabled');
                continue;
            }
            if (typeof result === 'object' && 'hitTargetDescription' in result) {
                if (noAutoWaiting)
                    throw new NonRecoverableDOMError(`${result.hitTargetDescription} intercepts pointer events`);
                progress.log(`  ${result.hitTargetDescription} intercepts pointer events`);
                continue;
            }
            if (typeof result === 'object' && 'missingState' in result) {
                if (noAutoWaiting)
                    throw new NonRecoverableDOMError(`Element is not ${result.missingState}`);
                progress.log(`  element is not ${result.missingState}`);
                continue;
            }
            return result;
        }
    }
    async _retryPointerAction(progress, actionName, waitForEnabled, action, options) {
        // Note: do not perform locator handlers checkpoint to avoid moving the mouse in the middle of a drag operation.
        const skipActionPreChecks = actionName === 'move and up';
        return await this._retryAction(progress, actionName, async (retry) => {
            // By default, we scroll with protocol method to reveal the action point.
            // However, that might not work to scroll from under position:sticky elements
            // that overlay the target element. To fight this, we cycle through different
            // scroll alignments. This works in most scenarios.
            const scrollOptions = [
                undefined,
                { block: 'end', inline: 'end' },
                { block: 'center', inline: 'center' },
                { block: 'start', inline: 'start' },
            ];
            const forceScrollOptions = scrollOptions[retry % scrollOptions.length];
            return await this._performPointerAction(progress, actionName, waitForEnabled, action, forceScrollOptions, options);
        }, { ...options, skipActionPreChecks });
    }
    async _performPointerAction(progress, actionName, waitForEnabled, action, forceScrollOptions, options) {
        const { force = false, position } = options;
        const doScrollIntoView = async () => {
            if (forceScrollOptions) {
                return await this.evaluateInUtility(([injected, node, options]) => {
                    if (node.nodeType === 1 /* Node.ELEMENT_NODE */)
                        node.scrollIntoView(options);
                    return 'done';
                }, forceScrollOptions);
            }
            return await this._scrollRectIntoViewIfNeeded(progress, position ? { x: position.x, y: position.y, width: 0, height: 0 } : undefined);
        };
        if (this._frame.parentFrame()) {
            // Best-effort scroll to make sure any iframes containing this element are scrolled
            // into view and visible, so they are not throttled.
            // See https://github.com/dayour/copilotbrowser/issues/27196 for an example.
            await progress.race(doScrollIntoView().catch(() => { }));
        }
        if (options.__testHookBeforeStable)
            await progress.race(options.__testHookBeforeStable());
        if (!force) {
            const elementStates = waitForEnabled ? ['visible', 'enabled', 'stable'] : ['visible', 'stable'];
            progress.log(`  waiting for element to be ${waitForEnabled ? 'visible, enabled and stable' : 'visible and stable'}`);
            const result = await progress.race(this.evaluateInUtility(async ([injected, node, { elementStates }]) => {
                return await injected.checkElementStates(node, elementStates);
            }, { elementStates }));
            if (result)
                return result;
            progress.log(`  element is ${waitForEnabled ? 'visible, enabled and stable' : 'visible and stable'}`);
        }
        if (options.__testHookAfterStable)
            await progress.race(options.__testHookAfterStable());
        progress.log('  scrolling into view if needed');
        const scrolled = await progress.race(doScrollIntoView());
        if (scrolled !== 'done')
            return scrolled;
        progress.log('  done scrolling');
        const maybePoint = position ? await progress.race(this._offsetPoint(position)) : await progress.race(this._clickablePoint());
        if (typeof maybePoint === 'string')
            return maybePoint;
        const point = roundPoint(maybePoint);
        progress.metadata.point = point;
        await progress.race(this.instrumentation.onBeforeInputAction(this, progress.metadata));
        let hitTargetInterceptionHandle;
        if (force) {
            progress.log(`  forcing action`);
        }
        else {
            if (options.__testHookBeforeHitTarget)
                await progress.race(options.__testHookBeforeHitTarget());
            const frameCheckResult = await progress.race(this._checkFrameIsHitTarget(point));
            if (frameCheckResult === 'error:notconnected' || ('hitTargetDescription' in frameCheckResult))
                return frameCheckResult;
            const hitPoint = frameCheckResult.framePoint;
            const actionType = actionName === 'move and up' ? 'drag' : ((actionName === 'hover' || actionName === 'tap') ? actionName : 'mouse');
            const handle = await progress.race(this.evaluateHandleInUtility(([injected, node, { actionType, hitPoint, trial }]) => injected.setupHitTargetInterceptor(node, actionType, hitPoint, trial), { actionType, hitPoint, trial: !!options.trial }));
            if (handle === 'error:notconnected')
                return handle;
            if (!handle._objectId) {
                const error = handle.rawValue();
                if (error === 'error:notconnected')
                    return error;
                return { hitTargetDescription: error };
            }
            hitTargetInterceptionHandle = handle;
        }
        const actionResult = await this._page.frameManager.waitForSignalsCreatedBy(progress, options.waitAfter === true, async () => {
            if (options.__testHookBeforePointerAction)
                await progress.race(options.__testHookBeforePointerAction());
            let restoreModifiers;
            if (options && options.modifiers)
                restoreModifiers = await this._page.keyboard.ensureModifiers(progress, options.modifiers);
            progress.log(`  performing ${actionName} action`);
            await action(point);
            if (restoreModifiers)
                await this._page.keyboard.ensureModifiers(progress, restoreModifiers);
            if (hitTargetInterceptionHandle) {
                const stopHitTargetInterception = this._frame.raceAgainstEvaluationStallingEvents(() => {
                    return hitTargetInterceptionHandle.evaluate(h => h.stop());
                }).catch(e => 'done').finally(() => {
                    hitTargetInterceptionHandle?.dispose();
                });
                if (options.waitAfter !== false) {
                    // When noWaitAfter is passed, we do not want to accidentally stall on
                    // non-committed navigation blocking the evaluate.
                    const hitTargetResult = await progress.race(stopHitTargetInterception);
                    if (hitTargetResult !== 'done')
                        return hitTargetResult;
                }
            }
            progress.log(`  ${options.trial ? 'trial ' : ''}${actionName} action done`);
            progress.log('  waiting for scheduled navigations to finish');
            if (options.__testHookAfterPointerAction)
                await progress.race(options.__testHookAfterPointerAction());
            return 'done';
        }).finally(() => {
            // Do not await here, just in case the renderer is stuck (e.g. on alert)
            // and we won't be able to cleanup.
            const stopPromise = hitTargetInterceptionHandle?.evaluate(h => h.stop()).catch(() => { });
            stopPromise?.then(() => hitTargetInterceptionHandle?.dispose());
        });
        if (actionResult !== 'done')
            return actionResult;
        progress.log('  navigations have finished');
        return 'done';
    }
    async _markAsTargetElement(progress) {
        if (!progress.metadata.id)
            return;
        await progress.race(this.evaluateInUtility(([injected, node, callId]) => {
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */)
                injected.markTargetElements(new Set([node]), callId);
        }, progress.metadata.id));
    }
    async hover(progress, options) {
        await this._markAsTargetElement(progress);
        const result = await this._hover(progress, options);
        return assertDone(throwRetargetableDOMError(result));
    }
    _hover(progress, options) {
        return this._retryPointerAction(progress, 'hover', false /* waitForEnabled */, point => this._page.mouse.move(progress, point.x, point.y), { ...options, waitAfter: 'disabled' });
    }
    async click(progress, options) {
        await this._markAsTargetElement(progress);
        const result = await this._click(progress, { ...options, waitAfter: !options.noWaitAfter });
        return assertDone(throwRetargetableDOMError(result));
    }
    _click(progress, options) {
        return this._retryPointerAction(progress, 'click', true /* waitForEnabled */, point => this._page.mouse.click(progress, point.x, point.y, options), options);
    }
    async dblclick(progress, options) {
        await this._markAsTargetElement(progress);
        const result = await this._dblclick(progress, options);
        return assertDone(throwRetargetableDOMError(result));
    }
    _dblclick(progress, options) {
        return this._retryPointerAction(progress, 'dblclick', true /* waitForEnabled */, point => this._page.mouse.click(progress, point.x, point.y, { ...options, clickCount: 2 }), { ...options, waitAfter: 'disabled' });
    }
    async tap(progress, options) {
        await this._markAsTargetElement(progress);
        const result = await this._tap(progress, options);
        return assertDone(throwRetargetableDOMError(result));
    }
    _tap(progress, options) {
        return this._retryPointerAction(progress, 'tap', true /* waitForEnabled */, point => this._page.touchscreen.tap(progress, point.x, point.y), { ...options, waitAfter: 'disabled' });
    }
    async selectOption(progress, elements, values, options) {
        await this._markAsTargetElement(progress);
        const result = await this._selectOption(progress, elements, values, options);
        return throwRetargetableDOMError(result);
    }
    async _selectOption(progress, elements, values, options) {
        let resultingOptions = [];
        const result = await this._retryAction(progress, 'select option', async () => {
            await progress.race(this.instrumentation.onBeforeInputAction(this, progress.metadata));
            if (!options.force)
                progress.log(`  waiting for element to be visible and enabled`);
            const optionsToSelect = [...elements, ...values];
            const result = await progress.race(this.evaluateInUtility(async ([injected, node, { optionsToSelect, force }]) => {
                if (!force) {
                    const checkResult = await injected.checkElementStates(node, ['visible', 'enabled']);
                    if (checkResult)
                        return checkResult;
                }
                return injected.selectOptions(node, optionsToSelect);
            }, { optionsToSelect, force: options.force }));
            if (Array.isArray(result)) {
                progress.log('  selected specified option(s)');
                resultingOptions = result;
                return 'done';
            }
            return result;
        }, options);
        if (result === 'error:notconnected')
            return result;
        return resultingOptions;
    }
    async fill(progress, value, options) {
        await this._markAsTargetElement(progress);
        const result = await this._fill(progress, value, options);
        assertDone(throwRetargetableDOMError(result));
    }
    async _fill(progress, value, options) {
        progress.log(`  fill("${value}")`);
        return await this._retryAction(progress, 'fill', async () => {
            await progress.race(this.instrumentation.onBeforeInputAction(this, progress.metadata));
            if (!options.force)
                progress.log('  waiting for element to be visible, enabled and editable');
            const result = await progress.race(this.evaluateInUtility(async ([injected, node, { value, force }]) => {
                if (!force) {
                    const checkResult = await injected.checkElementStates(node, ['visible', 'enabled', 'editable']);
                    if (checkResult)
                        return checkResult;
                }
                return injected.fill(node, value);
            }, { value, force: options.force }));
            if (result === 'needsinput') {
                if (value)
                    await this._page.keyboard.insertText(progress, value);
                else
                    await this._page.keyboard.press(progress, 'Delete');
                return 'done';
            }
            else {
                return result;
            }
        }, options);
    }
    async selectText(progress, options) {
        const result = await this._retryAction(progress, 'selectText', async () => {
            if (!options.force)
                progress.log('  waiting for element to be visible');
            return await progress.race(this.evaluateInUtility(async ([injected, node, { force }]) => {
                if (!force) {
                    const checkResult = await injected.checkElementStates(node, ['visible']);
                    if (checkResult)
                        return checkResult;
                }
                return injected.selectText(node);
            }, { force: options.force }));
        }, options);
        assertDone(throwRetargetableDOMError(result));
    }
    async setInputFiles(progress, params) {
        const inputFileItems = await progress.race((0, fileUploadUtils_1.prepareFilesForUpload)(this._frame, params));
        await this._markAsTargetElement(progress);
        const result = await this._setInputFiles(progress, inputFileItems);
        return assertDone(throwRetargetableDOMError(result));
    }
    async _setInputFiles(progress, items) {
        const { filePayloads, localPaths, localDirectory } = items;
        const multiple = filePayloads && filePayloads.length > 1 || localPaths && localPaths.length > 1;
        const result = await progress.race(this.evaluateHandleInUtility(([injected, node, { multiple, directoryUpload }]) => {
            const element = injected.retarget(node, 'follow-label');
            if (!element)
                return;
            if (element.tagName !== 'INPUT')
                throw injected.createStacklessError('Node is not an HTMLInputElement');
            const inputElement = element;
            if (multiple && !inputElement.multiple && !inputElement.webkitdirectory)
                throw injected.createStacklessError('Non-multiple file input can only accept single file');
            if (directoryUpload && !inputElement.webkitdirectory)
                throw injected.createStacklessError('File input does not support directories, pass individual files instead');
            if (!directoryUpload && inputElement.webkitdirectory)
                throw injected.createStacklessError('[webkitdirectory] input requires passing a path to a directory');
            return inputElement;
        }, { multiple, directoryUpload: !!localDirectory }));
        if (result === 'error:notconnected' || !result.asElement())
            return 'error:notconnected';
        const retargeted = result.asElement();
        await progress.race(this.instrumentation.onBeforeInputAction(this, progress.metadata));
        if (localPaths || localDirectory) {
            const localPathsOrDirectory = localDirectory ? [localDirectory] : localPaths;
            await progress.race(Promise.all((localPathsOrDirectory).map(localPath => (fs_1.default.promises.access(localPath, fs_1.default.constants.F_OK)))));
            // Browsers traverse the given directory asynchronously and we want to ensure all files are uploaded.
            const waitForInputEvent = localDirectory ? this.evaluate(node => new Promise(fulfill => {
                node.addEventListener('input', fulfill, { once: true });
            })).catch(() => { }) : Promise.resolve();
            await progress.race(this._page.delegate.setInputFilePaths(retargeted, localPathsOrDirectory));
            await progress.race(waitForInputEvent);
        }
        else {
            await progress.race(retargeted.evaluateInUtility(([injected, node, files]) => injected.setInputFiles(node, files), filePayloads));
        }
        return 'done';
    }
    async focus(progress) {
        await this._markAsTargetElement(progress);
        const result = await this._focus(progress);
        return assertDone(throwRetargetableDOMError(result));
    }
    async _focus(progress, resetSelectionIfNotFocused) {
        return await progress.race(this.evaluateInUtility(([injected, node, resetSelectionIfNotFocused]) => injected.focusNode(node, resetSelectionIfNotFocused), resetSelectionIfNotFocused));
    }
    async _blur(progress) {
        return await progress.race(this.evaluateInUtility(([injected, node]) => injected.blurNode(node), {}));
    }
    async type(progress, text, options) {
        await this._markAsTargetElement(progress);
        const result = await this._type(progress, text, options);
        return assertDone(throwRetargetableDOMError(result));
    }
    async _type(progress, text, options) {
        progress.log(`elementHandle.type("${text}")`);
        await progress.race(this.instrumentation.onBeforeInputAction(this, progress.metadata));
        const result = await this._focus(progress, true /* resetSelectionIfNotFocused */);
        if (result !== 'done')
            return result;
        await this._page.keyboard.type(progress, text, options);
        return 'done';
    }
    async press(progress, key, options) {
        await this._markAsTargetElement(progress);
        const result = await this._press(progress, key, options);
        return assertDone(throwRetargetableDOMError(result));
    }
    async _press(progress, key, options) {
        progress.log(`elementHandle.press("${key}")`);
        await progress.race(this.instrumentation.onBeforeInputAction(this, progress.metadata));
        return this._page.frameManager.waitForSignalsCreatedBy(progress, !options.noWaitAfter, async () => {
            const result = await this._focus(progress, true /* resetSelectionIfNotFocused */);
            if (result !== 'done')
                return result;
            await this._page.keyboard.press(progress, key, options);
            return 'done';
        });
    }
    async check(progress, options) {
        const result = await this._setChecked(progress, true, options);
        return assertDone(throwRetargetableDOMError(result));
    }
    async uncheck(progress, options) {
        const result = await this._setChecked(progress, false, options);
        return assertDone(throwRetargetableDOMError(result));
    }
    async _setChecked(progress, state, options) {
        const isChecked = async () => {
            const result = await progress.race(this.evaluateInUtility(([injected, node]) => injected.elementState(node, 'checked'), {}));
            if (result === 'error:notconnected' || result.received === 'error:notconnected')
                throwElementIsNotAttached();
            return { matches: result.matches, isRadio: result.isRadio };
        };
        await this._markAsTargetElement(progress);
        const checkedState = await isChecked();
        if (checkedState.matches === state)
            return 'done';
        if (!state && checkedState.isRadio)
            throw new NonRecoverableDOMError('Cannot uncheck radio button. Radio buttons can only be unchecked by selecting another radio button in the same group.');
        const result = await this._click(progress, { ...options, waitAfter: 'disabled' });
        if (result !== 'done')
            return result;
        if (options.trial)
            return 'done';
        const finalState = await isChecked();
        if (finalState.matches !== state)
            throw new NonRecoverableDOMError('Clicking the checkbox did not change its state');
        return 'done';
    }
    async boundingBox() {
        return this._page.delegate.getBoundingBox(this);
    }
    async ariaSnapshot() {
        return await this.evaluateInUtility(([injected, element]) => injected.ariaSnapshot(element, { mode: 'expect' }), {});
    }
    async screenshot(progress, options) {
        return await this._page.screenshotter.screenshotElement(progress, this, options);
    }
    async querySelector(selector, options) {
        return this._frame.selectors.query(selector, options, this);
    }
    async querySelectorAll(selector) {
        return this._frame.selectors.queryAll(selector, this);
    }
    async evalOnSelector(selector, strict, expression, isFunction, arg) {
        return this._frame.evalOnSelector(selector, strict, expression, isFunction, arg, this);
    }
    async evalOnSelectorAll(selector, expression, isFunction, arg) {
        return this._frame.evalOnSelectorAll(selector, expression, isFunction, arg, this);
    }
    async isVisible(progress) {
        return this._frame.isVisible(progress, ':scope', {}, this);
    }
    async isHidden(progress) {
        return this._frame.isHidden(progress, ':scope', {}, this);
    }
    async isEnabled(progress) {
        return this._frame.isEnabled(progress, ':scope', {}, this);
    }
    async isDisabled(progress) {
        return this._frame.isDisabled(progress, ':scope', {}, this);
    }
    async isEditable(progress) {
        return this._frame.isEditable(progress, ':scope', {}, this);
    }
    async isChecked(progress) {
        return this._frame.isChecked(progress, ':scope', {}, this);
    }
    async waitForElementState(progress, state) {
        const actionName = `wait for ${state}`;
        const result = await this._retryAction(progress, actionName, async () => {
            return await progress.race(this.evaluateInUtility(async ([injected, node, state]) => {
                return (await injected.checkElementStates(node, [state])) || 'done';
            }, state));
        }, {});
        assertDone(throwRetargetableDOMError(result));
    }
    async waitForSelector(progress, selector, options) {
        return await this._frame.waitForSelector(progress, selector, true, options, this);
    }
    async _adoptTo(context) {
        if (this._context !== context) {
            const adopted = await this._page.delegate.adoptElementHandle(this, context);
            this.dispose();
            return adopted;
        }
        return this;
    }
    async _checkFrameIsHitTarget(point) {
        let frame = this._frame;
        const data = [];
        while (frame.parentFrame()) {
            const frameElement = await frame.frameElement();
            const box = await frameElement.boundingBox();
            const style = await frameElement.evaluateInUtility(([injected, iframe]) => injected.describeIFrameStyle(iframe), {}).catch(e => 'error:notconnected');
            if (!box || style === 'error:notconnected')
                return 'error:notconnected';
            if (style === 'transformed') {
                // We cannot translate coordinates when iframe has any transform applied.
                // The best we can do right now is to skip the hitPoint check,
                // and solely rely on the event interceptor.
                return { framePoint: undefined };
            }
            // Translate from viewport coordinates to frame coordinates.
            const pointInFrame = { x: point.x - box.x - style.left, y: point.y - box.y - style.top };
            data.push({ frame, frameElement, pointInFrame });
            frame = frame.parentFrame();
        }
        // Add main frame.
        data.push({ frame, frameElement: null, pointInFrame: point });
        for (let i = data.length - 1; i > 0; i--) {
            const element = data[i - 1].frameElement;
            const point = data[i].pointInFrame;
            // Hit target in the parent frame should hit the child frame element.
            const hitTargetResult = await element.evaluateInUtility(([injected, element, hitPoint]) => {
                return injected.expectHitTarget(hitPoint, element);
            }, point);
            if (hitTargetResult !== 'done')
                return hitTargetResult;
        }
        return { framePoint: data[0].pointInFrame };
    }
}
exports.ElementHandle = ElementHandle;
function throwRetargetableDOMError(result) {
    if (result === 'error:notconnected')
        throwElementIsNotAttached();
    return result;
}
function throwElementIsNotAttached() {
    throw new Error('Element is not attached to the DOM');
}
function assertDone(result) {
    // This function converts 'done' to void and ensures typescript catches unhandled errors.
}
function roundPoint(point) {
    return {
        x: (point.x * 100 | 0) / 100,
        y: (point.y * 100 | 0) / 100,
    };
}
function quadMiddlePoint(quad) {
    const result = { x: 0, y: 0 };
    for (const point of quad) {
        result.x += point.x / 4;
        result.y += point.y / 4;
    }
    return result;
}
function triangleArea(p1, p2, p3) {
    return Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2;
}
function isPointInsideQuad(point, quad) {
    const area1 = triangleArea(point, quad[0], quad[1]) + triangleArea(point, quad[1], quad[2]) + triangleArea(point, quad[2], quad[3]) + triangleArea(point, quad[3], quad[0]);
    const area2 = triangleArea(quad[0], quad[1], quad[2]) + triangleArea(quad[1], quad[2], quad[3]);
    // Check that point is inside the quad.
    if (Math.abs(area1 - area2) > 0.1)
        return false;
    // Check that point is not on the right/bottom edge, because clicking
    // there does not actually click the element.
    return point.x < Math.max(quad[0].x, quad[1].x, quad[2].x, quad[3].x) &&
        point.y < Math.max(quad[0].y, quad[1].y, quad[2].y, quad[3].y);
}
function findIntegerPointInsideQuad(quad) {
    // Try all four rounding directions of the middle point.
    const point = quadMiddlePoint(quad);
    point.x = Math.floor(point.x);
    point.y = Math.floor(point.y);
    if (isPointInsideQuad(point, quad))
        return point;
    point.x += 1;
    if (isPointInsideQuad(point, quad))
        return point;
    point.y += 1;
    if (isPointInsideQuad(point, quad))
        return point;
    point.x -= 1;
    if (isPointInsideQuad(point, quad))
        return point;
}
exports.kUnableToAdoptErrorMessage = 'Unable to adopt element handle from a different document';
