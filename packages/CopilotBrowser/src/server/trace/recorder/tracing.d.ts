/**
 * Copyright (c) Microsoft Corporation.
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
import { Artifact } from '../../artifact';
import { BrowserContext } from '../../browserContext';
import { SdkObject } from '../../instrumentation';
import { Page } from '../../page';
import type { SnapshotterBlob, SnapshotterDelegate } from './snapshotter';
import type { NameValue } from '../../../utils/isomorphic/types';
import type { Dialog } from '../../dialog';
import type { Download } from '../../download';
import type { APIRequestContext } from '../../fetch';
import type { HarTracerDelegate } from '../../har/harTracer';
import type { CallMetadata, InstrumentationListener } from '../../instrumentation';
import type { TracingTracingStopChunkParams } from '@protocol/channels';
import type * as har from '@trace/har';
import type { FrameSnapshot } from '@trace/snapshot';
import type { Progress } from '@protocol/progress';
export type TracerOptions = {
    name?: string;
    snapshots?: boolean;
    screenshots?: boolean;
    live?: boolean;
};
export declare class Tracing extends SdkObject implements InstrumentationListener, SnapshotterDelegate, HarTracerDelegate {
    private _fs;
    private _snapshotter?;
    private _harTracer;
    private _screencastListeners;
    private _eventListeners;
    private _context;
    private _state;
    private _isStopping;
    private _precreatedTracesDir;
    private _tracesTmpDir;
    private _allResources;
    private _contextCreatedEvent;
    private _pendingHarEntries;
    constructor(context: BrowserContext | APIRequestContext, tracesDir: string | undefined);
    private _sdkLanguage;
    resetForReuse(progress: Progress): Promise<void>;
    start(options: TracerOptions): void;
    startChunk(progress: Progress, options?: {
        name?: string;
        title?: string;
    }): Promise<{
        traceName: string;
    }>;
    private _currentGroupId;
    group(name: string, location: {
        file: string;
        line?: number;
        column?: number;
    } | undefined, metadata: CallMetadata): void;
    groupEnd(): void;
    private _startScreencast;
    private _stopScreencast;
    private _allocateNewTraceFile;
    private _changeTraceName;
    stop(progress: Progress | undefined): Promise<void>;
    deleteTmpTracesDir(): Promise<void>;
    private _createTracesDirIfNeeded;
    abort(): void;
    flush(): Promise<void>;
    private _closeAllGroups;
    stopChunk(progress: Progress | undefined, params: TracingTracingStopChunkParams): Promise<{
        artifact?: Artifact;
        entries?: NameValue[];
    }>;
    private _captureSnapshot;
    private _shouldCaptureSnapshot;
    onBeforeCall(sdkObject: SdkObject, metadata: CallMetadata, parentId?: string): Promise<void>;
    onBeforeInputAction(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    onCallLog(sdkObject: SdkObject, metadata: CallMetadata, logName: string, message: string): void;
    onAfterCall(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    onEntryStarted(entry: har.Entry): void;
    onEntryFinished(entry: har.Entry): void;
    flushHarEntries(): void;
    onContentBlob(sha1: string, buffer: Buffer): void;
    onSnapshotterBlob(blob: SnapshotterBlob): void;
    onFrameSnapshot(snapshot: FrameSnapshot): void;
    private _onConsoleMessage;
    onDialog(dialog: Dialog): void;
    onDownload(page: Page, download: Download): void;
    onPageOpen(page: Page): void;
    onPageClose(page: Page): void;
    private _onPageError;
    private _startScreencastInPage;
    private _appendTraceEvent;
    private _appendResource;
}
