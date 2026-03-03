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
import type { WKSession } from './wkConnection';
import type { WKPage } from './wkPage';
import type * as network from '../network';
export declare class WKProvisionalPage {
    readonly _session: WKSession;
    private readonly _wkPage;
    private _coopNavigationRequest;
    private _sessionListeners;
    private _mainFrameId;
    readonly initializationPromise: Promise<void>;
    constructor(session: WKSession, page: WKPage);
    coopNavigationRequest(): network.Request | undefined;
    dispose(): void;
    commit(): void;
    private _onRequestWillBeSent;
    private _onLoadingFinished;
    private _onLoadingFailed;
    private _handleFrameTree;
}
