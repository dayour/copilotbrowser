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
import { Artifact } from './artifact';
import { BrowserContext } from './browserContext';
import { SdkObject } from './instrumentation';
import { Page } from './page';
import type * as types from './types';
import type { ProxySettings } from './types';
import type { RecentLogsCollector } from './utils/debugLogger';
import type * as channels from '@protocol/channels';
import type { ChildProcess } from 'child_process';
import type { Language } from '../utils';
import type { Progress } from './progress';
export interface BrowserProcess {
    onclose?: ((exitCode: number | null, signal: string | null) => void);
    process?: ChildProcess;
    kill(): Promise<void>;
    close(): Promise<void>;
}
export type BrowserOptions = {
    name: string;
    isChromium: boolean;
    channel?: string;
    artifactsDir: string;
    downloadsPath: string;
    tracesDir: string;
    headful?: boolean;
    persistent?: types.BrowserContextOptions;
    browserProcess: BrowserProcess;
    customExecutablePath?: string;
    proxy?: ProxySettings;
    protocolLogger: types.ProtocolLogger;
    browserLogsCollector: RecentLogsCollector;
    slowMo?: number;
    wsEndpoint?: string;
    sdkLanguage?: Language;
    originalLaunchOptions: types.LaunchOptions;
};
export declare abstract class Browser extends SdkObject {
    static Events: {
        Context: string;
        Disconnected: string;
    };
    readonly options: BrowserOptions;
    private _downloads;
    _defaultContext: BrowserContext | null;
    private _startedClosing;
    readonly _idToVideo: Map<string, {
        context: BrowserContext;
        artifact: Artifact;
    }>;
    private _contextForReuse;
    _closeReason: string | undefined;
    _isCollocatedWithServer: boolean;
    constructor(parent: SdkObject, options: BrowserOptions);
    abstract doCreateNewContext(options: types.BrowserContextOptions): Promise<BrowserContext>;
    abstract contexts(): BrowserContext[];
    abstract isConnected(): boolean;
    abstract version(): string;
    abstract userAgent(): string;
    sdkLanguage(): Language;
    newContext(progress: Progress, options: types.BrowserContextOptions): Promise<BrowserContext>;
    newContextForReuse(progress: Progress, params: channels.BrowserNewContextForReuseParams): Promise<BrowserContext>;
    contextForReuse(): BrowserContext<import("./instrumentation").EventMap>;
    _downloadCreated(page: Page, uuid: string, url: string, suggestedFilename?: string): void;
    _downloadFilenameSuggested(uuid: string, suggestedFilename: string): void;
    _downloadFinished(uuid: string, error?: string): void;
    _videoStarted(page: Page, videoId: string, path: string): Artifact;
    _takeVideo(videoId: string): Artifact | undefined;
    _didClose(): void;
    close(options: {
        reason?: string;
    }): Promise<void>;
    killForTests(): Promise<void>;
}
