"use strict";
/**
 * Copyright Microsoft Corporation. All rights reserved.
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
exports.toBeAttached = toBeAttached;
exports.toBeChecked = toBeChecked;
exports.toBeDisabled = toBeDisabled;
exports.toBeEditable = toBeEditable;
exports.toBeEmpty = toBeEmpty;
exports.toBeEnabled = toBeEnabled;
exports.toBeFocused = toBeFocused;
exports.toBeHidden = toBeHidden;
exports.toBeVisible = toBeVisible;
exports.toBeInViewport = toBeInViewport;
exports.toContainText = toContainText;
exports.toHaveAccessibleDescription = toHaveAccessibleDescription;
exports.toHaveAccessibleName = toHaveAccessibleName;
exports.toHaveAccessibleErrorMessage = toHaveAccessibleErrorMessage;
exports.toHaveAttribute = toHaveAttribute;
exports.toHaveClass = toHaveClass;
exports.toContainClass = toContainClass;
exports.toHaveCount = toHaveCount;
exports.toHaveCSS = toHaveCSS;
exports.toHaveId = toHaveId;
exports.toHaveJSProperty = toHaveJSProperty;
exports.toHaveRole = toHaveRole;
exports.toHaveText = toHaveText;
exports.toHaveValue = toHaveValue;
exports.toHaveValues = toHaveValues;
exports.toHaveTitle = toHaveTitle;
exports.toHaveURL = toHaveURL;
exports.toBeOK = toBeOK;
exports.toPass = toPass;
exports.computeMatcherTitleSuffix = computeMatcherTitleSuffix;
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
const utils_2 = require("@copilotbrowser/copilotbrowser/lib/utils");
const util_1 = require("../util");
const toBeTruthy_1 = require("./toBeTruthy");
const toEqual_1 = require("./toEqual");
const toHaveURL_1 = require("./toHaveURL");
const toMatchText_1 = require("./toMatchText");
const toMatchSnapshot_1 = require("./toMatchSnapshot");
const config_1 = require("../common/config");
const globals_1 = require("../common/globals");
const testInfo_1 = require("../worker/testInfo");
function toBeAttached(locator, options) {
    const attached = !options || options.attached === undefined || options.attached;
    const expected = attached ? 'attached' : 'detached';
    const arg = attached ? '' : '{ attached: false }';
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeAttached', locator, 'Locator', expected, arg, async (isNot, timeout) => {
        return await locator._expect(attached ? 'to.be.attached' : 'to.be.detached', { isNot, timeout });
    }, options);
}
function toBeChecked(locator, options) {
    const checked = options?.checked;
    const indeterminate = options?.indeterminate;
    const expectedValue = {
        checked,
        indeterminate,
    };
    let expected;
    let arg;
    if (options?.indeterminate) {
        expected = 'indeterminate';
        arg = `{ indeterminate: true }`;
    }
    else {
        expected = options?.checked === false ? 'unchecked' : 'checked';
        arg = options?.checked === false ? `{ checked: false }` : '';
    }
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeChecked', locator, 'Locator', expected, arg, async (isNot, timeout) => {
        return await locator._expect('to.be.checked', { isNot, timeout, expectedValue });
    }, options);
}
function toBeDisabled(locator, options) {
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeDisabled', locator, 'Locator', 'disabled', '', async (isNot, timeout) => {
        return await locator._expect('to.be.disabled', { isNot, timeout });
    }, options);
}
function toBeEditable(locator, options) {
    const editable = !options || options.editable === undefined || options.editable;
    const expected = editable ? 'editable' : 'readOnly';
    const arg = editable ? '' : '{ editable: false }';
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeEditable', locator, 'Locator', expected, arg, async (isNot, timeout) => {
        return await locator._expect(editable ? 'to.be.editable' : 'to.be.readonly', { isNot, timeout });
    }, options);
}
function toBeEmpty(locator, options) {
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeEmpty', locator, 'Locator', 'empty', '', async (isNot, timeout) => {
        return await locator._expect('to.be.empty', { isNot, timeout });
    }, options);
}
function toBeEnabled(locator, options) {
    const enabled = !options || options.enabled === undefined || options.enabled;
    const expected = enabled ? 'enabled' : 'disabled';
    const arg = enabled ? '' : '{ enabled: false }';
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeEnabled', locator, 'Locator', expected, arg, async (isNot, timeout) => {
        return await locator._expect(enabled ? 'to.be.enabled' : 'to.be.disabled', { isNot, timeout });
    }, options);
}
function toBeFocused(locator, options) {
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeFocused', locator, 'Locator', 'focused', '', async (isNot, timeout) => {
        return await locator._expect('to.be.focused', { isNot, timeout });
    }, options);
}
function toBeHidden(locator, options) {
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeHidden', locator, 'Locator', 'hidden', '', async (isNot, timeout) => {
        return await locator._expect('to.be.hidden', { isNot, timeout });
    }, options);
}
function toBeVisible(locator, options) {
    const visible = !options || options.visible === undefined || options.visible;
    const expected = visible ? 'visible' : 'hidden';
    const arg = visible ? '' : '{ visible: false }';
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeVisible', locator, 'Locator', expected, arg, async (isNot, timeout) => {
        return await locator._expect(visible ? 'to.be.visible' : 'to.be.hidden', { isNot, timeout });
    }, options);
}
function toBeInViewport(locator, options) {
    return toBeTruthy_1.toBeTruthy.call(this, 'toBeInViewport', locator, 'Locator', 'in viewport', '', async (isNot, timeout) => {
        return await locator._expect('to.be.in.viewport', { isNot, expectedNumber: options?.ratio, timeout });
    }, options);
}
function toContainText(locator, expected, options = {}) {
    if (Array.isArray(expected)) {
        return toEqual_1.toEqual.call(this, 'toContainText', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)(expected, { matchSubstring: true, normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
            return await locator._expect('to.contain.text.array', { expectedText, isNot, useInnerText: options.useInnerText, timeout });
        }, expected, { ...options, contains: true });
    }
    else {
        return toMatchText_1.toMatchText.call(this, 'toContainText', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { matchSubstring: true, normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
            return await locator._expect('to.have.text', { expectedText, isNot, useInnerText: options.useInnerText, timeout });
        }, expected, { ...options, matchSubstring: true });
    }
}
function toHaveAccessibleDescription(locator, expected, options) {
    return toMatchText_1.toMatchText.call(this, 'toHaveAccessibleDescription', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { ignoreCase: options?.ignoreCase, normalizeWhiteSpace: true });
        return await locator._expect('to.have.accessible.description', { expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveAccessibleName(locator, expected, options) {
    return toMatchText_1.toMatchText.call(this, 'toHaveAccessibleName', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { ignoreCase: options?.ignoreCase, normalizeWhiteSpace: true });
        return await locator._expect('to.have.accessible.name', { expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveAccessibleErrorMessage(locator, expected, options) {
    return toMatchText_1.toMatchText.call(this, 'toHaveAccessibleErrorMessage', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { ignoreCase: options?.ignoreCase, normalizeWhiteSpace: true });
        return await locator._expect('to.have.accessible.error.message', { expectedText: expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveAttribute(locator, name, expected, options) {
    if (!options) {
        // Update params for the case toHaveAttribute(name, options);
        if (typeof expected === 'object' && !(0, utils_1.isRegExp)(expected)) {
            options = expected;
            expected = undefined;
        }
    }
    if (expected === undefined) {
        return toBeTruthy_1.toBeTruthy.call(this, 'toHaveAttribute', locator, 'Locator', 'have attribute', '', async (isNot, timeout) => {
            return await locator._expect('to.have.attribute', { expressionArg: name, isNot, timeout });
        }, options);
    }
    return toMatchText_1.toMatchText.call(this, 'toHaveAttribute', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { ignoreCase: options?.ignoreCase });
        return await locator._expect('to.have.attribute.value', { expressionArg: name, expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveClass(locator, expected, options) {
    if (Array.isArray(expected)) {
        return toEqual_1.toEqual.call(this, 'toHaveClass', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)(expected);
            return await locator._expect('to.have.class.array', { expectedText, isNot, timeout });
        }, expected, options);
    }
    else {
        return toMatchText_1.toMatchText.call(this, 'toHaveClass', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)([expected]);
            return await locator._expect('to.have.class', { expectedText, isNot, timeout });
        }, expected, options);
    }
}
function toContainClass(locator, expected, options) {
    if (Array.isArray(expected)) {
        if (expected.some(e => (0, utils_1.isRegExp)(e)))
            throw new Error(`"expected" argument in toContainClass cannot contain RegExp values`);
        return toEqual_1.toEqual.call(this, 'toContainClass', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)(expected);
            return await locator._expect('to.contain.class.array', { expectedText, isNot, timeout });
        }, expected, options);
    }
    else {
        if ((0, utils_1.isRegExp)(expected))
            throw new Error(`"expected" argument in toContainClass cannot be a RegExp value`);
        return toMatchText_1.toMatchText.call(this, 'toContainClass', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)([expected]);
            return await locator._expect('to.contain.class', { expectedText, isNot, timeout });
        }, expected, options);
    }
}
function toHaveCount(locator, expected, options) {
    return toEqual_1.toEqual.call(this, 'toHaveCount', locator, 'Locator', async (isNot, timeout) => {
        return await locator._expect('to.have.count', { expectedNumber: expected, isNot, timeout });
    }, expected, options);
}
function toHaveCSS(locator, arg1, arg2, arg3) {
    if (typeof arg1 === 'string') {
        if (arg2 === undefined || !((0, utils_1.isString)(arg2) || (0, utils_1.isRegExp)(arg2)))
            throw new Error(`toHaveCSS expected value must be a string or a regular expression`);
        return toMatchText_1.toMatchText.call(this, 'toHaveCSS', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)([arg2]);
            return await locator._expect('to.have.css', { expressionArg: arg1, expectedText, isNot, timeout });
        }, arg2, arg3);
    }
    else {
        if (typeof arg1 !== 'object' || !arg1)
            throw new Error(`toHaveCSS argument must be a string or an object`);
        return toEqual_1.toEqual.call(this, 'toHaveCSS', locator, 'Locator', async (isNot, timeout) => {
            return await locator._expect('to.have.css.object', { isNot, expectedValue: arg1, timeout });
        }, arg1, arg2);
    }
}
function toHaveId(locator, expected, options) {
    return toMatchText_1.toMatchText.call(this, 'toHaveId', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected]);
        return await locator._expect('to.have.id', { expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveJSProperty(locator, name, expected, options) {
    return toEqual_1.toEqual.call(this, 'toHaveJSProperty', locator, 'Locator', async (isNot, timeout) => {
        return await locator._expect('to.have.property', { expressionArg: name, expectedValue: expected, isNot, timeout });
    }, expected, options);
}
function toHaveRole(locator, expected, options) {
    if (!(0, utils_1.isString)(expected))
        throw new Error(`"role" argument in toHaveRole must be a string`);
    return toMatchText_1.toMatchText.call(this, 'toHaveRole', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected]);
        return await locator._expect('to.have.role', { expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveText(locator, expected, options = {}) {
    if (Array.isArray(expected)) {
        return toEqual_1.toEqual.call(this, 'toHaveText', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)(expected, { normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
            return await locator._expect('to.have.text.array', { expectedText, isNot, useInnerText: options?.useInnerText, timeout });
        }, expected, options);
    }
    else {
        return toMatchText_1.toMatchText.call(this, 'toHaveText', locator, 'Locator', async (isNot, timeout) => {
            const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { normalizeWhiteSpace: true, ignoreCase: options.ignoreCase });
            return await locator._expect('to.have.text', { expectedText, isNot, useInnerText: options?.useInnerText, timeout });
        }, expected, options);
    }
}
function toHaveValue(locator, expected, options) {
    return toMatchText_1.toMatchText.call(this, 'toHaveValue', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected]);
        return await locator._expect('to.have.value', { expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveValues(locator, expected, options) {
    return toEqual_1.toEqual.call(this, 'toHaveValues', locator, 'Locator', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)(expected);
        return await locator._expect('to.have.values', { expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveTitle(page, expected, options = {}) {
    return toMatchText_1.toMatchText.call(this, 'toHaveTitle', page, 'Page', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { normalizeWhiteSpace: true });
        return await page.mainFrame()._expect('to.have.title', { expectedText, isNot, timeout });
    }, expected, options);
}
function toHaveURL(page, expected, options) {
    if ((0, utils_1.isURLPattern)(expected))
        return toHaveURL_1.toHaveURLWithPredicate.call(this, page, url => expected.test(url.href), options);
    // Ports don't support predicates. Keep separate server and client codepaths
    if (typeof expected === 'function')
        return toHaveURL_1.toHaveURLWithPredicate.call(this, page, expected, options);
    const baseURL = page.context()._options.baseURL;
    expected = typeof expected === 'string' ? (0, utils_1.constructURLBasedOnBaseURL)(baseURL, expected) : expected;
    return toMatchText_1.toMatchText.call(this, 'toHaveURL', page, 'Page', async (isNot, timeout) => {
        const expectedText = (0, utils_1.serializeExpectedTextValues)([expected], { ignoreCase: options?.ignoreCase });
        return await page.mainFrame()._expect('to.have.url', { expectedText, isNot, timeout });
    }, expected, options);
}
async function toBeOK(response) {
    const matcherName = 'toBeOK';
    (0, util_1.expectTypes)(response, ['APIResponse'], matcherName);
    const contentType = response.headers()['content-type'];
    const isTextEncoding = contentType && (0, utils_1.isTextualMimeType)(contentType);
    const [log, text] = (this.isNot === response.ok()) ? await Promise.all([
        response._fetchLog(),
        isTextEncoding ? response.text() : null
    ]) : [];
    const message = () => (0, utils_1.formatMatcherMessage)(this.utils, {
        isNot: this.isNot,
        promise: this.promise,
        matcherName,
        receiver: 'response',
        expectation: '',
        log,
    }) + (text === null ? '' : `\nResponse text:\n${utils_2.colors.dim(text?.substring(0, 1000) || '')}`);
    const pass = response.ok();
    return { message, pass };
}
async function toPass(callback, options = {}) {
    const testInfo = (0, globals_1.currentTestInfo)();
    const timeout = (0, config_1.takeFirst)(options.timeout, testInfo?._projectInternal.expect?.toPass?.timeout, 0);
    const intervals = (0, config_1.takeFirst)(options.intervals, testInfo?._projectInternal.expect?.toPass?.intervals, [100, 250, 500, 1000]);
    const { deadline, timeoutMessage } = testInfo ? testInfo._deadlineForMatcher(timeout) : testInfo_1.TestInfoImpl._defaultDeadlineForMatcher(timeout);
    const result = await (0, utils_1.pollAgainstDeadline)(async () => {
        if (testInfo && (0, globals_1.currentTestInfo)() !== testInfo)
            return { continuePolling: false, result: undefined };
        try {
            await callback();
            return { continuePolling: !!this.isNot, result: undefined };
        }
        catch (e) {
            return { continuePolling: !this.isNot, result: e };
        }
    }, deadline, intervals);
    if (result.timedOut) {
        const message = result.result ? [
            result.result.message,
            '',
            `Call Log:`,
            `- ${timeoutMessage}`,
        ].join('\n') : timeoutMessage;
        return { message: () => message, pass: !!this.isNot };
    }
    return { pass: !this.isNot, message: () => '' };
}
function computeMatcherTitleSuffix(matcherName, receiver, args) {
    if (matcherName === 'toHaveScreenshot') {
        const title = (0, toMatchSnapshot_1.toHaveScreenshotStepTitle)(...args);
        return { short: title ? `(${title})` : '' };
    }
    if (receiver && typeof receiver === 'object' && receiver.constructor?.name === 'Locator') {
        try {
            return { long: ' ' + (0, utils_1.asLocatorDescription)('javascript', receiver._selector) };
        }
        catch {
        }
    }
    return {};
}
