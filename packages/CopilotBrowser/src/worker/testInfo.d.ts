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
import { TimeoutManager } from './timeoutManager';
import { TestTracing } from './testTracing';
import type { RunnableDescription } from './timeoutManager';
import type { FullProject, TestInfo, TestStatus, TestStepInfo, TestAnnotation } from '../../types/test';
import type { FullConfig, Location } from '../../types/testReporter';
import type { FullConfigInternal, FullProjectInternal } from '../common/config';
import type * as ipc from '../common/ipc';
import type { TestCase } from '../common/test';
import type { StackFrame } from '@protocol/channels';
export type TestStepCategory = 'expect' | 'fixture' | 'hook' | 'pw:api' | 'test.step' | 'test.attach';
interface TestStepData {
    title: string;
    shortTitle?: string;
    category: TestStepCategory;
    location?: Location;
    apiName?: string;
    params?: Record<string, any>;
    infectParentStepsWithError?: boolean;
    box?: boolean;
    group?: string;
}
export interface TestStepInternal extends TestStepData {
    complete(result: {
        error?: Error | unknown;
        suggestedRebaseline?: string;
    }): void;
    info: TestStepInfoImpl;
    attachmentIndices: number[];
    stepId: string;
    boxedStack?: StackFrame[];
    steps: TestStepInternal[];
    endWallTime?: number;
    error?: ipc.TestInfoErrorImpl;
}
type TestInfoCallbacks = {
    onStepBegin: (payload: ipc.StepBeginPayload) => void;
    onStepEnd: (payload: ipc.StepEndPayload) => void;
    onAttach: (payload: ipc.AttachmentPayload) => void;
    onTestPaused: (payload: ipc.TestPausedPayload) => Promise<ipc.ResumePayload>;
    onCloneStorage: (payload: ipc.CloneStoragePayload) => Promise<string>;
    onUpstreamStorage: (payload: ipc.UpstreamStoragePayload) => Promise<void>;
};
export declare const emtpyTestInfoCallbacks: TestInfoCallbacks;
export declare class TestInfoImpl implements TestInfo {
    private _callbacks;
    private _snapshotNames;
    private _ariaSnapshotNames;
    readonly _timeoutManager: TimeoutManager;
    readonly _startTime: number;
    readonly _startWallTime: number;
    readonly _tracing: TestTracing;
    readonly _uniqueSymbol: any;
    private _interruptedPromise;
    _lastStepId: number;
    private readonly _requireFile;
    readonly _projectInternal: FullProjectInternal;
    readonly _configInternal: FullConfigInternal;
    private readonly _steps;
    private readonly _stepMap;
    _onDidFinishTestFunctionCallback?: () => Promise<void>;
    _onCustomMessageCallback?: (data: any) => Promise<any>;
    _hasNonRetriableError: boolean;
    _hasUnhandledError: boolean;
    _allowSkips: boolean;
    skip: (arg?: any, description?: string) => void;
    fixme: (arg?: any, description?: string) => void;
    fail: (arg?: any, description?: string) => void;
    slow: (arg?: any, description?: string) => void;
    readonly testId: string;
    readonly repeatEachIndex: number;
    readonly retry: number;
    readonly workerIndex: number;
    readonly parallelIndex: number;
    readonly project: FullProject;
    readonly config: FullConfig;
    readonly title: string;
    readonly titlePath: string[];
    readonly file: string;
    readonly line: number;
    readonly tags: string[];
    readonly column: number;
    readonly fn: Function;
    expectedStatus: TestStatus;
    duration: number;
    readonly annotations: TestAnnotation[];
    readonly attachments: TestInfo['attachments'];
    status: TestStatus;
    snapshotSuffix: string;
    readonly outputDir: string;
    readonly snapshotDir: string;
    errors: ipc.TestInfoErrorImpl[];
    readonly _attachmentsPush: (...items: TestInfo['attachments']) => number;
    private _workerParams;
    get error(): ipc.TestInfoErrorImpl | undefined;
    set error(e: ipc.TestInfoErrorImpl | undefined);
    get timeout(): number;
    set timeout(timeout: number);
    _deadlineForMatcher(timeout: number): {
        deadline: number;
        timeoutMessage: string;
    };
    static _defaultDeadlineForMatcher(timeout: number): {
        deadline: any;
        timeoutMessage: any;
    };
    constructor(configInternal: FullConfigInternal, projectInternal: FullProjectInternal, workerParams: ipc.WorkerInitParams, test: TestCase | undefined, retry: number, callbacks: TestInfoCallbacks);
    _modifier(type: 'skip' | 'fail' | 'fixme' | 'slow', location: Location, modifierArgs: [arg?: any, description?: string]): void;
    private _findLastPredefinedStep;
    private _parentStep;
    _addStep(data: Readonly<TestStepData>, parentStep?: TestStepInternal): TestStepInternal;
    _interrupt(): void;
    _failWithError(error: Error | unknown): void;
    _runAsStep(stepInfo: {
        title: string;
        category: 'hook' | 'fixture';
        location?: Location;
        group?: string;
    }, cb: () => Promise<any>): Promise<void>;
    _runWithTimeout(runnable: RunnableDescription, cb: () => Promise<any>): Promise<void>;
    _isFailure(): boolean;
    _currentHookType(): "fail" | "test" | "beforeAll" | "afterAll" | "beforeEach" | "afterEach" | "slow" | "skip" | "fixme" | "teardown";
    _setDebugMode(): void;
    _didFinishTestFunction(): Promise<void>;
    attach(name: string, options?: {
        path?: string;
        body?: string | Buffer;
        contentType?: string;
    }): Promise<void>;
    _attach(attachment: TestInfo['attachments'][0], stepId: string | undefined): void;
    outputPath(...pathSegments: string[]): string;
    _getOutputPath(...pathSegments: string[]): string;
    _fsSanitizedTestName(): any;
    _resolveSnapshotPaths(kind: 'snapshot' | 'screenshot' | 'aria', name: string | string[] | undefined, updateSnapshotIndex: 'updateSnapshotIndex' | 'dontUpdateSnapshotIndex', anonymousExtension?: string): {
        absoluteSnapshotPath: string;
        relativeOutputPath: string;
    };
    _applyPathTemplate(template: string, nameArgument: string, ext: string): string;
    snapshotPath(...name: string[]): string;
    snapshotPath(name: string, options: {
        kind: 'snapshot' | 'screenshot' | 'aria';
    }): string;
    setTimeout(timeout: number): void;
    _cloneStorage(storageFile: string): Promise<string>;
    _upstreamStorage(storageFile: string, storageOutFile: string): Promise<void>;
    artifactsDir(): string;
}
export declare class TestStepInfoImpl implements TestStepInfo {
    annotations: TestAnnotation[];
    private _testInfo;
    private _stepId;
    private _title;
    private _parentStep?;
    skip: (arg?: any, description?: string) => void;
    constructor(testInfo: TestInfoImpl, stepId: string, title: string, parentStep?: TestStepInfoImpl);
    _runStepBody<T>(skip: boolean, body: (step: TestStepInfo) => T | Promise<T>, location?: Location): Promise<T>;
    _attachToStep(attachment: TestInfo['attachments'][0]): void;
    attach(name: string, options?: {
        body?: string | Buffer;
        contentType?: string;
        path?: string;
    }): Promise<void>;
    get titlePath(): string[];
}
export declare class TestSkipError extends Error {
}
export declare class StepSkipError extends Error {
}
export {};
