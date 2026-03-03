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
exports.languageSet = languageSet;
const csharp_1 = require("./csharp");
const java_1 = require("./java");
const javascript_1 = require("./javascript");
const jsonl_1 = require("./jsonl");
const python_1 = require("./python");
function languageSet() {
    // Note: generators are ordered in the order of preference for each language.
    // For example, 'copilotbrowser-test' comes before 'javascript'.
    return new Set([
        new javascript_1.JavaScriptLanguageGenerator(/* iscopilotbrowserTest */ true),
        new javascript_1.JavaScriptLanguageGenerator(/* iscopilotbrowserTest */ false),
        new python_1.PythonLanguageGenerator(/* isAsync */ false, /* isPytest */ true),
        new python_1.PythonLanguageGenerator(/* isAsync */ false, /* isPytest */ false),
        new python_1.PythonLanguageGenerator(/* isAsync */ true, /* isPytest */ false),
        new csharp_1.CSharpLanguageGenerator('mstest'),
        new csharp_1.CSharpLanguageGenerator('nunit'),
        new csharp_1.CSharpLanguageGenerator('library'),
        new java_1.JavaLanguageGenerator('junit'),
        new java_1.JavaLanguageGenerator('library'),
        new jsonl_1.JsonlLanguageGenerator(),
    ]);
}
