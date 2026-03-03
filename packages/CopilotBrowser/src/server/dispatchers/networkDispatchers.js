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
exports.APIRequestContextDispatcher = exports.WebSocketDispatcher = exports.RouteDispatcher = exports.ResponseDispatcher = exports.RequestDispatcher = void 0;
const network_1 = require("../network");
const dispatcher_1 = require("./dispatcher");
const frameDispatcher_1 = require("./frameDispatcher");
const pageDispatcher_1 = require("./pageDispatcher");
const tracingDispatcher_1 = require("./tracingDispatcher");
class RequestDispatcher extends dispatcher_1.Dispatcher {
    _type_Request;
    _browserContextDispatcher;
    static from(scope, request) {
        const result = scope.connection.existingDispatcher(request);
        return result || new RequestDispatcher(scope, request);
    }
    static fromNullable(scope, request) {
        return request ? RequestDispatcher.from(scope, request) : undefined;
    }
    constructor(scope, request) {
        const postData = request.postDataBuffer();
        // Always try to attach request to the page, if not, frame.
        const frame = request.frame();
        const page = request.frame()?._page;
        const pageDispatcher = page ? scope.connection.existingDispatcher(page) : null;
        const frameDispatcher = frameDispatcher_1.FrameDispatcher.fromNullable(scope, frame);
        super(pageDispatcher || frameDispatcher || scope, request, 'Request', {
            frame: frameDispatcher,
            serviceWorker: pageDispatcher_1.WorkerDispatcher.fromNullable(scope, request.serviceWorker()),
            url: request.url(),
            resourceType: request.resourceType(),
            method: request.method(),
            postData: postData === null ? undefined : postData,
            headers: request.headers(),
            isNavigationRequest: request.isNavigationRequest(),
            redirectedFrom: RequestDispatcher.fromNullable(scope, request.redirectedFrom()),
        });
        this._type_Request = true;
        this._browserContextDispatcher = scope;
        // Push existing response to the client if it exists.
        ResponseDispatcher.fromNullable(scope, request._existingResponse());
    }
    async rawRequestHeaders(params, progress) {
        return { headers: await progress.race(this._object.rawRequestHeaders()) };
    }
    async response(params, progress) {
        return { response: ResponseDispatcher.fromNullable(this._browserContextDispatcher, await progress.race(this._object.response())) };
    }
}
exports.RequestDispatcher = RequestDispatcher;
class ResponseDispatcher extends dispatcher_1.Dispatcher {
    _type_Response = true;
    static from(scope, response) {
        const requestDispatcher = RequestDispatcher.from(scope, response.request());
        const result = scope.connection.existingDispatcher(response);
        return result || new ResponseDispatcher(requestDispatcher, response);
    }
    static fromNullable(scope, response) {
        return response ? ResponseDispatcher.from(scope, response) : undefined;
    }
    constructor(scope, response) {
        super(scope, response, 'Response', {
            // TODO: responses in popups can point to non-reported requests.
            request: scope,
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            timing: response.timing(),
            fromServiceWorker: response.fromServiceWorker(),
        });
    }
    async body(params, progress) {
        return { binary: await progress.race(this._object.body()) };
    }
    async securityDetails(params, progress) {
        return { value: await progress.race(this._object.securityDetails()) || undefined };
    }
    async serverAddr(params, progress) {
        return { value: await progress.race(this._object.serverAddr()) || undefined };
    }
    async rawResponseHeaders(params, progress) {
        return { headers: await progress.race(this._object.rawResponseHeaders()) };
    }
    async sizes(params, progress) {
        return { sizes: await progress.race(this._object.sizes()) };
    }
}
exports.ResponseDispatcher = ResponseDispatcher;
class RouteDispatcher extends dispatcher_1.Dispatcher {
    _type_Route = true;
    _handled = false;
    constructor(scope, route) {
        super(scope, route, 'Route', {
            // Context route can point to a non-reported request, so we send the request in the initializer.
            request: scope
        });
    }
    _checkNotHandled() {
        if (this._handled)
            throw new Error('Route is already handled!');
        this._handled = true;
    }
    async continue(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        this._checkNotHandled();
        await this._object.continue({
            url: params.url,
            method: params.method,
            headers: params.headers,
            postData: params.postData,
            isFallback: params.isFallback,
        });
    }
    async fulfill(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        this._checkNotHandled();
        await this._object.fulfill(params);
    }
    async abort(params, progress) {
        // Note: progress is ignored because this operation is not cancellable and should not block in the browser anyway.
        this._checkNotHandled();
        await this._object.abort(params.errorCode || 'failed');
    }
    async redirectNavigationRequest(params, progress) {
        this._checkNotHandled();
        this._object.redirectNavigationRequest(params.url);
    }
}
exports.RouteDispatcher = RouteDispatcher;
class WebSocketDispatcher extends dispatcher_1.Dispatcher {
    _type_EventTarget = true;
    _type_WebSocket = true;
    constructor(scope, webSocket) {
        super(scope, webSocket, 'WebSocket', {
            url: webSocket.url(),
        });
        this.addObjectListener(network_1.WebSocket.Events.FrameSent, (event) => this._dispatchEvent('frameSent', event));
        this.addObjectListener(network_1.WebSocket.Events.FrameReceived, (event) => this._dispatchEvent('frameReceived', event));
        this.addObjectListener(network_1.WebSocket.Events.SocketError, (error) => this._dispatchEvent('socketError', { error }));
        this.addObjectListener(network_1.WebSocket.Events.Close, () => this._dispatchEvent('close', {}));
    }
}
exports.WebSocketDispatcher = WebSocketDispatcher;
class APIRequestContextDispatcher extends dispatcher_1.Dispatcher {
    _type_APIRequestContext = true;
    static from(scope, request) {
        const result = scope.connection.existingDispatcher(request);
        return result || new APIRequestContextDispatcher(scope, request);
    }
    static fromNullable(scope, request) {
        return request ? APIRequestContextDispatcher.from(scope, request) : undefined;
    }
    constructor(parentScope, request) {
        // We will reparent these to the context below.
        const tracing = tracingDispatcher_1.TracingDispatcher.from(parentScope, request.tracing());
        super(parentScope, request, 'APIRequestContext', {
            tracing,
        });
        this.adopt(tracing);
    }
    async storageState(params, progress) {
        return await this._object.storageState(progress, params.indexedDB);
    }
    async dispose(params, progress) {
        progress.metadata.potentiallyClosesScope = true;
        await this._object.dispose(params);
        this._dispose();
    }
    async fetch(params, progress) {
        const fetchResponse = await this._object.fetch(progress, params);
        return {
            response: {
                url: fetchResponse.url,
                status: fetchResponse.status,
                statusText: fetchResponse.statusText,
                headers: fetchResponse.headers,
                fetchUid: fetchResponse.fetchUid
            }
        };
    }
    async fetchResponseBody(params, progress) {
        return { binary: this._object.fetchResponses.get(params.fetchUid) };
    }
    async fetchLog(params, progress) {
        const log = this._object.fetchLog.get(params.fetchUid) || [];
        return { log };
    }
    async disposeAPIResponse(params, progress) {
        this._object.disposeResponse(params.fetchUid);
    }
}
exports.APIRequestContextDispatcher = APIRequestContextDispatcher;
