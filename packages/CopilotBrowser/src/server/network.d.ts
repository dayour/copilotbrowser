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
import { SdkObject } from './instrumentation';
import type * as contexts from './browserContext';
import type * as frames from './frames';
import type * as pages from './page';
import type * as types from './types';
import type { HeadersArray, NameValue } from '../utils/isomorphic/types';
import type * as channels from '@protocol/channels';
export declare function filterCookies(cookies: channels.NetworkCookie[], urls: string[]): channels.NetworkCookie[];
export declare function isLocalHostname(hostname: string): boolean;
export declare function applyHeadersOverrides(original: HeadersArray, overrides: HeadersArray): HeadersArray;
export declare const kMaxCookieExpiresDateInSeconds = 253402300799;
export declare function rewriteCookies(cookies: channels.SetNetworkCookie[]): channels.SetNetworkCookie[];
export declare function parseURL(url: string): URL | null;
export declare function stripFragmentFromUrl(url: string): string;
export type ResourceType = 'document' | 'stylesheet' | 'image' | 'media' | 'font' | 'script' | 'fetch' | 'xhr' | 'websocket' | 'eventsource' | 'manifest' | 'texttrack' | 'beacon' | 'ping' | 'cspreport' | 'other';
export declare class Request extends SdkObject {
    private _response;
    private _redirectedFrom;
    _redirectedTo: Request | null;
    readonly _documentId?: string;
    readonly _isFavicon: boolean;
    _failureText: string | null;
    private _url;
    private _resourceType;
    private _method;
    private _postData;
    readonly _headers: HeadersArray;
    readonly _frame: frames.Frame | null;
    readonly _serviceWorker: pages.Worker | null;
    readonly _context: contexts.BrowserContext;
    private _rawRequestHeadersPromise;
    private _waitForResponsePromise;
    _responseEndTiming: number;
    private _overrides;
    private _bodySize;
    _responseBodyOverride: {
        body: string;
        isBase64: boolean;
    } | undefined;
    static Events: {
        Response: string;
    };
    constructor(context: contexts.BrowserContext, frame: frames.Frame | null, serviceWorker: pages.Worker | null, redirectedFrom: Request | null, documentId: string | undefined, url: string, resourceType: ResourceType, method: string, postData: Buffer | null, headers: HeadersArray);
    _setFailureText(failureText: string): void;
    _applyOverrides(overrides: types.NormalizedContinueOverrides): types.NormalizedContinueOverrides;
    overrides(): types.NormalizedContinueOverrides;
    url(): string;
    resourceType(): ResourceType;
    method(): string;
    postDataBuffer(): Buffer | null;
    headers(): HeadersArray;
    headerValue(name: string): string | undefined;
    setRawRequestHeaders(headers: HeadersArray | null): void;
    rawRequestHeaders(): Promise<HeadersArray>;
    response(): Promise<Response | null>;
    _existingResponse(): Response | null;
    _setResponse(response: Response): void;
    _finalRequest(): Request;
    frame(): frames.Frame | null;
    serviceWorker(): pages.Worker | null;
    isNavigationRequest(): boolean;
    redirectedFrom(): Request | null;
    failure(): {
        errorText: string;
    } | null;
    _setBodySize(size: number): void;
    bodySize(): number;
    requestHeadersSize(): Promise<number>;
}
export declare class Route extends SdkObject {
    private readonly _request;
    private readonly _delegate;
    private _handled;
    private _currentHandler;
    private _futureHandlers;
    constructor(request: Request, delegate: RouteDelegate);
    handle(handlers: RouteHandler[]): void;
    removeHandler(handler: RouteHandler): Promise<void>;
    request(): Request;
    abort(errorCode?: string): Promise<void>;
    redirectNavigationRequest(url: string): void;
    fulfill(overrides: channels.RouteFulfillParams): Promise<void>;
    private _maybeAddCorsHeaders;
    continue(overrides: types.NormalizedContinueOverrides): Promise<void>;
    private _startHandling;
    private _endHandling;
}
export type RouteHandler = (route: Route, request: Request) => void;
type GetResponseBodyCallback = () => Promise<Buffer>;
export type ResourceTiming = {
    startTime: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    secureConnectionStart: number;
    connectEnd: number;
    requestStart: number;
    responseStart: number;
};
export type ResourceSizes = {
    requestBodySize: number;
    requestHeadersSize: number;
    responseBodySize: number;
    responseHeadersSize: number;
    transferSize: number;
};
export type RemoteAddr = {
    ipAddress: string;
    port: number;
};
export type SecurityDetails = {
    protocol?: string;
    subjectName?: string;
    issuer?: string;
    validFrom?: number;
    validTo?: number;
};
export declare class Response extends SdkObject {
    private _request;
    private _contentPromise;
    private _finishedPromise;
    private _status;
    private _statusText;
    private _url;
    private _headers;
    private _headersMap;
    private _getResponseBodyCallback;
    private _timing;
    private _serverAddrPromise;
    private _securityDetailsPromise;
    private _rawResponseHeadersPromise;
    private _httpVersion;
    private _fromServiceWorker;
    private _encodedBodySizePromise;
    private _transferSizePromise;
    private _responseHeadersSizePromise;
    constructor(request: Request, status: number, statusText: string, headers: HeadersArray, timing: ResourceTiming, getResponseBodyCallback: GetResponseBodyCallback, fromServiceWorker: boolean, httpVersion?: string);
    _serverAddrFinished(addr?: RemoteAddr): void;
    _securityDetailsFinished(securityDetails?: SecurityDetails): void;
    _requestFinished(responseEndTiming: number): void;
    _setHttpVersion(httpVersion: string): void;
    url(): string;
    status(): number;
    statusText(): string;
    headers(): HeadersArray;
    headerValue(name: string): string | undefined;
    rawResponseHeaders(): Promise<NameValue[]>;
    setRawResponseHeaders(headers: HeadersArray | null): void;
    setTransferSize(size: number | null): void;
    setEncodedBodySize(size: number | null): void;
    setResponseHeadersSize(size: number | null): void;
    timing(): ResourceTiming;
    serverAddr(): Promise<RemoteAddr | null>;
    securityDetails(): Promise<SecurityDetails | null>;
    body(): Promise<Buffer>;
    request(): Request;
    finished(): Promise<void>;
    frame(): frames.Frame | null;
    httpVersion(): string;
    fromServiceWorker(): boolean;
    responseHeadersSize(): Promise<number>;
    sizes(): Promise<ResourceSizes>;
}
export declare class WebSocket extends SdkObject {
    private _url;
    private _notified;
    static Events: {
        Close: string;
        SocketError: string;
        FrameReceived: string;
        FrameSent: string;
    };
    constructor(parent: SdkObject, url: string);
    markAsNotified(): boolean;
    url(): string;
    frameSent(opcode: number, data: string): void;
    frameReceived(opcode: number, data: string): void;
    error(errorMessage: string): void;
    closed(): void;
}
export interface RouteDelegate {
    abort(errorCode: string): Promise<void>;
    fulfill(response: types.NormalizedFulfillResponse): Promise<void>;
    continue(overrides: types.NormalizedContinueOverrides): Promise<void>;
}
export declare function statusText(status: number): string;
export declare function singleHeader(name: string, value: string): HeadersArray;
export declare function mergeHeaders(headers: (HeadersArray | undefined | null)[]): HeadersArray;
export {};
