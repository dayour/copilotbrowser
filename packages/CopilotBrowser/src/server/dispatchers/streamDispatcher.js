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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamDispatcher = void 0;
const dispatcher_1 = require("./dispatcher");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
const instrumentation_1 = require("../instrumentation");
class StreamSdkObject extends instrumentation_1.SdkObject {
    stream;
    constructor(parent, stream) {
        super(parent, 'stream');
        this.stream = stream;
    }
}
class StreamDispatcher extends dispatcher_1.Dispatcher {
    _type_Stream = true;
    _ended = false;
    constructor(scope, stream) {
        super(scope, new StreamSdkObject(scope._object, stream), 'Stream', {});
        // In Node v12.9.0+ we can use readableEnded.
        stream.once('end', () => this._ended = true);
        stream.once('error', () => this._ended = true);
    }
    async read(params, progress) {
        const stream = this._object.stream;
        if (this._ended)
            return { binary: Buffer.from('') };
        if (!stream.readableLength) {
            const readyPromise = new manualPromise_1.ManualPromise();
            const done = () => readyPromise.resolve();
            stream.on('readable', done);
            stream.on('end', done);
            stream.on('error', done);
            await progress.race(readyPromise).finally(() => {
                stream.off('readable', done);
                stream.off('end', done);
                stream.off('error', done);
            });
        }
        const buffer = stream.read(Math.min(stream.readableLength, params.size || stream.readableLength));
        return { binary: buffer || Buffer.from('') };
    }
    async close(params, progress) {
        this._object.stream.destroy();
    }
}
exports.StreamDispatcher = StreamDispatcher;
