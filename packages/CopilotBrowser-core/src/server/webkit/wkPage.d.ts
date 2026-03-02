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
import * as network from '../network';
import { Page } from '../page';
import { WKSession } from './wkConnection';
import { RawKeyboardImpl, RawMouseImpl, RawTouchscreenImpl } from './wkInput';
import type { Protocol } from './protocol';
import type { WKBrowserContext } from './wkBrowser';
import type * as frames from '../frames';
import type { InitScript, PageDelegate } from '../page';
import type { Progress } from '../progress';
import type * as types from '../types';
export declare class WKPage implements PageDelegate {
    readonly rawMouse: RawMouseImpl;
    readonly rawKeyboard: RawKeyboardImpl;
    readonly rawTouchscreen: RawTouchscreenImpl;
    _session: WKSession;
    private _provisionalPage;
    private _targetIdToFrameSession;
    readonly _page: Page;
    private readonly _pageProxySession;
    readonly _opener: WKPage | null;
    private readonly _requestIdToRequest;
    private readonly _requestIdToRequestWillBeSentEvent;
    private readonly _workers;
    private readonly _contextIdToContext;
    private _sessionListeners;
    private _eventListeners;
    readonly _browserContext: WKBrowserContext;
    private _firstNonInitialNavigationCommittedPromise;
    private _firstNonInitialNavigationCommittedFulfill;
    _firstNonInitialNavigationCommittedReject: (e: Error) => void;
    private _lastConsoleMessage;
    private readonly _requestIdToResponseReceivedPayloadEvent;
    private _nextWindowOpenPopupFeatures?;
    private _screencastGeneration;
    constructor(browserContext: WKBrowserContext, pageProxySession: WKSession, opener: WKPage | null);
    private _initializePageProxySession;
    private _setSession;
    _initializeSession(session: WKSession, provisional: boolean, resourceTreeHandler: (r: Protocol.Page.getResourceTreeReturnValue) => void): Promise<void>;
    private _initializeSessionMayThrow;
    private _initializeFrameSessions;
    private _onDidCommitProvisionalTarget;
    private _onTargetDestroyed;
    didClose(): void;
    dispatchMessageToSession(message: any): void;
    handleProvisionalLoadFailed(event: Protocol.copilotbrowser.provisionalLoadFailedPayload): void;
    handleWindowOpen(event: Protocol.copilotbrowser.windowOpenPayload): void;
    private _onTargetCreated;
    private _onDispatchMessageFromTarget;
    private _addSessionListeners;
    private _updateState;
    private _forAllSessions;
    private _onWillCheckNavigationPolicy;
    private _onDidCheckNavigationPolicy;
    private _handleFrameTree;
    _onFrameAttached(frameId: string, parentFrameId: string | null): frames.Frame;
    private _onFrameNavigated;
    private _onFrameNavigatedWithinDocument;
    private _onFrameDetached;
    private _removeContextsForFrame;
    private _onExecutionContextCreated;
    private _onBindingCalled;
    navigateFrame(frame: frames.Frame, url: string, referrer: string | undefined): Promise<frames.GotoResult>;
    _onConsoleMessage(event: Protocol.Console.messageAddedPayload): void;
    _onConsoleRepeatCountUpdated(event: Protocol.Console.messageRepeatCountUpdatedPayload): void;
    _onDialog(event: Protocol.Dialog.javascriptDialogOpeningPayload): void;
    private _onFileChooserOpened;
    private static _setEmulateMedia;
    updateExtraHTTPHeaders(): Promise<void>;
    _calculateExtraHTTPHeaders(): types.HeadersArray;
    updateEmulateMedia(): Promise<void>;
    updateEmulatedViewportSize(): Promise<void>;
    updateUserAgent(): Promise<void>;
    bringToFront(): Promise<void>;
    _updateViewport(): Promise<void>;
    updateRequestInterception(): Promise<void>;
    updateOffline(): Promise<void>;
    updateHttpCredentials(): Promise<void>;
    updateFileChooserInterception(): Promise<void>;
    reload(): Promise<void>;
    goBack(): Promise<boolean>;
    goForward(): Promise<boolean>;
    requestGC(): Promise<void>;
    addInitScript(initScript: InitScript): Promise<void>;
    removeInitScripts(initScripts: InitScript[]): Promise<void>;
    exposecopilotbrowserBinding(): Promise<void>;
    private _calculateBootstrapScript;
    private _publicKeyCredentialScript;
    _updateBootstrapScript(): Promise<void>;
    closePage(runBeforeUnload: boolean): Promise<void>;
    setBackgroundColor(color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): Promise<void>;
    private _toolbarHeight;
    private _initializeVideoRecording;
    private validateScreenshotDimension;
    takeScreenshot(progress: Progress, format: string, documentRect: types.Rect | undefined, viewportRect: types.Rect | undefined, quality: number | undefined, fitsViewport: boolean, scale: 'css' | 'device'): Promise<Buffer>;
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
    private _onScreencastFrame;
    rafCountForStablePosition(): number;
    getContentQuads(handle: dom.ElementHandle): Promise<types.Quad[] | null>;
    setInputFilePaths(handle: dom.ElementHandle<HTMLInputElement>, paths: string[]): Promise<void>;
    adoptElementHandle<T extends Node>(handle: dom.ElementHandle<T>, to: dom.FrameExecutionContext): Promise<dom.ElementHandle<T>>;
    inputActionEpilogue(): Promise<void>;
    resetForReuse(progress: Progress): Promise<void>;
    getFrameElement(frame: frames.Frame): Promise<dom.ElementHandle>;
    private _maybeCancelCoopNavigationRequest;
    _adoptRequestFromNewProcess(navigationRequest: network.Request, newSession: WKSession, newRequestId: string): void;
    _onRequestWillBeSent(session: WKSession, event: Protocol.Network.requestWillBeSentPayload): void;
    private _onRequest;
    private _handleRequestRedirect;
    _onRequestIntercepted(session: WKSession, event: Protocol.Network.requestInterceptedPayload): void;
    _onResponseReceived(session: WKSession, event: Protocol.Network.responseReceivedPayload): void;
    _onLoadingFinished(event: Protocol.Network.loadingFinishedPayload): void;
    _onLoadingFailed(session: WKSession, event: Protocol.Network.loadingFailedPayload): void;
    _grantPermissions(origin: string, permissions: string[]): Promise<void>;
    _clearPermissions(): Promise<void>;
    shouldToggleStyleSheetToSyncAnimations(): boolean;
    setDockTile(image: Buffer): Promise<void>;
}
