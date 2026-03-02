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
import type * as frames from '../frames';
import type * as types from '../types';
import type { Protocol } from './protocol';
import type { WKSession } from './wkConnection';
export declare class WKInterceptableRequest {
    private _session;
    private _requestId;
    readonly request: network.Request;
    _timestamp: number;
    _wallTime: number;
    constructor(session: WKSession, frame: frames.Frame, event: Protocol.Network.requestWillBeSentPayload, redirectedFrom: WKInterceptableRequest | null, documentId: string | undefined);
    adoptRequestFromNewProcess(newSession: WKSession, requestId: string): void;
    createResponse(responsePayload: Protocol.Network.Response): network.Response;
}
export declare class WKRouteImpl implements network.RouteDelegate {
    private readonly _session;
    private readonly _requestId;
    constructor(session: WKSession, requestId: string);
    abort(errorCode: string): Promise<void>;
    fulfill(response: types.NormalizedFulfillResponse): Promise<void>;
    continue(overrides: types.NormalizedContinueOverrides): Promise<void>;
}
