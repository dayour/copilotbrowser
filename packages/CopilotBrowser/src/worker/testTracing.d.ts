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
import type { TestStepCategory, TestInfoImpl } from './testInfo';
import type { copilotbrowserWorkerOptions, TestInfo, TraceMode } from '../../types/test';
import type { TestInfoErrorImpl } from '../common/ipc';
import type { SerializedError, StackFrame } from '@protocol/channels';
import type * as trace from '@trace/trace';
export type Attachment = TestInfo['attachments'][0];
export declare const testTraceEntryName = "test.trace";
type TraceFixtureValue = copilotbrowserWorkerOptions['trace'] | undefined;
type TraceOptions = {
    screenshots: boolean;
    snapshots: boolean;
    sources: boolean;
    attachments: boolean;
    _live: boolean;
    mode: TraceMode;
};
export declare class TestTracing {
    private _testInfo;
    private _options;
    private _liveTraceFile;
    private _traceEvents;
    private _temporaryTraceFiles;
    private _artifactsDir;
    private _tracesDir;
    private _contextCreatedEvent;
    private _didFinishTestFunctionAndAfterEachHooks;
    constructor(testInfo: TestInfoImpl, artifactsDir: string);
    private _shouldCaptureTrace;
    startIfNeeded(value: TraceFixtureValue): Promise<void>;
    didFinishTestFunctionAndAfterEachHooks(): void;
    artifactsDir(): string;
    tracesDir(): string;
    traceTitle(): string;
    generateNextTraceRecordingName(): string;
    private _generateNextTraceRecordingPath;
    traceOptions(): TraceOptions;
    maybeGenerateNextTraceRecordingPath(): string;
    private _shouldAbandonTrace;
    stopIfNeeded(): Promise<void>;
    appendForError(error: TestInfoErrorImpl): void;
    _formatError(error: TestInfoErrorImpl): string;
    appendStdioToTrace(type: 'stdout' | 'stderr', chunk: string | Buffer): void;
    appendBeforeActionForStep(options: {
        stepId: string;
        parentId?: string;
        title: string;
        category: TestStepCategory;
        params?: Record<string, any>;
        stack: StackFrame[];
        group?: string;
    }): void;
    appendAfterActionForStep(callId: string, error?: SerializedError['error'], attachments?: Attachment[], annotations?: trace.AfterActionTraceEventAnnotation[]): void;
    private _appendTraceEvent;
}
export {};
