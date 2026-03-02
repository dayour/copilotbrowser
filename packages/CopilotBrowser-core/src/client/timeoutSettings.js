"use strict";
/**
 * Copyright 2019 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
exports.TimeoutSettings = void 0;
const time_1 = require("../utils/isomorphic/time");
class TimeoutSettings {
    _parent;
    _defaultTimeout;
    _defaultNavigationTimeout;
    _platform;
    constructor(platform, parent) {
        this._parent = parent;
        this._platform = platform;
    }
    setDefaultTimeout(timeout) {
        this._defaultTimeout = timeout;
    }
    setDefaultNavigationTimeout(timeout) {
        this._defaultNavigationTimeout = timeout;
    }
    defaultNavigationTimeout() {
        return this._defaultNavigationTimeout;
    }
    defaultTimeout() {
        return this._defaultTimeout;
    }
    navigationTimeout(options) {
        if (typeof options.timeout === 'number')
            return options.timeout;
        if (this._defaultNavigationTimeout !== undefined)
            return this._defaultNavigationTimeout;
        if (this._platform.isDebugMode())
            return 0;
        if (this._defaultTimeout !== undefined)
            return this._defaultTimeout;
        if (this._parent)
            return this._parent.navigationTimeout(options);
        return time_1.DEFAULT_copilotbrowser_TIMEOUT;
    }
    timeout(options) {
        if (typeof options.timeout === 'number')
            return options.timeout;
        if (this._platform.isDebugMode())
            return 0;
        if (this._defaultTimeout !== undefined)
            return this._defaultTimeout;
        if (this._parent)
            return this._parent.timeout(options);
        return time_1.DEFAULT_copilotbrowser_TIMEOUT;
    }
    launchTimeout(options) {
        if (typeof options.timeout === 'number')
            return options.timeout;
        if (this._platform.isDebugMode())
            return 0;
        if (this._parent)
            return this._parent.launchTimeout(options);
        return time_1.DEFAULT_copilotbrowser_LAUNCH_TIMEOUT;
    }
}
exports.TimeoutSettings = TimeoutSettings;
