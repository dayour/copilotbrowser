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
import * as copilotbrowser from 'copilotbrowser-core';
import type { FullConfig } from './config';
import type { ClientInfo } from '../sdk/server';
export declare function contextFactory(config: FullConfig): BrowserContextFactory;
export type BrowserContextFactoryResult = {
    browserContext: copilotbrowser.BrowserContext;
    close: () => Promise<void>;
};
type CreateContextOptions = {
    toolName?: string;
};
export interface BrowserContextFactory {
    createContext(clientInfo: ClientInfo, abortSignal: AbortSignal, options: CreateContextOptions): Promise<BrowserContextFactoryResult>;
}
export declare function identityBrowserContextFactory(browserContext: copilotbrowser.BrowserContext): BrowserContextFactory;
export declare class SharedContextFactory implements BrowserContextFactory {
    private _contextPromise;
    private _baseFactory;
    private static _instance;
    static create(config: FullConfig): SharedContextFactory;
    private constructor();
    createContext(clientInfo: ClientInfo, abortSignal: AbortSignal, options: {
        toolName?: string;
    }): Promise<{
        browserContext: copilotbrowser.BrowserContext;
        close: () => Promise<void>;
    }>;
    static dispose(): Promise<void>;
    private _dispose;
}
export {};
