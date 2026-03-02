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
import type { Progress } from '@protocol/progress';
import type { CallMetadata, SdkObject } from './instrumentation';
export type { Progress } from '@protocol/progress';
export declare class ProgressController {
    private _forceAbortPromise;
    private _donePromise;
    private _state;
    private _onCallLog?;
    readonly metadata: CallMetadata;
    private _controller;
    constructor(metadata?: CallMetadata, onCallLog?: (message: string) => void);
    static createForSdkObject(sdkObject: SdkObject, callMetadata: CallMetadata): ProgressController;
    static runInternalTask(task: (progress: Progress) => Promise<void>, timeout?: number): Promise<void>;
    abort(error: Error): Promise<void>;
    run<T>(task: (progress: Progress) => Promise<T>, timeout?: number): Promise<T>;
}
export declare function isAbortError(error: Error): boolean;
export declare function raceUncancellableOperationWithCleanup<T>(progress: Progress, run: () => Promise<T>, cleanup: (t: T) => void | Promise<unknown>): Promise<T>;
