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
import * as bidi from './third_party/bidiProtocol';
import type { Page } from '../page';
import type * as types from '../types';
import type { BidiSession } from './bidiConnection';
export declare class BidiNetworkManager {
    private readonly _session;
    private readonly _requests;
    private readonly _page;
    private readonly _eventListeners;
    private _userRequestInterceptionEnabled;
    private _protocolRequestInterceptionEnabled;
    private _credentials;
    private _attemptedAuthentications;
    private _intercepId;
    constructor(bidiSession: BidiSession, page: Page);
    dispose(): void;
    private _onBeforeRequestSent;
    private _onResponseStarted;
    private _onResponseCompleted;
    private _onFetchError;
    private _onAuthRequired;
    _deleteRequest(requestId: string): void;
    setRequestInterception(value: boolean): Promise<void>;
    setCredentials(credentials: types.Credentials | undefined): Promise<void>;
    _updateProtocolRequestInterception(initial?: boolean): Promise<void>;
}
export declare function bidiBytesValueToString(value: bidi.Network.BytesValue): string;
