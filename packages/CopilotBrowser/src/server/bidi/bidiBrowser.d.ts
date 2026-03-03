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
import { Browser } from '../browser';
import { BrowserContext } from '../browserContext';
import { BidiPage } from './bidiPage';
import * as bidi from './third_party/bidiProtocol';
import type { BrowserOptions } from '../browser';
import type { SdkObject } from '../instrumentation';
import type { InitScript, Page } from '../page';
import type { ConnectionTransport } from '../transport';
import type * as types from '../types';
import type { BidiSession } from './bidiConnection';
import type * as channels from '@protocol/channels';
export declare class BidiBrowser extends Browser {
    private readonly _connection;
    readonly _browserSession: BidiSession;
    private _bidiSessionInfo;
    readonly _contexts: Map<string, BidiBrowserContext>;
    readonly _bidiPages: Map<string, BidiPage>;
    private readonly _eventListeners;
    static connect(parent: SdkObject, transport: ConnectionTransport, options: BrowserOptions): Promise<BidiBrowser>;
    constructor(parent: SdkObject, transport: ConnectionTransport, options: BrowserOptions);
    _onDisconnect(): void;
    doCreateNewContext(options: types.BrowserContextOptions): Promise<BrowserContext>;
    contexts(): BrowserContext[];
    version(): string;
    userAgent(): string;
    isConnected(): boolean;
    private _onBrowsingContextCreated;
    _onBrowsingContextDestroyed(event: bidi.BrowsingContext.Info): void;
    private _onScriptRealmDestroyed;
    private _findPageForFrame;
}
export declare class BidiBrowserContext extends BrowserContext {
    readonly _browser: BidiBrowser;
    private _originToPermissions;
    private _initScriptIds;
    private _interceptId;
    constructor(browser: BidiBrowser, browserContextId: string | undefined, options: types.BrowserContextOptions);
    private _bidiPages;
    _initialize(): Promise<void>;
    possiblyUninitializedPages(): Page[];
    doCreateNewPage(): Promise<Page>;
    doGetCookies(urls: string[]): Promise<channels.NetworkCookie[]>;
    addCookies(cookies: channels.SetNetworkCookie[]): Promise<void>;
    doClearCookies(): Promise<void>;
    doGrantPermissions(origin: string, permissions: string[]): Promise<void>;
    doGrantGlobalPermissionsForURL(url: string): Promise<void>;
    doClearPermissions(): Promise<void>;
    private _setPermission;
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
    private _userContextId;
}
export declare function getScreenOrientation(isMobile: boolean, viewportSize: types.Size): bidi.Emulation.ScreenOrientation;
export declare namespace Network {
    const enum SameSite {
        Strict = "strict",
        Lax = "lax",
        None = "none"
    }
}
