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
import { SocksProxy } from '../utils/socksProxy';
import { Dispatcher } from './dispatcher';
import type { RootDispatcher } from './dispatcher';
import type { AndroidDevice } from '../android/android';
import type { Browser } from '../browser';
import type { copilotbrowser } from '../copilotbrowser';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export type copilotbrowserDispatcherOptions = {
    socksProxy?: SocksProxy;
    denyLaunch?: boolean;
    preLaunchedBrowser?: Browser;
    preLaunchedAndroidDevice?: AndroidDevice;
    sharedBrowser?: boolean;
};
export declare class copilotbrowserDispatcher extends Dispatcher<copilotbrowser, channels.copilotbrowserChannel, RootDispatcher> implements channels.copilotbrowserChannel {
    _type_copilotbrowser: any;
    private _browserDispatcher;
    constructor(scope: RootDispatcher, copilotbrowser: copilotbrowser, options?: copilotbrowserDispatcherOptions);
    newRequest(params: channels.copilotbrowserNewRequestParams, progress: Progress): Promise<channels.copilotbrowserNewRequestResult>;
    cleanup(): Promise<void>;
}
