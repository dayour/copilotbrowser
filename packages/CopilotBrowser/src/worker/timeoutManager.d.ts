/**
 * Copyright Microsoft Corporation. All rights reserved.
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
import type { Location } from '../../types/testReporter';
export type TimeSlot = {
    timeout: number;
    elapsed: number;
};
type RunnableType = 'test' | 'beforeAll' | 'afterAll' | 'beforeEach' | 'afterEach' | 'slow' | 'skip' | 'fail' | 'fixme' | 'teardown';
export type RunnableDescription = {
    type: RunnableType;
    location?: Location;
    slot?: TimeSlot;
    fixture?: FixtureDescription;
};
export type FixtureDescription = {
    title: string;
    phase: 'setup' | 'teardown';
    location?: Location;
    slot?: TimeSlot;
};
export declare const kMaxDeadline = 2147483647;
export declare class TimeoutManager {
    private _defaultSlot;
    private _running?;
    private _ignoreTimeouts;
    constructor(timeout: number);
    setIgnoreTimeouts(): void;
    interrupt(): void;
    isTimeExhaustedFor(runnable: RunnableDescription): boolean;
    withRunnable<T>(runnable: RunnableDescription, cb: () => Promise<T>): Promise<T>;
    private _updateTimeout;
    defaultSlot(): TimeSlot;
    slow(): void;
    setTimeout(timeout: number): void;
    currentSlotDeadline(): number;
    currentSlotType(): RunnableType;
    private _createTimeoutError;
}
export declare class TimeoutManagerError extends Error {
}
export {};
