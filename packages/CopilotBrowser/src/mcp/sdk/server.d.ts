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
import type { Tool, CallToolResult, CallToolRequest, Root } from '@modelcontextprotocol/sdk/types.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
export type { Server } from '@modelcontextprotocol/sdk/server/index.js';
export type { Tool, CallToolResult, CallToolRequest, Root } from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
export type ClientInfo = {
    name: string;
    version: string;
    roots: Root[];
    timestamp: number;
};
export type ProgressParams = {
    message?: string;
    progress?: number;
    total?: number;
};
export type ProgressCallback = (params: ProgressParams) => void;
export interface ServerBackend {
    initialize?(clientInfo: ClientInfo): Promise<void>;
    listTools(): Promise<Tool[]>;
    callTool(name: string, args: CallToolRequest['params']['arguments'], progress: ProgressCallback): Promise<CallToolResult>;
    serverClosed?(server: Server): void;
}
export type ServerBackendFactory = {
    name: string;
    nameInConfig: string;
    version: string;
    create: () => ServerBackend;
};
export declare function connect(factory: ServerBackendFactory, transport: Transport, runPulse: boolean): Promise<void>;
export declare function wrapInProcess(backend: ServerBackend): Transport;
export declare function wrapInClient(backend: ServerBackend, options: {
    name: string;
    version: string;
}): Promise<Client>;
export declare function createServer(name: string, version: string, backend: ServerBackend, runPulse: boolean): Server;
export declare function start(serverBackendFactory: ServerBackendFactory, options: {
    host?: string;
    port?: number;
    allowedHosts?: string[];
    socketPath?: string;
}): Promise<void>;
export declare function firstRootPath(clientInfo: ClientInfo): string | undefined;
export declare function allRootPaths(clientInfo: ClientInfo): string[];
