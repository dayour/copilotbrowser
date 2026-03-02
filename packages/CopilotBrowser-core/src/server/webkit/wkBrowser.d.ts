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
import { Browser } from '../browser';
import { BrowserContext } from '../browserContext';
import { WKSession } from './wkConnection';
import { WKPage } from './wkPage';
import type { BrowserOptions } from '../browser';
import type { SdkObject } from '../instrumentation';
import type { InitScript, Page } from '../page';
import type { ConnectionTransport } from '../transport';
import type * as types from '../types';
import type { Protocol } from './protocol';
import type { PageProxyMessageReceivedPayload } from './wkConnection';
import type * as channels from '@protocol/channels';
export declare class WKBrowser extends Browser {
    private readonly _connection;
    readonly _browserSession: WKSession;
    readonly _contexts: Map<string, WKBrowserContext>;
    readonly _wkPages: Map<string, WKPage>;
    static connect(parent: SdkObject, transport: ConnectionTransport, options: BrowserOptions): Promise<WKBrowser>;
    constructor(parent: SdkObject, transport: ConnectionTransport, options: BrowserOptions);
    _onDisconnect(): void;
    doCreateNewContext(options: types.BrowserContextOptions): Promise<BrowserContext>;
    contexts(): BrowserContext[];
    version(): string;
    userAgent(): string;
    _onDownloadCreated(payload: Protocol.copilotbrowser.downloadCreatedPayload): void;
    _onDownloadFilenameSuggested(payload: Protocol.copilotbrowser.downloadFilenameSuggestedPayload): void;
    _onDownloadFinished(payload: Protocol.copilotbrowser.downloadFinishedPayload): void;
    _onPageProxyCreated(event: Protocol.copilotbrowser.pageProxyCreatedPayload): void;
    _onPageProxyDestroyed(event: Protocol.copilotbrowser.pageProxyDestroyedPayload): void;
    _onPageProxyMessageReceived(event: PageProxyMessageReceivedPayload): void;
    _onProvisionalLoadFailed(event: Protocol.copilotbrowser.provisionalLoadFailedPayload): void;
    _onWindowOpen(event: Protocol.copilotbrowser.windowOpenPayload): void;
    isConnected(): boolean;
}
export declare class WKBrowserContext extends BrowserContext {
    readonly _browser: WKBrowser;
    constructor(browser: WKBrowser, browserContextId: string | undefined, options: types.BrowserContextOptions);
    _initialize(): Promise<void>;
    _wkPages(): WKPage[];
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
    doUpdateRequestInterception(): Promise<void>;
    doUpdateDefaultViewport(): Promise<void>;
    doUpdateDefaultEmulatedMedia(): Promise<void>;
    doExposecopilotbrowserBinding(): Promise<void>;
    onClosePersistent(): void;
    clearCache(): Promise<void>;
    doClose(reason: string | undefined): Promise<void>;
    cancelDownload(uuid: string): Promise<void>;
    _validateEmulatedViewport(viewportSize: types.Size | undefined): void;
}
