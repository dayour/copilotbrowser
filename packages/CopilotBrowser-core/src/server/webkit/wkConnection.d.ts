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
import { EventEmitter } from 'events';
import type { ConnectionTransport, ProtocolRequest } from '../transport';
import type { Protocol } from './protocol';
import type { RecentLogsCollector } from '../utils/debugLogger';
import type { ProtocolLogger } from '../types';
export declare const kBrowserCloseMessageId = -9999;
export declare const kPageProxyMessageReceived: unique symbol;
export type PageProxyMessageReceivedPayload = {
    pageProxyId: string;
    message: any;
};
export declare class WKConnection {
    private readonly _transport;
    private readonly _onDisconnect;
    private readonly _protocolLogger;
    private readonly _browserLogsCollector;
    _browserDisconnectedLogs: string | undefined;
    private _lastId;
    private _closed;
    readonly browserSession: WKSession;
    constructor(transport: ConnectionTransport, onDisconnect: () => void, protocolLogger: ProtocolLogger, browserLogsCollector: RecentLogsCollector);
    nextMessageId(): number;
    rawSend(message: ProtocolRequest): void;
    private _dispatchMessage;
    _onClose(reason?: string): void;
    isClosed(): boolean;
    close(): void;
}
export declare class WKSession extends EventEmitter<Protocol.EventMap & {
    [kPageProxyMessageReceived]: [any];
}> {
    connection: WKConnection;
    readonly sessionId: string;
    private _disposed;
    private readonly _rawSend;
    private readonly _callbacks;
    private _crashed;
    constructor(connection: WKConnection, sessionId: string, rawSend: (message: any) => void);
    send<T extends keyof Protocol.CommandParameters>(method: T, params?: Protocol.CommandParameters[T]): Promise<Protocol.CommandReturnValues[T]>;
    sendMayFail<T extends keyof Protocol.CommandParameters>(method: T, params?: Protocol.CommandParameters[T]): Promise<Protocol.CommandReturnValues[T] | void>;
    markAsCrashed(): void;
    isDisposed(): boolean;
    dispose(): void;
    dispatchMessage(object: any): void;
}
