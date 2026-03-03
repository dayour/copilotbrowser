/**
 * Copyright (c) Microsoft Corporation.
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
import http from 'http';
import { BrowserContext } from './browserContext';
import { SdkObject } from './instrumentation';
import { Tracing } from './trace/recorder/tracing';
import type { copilotbrowser } from './copilotbrowser';
import type { Progress } from './progress';
import type * as types from './types';
import type { HeadersArray, ProxySettings } from './types';
import type { HTTPCredentials } from '../../types/types';
import type * as channels from '@protocol/channels';
import type * as har from '@trace/har';
type FetchRequestOptions = {
    userAgent: string;
    extraHTTPHeaders?: HeadersArray;
    failOnStatusCode?: boolean;
    httpCredentials?: HTTPCredentials;
    proxy?: ProxySettings;
    ignoreHTTPSErrors?: boolean;
    maxRedirects?: number;
    baseURL?: string;
    clientCertificates?: types.BrowserContextOptions['clientCertificates'];
};
type HeadersObject = Readonly<{
    [name: string]: string;
}>;
export type APIRequestEvent = {
    url: URL;
    method: string;
    headers: HeadersObject;
    cookies: channels.NameValue[];
    postData?: Buffer;
};
export type APIRequestFinishedEvent = {
    requestEvent: APIRequestEvent;
    httpVersion: string;
    headers: http.IncomingHttpHeaders;
    cookies: channels.NetworkCookie[];
    rawHeaders: string[];
    statusCode: number;
    statusMessage: string;
    body?: Buffer;
    timings: har.Timings;
    serverIPAddress?: string;
    serverPort?: number;
    securityDetails?: har.SecurityDetails;
};
export declare abstract class APIRequestContext extends SdkObject {
    static Events: {
        Dispose: string;
        Request: string;
        RequestFinished: string;
    };
    readonly fetchResponses: Map<string, Buffer>;
    readonly fetchLog: Map<string, string[]>;
    protected static allInstances: Set<APIRequestContext>;
    _closeReason: string | undefined;
    static findResponseBody(guid: string): Buffer | undefined;
    constructor(parent: SdkObject);
    protected _disposeImpl(): void;
    disposeResponse(fetchUid: string): void;
    abstract tracing(): Tracing;
    abstract dispose(options: {
        reason?: string;
    }): Promise<void>;
    abstract _defaultOptions(): FetchRequestOptions;
    abstract _addCookies(cookies: channels.NetworkCookie[]): Promise<void>;
    abstract _cookies(url: URL): Promise<channels.NetworkCookie[]>;
    abstract storageState(progress: Progress, indexedDB?: boolean): Promise<channels.APIRequestContextStorageStateResult>;
    private _storeResponseBody;
    fetch(progress: Progress, params: channels.APIRequestContextFetchParams): Promise<channels.APIResponse>;
    private _parseSetCookieHeader;
    private _updateRequestCookieHeader;
    private _sendRequestWithRetries;
    private _sendRequest;
    private _getHttpCredentials;
}
export declare class BrowserContextAPIRequestContext extends APIRequestContext {
    private readonly _context;
    constructor(context: BrowserContext);
    tracing(): Tracing;
    dispose(options: {
        reason?: string;
    }): Promise<void>;
    _defaultOptions(): FetchRequestOptions;
    _addCookies(cookies: channels.NetworkCookie[]): Promise<void>;
    _cookies(url: URL): Promise<channels.NetworkCookie[]>;
    storageState(progress: Progress, indexedDB?: boolean): Promise<channels.APIRequestContextStorageStateResult>;
}
export declare class GlobalAPIRequestContext extends APIRequestContext {
    private readonly _cookieStore;
    private readonly _options;
    private readonly _origins;
    private readonly _tracing;
    constructor(copilotbrowser: copilotbrowser, options: channels.copilotbrowserNewRequestOptions);
    tracing(): Tracing;
    dispose(options: {
        reason?: string;
    }): Promise<void>;
    _defaultOptions(): FetchRequestOptions;
    _addCookies(cookies: channels.NetworkCookie[]): Promise<void>;
    _cookies(url: URL): Promise<channels.NetworkCookie[]>;
    storageState(progress: Progress, indexedDB?: boolean): Promise<channels.APIRequestContextStorageStateResult>;
}
export {};
