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
import type * as types from './types';
export declare class VideoRecorder {
    private _options;
    private _process;
    private _gracefullyClose;
    private _lastWritePromise;
    private _firstFrameTimestamp;
    private _lastFrame;
    private _lastWriteNodeTime;
    private _frameQueue;
    private _isStopped;
    private _ffmpegPath;
    private _launchPromise;
    constructor(ffmpegPath: string, options: types.VideoOptions);
    private _launch;
    writeFrame(frame: Buffer, timestamp: number): void;
    private _writeFrame;
    private _sendFrames;
    private _sendFrame;
    stop(): Promise<void>;
}
