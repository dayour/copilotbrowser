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
import { DebugController } from '../debugController';
import { Dispatcher } from './dispatcher';
import type { DispatcherConnection, RootDispatcher } from './dispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class DebugControllerDispatcher extends Dispatcher<DebugController, channels.DebugControllerChannel, RootDispatcher> implements channels.DebugControllerChannel {
    _type_DebugController: any;
    private _listeners;
    constructor(connection: DispatcherConnection, debugController: DebugController);
    initialize(params: channels.DebugControllerInitializeParams, progress: Progress): Promise<void>;
    setReportStateChanged(params: channels.DebugControllerSetReportStateChangedParams, progress: Progress): Promise<void>;
    setRecorderMode(params: channels.DebugControllerSetRecorderModeParams, progress: Progress): Promise<void>;
    highlight(params: channels.DebugControllerHighlightParams, progress: Progress): Promise<void>;
    hideHighlight(params: channels.DebugControllerHideHighlightParams, progress: Progress): Promise<void>;
    resume(params: channels.DebugControllerResumeParams, progress: Progress): Promise<void>;
    kill(params: channels.DebugControllerKillParams, progress: Progress): Promise<void>;
    _onDispose(): void;
}
