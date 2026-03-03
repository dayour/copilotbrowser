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
import { Page, Worker } from '../page';
import { Dispatcher } from './dispatcher';
import { SdkObject } from '../instrumentation';
import type { BrowserContext } from '../browserContext';
import type { BrowserContextDispatcher } from './browserContextDispatcher';
import type { Frame } from '../frames';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class PageDispatcher extends Dispatcher<Page, channels.PageChannel, BrowserContextDispatcher> implements channels.PageChannel {
    _type_EventTarget: boolean;
    _type_Page: boolean;
    private _page;
    _subscriptions: Set<channels.PageUpdateSubscriptionParams>;
    _webSocketInterceptionPatterns: channels.PageSetWebSocketInterceptionPatternsParams['patterns'];
    private _bindings;
    private _initScripts;
    private _requestInterceptor;
    private _interceptionUrlMatchers;
    private _routeWebSocketInitScript;
    private _locatorHandlers;
    private _jsCoverageActive;
    private _cssCoverageActive;
    static from(parentScope: BrowserContextDispatcher, page: Page): PageDispatcher;
    static fromNullable(parentScope: BrowserContextDispatcher, page: Page | null | undefined): PageDispatcher | undefined;
    private constructor();
    page(): Page;
    exposeBinding(params: channels.PageExposeBindingParams, progress: Progress): Promise<void>;
    setExtraHTTPHeaders(params: channels.PageSetExtraHTTPHeadersParams, progress: Progress): Promise<void>;
    reload(params: channels.PageReloadParams, progress: Progress): Promise<channels.PageReloadResult>;
    goBack(params: channels.PageGoBackParams, progress: Progress): Promise<channels.PageGoBackResult>;
    goForward(params: channels.PageGoForwardParams, progress: Progress): Promise<channels.PageGoForwardResult>;
    requestGC(params: channels.PageRequestGCParams, progress: Progress): Promise<channels.PageRequestGCResult>;
    registerLocatorHandler(params: channels.PageRegisterLocatorHandlerParams, progress: Progress): Promise<channels.PageRegisterLocatorHandlerResult>;
    resolveLocatorHandlerNoReply(params: channels.PageResolveLocatorHandlerNoReplyParams, progress: Progress): Promise<void>;
    unregisterLocatorHandler(params: channels.PageUnregisterLocatorHandlerParams, progress: Progress): Promise<void>;
    emulateMedia(params: channels.PageEmulateMediaParams, progress: Progress): Promise<void>;
    setViewportSize(params: channels.PageSetViewportSizeParams, progress: Progress): Promise<void>;
    addInitScript(params: channels.PageAddInitScriptParams, progress: Progress): Promise<void>;
    setNetworkInterceptionPatterns(params: channels.PageSetNetworkInterceptionPatternsParams, progress: Progress): Promise<void>;
    setWebSocketInterceptionPatterns(params: channels.PageSetWebSocketInterceptionPatternsParams, progress: Progress): Promise<void>;
    expectScreenshot(params: channels.PageExpectScreenshotParams, progress: Progress): Promise<channels.PageExpectScreenshotResult>;
    screenshot(params: channels.PageScreenshotParams, progress: Progress): Promise<channels.PageScreenshotResult>;
    close(params: channels.PageCloseParams, progress: Progress): Promise<void>;
    updateSubscription(params: channels.PageUpdateSubscriptionParams, progress: Progress): Promise<void>;
    keyboardDown(params: channels.PageKeyboardDownParams, progress: Progress): Promise<void>;
    keyboardUp(params: channels.PageKeyboardUpParams, progress: Progress): Promise<void>;
    keyboardInsertText(params: channels.PageKeyboardInsertTextParams, progress: Progress): Promise<void>;
    keyboardType(params: channels.PageKeyboardTypeParams, progress: Progress): Promise<void>;
    keyboardPress(params: channels.PageKeyboardPressParams, progress: Progress): Promise<void>;
    clearConsoleMessages(params: channels.PageClearConsoleMessagesParams, progress: Progress): Promise<channels.PageClearConsoleMessagesResult>;
    consoleMessages(params: channels.PageConsoleMessagesParams, progress: Progress): Promise<channels.PageConsoleMessagesResult>;
    clearPageErrors(params: channels.PageClearPageErrorsParams, progress: Progress): Promise<channels.PageClearPageErrorsResult>;
    pageErrors(params: channels.PagePageErrorsParams, progress: Progress): Promise<channels.PagePageErrorsResult>;
    mouseMove(params: channels.PageMouseMoveParams, progress: Progress): Promise<void>;
    mouseDown(params: channels.PageMouseDownParams, progress: Progress): Promise<void>;
    mouseUp(params: channels.PageMouseUpParams, progress: Progress): Promise<void>;
    mouseClick(params: channels.PageMouseClickParams, progress: Progress): Promise<void>;
    mouseWheel(params: channels.PageMouseWheelParams, progress: Progress): Promise<void>;
    touchscreenTap(params: channels.PageTouchscreenTapParams, progress: Progress): Promise<void>;
    pdf(params: channels.PagePdfParams, progress: Progress): Promise<channels.PagePdfResult>;
    requests(params: channels.PageRequestsParams, progress: Progress): Promise<channels.PageRequestsResult>;
    snapshotForAI(params: channels.PageSnapshotForAIParams, progress: Progress): Promise<channels.PageSnapshotForAIResult>;
    bringToFront(params: channels.PageBringToFrontParams, progress: Progress): Promise<void>;
    videoStart(params: channels.PageVideoStartParams, progress: Progress): Promise<channels.PageVideoStartResult>;
    videoStop(params: channels.PageVideoStopParams, progress: Progress): Promise<channels.PageVideoStopResult>;
    startJSCoverage(params: channels.PageStartJSCoverageParams, progress: Progress): Promise<void>;
    stopJSCoverage(params: channels.PageStopJSCoverageParams, progress: Progress): Promise<channels.PageStopJSCoverageResult>;
    startCSSCoverage(params: channels.PageStartCSSCoverageParams, progress: Progress): Promise<void>;
    stopCSSCoverage(params: channels.PageStopCSSCoverageParams, progress: Progress): Promise<channels.PageStopCSSCoverageResult>;
    agent(params: channels.PageAgentParams, progress: Progress): Promise<channels.PageAgentResult>;
    _onFrameAttached(frame: Frame): void;
    _onFrameDetached(frame: Frame): void;
    _onDispose(): void;
    setDockTile(params: channels.PageSetDockTileParams): Promise<void>;
}
export declare class WorkerDispatcher extends Dispatcher<Worker, channels.WorkerChannel, PageDispatcher | BrowserContextDispatcher> implements channels.WorkerChannel {
    _type_Worker: boolean;
    _type_EventTarget: boolean;
    readonly _subscriptions: Set<channels.WorkerUpdateSubscriptionParams>;
    static fromNullable(scope: PageDispatcher | BrowserContextDispatcher, worker: Worker | null): WorkerDispatcher | undefined;
    constructor(scope: PageDispatcher | BrowserContextDispatcher, worker: Worker);
    evaluateExpression(params: channels.WorkerEvaluateExpressionParams, progress: Progress): Promise<channels.WorkerEvaluateExpressionResult>;
    evaluateExpressionHandle(params: channels.WorkerEvaluateExpressionHandleParams, progress: Progress): Promise<channels.WorkerEvaluateExpressionHandleResult>;
    updateSubscription(params: channels.WorkerUpdateSubscriptionParams, progress: Progress): Promise<void>;
}
export declare class BindingCallDispatcher extends Dispatcher<SdkObject, channels.BindingCallChannel, PageDispatcher | BrowserContextDispatcher> implements channels.BindingCallChannel {
    _type_BindingCall: boolean;
    private _resolve;
    private _reject;
    private _promise;
    constructor(scope: PageDispatcher, name: string, needsHandle: boolean, source: {
        context: BrowserContext;
        page: Page;
        frame: Frame;
    }, args: any[]);
    promise(): Promise<any>;
    resolve(params: channels.BindingCallResolveParams, progress: Progress): Promise<void>;
    reject(params: channels.BindingCallRejectParams, progress: Progress): Promise<void>;
}
