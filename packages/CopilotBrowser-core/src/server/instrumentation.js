"use strict";
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdkObject = void 0;
exports.createRootSdkObject = createRootSdkObject;
exports.createInstrumentation = createInstrumentation;
const events_1 = require("events");
const crypto_1 = require("./utils/crypto");
class SdkObject extends events_1.EventEmitter {
    guid;
    attribution;
    instrumentation;
    logName;
    constructor(parent, guidPrefix, guid) {
        super();
        this.guid = guid || `${guidPrefix || ''}@${(0, crypto_1.createGuid)()}`;
        this.setMaxListeners(0);
        this.attribution = { ...parent.attribution };
        this.instrumentation = parent.instrumentation;
    }
    closeReason() {
        return this.attribution.page?._closeReason ||
            this.attribution.context?._closeReason ||
            this.attribution.browser?._closeReason;
    }
}
exports.SdkObject = SdkObject;
function createRootSdkObject() {
    const fakeParent = { attribution: {}, instrumentation: createInstrumentation() };
    const root = new SdkObject(fakeParent);
    root.guid = '';
    return root;
}
function createInstrumentation() {
    const listeners = new Map();
    return new Proxy({}, {
        get: (obj, prop) => {
            if (typeof prop !== 'string')
                return obj[prop];
            if (prop === 'addListener')
                return (listener, context) => listeners.set(listener, context);
            if (prop === 'removeListener')
                return (listener) => listeners.delete(listener);
            if (!prop.startsWith('on'))
                return obj[prop];
            return async (sdkObject, ...params) => {
                for (const [listener, context] of listeners) {
                    if (!context || sdkObject.attribution.context === context)
                        await listener[prop]?.(sdkObject, ...params);
                }
            };
        },
    });
}
