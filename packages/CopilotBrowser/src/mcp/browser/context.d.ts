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
import { Tab } from './tab';
import type * as copilotbrowser from '../../../types/test';
import type { FullConfig } from './config';
import type { BrowserContextFactory } from './browserContextFactory';
import type { SessionLog } from './sessionLog';
import type { ClientInfo } from '../sdk/server';
type ContextOptions = {
    config: FullConfig;
    browserContextFactory: BrowserContextFactory;
    sessionLog: SessionLog | undefined;
    clientInfo: ClientInfo;
};
export type RouteEntry = {
    pattern: string;
    status?: number;
    body?: string;
    contentType?: string;
    addHeaders?: Record<string, string>;
    removeHeaders?: string[];
    handler: (route: copilotbrowser.Route) => Promise<void>;
};
export type FilenameTemplate = {
    prefix: string;
    ext: string;
    suggestedFilename?: string;
    date?: Date;
};
type VideoParams = NonNullable<Parameters<copilotbrowser.Video['start']>[0]>;
export declare class Context {
    readonly config: FullConfig;
    readonly sessionLog: SessionLog | undefined;
    readonly options: ContextOptions;
    private _browserContextPromise;
    private _browserContextFactory;
    private _tabs;
    private _currentTab;
    private _clientInfo;
    private _routes;
    private _video;
    private static _allContexts;
    private _closeBrowserContextPromise;
    private _runningToolName;
    private _abortController;
    constructor(options: ContextOptions);
    static disposeAll(): Promise<void>;
    tabs(): Tab[];
    currentTab(): Tab | undefined;
    currentTabOrDie(): Tab;
    newTab(): Promise<Tab>;
    selectTab(index: number): Promise<Tab>;
    ensureTab(): Promise<Tab>;
    closeTab(index: number | undefined): Promise<string>;
    workspaceFile(fileName: string, perCallWorkspaceDir: string | undefined): Promise<string>;
    outputFile(template: FilenameTemplate, options: {
        origin: 'code' | 'llm';
    }): Promise<string>;
    startVideoRecording(params: VideoParams): Promise<void>;
    stopVideoRecording(): Promise<Set<copilotbrowser.Video>>;
    private _onPageCreated;
    private _onPageClosed;
    closeBrowserContext(): Promise<void>;
    routes(): RouteEntry[];
    addRoute(entry: RouteEntry): Promise<void>;
    removeRoute(pattern?: string): Promise<number>;
    isRunningTool(): boolean;
    setRunningTool(name: string | undefined): void;
    private _closeBrowserContextImpl;
    dispose(): Promise<void>;
    private _setupRequestInterception;
    ensureBrowserContext(): Promise<copilotbrowser.BrowserContext>;
    private _ensureBrowserContext;
    private _setupBrowserContext;
    lookupSecret(secretName: string): {
        value: string;
        code: string;
    };
    firstRootPath(): string | undefined;
}
export {};
