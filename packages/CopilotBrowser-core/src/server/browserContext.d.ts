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
import { Clock } from './clock';
import { Debugger } from './debugger';
import { DialogManager } from './dialog';
import { BrowserContextAPIRequestContext } from './fetch';
import { HarRecorder } from './har/harRecorder';
import { EventMap, SdkObject } from './instrumentation';
import * as network from './network';
import { InitScript } from './page';
import { Page, PageBinding } from './page';
import { Selectors } from './selectors';
import { Tracing } from './trace/recorder/tracing';
import type { Artifact } from './artifact';
import type { Browser, BrowserOptions } from './browser';
import type { ConsoleMessage } from './console';
import type { Download } from './download';
import type * as frames from './frames';
import type { Progress } from './progress';
import type { ClientCertificatesProxy } from './socksClientCertificatesInterceptor';
import type * as types from './types';
import type * as channels from '@protocol/channels';
declare const BrowserContextEvent: {
    readonly Console: "console";
    readonly Close: "close";
    readonly Page: "page";
    readonly PageError: "pageerror";
    readonly Request: "request";
    readonly Response: "response";
    readonly RequestFailed: "requestfailed";
    readonly RequestFinished: "requestfinished";
    readonly RequestAborted: "requestaborted";
    readonly RequestFulfilled: "requestfulfilled";
    readonly RequestContinued: "requestcontinued";
    readonly BeforeClose: "beforeclose";
    readonly RecorderEvent: "recorderevent";
    readonly PageClosed: "pageclosed";
    readonly InternalFrameNavigatedToNewDocument: "internalframenavigatedtonewdocument";
};
export type BrowserContextEventMap = {
    [BrowserContextEvent.Console]: [message: ConsoleMessage];
    [BrowserContextEvent.Close]: [];
    [BrowserContextEvent.Page]: [page: Page];
    [BrowserContextEvent.PageError]: [error: Error, page: Page];
    [BrowserContextEvent.Request]: [request: network.Request];
    [BrowserContextEvent.Response]: [response: network.Response];
    [BrowserContextEvent.RequestFailed]: [request: network.Request];
    [BrowserContextEvent.RequestFinished]: [requestAndResponse: {
        request: network.Request;
        response: network.Response | null;
    }];
    [BrowserContextEvent.RequestAborted]: [request: network.Request];
    [BrowserContextEvent.RequestFulfilled]: [request: network.Request];
    [BrowserContextEvent.RequestContinued]: [request: network.Request];
    [BrowserContextEvent.BeforeClose]: [];
    [BrowserContextEvent.RecorderEvent]: [event: {
        event: 'actionAdded' | 'actionUpdated' | 'signalAdded';
        data: any;
        page: Page;
        code: string;
    }];
    [BrowserContextEvent.PageClosed]: [page: Page];
    [BrowserContextEvent.InternalFrameNavigatedToNewDocument]: [frame: frames.Frame, page: Page];
};
export declare abstract class BrowserContext<EM extends EventMap = EventMap> extends SdkObject<BrowserContextEventMap | EM> {
    static Events: {
        readonly Console: "console";
        readonly Close: "close";
        readonly Page: "page";
        readonly PageError: "pageerror";
        readonly Request: "request";
        readonly Response: "response";
        readonly RequestFailed: "requestfailed";
        readonly RequestFinished: "requestfinished";
        readonly RequestAborted: "requestaborted";
        readonly RequestFulfilled: "requestfulfilled";
        readonly RequestContinued: "requestcontinued";
        readonly BeforeClose: "beforeclose";
        readonly RecorderEvent: "recorderevent";
        readonly PageClosed: "pageclosed";
        readonly InternalFrameNavigatedToNewDocument: "internalframenavigatedtonewdocument";
    };
    readonly _pageBindings: Map<string, PageBinding>;
    readonly _options: types.BrowserContextOptions;
    readonly requestInterceptors: network.RouteHandler[];
    private _isPersistentContext;
    private _closedStatus;
    readonly _closePromise: Promise<Error>;
    private _closePromiseFulfill;
    readonly _permissions: Map<string, string[]>;
    readonly _downloads: Set<Download>;
    readonly _browser: Browser;
    readonly _browserContextId: string | undefined;
    private _selectors;
    private _origins;
    readonly _harRecorders: Map<string, HarRecorder>;
    readonly tracing: Tracing;
    readonly fetchRequest: BrowserContextAPIRequestContext;
    private _customCloseHandler?;
    readonly _tempDirs: string[];
    private _creatingStorageStatePage;
    bindingsInitScript?: InitScript;
    initScripts: InitScript[];
    private _routesInFlight;
    private _debugger;
    _closeReason: string | undefined;
    readonly clock: Clock;
    _clientCertificatesProxy: ClientCertificatesProxy | undefined;
    private _copilotbrowserBindingExposed?;
    readonly dialogManager: DialogManager;
    private _consoleApiExposed;
    private _devtools;
    constructor(browser: Browser, options: types.BrowserContextOptions, browserContextId: string | undefined);
    isPersistentContext(): boolean;
    selectors(): Selectors;
    _initialize(): Promise<void>;
    debugger(): Debugger;
    exposeConsoleApi(): Promise<void>;
    _ensureVideosPath(): Promise<void>;
    canResetForReuse(): boolean;
    static reusableContextHash(params: channels.BrowserNewContextForReuseParams): string;
    resetForReuse(progress: Progress, params: channels.BrowserNewContextForReuseParams | null): Promise<void>;
    _browserClosed(): void;
    private _didCloseInternal;
    pages(): Page[];
    abstract possiblyUninitializedPages(): Page[];
    abstract doCreateNewPage(): Promise<Page>;
    abstract addCookies(cookies: channels.SetNetworkCookie[]): Promise<void>;
    abstract setGeolocation(geolocation?: types.Geolocation): Promise<void>;
    abstract setUserAgent(userAgent: string | undefined): Promise<void>;
    abstract cancelDownload(uuid: string): Promise<void>;
    abstract clearCache(): Promise<void>;
    protected abstract doGetCookies(urls: string[]): Promise<channels.NetworkCookie[]>;
    protected abstract doClearCookies(): Promise<void>;
    protected abstract doGrantPermissions(origin: string, permissions: string[]): Promise<void>;
    protected abstract doClearPermissions(): Promise<void>;
    protected abstract doSetHTTPCredentials(httpCredentials?: types.Credentials): Promise<void>;
    protected abstract doAddInitScript(initScript: InitScript): Promise<void>;
    protected abstract doRemoveInitScripts(initScripts: InitScript[]): Promise<void>;
    protected abstract doUpdateExtraHTTPHeaders(): Promise<void>;
    protected abstract doUpdateOffline(): Promise<void>;
    protected abstract doUpdateRequestInterception(): Promise<void>;
    protected abstract doUpdateDefaultViewport(): Promise<void>;
    protected abstract doUpdateDefaultEmulatedMedia(): Promise<void>;
    protected abstract doExposecopilotbrowserBinding(): Promise<void>;
    protected abstract doClose(reason: string | undefined): Promise<void>;
    protected abstract onClosePersistent(): void;
    cookies(urls?: string | string[] | undefined): Promise<channels.NetworkCookie[]>;
    clearCookies(options: {
        name?: string | RegExp;
        domain?: string | RegExp;
        path?: string | RegExp;
    }): Promise<void>;
    setHTTPCredentials(httpCredentials?: types.Credentials): Promise<void>;
    getBindingClient(name: string): unknown | undefined;
    exposecopilotbrowserBindingIfNeeded(): Promise<void>;
    needscopilotbrowserBinding(): boolean;
    exposeBinding(progress: Progress, name: string, needsHandle: boolean, copilotbrowserBinding: frames.FunctionWithSource, forClient?: unknown): Promise<PageBinding>;
    removeExposedBindings(bindings: PageBinding[]): Promise<void>;
    grantPermissions(permissions: string[], origin?: string): Promise<void>;
    clearPermissions(): Promise<void>;
    setExtraHTTPHeaders(progress: Progress, headers: types.HeadersArray): Promise<void>;
    setOffline(progress: Progress, offline: boolean): Promise<void>;
    _loadDefaultContextAsIs(progress: Progress): Promise<Page | undefined>;
    _loadDefaultContext(progress: Progress): Promise<void>;
    protected _authenticateProxyViaHeader(): void;
    protected _authenticateProxyViaCredentials(): void;
    addInitScript(progress: Progress | undefined, source: string): Promise<InitScript>;
    removeInitScripts(initScripts: InitScript[]): Promise<void>;
    addRequestInterceptor(progress: Progress, handler: network.RouteHandler): Promise<void>;
    removeRequestInterceptor(handler: network.RouteHandler): Promise<void>;
    devtoolsStart(): Promise<string>;
    isClosingOrClosed(): boolean;
    private _deleteAllDownloads;
    private _deleteAllTempDirs;
    setCustomCloseHandler(handler: (() => Promise<any>) | undefined): void;
    close(options: {
        reason?: string;
    }): Promise<void>;
    newPage(progress: Progress, forStorageState?: boolean): Promise<Page>;
    addVisitedOrigin(origin: string): void;
    storageState(progress: Progress, indexedDB?: boolean): Promise<channels.BrowserContextStorageStateResult>;
    isCreatingStorageStatePage(): boolean;
    setStorageState(progress: Progress, state: channels.BrowserNewContextParams['storageState'], mode: 'initial' | 'resetForReuse' | 'api'): Promise<void>;
    extendInjectedScript(source: string, arg?: any): Promise<void[][]>;
    safeNonStallingEvaluateInAllFrames(expression: string, world: types.World, options?: {
        throwOnJSErrors?: boolean;
    }): Promise<void>;
    harStart(page: Page | null, options: channels.RecordHarOptions): string;
    harExport(harId: string | undefined): Promise<Artifact>;
    addRouteInFlight(route: network.Route): void;
    removeRouteInFlight(route: network.Route): void;
    notifyRoutesInFlightAboutRemovedHandler(handler: network.RouteHandler): Promise<void>;
}
export declare function validateBrowserContextOptions(options: types.BrowserContextOptions, browserOptions: BrowserOptions): void;
export declare function validateVideoSize(size: types.Size | undefined, viewport: types.Size | undefined): types.Size;
export declare function verifyGeolocation(geolocation?: types.Geolocation): asserts geolocation is types.Geolocation;
export declare function verifyClientCertificates(clientCertificates?: types.BrowserContextOptions['clientCertificates']): void;
export declare function normalizeProxySettings(proxy: types.ProxySettings): types.ProxySettings;
export {};
