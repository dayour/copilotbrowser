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
exports.FFNetworkManager = void 0;
const eventsHelper_1 = require("../utils/eventsHelper");
const network = __importStar(require("../network"));
class FFNetworkManager {
    _session;
    _requests;
    _page;
    _eventListeners;
    constructor(session, page) {
        this._session = session;
        this._requests = new Map();
        this._page = page;
        this._eventListeners = [
            eventsHelper_1.eventsHelper.addEventListener(session, 'Network.requestWillBeSent', this._onRequestWillBeSent.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(session, 'Network.responseReceived', this._onResponseReceived.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(session, 'Network.requestFinished', this._onRequestFinished.bind(this)),
            eventsHelper_1.eventsHelper.addEventListener(session, 'Network.requestFailed', this._onRequestFailed.bind(this)),
        ];
    }
    dispose() {
        eventsHelper_1.eventsHelper.removeEventListeners(this._eventListeners);
    }
    async setRequestInterception(enabled) {
        await Promise.all([
            this._session.send('Network.setRequestInterception', { enabled }),
            this._session.send('Page.setCacheDisabled', { cacheDisabled: enabled }),
        ]);
    }
    _onRequestWillBeSent(event) {
        const redirectedFrom = event.redirectedFrom ? (this._requests.get(event.redirectedFrom) || null) : null;
        const frame = redirectedFrom ? redirectedFrom.request.frame() : (event.frameId ? this._page.frameManager.frame(event.frameId) : null);
        if (!frame)
            return;
        // Align with Chromium and WebKit and not expose preflight OPTIONS requests to the client.
        if (event.method === 'OPTIONS' && !event.isIntercepted)
            return;
        if (redirectedFrom)
            this._requests.delete(redirectedFrom._id);
        const request = new InterceptableRequest(frame, redirectedFrom, event);
        let route;
        if (event.isIntercepted)
            route = new FFRouteImpl(this._session, request);
        this._requests.set(request._id, request);
        this._page.frameManager.requestStarted(request.request, route);
    }
    _onResponseReceived(event) {
        const request = this._requests.get(event.requestId);
        if (!request)
            return;
        const getResponseBody = async () => {
            const response = await this._session.send('Network.getResponseBody', {
                requestId: request._id
            });
            if (response.evicted)
                throw new Error(`Response body for ${request.request.method()} ${request.request.url()} was evicted!`);
            return Buffer.from(response.base64body, 'base64');
        };
        const startTime = event.timing.startTime;
        function relativeToStart(time) {
            if (!time)
                return -1;
            return (time - startTime) / 1000;
        }
        const timing = {
            startTime: startTime / 1000,
            domainLookupStart: relativeToStart(event.timing.domainLookupStart),
            domainLookupEnd: relativeToStart(event.timing.domainLookupEnd),
            connectStart: relativeToStart(event.timing.connectStart),
            secureConnectionStart: relativeToStart(event.timing.secureConnectionStart),
            connectEnd: relativeToStart(event.timing.connectEnd),
            requestStart: relativeToStart(event.timing.requestStart),
            responseStart: relativeToStart(event.timing.responseStart),
        };
        const response = new network.Response(request.request, event.status, event.statusText, parseMultivalueHeaders(event.headers), timing, getResponseBody, event.fromServiceWorker);
        if (event?.remoteIPAddress && typeof event?.remotePort === 'number') {
            response._serverAddrFinished({
                ipAddress: event.remoteIPAddress,
                port: event.remotePort,
            });
        }
        else {
            response._serverAddrFinished();
        }
        response._securityDetailsFinished({
            protocol: event?.securityDetails?.protocol,
            subjectName: event?.securityDetails?.subjectName,
            issuer: event?.securityDetails?.issuer,
            validFrom: event?.securityDetails?.validFrom,
            validTo: event?.securityDetails?.validTo,
        });
        // "raw" headers are the same as "provisional" headers in Firefox.
        response.setRawResponseHeaders(null);
        // Headers size are not available in Firefox.
        response.setResponseHeadersSize(null);
        this._page.frameManager.requestReceivedResponse(response);
    }
    _onRequestFinished(event) {
        const request = this._requests.get(event.requestId);
        if (!request)
            return;
        const response = request.request._existingResponse();
        response.setTransferSize(event.transferSize);
        response.setEncodedBodySize(event.encodedBodySize);
        // Keep redirected requests in the map for future reference as redirectedFrom.
        const isRedirected = response.status() >= 300 && response.status() <= 399;
        const responseEndTime = event.responseEndTime ? event.responseEndTime / 1000 - response.timing().startTime : -1;
        if (isRedirected) {
            response._requestFinished(responseEndTime);
        }
        else {
            this._requests.delete(request._id);
            response._requestFinished(responseEndTime);
        }
        if (event.protocolVersion)
            response._setHttpVersion(event.protocolVersion);
        this._page.frameManager.reportRequestFinished(request.request, response);
    }
    _onRequestFailed(event) {
        const request = this._requests.get(event.requestId);
        if (!request)
            return;
        this._requests.delete(request._id);
        const response = request.request._existingResponse();
        if (response) {
            response.setTransferSize(null);
            response.setEncodedBodySize(null);
            response._requestFinished(-1);
        }
        request.request._setFailureText(event.errorCode);
        this._page.frameManager.requestFailed(request.request, event.errorCode === 'NS_BINDING_ABORTED');
    }
}
exports.FFNetworkManager = FFNetworkManager;
const causeToResourceType = {
    TYPE_INVALID: 'other',
    TYPE_OTHER: 'other',
    TYPE_SCRIPT: 'script',
    TYPE_IMAGE: 'image',
    TYPE_STYLESHEET: 'stylesheet',
    TYPE_OBJECT: 'other',
    TYPE_DOCUMENT: 'document',
    TYPE_SUBDOCUMENT: 'document',
    TYPE_REFRESH: 'document',
    TYPE_XBL: 'other',
    TYPE_PING: 'other',
    TYPE_XMLHTTPREQUEST: 'xhr',
    TYPE_OBJECT_SUBREQUEST: 'other',
    TYPE_DTD: 'other',
    TYPE_FONT: 'font',
    TYPE_MEDIA: 'media',
    TYPE_WEBSOCKET: 'websocket',
    TYPE_CSP_REPORT: 'cspreport',
    TYPE_XSLT: 'other',
    TYPE_BEACON: 'beacon',
    TYPE_FETCH: 'fetch',
    TYPE_IMAGESET: 'image',
    TYPE_WEB_MANIFEST: 'manifest',
};
const internalCauseToResourceType = {
    TYPE_INTERNAL_EVENTSOURCE: 'eventsource',
};
class InterceptableRequest {
    request;
    _id;
    _redirectedTo;
    constructor(frame, redirectedFrom, payload) {
        this._id = payload.requestId;
        if (redirectedFrom)
            redirectedFrom._redirectedTo = this;
        let postDataBuffer = null;
        if (payload.postData)
            postDataBuffer = Buffer.from(payload.postData, 'base64');
        this.request = new network.Request(frame._page.browserContext, frame, null, redirectedFrom ? redirectedFrom.request : null, payload.navigationId, payload.url, internalCauseToResourceType[payload.internalCause] || causeToResourceType[payload.cause] || 'other', payload.method, postDataBuffer, payload.headers);
        // "raw" headers are the same as "provisional" headers in Firefox.
        this.request.setRawRequestHeaders(null);
    }
    _finalRequest() {
        let request = this;
        while (request._redirectedTo)
            request = request._redirectedTo;
        return request;
    }
}
class FFRouteImpl {
    _request;
    _session;
    constructor(session, request) {
        this._session = session;
        this._request = request;
    }
    async continue(overrides) {
        await this._session.sendMayFail('Network.resumeInterceptedRequest', {
            requestId: this._request._id,
            url: overrides.url,
            method: overrides.method,
            headers: overrides.headers,
            postData: overrides.postData ? Buffer.from(overrides.postData).toString('base64') : undefined,
        });
    }
    async fulfill(response) {
        const base64body = response.isBase64 ? response.body : Buffer.from(response.body).toString('base64');
        await this._session.sendMayFail('Network.fulfillInterceptedRequest', {
            requestId: this._request._id,
            status: response.status,
            statusText: network.statusText(response.status),
            headers: response.headers,
            base64body,
        });
    }
    async abort(errorCode) {
        await this._session.sendMayFail('Network.abortInterceptedRequest', {
            requestId: this._request._id,
            errorCode,
        });
    }
}
function parseMultivalueHeaders(headers) {
    const result = [];
    for (const header of headers) {
        const separator = header.name.toLowerCase() === 'set-cookie' ? '\n' : ',';
        const tokens = header.value.split(separator).map(s => s.trim());
        for (const token of tokens)
            result.push({ name: header.name, value: token });
    }
    return result;
}
