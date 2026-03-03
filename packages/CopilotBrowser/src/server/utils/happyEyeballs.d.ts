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
import http from 'http';
import https from 'https';
import net from 'net';
import tls from 'tls';
declare class HttpHappyEyeballsAgent extends http.Agent {
    createConnection(options: http.ClientRequestArgs, oncreate?: (err: Error | null, socket?: net.Socket) => void): net.Socket | undefined;
}
declare class HttpsHappyEyeballsAgent extends https.Agent {
    createConnection(options: http.ClientRequestArgs, oncreate?: (err: Error | null, socket?: net.Socket) => void): net.Socket | undefined;
}
export declare const httpsHappyEyeballsAgent: HttpsHappyEyeballsAgent;
export declare const httpHappyEyeballsAgent: HttpHappyEyeballsAgent;
export declare function createSocket(host: string, port: number): Promise<net.Socket>;
export declare function createTLSSocket(options: tls.ConnectionOptions): Promise<tls.TLSSocket>;
export declare function createConnectionAsync(options: http.ClientRequestArgs, oncreate: ((err: Error | null, socket?: tls.TLSSocket) => void) | undefined, useTLS: true): Promise<void>;
export declare function createConnectionAsync(options: http.ClientRequestArgs, oncreate: ((err: Error | null, socket?: net.Socket) => void) | undefined, useTLS: false): Promise<void>;
export declare function timingForSocket(socket: net.Socket | tls.TLSSocket): {
    dnsLookupAt: number | undefined;
    tcpConnectionAt: number | undefined;
};
export {};
