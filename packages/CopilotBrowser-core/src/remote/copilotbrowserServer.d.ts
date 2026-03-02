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
import { SocksProxy } from '../server/utils/socksProxy';
import { Browser } from '../server/browser';
import type { AndroidDevice } from '../server/android/android';
type ServerOptions = {
    path: string;
    maxConnections: number;
    mode: 'default' | 'launchServer' | 'launchServerShared' | 'extension';
    preLaunchedBrowser?: Browser;
    preLaunchedAndroidDevice?: AndroidDevice;
    preLaunchedSocksProxy?: SocksProxy;
};
export declare class copilotbrowserServer {
    private _copilotbrowser;
    private _options;
    private _wsServer;
    private _dontReuseBrowsers;
    constructor(options: ServerOptions);
    private _initReuseBrowsersMode;
    private _initConnectMode;
    private _initPreLaunchedBrowserMode;
    private _initPreLaunchedAndroidMode;
    private _initLaunchBrowserMode;
    private _dontReuse;
    listen(port?: number, hostname?: string): Promise<string>;
    close(): Promise<void>;
}
export {};
