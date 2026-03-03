/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
import { Dispatcher } from './dispatcher';
import { AndroidDevice } from '../android/android';
import { SdkObject } from '../instrumentation';
import type { RootDispatcher } from './dispatcher';
import type { Android, SocketBackend } from '../android/android';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class AndroidDispatcher extends Dispatcher<Android, channels.AndroidChannel, RootDispatcher> implements channels.AndroidChannel {
    _type_Android: boolean;
    constructor(scope: RootDispatcher, android: Android);
    devices(params: channels.AndroidDevicesParams, progress: Progress): Promise<channels.AndroidDevicesResult>;
}
export declare class AndroidDeviceDispatcher extends Dispatcher<AndroidDevice, channels.AndroidDeviceChannel, AndroidDispatcher> implements channels.AndroidDeviceChannel {
    _type_EventTarget: boolean;
    _type_AndroidDevice: boolean;
    static from(scope: AndroidDispatcher, device: AndroidDevice): AndroidDeviceDispatcher;
    constructor(scope: AndroidDispatcher, device: AndroidDevice);
    wait(params: channels.AndroidDeviceWaitParams, progress: Progress): Promise<void>;
    fill(params: channels.AndroidDeviceFillParams, progress: Progress): Promise<void>;
    tap(params: channels.AndroidDeviceTapParams, progress: Progress): Promise<void>;
    drag(params: channels.AndroidDeviceDragParams, progress: Progress): Promise<void>;
    fling(params: channels.AndroidDeviceFlingParams, progress: Progress): Promise<void>;
    longTap(params: channels.AndroidDeviceLongTapParams, progress: Progress): Promise<void>;
    pinchClose(params: channels.AndroidDevicePinchCloseParams, progress: Progress): Promise<void>;
    pinchOpen(params: channels.AndroidDevicePinchOpenParams, progress: Progress): Promise<void>;
    scroll(params: channels.AndroidDeviceScrollParams, progress: Progress): Promise<void>;
    swipe(params: channels.AndroidDeviceSwipeParams, progress: Progress): Promise<void>;
    info(params: channels.AndroidDeviceTapParams, progress: Progress): Promise<channels.AndroidDeviceInfoResult>;
    inputType(params: channels.AndroidDeviceInputTypeParams, progress: Progress): Promise<void>;
    inputPress(params: channels.AndroidDeviceInputPressParams, progress: Progress): Promise<void>;
    inputTap(params: channels.AndroidDeviceInputTapParams, progress: Progress): Promise<void>;
    inputSwipe(params: channels.AndroidDeviceInputSwipeParams, progress: Progress): Promise<void>;
    inputDrag(params: channels.AndroidDeviceInputDragParams, progress: Progress): Promise<void>;
    screenshot(params: channels.AndroidDeviceScreenshotParams, progress: Progress): Promise<channels.AndroidDeviceScreenshotResult>;
    shell(params: channels.AndroidDeviceShellParams, progress: Progress): Promise<channels.AndroidDeviceShellResult>;
    open(params: channels.AndroidDeviceOpenParams, progress: Progress): Promise<channels.AndroidDeviceOpenResult>;
    installApk(params: channels.AndroidDeviceInstallApkParams, progress: Progress): Promise<void>;
    push(params: channels.AndroidDevicePushParams, progress: Progress): Promise<void>;
    launchBrowser(params: channels.AndroidDeviceLaunchBrowserParams, progress: Progress): Promise<channels.AndroidDeviceLaunchBrowserResult>;
    close(params: channels.AndroidDeviceCloseParams, progress: Progress): Promise<void>;
    connectToWebView(params: channels.AndroidDeviceConnectToWebViewParams, progress: Progress): Promise<channels.AndroidDeviceConnectToWebViewResult>;
}
declare class SocketSdkObject extends SdkObject implements SocketBackend {
    private _socket;
    private _eventListeners;
    constructor(parent: SdkObject, socket: SocketBackend);
    write(data: Buffer): Promise<void>;
    close(): void;
}
export declare class AndroidSocketDispatcher extends Dispatcher<SocketSdkObject, channels.AndroidSocketChannel, AndroidDeviceDispatcher> implements channels.AndroidSocketChannel {
    _type_AndroidSocket: boolean;
    constructor(scope: AndroidDeviceDispatcher, socket: SocketSdkObject);
    write(params: channels.AndroidSocketWriteParams, progress: Progress): Promise<void>;
    close(params: channels.AndroidSocketCloseParams, progress: Progress): Promise<void>;
}
export {};
