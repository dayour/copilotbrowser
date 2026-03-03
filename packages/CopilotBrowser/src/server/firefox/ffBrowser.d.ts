/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Browser } from '../browser';
import { BrowserContext } from '../browserContext';
import { FFConnection } from './ffConnection';
import { FFPage } from './ffPage';
import type { BrowserOptions } from '../browser';
import type { SdkObject } from '../instrumentation';
import type { InitScript, Page } from '../page';
import type { ConnectionTransport } from '../transport';
import type * as types from '../types';
import type { FFSession } from './ffConnection';
import type { Protocol } from './protocol';
import type * as channels from '@protocol/channels';
export declare class FFBrowser extends Browser {
    private _connection;
    readonly session: FFSession;
    readonly _ffPages: Map<string, FFPage>;
    readonly _contexts: Map<string, FFBrowserContext>;
    private _version;
    private _userAgent;
    static connect(parent: SdkObject, transport: ConnectionTransport, options: BrowserOptions): Promise<FFBrowser>;
    constructor(parent: SdkObject, connection: FFConnection, options: BrowserOptions);
    _initVersion(): Promise<void>;
    isConnected(): boolean;
    doCreateNewContext(options: types.BrowserContextOptions): Promise<BrowserContext>;
    contexts(): BrowserContext[];
    version(): string;
    userAgent(): string;
    _onDetachedFromTarget(payload: Protocol.Browser.detachedFromTargetPayload): void;
    _onAttachedToTarget(payload: Protocol.Browser.attachedToTargetPayload): void;
    _onDownloadCreated(payload: Protocol.Browser.downloadCreatedPayload): void;
    _onDownloadFinished(payload: Protocol.Browser.downloadFinishedPayload): void;
    _onDisconnect(): void;
}
export declare class FFBrowserContext extends BrowserContext {
    readonly _browser: FFBrowser;
    constructor(browser: FFBrowser, browserContextId: string | undefined, options: types.BrowserContextOptions);
    _initialize(): Promise<void>;
    _ffPages(): FFPage[];
    possiblyUninitializedPages(): Page[];
    doCreateNewPage(): Promise<Page>;
    doGetCookies(urls: string[]): Promise<channels.NetworkCookie[]>;
    addCookies(cookies: channels.SetNetworkCookie[]): Promise<void>;
    doClearCookies(): Promise<void>;
    doGrantPermissions(origin: string, permissions: string[]): Promise<void>;
    doClearPermissions(): Promise<void>;
    setGeolocation(geolocation?: types.Geolocation): Promise<void>;
    doUpdateExtraHTTPHeaders(): Promise<void>;
    setUserAgent(userAgent: string | undefined): Promise<void>;
    doUpdateOffline(): Promise<void>;
    doSetHTTPCredentials(httpCredentials?: types.Credentials): Promise<void>;
    doAddInitScript(initScript: InitScript): Promise<void>;
    doRemoveInitScripts(initScripts: InitScript[]): Promise<void>;
    private _updateInitScripts;
    doUpdateRequestInterception(): Promise<void>;
    doUpdateDefaultViewport(): Promise<void>;
    doUpdateDefaultEmulatedMedia(): Promise<void>;
    doExposecopilotbrowserBinding(): Promise<void>;
    onClosePersistent(): void;
    clearCache(): Promise<void>;
    doClose(reason: string | undefined): Promise<void>;
    cancelDownload(uuid: string): Promise<void>;
}
