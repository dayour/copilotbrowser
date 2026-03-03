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
exports.TracingDispatcher = void 0;
const artifactDispatcher_1 = require("./artifactDispatcher");
const dispatcher_1 = require("./dispatcher");
class TracingDispatcher extends dispatcher_1.Dispatcher {
    _type_Tracing = true;
    _started = false;
    static from(scope, tracing) {
        const result = scope.connection.existingDispatcher(tracing);
        return result || new TracingDispatcher(scope, tracing);
    }
    constructor(scope, tracing) {
        super(scope, tracing, 'Tracing', {});
    }
    async tracingStart(params, progress) {
        this._object.start(params);
        this._started = true;
    }
    async tracingStartChunk(params, progress) {
        return await this._object.startChunk(progress, params);
    }
    async tracingGroup(params, progress) {
        const { name, location } = params;
        this._object.group(name, location, progress.metadata);
    }
    async tracingGroupEnd(params, progress) {
        this._object.groupEnd();
    }
    async tracingStopChunk(params, progress) {
        const { artifact, entries } = await this._object.stopChunk(progress, params);
        return { artifact: artifact ? artifactDispatcher_1.ArtifactDispatcher.from(this, artifact) : undefined, entries };
    }
    async tracingStop(params, progress) {
        this._started = false;
        await this._object.stop(progress);
    }
    _onDispose() {
        // Avoid protocol calls for the closed context.
        if (this._started)
            this._object.stopChunk(undefined, { mode: 'discard' }).then(() => this._object.stop(undefined)).catch(() => { });
        this._started = false;
    }
}
exports.TracingDispatcher = TracingDispatcher;
