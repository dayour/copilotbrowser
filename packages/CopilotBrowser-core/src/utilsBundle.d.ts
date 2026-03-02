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
export declare const colors: typeof import('../bundles/utils/node_modules/colors/safe');
export declare const debug: typeof import('../bundles/utils/node_modules/@types/debug');
export declare const diff: typeof import('../bundles/utils/node_modules/@types/diff');
export declare const dotenv: typeof import('../bundles/utils/node_modules/dotenv');
export declare const ini: typeof import('../bundles/utils/node_modules/@types/ini');
export declare const getProxyForUrl: typeof import('../bundles/utils/node_modules/@types/proxy-from-env').getProxyForUrl;
export declare const HttpsProxyAgent: typeof import('../bundles/utils/node_modules/https-proxy-agent').HttpsProxyAgent;
export declare const jpegjs: typeof import('../bundles/utils/node_modules/jpeg-js');
export declare const lockfile: typeof import('../bundles/utils/node_modules/@types/proper-lockfile');
export declare const mime: typeof import('../bundles/utils/node_modules/@types/mime');
export declare const minimatch: typeof import('../bundles/utils/node_modules/@types/minimatch');
export declare const open: typeof import('../bundles/utils/node_modules/open');
export declare const PNG: typeof import('../bundles/utils/node_modules/@types/pngjs').PNG;
export declare const program: typeof import('../bundles/utils/node_modules/commander').program;
export declare const ProgramOption: typeof import('../bundles/utils/node_modules/commander').Option;
export declare const progress: typeof import('../bundles/utils/node_modules/@types/progress');
export declare const SocksProxyAgent: typeof import('../bundles/utils/node_modules/socks-proxy-agent').SocksProxyAgent;
export declare const ws: typeof import('../bundles/utils/node_modules/@types/ws');
export declare const wsServer: typeof import('../bundles/utils/node_modules/@types/ws').WebSocketServer;
export declare const wsReceiver: any;
export declare const wsSender: any;
export declare const yaml: typeof import('../bundles/utils/node_modules/yaml');
export type { Range as YAMLRange, Scalar as YAMLScalar, YAMLError, YAMLMap, YAMLSeq } from '../bundles/utils/node_modules/yaml';
export type { Command } from '../bundles/utils/node_modules/commander';
export type { EventEmitter as WebSocketEventEmitter, RawData as WebSocketRawData, WebSocket, WebSocketServer } from '../bundles/utils/node_modules/@types/ws';
export declare function ms(ms: number): string;
