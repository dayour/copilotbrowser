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
exports.JsonlLanguageGenerator = void 0;
const utils_1 = require("../../utils");
class JsonlLanguageGenerator {
    id = 'jsonl';
    groupName = '';
    name = 'JSONL';
    highlighter = 'javascript';
    generateAction(actionInContext) {
        const locator = actionInContext.action.selector ? JSON.parse((0, utils_1.asLocator)('jsonl', actionInContext.action.selector)) : undefined;
        const entry = {
            ...actionInContext.action,
            ...actionInContext.frame,
            locator,
            ariaSnapshot: undefined,
        };
        return JSON.stringify(entry);
    }
    generateHeader(options) {
        return JSON.stringify(options);
    }
    generateFooter(saveStorage) {
        return '';
    }
}
exports.JsonlLanguageGenerator = JsonlLanguageGenerator;
