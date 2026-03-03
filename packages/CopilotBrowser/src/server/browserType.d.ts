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
import { SdkObject } from './instrumentation';
import { RecentLogsCollector } from './utils/debugLogger';
import type { Browser, BrowserOptions } from './browser';
import type { BrowserContext } from './browserContext';
import type { Progress } from './progress';
import type { BrowserName } from './registry';
import type { ConnectionTransport } from './transport';
import type * as types from './types';
import type * as channels from '@protocol/channels';
export declare const kNoXServerRunningError: string;
export declare abstract class BrowserType extends SdkObject {
    private _name;
    constructor(parent: SdkObject, browserName: BrowserName);
    executablePath(): string;
    name(): string;
    launch(progress: Progress, options: types.LaunchOptions, protocolLogger?: types.ProtocolLogger): Promise<Browser>;
    launchPersistentContext(progress: Progress, userDataDir: string, options: channels.BrowserTypeLaunchPersistentContextOptions & {
        cdpPort?: number;
        internalIgnoreHTTPSErrors?: boolean;
        socksProxyPort?: number;
    }): Promise<BrowserContext>;
    private _innerLaunchWithRetries;
    private _innerLaunch;
    private _prepareToLaunch;
    private _launchProcess;
    connectOverCDP(progress: Progress, endpointURL: string, options: {
        slowMo?: number;
        timeout?: number;
        headers?: types.HeadersArray;
        isLocal?: boolean;
    }): Promise<Browser>;
    connectOverCDPTransport(progress: Progress, transport: ConnectionTransport): Promise<Browser>;
    _launchWithSeleniumHub(progress: Progress, hubUrl: string, options: types.LaunchOptions): Promise<Browser>;
    private _validateLaunchOptions;
    protected _createUserDataDirArgMisuseError(userDataDirArg: string): Error;
    private _rewriteStartupLog;
    waitForReadyState(options: types.LaunchOptions, browserLogsCollector: RecentLogsCollector): Promise<{
        wsEndpoint?: string;
    }>;
    prepareUserDataDir(options: types.LaunchOptions, userDataDir: string): Promise<void>;
    supportsPipeTransport(): boolean;
    getExecutableName(options: types.LaunchOptions): string;
    abstract defaultArgs(options: types.LaunchOptions, isPersistent: boolean, userDataDir: string): Promise<string[]>;
    abstract connectToTransport(transport: ConnectionTransport, options: BrowserOptions, browserLogsCollector: RecentLogsCollector): Promise<Browser>;
    abstract amendEnvironment(env: NodeJS.ProcessEnv, userDataDir: string, isPersistent: boolean, options: types.LaunchOptions): NodeJS.ProcessEnv;
    abstract doRewriteStartupLog(logs: string): string;
    abstract attemptToGracefullyCloseBrowser(transport: ConnectionTransport): void;
}
