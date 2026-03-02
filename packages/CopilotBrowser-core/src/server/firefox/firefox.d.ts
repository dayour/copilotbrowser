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
import { FFBrowser } from './ffBrowser';
import { BrowserType } from '../browserType';
import type { Browser, BrowserOptions } from '../browser';
import type { SdkObject } from '../instrumentation';
import type { ConnectionTransport } from '../transport';
import type * as types from '../types';
import type { RecentLogsCollector } from '../utils/debugLogger';
import type { BrowserContext } from '../browserContext';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class Firefox extends BrowserType {
    private _bidiFirefox;
    constructor(parent: SdkObject, bidiFirefox: BrowserType);
    launch(progress: Progress, options: types.LaunchOptions, protocolLogger?: types.ProtocolLogger): Promise<Browser>;
    launchPersistentContext(progress: Progress, userDataDir: string, options: channels.BrowserTypeLaunchPersistentContextOptions & {
        cdpPort?: number;
        internalIgnoreHTTPSErrors?: boolean;
        socksProxyPort?: number;
    }): Promise<BrowserContext>;
    connectToTransport(transport: ConnectionTransport, options: BrowserOptions): Promise<FFBrowser>;
    doRewriteStartupLog(logs: string): string;
    amendEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
    attemptToGracefullyCloseBrowser(transport: ConnectionTransport): void;
    defaultArgs(options: types.LaunchOptions, isPersistent: boolean, userDataDir: string): Promise<string[]>;
    waitForReadyState(options: types.LaunchOptions, browserLogsCollector: RecentLogsCollector): Promise<{
        wsEndpoint?: string;
    }>;
}
