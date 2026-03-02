"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
exports.WebSocketRouteDispatcher = void 0;
const page_1 = require("../page");
const dispatcher_1 = require("./dispatcher");
const pageDispatcher_1 = require("./pageDispatcher");
const rawWebSocketMockSource = __importStar(require("../../generated/webSocketMockSource"));
const instrumentation_1 = require("../instrumentation");
const urlMatch_1 = require("../../utils/isomorphic/urlMatch");
const eventsHelper_1 = require("../utils/eventsHelper");
class WebSocketRouteDispatcher extends dispatcher_1.Dispatcher {
    _type_WebSocketRoute = true;
    _id;
    _frame;
    static _idToDispatcher = new Map();
    constructor(scope, id, url, frame) {
        super(scope, new instrumentation_1.SdkObject(scope._object, 'webSocketRoute'), 'WebSocketRoute', { url });
        this._id = id;
        this._frame = frame;
        this._eventListeners.push(
        // When the frame navigates or detaches, there will be no more communication
        // from the mock websocket, so pretend like it was closed.
        eventsHelper_1.eventsHelper.addEventListener(frame._page, page_1.Page.Events.InternalFrameNavigatedToNewDocument, (frame) => {
            if (frame === this._frame)
                this._executionContextGone();
        }), eventsHelper_1.eventsHelper.addEventListener(frame._page, page_1.Page.Events.FrameDetached, (frame) => {
            if (frame === this._frame)
                this._executionContextGone();
        }), eventsHelper_1.eventsHelper.addEventListener(frame._page, page_1.Page.Events.Close, () => this._executionContextGone()), eventsHelper_1.eventsHelper.addEventListener(frame._page, page_1.Page.Events.Crash, () => this._executionContextGone()));
        WebSocketRouteDispatcher._idToDispatcher.set(this._id, this);
        scope._dispatchEvent('webSocketRoute', { webSocketRoute: this });
    }
    static async install(progress, connection, target) {
        const context = target instanceof page_1.Page ? target.browserContext : target;
        let data = context.getBindingClient(kBindingName);
        if (data && data.connection !== connection)
            throw new Error('Another client is already routing WebSockets');
        if (!data) {
            data = { counter: 0, connection, binding: null };
            data.binding = await context.exposeBinding(progress, kBindingName, false, (source, payload) => {
                if (payload.type === 'onCreate') {
                    const contextDispatcher = connection.existingDispatcher(context);
                    const pageDispatcher = contextDispatcher ? pageDispatcher_1.PageDispatcher.fromNullable(contextDispatcher, source.page) : undefined;
                    let scope;
                    if (pageDispatcher && matchesPattern(pageDispatcher, context._options.baseURL, payload.url))
                        scope = pageDispatcher;
                    else if (contextDispatcher && matchesPattern(contextDispatcher, context._options.baseURL, payload.url))
                        scope = contextDispatcher;
                    if (scope) {
                        new WebSocketRouteDispatcher(scope, payload.id, payload.url, source.frame);
                    }
                    else {
                        const request = { id: payload.id, type: 'passthrough' };
                        source.frame.evaluateExpression(`globalThis.__pwWebSocketDispatch(${JSON.stringify(request)})`).catch(() => { });
                    }
                    return;
                }
                const dispatcher = WebSocketRouteDispatcher._idToDispatcher.get(payload.id);
                if (payload.type === 'onMessageFromPage')
                    dispatcher?._dispatchEvent('messageFromPage', { message: payload.data.data, isBase64: payload.data.isBase64 });
                if (payload.type === 'onMessageFromServer')
                    dispatcher?._dispatchEvent('messageFromServer', { message: payload.data.data, isBase64: payload.data.isBase64 });
                if (payload.type === 'onClosePage')
                    dispatcher?._dispatchEvent('closePage', { code: payload.code, reason: payload.reason, wasClean: payload.wasClean });
                if (payload.type === 'onCloseServer')
                    dispatcher?._dispatchEvent('closeServer', { code: payload.code, reason: payload.reason, wasClean: payload.wasClean });
            }, data);
        }
        ++data.counter;
        return await target.addInitScript(progress, `
      (() => {
        const module = {};
        ${rawWebSocketMockSource.source}
        (module.exports.inject())(globalThis);
      })();
    `);
    }
    static async uninstall(connection, target, initScript) {
        const context = target instanceof page_1.Page ? target.browserContext : target;
        const data = context.getBindingClient(kBindingName);
        if (!data || data.connection !== connection)
            return;
        if (--data.counter <= 0)
            await context.removeExposedBindings([data.binding]);
        await target.removeInitScripts([initScript]);
    }
    async connect(params, progress) {
        await this._evaluateAPIRequest(progress, { id: this._id, type: 'connect' });
    }
    async ensureOpened(params, progress) {
        await this._evaluateAPIRequest(progress, { id: this._id, type: 'ensureOpened' });
    }
    async sendToPage(params, progress) {
        await this._evaluateAPIRequest(progress, { id: this._id, type: 'sendToPage', data: { data: params.message, isBase64: params.isBase64 } });
    }
    async sendToServer(params, progress) {
        await this._evaluateAPIRequest(progress, { id: this._id, type: 'sendToServer', data: { data: params.message, isBase64: params.isBase64 } });
    }
    async closePage(params, progress) {
        await this._evaluateAPIRequest(progress, { id: this._id, type: 'closePage', code: params.code, reason: params.reason, wasClean: params.wasClean });
    }
    async closeServer(params, progress) {
        await this._evaluateAPIRequest(progress, { id: this._id, type: 'closeServer', code: params.code, reason: params.reason, wasClean: params.wasClean });
    }
    async _evaluateAPIRequest(progress, request) {
        await progress.race(this._frame.evaluateExpression(`globalThis.__pwWebSocketDispatch(${JSON.stringify(request)})`).catch(() => { }));
    }
    _onDispose() {
        WebSocketRouteDispatcher._idToDispatcher.delete(this._id);
    }
    _executionContextGone() {
        // We could enter here after being disposed upon page closure:
        // - first from the recursive dispose inintiated by PageDispatcher;
        // - then from our own page.on('close') listener.
        if (!this._disposed) {
            this._dispatchEvent('closePage', { wasClean: true });
            this._dispatchEvent('closeServer', { wasClean: true });
        }
    }
}
exports.WebSocketRouteDispatcher = WebSocketRouteDispatcher;
function matchesPattern(dispatcher, baseURL, url) {
    for (const pattern of dispatcher._webSocketInterceptionPatterns || []) {
        if ((0, urlMatch_1.urlMatches)(baseURL, url, (0, urlMatch_1.deserializeURLMatch)(pattern), true))
            return true;
    }
    return false;
}
const kBindingName = '__pwWebSocketBinding';
