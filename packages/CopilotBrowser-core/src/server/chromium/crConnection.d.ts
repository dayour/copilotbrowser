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
import { SdkObject } from '../instrumentation';
import type { ConnectionTransport, ProtocolResponse } from '../transport';
import type { Protocol } from './protocol';
import type { RecentLogsCollector } from '../utils/debugLogger';
import type { ProtocolLogger } from '../types';
export declare const ConnectionEvents: {
    Disconnected: symbol;
};
export type ConnectionEventMap = {};
export declare const kBrowserCloseMessageId = -9999;
export declare class CRConnection extends SdkObject {
    private _lastId;
    private readonly _transport;
    readonly _sessions: Map<string, CRSession>;
    private readonly _protocolLogger;
    private readonly _browserLogsCollector;
    _browserDisconnectedLogs: string | undefined;
    readonly rootSession: CRSession;
    _closed: boolean;
    constructor(parent: SdkObject, transport: ConnectionTransport, protocolLogger: ProtocolLogger, browserLogsCollector: RecentLogsCollector);
    _rawSend(sessionId: string, method: string, params: any): number;
    _onMessage(message: ProtocolResponse): Promise<void>;
    _onClose(reason?: string): void;
    close(): void;
    createBrowserSession(): Promise<CDPSession>;
}
type SessionEventListener = (method: string, params?: Object) => void;
export declare class CRSession extends SdkObject<Protocol.EventMap & ConnectionEventMap> {
    private readonly _connection;
    private _eventListener?;
    private readonly _callbacks;
    private readonly _sessionId;
    private readonly _parentSession;
    private _crashed;
    private _closed;
    constructor(connection: CRConnection, parentSession: CRSession | null, sessionId: string, eventListener?: SessionEventListener);
    _markAsCrashed(): void;
    createChildSession(sessionId: string, eventListener?: SessionEventListener): CRSession;
    send<T extends keyof Protocol.CommandParameters>(method: T, params?: Protocol.CommandParameters[T]): Promise<Protocol.CommandReturnValues[T]>;
    _sendMayFail<T extends keyof Protocol.CommandParameters>(method: T, params?: Protocol.CommandParameters[T]): Promise<Protocol.CommandReturnValues[T] | void>;
    _onMessage(object: ProtocolResponse): void;
    detach(): Promise<void>;
    dispose(): void;
}
export declare class CDPSession extends SdkObject {
    static Events: {
        Event: string;
        Closed: string;
    };
    private _session;
    private _listeners;
    constructor(parentSession: CRSession, sessionId: string);
    send(method: string, params?: any): Promise<any>;
    detach(): Promise<void>;
    attachToTarget(targetId: string): Promise<CDPSession>;
    private _onClose;
}
export {};
