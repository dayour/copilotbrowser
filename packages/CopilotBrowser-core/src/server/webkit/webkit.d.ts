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
import { BrowserType } from '../browserType';
import { WKBrowser } from '../webkit/wkBrowser';
import type { BrowserOptions } from '../browser';
import type { SdkObject } from '../instrumentation';
import type { ConnectionTransport } from '../transport';
import type * as types from '../types';
export declare class WebKit extends BrowserType {
    constructor(parent: SdkObject);
    connectToTransport(transport: ConnectionTransport, options: BrowserOptions): Promise<WKBrowser>;
    amendEnvironment(env: NodeJS.ProcessEnv, userDataDir: string, isPersistent: boolean, options: types.LaunchOptions): NodeJS.ProcessEnv;
    doRewriteStartupLog(logs: string): string;
    attemptToGracefullyCloseBrowser(transport: ConnectionTransport): void;
    defaultArgs(options: types.LaunchOptions, isPersistent: boolean, userDataDir: string): Promise<string[]>;
}
export declare function translatePathToWSL(path: string): Promise<string>;
