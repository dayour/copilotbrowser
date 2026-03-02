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
import type { FixturesWithLocation } from './config';
import type { TestStepInfo, TestType } from '../../types/test';
import type { Location } from '../../types/testReporter';
export declare class TestTypeImpl {
    readonly fixtures: FixturesWithLocation[];
    readonly test: TestType<any, any>;
    constructor(fixtures: FixturesWithLocation[]);
    private _currentSuite;
    private _createTest;
    private _describe;
    private _hook;
    private _configure;
    private _modifier;
    private _setTimeout;
    private _use;
    _step<T>(expectation: 'pass' | 'skip', title: string, body: (step: TestStepInfo) => T | Promise<T>, options?: {
        box?: boolean;
        location?: Location;
        timeout?: number;
    }): Promise<T>;
    private _extend;
}
export declare const rootTestType: TestTypeImpl;
export declare function mergeTests(...tests: TestType<any, any>[]): TestType<any, any>;
