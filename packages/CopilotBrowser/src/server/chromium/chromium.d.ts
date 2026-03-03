/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
import { CRBrowser } from './crBrowser';
import { RecentLogsCollector } from '../utils/debugLogger';
import { BrowserType } from '../browserType';
import { Browser } from '../browser';
import type { BrowserOptions } from '../browser';
import type { SdkObject } from '../instrumentation';
import type { Progress } from '../progress';
import type { ConnectionTransport } from '../transport';
import type { BrowserContext } from '../browserContext';
import type * as types from '../types';
import type * as channels from '@protocol/channels';
export declare class Chromium extends BrowserType {
    private _devtools;
    private _bidiChromium;
    constructor(parent: SdkObject, bidiChromium: BrowserType);
    launch(progress: Progress, options: types.LaunchOptions, protocolLogger?: types.ProtocolLogger): Promise<Browser>;
    launchPersistentContext(progress: Progress, userDataDir: string, options: channels.BrowserTypeLaunchPersistentContextOptions & {
        cdpPort?: number;
        internalIgnoreHTTPSErrors?: boolean;
        socksProxyPort?: number;
    }): Promise<BrowserContext>;
    connectOverCDP(progress: Progress, endpointURL: string, options: {
        slowMo?: number;
        headers?: types.HeadersArray;
        isLocal?: boolean;
    }): Promise<any>;
    _connectOverCDPInternal(progress: Progress, endpointURL: string, options: types.LaunchOptions & {
        headers?: types.HeadersArray;
        isLocal?: boolean;
    }, onClose?: () => Promise<void>): Promise<any>;
    private _connectOverCDPImpl;
    connectOverCDPTransport(progress: Progress, transport: ConnectionTransport): Promise<any>;
    private _createDevTools;
    connectToTransport(transport: ConnectionTransport, options: BrowserOptions, browserLogsCollector: RecentLogsCollector): Promise<CRBrowser>;
    doRewriteStartupLog(logs: string): string;
    amendEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
    attemptToGracefullyCloseBrowser(transport: ConnectionTransport): void;
    _launchWithSeleniumHub(progress: Progress, hubUrl: string, options: types.LaunchOptions): Promise<CRBrowser>;
    defaultArgs(options: types.LaunchOptions, isPersistent: boolean, userDataDir: string): Promise<string[]>;
    private _innerDefaultArgs;
    waitForReadyState(options: types.LaunchOptions, browserLogsCollector: RecentLogsCollector): Promise<{
        wsEndpoint?: string;
    }>;
    getExecutableName(options: types.LaunchOptions): string;
}
export declare function waitForReadyState(options: types.LaunchOptions, browserLogsCollector: RecentLogsCollector): Promise<{
    wsEndpoint?: string;
}>;
