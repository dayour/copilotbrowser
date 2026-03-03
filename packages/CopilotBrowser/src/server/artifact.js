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
exports.Artifact = void 0;
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("../utils");
const errors_1 = require("./errors");
const instrumentation_1 = require("./instrumentation");
const manualPromise_1 = require("../utils/isomorphic/manualPromise");
class Artifact extends instrumentation_1.SdkObject {
    _localPath;
    _unaccessibleErrorMessage;
    _cancelCallback;
    _finishedPromise = new manualPromise_1.ManualPromise();
    _saveCallbacks = [];
    _finished = false;
    _deleted = false;
    _failureError;
    constructor(parent, localPath, unaccessibleErrorMessage, cancelCallback) {
        super(parent, 'artifact');
        this._localPath = localPath;
        this._unaccessibleErrorMessage = unaccessibleErrorMessage;
        this._cancelCallback = cancelCallback;
    }
    finishedPromise() {
        return this._finishedPromise;
    }
    localPath() {
        return this._localPath;
    }
    async localPathAfterFinished() {
        if (this._unaccessibleErrorMessage)
            throw new Error(this._unaccessibleErrorMessage);
        await this._finishedPromise;
        if (this._failureError)
            throw this._failureError;
        return this._localPath;
    }
    saveAs(saveCallback) {
        if (this._unaccessibleErrorMessage)
            throw new Error(this._unaccessibleErrorMessage);
        if (this._deleted)
            throw new Error(`File already deleted. Save before deleting.`);
        if (this._failureError)
            throw this._failureError;
        if (this._finished) {
            saveCallback(this._localPath).catch(() => { });
            return;
        }
        this._saveCallbacks.push(saveCallback);
    }
    async failureError() {
        if (this._unaccessibleErrorMessage)
            return this._unaccessibleErrorMessage;
        await this._finishedPromise;
        return this._failureError?.message || null;
    }
    async cancel() {
        (0, utils_1.assert)(this._cancelCallback !== undefined);
        return this._cancelCallback();
    }
    async delete() {
        if (this._unaccessibleErrorMessage)
            return;
        const fileName = await this.localPathAfterFinished();
        if (this._deleted)
            return;
        this._deleted = true;
        if (fileName)
            await fs_1.default.promises.unlink(fileName).catch(e => { });
    }
    async deleteOnContextClose() {
        // Compared to "delete", this method does not wait for the artifact to finish.
        // We use it when closing the context to avoid stalling.
        if (this._deleted)
            return;
        this._deleted = true;
        if (!this._unaccessibleErrorMessage)
            await fs_1.default.promises.unlink(this._localPath).catch(e => { });
        await this.reportFinished(new errors_1.TargetClosedError(this.closeReason()));
    }
    async reportFinished(error) {
        if (this._finished)
            return;
        this._finished = true;
        this._failureError = error;
        if (error) {
            for (const callback of this._saveCallbacks)
                await callback('', error);
        }
        else {
            for (const callback of this._saveCallbacks)
                await callback(this._localPath);
        }
        this._saveCallbacks = [];
        this._finishedPromise.resolve();
    }
}
exports.Artifact = Artifact;
