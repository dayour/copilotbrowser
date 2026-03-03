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
exports.toHaveURLWithPredicate = toHaveURLWithPredicate;
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
async function toHaveURLWithPredicate(page, expected, options) {
    const matcherName = 'toHaveURL';
    const timeout = options?.timeout ?? this.timeout;
    const baseURL = page.context()._options.baseURL;
    let conditionSucceeded = false;
    let lastCheckedURLString = undefined;
    try {
        await page.mainFrame().waitForURL(url => {
            lastCheckedURLString = url.toString();
            if (options?.ignoreCase) {
                return (!this.isNot ===
                    (0, utils_1.urlMatches)(baseURL?.toLocaleLowerCase(), lastCheckedURLString.toLocaleLowerCase(), expected));
            }
            return (!this.isNot === (0, utils_1.urlMatches)(baseURL, lastCheckedURLString, expected));
        }, { timeout });
        conditionSucceeded = true;
    }
    catch (e) {
        conditionSucceeded = false;
    }
    if (conditionSucceeded)
        return { name: matcherName, pass: !this.isNot, message: () => '' };
    return {
        name: matcherName,
        pass: this.isNot,
        message: () => toHaveURLMessage(this, matcherName, expected, lastCheckedURLString, this.isNot, true, timeout),
        actual: lastCheckedURLString,
        timeout,
    };
}
function toHaveURLMessage(state, matcherName, expected, received, pass, timedOut, timeout) {
    const receivedString = received || '';
    let printedReceived;
    let printedExpected;
    let printedDiff;
    if (typeof expected === 'function') {
        printedExpected = `Expected: predicate to ${!state.isNot ? 'succeed' : 'fail'}`;
        printedReceived = `Received: ${state.utils.printReceived(receivedString)}`;
    }
    else {
        if (pass) {
            printedExpected = `Expected pattern: not ${state.utils.printExpected(expected)}`;
            const formattedReceived = (0, utils_1.printReceivedStringContainExpectedResult)(state.utils, receivedString, null);
            printedReceived = `Received string: ${formattedReceived}`;
        }
        else {
            const labelExpected = `Expected ${typeof expected === 'string' ? 'string' : 'pattern'}`;
            printedDiff = state.utils.printDiffOrStringify(expected, receivedString, labelExpected, 'Received string', false);
        }
    }
    return (0, utils_1.formatMatcherMessage)(state.utils, {
        isNot: state.isNot,
        promise: state.promise,
        matcherName,
        expectation: 'expected',
        timeout,
        timedOut,
        printedExpected,
        printedReceived,
        printedDiff,
    });
}
