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
import { Browser } from './browser';
import { ChannelOwner } from './channelOwner';
import { Clock } from './clock';
import { APIRequestContext } from './fetch';
import { Frame } from './frame';
import * as network from './network';
import { BindingCall, Page } from './page';
import { Tracing } from './tracing';
import { Worker } from './worker';
import { TimeoutSettings } from './timeoutSettings';
import type { BrowserContextOptions, Headers, SetStorageState, StorageState, WaitForEventOptions } from './types';
import type * as structs from '../../types/structs';
import type * as api from '../../types/types';
import type { URLMatch } from '../utils/isomorphic/urlMatch';
import type { Platform } from './platform';
import type * as channels from '@protocol/channels';
import type * as actions from '@recorder/actions';
interface RecorderEventSink {
    actionAdded?(page: Page, actionInContext: actions.ActionInContext, code: string): void;
    actionUpdated?(page: Page, actionInContext: actions.ActionInContext, code: string): void;
    signalAdded?(page: Page, signal: actions.SignalInContext): void;
}
export declare class BrowserContext extends ChannelOwner<channels.BrowserContextChannel> {
    _pages: Set<Page>;
    _routes: network.RouteHandler[];
    _webSocketRoutes: network.WebSocketRouteHandler[];
    _browser: Browser | null;
    readonly _bindings: Map<string, (source: structs.BindingSource, ...args: any[]) => any>;
    _timeoutSettings: TimeoutSettings;
    _ownerPage: Page | undefined;
    _forReuse: boolean;
    private _closedPromise;
    readonly _options: channels.BrowserNewContextParams;
    readonly request: APIRequestContext;
    readonly tracing: Tracing;
    readonly clock: Clock;
    readonly _serviceWorkers: Set<Worker>;
    private _harRecorders;
    _closingStatus: 'none' | 'closing' | 'closed';
    private _closeReason;
    private _harRouters;
    private _onRecorderEventSink;
    private _allowedProtocols;
    private _allowedDirectories;
    static from(context: channels.BrowserContextChannel): BrowserContext;
    static fromNullable(context: channels.BrowserContextChannel | null): BrowserContext | null;
    constructor(parent: ChannelOwner, type: string, guid: string, initializer: channels.BrowserContextInitializer);
    _initializeHarFromOptions(recordHar: BrowserContextOptions['recordHar']): Promise<void>;
    private _onPage;
    private _onRequest;
    private _onResponse;
    private _onRequestFailed;
    private _onRequestFinished;
    _onRoute(route: network.Route): Promise<void>;
    _onWebSocketRoute(webSocketRoute: network.WebSocketRoute): Promise<void>;
    _onBinding(bindingCall: BindingCall): Promise<void>;
    private _serviceWorkerScope;
    setDefaultNavigationTimeout(timeout: number | undefined): void;
    setDefaultTimeout(timeout: number | undefined): void;
    browser(): Browser | null;
    pages(): Page[];
    newPage(): Promise<Page>;
    cookies(urls?: string | string[]): Promise<network.NetworkCookie[]>;
    addCookies(cookies: network.SetNetworkCookieParam[]): Promise<void>;
    clearCookies(options?: network.ClearNetworkCookieOptions): Promise<void>;
    grantPermissions(permissions: string[], options?: {
        origin?: string;
    }): Promise<void>;
    clearPermissions(): Promise<void>;
    setGeolocation(geolocation: {
        longitude: number;
        latitude: number;
        accuracy?: number;
    } | null): Promise<void>;
    setExtraHTTPHeaders(headers: Headers): Promise<void>;
    setOffline(offline: boolean): Promise<void>;
    setHTTPCredentials(httpCredentials: {
        username: string;
        password: string;
    } | null): Promise<void>;
    addInitScript(script: Function | string | {
        path?: string;
        content?: string;
    }, arg?: any): Promise<void>;
    exposeBinding(name: string, callback: (source: structs.BindingSource, ...args: any[]) => any, options?: {
        handle?: boolean;
    }): Promise<void>;
    exposeFunction(name: string, callback: Function): Promise<void>;
    route(url: URLMatch, handler: network.RouteHandlerCallback, options?: {
        times?: number;
    }): Promise<void>;
    routeWebSocket(url: URLMatch, handler: network.WebSocketRouteHandlerCallback): Promise<void>;
    _recordIntoHAR(har: string, page: Page | null, options?: {
        url?: string | RegExp;
        updateContent?: 'attach' | 'embed' | 'omit';
        updateMode?: 'minimal' | 'full';
    }): Promise<void>;
    routeFromHAR(har: string, options?: {
        url?: string | RegExp;
        notFound?: 'abort' | 'fallback';
        update?: boolean;
        updateContent?: 'attach' | 'embed';
        updateMode?: 'minimal' | 'full';
    }): Promise<void>;
    private _disposeHarRouters;
    unrouteAll(options?: {
        behavior?: 'wait' | 'ignoreErrors' | 'default';
    }): Promise<void>;
    unroute(url: URLMatch, handler?: network.RouteHandlerCallback): Promise<void>;
    private _unrouteInternal;
    private _updateInterceptionPatterns;
    private _updateWebSocketInterceptionPatterns;
    _effectiveCloseReason(): string | undefined;
    waitForEvent(event: string, optionsOrPredicate?: WaitForEventOptions): Promise<any>;
    storageState(options?: {
        path?: string;
        indexedDB?: boolean;
    }): Promise<StorageState>;
    setStorageState(storageState: string | SetStorageState): Promise<void>;
    backgroundPages(): Page[];
    serviceWorkers(): Worker[];
    newCDPSession(page: Page | Frame): Promise<api.CDPSession>;
    _onClose(): void;
    [Symbol.asyncDispose](): Promise<void>;
    close(options?: {
        reason?: string;
    }): Promise<void>;
    _enableRecorder(params: channels.BrowserContextEnableRecorderParams, eventSink?: RecorderEventSink): Promise<void>;
    _disableRecorder(): Promise<void>;
    _exposeConsoleApi(): Promise<void>;
    _setAllowedProtocols(protocols: string[]): void;
    _checkUrlAllowed(url: string): void;
    _setAllowedDirectories(rootDirectories: string[]): void;
    _checkFileAccess(filePath: string): void;
    _devtoolsStart(): Promise<{
        url: string;
    }>;
}
export declare function prepareBrowserContextParams(platform: Platform, options: BrowserContextOptions): Promise<channels.BrowserNewContextParams>;
export declare function toClientCertificatesProtocol(platform: Platform, certs?: BrowserContextOptions['clientCertificates']): Promise<channels.copilotbrowserNewRequestParams['clientCertificates']>;
export {};
