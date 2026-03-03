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
import EventEmitter from 'events';
export type SocksSocketRequestedPayload = {
    uid: string;
    host: string;
    port: number;
};
export type SocksSocketConnectedPayload = {
    uid: string;
    host: string;
    port: number;
};
export type SocksSocketDataPayload = {
    uid: string;
    data: Buffer;
};
export type SocksSocketErrorPayload = {
    uid: string;
    error: string;
};
export type SocksSocketFailedPayload = {
    uid: string;
    errorCode: string;
};
export type SocksSocketClosedPayload = {
    uid: string;
};
export type SocksSocketEndPayload = {
    uid: string;
};
interface SocksConnectionClient {
    onSocketRequested(payload: SocksSocketRequestedPayload): void;
    onSocketData(payload: SocksSocketDataPayload): void;
    onSocketClosed(payload: SocksSocketClosedPayload): void;
}
type PatternMatcher = (host: string, port: number) => boolean;
export declare function parsePattern(pattern: string | undefined): PatternMatcher;
export declare class SocksProxy extends EventEmitter implements SocksConnectionClient {
    static Events: {
        SocksRequested: string;
        SocksData: string;
        SocksClosed: string;
    };
    private _server;
    private _connections;
    private _sockets;
    private _closed;
    private _port;
    private _patternMatcher;
    private _directSockets;
    constructor();
    setPattern(pattern: string | undefined): void;
    private _handleDirect;
    port(): number;
    listen(port: number, hostname?: string): Promise<number>;
    close(): Promise<void>;
    onSocketRequested(payload: SocksSocketRequestedPayload): void;
    onSocketData(payload: SocksSocketDataPayload): void;
    onSocketClosed(payload: SocksSocketClosedPayload): void;
    socketConnected({ uid, host, port }: SocksSocketConnectedPayload): void;
    socketFailed({ uid, errorCode }: SocksSocketFailedPayload): void;
    sendSocketData({ uid, data }: SocksSocketDataPayload): void;
    sendSocketEnd({ uid }: SocksSocketEndPayload): void;
    sendSocketError({ uid, error }: SocksSocketErrorPayload): void;
}
export declare class SocksProxyHandler extends EventEmitter {
    static Events: {
        SocksConnected: string;
        SocksData: string;
        SocksError: string;
        SocksFailed: string;
        SocksEnd: string;
    };
    private _sockets;
    private _patternMatcher;
    private _redirectPortForTest;
    constructor(pattern: string | undefined, redirectPortForTest?: number);
    cleanup(): void;
    socketRequested({ uid, host, port }: SocksSocketRequestedPayload): Promise<void>;
    sendSocketData({ uid, data }: SocksSocketDataPayload): void;
    socketClosed({ uid }: SocksSocketClosedPayload): void;
}
export {};
