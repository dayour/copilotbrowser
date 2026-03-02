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
import type { Config } from '../config';
import type { ClientInfo } from '../sdk/server';
import type { SessionConfig } from '../../cli/client/registry';
type ViewportSize = {
    width: number;
    height: number;
};
export type CLIOptions = {
    allowedHosts?: string[];
    allowedOrigins?: string[];
    allowUnrestrictedFileAccess?: boolean;
    blockedOrigins?: string[];
    blockServiceWorkers?: boolean;
    browser?: string;
    caps?: string[];
    cdpEndpoint?: string;
    cdpHeader?: Record<string, string>;
    cdpTimeout?: number;
    codegen?: 'typescript' | 'none';
    config?: string;
    consoleLevel?: 'error' | 'warning' | 'info' | 'debug';
    device?: string;
    extension?: boolean;
    executablePath?: string;
    grantPermissions?: string[];
    headless?: boolean;
    host?: string;
    ignoreHttpsErrors?: boolean;
    initScript?: string[];
    initPage?: string[];
    isolated?: boolean;
    imageResponses?: 'allow' | 'omit';
    sandbox?: boolean;
    outputDir?: string;
    outputMode?: 'file' | 'stdout';
    port?: number;
    proxyBypass?: string;
    proxyServer?: string;
    saveSession?: boolean;
    saveTrace?: boolean;
    saveVideo?: ViewportSize;
    secrets?: Record<string, string>;
    sharedBrowserContext?: boolean;
    snapshotMode?: 'incremental' | 'full' | 'none';
    storageState?: string;
    testIdAttribute?: string;
    timeoutAction?: number;
    timeoutNavigation?: number;
    userAgent?: string;
    userDataDir?: string;
    viewportSize?: ViewportSize;
};
export declare const defaultConfig: FullConfig;
type BrowserUserConfig = NonNullable<Config['browser']>;
export type FullConfig = Config & {
    browser: Omit<BrowserUserConfig, 'browserName' | 'launchOptions' | 'contextOptions'> & {
        browserName: 'chromium' | 'firefox' | 'webkit';
        launchOptions: NonNullable<BrowserUserConfig['launchOptions']>;
        contextOptions: NonNullable<BrowserUserConfig['contextOptions']>;
        isolated: boolean;
    };
    console: {
        level: 'error' | 'warning' | 'info' | 'debug';
    };
    network: NonNullable<Config['network']>;
    saveTrace: boolean;
    server: NonNullable<Config['server']>;
    snapshot: {
        mode: 'incremental' | 'full' | 'none';
        output: 'stdout' | 'file';
    };
    timeouts: {
        action: number;
        navigation: number;
    };
    skillMode?: boolean;
    configFile?: string;
    sessionConfig?: SessionConfig;
};
export declare function resolveConfig(config: Config): Promise<FullConfig>;
export declare function resolveCLIConfig(cliOptions: CLIOptions): Promise<FullConfig>;
export declare function validateConfig(config: FullConfig): Promise<void>;
export declare function configFromCLIOptions(cliOptions: CLIOptions): Config & {
    configFile?: string;
};
export declare function configFromEnv(): Config & {
    configFile?: string;
};
export declare function loadConfig(configFile: string | undefined): Promise<Config>;
export declare function workspaceDir(clientInfo: ClientInfo): string;
export declare function workspaceFile(config: FullConfig, clientInfo: ClientInfo, fileName: string, perCallWorkspaceDir?: string): Promise<string>;
export declare function outputDir(config: FullConfig, clientInfo: ClientInfo): string;
export declare function outputFile(config: FullConfig, clientInfo: ClientInfo, fileName: string, options: {
    origin: 'code' | 'llm';
}): Promise<string>;
export declare function mergeConfig(base: FullConfig, overrides: Config): FullConfig;
export declare function semicolonSeparatedList(value: string | undefined): string[] | undefined;
export declare function commaSeparatedList(value: string | undefined): string[] | undefined;
export declare function dotenvFileLoader(value: string | undefined): Record<string, string> | undefined;
export declare function numberParser(value: string | undefined): number | undefined;
export declare function resolutionParser(name: string, value: string | undefined): ViewportSize | undefined;
export declare function headerParser(arg: string | undefined, previous?: Record<string, string>): Record<string, string>;
export declare function enumParser<T extends string>(name: string, options: T[], value: string): T;
export {};
