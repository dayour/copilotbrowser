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
import { Artifact } from '../artifact';
import { Browser } from '../browser';
import { BrowserContext } from '../browserContext';
import { Frame } from '../frames';
import { Page } from '../page';
import { CRConnection } from './crConnection';
import { CRPage } from './crPage';
import { CRServiceWorker } from './crServiceWorker';
import type { InitScript, Worker } from '../page';
import type { ConnectionTransport } from '../transport';
import type * as types from '../types';
import type { CDPSession, CRSession } from './crConnection';
import type { CRDevTools } from './crDevTools';
import type { Protocol } from './protocol';
import type { BrowserOptions } from '../browser';
import type { SdkObject } from '../instrumentation';
import type * as channels from '@protocol/channels';
export declare class CRBrowser extends Browser {
    readonly _connection: CRConnection;
    _session: CRSession;
    private _clientRootSessionPromise;
    readonly _contexts: Map<string, CRBrowserContext>;
    _crPages: Map<string, CRPage>;
    _serviceWorkers: Map<string, CRServiceWorker>;
    _devtools?: CRDevTools;
    private _version;
    private _majorVersion;
    _revision: string;
    private _tracingRecording;
    private _tracingClient;
    private _userAgent;
    static connect(parent: SdkObject, transport: ConnectionTransport, options: BrowserOptions, devtools?: CRDevTools): Promise<CRBrowser>;
    constructor(parent: SdkObject, connection: CRConnection, options: BrowserOptions);
    doCreateNewContext(options: types.BrowserContextOptions): Promise<BrowserContext>;
    contexts(): BrowserContext[];
    version(): string;
    majorVersion(): number;
    userAgent(): string;
    _platform(): 'mac' | 'linux' | 'win';
    isClank(): boolean;
    _waitForAllPagesToBeInitialized(): Promise<void>;
    _onAttachedToTarget({ targetInfo, sessionId, waitingForDebugger }: Protocol.Target.attachedToTargetPayload): void;
    _onDetachedFromTarget(payload: Protocol.Target.detachedFromTargetPayload): void;
    private _didDisconnect;
    private _findOwningPage;
    _onDownloadWillBegin(payload: Protocol.Browser.downloadWillBeginPayload): void;
    _onDownloadProgress(payload: any): void;
    _closePage(crPage: CRPage): Promise<void>;
    newBrowserCDPSession(): Promise<CDPSession>;
    startTracing(page?: Page, options?: {
        screenshots?: boolean;
        categories?: string[];
    }): Promise<void>;
    stopTracing(): Promise<Artifact>;
    isConnected(): boolean;
    _clientRootSession(): Promise<CDPSession>;
}
declare const CREvents: {
    readonly ServiceWorker: "serviceworker";
};
export type CREventsMap = {
    [CREvents.ServiceWorker]: [serviceWorker: CRServiceWorker];
};
export declare class CRBrowserContext extends BrowserContext<CREventsMap> {
    static CREvents: {
        readonly ServiceWorker: "serviceworker";
    };
    readonly _browser: CRBrowser;
    constructor(browser: CRBrowser, browserContextId: string | undefined, options: types.BrowserContextOptions);
    _initialize(): Promise<void>;
    private _crPages;
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
    doClose(reason: string | undefined): Promise<void>;
    stopVideoRecording(): Promise<void>;
    onClosePersistent(): void;
    clearCache(): Promise<void>;
    cancelDownload(guid: string): Promise<void>;
    serviceWorkers(): Worker[];
    newCDPSession(page: Page | Frame): Promise<CDPSession>;
}
export {};
