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
import { Page } from '../page';
import { Dispatcher } from './dispatcher';
import { PageDispatcher } from './pageDispatcher';
import { SdkObject } from '../instrumentation';
import type { BrowserContextDispatcher } from './browserContextDispatcher';
import type { BrowserContext } from '../browserContext';
import type { DispatcherConnection } from './dispatcher';
import type { Frame } from '../frames';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
import type { InitScript } from '../page';
export declare class WebSocketRouteDispatcher extends Dispatcher<SdkObject, channels.WebSocketRouteChannel, PageDispatcher | BrowserContextDispatcher> implements channels.WebSocketRouteChannel {
    _type_WebSocketRoute: boolean;
    private _id;
    private _frame;
    private static _idToDispatcher;
    constructor(scope: PageDispatcher | BrowserContextDispatcher, id: string, url: string, frame: Frame);
    static install(progress: Progress, connection: DispatcherConnection, target: Page | BrowserContext): Promise<InitScript>;
    static uninstall(connection: DispatcherConnection, target: Page | BrowserContext, initScript: InitScript): Promise<void>;
    connect(params: channels.WebSocketRouteConnectParams, progress: Progress): Promise<void>;
    ensureOpened(params: channels.WebSocketRouteEnsureOpenedParams, progress: Progress): Promise<void>;
    sendToPage(params: channels.WebSocketRouteSendToPageParams, progress: Progress): Promise<void>;
    sendToServer(params: channels.WebSocketRouteSendToServerParams, progress: Progress): Promise<void>;
    closePage(params: channels.WebSocketRouteClosePageParams, progress: Progress): Promise<void>;
    closeServer(params: channels.WebSocketRouteCloseServerParams, progress: Progress): Promise<void>;
    private _evaluateAPIRequest;
    _onDispose(): void;
    private _executionContextGone;
}
