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
exports.BidiNetworkManager = void 0;
exports.bidiBytesValueToString = bidiBytesValueToString;
const eventsHelper_1 = require("../utils/eventsHelper");
const cookieStore_1 = require("../cookieStore");
const network = __importStar(require("../network"));
const REQUEST_BODY_HEADERS = new Set(['content-encoding', 'content-language', 'content-location', 'content-type']);
class BidiNetworkManager {
    _session;
    _requests;
    _page;
    _eventListeners;
    _userRequestInterceptionEnabled = false;
    _protocolRequestInterceptionEnabled = false;
    _credentials;
    _attemptedAuthentications = new Set();
    _intercepId;
    constructor(bidiSession, page) {
        this._session = bidiSession;
        this._requests = new Map();
        this._page = page;
        this._eventListeners = [
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'network.beforeRequestSent', this._onBeforeRequestSent.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'network.responseStarted', this._onResponseStarted.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'network.responseCompleted', this._onResponseCompleted.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'network.fetchError', this._onFetchError.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(bidiSession, 'network.authRequired', this._onAuthRequired.bind(this)),
        ];
    }
    dispose() {
        eventsHelper_1.eventsHelper.removeEventListeners(this._eventListeners);
    }
    _onBeforeRequestSent(param) {
        if (param.request.url.startsWith('data:'))
            return;
        const redirectedFrom = param.redirectCount ? (this._requests.get(param.request.request) || null) : null;
        const frame = redirectedFrom ? redirectedFrom.request.frame() : (param.context ? this._page.frameManager.frame(param.context) : null);
        if (!frame)
            return;
        if (redirectedFrom)
            this._deleteRequest(redirectedFrom._id);
        // handle CORS preflight requests
        if (param.request.method === 'OPTIONS') {
            // TODO: we should detect preflight requests by looking at param.initiator.type, but the Bidi spec for
            // the initiator type is incomplete and browser implementations are inconsistent, so we check for an
            // Access-Control-Request-Method header instead. See https://github.com/w3c/webdriver-bidi/issues/698.
            const requestHeaders = Object.fromEntries(param.request.headers.map(h => [h.name.toLowerCase(), bidiBytesValueToString(h.value)]));
            if (param.initiator?.type === 'preflight' || requestHeaders['access-control-request-method']) {
                if (param.intercepts) {
                    // If interception is enabled, we accept all CORS options, assuming that this was intended when setting the route.
                    const responseHeaders = [
                        { name: 'Access-Control-Allow-Origin', value: requestHeaders['origin'] || '*' },
                        { name: 'Access-Control-Allow-Methods', value: requestHeaders['access-control-request-method'] },
                        { name: 'Access-Control-Allow-Credentials', value: 'true' }
                    ];
                    if (requestHeaders['access-control-request-headers'])
                        responseHeaders.push({ name: 'Access-Control-Allow-Headers', value: requestHeaders['access-control-request-headers'] });
                    this._session.sendMayFail('network.provideResponse', {
                        request: param.request.request,
                        statusCode: 204,
                        headers: toBidiHeaders(responseHeaders),
                    });
                }
                return;
            }
        }
        let route;
        let headersOverride;
        if (param.intercepts) {
            // We do not support intercepting redirects.
            if (redirectedFrom) {
                let params = {};
                if (redirectedFrom._originalRequestRoute?._alreadyContinuedHeaders) {
                    const originalHeaders = fromBidiHeaders(param.request.headers);
                    headersOverride = network.applyHeadersOverrides(originalHeaders, redirectedFrom._originalRequestRoute._alreadyContinuedHeaders);
                    // If the redirect turned a POST into a GET request, remove the request body headers,
                    // corresponding to step 12 of https://fetch.spec.whatwg.org/#http-redirect-fetch.
                    if (redirectedFrom.request.method() === 'POST' && param.request.method === 'GET')
                        headersOverride = headersOverride.filter(({ name }) => !REQUEST_BODY_HEADERS.has(name.toLowerCase()));
                    params = toBidiRequestHeaders(headersOverride);
                }
                this._session.sendMayFail('network.continueRequest', {
                    request: param.request.request,
                    ...params,
                });
            }
            else {
                route = new BidiRouteImpl(this._session, param.request.request);
            }
        }
        const request = new BidiRequest(frame, redirectedFrom, param, route, headersOverride);
        this._requests.set(request._id, request);
        this._page.frameManager.requestStarted(request.request, route);
    }
    _onResponseStarted(params) {
        const request = this._requests.get(params.request.request);
        if (!request)
            return;
        const getResponseBody = async () => {
            const { bytes } = await this._session.send('network.getData', { request: params.request.request, dataType: "response" /* bidi.Network.DataType.Response */ });
            const encoding = bytes.type === 'base64' ? 'base64' : 'utf8';
            return Buffer.from(bytes.value, encoding);
        };
        const timings = params.request.timings;
        const startTime = timings.requestTime;
        function relativeToStart(time) {
            if (!time)
                return -1;
            return (time - startTime);
        }
        const timing = {
            startTime: startTime,
            requestStart: relativeToStart(timings.requestStart),
            responseStart: relativeToStart(timings.responseStart),
            domainLookupStart: relativeToStart(timings.dnsStart),
            domainLookupEnd: relativeToStart(timings.dnsEnd),
            connectStart: relativeToStart(timings.connectStart),
            secureConnectionStart: relativeToStart(timings.tlsStart),
            connectEnd: relativeToStart(timings.connectEnd),
        };
        const response = new network.Response(request.request, params.response.status, params.response.statusText, fromBidiHeaders(params.response.headers), timing, getResponseBody, false);
        response._serverAddrFinished();
        response._securityDetailsFinished();
        // "raw" headers are the same as "provisional" headers in Bidi.
        response.setRawResponseHeaders(null);
        response.setResponseHeadersSize(params.response.headersSize);
        this._page.frameManager.requestReceivedResponse(response);
    }
    _onResponseCompleted(params) {
        const request = this._requests.get(params.request.request);
        if (!request)
            return;
        const response = request.request._existingResponse();
        // TODO: body size is the encoded size
        response.setTransferSize(params.response.bodySize);
        response.setEncodedBodySize(params.response.bodySize);
        // Keep redirected requests in the map for future reference as redirectedFrom.
        const isRedirected = response.status() >= 300 && response.status() <= 399;
        const responseEndTime = params.request.timings.responseEnd - response.timing().startTime;
        if (isRedirected) {
            response._requestFinished(responseEndTime);
        }
        else {
            this._deleteRequest(request._id);
            response._requestFinished(responseEndTime);
        }
        response._setHttpVersion(params.response.protocol);
        this._page.frameManager.reportRequestFinished(request.request, response);
    }
    _onFetchError(params) {
        const request = this._requests.get(params.request.request);
        if (!request)
            return;
        this._deleteRequest(request._id);
        const response = request.request._existingResponse();
        if (response) {
            response.setTransferSize(null);
            response.setEncodedBodySize(null);
            response._requestFinished(-1);
        }
        request.request._setFailureText(params.errorText);
        // TODO: support canceled flag
        this._page.frameManager.requestFailed(request.request, params.errorText === 'NS_BINDING_ABORTED');
    }
    _onAuthRequired(params) {
        const isBasic = params.response.authChallenges?.some(challenge => challenge.scheme.startsWith('Basic'));
        const credentials = this._page.browserContext._options.httpCredentials;
        if (isBasic && credentials && (!credentials.origin || (new URL(params.request.url).origin).toLowerCase() === credentials.origin.toLowerCase())) {
            if (this._attemptedAuthentications.has(params.request.request)) {
                this._session.sendMayFail('network.continueWithAuth', {
                    request: params.request.request,
                    action: 'cancel',
                });
            }
            else {
                this._attemptedAuthentications.add(params.request.request);
                this._session.sendMayFail('network.continueWithAuth', {
                    request: params.request.request,
                    action: 'provideCredentials',
                    credentials: {
                        type: 'password',
                        username: credentials.username,
                        password: credentials.password,
                    }
                });
            }
        }
        else {
            this._session.sendMayFail('network.continueWithAuth', {
                request: params.request.request,
                action: 'cancel',
            });
        }
    }
    _deleteRequest(requestId) {
        this._requests.delete(requestId);
        this._attemptedAuthentications.delete(requestId);
    }
    async setRequestInterception(value) {
        this._userRequestInterceptionEnabled = value;
        await this._updateProtocolRequestInterception();
    }
    async setCredentials(credentials) {
        this._credentials = credentials;
        await this._updateProtocolRequestInterception();
    }
    async _updateProtocolRequestInterception(initial) {
        const enabled = this._userRequestInterceptionEnabled || !!this._credentials;
        if (enabled === this._protocolRequestInterceptionEnabled)
            return;
        this._protocolRequestInterceptionEnabled = enabled;
        if (initial && !enabled)
            return;
        const cachePromise = this._session.send('network.setCacheBehavior', { cacheBehavior: enabled ? 'bypass' : 'default' });
        let interceptPromise = Promise.resolve(undefined);
        if (enabled) {
            interceptPromise = this._session.send('network.addIntercept', {
                phases: ["authRequired" /* bidi.Network.InterceptPhase.AuthRequired */, "beforeRequestSent" /* bidi.Network.InterceptPhase.BeforeRequestSent */],
                urlPatterns: [{ type: 'pattern' }],
                // urlPatterns: [{ type: 'string', pattern: '*' }],
            }).then(r => {
                this._intercepId = r.intercept;
            });
        }
        else if (this._intercepId) {
            interceptPromise = this._session.send('network.removeIntercept', { intercept: this._intercepId });
            this._intercepId = undefined;
        }
        await Promise.all([cachePromise, interceptPromise]);
    }
}
exports.BidiNetworkManager = BidiNetworkManager;
class BidiRequest {
    request;
    _id;
    _redirectedTo;
    // Only first request in the chain can be intercepted, so this will
    // store the first and only Route in the chain (if any).
    _originalRequestRoute;
    constructor(frame, redirectedFrom, payload, route, headersOverride) {
        this._id = payload.request.request;
        if (redirectedFrom)
            redirectedFrom._redirectedTo = this;
        // TODO: missing in the spec?
        const postDataBuffer = null;
        this.request = new network.Request(frame._page.browserContext, frame, null, redirectedFrom ? redirectedFrom.request : null, payload.navigation ?? undefined, payload.request.url, resourceTypeFromBidi(payload.request.destination, payload.request.initiatorType, payload.initiator?.type), payload.request.method, postDataBuffer, headersOverride || fromBidiHeaders(payload.request.headers));
        // "raw" headers are the same as "provisional" headers in Bidi.
        this.request.setRawRequestHeaders(null);
        this.request._setBodySize(payload.request.bodySize || 0);
        this._originalRequestRoute = route ?? redirectedFrom?._originalRequestRoute;
        route?._setRequest(this.request);
    }
    _finalRequest() {
        let request = this;
        while (request._redirectedTo)
            request = request._redirectedTo;
        return request;
    }
}
class BidiRouteImpl {
    _requestId;
    _session;
    _request;
    _alreadyContinuedHeaders;
    constructor(session, requestId) {
        this._session = session;
        this._requestId = requestId;
    }
    _setRequest(request) {
        this._request = request;
    }
    async continue(overrides) {
        // Firefox does not update content-length header.
        let headers = overrides.headers || this._request.headers();
        if (overrides.postData && headers) {
            headers = headers.map(header => {
                if (header.name.toLowerCase() === 'content-length')
                    return { name: header.name, value: overrides.postData.byteLength.toString() };
                return header;
            });
        }
        this._alreadyContinuedHeaders = headers;
        await this._session.sendMayFail('network.continueRequest', {
            request: this._requestId,
            url: overrides.url,
            method: overrides.method,
            ...toBidiRequestHeaders(this._alreadyContinuedHeaders),
            body: overrides.postData ? { type: 'base64', value: Buffer.from(overrides.postData).toString('base64') } : undefined,
        });
    }
    async fulfill(response) {
        const base64body = response.isBase64 ? response.body : Buffer.from(response.body).toString('base64');
        await this._session.sendMayFail('network.provideResponse', {
            request: this._requestId,
            statusCode: response.status,
            reasonPhrase: network.statusText(response.status),
            ...toBidiResponseHeaders(response.headers),
            body: { type: 'base64', value: base64body },
        });
    }
    async abort(errorCode) {
        await this._session.sendMayFail('network.failRequest', {
            request: this._requestId
        });
    }
}
function fromBidiHeaders(bidiHeaders) {
    const result = [];
    for (const { name, value } of bidiHeaders)
        result.push({ name, value: bidiBytesValueToString(value) });
    return result;
}
function toBidiRequestHeaders(allHeaders) {
    const bidiHeaders = toBidiHeaders(allHeaders);
    return { headers: bidiHeaders };
}
function toBidiResponseHeaders(headers) {
    const setCookieHeaders = headers.filter(h => h.name.toLowerCase() === 'set-cookie');
    const otherHeaders = headers.filter(h => h.name.toLowerCase() !== 'set-cookie');
    const rawCookies = setCookieHeaders.map(h => (0, cookieStore_1.parseRawCookie)(h.value));
    const cookies = rawCookies.filter(Boolean).map(c => {
        return {
            ...c,
            value: { type: 'string', value: c.value },
            sameSite: toBidiSameSite(c.sameSite),
        };
    });
    return { cookies, headers: toBidiHeaders(otherHeaders) };
}
function toBidiHeaders(headers) {
    return headers.map(({ name, value }) => ({ name, value: { type: 'string', value } }));
}
function bidiBytesValueToString(value) {
    if (value.type === 'string')
        return value.value;
    if (value.type === 'base64')
        return Buffer.from(value.type, 'base64').toString('binary');
    return 'unknown value type: ' + value.type;
}
function toBidiSameSite(sameSite) {
    if (!sameSite)
        return undefined;
    if (sameSite === 'Strict')
        return "strict" /* bidi.Network.SameSite.Strict */;
    if (sameSite === 'Lax')
        return "lax" /* bidi.Network.SameSite.Lax */;
    return "none" /* bidi.Network.SameSite.None */;
}
function resourceTypeFromBidi(requestDestination, requestInitiatorType, eventInitiatorType) {
    switch (requestDestination) {
        case 'audio': return 'media';
        case 'audioworklet': return 'script';
        case 'document': return 'document';
        case 'font': return 'font';
        case 'frame': return 'document';
        case 'iframe': return 'document';
        case 'image': return 'image';
        case 'object': return 'other';
        case 'paintworklet': return 'script';
        case 'script': return 'script';
        case 'serviceworker': return 'script';
        case 'sharedworker': return 'script';
        case 'style': return 'stylesheet';
        case 'track': return 'texttrack';
        case 'video': return 'media';
        case 'worker': return 'script';
        case '':
            switch (requestInitiatorType) {
                case 'fetch': return 'fetch';
                case 'font': return 'font';
                case 'xmlhttprequest': return 'xhr';
                case null: return eventInitiatorType === 'script' ? 'xhr' : 'document';
                default: return 'other';
            }
        default: return 'other';
    }
}
