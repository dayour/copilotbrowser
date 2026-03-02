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
exports.fileUploadSizeLimit = void 0;
exports.prepareFilesForUpload = prepareFilesForUpload;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const assert_1 = require("../utils/isomorphic/assert");
const utilsBundle_1 = require("../utilsBundle");
// Keep in sync with the client.
exports.fileUploadSizeLimit = 50 * 1024 * 1024;
async function filesExceedUploadLimit(files) {
    const sizes = await Promise.all(files.map(async (file) => (await fs_1.default.promises.stat(file)).size));
    return sizes.reduce((total, size) => total + size, 0) >= exports.fileUploadSizeLimit;
}
async function prepareFilesForUpload(frame, params) {
    const { payloads, streams, directoryStream } = params;
    let { localPaths, localDirectory } = params;
    if ([payloads, localPaths, localDirectory, streams, directoryStream].filter(Boolean).length !== 1)
        throw new Error('Exactly one of payloads, localPaths and streams must be provided');
    if (streams)
        localPaths = streams.map(c => c.path());
    if (directoryStream)
        localDirectory = directoryStream.path();
    if (localPaths) {
        for (const p of localPaths)
            (0, assert_1.assert)(path_1.default.isAbsolute(p) && path_1.default.resolve(p) === p, 'Paths provided to localPaths must be absolute and fully resolved.');
    }
    let fileBuffers = payloads;
    if (!frame._page.browserContext._browser._isCollocatedWithServer) {
        // If the browser is on a different machine read files into buffers.
        if (localPaths) {
            if (await filesExceedUploadLimit(localPaths))
                throw new Error('Cannot transfer files larger than 50Mb to a browser not co-located with the server');
            fileBuffers = await Promise.all(localPaths.map(async (item) => {
                return {
                    name: path_1.default.basename(item),
                    buffer: await fs_1.default.promises.readFile(item),
                    lastModifiedMs: (await fs_1.default.promises.stat(item)).mtimeMs,
                };
            }));
            localPaths = undefined;
        }
    }
    const filePayloads = fileBuffers?.map(payload => ({
        name: payload.name,
        mimeType: payload.mimeType || utilsBundle_1.mime.getType(payload.name) || 'application/octet-stream',
        buffer: payload.buffer.toString('base64'),
        lastModifiedMs: payload.lastModifiedMs
    }));
    return { localPaths, localDirectory, filePayloads };
}
