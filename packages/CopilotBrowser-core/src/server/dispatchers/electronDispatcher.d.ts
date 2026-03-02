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
import { ElectronApplication } from '../electron/electron';
import type { RootDispatcher } from './dispatcher';
import type { Electron } from '../electron/electron';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class ElectronDispatcher extends Dispatcher<Electron, channels.ElectronChannel, RootDispatcher> implements channels.ElectronChannel {
    _type_Electron: boolean;
    _denyLaunch: boolean;
    constructor(scope: RootDispatcher, electron: Electron, denyLaunch: boolean);
    launch(params: channels.ElectronLaunchParams, progress: Progress): Promise<channels.ElectronLaunchResult>;
}
export declare class ElectronApplicationDispatcher extends Dispatcher<ElectronApplication, channels.ElectronApplicationChannel, ElectronDispatcher> implements channels.ElectronApplicationChannel {
    _type_EventTarget: boolean;
    _type_ElectronApplication: boolean;
    private readonly _subscriptions;
    constructor(scope: ElectronDispatcher, electronApplication: ElectronApplication);
    browserWindow(params: channels.ElectronApplicationBrowserWindowParams, progress: Progress): Promise<channels.ElectronApplicationBrowserWindowResult>;
    evaluateExpression(params: channels.ElectronApplicationEvaluateExpressionParams, progress: Progress): Promise<channels.ElectronApplicationEvaluateExpressionResult>;
    evaluateExpressionHandle(params: channels.ElectronApplicationEvaluateExpressionHandleParams, progress: Progress): Promise<channels.ElectronApplicationEvaluateExpressionHandleResult>;
    updateSubscription(params: channels.ElectronApplicationUpdateSubscriptionParams, progress: Progress): Promise<void>;
}
