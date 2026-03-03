/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
import { Page } from './page';
import type * as types from './types';
export declare class Screencast {
    private _page;
    private _videoRecorder;
    private _videoId;
    private _screencastClients;
    private _frameThrottler;
    private _frameListener;
    constructor(page: Page);
    stopFrameThrottler(): void;
    setOptions(options: {
        width: number;
        height: number;
        quality: number;
    } | null): void;
    throttleFrameAck(ack: () => void): void;
    temporarilyDisableThrottling(): void;
    launchAutomaticVideoRecorder(): types.VideoOptions | undefined;
    private _launchVideoRecorder;
    startVideoRecording(options: types.VideoOptions): Promise<import("./artifact").Artifact>;
    stopVideoRecording(): Promise<void>;
    startExplicitVideoRecording(options?: {
        size?: types.Size;
    }): Promise<import("./artifact").Artifact>;
    stopExplicitVideoRecording(): Promise<void>;
    private _setOptions;
    startScreencast(client: unknown, options: {
        width: number;
        height: number;
        quality: number;
    }): Promise<void>;
    stopScreencast(client: unknown): Promise<void>;
}
