/**
 * Copyright 2019 Google Inc. All rights reserved.
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
import { InitScript } from '../page';
import { Page } from '../page';
import { FFSession } from './ffConnection';
import { RawKeyboardImpl, RawMouseImpl, RawTouchscreenImpl } from './ffInput';
import { FFNetworkManager } from './ffNetworkManager';
import type { Progress } from '../progress';
import type { FFBrowserContext } from './ffBrowser';
import type { Protocol } from './protocol';
import type * as frames from '../frames';
import type { PageDelegate } from '../page';
import type * as types from '../types';
export declare const UTILITY_WORLD_NAME = "__copilotbrowser_utility_world__";
export declare class FFPage implements PageDelegate {
    readonly cspErrorsAsynchronousForInlineScripts = true;
    readonly rawMouse: RawMouseImpl;
    readonly rawKeyboard: RawKeyboardImpl;
    readonly rawTouchscreen: RawTouchscreenImpl;
    readonly _session: FFSession;
    readonly _page: Page;
    readonly _networkManager: FFNetworkManager;
    readonly _browserContext: FFBrowserContext;
    private _reportedAsNew;
    readonly _opener: FFPage | null;
    private readonly _contextIdToContext;
    private _eventListeners;
    private _workers;
    private _initScripts;
    constructor(session: FFSession, browserContext: FFBrowserContext, opener: FFPage | null);
    _reportAsNew(error?: Error): void;
    _onWebSocketCreated(event: Protocol.Page.webSocketCreatedPayload): void;
    _onWebSocketClosed(event: Protocol.Page.webSocketClosedPayload): void;
    _onWebSocketFrameReceived(event: Protocol.Page.webSocketFrameReceivedPayload): void;
    _onWebSocketFrameSent(event: Protocol.Page.webSocketFrameSentPayload): void;
    _onExecutionContextCreated(payload: Protocol.Runtime.executionContextCreatedPayload): void;
    _onExecutionContextDestroyed(payload: Protocol.Runtime.executionContextDestroyedPayload): void;
    _onExecutionContextsCleared(): void;
    private _removeContextsForFrame;
    _onLinkClicked(phase: 'before' | 'after'): void;
    _onNavigationStarted(params: Protocol.Page.navigationStartedPayload): void;
    _onNavigationAborted(params: Protocol.Page.navigationAbortedPayload): void;
    _onNavigationCommitted(params: Protocol.Page.navigationCommittedPayload): void;
    _onSameDocumentNavigation(params: Protocol.Page.sameDocumentNavigationPayload): void;
    _onFrameAttached(params: Protocol.Page.frameAttachedPayload): void;
    _onFrameDetached(params: Protocol.Page.frameDetachedPayload): void;
    _onEventFired(payload: Protocol.Page.eventFiredPayload): void;
    _onUncaughtError(params: Protocol.Page.uncaughtErrorPayload): void;
    _onConsole(payload: Protocol.Runtime.consolePayload): void;
    _onDialogOpened(params: Protocol.Page.dialogOpenedPayload): void;
    _onBindingCalled(event: Protocol.Page.bindingCalledPayload): Promise<void>;
    _onFileChooserOpened(payload: Protocol.Page.fileChooserOpenedPayload): Promise<void>;
    _onWorkerCreated(event: Protocol.Page.workerCreatedPayload): Promise<void>;
    _onWorkerDestroyed(event: Protocol.Page.workerDestroyedPayload): void;
    _onDispatchMessageFromWorker(event: Protocol.Page.dispatchMessageFromWorkerPayload): Promise<void>;
    _onCrashed(event: Protocol.Page.crashedPayload): Promise<void>;
    didClose(): void;
    navigateFrame(frame: frames.Frame, url: string, referer: string | undefined): Promise<frames.GotoResult>;
    updateExtraHTTPHeaders(): Promise<void>;
    updateEmulatedViewportSize(): Promise<void>;
    bringToFront(): Promise<void>;
    updateEmulateMedia(): Promise<void>;
    updateRequestInterception(): Promise<void>;
    updateFileChooserInterception(): Promise<void>;
    reload(): Promise<void>;
    goBack(): Promise<boolean>;
    goForward(): Promise<boolean>;
    requestGC(): Promise<void>;
    addInitScript(initScript: InitScript, worldName?: string): Promise<void>;
    removeInitScripts(initScripts: InitScript[]): Promise<void>;
    private _updateInitScripts;
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
    private _onScreencastFrame;
    rafCountForStablePosition(): number;
    getContentQuads(handle: dom.ElementHandle): Promise<types.Quad[] | null>;
    setInputFilePaths(handle: dom.ElementHandle<HTMLInputElement>, files: string[]): Promise<void>;
    adoptElementHandle<T extends Node>(handle: dom.ElementHandle<T>, to: dom.FrameExecutionContext): Promise<dom.ElementHandle<T>>;
    inputActionEpilogue(): Promise<void>;
    resetForReuse(progress: Progress): Promise<void>;
    getFrameElement(frame: frames.Frame): Promise<dom.ElementHandle>;
    shouldToggleStyleSheetToSyncAnimations(): boolean;
    setDockTile(image: Buffer): Promise<void>;
}
