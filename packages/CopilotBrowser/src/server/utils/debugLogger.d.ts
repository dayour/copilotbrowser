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
declare const debugLoggerColorMap: {
    api: number;
    protocol: number;
    install: number;
    download: number;
    browser: number;
    socks: number;
    'client-certificates': number;
    error: number;
    channel: number;
    server: number;
    'server:channel': number;
    'server:metadata': number;
    recorder: number;
};
export type LogName = keyof typeof debugLoggerColorMap;
declare class DebugLogger {
    private _debuggers;
    constructor();
    log(name: LogName, message: string | Error | object): void;
    isEnabled(name: LogName): boolean;
}
export declare const debugLogger: DebugLogger;
export declare class RecentLogsCollector {
    private _logs;
    private _listeners;
    log(message: string): void;
    recentLogs(): string[];
    onMessage(listener: (message: string) => void): void;
}
export {};
