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
import { BrowserContext } from './browserContext';
import * as dom from './dom';
import { FrameSelectors } from './frameSelectors';
import { SdkObject } from './instrumentation';
import * as js from './javascript';
import * as network from './network';
import { Page } from './page';
import * as types from './types';
import { LongStandingScope } from '../utils';
import type { ConsoleMessage } from './console';
import type { FrameExpectParams } from '@injected/injectedScript';
import type { Progress } from './progress';
import type { ScreenshotOptions } from './screenshotter';
import type { ParsedSelector } from '../utils/isomorphic/selectorParser';
import type * as channels from '@protocol/channels';
type DocumentInfo = {
    documentId: string | undefined;
    request: network.Request | undefined;
};
export type GotoResult = {
    newDocumentId?: string;
};
type ConsoleTagHandler = () => void;
type RegularLifecycleEvent = Exclude<types.LifecycleEvent, 'networkidle'>;
export type FunctionWithSource = (source: {
    context: BrowserContext;
    page: Page;
    frame: Frame;
}, ...args: any) => any;
export type NavigationEvent = {
    url: string;
    name: string;
    newDocument?: DocumentInfo;
    error?: Error;
    isPublic?: boolean;
};
export declare class NavigationAbortedError extends Error {
    readonly documentId?: string;
    constructor(documentId: string | undefined, message: string);
}
export type ExpectResult = {
    matches: boolean;
    received?: any;
    log?: string[];
    timedOut?: boolean;
    errorMessage?: string;
};
export declare class FrameManager {
    private _page;
    private _frames;
    private _mainFrame;
    readonly _consoleMessageTags: Map<string, ConsoleTagHandler>;
    readonly _signalBarriers: Set<SignalBarrier>;
    private _webSockets;
    private _nextFrameSeq;
    constructor(page: Page);
    nextFrameSeq(): number;
    createDummyMainFrameIfNeeded(): void;
    dispose(): void;
    mainFrame(): Frame;
    frames(): Frame[];
    frame(frameId: string): Frame | null;
    frameAttached(frameId: string, parentFrameId: string | null | undefined): Frame;
    waitForSignalsCreatedBy<T>(progress: Progress, waitAfter: boolean, action: () => Promise<T>): Promise<T>;
    frameWillPotentiallyRequestNavigation(): void;
    frameDidPotentiallyRequestNavigation(): void;
    frameRequestedNavigation(frameId: string, documentId?: string): void;
    frameCommittedNewDocumentNavigation(frameId: string, url: string, name: string, documentId: string, initial: boolean): void;
    frameCommittedSameDocumentNavigation(frameId: string, url: string): void;
    frameAbortedNavigation(frameId: string, errorText: string, documentId?: string): void;
    frameDetached(frameId: string): void;
    frameLifecycleEvent(frameId: string, event: RegularLifecycleEvent): void;
    requestStarted(request: network.Request, route?: network.RouteDelegate): void;
    requestReceivedResponse(response: network.Response): void;
    reportRequestFinished(request: network.Request, response: network.Response | null): void;
    requestFailed(request: network.Request, canceled: boolean): void;
    removeChildFramesRecursively(frame: Frame): void;
    private _removeFramesRecursively;
    private _inflightRequestFinished;
    private _inflightRequestStarted;
    interceptConsoleMessage(message: ConsoleMessage): boolean;
    clearWebSockets(frame: Frame): void;
    onWebSocketCreated(requestId: string, url: string): void;
    onWebSocketRequest(requestId: string): void;
    onWebSocketResponse(requestId: string, status: number, statusText: string): void;
    onWebSocketFrameSent(requestId: string, opcode: number, data: string): void;
    webSocketFrameReceived(requestId: string, opcode: number, data: string): void;
    webSocketClosed(requestId: string): void;
    webSocketError(requestId: string, errorMessage: string): void;
    private _fireInternalFrameNavigation;
}
declare const FrameEvent: {
    readonly InternalNavigation: "internalnavigation";
    readonly AddLifecycle: "addlifecycle";
    readonly RemoveLifecycle: "removelifecycle";
};
export type FrameEventMap = {
    [FrameEvent.InternalNavigation]: [event: NavigationEvent];
    [FrameEvent.AddLifecycle]: [event: types.LifecycleEvent];
    [FrameEvent.RemoveLifecycle]: [event: types.LifecycleEvent];
};
export declare class Frame extends SdkObject<FrameEventMap> {
    static Events: {
        readonly InternalNavigation: "internalnavigation";
        readonly AddLifecycle: "addlifecycle";
        readonly RemoveLifecycle: "removelifecycle";
    };
    _id: string;
    readonly seq: number;
    _firedLifecycleEvents: Set<types.LifecycleEvent>;
    private _firedNetworkIdleSelf;
    _currentDocument: DocumentInfo;
    private _pendingDocument;
    readonly _page: Page;
    private _parentFrame;
    _url: string;
    private _contextData;
    private _childFrames;
    _name: string;
    _inflightRequests: Set<network.Request>;
    private _networkIdleTimer;
    private _setContentCounter;
    readonly _detachedScope: LongStandingScope;
    private _raceAgainstEvaluationStallingEventsPromises;
    readonly _redirectedNavigations: Map<string, {
        url: string;
        gotoPromise: Promise<network.Response | null>;
    }>;
    readonly selectors: FrameSelectors;
    constructor(page: Page, id: string, parentFrame: Frame | null);
    isDetached(): boolean;
    _onLifecycleEvent(event: RegularLifecycleEvent): void;
    _onClearLifecycle(): void;
    setPendingDocument(documentInfo: DocumentInfo | undefined): void;
    pendingDocument(): DocumentInfo | undefined;
    _invalidateNonStallingEvaluations(message: string): void;
    raceAgainstEvaluationStallingEvents<T>(cb: () => Promise<T>): Promise<T>;
    nonStallingRawEvaluateInExistingMainContext(expression: string): Promise<any>;
    nonStallingEvaluateInExistingContext(expression: string, world: types.World): Promise<any>;
    _recalculateNetworkIdle(frameThatAllowsRemovingNetworkIdle?: Frame): void;
    raceNavigationAction(progress: Progress, action: () => Promise<network.Response | null>): Promise<network.Response | null>;
    redirectNavigation(url: string, documentId: string, referer: string | undefined): void;
    goto(progress: Progress, url: string, options?: types.GotoOptions): Promise<network.Response | null>;
    gotoImpl(progress: Progress, url: string, options: types.GotoOptions): Promise<network.Response | null>;
    _waitForNavigation(progress: Progress, requiresNewDocument: boolean, options: types.NavigateOptions): Promise<network.Response | null>;
    waitForLoadState(progress: Progress, state: types.LifecycleEvent): Promise<void>;
    frameElement(): Promise<dom.ElementHandle>;
    _context(world: types.World): Promise<dom.FrameExecutionContext>;
    _mainContext(): Promise<dom.FrameExecutionContext>;
    private _existingMainContext;
    _utilityContext(): Promise<dom.FrameExecutionContext>;
    evaluateExpression(expression: string, options?: {
        isFunction?: boolean;
        world?: types.World;
    }, arg?: any): Promise<any>;
    evaluateExpressionHandle(expression: string, options?: {
        isFunction?: boolean;
        world?: types.World;
    }, arg?: any): Promise<js.JSHandle<any>>;
    querySelector(selector: string, options: types.StrictOptions): Promise<dom.ElementHandle<Element> | null>;
    waitForSelector(progress: Progress, selector: string, performActionPreChecksAndLog: boolean, options: types.WaitForElementOptions, scope?: dom.ElementHandle): Promise<dom.ElementHandle<Element> | null>;
    dispatchEvent(progress: Progress, selector: string, type: string, eventInit: Object, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<void>;
    evalOnSelector(selector: string, strict: boolean, expression: string, isFunction: boolean | undefined, arg: any, scope?: dom.ElementHandle): Promise<any>;
    evalOnSelectorAll(selector: string, expression: string, isFunction: boolean | undefined, arg: any, scope?: dom.ElementHandle): Promise<any>;
    maskSelectors(selectors: ParsedSelector[], color: string): Promise<void>;
    querySelectorAll(selector: string): Promise<dom.ElementHandle<Element>[]>;
    queryCount(selector: string, options: any): Promise<number>;
    content(): Promise<string>;
    setContent(progress: Progress, html: string, options: types.NavigateOptions): Promise<void>;
    name(): string;
    url(): string;
    origin(): string | undefined;
    parentFrame(): Frame | null;
    childFrames(): Frame[];
    addScriptTag(params: {
        url?: string;
        content?: string;
        type?: string;
    }): Promise<dom.ElementHandle>;
    addStyleTag(params: {
        url?: string;
        content?: string;
    }): Promise<dom.ElementHandle>;
    private _raceWithCSPError;
    retryWithProgressAndTimeouts<R>(progress: Progress, timeouts: number[], action: (continuePolling: symbol) => Promise<R | symbol>): Promise<R>;
    isNonRetriableError(e: Error): boolean;
    private _retryWithProgressIfNotConnected;
    rafrafTimeoutScreenshotElementWithProgress(progress: Progress, selector: string, timeout: number, options: ScreenshotOptions): Promise<Buffer>;
    click(progress: Progress, selector: string, options: {
        noWaitAfter?: boolean;
    } & types.MouseClickOptions & types.PointerActionWaitOptions): Promise<void>;
    dblclick(progress: Progress, selector: string, options: types.MouseMultiClickOptions & types.PointerActionWaitOptions): Promise<void>;
    dragAndDrop(progress: Progress, source: string, target: string, options: types.DragActionOptions & types.PointerActionWaitOptions): Promise<void>;
    tap(progress: Progress, selector: string, options: types.PointerActionWaitOptions): Promise<void>;
    fill(progress: Progress, selector: string, value: string, options: types.CommonActionOptions): Promise<void>;
    focus(progress: Progress, selector: string, options: types.StrictOptions & {
        noAutoWaiting?: boolean;
    }): Promise<void>;
    blur(progress: Progress, selector: string, options: types.StrictOptions & {
        noAutoWaiting?: boolean;
    }): Promise<void>;
    resolveSelector(progress: Progress, selector: string, options?: {
        mainWorld?: boolean;
    }): Promise<{
        resolvedSelector: string;
    }>;
    textContent(progress: Progress, selector: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<string | null>;
    innerText(progress: Progress, selector: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<string>;
    innerHTML(progress: Progress, selector: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<string>;
    getAttribute(progress: Progress, selector: string, name: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<string | null>;
    inputValue(progress: Progress, selector: string, options: types.StrictOptions, scope?: dom.ElementHandle): Promise<string>;
    highlight(progress: Progress, selector: string): Promise<any>;
    hideHighlight(): Promise<any>;
    private _elementState;
    isVisible(progress: Progress, selector: string, options?: types.StrictOptions, scope?: dom.ElementHandle): Promise<boolean>;
    isVisibleInternal(progress: Progress, selector: string, options?: types.StrictOptions, scope?: dom.ElementHandle): Promise<boolean>;
    isHidden(progress: Progress, selector: string, options?: types.StrictOptions, scope?: dom.ElementHandle): Promise<boolean>;
    isDisabled(progress: Progress, selector: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<boolean>;
    isEnabled(progress: Progress, selector: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<boolean>;
    isEditable(progress: Progress, selector: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<boolean>;
    isChecked(progress: Progress, selector: string, options: types.QueryOnSelectorOptions, scope?: dom.ElementHandle): Promise<boolean>;
    hover(progress: Progress, selector: string, options: types.PointerActionOptions & types.PointerActionWaitOptions): Promise<void>;
    selectOption(progress: Progress, selector: string, elements: dom.ElementHandle[], values: types.SelectOption[], options: types.CommonActionOptions): Promise<string[]>;
    setInputFiles(progress: Progress, selector: string, params: Omit<channels.FrameSetInputFilesParams, 'timeout'> & {
        noAutoWaiting?: boolean;
    }): Promise<channels.FrameSetInputFilesResult>;
    type(progress: Progress, selector: string, text: string, options: {
        delay?: number;
        noAutoWaiting?: boolean;
    } & types.StrictOptions): Promise<void>;
    press(progress: Progress, selector: string, key: string, options: {
        delay?: number;
        noWaitAfter?: boolean;
        noAutoWaiting?: boolean;
    } & types.StrictOptions): Promise<void>;
    check(progress: Progress, selector: string, options: types.PointerActionWaitOptions): Promise<void>;
    uncheck(progress: Progress, selector: string, options: types.PointerActionWaitOptions): Promise<void>;
    waitForTimeout(progress: Progress, timeout: number): Promise<any>;
    ariaSnapshot(progress: Progress, selector: string): Promise<string>;
    expect(progress: Progress, selector: string | undefined, options: FrameExpectParams): Promise<ExpectResult>;
    private _expectInternal;
    waitForFunctionExpression<R>(progress: Progress, expression: string, isFunction: boolean | undefined, arg: any, options: {
        pollingInterval?: number;
    }, world?: types.World): Promise<js.SmartHandle<R>>;
    waitForFunctionValueInUtility<R>(progress: Progress, pageFunction: js.Func1<any, R>): Promise<R>;
    title(): Promise<string>;
    rafrafTimeout(progress: Progress, timeout: number): Promise<void>;
    _onDetached(): void;
    private _callOnElementOnceMatches;
    private _setContext;
    _contextCreated(world: types.World, context: dom.FrameExecutionContext): void;
    _contextDestroyed(context: dom.FrameExecutionContext): void;
    _startNetworkIdleTimer(): void;
    _stopNetworkIdleTimer(): void;
    extendInjectedScript(source: string, arg?: any): Promise<void>;
    private _asLocator;
}
declare class SignalBarrier {
    private _progress;
    private _protectCount;
    private _promise;
    constructor(progress: Progress);
    waitFor(): PromiseLike<void>;
    addFrameNavigation(frame: Frame): void;
    retain(): void;
    release(): void;
}
export {};
