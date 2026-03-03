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
import { HttpServer } from '../../utils/httpServer';
import type { Transport } from '../../utils/httpServer';
import type { BrowserType } from '../../browserType';
import type { Page } from '../../page';
export type TraceViewerServerOptions = {
    host?: string;
    port?: number;
    isServer?: boolean;
    transport?: Transport;
};
export type TraceViewerRedirectOptions = {
    args?: string[];
    grep?: string;
    grepInvert?: string;
    project?: string[];
    reporter?: string[];
    webApp?: string;
    isServer?: boolean;
};
export type TraceViewerAppOptions = {
    headless?: boolean;
    persistentContextOptions?: Parameters<BrowserType['launchPersistentContext']>[2];
};
export declare function startTraceViewerServer(options?: TraceViewerServerOptions): Promise<HttpServer>;
export declare function installRootRedirect(server: HttpServer, traceUrl: string | undefined, options: TraceViewerRedirectOptions): Promise<void>;
export declare function runTraceViewerApp(traceUrl: string | undefined, browserName: string, options: TraceViewerServerOptions & {
    headless?: boolean;
}, exitOnClose?: boolean): Promise<Page>;
export declare function runTraceInBrowser(traceUrl: string | undefined, options: TraceViewerServerOptions): Promise<void>;
export declare function openTraceViewerApp(url: string, browserName: string, options?: TraceViewerAppOptions): Promise<Page>;
export declare function openTraceInBrowser(url: string): Promise<void>;
