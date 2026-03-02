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
exports.WritableStreamDispatcher = void 0;
const fs_1 = __importDefault(require("fs"));
const dispatcher_1 = require("./dispatcher");
const instrumentation_1 = require("../instrumentation");
class WritableStreamSdkObject extends instrumentation_1.SdkObject {
    streamOrDirectory;
    lastModifiedMs;
    constructor(parent, streamOrDirectory, lastModifiedMs) {
        super(parent, 'stream');
        this.streamOrDirectory = streamOrDirectory;
        this.lastModifiedMs = lastModifiedMs;
    }
}
class WritableStreamDispatcher extends dispatcher_1.Dispatcher {
    _type_WritableStream = true;
    constructor(scope, streamOrDirectory, lastModifiedMs) {
        super(scope, new WritableStreamSdkObject(scope._object, streamOrDirectory, lastModifiedMs), 'WritableStream', {});
    }
    async write(params, progress) {
        if (typeof this._object.streamOrDirectory === 'string')
            throw new Error('Cannot write to a directory');
        const stream = this._object.streamOrDirectory;
        await progress.race(new Promise((fulfill, reject) => {
            stream.write(params.binary, error => {
                if (error)
                    reject(error);
                else
                    fulfill();
            });
        }));
    }
    async close(params, progress) {
        if (typeof this._object.streamOrDirectory === 'string')
            throw new Error('Cannot close a directory');
        const stream = this._object.streamOrDirectory;
        await progress.race(new Promise(fulfill => stream.end(fulfill)));
        if (this._object.lastModifiedMs)
            await progress.race(fs_1.default.promises.utimes(this.path(), new Date(this._object.lastModifiedMs), new Date(this._object.lastModifiedMs)));
    }
    path() {
        if (typeof this._object.streamOrDirectory === 'string')
            return this._object.streamOrDirectory;
        return this._object.streamOrDirectory.path;
    }
}
exports.WritableStreamDispatcher = WritableStreamDispatcher;
