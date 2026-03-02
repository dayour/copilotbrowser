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
exports.ElectronApplicationDispatcher = exports.ElectronDispatcher = void 0;
const browserContextDispatcher_1 = require("./browserContextDispatcher");
const dispatcher_1 = require("./dispatcher");
const jsHandleDispatcher_1 = require("./jsHandleDispatcher");
const electron_1 = require("../electron/electron");
class ElectronDispatcher extends dispatcher_1.Dispatcher {
    _type_Electron = true;
    _denyLaunch;
    constructor(scope, electron, denyLaunch) {
        super(scope, electron, 'Electron', {});
        this._denyLaunch = denyLaunch;
    }
    async launch(params, progress) {
        if (this._denyLaunch)
            throw new Error(`Launching more browsers is not allowed.`);
        const electronApplication = await this._object.launch(progress, params);
        return { electronApplication: new ElectronApplicationDispatcher(this, electronApplication) };
    }
}
exports.ElectronDispatcher = ElectronDispatcher;
class ElectronApplicationDispatcher extends dispatcher_1.Dispatcher {
    _type_EventTarget = true;
    _type_ElectronApplication = true;
    _subscriptions = new Set();
    constructor(scope, electronApplication) {
        super(scope, electronApplication, 'ElectronApplication', {
            context: browserContextDispatcher_1.BrowserContextDispatcher.from(scope, electronApplication.context())
        });
        this.addObjectListener(electron_1.ElectronApplication.Events.Close, () => {
            this._dispatchEvent('close');
            this._dispose();
        });
        this.addObjectListener(electron_1.ElectronApplication.Events.Console, (message) => {
            if (!this._subscriptions.has('console'))
                return;
            this._dispatchEvent('console', {
                type: message.type(),
                text: message.text(),
                args: message.args().map(a => jsHandleDispatcher_1.JSHandleDispatcher.fromJSHandle(this, a)),
                location: message.location(),
                timestamp: message.timestamp(),
            });
        });
    }
    async browserWindow(params, progress) {
        const handle = await progress.race(this._object.browserWindow(params.page.page()));
        return { handle: jsHandleDispatcher_1.JSHandleDispatcher.fromJSHandle(this, handle) };
    }
    async evaluateExpression(params, progress) {
        const handle = await progress.race(this._object._nodeElectronHandlePromise);
        return { value: (0, jsHandleDispatcher_1.serializeResult)(await progress.race(handle.evaluateExpression(params.expression, { isFunction: params.isFunction }, (0, jsHandleDispatcher_1.parseArgument)(params.arg)))) };
    }
    async evaluateExpressionHandle(params, progress) {
        const handle = await progress.race(this._object._nodeElectronHandlePromise);
        const result = await progress.race(handle.evaluateExpressionHandle(params.expression, { isFunction: params.isFunction }, (0, jsHandleDispatcher_1.parseArgument)(params.arg)));
        return { handle: jsHandleDispatcher_1.JSHandleDispatcher.fromJSHandle(this, result) };
    }
    async updateSubscription(params, progress) {
        if (params.enabled)
            this._subscriptions.add(params.event);
        else
            this._subscriptions.delete(params.event);
    }
}
exports.ElectronApplicationDispatcher = ElectronApplicationDispatcher;
