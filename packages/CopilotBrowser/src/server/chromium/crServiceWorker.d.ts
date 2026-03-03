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
import { Worker } from '../page';
import * as network from '../network';
import type { CRBrowserContext } from './crBrowser';
import type { CRSession } from './crConnection';
export declare class CRServiceWorker extends Worker {
    readonly browserContext: CRBrowserContext;
    private readonly _networkManager?;
    private _session;
    constructor(browserContext: CRBrowserContext, session: CRSession, url: string);
    didClose(): void;
    updateOffline(): Promise<void>;
    updateHttpCredentials(): Promise<void>;
    updateExtraHTTPHeaders(): Promise<void>;
    updateRequestInterception(): Promise<void>;
    needsRequestInterception(): boolean;
    reportRequestFinished(request: network.Request, response: network.Response | null): void;
    requestFailed(request: network.Request, _canceled: boolean): void;
    requestReceivedResponse(response: network.Response): void;
    requestStarted(request: network.Request, route?: network.RouteDelegate): void;
    private _isNetworkInspectionEnabled;
}
