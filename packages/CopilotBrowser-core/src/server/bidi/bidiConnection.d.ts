/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { EventEmitter } from 'events';
import type { RecentLogsCollector } from '../utils/debugLogger';
import type { ConnectionTransport, ProtocolRequest } from '../transport';
import type { ProtocolLogger } from '../types';
import type * as bidiCommands from './third_party/bidiCommands';
import type * as bidi from './third_party/bidiProtocol';
export declare const kBrowserCloseMessageId: number;
export declare const kShutdownSessionNewMessageId: number;
export declare class BidiConnection {
    private readonly _transport;
    private readonly _onDisconnect;
    private readonly _protocolLogger;
    private readonly _browserLogsCollector;
    _browserDisconnectedLogs: string | undefined;
    private _lastId;
    private _closed;
    readonly browserSession: BidiSession;
    readonly _browsingContextToSession: Map<string, BidiSession>;
    readonly _realmToBrowsingContext: Map<string, string>;
    readonly _realmToOwnerRealm: Map<string, string>;
    constructor(transport: ConnectionTransport, onDisconnect: () => void, protocolLogger: ProtocolLogger, browserLogsCollector: RecentLogsCollector);
    nextMessageId(): number;
    rawSend(message: ProtocolRequest): void;
    private _dispatchMessage;
    _onClose(reason?: string): void;
    isClosed(): boolean;
    close(): void;
    createMainFrameBrowsingContextSession(bowsingContextId: bidi.BrowsingContext.BrowsingContext): BidiSession;
}
type BidiEvents = {
    [K in bidi.Event['method']]: Extract<bidi.Event, {
        method: K;
    }>;
};
export declare class BidiSession extends EventEmitter {
    readonly connection: BidiConnection;
    readonly sessionId: string;
    private _disposed;
    private readonly _rawSend;
    private readonly _callbacks;
    private _crashed;
    private readonly _browsingContexts;
    on: <T extends keyof BidiEvents | symbol>(event: T, listener: (payload: T extends symbol ? any : BidiEvents[T extends keyof BidiEvents ? T : never]['params']) => void) => this;
    addListener: <T extends keyof BidiEvents | symbol>(event: T, listener: (payload: T extends symbol ? any : BidiEvents[T extends keyof BidiEvents ? T : never]['params']) => void) => this;
    off: <T extends keyof BidiEvents | symbol>(event: T, listener: (payload: T extends symbol ? any : BidiEvents[T extends keyof BidiEvents ? T : never]['params']) => void) => this;
    removeListener: <T extends keyof BidiEvents | symbol>(event: T, listener: (payload: T extends symbol ? any : BidiEvents[T extends keyof BidiEvents ? T : never]['params']) => void) => this;
    once: <T extends keyof BidiEvents | symbol>(event: T, listener: (payload: T extends symbol ? any : BidiEvents[T extends keyof BidiEvents ? T : never]['params']) => void) => this;
    constructor(connection: BidiConnection, sessionId: string, rawSend: (message: any) => void);
    addFrameBrowsingContext(context: string): void;
    removeFrameBrowsingContext(context: string): void;
    send<T extends keyof bidiCommands.Commands>(method: T, params?: bidiCommands.Commands[T]['params']): Promise<bidiCommands.Commands[T]['returnType']>;
    sendMayFail<T extends keyof bidiCommands.Commands>(method: T, params?: bidiCommands.Commands[T]['params']): Promise<bidiCommands.Commands[T]['returnType'] | void>;
    markAsCrashed(): void;
    isDisposed(): boolean;
    dispose(): void;
    hasCallback(id: number): boolean;
    dispatchMessage(message: any): void;
}
export {};
