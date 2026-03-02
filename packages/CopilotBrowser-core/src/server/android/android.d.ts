/**
 * Copyright Microsoft Corporation. All rights reserved.
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
import { EventEmitter } from 'events';
import { SdkObject } from '../instrumentation';
import { Progress } from '../progress';
import type { BrowserContext } from '../browserContext';
import type * as channels from '@protocol/channels';
export interface Backend {
    devices(options: channels.AndroidDevicesOptions): Promise<DeviceBackend[]>;
}
export interface DeviceBackend {
    serial: string;
    status: string;
    close(): Promise<void>;
    init(): Promise<void>;
    runCommand(command: string): Promise<Buffer>;
    open(command: string): Promise<SocketBackend>;
}
export interface SocketBackend extends EventEmitter {
    write(data: Buffer): Promise<void>;
    close(): void;
}
export declare class Android extends SdkObject {
    private _backend;
    private _devices;
    constructor(parent: SdkObject, backend: Backend);
    devices(progress: Progress, options: channels.AndroidDevicesOptions): Promise<AndroidDevice[]>;
    _deviceClosed(device: AndroidDevice): void;
}
export declare class AndroidDevice extends SdkObject {
    readonly _backend: DeviceBackend;
    readonly model: string;
    readonly serial: string;
    private _options;
    private _driverPromise;
    private _lastId;
    private _callbacks;
    private _pollingWebViews;
    private _webViews;
    static Events: {
        WebViewAdded: string;
        WebViewRemoved: string;
        Close: string;
    };
    private _browserConnections;
    readonly _android: Android;
    private _isClosed;
    constructor(android: Android, backend: DeviceBackend, model: string, options: channels.AndroidDevicesOptions);
    static create(android: Android, backend: DeviceBackend, options: channels.AndroidDevicesOptions): Promise<AndroidDevice>;
    _init(): Promise<void>;
    shell(command: string): Promise<Buffer>;
    open(progress: Progress, command: string): Promise<SocketBackend>;
    screenshot(): Promise<Buffer>;
    private _driver;
    private _installDriver;
    private _waitForLocalAbstract;
    send(method: string, params?: any): Promise<any>;
    close(): Promise<void>;
    launchBrowser(progress: Progress, pkg: string, options: channels.AndroidDeviceLaunchBrowserParams): Promise<BrowserContext>;
    private _defaultArgs;
    private _innerDefaultArgs;
    connectToWebView(progress: Progress, socketName: string): Promise<BrowserContext>;
    private _connectToBrowser;
    private _open;
    webViews(): channels.AndroidWebView[];
    installApk(progress: Progress, content: Buffer, options?: {
        args?: string[];
    }): Promise<void>;
    push(progress: Progress, content: Buffer, path: string, mode?: number): Promise<void>;
    private _refreshWebViews;
    private _extractPkg;
}
