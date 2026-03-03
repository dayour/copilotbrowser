/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
import { BrowserContext } from '../browserContext';
import { Dispatcher } from './dispatcher';
import { PageDispatcher, WorkerDispatcher } from './pageDispatcher';
import { JSHandleDispatcher } from './jsHandleDispatcher';
import type { ConsoleMessage } from '../console';
import type { DispatcherScope } from './dispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class BrowserContextDispatcher extends Dispatcher<BrowserContext, channels.BrowserContextChannel, DispatcherScope> implements channels.BrowserContextChannel {
    _type_EventTarget: boolean;
    _type_BrowserContext: boolean;
    private _context;
    private _subscriptions;
    _webSocketInterceptionPatterns: channels.BrowserContextSetWebSocketInterceptionPatternsParams['patterns'];
    private _bindings;
    private _initScripts;
    private _dialogHandler;
    private _clockPaused;
    private _requestInterceptor;
    private _interceptionUrlMatchers;
    private _routeWebSocketInitScript;
    static from(parentScope: DispatcherScope, context: BrowserContext): BrowserContextDispatcher;
    private constructor();
    private _shouldDispatchNetworkEvent;
    private _shouldDispatchEvent;
    serializeConsoleMessage(message: ConsoleMessage, jsScope: PageDispatcher | WorkerDispatcher): {
        type: string;
        text: string;
        args: JSHandleDispatcher<import("./jsHandleDispatcher").JSHandleDispatcherParentScope>[];
        location: import("../types").ConsoleMessageLocation;
        timestamp: number;
    };
    createTempFiles(params: channels.BrowserContextCreateTempFilesParams, progress: Progress): Promise<channels.BrowserContextCreateTempFilesResult>;
    exposeBinding(params: channels.BrowserContextExposeBindingParams, progress: Progress): Promise<void>;
    newPage(params: channels.BrowserContextNewPageParams, progress: Progress): Promise<channels.BrowserContextNewPageResult>;
    cookies(params: channels.BrowserContextCookiesParams, progress: Progress): Promise<channels.BrowserContextCookiesResult>;
    addCookies(params: channels.BrowserContextAddCookiesParams, progress: Progress): Promise<void>;
    clearCookies(params: channels.BrowserContextClearCookiesParams, progress: Progress): Promise<void>;
    grantPermissions(params: channels.BrowserContextGrantPermissionsParams, progress: Progress): Promise<void>;
    clearPermissions(params: channels.BrowserContextClearPermissionsParams, progress: Progress): Promise<void>;
    setGeolocation(params: channels.BrowserContextSetGeolocationParams, progress: Progress): Promise<void>;
    setExtraHTTPHeaders(params: channels.BrowserContextSetExtraHTTPHeadersParams, progress: Progress): Promise<void>;
    setOffline(params: channels.BrowserContextSetOfflineParams, progress: Progress): Promise<void>;
    setHTTPCredentials(params: channels.BrowserContextSetHTTPCredentialsParams, progress: Progress): Promise<void>;
    addInitScript(params: channels.BrowserContextAddInitScriptParams, progress: Progress): Promise<void>;
    setNetworkInterceptionPatterns(params: channels.BrowserContextSetNetworkInterceptionPatternsParams, progress: Progress): Promise<void>;
    setWebSocketInterceptionPatterns(params: channels.PageSetWebSocketInterceptionPatternsParams, progress: Progress): Promise<void>;
    storageState(params: channels.BrowserContextStorageStateParams, progress: Progress): Promise<channels.BrowserContextStorageStateResult>;
    setStorageState(params: channels.BrowserContextSetStorageStateParams, progress: Progress): Promise<void>;
    close(params: channels.BrowserContextCloseParams, progress: Progress): Promise<void>;
    enableRecorder(params: channels.BrowserContextEnableRecorderParams, progress: Progress): Promise<void>;
    disableRecorder(params: channels.BrowserContextDisableRecorderParams, progress: Progress): Promise<void>;
    exposeConsoleApi(params: channels.BrowserContextExposeConsoleApiParams, progress: Progress): Promise<void>;
    pause(params: channels.BrowserContextPauseParams, progress: Progress): Promise<void>;
    newCDPSession(params: channels.BrowserContextNewCDPSessionParams, progress: Progress): Promise<channels.BrowserContextNewCDPSessionResult>;
    harStart(params: channels.BrowserContextHarStartParams, progress: Progress): Promise<channels.BrowserContextHarStartResult>;
    harExport(params: channels.BrowserContextHarExportParams, progress: Progress): Promise<channels.BrowserContextHarExportResult>;
    clockFastForward(params: channels.BrowserContextClockFastForwardParams, progress: Progress): Promise<channels.BrowserContextClockFastForwardResult>;
    clockInstall(params: channels.BrowserContextClockInstallParams, progress: Progress): Promise<channels.BrowserContextClockInstallResult>;
    clockPauseAt(params: channels.BrowserContextClockPauseAtParams, progress: Progress): Promise<channels.BrowserContextClockPauseAtResult>;
    clockResume(params: channels.BrowserContextClockResumeParams, progress: Progress): Promise<channels.BrowserContextClockResumeResult>;
    clockRunFor(params: channels.BrowserContextClockRunForParams, progress: Progress): Promise<channels.BrowserContextClockRunForResult>;
    clockSetFixedTime(params: channels.BrowserContextClockSetFixedTimeParams, progress: Progress): Promise<channels.BrowserContextClockSetFixedTimeResult>;
    clockSetSystemTime(params: channels.BrowserContextClockSetSystemTimeParams, progress: Progress): Promise<channels.BrowserContextClockSetSystemTimeResult>;
    devtoolsStart(params: channels.BrowserContextDevtoolsStartParams, progress: Progress): Promise<channels.BrowserContextDevtoolsStartResult>;
    updateSubscription(params: channels.BrowserContextUpdateSubscriptionParams, progress: Progress): Promise<void>;
    registerSelectorEngine(params: channels.BrowserContextRegisterSelectorEngineParams, progress: Progress): Promise<void>;
    setTestIdAttributeName(params: channels.BrowserContextSetTestIdAttributeNameParams, progress: Progress): Promise<void>;
    _onDispose(): void;
}
