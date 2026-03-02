/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { EventEmitter } from 'events';
import type { ConnectionTransport, ProtocolRequest, ProtocolResponse } from '../transport';
import type { Protocol } from './protocol';
import type { RecentLogsCollector } from '../utils/debugLogger';
import type { ProtocolLogger } from '../types';
export declare const ConnectionEvents: {
    Disconnected: symbol;
};
export declare const kBrowserCloseMessageId = -9999;
export declare class FFConnection extends EventEmitter {
    private _lastId;
    private _transport;
    private readonly _protocolLogger;
    private readonly _browserLogsCollector;
    _browserDisconnectedLogs: string | undefined;
    readonly rootSession: FFSession;
    readonly _sessions: Map<string, FFSession>;
    _closed: boolean;
    constructor(transport: ConnectionTransport, protocolLogger: ProtocolLogger, browserLogsCollector: RecentLogsCollector);
    nextMessageId(): number;
    _rawSend(message: ProtocolRequest): void;
    _onMessage(message: ProtocolResponse): Promise<void>;
    _onClose(reason?: string): void;
    close(): void;
    createSession(sessionId: string): FFSession;
}
export declare class FFSession extends EventEmitter<Protocol.EventMap> {
    _connection: FFConnection;
    _disposed: boolean;
    private _callbacks;
    private _sessionId;
    private _rawSend;
    private _crashed;
    constructor(connection: FFConnection, sessionId: string, rawSend: (message: any) => void);
    markAsCrashed(): void;
    send<T extends keyof Protocol.CommandParameters>(method: T, params?: Protocol.CommandParameters[T]): Promise<Protocol.CommandReturnValues[T]>;
    sendMayFail<T extends keyof Protocol.CommandParameters>(method: T, params?: Protocol.CommandParameters[T]): Promise<Protocol.CommandReturnValues[T] | void>;
    dispatchMessage(object: ProtocolResponse): void;
    dispose(): void;
}
