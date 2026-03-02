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
import type { BrowserContext } from './browserContext';
import type { Progress } from '@protocol/progress';
export declare class Clock {
    private _browserContext;
    private _initScripts;
    constructor(browserContext: BrowserContext);
    uninstall(progress: Progress): Promise<void>;
    fastForward(progress: Progress, ticks: number | string): Promise<void>;
    install(progress: Progress, time: number | string | undefined): Promise<void>;
    pauseAt(progress: Progress, ticks: number | string): Promise<void>;
    resumeNoReply(): void;
    resume(progress: Progress): Promise<void>;
    setFixedTime(progress: Progress, time: string | number): Promise<void>;
    setSystemTime(progress: Progress, time: string | number): Promise<void>;
    runFor(progress: Progress, ticks: number | string): Promise<void>;
    private _installIfNeeded;
    private _evaluateInFrames;
}
