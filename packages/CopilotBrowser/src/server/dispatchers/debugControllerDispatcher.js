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
exports.DebugControllerDispatcher = void 0;
const utils_1 = require("../../utils");
const debugController_1 = require("../debugController");
const dispatcher_1 = require("./dispatcher");
class DebugControllerDispatcher extends dispatcher_1.Dispatcher {
    _type_DebugController;
    _listeners;
    constructor(connection, debugController) {
        super(connection, debugController, 'DebugController', {});
        this._type_DebugController = true;
        this._listeners = [
            utils_1.eventsHelper.addEventListener(this._object, debugController_1.DebugController.Events.StateChanged, params => {
                this._dispatchEvent('stateChanged', params);
            }),
            utils_1.eventsHelper.addEventListener(this._object, debugController_1.DebugController.Events.InspectRequested, ({ selector, locator, ariaSnapshot }) => {
                this._dispatchEvent('inspectRequested', { selector, locator, ariaSnapshot });
            }),
            utils_1.eventsHelper.addEventListener(this._object, debugController_1.DebugController.Events.SourceChanged, ({ text, header, footer, actions }) => {
                this._dispatchEvent('sourceChanged', ({ text, header, footer, actions }));
            }),
            utils_1.eventsHelper.addEventListener(this._object, debugController_1.DebugController.Events.Paused, ({ paused }) => {
                this._dispatchEvent('paused', ({ paused }));
            }),
            utils_1.eventsHelper.addEventListener(this._object, debugController_1.DebugController.Events.SetModeRequested, ({ mode }) => {
                this._dispatchEvent('setModeRequested', ({ mode }));
            }),
        ];
    }
    async initialize(params, progress) {
        this._object.initialize(params.codegenId, params.sdkLanguage);
    }
    async setReportStateChanged(params, progress) {
        this._object.setReportStateChanged(params.enabled);
    }
    async setRecorderMode(params, progress) {
        await this._object.setRecorderMode(progress, params);
    }
    async highlight(params, progress) {
        await this._object.highlight(progress, params);
    }
    async hideHighlight(params, progress) {
        await this._object.hideHighlight(progress);
    }
    async resume(params, progress) {
        await this._object.resume(progress);
    }
    async kill(params, progress) {
        this._object.kill();
    }
    _onDispose() {
        utils_1.eventsHelper.removeEventListeners(this._listeners);
        this._object.dispose();
    }
}
exports.DebugControllerDispatcher = DebugControllerDispatcher;
