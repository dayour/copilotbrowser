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
exports.isString = void 0;
exports.isRegExp = isRegExp;
exports.isObject = isObject;
exports.isError = isError;
var stringUtils_1 = require("./stringUtils");
Object.defineProperty(exports, "isString", { enumerable: true, get: function () { return stringUtils_1.isString; } });
function isRegExp(obj) {
    return obj instanceof RegExp || Object.prototype.toString.call(obj) === '[object RegExp]';
}
function isObject(obj) {
    return typeof obj === 'object' && obj !== null;
}
function isError(obj) {
    return obj instanceof Error || (obj && Object.getPrototypeOf(obj)?.name === 'Error');
}
