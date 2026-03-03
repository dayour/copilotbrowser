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
import type { WebSocket } from '../../utilsBundle';
import type http from 'http';
import type stream from 'stream';
export declare const perMessageDeflate: {
    serverNoContextTakeover: boolean;
    zlibDeflateOptions: {
        level: number;
    };
    zlibInflateOptions: {
        chunkSize: number;
    };
    threshold: number;
};
export type WSConnection = {
    close: () => Promise<void>;
};
export type WSServerDelegate = {
    onRequest: (request: http.IncomingMessage, response: http.ServerResponse) => void;
    onHeaders: (headers: string[]) => void;
    onUpgrade: (request: http.IncomingMessage, socket: stream.Duplex) => {
        error: string;
    } | undefined;
    onConnection: (request: http.IncomingMessage, url: URL, ws: WebSocket, id: string) => WSConnection;
};
export declare class WSServer {
    private _wsServer;
    server: http.Server | undefined;
    private _delegate;
    constructor(delegate: WSServerDelegate);
    listen(port: number, hostname: string | undefined, path: string): Promise<string>;
    close(): Promise<void>;
}
