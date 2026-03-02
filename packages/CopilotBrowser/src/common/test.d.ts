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
import type { FixturesWithLocation, FullProjectInternal } from './config';
import type { FixturePool } from './fixtures';
import type { TestTypeImpl } from './testType';
import type { TestAnnotation } from '../../types/test';
import type * as reporterTypes from '../../types/testReporter';
import type { FullProject, Location } from '../../types/testReporter';
declare class Base {
    title: string;
    _only: boolean;
    _requireFile: string;
    constructor(title: string);
}
export type Modifier = {
    type: 'slow' | 'fixme' | 'skip' | 'fail';
    fn: Function;
    location: Location;
    description: string | undefined;
};
export declare class Suite extends Base {
    location?: Location;
    parent?: Suite;
    _use: FixturesWithLocation[];
    _entries: (Suite | TestCase)[];
    _hooks: {
        type: 'beforeEach' | 'afterEach' | 'beforeAll' | 'afterAll';
        fn: Function;
        title: string;
        location: Location;
    }[];
    _timeout: number | undefined;
    _retries: number | undefined;
    _staticAnnotations: TestAnnotation[];
    _tags: string[];
    _modifiers: Modifier[];
    _parallelMode: 'none' | 'default' | 'serial' | 'parallel';
    _fullProject: FullProjectInternal | undefined;
    _fileId: string | undefined;
    readonly _type: 'root' | 'project' | 'file' | 'describe';
    constructor(title: string, type: 'root' | 'project' | 'file' | 'describe');
    get type(): 'root' | 'project' | 'file' | 'describe';
    entries(): (TestCase | Suite)[];
    get suites(): Suite[];
    get tests(): TestCase[];
    _addTest(test: TestCase): void;
    _addSuite(suite: Suite): void;
    _prependSuite(suite: Suite): void;
    allTests(): TestCase[];
    _hasTests(): boolean;
    titlePath(): string[];
    _collectGrepTitlePath(path: string[]): void;
    _collectTagTitlePath(path: string[]): void;
    _getOnlyItems(): (TestCase | Suite)[];
    _deepClone(): Suite;
    _deepSerialize(): any;
    static _deepParse(data: any): Suite;
    forEachTest(visitor: (test: TestCase, suite: Suite) => void): void;
    _serialize(): any;
    static _parse(data: any): Suite;
    _clone(): Suite;
    project(): FullProject | undefined;
}
export declare class TestCase extends Base implements reporterTypes.TestCase {
    fn: Function;
    results: reporterTypes.TestResult[];
    location: Location;
    parent: Suite;
    type: 'test';
    expectedStatus: reporterTypes.TestStatus;
    timeout: number;
    annotations: TestAnnotation[];
    retries: number;
    repeatEachIndex: number;
    _testType: TestTypeImpl;
    id: string;
    _pool: FixturePool | undefined;
    _poolDigest: string;
    _workerHash: string;
    _projectId: string;
    _tags: string[];
    constructor(title: string, fn: Function, testType: TestTypeImpl, location: Location);
    titlePath(): string[];
    outcome(): 'skipped' | 'expected' | 'unexpected' | 'flaky';
    ok(): boolean;
    get tags(): string[];
    _serialize(): any;
    static _parse(data: any): TestCase;
    _clone(): TestCase;
    _appendTestResult(): reporterTypes.TestResult;
    _grepBaseTitlePath(): string[];
    _grepTitleWithTags(): string;
}
export {};
