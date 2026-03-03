"use strict";
/**
 * Copyright (c) Microsoft Corporation.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HarRecorder = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const artifact_1 = require("../artifact");
const harTracer_1 = require("./harTracer");
const crypto_1 = require("../utils/crypto");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
const zipBundle_1 = require("../../zipBundle");
class HarRecorder {
    _artifact;
    _isFlushed = false;
    _tracer;
    _entries = [];
    _zipFile = null;
    _writtenZipEntries = new Set();
    constructor(context, page, options) {
        this._artifact = new artifact_1.Artifact(context, path_1.default.join(context._browser.options.artifactsDir, `${(0, crypto_1.createGuid)()}.har`));
        const urlFilterRe = options.urlRegexSource !== undefined && options.urlRegexFlags !== undefined ? new RegExp(options.urlRegexSource, options.urlRegexFlags) : undefined;
        const expectsZip = !!options.zip;
        const content = options.content || (expectsZip ? 'attach' : 'embed');
        this._tracer = new harTracer_1.HarTracer(context, page, this, {
            content,
            slimMode: options.mode === 'minimal',
            includeTraceInfo: false,
            recordRequestOverrides: true,
            waitForContentOnStop: true,
            urlFilter: urlFilterRe ?? options.urlGlob,
        });
        this._zipFile = content === 'attach' || expectsZip ? new zipBundle_1.yazl.ZipFile() : null;
        this._tracer.start({ omitScripts: false });
    }
    onEntryStarted(entry) {
        this._entries.push(entry);
    }
    onEntryFinished(entry) {
    }
    onContentBlob(sha1, buffer) {
        if (!this._zipFile || this._writtenZipEntries.has(sha1))
            return;
        this._writtenZipEntries.add(sha1);
        this._zipFile.addBuffer(buffer, sha1);
    }
    async flush() {
        if (this._isFlushed)
            return;
        this._isFlushed = true;
        await this._tracer.flush();
        const log = this._tracer.stop();
        log.entries = this._entries;
        const harFileContent = jsonStringify({ log });
        if (this._zipFile) {
            const result = new manualPromise_1.ManualPromise();
            this._zipFile.on('error', error => result.reject(error));
            this._zipFile.addBuffer(Buffer.from(harFileContent, 'utf-8'), 'har.har');
            this._zipFile.end();
            this._zipFile.outputStream.pipe(fs_1.default.createWriteStream(this._artifact.localPath())).on('close', () => {
                result.resolve();
            });
            await result;
        }
        else {
            await fs_1.default.promises.writeFile(this._artifact.localPath(), harFileContent);
        }
    }
    async export() {
        await this.flush();
        this._artifact.reportFinished();
        return this._artifact;
    }
}
exports.HarRecorder = HarRecorder;
function jsonStringify(object) {
    const tokens = [];
    innerJsonStringify(object, tokens, '', false, undefined);
    return tokens.join('');
}
function innerJsonStringify(object, tokens, indent, flat, parentKey) {
    if (typeof object !== 'object' || object === null) {
        tokens.push(JSON.stringify(object));
        return;
    }
    const isArray = Array.isArray(object);
    if (!isArray && object.constructor.name !== 'Object') {
        tokens.push(JSON.stringify(object));
        return;
    }
    const entries = isArray ? object : Object.entries(object).filter(e => e[1] !== undefined);
    if (!entries.length) {
        tokens.push(isArray ? `[]` : `{}`);
        return;
    }
    const childIndent = `${indent}  `;
    let brackets;
    if (isArray)
        brackets = flat ? { open: '[', close: ']' } : { open: `[\n${childIndent}`, close: `\n${indent}]` };
    else
        brackets = flat ? { open: '{ ', close: ' }' } : { open: `{\n${childIndent}`, close: `\n${indent}}` };
    tokens.push(brackets.open);
    for (let i = 0; i < entries.length; ++i) {
        const entry = entries[i];
        if (i)
            tokens.push(flat ? `, ` : `,\n${childIndent}`);
        if (!isArray)
            tokens.push(`${JSON.stringify(entry[0])}: `);
        const key = isArray ? undefined : entry[0];
        const flatten = flat || key === 'timings' || parentKey === 'headers';
        innerJsonStringify(isArray ? entry : entry[1], tokens, childIndent, flatten, key);
    }
    tokens.push(brackets.close);
}
