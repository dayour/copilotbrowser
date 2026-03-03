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
import { BrowserContext } from '../../browserContext';
import { Page } from '../../page';
import type { FrameSnapshot } from '@trace/snapshot';
export type SnapshotterBlob = {
    buffer: Buffer;
    sha1: string;
};
export interface SnapshotterDelegate {
    onSnapshotterBlob(blob: SnapshotterBlob): void;
    onFrameSnapshot(snapshot: FrameSnapshot): void;
}
export declare class Snapshotter {
    private _context;
    private _delegate;
    private _eventListeners;
    private _snapshotStreamer;
    private _initScript;
    private _started;
    constructor(context: BrowserContext, delegate: SnapshotterDelegate);
    started(): boolean;
    start(): Promise<void>;
    reset(): Promise<void>;
    stop(): void;
    resetForReuse(): Promise<void>;
    _initialize(): Promise<void>;
    dispose(): void;
    private _captureFrameSnapshot;
    captureSnapshot(page: Page, callId: string, snapshotName: string): Promise<void>;
    private _onPage;
    private _annotateFrameHierarchy;
}
