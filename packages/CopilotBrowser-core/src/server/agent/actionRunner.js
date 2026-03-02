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
exports.runAction = runAction;
exports.traceParamsForAction = traceParamsForAction;
const expectUtils_1 = require("../utils/expectUtils");
const urlMatch_1 = require("../../utils/isomorphic/urlMatch");
const stringUtils_1 = require("../../utils/isomorphic/stringUtils");
const time_1 = require("../../utils/isomorphic/time");
const crypto_1 = require("../utils/crypto");
const ariaSnapshot_1 = require("../../utils/isomorphic/ariaSnapshot");
const locatorGenerators_1 = require("../../utils/isomorphic/locatorGenerators");
const utilsBundle_1 = require("../../utilsBundle");
const errors_1 = require("../errors");
const stackTrace_1 = require("../../utils/isomorphic/stackTrace");
const context_1 = require("./context");
async function runAction(progress, mode, page, action, secrets) {
    const parentMetadata = progress.metadata;
    const frame = page.mainFrame();
    const callMetadata = callMetadataForAction(progress, frame, action, mode);
    callMetadata.log = parentMetadata.log;
    progress.metadata = callMetadata;
    await frame.instrumentation.onBeforeCall(frame, callMetadata, parentMetadata.id);
    let error;
    const result = await innerRunAction(progress, mode, page, action, secrets).catch(e => error = e);
    callMetadata.endTime = (0, time_1.monotonicTime)();
    callMetadata.error = error ? (0, errors_1.serializeError)(error) : undefined;
    callMetadata.result = error ? undefined : result;
    await frame.instrumentation.onAfterCall(frame, callMetadata);
    if (error) {
        (0, stackTrace_1.rewriteErrorMessage)(error, (0, context_1.redactSecrets)(error.message, secrets));
        throw error;
    }
    return result;
}
async function innerRunAction(progress, mode, page, action, secrets) {
    const frame = page.mainFrame();
    // Disable auto-waiting to avoid timeouts, model has seen the snapshot anyway.
    const commonOptions = { strict: true, noAutoWaiting: mode === 'generate' };
    switch (action.method) {
        case 'navigate':
            await frame.goto(progress, action.url);
            break;
        case 'click':
            await frame.click(progress, action.selector, {
                button: action.button,
                clickCount: action.clickCount,
                modifiers: action.modifiers,
                ...commonOptions
            });
            break;
        case 'drag':
            await frame.dragAndDrop(progress, action.sourceSelector, action.targetSelector, { ...commonOptions });
            break;
        case 'hover':
            await frame.hover(progress, action.selector, {
                modifiers: action.modifiers,
                ...commonOptions
            });
            break;
        case 'selectOption':
            const labels = action.labels.map(label => (0, context_1.applySecrets)(label, secrets));
            await frame.selectOption(progress, action.selector, [], labels.map(a => ({ label: a })), { ...commonOptions });
            break;
        case 'pressKey':
            await page.keyboard.press(progress, action.key);
            break;
        case 'pressSequentially': {
            await frame.type(progress, action.selector, (0, context_1.applySecrets)(action.text, secrets), { ...commonOptions });
            if (action.submit)
                await page.keyboard.press(progress, 'Enter');
            break;
        }
        case 'fill': {
            await frame.fill(progress, action.selector, (0, context_1.applySecrets)(action.text, secrets), { ...commonOptions });
            if (action.submit)
                await page.keyboard.press(progress, 'Enter');
            break;
        }
        case 'setChecked':
            if (action.checked)
                await frame.check(progress, action.selector, { ...commonOptions });
            else
                await frame.uncheck(progress, action.selector, { ...commonOptions });
            break;
        case 'expectVisible': {
            await runExpect(frame, progress, mode, action.selector, { expression: 'to.be.visible', isNot: !!action.isNot }, 'visible', 'toBeVisible', '');
            break;
        }
        case 'expectValue': {
            if (action.type === 'textbox' || action.type === 'combobox' || action.type === 'slider') {
                const value = (0, context_1.applySecrets)(action.value, secrets);
                const expectedText = (0, expectUtils_1.serializeExpectedTextValues)([value]);
                await runExpect(frame, progress, mode, action.selector, { expression: 'to.have.value', expectedText, isNot: !!action.isNot }, value, 'toHaveValue', 'expected');
            }
            else if (action.type === 'checkbox' || action.type === 'radio') {
                const expectedValue = { checked: action.value === 'true' };
                await runExpect(frame, progress, mode, action.selector, { selector: action.selector, expression: 'to.be.checked', expectedValue, isNot: !!action.isNot }, action.value ? 'checked' : 'unchecked', 'toBeChecked', '');
            }
            else {
                throw new Error(`Unsupported element type: ${action.type}`);
            }
            break;
        }
        case 'expectAria': {
            const template = (0, context_1.applySecrets)(action.template, secrets);
            const expectedValue = (0, ariaSnapshot_1.parseAriaSnapshotUnsafe)(utilsBundle_1.yaml, template);
            await runExpect(frame, progress, mode, 'body', { expression: 'to.match.aria', expectedValue, isNot: !!action.isNot }, '\n' + template, 'toMatchAriaSnapshot', 'expected');
            break;
        }
        case 'expectURL': {
            if (!action.regex && !action.value)
                throw new Error('Either url or regex must be provided');
            if (action.regex && action.value)
                throw new Error('Only one of url or regex can be provided');
            const expected = action.regex ? (0, stringUtils_1.parseRegex)(action.regex) : (0, urlMatch_1.constructURLBasedOnBaseURL)(page.browserContext._options.baseURL, action.value);
            const expectedText = (0, expectUtils_1.serializeExpectedTextValues)([expected]);
            await runExpect(frame, progress, mode, undefined, { expression: 'to.have.url', expectedText, isNot: !!action.isNot }, expected, 'toHaveURL', 'expected');
            break;
        }
        case 'expectTitle': {
            const value = (0, context_1.applySecrets)(action.value, secrets);
            const expectedText = (0, expectUtils_1.serializeExpectedTextValues)([value], { normalizeWhiteSpace: true });
            await runExpect(frame, progress, mode, undefined, { expression: 'to.have.title', expectedText, isNot: !!action.isNot }, value, 'toHaveTitle', 'expected');
            break;
        }
    }
}
async function runExpect(frame, progress, mode, selector, options, expected, matcherName, expectation) {
    const result = await frame.expect(progress, selector, {
        ...options,
        // When generating, we want the expect to pass or fail immediately and give feedback to the model.
        noAutoWaiting: mode === 'generate',
        timeoutForLogs: mode === 'generate' ? undefined : progress.timeout,
    });
    if (!result.matches === !options.isNot) {
        const received = matcherName === 'toMatchAriaSnapshot' ? '\n' + result.received.raw : result.received;
        const expectedSuffix = typeof expected === 'string' ? '' : ' pattern';
        const expectedDisplay = typeof expected === 'string' ? expected : expected.toString();
        throw new Error((0, expectUtils_1.formatMatcherMessage)(expectUtils_1.simpleMatcherUtils, {
            isNot: options.isNot,
            matcherName,
            expectation,
            locator: selector ? (0, locatorGenerators_1.asLocatorDescription)('javascript', selector) : undefined,
            timedOut: result.timedOut,
            timeout: mode === 'generate' ? undefined : progress.timeout,
            printedExpected: options.isNot ? `Expected${expectedSuffix}: not ${expectedDisplay}` : `Expected${expectedSuffix}: ${expectedDisplay}`,
            printedReceived: result.errorMessage ? '' : `Received: ${received}`,
            errorMessage: result.errorMessage,
            // Note: we are not passing call log, because it will be automatically appended on the client side,
            // as a part of the agent.{perform,expect} call.
        }));
    }
}
function traceParamsForAction(progress, action, mode) {
    const timeout = progress.timeout;
    switch (action.method) {
        case 'navigate': {
            const params = {
                url: action.url,
                timeout,
            };
            return { type: 'Frame', method: 'goto', params };
        }
        case 'click': {
            const params = {
                selector: action.selector,
                strict: true,
                modifiers: action.modifiers,
                button: action.button,
                clickCount: action.clickCount,
                timeout,
            };
            return { type: 'Frame', method: 'click', params };
        }
        case 'drag': {
            const params = {
                source: action.sourceSelector,
                target: action.targetSelector,
                timeout,
            };
            return { type: 'Frame', method: 'dragAndDrop', params };
        }
        case 'hover': {
            const params = {
                selector: action.selector,
                modifiers: action.modifiers,
                timeout,
            };
            return { type: 'Frame', method: 'hover', params };
        }
        case 'pressKey': {
            const params = {
                key: action.key,
            };
            return { type: 'Page', method: 'keyboardPress', params };
        }
        case 'pressSequentially': {
            const params = {
                selector: action.selector,
                text: action.text,
                timeout,
            };
            return { type: 'Frame', method: 'type', params };
        }
        case 'fill': {
            const params = {
                selector: action.selector,
                strict: true,
                value: action.text,
                timeout,
            };
            return { type: 'Frame', method: 'fill', params };
        }
        case 'setChecked': {
            if (action.checked) {
                const params = {
                    selector: action.selector,
                    strict: true,
                    timeout,
                };
                return { type: 'Frame', method: 'check', params };
            }
            else {
                const params = {
                    selector: action.selector,
                    strict: true,
                    timeout,
                };
                return { type: 'Frame', method: 'uncheck', params };
            }
        }
        case 'selectOption': {
            const params = {
                selector: action.selector,
                strict: true,
                options: action.labels.map(label => ({ label })),
                timeout,
            };
            return { type: 'Frame', method: 'selectOption', params };
        }
        case 'expectValue': {
            if (action.type === 'textbox' || action.type === 'combobox' || action.type === 'slider') {
                const expectedText = (0, expectUtils_1.serializeExpectedTextValues)([action.value]);
                const params = {
                    selector: action.selector,
                    expression: 'to.have.value',
                    expectedText,
                    isNot: !!action.isNot,
                    timeout,
                };
                return { type: 'Frame', method: 'expect', title: 'Expect Value', params };
            }
            else if (action.type === 'checkbox' || action.type === 'radio') {
                // TODO: provide serialized expected value
                const params = {
                    selector: action.selector,
                    expression: 'to.be.checked',
                    isNot: !!action.isNot,
                    timeout,
                };
                return { type: 'Frame', method: 'expect', title: 'Expect Checked', params };
            }
            else {
                throw new Error(`Unsupported element type: ${action.type}`);
            }
        }
        case 'expectVisible': {
            const params = {
                selector: action.selector,
                expression: 'to.be.visible',
                isNot: !!action.isNot,
                timeout,
            };
            return { type: 'Frame', method: 'expect', title: 'Expect Visible', params };
        }
        case 'expectAria': {
            // TODO: provide serialized expected value
            const params = {
                selector: 'body',
                expression: 'to.match.snapshot',
                expectedText: [],
                isNot: !!action.isNot,
                timeout,
            };
            return { type: 'Frame', method: 'expect', title: 'Expect Aria Snapshot', params };
        }
        case 'expectURL': {
            const expected = action.regex ? (0, stringUtils_1.parseRegex)(action.regex) : action.value;
            const expectedText = (0, expectUtils_1.serializeExpectedTextValues)([expected]);
            const params = {
                selector: undefined,
                expression: 'to.have.url',
                expectedText,
                isNot: !!action.isNot,
                timeout,
            };
            return { type: 'Frame', method: 'expect', title: 'Expect URL', params };
        }
        case 'expectTitle': {
            const expectedText = (0, expectUtils_1.serializeExpectedTextValues)([action.value], { normalizeWhiteSpace: true });
            const params = {
                selector: undefined,
                expression: 'to.have.title',
                expectedText,
                isNot: !!action.isNot,
                timeout,
            };
            return { type: 'Frame', method: 'expect', title: 'Expect Title', params };
        }
    }
}
function callMetadataForAction(progress, frame, action, mode) {
    const callMetadata = {
        id: `call@${(0, crypto_1.createGuid)()}`,
        objectId: frame.guid,
        pageId: frame._page.guid,
        frameId: frame.guid,
        startTime: (0, time_1.monotonicTime)(),
        endTime: 0,
        log: [],
        ...traceParamsForAction(progress, action, mode),
    };
    return callMetadata;
}
