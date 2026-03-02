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
exports.ZipFile = void 0;
const zipBundle_1 = require("../../zipBundle");
class ZipFile {
    _fileName;
    _zipFile;
    _entries = new Map();
    _openedPromise;
    constructor(fileName) {
        this._fileName = fileName;
        this._openedPromise = this._open();
    }
    async _open() {
        await new Promise((fulfill, reject) => {
            zipBundle_1.yauzl.open(this._fileName, { autoClose: false }, (e, z) => {
                if (e) {
                    reject(e);
                    return;
                }
                this._zipFile = z;
                this._zipFile.on('entry', (entry) => {
                    this._entries.set(entry.fileName, entry);
                });
                this._zipFile.on('end', fulfill);
            });
        });
    }
    async entries() {
        await this._openedPromise;
        return [...this._entries.keys()];
    }
    async read(entryPath) {
        await this._openedPromise;
        const entry = this._entries.get(entryPath);
        if (!entry)
            throw new Error(`${entryPath} not found in file ${this._fileName}`);
        return new Promise((resolve, reject) => {
            this._zipFile.openReadStream(entry, (error, readStream) => {
                if (error || !readStream) {
                    reject(error || 'Entry not found');
                    return;
                }
                const buffers = [];
                readStream.on('data', data => buffers.push(data));
                readStream.on('end', () => resolve(Buffer.concat(buffers)));
            });
        });
    }
    close() {
        this._zipFile?.close();
    }
}
exports.ZipFile = ZipFile;
