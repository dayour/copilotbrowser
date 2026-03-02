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
import type http from 'http';
export type ServerRouteHandler = (request: http.IncomingMessage, response: http.ServerResponse) => boolean;
export type Transport = {
    sendEvent?: (method: string, params: any) => void;
    close?: () => void;
    onconnect: () => void;
    dispatch: (method: string, params: any) => Promise<any>;
    onclose: () => void;
};
export declare class HttpServer {
    private _server;
    private _urlPrefixPrecise;
    private _urlPrefixHumanReadable;
    private _port;
    private _started;
    private _routes;
    private _wsGuid;
    constructor();
    server(): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    routePrefix(prefix: string, handler: ServerRouteHandler): void;
    routePath(path: string, handler: ServerRouteHandler): void;
    port(): number;
    createWebSocket(transportFactory: (url: URL) => Transport, guid?: string): void;
    wsGuid(): string | undefined;
    start(options?: {
        port?: number;
        preferredPort?: number;
        host?: string;
    }): Promise<void>;
    stop(): Promise<void>;
    urlPrefix(purpose: 'human-readable' | 'precise'): string;
    serveFile(request: http.IncomingMessage, response: http.ServerResponse, absoluteFilePath: string, headers?: {
        [name: string]: string;
    }): boolean;
    private _serveFile;
    private _serveRangeFile;
    private _onRequest;
}
