/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
import { Browser } from '../browser';
import { Dispatcher } from './dispatcher';
import type { BrowserTypeDispatcher } from './browserTypeDispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
type BrowserDispatcherOptions = {
    ignoreStopAndKill?: boolean;
    isolateContexts?: boolean;
};
export declare class BrowserDispatcher extends Dispatcher<Browser, channels.BrowserChannel, BrowserTypeDispatcher> implements channels.BrowserChannel {
    _type_Browser: boolean;
    private _options;
    private _isolatedContexts;
    constructor(scope: BrowserTypeDispatcher, browser: Browser, options?: BrowserDispatcherOptions);
    _didClose(): void;
    newContext(params: channels.BrowserNewContextParams, progress: Progress): Promise<channels.BrowserNewContextResult>;
    newContextForReuse(params: channels.BrowserNewContextForReuseParams, progress: Progress): Promise<channels.BrowserNewContextForReuseResult>;
    disconnectFromReusedContext(params: channels.BrowserDisconnectFromReusedContextParams, progress: Progress): Promise<void>;
    close(params: channels.BrowserCloseParams, progress: Progress): Promise<void>;
    killForTests(params: channels.BrowserKillForTestsParams, progress: Progress): Promise<void>;
    defaultUserAgentForTest(): Promise<channels.BrowserDefaultUserAgentForTestResult>;
    newBrowserCDPSession(params: channels.BrowserNewBrowserCDPSessionParams, progress: Progress): Promise<channels.BrowserNewBrowserCDPSessionResult>;
    startTracing(params: channels.BrowserStartTracingParams, progress: Progress): Promise<void>;
    stopTracing(params: channels.BrowserStopTracingParams, progress: Progress): Promise<channels.BrowserStopTracingResult>;
    cleanupContexts(): Promise<void>;
}
export {};
