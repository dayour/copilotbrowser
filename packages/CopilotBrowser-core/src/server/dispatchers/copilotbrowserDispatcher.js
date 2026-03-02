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
exports.copilotbrowserDispatcher = void 0;
const socksProxy_1 = require("../utils/socksProxy");
const fetch_1 = require("../fetch");
const androidDispatcher_1 = require("./androidDispatcher");
const androidDispatcher_2 = require("./androidDispatcher");
const browserDispatcher_1 = require("./browserDispatcher");
const browserTypeDispatcher_1 = require("./browserTypeDispatcher");
const dispatcher_1 = require("./dispatcher");
const electronDispatcher_1 = require("./electronDispatcher");
const localUtilsDispatcher_1 = require("./localUtilsDispatcher");
const networkDispatchers_1 = require("./networkDispatchers");
const instrumentation_1 = require("../instrumentation");
const eventsHelper_1 = require("../utils/eventsHelper");
class copilotbrowserDispatcher extends dispatcher_1.Dispatcher {
    _type_copilotbrowser;
    _browserDispatcher;
    constructor(scope, copilotbrowser, options = {}) {
        const denyLaunch = options.denyLaunch ?? false;
        const chromium = new browserTypeDispatcher_1.BrowserTypeDispatcher(scope, copilotbrowser.chromium, denyLaunch);
        const firefox = new browserTypeDispatcher_1.BrowserTypeDispatcher(scope, copilotbrowser.firefox, denyLaunch);
        const webkit = new browserTypeDispatcher_1.BrowserTypeDispatcher(scope, copilotbrowser.webkit, denyLaunch);
        const android = new androidDispatcher_1.AndroidDispatcher(scope, copilotbrowser.android);
        const initializer = {
            chromium,
            firefox,
            webkit,
            android,
            electron: new electronDispatcher_1.ElectronDispatcher(scope, copilotbrowser.electron, denyLaunch),
            utils: copilotbrowser.options.isServer ? undefined : new localUtilsDispatcher_1.LocalUtilsDispatcher(scope, copilotbrowser),
            socksSupport: options.socksProxy ? new SocksSupportDispatcher(scope, copilotbrowser, options.socksProxy) : undefined,
        };
        let browserDispatcher;
        if (options.preLaunchedBrowser) {
            const browserTypeDispatcher = initializer[options.preLaunchedBrowser.options.name];
            browserDispatcher = new browserDispatcher_1.BrowserDispatcher(browserTypeDispatcher, options.preLaunchedBrowser, {
                ignoreStopAndKill: true,
                isolateContexts: !options.sharedBrowser,
            });
            initializer.preLaunchedBrowser = browserDispatcher;
        }
        if (options.preLaunchedAndroidDevice)
            initializer.preConnectedAndroidDevice = new androidDispatcher_2.AndroidDeviceDispatcher(android, options.preLaunchedAndroidDevice);
        super(scope, copilotbrowser, 'copilotbrowser', initializer);
        this._type_copilotbrowser = true;
        this._browserDispatcher = browserDispatcher;
    }
    async newRequest(params, progress) {
        const request = new fetch_1.GlobalAPIRequestContext(this._object, params);
        return { request: networkDispatchers_1.APIRequestContextDispatcher.from(this.parentScope(), request) };
    }
    async cleanup() {
        // Cleanup contexts upon disconnect.
        await this._browserDispatcher?.cleanupContexts();
    }
}
exports.copilotbrowserDispatcher = copilotbrowserDispatcher;
class SocksSupportDispatcher extends dispatcher_1.Dispatcher {
    _type_SocksSupport;
    _socksProxy;
    _socksListeners;
    constructor(scope, parent, socksProxy) {
        super(scope, new instrumentation_1.SdkObject(parent, 'socksSupport'), 'SocksSupport', {});
        this._type_SocksSupport = true;
        this._socksProxy = socksProxy;
        this._socksListeners = [
            eventsHelper_1.eventsHelper.addEventListener(socksProxy, socksProxy_1.SocksProxy.Events.SocksRequested, (payload) => this._dispatchEvent('socksRequested', payload)),
            eventsHelper_1.eventsHelper.addEventListener(socksProxy, socksProxy_1.SocksProxy.Events.SocksData, (payload) => this._dispatchEvent('socksData', payload)),
            eventsHelper_1.eventsHelper.addEventListener(socksProxy, socksProxy_1.SocksProxy.Events.SocksClosed, (payload) => this._dispatchEvent('socksClosed', payload)),
        ];
    }
    async socksConnected(params, progress) {
        this._socksProxy?.socketConnected(params);
    }
    async socksFailed(params, progress) {
        this._socksProxy?.socketFailed(params);
    }
    async socksData(params, progress) {
        this._socksProxy?.sendSocketData(params);
    }
    async socksError(params, progress) {
        this._socksProxy?.sendSocketError(params);
    }
    async socksEnd(params, progress) {
        this._socksProxy?.sendSocketEnd(params);
    }
    _onDispose() {
        eventsHelper_1.eventsHelper.removeEventListeners(this._socksListeners);
    }
}
