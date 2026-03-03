"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactDispatcher = void 0;
const fs_1 = __importDefault(require("fs"));
const dispatcher_1 = require("./dispatcher");
const streamDispatcher_1 = require("./streamDispatcher");
const fileUtils_1 = require("../utils/fileUtils");
class ArtifactDispatcher extends dispatcher_1.Dispatcher {
    _type_Artifact = true;
    static from(parentScope, artifact) {
        return ArtifactDispatcher.fromNullable(parentScope, artifact);
    }
    static fromNullable(parentScope, artifact) {
        if (!artifact)
            return undefined;
        const result = parentScope.connection.existingDispatcher(artifact);
        return result || new ArtifactDispatcher(parentScope, artifact);
    }
    constructor(scope, artifact) {
        super(scope, artifact, 'Artifact', {
            absolutePath: artifact.localPath(),
        });
    }
    async pathAfterFinished(params, progress) {
        const path = await progress.race(this._object.localPathAfterFinished());
        return { value: path };
    }
    async saveAs(params, progress) {
        return await progress.race(new Promise((resolve, reject) => {
            this._object.saveAs(async (localPath, error) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    await (0, fileUtils_1.mkdirIfNeeded)(params.path);
                    await fs_1.default.promises.copyFile(localPath, params.path);
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            });
        }));
    }
    async saveAsStream(params, progress) {
        return await progress.race(new Promise((resolve, reject) => {
            this._object.saveAs(async (localPath, error) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const readable = fs_1.default.createReadStream(localPath, { highWaterMark: 1024 * 1024 });
                    const stream = new streamDispatcher_1.StreamDispatcher(this, readable);
                    // Resolve with a stream, so that client starts saving the data.
                    resolve({ stream });
                    // Block the Artifact until the stream is consumed.
                    await new Promise(resolve => {
                        readable.on('close', resolve);
                        readable.on('end', resolve);
                        readable.on('error', resolve);
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        }));
    }
    async stream(params, progress) {
        const fileName = await progress.race(this._object.localPathAfterFinished());
        const readable = fs_1.default.createReadStream(fileName, { highWaterMark: 1024 * 1024 });
        return { stream: new streamDispatcher_1.StreamDispatcher(this, readable) };
    }
    async failure(params, progress) {
        const error = await progress.race(this._object.failureError());
        return { error: error || undefined };
    }
    async cancel(params, progress) {
        await progress.race(this._object.cancel());
    }
    async delete(params, progress) {
        progress.metadata.potentiallyClosesScope = true;
        await progress.race(this._object.delete());
        this._dispose();
    }
}
exports.ArtifactDispatcher = ArtifactDispatcher;
