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
import type { FixturesWithLocation } from './config';
import type { Fixtures } from '../../types/test';
import type { Location } from '../../types/testReporter';
export type FixtureScope = 'test' | 'worker';
type FixtureAuto = boolean | 'all-hooks-included';
export type FixtureRegistration = {
    location: Location;
    name: string;
    scope: FixtureScope;
    fn: Function | any;
    auto: FixtureAuto;
    option: boolean;
    customTitle?: string;
    timeout?: number;
    deps: string[];
    id: string;
    super?: FixtureRegistration;
    optionOverride?: boolean;
    box?: boolean | 'self';
};
export type LoadError = {
    message: string;
    location: Location;
};
type LoadErrorSink = (error: LoadError) => void;
type OptionOverrides = {
    overrides: Fixtures;
    location: Location;
};
export declare class FixturePool {
    readonly digest: string;
    private readonly _registrations;
    private _onLoadError;
    constructor(fixturesList: FixturesWithLocation[], onLoadError: LoadErrorSink, parentPool?: FixturePool, disallowWorkerFixtures?: boolean, optionOverrides?: OptionOverrides);
    private _appendFixtureList;
    private validate;
    validateFunction(fn: Function, prefix: string, location: Location): void;
    resolve(name: string, forFixture?: FixtureRegistration): FixtureRegistration | undefined;
    autoFixtures(): FixtureRegistration[];
    private _addLoadError;
}
export declare function formatPotentiallyInternalLocation(location: Location): string;
export declare function fixtureParameterNames(fn: Function | any, location: Location, onError: LoadErrorSink): string[];
export declare function inheritFixtureNames(from: Function, to: Function): void;
export {};
