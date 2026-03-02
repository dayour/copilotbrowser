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
exports.ProgressController = void 0;
exports.isAbortError = isAbortError;
exports.raceUncancellableOperationWithCleanup = raceUncancellableOperationWithCleanup;
const errors_1 = require("./errors");
const utils_1 = require("../utils");
const manualPromise_1 = require("../utils/isomorphic/manualPromise");
class ProgressController {
    _forceAbortPromise = new manualPromise_1.ManualPromise();
    _donePromise = new manualPromise_1.ManualPromise();
    _state = 'before';
    _onCallLog;
    metadata;
    _controller;
    constructor(metadata, onCallLog) {
        this.metadata = metadata || { id: '', startTime: 0, endTime: 0, type: 'Internal', method: '', params: {}, log: [], internal: true };
        this._onCallLog = onCallLog;
        this._forceAbortPromise.catch(e => null); // Prevent unhandled promise rejection.
        this._controller = new AbortController();
    }
    static createForSdkObject(sdkObject, callMetadata) {
        const logName = sdkObject.logName || 'api';
        return new ProgressController(callMetadata, message => {
            utils_1.debugLogger.log(logName, message);
            sdkObject.instrumentation.onCallLog(sdkObject, callMetadata, logName, message);
        });
    }
    static runInternalTask(task, timeout) {
        const progress = new ProgressController();
        return progress.run(task, timeout);
    }
    async abort(error) {
        if (this._state === 'running') {
            error[kAbortErrorSymbol] = true;
            this._state = { error };
            this._forceAbortPromise.reject(error);
            this._controller.abort(error);
        }
        await this._donePromise;
    }
    async run(task, timeout) {
        const deadline = timeout ? (0, utils_1.monotonicTime)() + timeout : 0;
        (0, utils_1.assert)(this._state === 'before');
        this._state = 'running';
        let timer;
        const progress = {
            timeout: timeout ?? 0,
            deadline,
            disableTimeout: () => {
                clearTimeout(timer);
            },
            log: message => {
                if (this._state === 'running')
                    this.metadata.log.push(message);
                // Note: we might be sending logs after progress has finished, for example browser logs.
                this._onCallLog?.(message);
            },
            metadata: this.metadata,
            race: (promise) => {
                const promises = Array.isArray(promise) ? promise : [promise];
                if (!promises.length)
                    return Promise.resolve();
                return Promise.race([...promises, this._forceAbortPromise]);
            },
            wait: async (timeout) => {
                // Timeout = 0 here means nowait. Counter to what it typically is (wait forever).
                let timer;
                const promise = new Promise(f => timer = setTimeout(f, timeout));
                return progress.race(promise).finally(() => clearTimeout(timer));
            },
            signal: this._controller.signal,
        };
        if (deadline) {
            const timeoutError = new errors_1.TimeoutError(`Timeout ${timeout}ms exceeded.`);
            timer = setTimeout(() => {
                // TODO: migrate this to "progress.disableTimeout()".
                if (this.metadata.pauseStartTime && !this.metadata.pauseEndTime)
                    return;
                if (this._state === 'running') {
                    this._state = { error: timeoutError };
                    this._forceAbortPromise.reject(timeoutError);
                    this._controller.abort(timeoutError);
                }
            }, deadline - (0, utils_1.monotonicTime)());
        }
        try {
            const result = await task(progress);
            this._state = 'finished';
            return result;
        }
        catch (error) {
            this._state = { error };
            throw error;
        }
        finally {
            clearTimeout(timer);
            this._donePromise.resolve();
        }
    }
}
exports.ProgressController = ProgressController;
const kAbortErrorSymbol = Symbol('kAbortError');
function isAbortError(error) {
    return error instanceof errors_1.TimeoutError || !!error[kAbortErrorSymbol];
}
// Use this method to race some external operation that you really want to undo
// when it goes beyond the progress abort.
async function raceUncancellableOperationWithCleanup(progress, run, cleanup) {
    let aborted = false;
    try {
        return await progress.race(run().then(async (t) => {
            if (aborted)
                await cleanup(t);
            return t;
        }));
    }
    catch (error) {
        aborted = true;
        throw error;
    }
}
