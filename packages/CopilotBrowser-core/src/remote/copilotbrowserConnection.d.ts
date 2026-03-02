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
import { Semaphore } from '../utils';
import { copilotbrowserDispatcherOptions } from '../server/dispatchers/copilotbrowserDispatcher';
import type { copilotbrowser } from '../server';
import type { WebSocket } from '../utilsBundle';
export interface copilotbrowserInitializeResult extends copilotbrowserDispatcherOptions {
    dispose?(): Promise<void>;
}
export declare class copilotbrowserConnection {
    private _ws;
    private _semaphore;
    private _dispatcherConnection;
    private _cleanups;
    private _id;
    private _disconnected;
    private _root;
    private _profileName;
    constructor(semaphore: Semaphore, ws: WebSocket, controller: boolean, copilotbrowser: copilotbrowser, initialize: () => Promise<copilotbrowserInitializeResult>, id: string);
    private _onDisconnect;
    private logServerMetadata;
    close(reason?: {
        code: number;
        reason: string;
    }): Promise<void>;
}
