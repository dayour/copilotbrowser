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
import { WebSocket } from '../network';
import { Dispatcher } from './dispatcher';
import { FrameDispatcher } from './frameDispatcher';
import { Request } from '../network';
import type { APIRequestContext } from '../fetch';
import type { Response, Route } from '../network';
import type { BrowserContextDispatcher } from './browserContextDispatcher';
import type { RootDispatcher } from './dispatcher';
import type { PageDispatcher } from './pageDispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class RequestDispatcher extends Dispatcher<Request, channels.RequestChannel, BrowserContextDispatcher | PageDispatcher | FrameDispatcher> implements channels.RequestChannel {
    _type_Request: boolean;
    private _browserContextDispatcher;
    static from(scope: BrowserContextDispatcher, request: Request): RequestDispatcher;
    static fromNullable(scope: BrowserContextDispatcher, request: Request | null): RequestDispatcher | undefined;
    private constructor();
    rawRequestHeaders(params: channels.RequestRawRequestHeadersParams, progress: Progress): Promise<channels.RequestRawRequestHeadersResult>;
    response(params: channels.RequestResponseParams, progress: Progress): Promise<channels.RequestResponseResult>;
}
export declare class ResponseDispatcher extends Dispatcher<Response, channels.ResponseChannel, RequestDispatcher> implements channels.ResponseChannel {
    _type_Response: boolean;
    static from(scope: BrowserContextDispatcher, response: Response): ResponseDispatcher;
    static fromNullable(scope: BrowserContextDispatcher, response: Response | null): ResponseDispatcher | undefined;
    private constructor();
    body(params: channels.ResponseBodyParams, progress: Progress): Promise<channels.ResponseBodyResult>;
    securityDetails(params: channels.ResponseSecurityDetailsParams, progress: Progress): Promise<channels.ResponseSecurityDetailsResult>;
    serverAddr(params: channels.ResponseServerAddrParams, progress: Progress): Promise<channels.ResponseServerAddrResult>;
    rawResponseHeaders(params: channels.ResponseRawResponseHeadersParams, progress: Progress): Promise<channels.ResponseRawResponseHeadersResult>;
    sizes(params: channels.ResponseSizesParams, progress: Progress): Promise<channels.ResponseSizesResult>;
}
export declare class RouteDispatcher extends Dispatcher<Route, channels.RouteChannel, RequestDispatcher> implements channels.RouteChannel {
    _type_Route: boolean;
    private _handled;
    constructor(scope: RequestDispatcher, route: Route);
    private _checkNotHandled;
    continue(params: channels.RouteContinueParams, progress: Progress): Promise<channels.RouteContinueResult>;
    fulfill(params: channels.RouteFulfillParams, progress: Progress): Promise<void>;
    abort(params: channels.RouteAbortParams, progress: Progress): Promise<void>;
    redirectNavigationRequest(params: channels.RouteRedirectNavigationRequestParams, progress: Progress): Promise<void>;
}
export declare class WebSocketDispatcher extends Dispatcher<WebSocket, channels.WebSocketChannel, PageDispatcher> implements channels.WebSocketChannel {
    _type_EventTarget: boolean;
    _type_WebSocket: boolean;
    constructor(scope: PageDispatcher, webSocket: WebSocket);
}
export declare class APIRequestContextDispatcher extends Dispatcher<APIRequestContext, channels.APIRequestContextChannel, RootDispatcher | BrowserContextDispatcher> implements channels.APIRequestContextChannel {
    _type_APIRequestContext: boolean;
    static from(scope: RootDispatcher | BrowserContextDispatcher, request: APIRequestContext): APIRequestContextDispatcher;
    static fromNullable(scope: RootDispatcher | BrowserContextDispatcher, request: APIRequestContext | null): APIRequestContextDispatcher | undefined;
    private constructor();
    storageState(params: channels.APIRequestContextStorageStateParams, progress: Progress): Promise<channels.APIRequestContextStorageStateResult>;
    dispose(params: channels.APIRequestContextDisposeParams, progress: Progress): Promise<void>;
    fetch(params: channels.APIRequestContextFetchParams, progress: Progress): Promise<channels.APIRequestContextFetchResult>;
    fetchResponseBody(params: channels.APIRequestContextFetchResponseBodyParams, progress: Progress): Promise<channels.APIRequestContextFetchResponseBodyResult>;
    fetchLog(params: channels.APIRequestContextFetchLogParams, progress: Progress): Promise<channels.APIRequestContextFetchLogResult>;
    disposeAPIResponse(params: channels.APIRequestContextDisposeAPIResponseParams, progress: Progress): Promise<void>;
}
