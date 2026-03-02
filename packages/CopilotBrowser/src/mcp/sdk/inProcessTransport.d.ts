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
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage, MessageExtraInfo } from '@modelcontextprotocol/sdk/types.js';
export declare class InProcessTransport implements Transport {
    private _server;
    private _serverTransport;
    private _connected;
    constructor(server: Server);
    start(): Promise<void>;
    send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void>;
    close(): Promise<void>;
    onclose?: (() => void) | undefined;
    onerror?: ((error: Error) => void) | undefined;
    onmessage?: ((message: JSONRPCMessage, extra?: MessageExtraInfo) => void) | undefined;
    sessionId?: string | undefined;
    setProtocolVersion?: ((version: string) => void) | undefined;
    _receiveFromServer(message: JSONRPCMessage, extra?: MessageExtraInfo): void;
}
