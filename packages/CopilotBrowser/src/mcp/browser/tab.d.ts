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
import { EventEmitter } from 'events';
import * as copilotbrowser from 'copilotbrowser-core';
import { ModalState } from './tools/tool';
import type { Context } from './context';
import type { Page } from '../../../../copilotbrowser-core/src/client/page';
import type { Locator } from '../../../../copilotbrowser-core/src/client/locator';
import type { FullConfig } from './config';
type TabEventsInterface = {};
type Download = {
    download: copilotbrowser.Download;
    finished: boolean;
    outputFile: string;
};
type ConsoleLogEntry = {
    type: 'console';
    wallTime: number;
    message: ConsoleMessage;
};
type DownloadStartLogEntry = {
    type: 'download-start';
    wallTime: number;
    download: Download;
};
type DownloadFinishLogEntry = {
    type: 'download-finish';
    wallTime: number;
    download: Download;
};
type RequestLogEntry = {
    type: 'request';
    wallTime: number;
    request: copilotbrowser.Request;
};
type EventEntry = ConsoleLogEntry | DownloadStartLogEntry | DownloadFinishLogEntry | RequestLogEntry;
export type TabHeader = {
    title: string;
    url: string;
    current: boolean;
    console: {
        total: number;
        warnings: number;
        errors: number;
    };
};
type TabSnapshot = {
    ariaSnapshot: string;
    ariaSnapshotDiff?: string;
    modalStates: ModalState[];
    events: EventEntry[];
    consoleLink?: string;
};
export declare class Tab extends EventEmitter<TabEventsInterface> {
    readonly context: Context;
    readonly page: Page;
    private _lastHeader;
    private _downloads;
    private _requests;
    private _onPageClose;
    private _modalStates;
    private _initializedPromise;
    private _needsFullSnapshot;
    private _recentEventEntries;
    private _consoleLog;
    constructor(context: Context, page: copilotbrowser.Page, onPageClose: (tab: Tab) => void);
    static forPage(page: copilotbrowser.Page): Tab | undefined;
    static collectConsoleMessages(page: copilotbrowser.Page): Promise<ConsoleMessage[]>;
    private _initialize;
    modalStates(): ModalState[];
    setModalState(modalState: ModalState): void;
    clearModalState(modalState: ModalState): void;
    private _dialogShown;
    private _downloadStarted;
    private _clearCollectedArtifacts;
    private _resetLogs;
    private _handleRequest;
    private _handleResponse;
    private _handleRequestFailed;
    private _handleConsoleMessage;
    private _addLogEntry;
    private _onClose;
    headerSnapshot(): Promise<TabHeader & {
        changed: boolean;
    }>;
    isCurrentTab(): boolean;
    waitForLoadState(state: 'load', options?: {
        timeout?: number;
    }): Promise<void>;
    navigate(url: string): Promise<void>;
    consoleMessageCount(): Promise<{
        total: number;
        errors: number;
        warnings: number;
    }>;
    consoleMessages(level: ConsoleMessageLevel): Promise<ConsoleMessage[]>;
    clearConsoleMessages(): Promise<void>;
    requests(): Promise<copilotbrowser.Request[]>;
    clearRequests(): Promise<void>;
    captureSnapshot(relativeTo: string | undefined): Promise<TabSnapshot>;
    private _javaScriptBlocked;
    private _raceAgainstModalStates;
    waitForCompletion(callback: () => Promise<void>): Promise<void>;
    refLocator(params: {
        element?: string;
        ref: string;
    }): Promise<{
        locator: Locator;
        resolved: string;
    }>;
    refLocators(params: {
        element?: string;
        ref: string;
    }[]): Promise<{
        locator: Locator;
        resolved: string;
    }[]>;
    waitForTimeout(time: number): Promise<void>;
}
export type ConsoleMessage = {
    type: ReturnType<copilotbrowser.ConsoleMessage['type']>;
    timestamp: number;
    text: string;
    toString(): string;
};
export declare function renderModalStates(config: FullConfig, modalStates: ModalState[]): string[];
type ConsoleMessageType = ReturnType<copilotbrowser.ConsoleMessage['type']>;
type ConsoleMessageLevel = 'error' | 'warning' | 'info' | 'debug';
export declare function shouldIncludeMessage(thresholdLevel: ConsoleMessageLevel, type: ConsoleMessageType): boolean;
export {};
