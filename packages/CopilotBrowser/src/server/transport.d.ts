/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import type { Progress } from './progress';
import type { HeadersArray } from './types';
export declare const perMessageDeflate: {
    clientNoContextTakeover: boolean;
    zlibDeflateOptions: {
        level: number;
    };
    zlibInflateOptions: {
        chunkSize: number;
    };
    threshold: number;
};
export type ProtocolRequest = {
    id: number;
    method: string;
    params: any;
    sessionId?: string;
};
export type ProtocolResponse = {
    id?: number;
    method?: string;
    sessionId?: string;
    error?: {
        message: string;
        data: any;
        code?: number;
    };
    params?: any;
    result?: any;
    pageProxyId?: string;
    browserContextId?: string;
};
export interface ConnectionTransport {
    send(s: ProtocolRequest): void;
    close(): void;
    onmessage?: (message: ProtocolResponse) => void;
    onclose?: (reason?: string) => void;
}
type WebSocketTransportOptions = {
    headers?: {
        [key: string]: string;
    };
    followRedirects?: boolean;
    debugLogHeader?: string;
};
export declare class WebSocketTransport implements ConnectionTransport {
    private _ws;
    private _progress?;
    private _logUrl;
    onmessage?: (message: ProtocolResponse) => void;
    onclose?: (reason?: string) => void;
    readonly wsEndpoint: string;
    readonly headers: HeadersArray;
    static connect(progress: (Progress | undefined), url: string, options?: WebSocketTransportOptions): Promise<WebSocketTransport>;
    static _connect(progress: (Progress | undefined), url: string, options: WebSocketTransportOptions, hadRedirects: boolean): Promise<WebSocketTransport>;
    constructor(progress: Progress | undefined, url: string, logUrl: string, options: WebSocketTransportOptions);
    send(message: ProtocolRequest): void;
    close(): void;
    closeAndWait(): Promise<void>;
}
export {};
