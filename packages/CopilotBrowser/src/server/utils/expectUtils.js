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
exports.simpleMatcherUtils = exports.callLogText = exports.printReceivedStringContainExpectedResult = exports.printReceivedStringContainExpectedSubstring = void 0;
exports.serializeExpectedTextValues = serializeExpectedTextValues;
exports.formatMatcherMessage = formatMatcherMessage;
const rtti_1 = require("../../utils/isomorphic/rtti");
const utilsBundle_1 = require("../../utilsBundle");
function serializeExpectedTextValues(items, options = {}) {
    return items.map(i => ({
        string: (0, rtti_1.isString)(i) ? i : undefined,
        regexSource: (0, rtti_1.isRegExp)(i) ? i.source : undefined,
        regexFlags: (0, rtti_1.isRegExp)(i) ? i.flags : undefined,
        matchSubstring: options.matchSubstring,
        ignoreCase: options.ignoreCase,
        normalizeWhiteSpace: options.normalizeWhiteSpace,
    }));
}
// #region
// Mirrored from https://github.com/facebook/jest/blob/f13abff8df9a0e1148baf3584bcde6d1b479edc7/packages/expect/src/print.ts with minor modifications.
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found here
 * https://github.com/facebook/jest/blob/1547740bbc26400d69f4576bf35645163e942829/LICENSE
 */
// Format substring but do not enclose in double quote marks.
// The replacement is compatible with pretty-format package.
const printSubstring = (val) => val.replace(/"|\\/g, '\\$&');
const printReceivedStringContainExpectedSubstring = (utils, received, start, length) => utils.RECEIVED_COLOR('"' +
    printSubstring(received.slice(0, start)) +
    utils.INVERTED_COLOR(printSubstring(received.slice(start, start + length))) +
    printSubstring(received.slice(start + length)) +
    '"');
exports.printReceivedStringContainExpectedSubstring = printReceivedStringContainExpectedSubstring;
const printReceivedStringContainExpectedResult = (utils, received, result) => result === null
    ? utils.printReceived(received)
    : (0, exports.printReceivedStringContainExpectedSubstring)(utils, received, result.index, result[0].length);
exports.printReceivedStringContainExpectedResult = printReceivedStringContainExpectedResult;
function formatMatcherMessage(utils, details) {
    const receiver = details.receiver ?? (details.locator ? 'locator' : 'page');
    let message = utils.DIM_COLOR('expect(') + utils.RECEIVED_COLOR(receiver)
        + utils.DIM_COLOR(')' + (details.promise ? '.' + details.promise : '') + (details.isNot ? '.not' : '') + '.')
        + details.matcherName
        + utils.DIM_COLOR('(') + utils.EXPECTED_COLOR(details.expectation) + utils.DIM_COLOR(')')
        + ' failed\n\n';
    // Sometimes diff is actually expected + received. Turn it into two lines to
    // simplify alignment logic.
    const diffLines = details.printedDiff?.split('\n');
    if (diffLines?.length === 2) {
        details.printedExpected = diffLines[0];
        details.printedReceived = diffLines[1];
        details.printedDiff = undefined;
    }
    const align = !details.errorMessage && details.printedExpected?.startsWith('Expected:')
        && (!details.printedReceived || details.printedReceived.startsWith('Received:'));
    if (details.locator)
        message += `Locator: ${align ? ' ' : ''}${details.locator}\n`;
    if (details.printedExpected)
        message += details.printedExpected + '\n';
    if (details.printedReceived)
        message += details.printedReceived + '\n';
    if (details.timedOut && details.timeout)
        message += `Timeout: ${align ? ' ' : ''}${details.timeout}ms\n`;
    if (details.printedDiff)
        message += details.printedDiff + '\n';
    if (details.errorMessage) {
        message += details.errorMessage;
        if (!details.errorMessage.endsWith('\n'))
            message += '\n';
    }
    message += (0, exports.callLogText)(utils, details.log);
    return message;
}
const callLogText = (utils, log) => {
    if (!log || !log.some(l => !!l))
        return '';
    return `
Call log:
${utils.DIM_COLOR(log.join('\n'))}
`;
};
exports.callLogText = callLogText;
function printValue(value) {
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}
function printReceived(value) {
    return utilsBundle_1.colors.red(printValue(value));
}
function printExpected(value) {
    return utilsBundle_1.colors.green(printValue(value));
}
exports.simpleMatcherUtils = {
    DIM_COLOR: utilsBundle_1.colors.dim,
    RECEIVED_COLOR: utilsBundle_1.colors.red,
    EXPECTED_COLOR: utilsBundle_1.colors.green,
    INVERTED_COLOR: utilsBundle_1.colors.inverse,
    printReceived,
    printExpected,
    printDiffOrStringify: (expected, received, expectedLabel, receivedLabel) => {
        const maxLength = Math.max(expectedLabel.length, receivedLabel.length) + 2;
        return `${expectedLabel}: `.padEnd(maxLength) + printExpected(expected) + `\n` +
            `${receivedLabel}: `.padEnd(maxLength) + printReceived(received);
    },
};
