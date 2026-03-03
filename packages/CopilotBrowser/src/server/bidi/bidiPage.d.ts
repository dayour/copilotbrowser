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
import * as dom from '../dom';
import { BidiBrowserContext } from './bidiBrowser';
import { Page } from '../page';
import { RawKeyboardImpl, RawMouseImpl, RawTouchscreenImpl } from './bidiInput';
import { BidiNetworkManager } from './bidiNetworkManager';
import * as bidi from './third_party/bidiProtocol';
import type * as frames from '../frames';
import type { InitScript, PageDelegate } from '../page';
import type { Progress } from '../progress';
import type * as types from '../types';
import type { BidiSession } from './bidiConnection';
import type * as channels from '@protocol/channels';
export declare const kcopilotbrowserBindingChannel = "copilotbrowserChannel";
export declare class BidiPage implements PageDelegate {
    readonly rawMouse: RawMouseImpl;
    readonly rawKeyboard: RawKeyboardImpl;
    readonly rawTouchscreen: RawTouchscreenImpl;
    readonly _page: Page;
    readonly _session: BidiSession;
    readonly _opener: BidiPage | null;
    readonly _realmToContext: Map<string, dom.FrameExecutionContext>;
    private _realmToWorkerContext;
    private _sessionListeners;
    readonly _browserContext: BidiBrowserContext;
    readonly _networkManager: BidiNetworkManager;
    private readonly _pdf;
    private _initScriptIds;
    private readonly _fragmentNavigations;
    constructor(browserContext: BidiBrowserContext, bidiSession: BidiSession, opener: BidiPage | null);
    private _initialize;
    didClose(): void;
    private _onFrameAttached;
    private _removeContextsForFrame;
    private _onRealmCreated;
    private _touchUtilityWorld;
    _onRealmDestroyed(params: bidi.Script.RealmDestroyedParameters): boolean;
    private _onBrowsingContextDestroyed;
    private _onNavigationStarted;
    private _onNavigationCommitted;
    private _onDomContentLoaded;
    private _onLoad;
    private _onNavigationAborted;
    private _onNavigationFailed;
    private _onFragmentNavigated;
    private _onHistoryUpdated;
    private _onUserPromptOpened;
    private _onDownloadWillBegin;
    private _onDownloadEnded;
    private _onLogEntryAdded;
    private _onFileDialogOpened;
    navigateFrame(frame: frames.Frame, url: string, referrer: string | undefined): Promise<frames.GotoResult>;
    updateExtraHTTPHeaders(): Promise<void>;
    updateEmulateMedia(): Promise<void>;
    updateUserAgent(): Promise<void>;
    bringToFront(): Promise<void>;
    updateEmulatedViewportSize(): Promise<void>;
    updateRequestInterception(): Promise<void>;
    updateOffline(): Promise<void>;
    updateHttpCredentials(): Promise<void>;
    updateFileChooserInterception(): Promise<void>;
    reload(): Promise<void>;
    goBack(): Promise<boolean>;
    goForward(): Promise<boolean>;
    requestGC(): Promise<void>;
    private _onScriptMessage;
    addInitScript(initScript: InitScript): Promise<void>;
    removeInitScripts(initScripts: InitScript[]): Promise<void>;
    closePage(runBeforeUnload: boolean): Promise<void>;
    setBackgroundColor(color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): Promise<void>;
    takeScreenshot(progress: Progress, format: string, documentRect: types.Rect | undefined, viewportRect: types.Rect | undefined, quality: number | undefined, fitsViewport: boolean, scale: 'css' | 'device'): Promise<Buffer>;
    getContentFrame(handle: dom.ElementHandle): Promise<frames.Frame | null>;
    getOwnerFrame(handle: dom.ElementHandle): Promise<string | null>;
    getBoundingBox(handle: dom.ElementHandle): Promise<types.Rect | null>;
    private _framePosition;
    scrollRectIntoViewIfNeeded(handle: dom.ElementHandle<Element>, rect?: types.Rect): Promise<'error:notvisible' | 'error:notconnected' | 'done'>;
    startScreencast(options: {
        width: number;
        height: number;
        quality: number;
    }): Promise<void>;
    stopScreencast(): Promise<void>;
    rafCountForStablePosition(): number;
    getContentQuads(handle: dom.ElementHandle<Element>): Promise<types.Quad[] | null | 'error:notconnected'>;
    setInputFilePaths(handle: dom.ElementHandle<HTMLInputElement>, paths: string[]): Promise<void>;
    adoptElementHandle<T extends Node>(handle: dom.ElementHandle<T>, to: dom.FrameExecutionContext): Promise<dom.ElementHandle<T>>;
    inputActionEpilogue(): Promise<void>;
    resetForReuse(progress: Progress): Promise<void>;
    pdf(options: channels.PagePdfParams): Promise<Buffer>;
    getFrameElement(frame: frames.Frame): Promise<dom.ElementHandle>;
    _getFrameNode(frame: frames.Frame): Promise<bidi.Script.NodeRemoteValue | undefined>;
    shouldToggleStyleSheetToSyncAnimations(): boolean;
    setDockTile(image: Buffer): Promise<void>;
}
