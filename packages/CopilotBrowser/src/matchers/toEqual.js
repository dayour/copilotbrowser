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
exports.toEqual = toEqual;
const utils_1 = require("copilotbrowser-core/lib/utils");
const util_1 = require("../util");
// Omit colon and one or more spaces, so can call getLabelPrinter.
const EXPECTED_LABEL = 'Expected';
const RECEIVED_LABEL = 'Received';
async function toEqual(matcherName, locator, receiverType, query, expected, options = {}) {
    (0, util_1.expectTypes)(locator, [receiverType], matcherName);
    const timeout = options.timeout ?? this.timeout;
    const { matches: pass, received, log, timedOut, errorMessage } = await query(!!this.isNot, timeout);
    if (pass === !this.isNot) {
        return {
            name: matcherName,
            message: () => '',
            pass,
            expected
        };
    }
    let printedReceived;
    let printedExpected;
    let printedDiff;
    if (pass) {
        printedExpected = `Expected: not ${this.utils.printExpected(expected)}`;
        printedReceived = errorMessage ? '' : `Received: ${this.utils.printReceived(received)}`;
    }
    else if (errorMessage) {
        printedExpected = `Expected: ${this.utils.printExpected(expected)}`;
    }
    else if (Array.isArray(expected) && Array.isArray(received)) {
        const normalizedExpected = expected.map((exp, index) => {
            const rec = received[index];
            if ((0, utils_1.isRegExp)(exp))
                return exp.test(rec) ? rec : exp;
            return exp;
        });
        printedDiff = this.utils.printDiffOrStringify(normalizedExpected, received, EXPECTED_LABEL, RECEIVED_LABEL, false);
    }
    else {
        printedDiff = this.utils.printDiffOrStringify(expected, received, EXPECTED_LABEL, RECEIVED_LABEL, false);
    }
    const message = () => {
        return (0, utils_1.formatMatcherMessage)(this.utils, {
            isNot: this.isNot,
            promise: this.promise,
            matcherName,
            expectation: 'expected',
            locator: locator.toString(),
            timeout,
            timedOut,
            printedExpected,
            printedReceived,
            printedDiff,
            errorMessage,
            log,
        });
    };
    // Passing the actual and expected objects so that a custom reporter
    // could access them, for example in order to display a custom visual diff,
    // or create a different error message
    return {
        actual: received,
        expected, message,
        name: matcherName,
        pass,
        log,
        timeout: timedOut ? timeout : undefined,
    };
}
