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
import type { Metadata, TestAnnotation } from '../../types/test';
import type * as reporterTypes from '../../types/testReporter';
import type { ReporterV2 } from '../reporters/reporterV2';
export type StringIntern = (s: string) => string;
export type JsonLocation = reporterTypes.Location;
export type JsonError = string;
export type JsonStackFrame = {
    file: string;
    line: number;
    column: number;
};
export type JsonStdIOType = 'stdout' | 'stderr';
export type JsonConfig = Pick<reporterTypes.FullConfig, 'configFile' | 'globalTimeout' | 'maxFailures' | 'metadata' | 'rootDir' | 'version' | 'workers' | 'globalSetup' | 'globalTeardown' | 'shard'> & {
    tags?: reporterTypes.FullConfig['tags'];
    webServer?: reporterTypes.FullConfig['webServer'];
};
export type JsonPattern = {
    s?: string;
    r?: {
        source: string;
        flags: string;
    };
};
export type JsonProject = {
    grep: JsonPattern[];
    grepInvert: JsonPattern[];
    metadata: Metadata;
    name: string;
    dependencies: string[];
    snapshotDir: string;
    outputDir: string;
    repeatEach: number;
    retries: number;
    suites: JsonSuite[];
    teardown?: string;
    testDir: string;
    testIgnore: JsonPattern[];
    testMatch: JsonPattern[];
    timeout: number;
    use: {
        [key: string]: any;
    };
    ignoreSnapshots?: boolean;
};
export type JsonSuite = {
    title: string;
    location?: JsonLocation;
    entries: (JsonSuite | JsonTestCase)[];
};
export type JsonTestCase = {
    testId: string;
    title: string;
    location: JsonLocation;
    retries: number;
    tags?: string[];
    repeatEachIndex: number;
    annotations?: TestAnnotation[];
};
export type JsonTestEnd = {
    testId: string;
    expectedStatus: reporterTypes.TestStatus;
    timeout: number;
    annotations: [];
};
export type JsonTestResultStart = {
    id: string;
    retry: number;
    workerIndex: number;
    parallelIndex: number;
    startTime: number;
};
export type JsonAttachment = Omit<reporterTypes.TestResult['attachments'][0], 'body'> & {
    base64?: string;
};
export type JsonTestResultEnd = {
    id: string;
    duration: number;
    status: reporterTypes.TestStatus;
    errors: reporterTypes.TestError[];
    /** No longer emitted, but kept for backwards compatibility */
    attachments?: JsonAttachment[];
    annotations?: TestAnnotation[];
};
export type JsonTestStepStart = {
    id: string;
    parentStepId?: string;
    title: string;
    category: string;
    startTime: number;
    location?: reporterTypes.Location;
};
export type JsonTestStepEnd = {
    id: string;
    duration: number;
    error?: reporterTypes.TestError;
    attachments?: number[];
    annotations?: TestAnnotation[];
};
export type JsonTestResultOnAttach = {
    testId: string;
    resultId: string;
    attachments: JsonAttachment[];
};
export type JsonFullResult = {
    status: reporterTypes.FullResult['status'];
    startTime: number;
    duration: number;
};
export type JsonEvent = JsonOnConfigureEvent | JsonOnBlobReportMetadataEvent | JsonOnEndEvent | JsonOnExitEvent | JsonOnProjectEvent | JsonOnBeginEvent | JsonOnTestBeginEvent | JsonOnTestEndEvent | JsonOnStepBeginEvent | JsonOnStepEndEvent | JsonOnAttachEvent | JsonOnErrorEvent | JsonOnTestPausedEvent | JsonOnStdIOEvent;
export type JsonOnConfigureEvent = {
    method: 'onConfigure';
    params: {
        config: JsonConfig;
    };
};
export type JsonOnBlobReportMetadataEvent = {
    method: 'onBlobReportMetadata';
    params: BlobReportMetadata;
};
export type JsonOnProjectEvent = {
    method: 'onProject';
    params: {
        project: JsonProject;
    };
};
export type JsonOnBeginEvent = {
    method: 'onBegin';
    params: undefined;
};
export type JsonOnTestBeginEvent = {
    method: 'onTestBegin';
    params: {
        testId: string;
        result: JsonTestResultStart;
    };
};
export type JsonOnTestPausedEvent = {
    method: 'onTestPaused';
    params: {
        testId: string;
        resultId: string;
        errors: reporterTypes.TestError[];
    };
};
export type JsonOnTestEndEvent = {
    method: 'onTestEnd';
    params: {
        test: JsonTestEnd;
        testId?: string;
        result: JsonTestResultEnd;
    };
};
export type JsonOnStepBeginEvent = {
    method: 'onStepBegin';
    params: {
        testId: string;
        resultId: string;
        step: JsonTestStepStart;
    };
};
export type JsonOnStepEndEvent = {
    method: 'onStepEnd';
    params: {
        testId: string;
        resultId: string;
        step: JsonTestStepEnd;
    };
};
export type JsonOnAttachEvent = {
    method: 'onAttach';
    params: JsonTestResultOnAttach;
};
export type JsonOnErrorEvent = {
    method: 'onError';
    params: {
        error: reporterTypes.TestError;
    };
};
export type JsonOnStdIOEvent = {
    method: 'onStdIO';
    params: {
        type: JsonStdIOType;
        testId?: string;
        resultId?: string;
        data: string;
        isBase64: boolean;
    };
};
export type JsonOnEndEvent = {
    method: 'onEnd';
    params: {
        result: JsonFullResult;
    };
};
export type JsonOnExitEvent = {
    method: 'onExit';
    params: undefined;
};
export type BlobReportMetadata = {
    version: number;
    userAgent: string;
    name?: string;
    shard?: {
        total: number;
        current: number;
    };
    pathSeparator?: string;
};
type TeleReporterReceiverOptions = {
    mergeProjects?: boolean;
    mergeTestCases?: boolean;
    resolvePath?: (rootDir: string, relativePath: string) => string;
    configOverrides?: Pick<reporterTypes.FullConfig, 'configFile' | 'quiet' | 'reportSlowTests' | 'reporter'>;
    clearPreviousResultsWhenTestBegins?: boolean;
};
export declare class TeleReporterReceiver {
    isListing: boolean;
    private _rootSuite;
    private _options;
    private _reporter;
    private _tests;
    private _rootDir;
    private _config;
    constructor(reporter: ReporterV2, options?: TeleReporterReceiverOptions);
    reset(): void;
    dispatch(message: JsonEvent): Promise<void> | void;
    private _onConfigure;
    private _onProject;
    private _onBegin;
    private _onTestBegin;
    private _onTestPaused;
    private _onTestEnd;
    private _onStepBegin;
    private _onStepEnd;
    private _onAttach;
    private _onError;
    private _onStdIO;
    private _onEnd;
    private _onExit;
    private _parseConfig;
    private _parseProject;
    private _parseAttachments;
    private _mergeSuiteInto;
    private _mergeTestInto;
    private _updateTest;
    private _absoluteAnnotationLocationsInplace;
    private _absoluteLocation;
    private _absolutePath;
}
export declare class TeleSuite implements reporterTypes.Suite {
    title: string;
    location?: reporterTypes.Location;
    parent?: TeleSuite;
    _entries: (TeleSuite | TeleTestCase)[];
    _requireFile: string;
    _timeout: number | undefined;
    _retries: number | undefined;
    _project: TeleFullProject | undefined;
    _parallelMode: 'none' | 'default' | 'serial' | 'parallel';
    private readonly _type;
    constructor(title: string, type: 'root' | 'project' | 'file' | 'describe');
    get type(): "root" | "project" | "file" | "describe";
    get suites(): TeleSuite[];
    get tests(): TeleTestCase[];
    entries(): (TeleSuite | TeleTestCase)[];
    allTests(): reporterTypes.TestCase[];
    titlePath(): string[];
    project(): TeleFullProject | undefined;
    _addTest(test: TeleTestCase): void;
    _addSuite(suite: TeleSuite): void;
}
export declare class TeleTestCase implements reporterTypes.TestCase {
    title: string;
    fn: () => void;
    results: TeleTestResult[];
    location: reporterTypes.Location;
    parent: TeleSuite;
    type: 'test';
    expectedStatus: reporterTypes.TestStatus;
    timeout: number;
    annotations: TestAnnotation[];
    retries: number;
    tags: string[];
    repeatEachIndex: number;
    id: string;
    constructor(id: string, title: string, location: reporterTypes.Location, repeatEachIndex: number);
    titlePath(): string[];
    outcome(): 'skipped' | 'expected' | 'unexpected' | 'flaky';
    ok(): boolean;
    _createTestResult(id: string): TeleTestResult;
}
declare class TeleTestStep implements reporterTypes.TestStep {
    title: string;
    category: string;
    location: reporterTypes.Location | undefined;
    parent: reporterTypes.TestStep | undefined;
    duration: number;
    steps: reporterTypes.TestStep[];
    error: reporterTypes.TestError | undefined;
    private _result;
    _endPayload?: JsonTestStepEnd;
    private _startTime;
    constructor(payload: JsonTestStepStart, parentStep: reporterTypes.TestStep | undefined, location: reporterTypes.Location | undefined, result: TeleTestResult);
    titlePath(): string[];
    get startTime(): Date;
    set startTime(value: Date);
    get attachments(): {
        name: string;
        contentType: string;
        path?: string;
        body?: Buffer;
    }[];
    get annotations(): TestAnnotation[];
}
export declare class TeleTestResult implements reporterTypes.TestResult {
    retry: reporterTypes.TestResult['retry'];
    parallelIndex: reporterTypes.TestResult['parallelIndex'];
    workerIndex: reporterTypes.TestResult['workerIndex'];
    duration: reporterTypes.TestResult['duration'];
    stdout: reporterTypes.TestResult['stdout'];
    stderr: reporterTypes.TestResult['stderr'];
    attachments: reporterTypes.TestResult['attachments'];
    annotations: reporterTypes.TestResult['annotations'];
    status: reporterTypes.TestStatus;
    steps: TeleTestStep[];
    errors: reporterTypes.TestResult['errors'];
    error: reporterTypes.TestResult['error'];
    _stepMap: Map<string, TeleTestStep>;
    _id: string;
    private _startTime;
    constructor(retry: number, id: string);
    setStartTimeNumber(startTime: number): void;
    get startTime(): Date;
    set startTime(value: Date);
}
export type TeleFullProject = reporterTypes.FullProject;
export declare const baseFullConfig: reporterTypes.FullConfig;
export declare function serializeRegexPatterns(patterns: string | RegExp | (string | RegExp)[]): JsonPattern[];
export declare function parseRegexPatterns(patterns: JsonPattern[]): (string | RegExp)[];
export declare function computeTestCaseOutcome(test: reporterTypes.TestCase): "expected" | "skipped" | "unexpected" | "flaky";
export declare function asFullResult(result: JsonFullResult): reporterTypes.FullResult;
export declare function asFullConfig(config: JsonConfig): reporterTypes.FullConfig;
export {};
