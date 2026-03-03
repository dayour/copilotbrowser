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
exports.debugMode = debugMode;
exports.isUnderTest = isUnderTest;
const env_1 = require("./env");
const _debugMode = (0, env_1.getFromENV)('PWDEBUG') || '';
function debugMode() {
    if (_debugMode === 'console')
        return 'console';
    if (_debugMode === '0' || _debugMode === 'false')
        return '';
    return _debugMode ? 'inspector' : '';
}
const _isUnderTest = (0, env_1.getAsBooleanFromENV)('PWTEST_UNDER_TEST');
function isUnderTest() {
    return _isUnderTest;
}
