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
import type { FFSession } from './ffConnection';
import type { Page } from '../page';
import type { Protocol } from './protocol';
export declare class FFNetworkManager {
    private _session;
    private _requests;
    private _page;
    private _eventListeners;
    constructor(session: FFSession, page: Page);
    dispose(): void;
    setRequestInterception(enabled: boolean): Promise<void>;
    _onRequestWillBeSent(event: Protocol.Network.requestWillBeSentPayload): void;
    _onResponseReceived(event: Protocol.Network.responseReceivedPayload): void;
    _onRequestFinished(event: Protocol.Network.requestFinishedPayload): void;
    _onRequestFailed(event: Protocol.Network.requestFailedPayload): void;
}
