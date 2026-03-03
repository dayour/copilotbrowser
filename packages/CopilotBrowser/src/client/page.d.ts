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
import { ChannelOwner } from './channelOwner';
import { Coverage } from './coverage';
import { ElementHandle } from './elementHandle';
import { TargetClosedError } from './errors';
import { Frame } from './frame';
import { Keyboard, Mouse, Touchscreen } from './input';
import { Request, Response, RouteHandler, WebSocketRouteHandler } from './network';
import { Video } from './video';
import { Worker } from './worker';
import { TimeoutSettings } from './timeoutSettings';
import { LongStandingScope } from '../utils/isomorphic/manualPromise';
import { ConsoleMessage } from './consoleMessage';
import { PageAgent } from './pageAgent';
import type { BrowserContext } from './browserContext';
import type { Clock } from './clock';
import type { APIRequestContext } from './fetch';
import type { WaitForNavigationOptions } from './frame';
import type { FrameLocator, Locator, LocatorOptions } from './locator';
import type { RouteHandlerCallback, WebSocketRouteHandlerCallback } from './network';
import type { FilePayload, Headers, LifecycleEvent, SelectOption, SelectOptionOptions, Size, TimeoutOptions, WaitForEventOptions, WaitForFunctionOptions } from './types';
import type * as structs from '../../types/structs';
import type * as api from '../../types/types';
import type { ByRoleOptions } from '../utils/isomorphic/locatorUtils';
import type { URLMatch } from '../utils/isomorphic/urlMatch';
import type * as channels from '@protocol/channels';
type PDFOptions = Omit<channels.PagePdfParams, 'width' | 'height' | 'margin'> & {
    width?: string | number;
    height?: string | number;
    margin?: {
        top?: string | number;
        bottom?: string | number;
        left?: string | number;
        right?: string | number;
    };
    path?: string;
};
export type ExpectScreenshotOptions = Omit<channels.PageExpectScreenshotOptions, 'locator' | 'expected' | 'mask'> & {
    expected?: Buffer;
    locator?: api.Locator;
    timeout: number;
    isNot: boolean;
    mask?: api.Locator[];
};
export declare class Page extends ChannelOwner<channels.PageChannel> {
    private _browserContext;
    _ownedContext: BrowserContext | undefined;
    private _mainFrame;
    private _frames;
    _workers: Set<Worker>;
    private _closed;
    readonly _closedOrCrashedScope: LongStandingScope;
    private _viewportSize;
    _routes: RouteHandler[];
    _webSocketRoutes: WebSocketRouteHandler[];
    readonly coverage: Coverage;
    readonly keyboard: Keyboard;
    readonly mouse: Mouse;
    readonly request: APIRequestContext;
    readonly touchscreen: Touchscreen;
    readonly clock: Clock;
    readonly _bindings: Map<string, (source: structs.BindingSource, ...args: any[]) => any>;
    readonly _timeoutSettings: TimeoutSettings;
    private _video;
    readonly _opener: Page | null;
    private _closeReason;
    _closeWasCalled: boolean;
    private _harRouters;
    private _locatorHandlers;
    static from(page: channels.PageChannel): Page;
    static fromNullable(page: channels.PageChannel | undefined): Page | null;
    constructor(parent: ChannelOwner, type: string, guid: string, initializer: channels.PageInitializer);
    private _onFrameAttached;
    private _onFrameDetached;
    private _onRoute;
    private _onWebSocketRoute;
    _onBinding(bindingCall: BindingCall): Promise<void>;
    _onWorker(worker: Worker): void;
    _onClose(): void;
    private _onCrash;
    context(): BrowserContext;
    opener(): Promise<Page | null>;
    mainFrame(): Frame;
    frame(frameSelector: string | {
        name?: string;
        url?: URLMatch;
    }): Frame | null;
    frames(): Frame[];
    setDefaultNavigationTimeout(timeout: number): void;
    setDefaultTimeout(timeout: number): void;
    video(): Video;
    $(selector: string, options?: {
        strict?: boolean;
    }): Promise<ElementHandle<SVGElement | HTMLElement> | null>;
    waitForSelector(selector: string, options: channels.FrameWaitForSelectorOptions & TimeoutOptions & {
        state: 'attached' | 'visible';
    }): Promise<ElementHandle<SVGElement | HTMLElement>>;
    waitForSelector(selector: string, options?: channels.FrameWaitForSelectorOptions & TimeoutOptions): Promise<ElementHandle<SVGElement | HTMLElement> | null>;
    dispatchEvent(selector: string, type: string, eventInit?: any, options?: channels.FrameDispatchEventOptions): Promise<void>;
    evaluateHandle<R, Arg>(pageFunction: structs.PageFunction<Arg, R>, arg?: Arg): Promise<structs.SmartHandle<R>>;
    $eval<R, Arg>(selector: string, pageFunction: structs.PageFunctionOn<Element, Arg, R>, arg?: Arg): Promise<R>;
    $$eval<R, Arg>(selector: string, pageFunction: structs.PageFunctionOn<Element[], Arg, R>, arg?: Arg): Promise<R>;
    $$(selector: string): Promise<ElementHandle<SVGElement | HTMLElement>[]>;
    addScriptTag(options?: {
        url?: string;
        path?: string;
        content?: string;
        type?: string;
    }): Promise<ElementHandle>;
    addStyleTag(options?: {
        url?: string;
        path?: string;
        content?: string;
    }): Promise<ElementHandle>;
    exposeFunction(name: string, callback: Function): Promise<void>;
    exposeBinding(name: string, callback: (source: structs.BindingSource, ...args: any[]) => any, options?: {
        handle?: boolean;
    }): Promise<void>;
    setExtraHTTPHeaders(headers: Headers): Promise<void>;
    url(): string;
    content(): Promise<string>;
    setContent(html: string, options?: channels.FrameSetContentOptions & TimeoutOptions): Promise<void>;
    goto(url: string, options?: channels.FrameGotoOptions & TimeoutOptions): Promise<Response | null>;
    reload(options?: channels.PageReloadOptions & TimeoutOptions): Promise<Response | null>;
    addLocatorHandler(locator: Locator, handler: (locator: Locator) => any, options?: {
        times?: number;
        noWaitAfter?: boolean;
    }): Promise<void>;
    private _onLocatorHandlerTriggered;
    removeLocatorHandler(locator: Locator): Promise<void>;
    waitForLoadState(state?: LifecycleEvent, options?: TimeoutOptions): Promise<void>;
    waitForNavigation(options?: WaitForNavigationOptions): Promise<Response | null>;
    waitForURL(url: URLMatch, options?: TimeoutOptions & {
        waitUntil?: LifecycleEvent;
    }): Promise<void>;
    waitForRequest(urlOrPredicate: string | RegExp | ((r: Request) => boolean | Promise<boolean>), options?: TimeoutOptions): Promise<Request>;
    waitForResponse(urlOrPredicate: string | RegExp | ((r: Response) => boolean | Promise<boolean>), options?: TimeoutOptions): Promise<Response>;
    waitForEvent(event: string, optionsOrPredicate?: WaitForEventOptions): Promise<any>;
    _closeErrorWithReason(): TargetClosedError;
    private _waitForEvent;
    goBack(options?: channels.PageGoBackOptions & TimeoutOptions): Promise<Response | null>;
    goForward(options?: channels.PageGoForwardOptions & TimeoutOptions): Promise<Response | null>;
    requestGC(): Promise<void>;
    emulateMedia(options?: {
        media?: 'screen' | 'print' | null;
        colorScheme?: 'dark' | 'light' | 'no-preference' | null;
        reducedMotion?: 'reduce' | 'no-preference' | null;
        forcedColors?: 'active' | 'none' | null;
        contrast?: 'no-preference' | 'more' | null;
    }): Promise<void>;
    setViewportSize(viewportSize: Size): Promise<void>;
    viewportSize(): Size | null;
    evaluate<R, Arg>(pageFunction: structs.PageFunction<Arg, R>, arg?: Arg): Promise<R>;
    _evaluateFunction(functionDeclaration: string): Promise<any>;
    addInitScript(script: Function | string | {
        path?: string;
        content?: string;
    }, arg?: any): Promise<void>;
    route(url: URLMatch, handler: RouteHandlerCallback, options?: {
        times?: number;
    }): Promise<void>;
    routeFromHAR(har: string, options?: {
        url?: string | RegExp;
        notFound?: 'abort' | 'fallback';
        update?: boolean;
        updateContent?: 'attach' | 'embed';
        updateMode?: 'minimal' | 'full';
    }): Promise<void>;
    routeWebSocket(url: URLMatch, handler: WebSocketRouteHandlerCallback): Promise<void>;
    private _disposeHarRouters;
    unrouteAll(options?: {
        behavior?: 'wait' | 'ignoreErrors' | 'default';
    }): Promise<void>;
    unroute(url: URLMatch, handler?: RouteHandlerCallback): Promise<void>;
    private _unrouteInternal;
    private _updateInterceptionPatterns;
    private _updateWebSocketInterceptionPatterns;
    screenshot(options?: Omit<channels.PageScreenshotOptions, 'mask'> & TimeoutOptions & {
        path?: string;
        mask?: api.Locator[];
    }): Promise<Buffer>;
    _expectScreenshot(options: ExpectScreenshotOptions): Promise<{
        actual?: Buffer;
        previous?: Buffer;
        diff?: Buffer;
        errorMessage?: string;
        log?: string[];
        timedOut?: boolean;
    }>;
    title(): Promise<string>;
    bringToFront(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    close(options?: {
        runBeforeUnload?: boolean;
        reason?: string;
    }): Promise<void>;
    isClosed(): boolean;
    click(selector: string, options?: channels.FrameClickOptions & TimeoutOptions): Promise<any>;
    dragAndDrop(source: string, target: string, options?: channels.FrameDragAndDropOptions & TimeoutOptions): Promise<any>;
    dblclick(selector: string, options?: channels.FrameDblclickOptions & TimeoutOptions): Promise<void>;
    tap(selector: string, options?: channels.FrameTapOptions & TimeoutOptions): Promise<any>;
    fill(selector: string, value: string, options?: channels.FrameFillOptions & TimeoutOptions): Promise<any>;
    clearConsoleMessages(): Promise<void>;
    consoleMessages(): Promise<ConsoleMessage[]>;
    clearPageErrors(): Promise<void>;
    pageErrors(): Promise<Error[]>;
    locator(selector: string, options?: LocatorOptions): Locator;
    getByTestId(testId: string | RegExp): Locator;
    getByAltText(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByLabel(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByPlaceholder(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByText(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByTitle(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByRole(role: string, options?: ByRoleOptions): Locator;
    frameLocator(selector: string): FrameLocator;
    focus(selector: string, options?: channels.FrameFocusOptions & TimeoutOptions): Promise<void>;
    textContent(selector: string, options?: channels.FrameTextContentOptions & TimeoutOptions): Promise<null | string>;
    innerText(selector: string, options?: channels.FrameInnerTextOptions & TimeoutOptions): Promise<string>;
    innerHTML(selector: string, options?: channels.FrameInnerHTMLOptions & TimeoutOptions): Promise<string>;
    getAttribute(selector: string, name: string, options?: channels.FrameGetAttributeOptions & TimeoutOptions): Promise<string | null>;
    inputValue(selector: string, options?: channels.FrameInputValueOptions & TimeoutOptions): Promise<string>;
    isChecked(selector: string, options?: channels.FrameIsCheckedOptions & TimeoutOptions): Promise<boolean>;
    isDisabled(selector: string, options?: channels.FrameIsDisabledOptions & TimeoutOptions): Promise<boolean>;
    isEditable(selector: string, options?: channels.FrameIsEditableOptions & TimeoutOptions): Promise<boolean>;
    isEnabled(selector: string, options?: channels.FrameIsEnabledOptions & TimeoutOptions): Promise<boolean>;
    isHidden(selector: string, options?: channels.FrameIsHiddenOptions & TimeoutOptions): Promise<boolean>;
    isVisible(selector: string, options?: channels.FrameIsVisibleOptions & TimeoutOptions): Promise<boolean>;
    hover(selector: string, options?: channels.FrameHoverOptions & TimeoutOptions): Promise<void>;
    selectOption(selector: string, values: string | api.ElementHandle | SelectOption | string[] | api.ElementHandle[] | SelectOption[] | null, options?: SelectOptionOptions): Promise<string[]>;
    setInputFiles(selector: string, files: string | FilePayload | string[] | FilePayload[], options?: channels.FrameSetInputFilesOptions & TimeoutOptions): Promise<void>;
    type(selector: string, text: string, options?: channels.FrameTypeOptions & TimeoutOptions): Promise<void>;
    press(selector: string, key: string, options?: channels.FramePressOptions & TimeoutOptions): Promise<void>;
    check(selector: string, options?: channels.FrameCheckOptions & TimeoutOptions): Promise<void>;
    uncheck(selector: string, options?: channels.FrameUncheckOptions & TimeoutOptions): Promise<void>;
    setChecked(selector: string, checked: boolean, options?: channels.FrameCheckOptions & TimeoutOptions): Promise<void>;
    waitForTimeout(timeout: number): Promise<void>;
    waitForFunction<R, Arg>(pageFunction: structs.PageFunction<Arg, R>, arg?: Arg, options?: WaitForFunctionOptions): Promise<structs.SmartHandle<R>>;
    requests(): Promise<any>;
    workers(): Worker[];
    pause(_options?: {
        __testHookKeepTestTimeout: boolean;
    }): Promise<void>;
    pdf(options?: PDFOptions): Promise<Buffer>;
    agent(options?: Parameters<api.Page['agent']>[0]): Promise<PageAgent>;
    _snapshotForAI(options?: TimeoutOptions & {
        track?: string;
    }): Promise<{
        full: string;
        incremental?: string;
    }>;
    _setDockTile(image: Buffer): Promise<void>;
}
export declare class BindingCall extends ChannelOwner<channels.BindingCallChannel> {
    static from(channel: channels.BindingCallChannel): BindingCall;
    constructor(parent: ChannelOwner, type: string, guid: string, initializer: channels.BindingCallInitializer);
    call(func: (source: structs.BindingSource, ...args: any[]) => any): Promise<void>;
}
export {};
