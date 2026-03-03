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
exports.emptyZone = exports.Zone = void 0;
exports.currentZone = currentZone;
const async_hooks_1 = require("async_hooks");
const asyncLocalStorage = new async_hooks_1.AsyncLocalStorage();
class Zone {
    _asyncLocalStorage;
    _data;
    constructor(asyncLocalStorage, store) {
        this._asyncLocalStorage = asyncLocalStorage;
        this._data = store;
    }
    with(type, data) {
        return new Zone(this._asyncLocalStorage, new Map(this._data).set(type, data));
    }
    without(type) {
        const data = type ? new Map(this._data) : new Map();
        data.delete(type);
        return new Zone(this._asyncLocalStorage, data);
    }
    run(func) {
        return this._asyncLocalStorage.run(this, func);
    }
    data(type) {
        return this._data.get(type);
    }
}
exports.Zone = Zone;
exports.emptyZone = new Zone(asyncLocalStorage, new Map());
function currentZone() {
    return asyncLocalStorage.getStore() ?? exports.emptyZone;
}
