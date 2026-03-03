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
import { ConsoleMessage } from './console';
import { FileChooser } from './fileChooser';
import * as frames from './frames';
import * as input from './input';
import { SdkObject } from './instrumentation';
import * as js from './javascript';
import { Screenshotter } from './screenshotter';
import { LongStandingScope } from '../utils';
import { Screencast } from './screencast';
import type { Artifact } from './artifact';
import type { BrowserContextEventMap } from './browserContext';
import type { Download } from './download';
import type * as dom from './dom';
import type * as network from './network';
import type { Progress } from './progress';
import type { ScreenshotOptions } from './screenshotter';
import type * as types from './types';
import type { ImageComparatorOptions } from './utils/comparators';
import type * as channels from '@protocol/channels';
export interface PageDelegate {
    readonly rawMouse: input.RawMouse;
    readonly rawKeyboard: input.RawKeyboard;
    readonly rawTouchscreen: input.RawTouchscreen;
    reload(): Promise<void>;
    goBack(): Promise<boolean>;
    goForward(): Promise<boolean>;
    requestGC(): Promise<void>;
    addInitScript(initScript: InitScript): Promise<void>;
    removeInitScripts(initScripts: InitScript[]): Promise<void>;
    closePage(runBeforeUnload: boolean): Promise<void>;
    navigateFrame(frame: frames.Frame, url: string, referrer: string | undefined): Promise<frames.GotoResult>;
    updateExtraHTTPHeaders(): Promise<void>;
    updateEmulatedViewportSize(preserveWindowBoundaries?: boolean): Promise<void>;
    updateEmulateMedia(): Promise<void>;
    updateRequestInterception(): Promise<void>;
    updateFileChooserInterception(): Promise<void>;
    bringToFront(): Promise<void>;
    setBackgroundColor(color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): Promise<void>;
    takeScreenshot(progress: Progress, format: string, documentRect: types.Rect | undefined, viewportRect: types.Rect | undefined, quality: number | undefined, fitsViewport: boolean, scale: 'css' | 'device'): Promise<Buffer>;
    adoptElementHandle<T extends Node>(handle: dom.ElementHandle<T>, to: dom.FrameExecutionContext): Promise<dom.ElementHandle<T>>;
    getContentFrame(handle: dom.ElementHandle): Promise<frames.Frame | null>;
    getOwnerFrame(handle: dom.ElementHandle): Promise<string | null>;
    getContentQuads(handle: dom.ElementHandle): Promise<types.Quad[] | null | 'error:notconnected'>;
    setInputFilePaths(handle: dom.ElementHandle<HTMLInputElement>, files: string[]): Promise<void>;
    getBoundingBox(handle: dom.ElementHandle): Promise<types.Rect | null>;
    getFrameElement(frame: frames.Frame): Promise<dom.ElementHandle>;
    scrollRectIntoViewIfNeeded(handle: dom.ElementHandle, rect?: types.Rect): Promise<'error:notvisible' | 'error:notconnected' | 'done'>;
    startScreencast(options: {
        width: number;
        height: number;
        quality: number;
    }): Promise<void>;
    stopScreencast(): Promise<void>;
    pdf?: (options: channels.PagePdfParams) => Promise<Buffer>;
    coverage?: () => any;
    rafCountForStablePosition(): number;
    inputActionEpilogue(): Promise<void>;
    readonly cspErrorsAsynchronousForInlineScripts?: boolean;
    resetForReuse(progress: Progress): Promise<void>;
    shouldToggleStyleSheetToSyncAnimations(): boolean;
    setDockTile(image: Buffer): Promise<void>;
}
type EmulatedSize = {
    screen: types.Size;
    viewport: types.Size;
};
type EmulatedMedia = {
    media: types.MediaType;
    colorScheme: types.ColorScheme;
    reducedMotion: types.ReducedMotion;
    forcedColors: types.ForcedColors;
    contrast: types.Contrast;
};
type ExpectScreenshotOptions = ImageComparatorOptions & ScreenshotOptions & {
    timeout: number;
    expected?: Buffer;
    isNot?: boolean;
    locator?: {
        frame: frames.Frame;
        selector: string;
    };
};
declare const PageEvent: {
    readonly Close: "close";
    readonly Crash: "crash";
    readonly Download: "download";
    readonly EmulatedSizeChanged: "emulatedsizechanged";
    readonly FileChooser: "filechooser";
    readonly FrameAttached: "frameattached";
    readonly FrameDetached: "framedetached";
    readonly InternalFrameNavigatedToNewDocument: "internalframenavigatedtonewdocument";
    readonly LocatorHandlerTriggered: "locatorhandlertriggered";
    readonly ScreencastFrame: "screencastframe";
    readonly WebSocket: "websocket";
    readonly Worker: "worker";
};
export type PageEventMap = {
    [PageEvent.Close]: [];
    [PageEvent.Crash]: [];
    [PageEvent.Download]: [download: Download];
    [PageEvent.EmulatedSizeChanged]: [];
    [PageEvent.FileChooser]: [fileChooser: FileChooser];
    [PageEvent.FrameAttached]: [frame: frames.Frame];
    [PageEvent.FrameDetached]: [frame: frames.Frame];
    [PageEvent.InternalFrameNavigatedToNewDocument]: [frame: frames.Frame];
    [PageEvent.LocatorHandlerTriggered]: [uid: number];
    [PageEvent.ScreencastFrame]: [frame: types.ScreencastFrame];
    [PageEvent.WebSocket]: [webSocket: network.WebSocket];
    [PageEvent.Worker]: [worker: Worker];
};
export declare class Page extends SdkObject<PageEventMap> {
    static Events: {
        readonly Close: "close";
        readonly Crash: "crash";
        readonly Download: "download";
        readonly EmulatedSizeChanged: "emulatedsizechanged";
        readonly FileChooser: "filechooser";
        readonly FrameAttached: "frameattached";
        readonly FrameDetached: "framedetached";
        readonly InternalFrameNavigatedToNewDocument: "internalframenavigatedtonewdocument";
        readonly LocatorHandlerTriggered: "locatorhandlertriggered";
        readonly ScreencastFrame: "screencastframe";
        readonly WebSocket: "websocket";
        readonly Worker: "worker";
    };
    private _closedState;
    private _closedPromise;
    private _initialized;
    private _initializedPromise;
    private _consoleMessages;
    private _pageErrors;
    private _crashed;
    readonly openScope: LongStandingScope;
    readonly browserContext: BrowserContext;
    readonly keyboard: input.Keyboard;
    readonly mouse: input.Mouse;
    readonly touchscreen: input.Touchscreen;
    readonly delegate: PageDelegate;
    private _emulatedSize;
    private _extraHTTPHeaders;
    private _emulatedMedia;
    private _fileChooserInterceptedBy;
    private readonly _pageBindings;
    initScripts: InitScript[];
    readonly screenshotter: Screenshotter;
    readonly frameManager: frames.FrameManager;
    private _workers;
    readonly pdf: ((options: channels.PagePdfParams) => Promise<Buffer>) | undefined;
    readonly coverage: any;
    readonly requestInterceptors: network.RouteHandler[];
    video: Artifact | undefined;
    private _opener;
    readonly isStorageStatePage: boolean;
    private _locatorHandlers;
    private _lastLocatorHandlerUid;
    private _locatorHandlerRunningCounter;
    private _networkRequests;
    readonly screencast: Screencast;
    _closeReason: string | undefined;
    constructor(delegate: PageDelegate, browserContext: BrowserContext);
    reportAsNew(opener: Page | undefined, error?: Error): Promise<void>;
    private _markInitialized;
    initializedOrUndefined(): Page | undefined;
    waitForInitializedOrError(): Promise<Page | Error>;
    emitOnContext<K extends keyof BrowserContextEventMap>(event: K, ...args: BrowserContextEventMap[K]): void;
    resetForReuse(progress: Progress): Promise<void>;
    _didClose(): void;
    _didCrash(): void;
    _onFileChooserOpened(handle: dom.ElementHandle): Promise<void>;
    opener(): Page | undefined;
    mainFrame(): frames.Frame;
    frames(): frames.Frame[];
    exposeBinding(progress: Progress, name: string, needsHandle: boolean, copilotbrowserBinding: frames.FunctionWithSource): Promise<PageBinding>;
    removeExposedBindings(bindings: PageBinding[]): Promise<void>;
    setExtraHTTPHeaders(progress: Progress, headers: types.HeadersArray): Promise<void>;
    extraHTTPHeaders(): types.HeadersArray | undefined;
    addNetworkRequest(request: network.Request): void;
    networkRequests(): network.Request[];
    onBindingCalled(payload: string, context: dom.FrameExecutionContext): Promise<void>;
    addConsoleMessage(worker: Worker | null, type: string, args: js.JSHandle[], location: types.ConsoleMessageLocation, text: string | undefined, timestamp: number): void;
    clearConsoleMessages(): void;
    consoleMessages(): ConsoleMessage[];
    addPageError(pageError: Error): void;
    clearPageErrors(): void;
    pageErrors(): Error[];
    reload(progress: Progress, options: types.NavigateOptions): Promise<network.Response | null>;
    goBack(progress: Progress, options: types.NavigateOptions): Promise<network.Response | null>;
    goForward(progress: Progress, options: types.NavigateOptions): Promise<network.Response | null>;
    requestGC(): Promise<void>;
    registerLocatorHandler(selector: string, noWaitAfter: boolean | undefined): number;
    resolveLocatorHandler(uid: number, remove: boolean | undefined): void;
    unregisterLocatorHandler(uid: number): void;
    performActionPreChecks(progress: Progress): Promise<void>;
    private _performWaitForNavigationCheck;
    private _performLocatorHandlersCheckpoint;
    emulateMedia(progress: Progress, options: Partial<EmulatedMedia>): Promise<void>;
    emulatedMedia(): EmulatedMedia;
    setViewportSize(progress: Progress, viewportSize: types.Size): Promise<void>;
    setEmulatedSizeFromWindowOpen(emulatedSize: EmulatedSize): void;
    private _setEmulatedSize;
    emulatedSize(): EmulatedSize | undefined;
    bringToFront(): Promise<void>;
    addInitScript(progress: Progress, source: string): Promise<InitScript>;
    removeInitScripts(initScripts: InitScript[]): Promise<void>;
    needsRequestInterception(): boolean;
    addRequestInterceptor(progress: Progress, handler: network.RouteHandler, prepend?: 'prepend'): Promise<void>;
    removeRequestInterceptor(handler: network.RouteHandler): Promise<void>;
    expectScreenshot(progress: Progress, options: ExpectScreenshotOptions): Promise<{
        actual?: Buffer;
        previous?: Buffer;
        diff?: Buffer;
        errorMessage?: string;
        log?: string[];
        timedOut?: boolean;
    }>;
    screenshot(progress: Progress, options: ScreenshotOptions): Promise<Buffer>;
    close(options?: {
        runBeforeUnload?: boolean;
        reason?: string;
    }): Promise<void>;
    isClosed(): boolean;
    hasCrashed(): boolean;
    isClosedOrClosingOrCrashed(): boolean;
    addWorker(workerId: string, worker: Worker): void;
    removeWorker(workerId: string): void;
    clearWorkers(): void;
    setFileChooserInterceptedBy(enabled: boolean, by: any): Promise<void>;
    fileChooserIntercepted(): boolean;
    frameNavigatedToNewDocument(frame: frames.Frame): void;
    allInitScripts(): InitScript[];
    getBinding(name: string): PageBinding;
    safeNonStallingEvaluateInAllFrames(expression: string, world: types.World, options?: {
        throwOnJSErrors?: boolean;
    }): Promise<void>;
    hideHighlight(): Promise<void>;
    snapshotForAI(progress: Progress, options?: {
        track?: string;
        doNotRenderActive?: boolean;
    }): Promise<{
        full: string;
        incremental?: string;
    }>;
    setDockTile(image: Buffer): Promise<void>;
}
export declare const WorkerEvent: {
    readonly Close: "close";
};
export type WorkerEventMap = {
    [WorkerEvent.Close]: [worker: Worker];
};
export declare class Worker extends SdkObject<WorkerEventMap> {
    static Events: {
        readonly Close: "close";
    };
    readonly url: string;
    private _executionContextPromise;
    private _workerScriptLoaded;
    existingExecutionContext: js.ExecutionContext | null;
    readonly openScope: LongStandingScope;
    constructor(parent: SdkObject, url: string);
    createExecutionContext(delegate: js.ExecutionContextDelegate): js.ExecutionContext;
    workerScriptLoaded(): void;
    didClose(): void;
    evaluateExpression(expression: string, isFunction: boolean | undefined, arg: any): Promise<any>;
    evaluateExpressionHandle(expression: string, isFunction: boolean | undefined, arg: any): Promise<any>;
}
export declare class PageBinding {
    private static kController;
    static kBindingName: string;
    static createInitScript(): InitScript;
    readonly name: string;
    readonly copilotbrowserFunction: frames.FunctionWithSource;
    readonly initScript: InitScript;
    readonly needsHandle: boolean;
    readonly cleanupScript: string;
    forClient?: unknown;
    constructor(name: string, copilotbrowserFunction: frames.FunctionWithSource, needsHandle: boolean);
    static dispatch(page: Page, payload: string, context: dom.FrameExecutionContext): Promise<void>;
}
export declare class InitScript {
    readonly source: string;
    constructor(source: string);
}
export {};
