"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRServiceWorker = void 0;
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
const page_1 = require("../page");
const crExecutionContext_1 = require("./crExecutionContext");
const crNetworkManager_1 = require("./crNetworkManager");
const browserContext_1 = require("../browserContext");
const network = __importStar(require("../network"));
const console_1 = require("../console");
const crProtocolHelper_1 = require("./crProtocolHelper");
class CRServiceWorker extends page_1.Worker {
    browserContext;
    _networkManager;
    _session;
    constructor(browserContext, session, url) {
        super(browserContext, url);
        this._session = session;
        this.browserContext = browserContext;
        if (!process.env.copilotbrowser_DISABLE_SERVICE_WORKER_NETWORK)
            this._networkManager = new crNetworkManager_1.CRNetworkManager(null, this);
        session.once('Runtime.executionContextCreated', event => {
            this.createExecutionContext(new crExecutionContext_1.CRExecutionContext(session, event.context));
        });
        if (this.browserContext._browser.majorVersion() >= 143)
            session.on('Inspector.workerScriptLoaded', () => this.workerScriptLoaded());
        else
            this.workerScriptLoaded();
        if (this._networkManager && this._isNetworkInspectionEnabled()) {
            this.updateRequestInterception();
            this.updateExtraHTTPHeaders();
            this.updateHttpCredentials();
            this.updateOffline();
            this._networkManager.addSession(session, undefined, true /* isMain */).catch(() => { });
        }
        session.on('Runtime.consoleAPICalled', event => {
            if (!this.existingExecutionContext || process.env.copilotbrowser_DISABLE_SERVICE_WORKER_CONSOLE)
                return;
            const args = event.args.map(o => (0, crExecutionContext_1.createHandle)(this.existingExecutionContext, o));
            const message = new console_1.ConsoleMessage(null, this, event.type, undefined, args, (0, crProtocolHelper_1.toConsoleMessageLocation)(event.stackTrace), event.timestamp);
            this.browserContext.emit(browserContext_1.BrowserContext.Events.Console, message);
        });
        session.send('Runtime.enable', {}).catch(e => { });
        session.send('Runtime.runIfWaitingForDebugger').catch(e => { });
        session.on('Inspector.targetReloadedAfterCrash', () => {
            // Resume service worker after restart.
            session._sendMayFail('Runtime.runIfWaitingForDebugger', {});
        });
    }
    didClose() {
        this._networkManager?.removeSession(this._session);
        this._session.dispose();
        super.didClose();
    }
    async updateOffline() {
        if (!this._isNetworkInspectionEnabled())
            return;
        await this._networkManager?.setOffline(!!this.browserContext._options.offline).catch(() => { });
    }
    async updateHttpCredentials() {
        if (!this._isNetworkInspectionEnabled())
            return;
        await this._networkManager?.authenticate(this.browserContext._options.httpCredentials || null).catch(() => { });
    }
    async updateExtraHTTPHeaders() {
        if (!this._isNetworkInspectionEnabled())
            return;
        await this._networkManager?.setExtraHTTPHeaders(this.browserContext._options.extraHTTPHeaders || []).catch(() => { });
    }
    async updateRequestInterception() {
        if (!this._isNetworkInspectionEnabled())
            return;
        await this._networkManager?.setRequestInterception(this.needsRequestInterception()).catch(() => { });
    }
    needsRequestInterception() {
        return this._isNetworkInspectionEnabled() && this.browserContext.requestInterceptors.length > 0;
    }
    reportRequestFinished(request, response) {
        this.browserContext.emit(browserContext_1.BrowserContext.Events.RequestFinished, { request, response });
    }
    requestFailed(request, _canceled) {
        this.browserContext.emit(browserContext_1.BrowserContext.Events.RequestFailed, request);
    }
    requestReceivedResponse(response) {
        this.browserContext.emit(browserContext_1.BrowserContext.Events.Response, response);
    }
    requestStarted(request, route) {
        this.browserContext.emit(browserContext_1.BrowserContext.Events.Request, request);
        if (route)
            new network.Route(request, route).handle(this.browserContext.requestInterceptors);
    }
    _isNetworkInspectionEnabled() {
        return this.browserContext._options.serviceWorkers !== 'block';
    }
}
exports.CRServiceWorker = CRServiceWorker;
