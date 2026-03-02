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
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestError, TestResult, TestStep } from '../../types/testReporter';
export interface ReportConfigureParams {
    config: FullConfig;
    reportPath: string;
}
export interface ReportEndParams {
    reportPath: string;
    result: FullResult;
}
export interface ReporterV2 {
    onConfigure?(config: FullConfig): void;
    onBegin?(suite: Suite): void;
    onTestBegin?(test: TestCase, result: TestResult): void;
    onStdOut?(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
    onStdErr?(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
    onTestPaused?(test: TestCase, result: TestResult): Promise<void>;
    onTestEnd?(test: TestCase, result: TestResult): void;
    onReportConfigure?(params: ReportConfigureParams): void;
    onReportEnd?(params: ReportEndParams): void;
    onEnd?(result: FullResult): Promise<{
        status?: FullResult['status'];
    } | undefined | void> | void;
    onExit?(): void | Promise<void>;
    onError?(error: TestError): void;
    onStepBegin?(test: TestCase, result: TestResult, step: TestStep): void;
    onStepEnd?(test: TestCase, result: TestResult, step: TestStep): void;
    printsToStdio?(): boolean;
    version(): 'v2';
}
export type AnyReporter = ReporterV2 | Reporter;
export declare function wrapReporterAsV2(reporter: Reporter | ReporterV2): ReporterV2;
