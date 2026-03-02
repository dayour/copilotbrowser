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
exports.RawHeaders = exports.RouteHandler = exports.WebSocket = exports.Response = exports.WebSocketRouteHandler = exports.WebSocketRoute = exports.Route = exports.Request = void 0;
exports.validateHeaders = validateHeaders;
const channelOwner_1 = require("./channelOwner");
const errors_1 = require("./errors");
const events_1 = require("./events");
const fetch_1 = require("./fetch");
const frame_1 = require("./frame");
const waiter_1 = require("./waiter");
const worker_1 = require("./worker");
const assert_1 = require("../utils/isomorphic/assert");
const headers_1 = require("../utils/isomorphic/headers");
const urlMatch_1 = require("../utils/isomorphic/urlMatch");
const manualPromise_1 = require("../utils/isomorphic/manualPromise");
const multimap_1 = require("../utils/isomorphic/multimap");
const rtti_1 = require("../utils/isomorphic/rtti");
const stackTrace_1 = require("../utils/isomorphic/stackTrace");
const mimeType_1 = require("../utils/isomorphic/mimeType");
class Request extends channelOwner_1.ChannelOwner {
    _redirectedFrom = null;
    _redirectedTo = null;
    _failureText = null;
    _response = null;
    _provisionalHeaders;
    _actualHeadersPromise;
    _timing;
    _fallbackOverrides = {};
    static from(request) {
        return request._object;
    }
    static fromNullable(request) {
        return request ? Request.from(request) : null;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._redirectedFrom = Request.fromNullable(initializer.redirectedFrom);
        if (this._redirectedFrom)
            this._redirectedFrom._redirectedTo = this;
        this._provisionalHeaders = new RawHeaders(initializer.headers);
        this._timing = {
            startTime: 0,
            domainLookupStart: -1,
            domainLookupEnd: -1,
            connectStart: -1,
            secureConnectionStart: -1,
            connectEnd: -1,
            requestStart: -1,
            responseStart: -1,
            responseEnd: -1,
        };
    }
    url() {
        return this._fallbackOverrides.url || this._initializer.url;
    }
    resourceType() {
        return this._initializer.resourceType;
    }
    method() {
        return this._fallbackOverrides.method || this._initializer.method;
    }
    postData() {
        return (this._fallbackOverrides.postDataBuffer || this._initializer.postData)?.toString('utf-8') || null;
    }
    postDataBuffer() {
        return this._fallbackOverrides.postDataBuffer || this._initializer.postData || null;
    }
    postDataJSON() {
        const postData = this.postData();
        if (!postData)
            return null;
        const contentType = this.headers()['content-type'];
        if (contentType?.includes('application/x-www-form-urlencoded')) {
            const entries = {};
            const parsed = new URLSearchParams(postData);
            for (const [k, v] of parsed.entries())
                entries[k] = v;
            return entries;
        }
        try {
            return JSON.parse(postData);
        }
        catch (e) {
            throw new Error('POST data is not a valid JSON object: ' + postData);
        }
    }
    /**
     * @deprecated
     */
    headers() {
        if (this._fallbackOverrides.headers)
            return RawHeaders._fromHeadersObjectLossy(this._fallbackOverrides.headers).headers();
        return this._provisionalHeaders.headers();
    }
    async _actualHeaders() {
        if (this._fallbackOverrides.headers)
            return RawHeaders._fromHeadersObjectLossy(this._fallbackOverrides.headers);
        if (!this._actualHeadersPromise) {
            this._actualHeadersPromise = this._wrapApiCall(async () => {
                return new RawHeaders((await this._channel.rawRequestHeaders()).headers);
            }, { internal: true });
        }
        return await this._actualHeadersPromise;
    }
    async allHeaders() {
        return (await this._actualHeaders()).headers();
    }
    async headersArray() {
        return (await this._actualHeaders()).headersArray();
    }
    async headerValue(name) {
        return (await this._actualHeaders()).get(name);
    }
    async response() {
        return Response.fromNullable((await this._channel.response()).response);
    }
    async _internalResponse() {
        return Response.fromNullable((await this._channel.response()).response);
    }
    existingResponse() {
        return this._response;
    }
    frame() {
        if (!this._initializer.frame) {
            (0, assert_1.assert)(this.serviceWorker());
            throw new Error('Service Worker requests do not have an associated frame.');
        }
        const frame = frame_1.Frame.from(this._initializer.frame);
        if (!frame._page) {
            throw new Error([
                'Frame for this navigation request is not available, because the request',
                'was issued before the frame is created. You can check whether the request',
                'is a navigation request by calling isNavigationRequest() method.',
            ].join('\n'));
        }
        return frame;
    }
    _safePage() {
        return frame_1.Frame.fromNullable(this._initializer.frame)?._page || null;
    }
    serviceWorker() {
        return this._initializer.serviceWorker ? worker_1.Worker.from(this._initializer.serviceWorker) : null;
    }
    isNavigationRequest() {
        return this._initializer.isNavigationRequest;
    }
    redirectedFrom() {
        return this._redirectedFrom;
    }
    redirectedTo() {
        return this._redirectedTo;
    }
    failure() {
        if (this._failureText === null)
            return null;
        return {
            errorText: this._failureText
        };
    }
    timing() {
        return this._timing;
    }
    async sizes() {
        const response = await this.response();
        if (!response)
            throw new Error('Unable to fetch sizes for failed request');
        return (await response._channel.sizes()).sizes;
    }
    _setResponseEndTiming(responseEndTiming) {
        this._timing.responseEnd = responseEndTiming;
        if (this._timing.responseStart === -1)
            this._timing.responseStart = responseEndTiming;
    }
    _finalRequest() {
        return this._redirectedTo ? this._redirectedTo._finalRequest() : this;
    }
    _applyFallbackOverrides(overrides) {
        if (overrides.url)
            this._fallbackOverrides.url = overrides.url;
        if (overrides.method)
            this._fallbackOverrides.method = overrides.method;
        if (overrides.headers)
            this._fallbackOverrides.headers = overrides.headers;
        if ((0, rtti_1.isString)(overrides.postData))
            this._fallbackOverrides.postDataBuffer = Buffer.from(overrides.postData, 'utf-8');
        else if (overrides.postData instanceof Buffer)
            this._fallbackOverrides.postDataBuffer = overrides.postData;
        else if (overrides.postData)
            this._fallbackOverrides.postDataBuffer = Buffer.from(JSON.stringify(overrides.postData), 'utf-8');
    }
    _fallbackOverridesForContinue() {
        return this._fallbackOverrides;
    }
    _targetClosedScope() {
        return this.serviceWorker()?._closedScope || this._safePage()?._closedOrCrashedScope || new manualPromise_1.LongStandingScope();
    }
}
exports.Request = Request;
class Route extends channelOwner_1.ChannelOwner {
    _handlingPromise = null;
    _context;
    _didThrow = false;
    static from(route) {
        return route._object;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
    }
    request() {
        return Request.from(this._initializer.request);
    }
    async _raceWithTargetClose(promise) {
        // When page closes or crashes, we catch any potential rejects from this Route.
        // Note that page could be missing when routing popup's initial request that
        // does not have a Page initialized just yet.
        return await this.request()._targetClosedScope().safeRace(promise);
    }
    async _startHandling() {
        this._handlingPromise = new manualPromise_1.ManualPromise();
        return await this._handlingPromise;
    }
    async fallback(options = {}) {
        this._checkNotHandled();
        this.request()._applyFallbackOverrides(options);
        this._reportHandled(false);
    }
    async abort(errorCode) {
        await this._handleRoute(async () => {
            await this._raceWithTargetClose(this._channel.abort({ errorCode }));
        });
    }
    async _redirectNavigationRequest(url) {
        await this._handleRoute(async () => {
            await this._raceWithTargetClose(this._channel.redirectNavigationRequest({ url }));
        });
    }
    async fetch(options = {}) {
        return await this._wrapApiCall(async () => {
            return await this._context.request._innerFetch({ request: this.request(), data: options.postData, ...options });
        });
    }
    async fulfill(options = {}) {
        await this._handleRoute(async () => {
            await this._innerFulfill(options);
        });
    }
    async _handleRoute(callback) {
        this._checkNotHandled();
        try {
            await callback();
            this._reportHandled(true);
        }
        catch (e) {
            this._didThrow = true;
            throw e;
        }
    }
    async _innerFulfill(options = {}) {
        let fetchResponseUid;
        let { status: statusOption, headers: headersOption, body } = options;
        if (options.json !== undefined) {
            (0, assert_1.assert)(options.body === undefined, 'Can specify either body or json parameters');
            body = JSON.stringify(options.json);
        }
        if (options.response instanceof fetch_1.APIResponse) {
            statusOption ??= options.response.status();
            headersOption ??= options.response.headers();
            if (body === undefined && options.path === undefined) {
                if (options.response._request._connection === this._connection)
                    fetchResponseUid = options.response._fetchUid();
                else
                    body = await options.response.body();
            }
        }
        let isBase64 = false;
        let length = 0;
        if (options.path) {
            const buffer = await this._platform.fs().promises.readFile(options.path);
            body = buffer.toString('base64');
            isBase64 = true;
            length = buffer.length;
        }
        else if ((0, rtti_1.isString)(body)) {
            isBase64 = false;
            length = Buffer.byteLength(body);
        }
        else if (body) {
            length = body.length;
            body = body.toString('base64');
            isBase64 = true;
        }
        const headers = {};
        for (const header of Object.keys(headersOption || {}))
            headers[header.toLowerCase()] = String(headersOption[header]);
        if (options.contentType)
            headers['content-type'] = String(options.contentType);
        else if (options.json)
            headers['content-type'] = 'application/json';
        else if (options.path)
            headers['content-type'] = (0, mimeType_1.getMimeTypeForPath)(options.path) || 'application/octet-stream';
        if (length && !('content-length' in headers))
            headers['content-length'] = String(length);
        await this._raceWithTargetClose(this._channel.fulfill({
            status: statusOption || 200,
            headers: (0, headers_1.headersObjectToArray)(headers),
            body,
            isBase64,
            fetchResponseUid
        }));
    }
    async continue(options = {}) {
        await this._handleRoute(async () => {
            this.request()._applyFallbackOverrides(options);
            await this._innerContinue(false /* isFallback */);
        });
    }
    _checkNotHandled() {
        if (!this._handlingPromise)
            throw new Error('Route is already handled!');
    }
    _reportHandled(done) {
        const chain = this._handlingPromise;
        this._handlingPromise = null;
        chain.resolve(done);
    }
    async _innerContinue(isFallback) {
        const options = this.request()._fallbackOverridesForContinue();
        return await this._raceWithTargetClose(this._channel.continue({
            url: options.url,
            method: options.method,
            headers: options.headers ? (0, headers_1.headersObjectToArray)(options.headers) : undefined,
            postData: options.postDataBuffer,
            isFallback,
        }));
    }
}
exports.Route = Route;
class WebSocketRoute extends channelOwner_1.ChannelOwner {
    static from(route) {
        return route._object;
    }
    _onPageMessage;
    _onPageClose;
    _onServerMessage;
    _onServerClose;
    _server;
    _connected = false;
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._server = {
            onMessage: (handler) => {
                this._onServerMessage = handler;
            },
            onClose: (handler) => {
                this._onServerClose = handler;
            },
            connectToServer: () => {
                throw new Error(`connectToServer must be called on the page-side WebSocketRoute`);
            },
            url: () => {
                return this._initializer.url;
            },
            close: async (options = {}) => {
                await this._channel.closeServer({ ...options, wasClean: true }).catch(() => { });
            },
            send: (message) => {
                if ((0, rtti_1.isString)(message))
                    this._channel.sendToServer({ message, isBase64: false }).catch(() => { });
                else
                    this._channel.sendToServer({ message: message.toString('base64'), isBase64: true }).catch(() => { });
            },
            async [Symbol.asyncDispose]() {
                await this.close();
            },
        };
        this._channel.on('messageFromPage', ({ message, isBase64 }) => {
            if (this._onPageMessage)
                this._onPageMessage(isBase64 ? Buffer.from(message, 'base64') : message);
            else if (this._connected)
                this._channel.sendToServer({ message, isBase64 }).catch(() => { });
        });
        this._channel.on('messageFromServer', ({ message, isBase64 }) => {
            if (this._onServerMessage)
                this._onServerMessage(isBase64 ? Buffer.from(message, 'base64') : message);
            else
                this._channel.sendToPage({ message, isBase64 }).catch(() => { });
        });
        this._channel.on('closePage', ({ code, reason, wasClean }) => {
            if (this._onPageClose)
                this._onPageClose(code, reason);
            else
                this._channel.closeServer({ code, reason, wasClean }).catch(() => { });
        });
        this._channel.on('closeServer', ({ code, reason, wasClean }) => {
            if (this._onServerClose)
                this._onServerClose(code, reason);
            else
                this._channel.closePage({ code, reason, wasClean }).catch(() => { });
        });
    }
    url() {
        return this._initializer.url;
    }
    async close(options = {}) {
        await this._channel.closePage({ ...options, wasClean: true }).catch(() => { });
    }
    connectToServer() {
        if (this._connected)
            throw new Error('Already connected to the server');
        this._connected = true;
        this._channel.connect().catch(() => { });
        return this._server;
    }
    send(message) {
        if ((0, rtti_1.isString)(message))
            this._channel.sendToPage({ message, isBase64: false }).catch(() => { });
        else
            this._channel.sendToPage({ message: message.toString('base64'), isBase64: true }).catch(() => { });
    }
    onMessage(handler) {
        this._onPageMessage = handler;
    }
    onClose(handler) {
        this._onPageClose = handler;
    }
    async [Symbol.asyncDispose]() {
        await this.close();
    }
    async _afterHandle() {
        if (this._connected)
            return;
        // Ensure that websocket is "open" and can send messages without an actual server connection.
        // If this happens after the page has been closed, ignore the error.
        await this._channel.ensureOpened().catch(() => { });
    }
}
exports.WebSocketRoute = WebSocketRoute;
class WebSocketRouteHandler {
    _baseURL;
    url;
    handler;
    constructor(baseURL, url, handler) {
        this._baseURL = baseURL;
        this.url = url;
        this.handler = handler;
    }
    static prepareInterceptionPatterns(handlers) {
        const patterns = [];
        let all = false;
        for (const handler of handlers) {
            const serialized = (0, urlMatch_1.serializeURLMatch)(handler.url);
            if (serialized)
                patterns.push(serialized);
            else
                all = true;
        }
        if (all)
            return [{ glob: '**/*' }];
        return patterns;
    }
    matches(wsURL) {
        return (0, urlMatch_1.urlMatches)(this._baseURL, wsURL, this.url, true);
    }
    async handle(webSocketRoute) {
        const handler = this.handler;
        await handler(webSocketRoute);
        await webSocketRoute._afterHandle();
    }
}
exports.WebSocketRouteHandler = WebSocketRouteHandler;
class Response extends channelOwner_1.ChannelOwner {
    _provisionalHeaders;
    _actualHeadersPromise;
    _request;
    _finishedPromise = new manualPromise_1.ManualPromise();
    static from(response) {
        return response._object;
    }
    static fromNullable(response) {
        return response ? Response.from(response) : null;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._provisionalHeaders = new RawHeaders(initializer.headers);
        this._request = Request.from(this._initializer.request);
        this._request._response = this;
        Object.assign(this._request._timing, this._initializer.timing);
    }
    url() {
        return this._initializer.url;
    }
    ok() {
        // Status 0 is for file:// URLs
        return this._initializer.status === 0 || (this._initializer.status >= 200 && this._initializer.status <= 299);
    }
    status() {
        return this._initializer.status;
    }
    statusText() {
        return this._initializer.statusText;
    }
    fromServiceWorker() {
        return this._initializer.fromServiceWorker;
    }
    /**
     * @deprecated
     */
    headers() {
        return this._provisionalHeaders.headers();
    }
    async _actualHeaders() {
        if (!this._actualHeadersPromise) {
            this._actualHeadersPromise = (async () => {
                return new RawHeaders((await this._channel.rawResponseHeaders()).headers);
            })();
        }
        return await this._actualHeadersPromise;
    }
    async allHeaders() {
        return (await this._actualHeaders()).headers();
    }
    async headersArray() {
        return (await this._actualHeaders()).headersArray().slice();
    }
    async headerValue(name) {
        return (await this._actualHeaders()).get(name);
    }
    async headerValues(name) {
        return (await this._actualHeaders()).getAll(name);
    }
    async finished() {
        return await this.request()._targetClosedScope().race(this._finishedPromise);
    }
    async body() {
        return (await this._channel.body()).binary;
    }
    async text() {
        const content = await this.body();
        return content.toString('utf8');
    }
    async json() {
        const content = await this.text();
        return JSON.parse(content);
    }
    request() {
        return this._request;
    }
    frame() {
        return this._request.frame();
    }
    async serverAddr() {
        return (await this._channel.serverAddr()).value || null;
    }
    async securityDetails() {
        return (await this._channel.securityDetails()).value || null;
    }
}
exports.Response = Response;
class WebSocket extends channelOwner_1.ChannelOwner {
    _page;
    _isClosed;
    static from(webSocket) {
        return webSocket._object;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._isClosed = false;
        this._page = parent;
        this._channel.on('frameSent', event => {
            if (event.opcode === 1)
                this.emit(events_1.Events.WebSocket.FrameSent, { payload: event.data });
            else if (event.opcode === 2)
                this.emit(events_1.Events.WebSocket.FrameSent, { payload: Buffer.from(event.data, 'base64') });
        });
        this._channel.on('frameReceived', event => {
            if (event.opcode === 1)
                this.emit(events_1.Events.WebSocket.FrameReceived, { payload: event.data });
            else if (event.opcode === 2)
                this.emit(events_1.Events.WebSocket.FrameReceived, { payload: Buffer.from(event.data, 'base64') });
        });
        this._channel.on('socketError', ({ error }) => this.emit(events_1.Events.WebSocket.Error, error));
        this._channel.on('close', () => {
            this._isClosed = true;
            this.emit(events_1.Events.WebSocket.Close, this);
        });
    }
    url() {
        return this._initializer.url;
    }
    isClosed() {
        return this._isClosed;
    }
    async waitForEvent(event, optionsOrPredicate = {}) {
        return await this._wrapApiCall(async () => {
            const timeout = this._page._timeoutSettings.timeout(typeof optionsOrPredicate === 'function' ? {} : optionsOrPredicate);
            const predicate = typeof optionsOrPredicate === 'function' ? optionsOrPredicate : optionsOrPredicate.predicate;
            const waiter = waiter_1.Waiter.createForEvent(this, event);
            waiter.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded while waiting for event "${event}"`);
            if (event !== events_1.Events.WebSocket.Error)
                waiter.rejectOnEvent(this, events_1.Events.WebSocket.Error, new Error('Socket error'));
            if (event !== events_1.Events.WebSocket.Close)
                waiter.rejectOnEvent(this, events_1.Events.WebSocket.Close, new Error('Socket closed'));
            waiter.rejectOnEvent(this._page, events_1.Events.Page.Close, () => this._page._closeErrorWithReason());
            const result = await waiter.waitForEvent(this, event, predicate);
            waiter.dispose();
            return result;
        });
    }
}
exports.WebSocket = WebSocket;
function validateHeaders(headers) {
    for (const key of Object.keys(headers)) {
        const value = headers[key];
        if (!Object.is(value, undefined) && !(0, rtti_1.isString)(value))
            throw new Error(`Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
    }
}
class RouteHandler {
    handledCount = 0;
    _baseURL;
    _times;
    url;
    handler;
    _ignoreException = false;
    _activeInvocations = new Set();
    _savedZone;
    constructor(platform, baseURL, url, handler, times = Number.MAX_SAFE_INTEGER) {
        this._baseURL = baseURL;
        this._times = times;
        this.url = url;
        this.handler = handler;
        this._savedZone = platform.zones.current().pop();
    }
    static prepareInterceptionPatterns(handlers) {
        const patterns = [];
        let all = false;
        for (const handler of handlers) {
            const serialized = (0, urlMatch_1.serializeURLMatch)(handler.url);
            if (serialized)
                patterns.push(serialized);
            else
                all = true;
        }
        if (all)
            return [{ glob: '**/*' }];
        return patterns;
    }
    matches(requestURL) {
        return (0, urlMatch_1.urlMatches)(this._baseURL, requestURL, this.url);
    }
    async handle(route) {
        return await this._savedZone.run(async () => this._handleImpl(route));
    }
    async _handleImpl(route) {
        const handlerInvocation = { complete: new manualPromise_1.ManualPromise(), route };
        this._activeInvocations.add(handlerInvocation);
        try {
            return await this._handleInternal(route);
        }
        catch (e) {
            // If the handler was stopped (without waiting for completion), we ignore all exceptions.
            if (this._ignoreException)
                return false;
            if ((0, errors_1.isTargetClosedError)(e)) {
                // We are failing in the handler because the target close closed.
                // Give user a hint!
                (0, stackTrace_1.rewriteErrorMessage)(e, `"${e.message}" while running route callback.\nConsider awaiting \`await page.unrouteAll({ behavior: 'ignoreErrors' })\`\nbefore the end of the test to ignore remaining routes in flight.`);
            }
            throw e;
        }
        finally {
            handlerInvocation.complete.resolve();
            this._activeInvocations.delete(handlerInvocation);
        }
    }
    async stop(behavior) {
        // When a handler is manually unrouted or its page/context is closed we either
        // - wait for the current handler invocations to finish
        // - or do not wait, if the user opted out of it, but swallow all exceptions
        //   that happen after the unroute/close.
        if (behavior === 'ignoreErrors') {
            this._ignoreException = true;
        }
        else {
            const promises = [];
            for (const activation of this._activeInvocations) {
                if (!activation.route._didThrow)
                    promises.push(activation.complete);
            }
            await Promise.all(promises);
        }
    }
    async _handleInternal(route) {
        ++this.handledCount;
        const handledPromise = route._startHandling();
        // Extract handler into a variable to avoid [RouteHandler.handler] in the stack.
        const handler = this.handler;
        const [handled] = await Promise.all([
            handledPromise,
            handler(route, route.request()),
        ]);
        return handled;
    }
    willExpire() {
        return this.handledCount + 1 >= this._times;
    }
}
exports.RouteHandler = RouteHandler;
class RawHeaders {
    _headersArray;
    _headersMap = new multimap_1.MultiMap();
    static _fromHeadersObjectLossy(headers) {
        const headersArray = Object.entries(headers).map(([name, value]) => ({
            name, value
        })).filter(header => header.value !== undefined);
        return new RawHeaders(headersArray);
    }
    constructor(headers) {
        this._headersArray = headers;
        for (const header of headers)
            this._headersMap.set(header.name.toLowerCase(), header.value);
    }
    get(name) {
        const values = this.getAll(name);
        if (!values || !values.length)
            return null;
        return values.join(name.toLowerCase() === 'set-cookie' ? '\n' : ', ');
    }
    getAll(name) {
        return [...this._headersMap.get(name.toLowerCase())];
    }
    headers() {
        const result = {};
        for (const name of this._headersMap.keys())
            result[name] = this.get(name);
        return result;
    }
    headersArray() {
        return this._headersArray;
    }
}
exports.RawHeaders = RawHeaders;
