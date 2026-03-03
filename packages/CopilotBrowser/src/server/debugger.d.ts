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
import { EventEmitter } from 'events';
import { BrowserContext } from './browserContext';
import type { CallMetadata, InstrumentationListener, SdkObject } from './instrumentation';
export declare class Debugger extends EventEmitter implements InstrumentationListener {
    private _pauseOnNextStatement;
    private _pausedCallsMetadata;
    private _enabled;
    private _context;
    static Events: {
        PausedStateChanged: string;
    };
    private _muted;
    constructor(context: BrowserContext);
    setMuted(muted: boolean): Promise<void>;
    onBeforeCall(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    onBeforeInputAction(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    pause(sdkObject: SdkObject, metadata: CallMetadata): Promise<void>;
    resume(step: boolean): void;
    pauseOnNextStatement(): void;
    isPaused(metadata?: CallMetadata): boolean;
    pausedDetails(): {
        metadata: CallMetadata;
        sdkObject: SdkObject;
    }[];
}
