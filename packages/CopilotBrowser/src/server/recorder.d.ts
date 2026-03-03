/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import EventEmitter from 'events';
import { BrowserContext } from './browserContext';
import type { Language } from './codegen/types';
import type { CallMetadata, InstrumentationListener, SdkObject } from './instrumentation';
import type { AriaTemplateNode } from '@isomorphic/ariaSnapshot';
import type * as channels from '@protocol/channels';
import type * as actions from '@recorder/actions';
import type { CallLog, ElementInfo, Mode, Source } from '@recorder/recorderTypes';
export declare const RecorderEvent: {
    readonly PausedStateChanged: "pausedStateChanged";
    readonly ModeChanged: "modeChanged";
    readonly ElementPicked: "elementPicked";
    readonly CallLogsUpdated: "callLogsUpdated";
    readonly UserSourcesChanged: "userSourcesChanged";
    readonly ActionAdded: "actionAdded";
    readonly SignalAdded: "signalAdded";
    readonly PageNavigated: "pageNavigated";
    readonly ContextClosed: "contextClosed";
};
export type RecorderEventMap = {
    [RecorderEvent.PausedStateChanged]: [paused: boolean];
    [RecorderEvent.ModeChanged]: [mode: Mode];
    [RecorderEvent.ElementPicked]: [elementInfo: ElementInfo, userGesture?: boolean];
    [RecorderEvent.CallLogsUpdated]: [callLogs: CallLog[]];
    [RecorderEvent.UserSourcesChanged]: [sources: Source[], pausedSourceId?: string];
    [RecorderEvent.ActionAdded]: [action: actions.ActionInContext];
    [RecorderEvent.SignalAdded]: [signal: actions.SignalInContext];
    [RecorderEvent.PageNavigated]: [url: string];
    [RecorderEvent.ContextClosed]: [];
};
export declare class Recorder extends EventEmitter<RecorderEventMap> implements InstrumentationListener {
    readonly handleSIGINT: boolean | undefined;
    private _context;
    private _params;
    private _mode;
    private _highlightedElement;
    private _overlayState;
    private _currentCallsMetadata;
    private _userSources;
    private _debugger;
    private _omitCallTracking;
    private _currentLanguage;
    private _recorderMode;
    private _signalProcessor;
    private _pageAliases;
    private _lastPopupOrdinal;
    private _lastDialogOrdinal;
    private _lastDownloadOrdinal;
    private _listeners;
    private _enabled;
    private _callLogs;
    static forContext(context: BrowserContext, params: channels.BrowserContextEnableRecorderParams): Promise<Recorder>;
    static existingForContext(context: BrowserContext): Promise<Recorder | undefined>;
    private static _create;
    constructor(context: BrowserContext, params: channels.BrowserContextEnableRecorderParams);
    private _debugLog;
    private _install;
    private _pausedStateChanged;
    mode(): Mode;
    setMode(mode: Mode): void;
    url(): string | undefined;
    setHighlightedSelector(selector: string): void;
    setHighlightedAriaTemplate(ariaTemplate: AriaTemplateNode): void;
    step(): void;
    setLanguage(language: Language): void;
    resume(): void;
    pause(): void;
    paused(): boolean;
    close(): void;
    hideHighlightedSelector(): void;
    pausedSourceId(): any;
    userSources(): Source[];
    callLog(): CallLog[];
    private _scopeHighlightedSelectorToFrame;
    private _refreshOverlay;
    onBeforeCall(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    onAfterCall(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    private _updateUserSources;
    onBeforeInputAction(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    onCallLog(sdkObject: SdkObject, metadata: CallMetadata, logName: string, message: string): Promise<void>;
    updateCallLog(metadatas: CallMetadata[]): void;
    private _isRecording;
    private _readSource;
    private _setEnabled;
    private _onPage;
    private _filePrimaryURLChanged;
    clear(): void;
    private _describeMainFrame;
    private _describeFrame;
    private _testIdAttributeName;
    private _createActionInContext;
    private _performAction;
    private _recordAction;
    private _onFrameNavigated;
    private _onPopup;
    private _onDownload;
    private _onDialog;
}
