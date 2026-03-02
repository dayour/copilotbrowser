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
exports.getEastAsianWidth = exports.chokidar = exports.enquirer = exports.stoppable = exports.sourceMapSupport = exports.json5 = void 0;
exports.parseMarkdown = parseMarkdown;
exports.json5 = require('./utilsBundleImpl').json5;
exports.sourceMapSupport = require('./utilsBundleImpl').sourceMapSupport;
exports.stoppable = require('./utilsBundleImpl').stoppable;
exports.enquirer = require('./utilsBundleImpl').enquirer;
exports.chokidar = require('./utilsBundleImpl').chokidar;
exports.getEastAsianWidth = require('./utilsBundleImpl').getEastAsianWidth;
const { unified } = require('./utilsBundleImpl').unified;
const remarkParse = require('./utilsBundleImpl').remarkParse;
function parseMarkdown(content) {
    return unified().use(remarkParse).parse(content);
}
