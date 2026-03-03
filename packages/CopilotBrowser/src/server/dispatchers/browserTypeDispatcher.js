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
exports.BrowserTypeDispatcher = void 0;
const browserContextDispatcher_1 = require("./browserContextDispatcher");
const browserDispatcher_1 = require("./browserDispatcher");
const dispatcher_1 = require("./dispatcher");
class BrowserTypeDispatcher extends dispatcher_1.Dispatcher {
    _type_BrowserType = true;
    _denyLaunch;
    constructor(scope, browserType, denyLaunch) {
        super(scope, browserType, 'BrowserType', {
            executablePath: browserType.executablePath(),
            name: browserType.name()
        });
        this._denyLaunch = denyLaunch;
    }
    async launch(params, progress) {
        if (this._denyLaunch)
            throw new Error(`Launching more browsers is not allowed.`);
        const browser = await this._object.launch(progress, params);
        return { browser: new browserDispatcher_1.BrowserDispatcher(this, browser) };
    }
    async launchPersistentContext(params, progress) {
        if (this._denyLaunch)
            throw new Error(`Launching more browsers is not allowed.`);
        const browserContext = await this._object.launchPersistentContext(progress, params.userDataDir, params);
        const browserDispatcher = new browserDispatcher_1.BrowserDispatcher(this, browserContext._browser);
        const contextDispatcher = browserContextDispatcher_1.BrowserContextDispatcher.from(browserDispatcher, browserContext);
        return { browser: browserDispatcher, context: contextDispatcher };
    }
    async connectOverCDP(params, progress) {
        if (this._denyLaunch)
            throw new Error(`Launching more browsers is not allowed.`);
        const browser = await this._object.connectOverCDP(progress, params.endpointURL, params);
        const browserDispatcher = new browserDispatcher_1.BrowserDispatcher(this, browser);
        return {
            browser: browserDispatcher,
            defaultContext: browser._defaultContext ? browserContextDispatcher_1.BrowserContextDispatcher.from(browserDispatcher, browser._defaultContext) : undefined,
        };
    }
    async connectOverCDPTransport(params, progress) {
        if (this._denyLaunch)
            throw new Error(`Launching more browsers is not allowed.`);
        const browser = await this._object.connectOverCDPTransport(progress, params.transport);
        const browserDispatcher = new browserDispatcher_1.BrowserDispatcher(this, browser);
        return { browser: browserDispatcher, defaultContext: browser._defaultContext ? browserContextDispatcher_1.BrowserContextDispatcher.from(browserDispatcher, browser._defaultContext) : undefined };
    }
}
exports.BrowserTypeDispatcher = BrowserTypeDispatcher;
