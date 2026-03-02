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
import type { Config, Fixtures, Metadata, Project, ReporterDescription } from '../../types/test';
import type { TestRunnerPluginRegistration } from '../plugins';
import type { TestCaseFilter } from '../util';
import type { ConfigCLIOverrides } from './ipc';
import type { Location } from '../../types/testReporter';
import type { FullConfig, FullProject } from '../../types/testReporter';
export type ConfigLocation = {
    resolvedConfigFile?: string;
    configDir: string;
};
export type FixturesWithLocation = {
    fixtures: Fixtures;
    location: Location;
};
export declare const defaultTimeout = 30000;
export declare class FullConfigInternal {
    readonly config: FullConfig;
    readonly configDir: string;
    readonly configCLIOverrides: ConfigCLIOverrides;
    readonly webServers: NonNullable<FullConfig['webServer']>[];
    readonly plugins: TestRunnerPluginRegistration[];
    readonly projects: FullProjectInternal[];
    readonly singleTSConfigPath?: string;
    readonly captureGitInfo: Config['captureGitInfo'];
    readonly failOnFlakyTests: boolean;
    cliArgs: string[];
    cliGrep: string | undefined;
    cliGrepInvert: string | undefined;
    cliOnlyChanged: string | undefined;
    cliProjectFilter?: string[];
    cliListOnly: boolean;
    cliPassWithNoTests?: boolean;
    cliLastFailed?: boolean;
    cliTestList?: string;
    cliTestListInvert?: string;
    preOnlyTestFilters: TestCaseFilter[];
    postShardTestFilters: TestCaseFilter[];
    defineConfigWasUsed: boolean;
    globalSetups: string[];
    globalTeardowns: string[];
    constructor(location: ConfigLocation, userConfig: Config, configCLIOverrides: ConfigCLIOverrides, metadata?: Metadata);
    private _assignUniqueProjectIds;
}
export declare class FullProjectInternal {
    readonly project: FullProject;
    readonly fullConfig: FullConfigInternal;
    readonly fullyParallel: boolean;
    readonly expect: Project['expect'];
    readonly respectGitIgnore: boolean;
    readonly snapshotPathTemplate: string | undefined;
    readonly workers: number | undefined;
    id: string;
    deps: FullProjectInternal[];
    teardown: FullProjectInternal | undefined;
    constructor(configDir: string, config: Config, fullConfig: FullConfigInternal, projectConfig: Project, configCLIOverrides: ConfigCLIOverrides, packageJsonDir: string);
}
export declare function takeFirst<T>(...args: (T | undefined)[]): T;
export declare function toReporters(reporters: BuiltInReporter | ReporterDescription[] | undefined): ReporterDescription[] | undefined;
export declare const builtInReporters: readonly ["list", "line", "dot", "json", "junit", "null", "github", "html", "blob"];
export type BuiltInReporter = typeof builtInReporters[number];
export type ContextReuseMode = 'none' | 'when-possible';
export declare const defaultGrep: RegExp;
export declare const defaultReporter: string;
export declare function getProjectId(project: FullProject): string;
