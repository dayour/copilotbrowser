/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import * as network from '../network';
import type { CRSession } from './crConnection';
import type { Protocol } from './protocol';
import type { RegisteredListener } from '../utils/eventsHelper';
import type * as contexts from '../browserContext';
import type * as frames from '../frames';
import type { Page } from '../page';
import type * as types from '../types';
import type { CRServiceWorker } from './crServiceWorker';
type SessionInfo = {
    session: CRSession;
    isMain?: boolean;
    workerFrame?: frames.Frame;
    eventListeners: RegisteredListener[];
};
export declare class CRNetworkManager {
    private _page;
    private _serviceWorker;
    private _requestIdToRequest;
    private _requestIdToRequestWillBeSentEvent;
    private _credentials;
    private _attemptedAuthentications;
    private _userRequestInterceptionEnabled;
    private _protocolRequestInterceptionEnabled;
    private _offline;
    private _extraHTTPHeaders;
    private _requestIdToRequestPausedEvent;
    private _responseExtraInfoTracker;
    private _sessions;
    constructor(page: Page | null, serviceWorker: CRServiceWorker | null);
    addSession(session: CRSession, workerFrame?: frames.Frame, isMain?: boolean): Promise<void>;
    removeSession(session: CRSession): void;
    private _forEachSession;
    authenticate(credentials: types.Credentials | null): Promise<void>;
    setOffline(offline: boolean): Promise<void>;
    private _setOfflineForSession;
    setRequestInterception(value: boolean): Promise<void>;
    _updateProtocolRequestInterception(): Promise<void>;
    private _updateProtocolRequestInterceptionForSession;
    setExtraHTTPHeaders(extraHTTPHeaders: types.HeadersArray): Promise<void>;
    private _setExtraHTTPHeadersForSession;
    clearCache(): Promise<void>;
    _onRequestWillBeSent(sessionInfo: SessionInfo, event: Protocol.Network.requestWillBeSentPayload): void;
    _onRequestServedFromCache(event: Protocol.Network.requestServedFromCachePayload): void;
    _onRequestWillBeSentExtraInfo(event: Protocol.Network.requestWillBeSentExtraInfoPayload): void;
    _onAuthRequired(sessionInfo: SessionInfo, event: Protocol.Fetch.authRequiredPayload): void;
    _shouldProvideCredentials(url: string): boolean;
    _onRequestPaused(sessionInfo: SessionInfo, event: Protocol.Fetch.requestPausedPayload): void;
    _onRequest(requestWillBeSentSessionInfo: SessionInfo, requestWillBeSentEvent: Protocol.Network.requestWillBeSentPayload, requestPausedSessionInfo: SessionInfo | undefined, requestPausedEvent: Protocol.Fetch.requestPausedPayload | undefined): void;
    _createResponse(request: InterceptableRequest, responsePayload: Protocol.Network.Response, hasExtraInfo: boolean): network.Response;
    _deleteRequest(request: InterceptableRequest): void;
    _handleRequestRedirect(request: InterceptableRequest, responsePayload: Protocol.Network.Response, timestamp: number, hasExtraInfo: boolean): void;
    _onResponseReceivedExtraInfo(event: Protocol.Network.responseReceivedExtraInfoPayload): void;
    _onResponseReceived(sessionInfo: SessionInfo, event: Protocol.Network.responseReceivedPayload): void;
    _onLoadingFinished(sessionInfo: SessionInfo, event: Protocol.Network.loadingFinishedPayload): void;
    _onLoadingFailed(sessionInfo: SessionInfo, event: Protocol.Network.loadingFailedPayload): void;
    private _maybeUpdateRequestSession;
}
declare class InterceptableRequest {
    readonly request: network.Request;
    readonly _requestId: string;
    readonly _interceptionId: string | undefined;
    readonly _documentId: string | undefined;
    readonly _timestamp: number;
    readonly _wallTime: number;
    readonly _route: RouteImpl | null;
    readonly _originalRequestRoute: RouteImpl | undefined;
    session: CRSession;
    constructor(options: {
        session: CRSession;
        context: contexts.BrowserContext;
        frame: frames.Frame | null;
        serviceWorker: CRServiceWorker | null;
        documentId?: string;
        route: RouteImpl | null;
        requestWillBeSentEvent: Protocol.Network.requestWillBeSentPayload;
        requestPausedEvent: Protocol.Fetch.requestPausedPayload | undefined;
        redirectedFrom: InterceptableRequest | null;
        headersOverride: types.HeadersArray | null;
    });
}
declare class RouteImpl implements network.RouteDelegate {
    private readonly _session;
    private _interceptionId;
    _alreadyContinuedParams: Protocol.Fetch.continueRequestParameters | undefined;
    _fulfilled: boolean;
    constructor(session: CRSession, interceptionId: string);
    continue(overrides: types.NormalizedContinueOverrides): Promise<void>;
    fulfill(response: types.NormalizedFulfillResponse): Promise<void>;
    abort(errorCode?: string): Promise<void>;
}
export {};
