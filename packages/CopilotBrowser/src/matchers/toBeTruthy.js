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
exports.toBeTruthy = toBeTruthy;
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
const util_1 = require("../util");
async function toBeTruthy(matcherName, locator, receiverType, expected, arg, query, options = {}) {
    (0, util_1.expectTypes)(locator, [receiverType], matcherName);
    const timeout = options.timeout ?? this.timeout;
    const { matches: pass, log, timedOut, received, errorMessage } = await query(!!this.isNot, timeout);
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
    if (pass) {
        printedExpected = `Expected: not ${expected}`;
        printedReceived = errorMessage ? '' : `Received: ${expected}`;
    }
    else {
        printedExpected = `Expected: ${expected}`;
        printedReceived = errorMessage ? '' : `Received: ${received}`;
    }
    const message = () => {
        return (0, utils_1.formatMatcherMessage)(this.utils, {
            isNot: this.isNot,
            promise: this.promise,
            matcherName,
            expectation: arg,
            locator: locator.toString(),
            timeout,
            timedOut,
            printedExpected,
            printedReceived,
            errorMessage,
            log,
        });
    };
    return {
        message,
        pass,
        actual: received,
        name: matcherName,
        expected,
        log,
        timeout: timedOut ? timeout : undefined,
    };
}
