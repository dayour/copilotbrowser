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
import * as dom from '../dom';
import * as frames from '../frames';
import { Page } from '../page';
import { CRBrowserContext } from './crBrowser';
import { CRCoverage } from './crCoverage';
import { RawKeyboardImpl, RawMouseImpl, RawTouchscreenImpl } from './crInput';
import { CRNetworkManager } from './crNetworkManager';
import type { CRSession } from './crConnection';
import type { Protocol } from './protocol';
import type { InitScript, PageDelegate } from '../page';
import type { Progress } from '../progress';
import type * as types from '../types';
import type * as channels from '@protocol/channels';
export type WindowBounds = {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
};
export declare class CRPage implements PageDelegate {
    readonly utilityWorldName: string;
    readonly _mainFrameSession: FrameSession;
    readonly _sessions: Map<string, FrameSession>;
    readonly _page: Page;
    readonly rawMouse: RawMouseImpl;
    readonly rawKeyboard: RawKeyboardImpl;
    readonly rawTouchscreen: RawTouchscreenImpl;
    readonly _targetId: string;
    readonly _opener: CRPage | null;
    readonly _networkManager: CRNetworkManager;
    private readonly _pdf;
    private readonly _coverage;
    readonly _browserContext: CRBrowserContext;
    readonly _nextWindowOpenPopupFeatures: string[][];
    static mainFrameSession(page: Page): FrameSession;
    constructor(client: CRSession, targetId: string, browserContext: CRBrowserContext, opener: CRPage | null, bits: {
        hasUIWindow: boolean;
    });
    private _forAllFrameSessions;
    _sessionForFrame(frame: frames.Frame): FrameSession;
    private _sessionForHandle;
    willBeginDownload(): void;
    didClose(): void;
    navigateFrame(frame: frames.Frame, url: string, referrer: string | undefined): Promise<frames.GotoResult>;
    updateExtraHTTPHeaders(): Promise<void>;
    updateGeolocation(): Promise<void>;
    updateOffline(): Promise<void>;
    updateHttpCredentials(): Promise<void>;
    updateEmulatedViewportSize(preserveWindowBoundaries?: boolean): Promise<void>;
    bringToFront(): Promise<void>;
    updateEmulateMedia(): Promise<void>;
    updateUserAgent(): Promise<void>;
    updateRequestInterception(): Promise<void>;
    updateFileChooserInterception(): Promise<void>;
    reload(): Promise<void>;
    private _go;
    goBack(): Promise<boolean>;
    goForward(): Promise<boolean>;
    requestGC(): Promise<void>;
    addInitScript(initScript: InitScript, world?: types.World): Promise<void>;
    exposecopilotbrowserBinding(): Promise<void>;
    removeInitScripts(initScripts: InitScript[]): Promise<void>;
    closePage(runBeforeUnload: boolean): Promise<void>;
    setBackgroundColor(color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): Promise<void>;
    takeScreenshot(progress: Progress, format: 'png' | 'jpeg', documentRect: types.Rect | undefined, viewportRect: types.Rect | undefined, quality: number | undefined, fitsViewport: boolean, scale: 'css' | 'device'): Promise<Buffer>;
    getContentFrame(handle: dom.ElementHandle): Promise<frames.Frame | null>;
    getOwnerFrame(handle: dom.ElementHandle): Promise<string | null>;
    getBoundingBox(handle: dom.ElementHandle): Promise<types.Rect | null>;
    scrollRectIntoViewIfNeeded(handle: dom.ElementHandle, rect?: types.Rect): Promise<'error:notvisible' | 'error:notconnected' | 'done'>;
    startScreencast(options: {
        width: number;
        height: number;
        quality: number;
    }): Promise<void>;
    stopScreencast(): Promise<void>;
    rafCountForStablePosition(): number;
    getContentQuads(handle: dom.ElementHandle): Promise<types.Quad[] | null>;
    setInputFilePaths(handle: dom.ElementHandle<HTMLInputElement>, files: string[]): Promise<void>;
    adoptElementHandle<T extends Node>(handle: dom.ElementHandle<T>, to: dom.FrameExecutionContext): Promise<dom.ElementHandle<T>>;
    inputActionEpilogue(): Promise<void>;
    resetForReuse(progress: Progress): Promise<void>;
    pdf(options: channels.PagePdfParams): Promise<Buffer>;
    coverage(): CRCoverage;
    getFrameElement(frame: frames.Frame): Promise<dom.ElementHandle>;
    shouldToggleStyleSheetToSyncAnimations(): boolean;
    setDockTile(image: Buffer): Promise<void>;
}
declare class FrameSession {
    readonly _client: CRSession;
    readonly _crPage: CRPage;
    readonly _page: Page;
    private readonly _parentSession;
    private readonly _childSessions;
    private readonly _contextIdToContext;
    private _eventListeners;
    readonly _targetId: string;
    private _firstNonInitialNavigationCommittedPromise;
    private _firstNonInitialNavigationCommittedFulfill;
    private _firstNonInitialNavigationCommittedReject;
    private _windowId;
    private _swappedIn;
    _metricsOverride: Protocol.Emulation.setDeviceMetricsOverrideParameters | undefined;
    private _workerSessions;
    private _initScriptIds;
    private _bufferedAttachedToTargetEvents;
    constructor(crPage: CRPage, client: CRSession, targetId: string, parentSession: FrameSession | null);
    _isMainFrame(): boolean;
    private _addRendererListeners;
    private _addBrowserListeners;
    _initialize(hasUIWindow: boolean): Promise<void>;
    dispose(): void;
    _navigate(frame: frames.Frame, url: string, referrer: string | undefined): Promise<frames.GotoResult>;
    _onLifecycleEvent(event: Protocol.Page.lifecycleEventPayload): void;
    _handleFrameTree(frameTree: Protocol.Page.FrameTree): void;
    private _eventBelongsToStaleFrame;
    _onFrameAttached(frameId: string, parentFrameId: string | null): void;
    _onFrameNavigated(framePayload: Protocol.Page.Frame, initial: boolean): void;
    _onFrameRequestedNavigation(payload: Protocol.Page.frameRequestedNavigationPayload): void;
    _onFrameNavigatedWithinDocument(frameId: string, url: string): void;
    _onFrameDetached(frameId: string, reason: 'remove' | 'swap'): void;
    _onExecutionContextCreated(contextPayload: Protocol.Runtime.ExecutionContextDescription): void;
    _onExecutionContextDestroyed(executionContextId: number): void;
    _onExecutionContextsCleared(): void;
    _onAttachedToTarget(event: Protocol.Target.attachedToTargetPayload): void;
    _onDetachedFromTarget(event: Protocol.Target.detachedFromTargetPayload): void;
    _onWindowOpen(event: Protocol.Page.windowOpenPayload): void;
    _onConsoleAPI(event: Protocol.Runtime.consoleAPICalledPayload): Promise<void>;
    _onBindingCalled(event: Protocol.Runtime.bindingCalledPayload): Promise<void>;
    _onDialog(event: Protocol.Page.javascriptDialogOpeningPayload): void;
    _handleException(exceptionDetails: Protocol.Runtime.ExceptionDetails): void;
    _onTargetCrashed(): Promise<void>;
    _onLogEntryAdded(event: Protocol.Log.entryAddedPayload): void;
    _onFileChooserOpened(event: Protocol.Page.fileChooserOpenedPayload): Promise<void>;
    _willBeginDownload(): void;
    _onScreencastFrame(payload: Protocol.Page.screencastFramePayload): void;
    _updateGeolocation(initial: boolean): Promise<void>;
    _updateViewport(preserveWindowBoundaries?: boolean): Promise<void>;
    windowBounds(): Promise<WindowBounds>;
    setWindowBounds(bounds: WindowBounds): Promise<Protocol.Browser.setWindowBoundsReturnValue>;
    _updateEmulateMedia(): Promise<void>;
    _updateUserAgent(): Promise<void>;
    private _setDefaultFontFamilies;
    _updateFileChooserInterception(initial: boolean): Promise<void>;
    _evaluateOnNewDocument(initScript: InitScript, world: types.World, runImmediately?: boolean): Promise<void>;
    _removeEvaluatesOnNewDocument(initScripts: InitScript[]): Promise<void>;
    exposecopilotbrowserBinding(): Promise<void>;
    _getContentFrame(handle: dom.ElementHandle): Promise<frames.Frame | null>;
    _getOwnerFrame(handle: dom.ElementHandle): Promise<string | null>;
    _getBoundingBox(handle: dom.ElementHandle): Promise<types.Rect | null>;
    private _framePosition;
    _scrollRectIntoViewIfNeeded(handle: dom.ElementHandle, rect?: types.Rect): Promise<'error:notvisible' | 'error:notconnected' | 'done'>;
    _getContentQuads(handle: dom.ElementHandle): Promise<types.Quad[] | null>;
    _adoptElementHandle<T extends Node>(handle: dom.ElementHandle<T>, to: dom.FrameExecutionContext): Promise<dom.ElementHandle<T>>;
    _adoptBackendNodeId(backendNodeId: Protocol.DOM.BackendNodeId, to: dom.FrameExecutionContext): Promise<dom.ElementHandle>;
}
export {};
