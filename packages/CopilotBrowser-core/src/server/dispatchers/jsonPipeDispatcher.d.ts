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
import { SdkObject } from '../instrumentation';
import type { LocalUtilsDispatcher } from './localUtilsDispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class JsonPipeDispatcher extends Dispatcher<SdkObject, channels.JsonPipeChannel, LocalUtilsDispatcher> implements channels.JsonPipeChannel {
    _type_JsonPipe: boolean;
    constructor(scope: LocalUtilsDispatcher);
    send(params: channels.JsonPipeSendParams, progress: Progress): Promise<channels.JsonPipeSendResult>;
    close(params: channels.JsonPipeCloseParams, progress: Progress): Promise<void>;
    dispatch(message: Object): void;
    wasClosed(reason?: string): void;
    dispose(): void;
}
