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
exports.Debugger = void 0;
const events_1 = require("events");
const utils_1 = require("../utils");
const browserContext_1 = require("./browserContext");
const protocolMetainfo_1 = require("../utils/isomorphic/protocolMetainfo");
const symbol = Symbol('Debugger');
class Debugger extends events_1.EventEmitter {
    _pauseOnNextStatement = false;
    _pausedCallsMetadata = new Map();
    _enabled;
    _context;
    static Events = {
        PausedStateChanged: 'pausedstatechanged'
    };
    _muted = false;
    constructor(context) {
        super();
        this._context = context;
        this._context[symbol] = this;
        this._enabled = (0, utils_1.debugMode)() === 'inspector';
        if (this._enabled)
            this.pauseOnNextStatement();
        context.instrumentation.addListener(this, context);
        this._context.once(browserContext_1.BrowserContext.Events.Close, () => {
            this._context.instrumentation.removeListener(this);
        });
    }
    async setMuted(muted) {
        this._muted = muted;
    }
    async onBeforeCall(sdkObject, metadata) {
        if (this._muted)
            return;
        if (shouldPauseOnCall(sdkObject, metadata) || (this._pauseOnNextStatement && shouldPauseBeforeStep(metadata)))
            await this.pause(sdkObject, metadata);
    }
    async onBeforeInputAction(sdkObject, metadata) {
        if (this._muted)
            return;
        if (this._enabled && this._pauseOnNextStatement)
            await this.pause(sdkObject, metadata);
    }
    async pause(sdkObject, metadata) {
        if (this._muted)
            return;
        this._enabled = true;
        metadata.pauseStartTime = (0, utils_1.monotonicTime)();
        const result = new Promise(resolve => {
            this._pausedCallsMetadata.set(metadata, { resolve, sdkObject });
        });
        this.emit(Debugger.Events.PausedStateChanged);
        return result;
    }
    resume(step) {
        if (!this.isPaused())
            return;
        this._pauseOnNextStatement = step;
        const endTime = (0, utils_1.monotonicTime)();
        for (const [metadata, { resolve }] of this._pausedCallsMetadata) {
            metadata.pauseEndTime = endTime;
            resolve();
        }
        this._pausedCallsMetadata.clear();
        this.emit(Debugger.Events.PausedStateChanged);
    }
    pauseOnNextStatement() {
        this._pauseOnNextStatement = true;
    }
    isPaused(metadata) {
        if (metadata)
            return this._pausedCallsMetadata.has(metadata);
        return !!this._pausedCallsMetadata.size;
    }
    pausedDetails() {
        const result = [];
        for (const [metadata, { sdkObject }] of this._pausedCallsMetadata)
            result.push({ metadata, sdkObject });
        return result;
    }
}
exports.Debugger = Debugger;
function shouldPauseOnCall(sdkObject, metadata) {
    if (sdkObject.attribution.copilotbrowser.options.isServer)
        return false;
    if (!sdkObject.attribution.browser?.options.headful && !(0, utils_1.isUnderTest)())
        return false;
    return metadata.method === 'pause';
}
function shouldPauseBeforeStep(metadata) {
    if (metadata.internal)
        return false;
    const metainfo = protocolMetainfo_1.methodMetainfo.get(metadata.type + '.' + metadata.method);
    return !!metainfo?.pausesBeforeAction;
}
