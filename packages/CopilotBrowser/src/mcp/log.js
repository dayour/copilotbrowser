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
exports.testDebug = void 0;
exports.logUnhandledError = logUnhandledError;
const utilsBundle_1 = require("@copilotbrowser/copilotbrowser/lib/utilsBundle");
const errorDebug = (0, utilsBundle_1.debug)('pw:mcp:error');
function logUnhandledError(error) {
    errorDebug(error);
}
exports.testDebug = (0, utilsBundle_1.debug)('pw:mcp:test');
