/**
 * Copyright (c) Microsoft Corporation.
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
import { ManualPromise } from '../../utils';
import { CRBrowser } from '../chromium/crBrowser';
import { CRConnection } from '../chromium/crConnection';
import { SdkObject } from '../instrumentation';
import * as js from '../javascript';
import type { BrowserContext } from '../browserContext';
import type { Protocol } from '../chromium/protocol';
import type { Page } from '../page';
import type { copilotbrowser } from '../copilotbrowser';
import type { Progress } from '../progress';
import type * as channels from '@protocol/channels';
import type * as childProcess from 'child_process';
import type { BrowserWindow } from 'electron';
export declare class ElectronApplication extends SdkObject {
    static Events: {
        Close: string;
        Console: string;
    };
    private _browserContext;
    private _nodeConnection;
    private _nodeSession;
    private _nodeExecutionContext;
    _nodeElectronHandlePromise: ManualPromise<js.JSHandle<typeof import('electron')>>;
    private _process;
    constructor(parent: SdkObject, browser: CRBrowser, nodeConnection: CRConnection, process: childProcess.ChildProcess);
    _onConsoleAPI(event: Protocol.Runtime.consoleAPICalledPayload): Promise<void>;
    initialize(): Promise<void>;
    process(): childProcess.ChildProcess;
    context(): BrowserContext;
    close(): Promise<void>;
    browserWindow(page: Page): Promise<js.JSHandle<BrowserWindow>>;
}
export declare class Electron extends SdkObject {
    constructor(copilotbrowser: copilotbrowser);
    launch(progress: Progress, options: Omit<channels.ElectronLaunchParams, 'timeout'>): Promise<ElectronApplication>;
}
