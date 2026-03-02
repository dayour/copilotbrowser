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
exports.ExpectError = void 0;
exports.isJestError = isJestError;
const utils_1 = require("copilotbrowser-core/lib/utils");
class ExpectError extends Error {
    matcherResult;
    constructor(jestError, customMessage, stackFrames) {
        super('');
        // Copy to erase the JestMatcherError constructor name from the console.log(error).
        this.name = jestError.name;
        this.message = jestError.message;
        this.matcherResult = jestError.matcherResult;
        if (customMessage)
            this.message = customMessage + '\n\n' + this.message;
        this.stack = this.name + ': ' + this.message + '\n' + (0, utils_1.stringifyStackFrames)(stackFrames).join('\n');
    }
}
exports.ExpectError = ExpectError;
function isJestError(e) {
    return e instanceof Error && 'matcherResult' in e && !!e.matcherResult;
}
