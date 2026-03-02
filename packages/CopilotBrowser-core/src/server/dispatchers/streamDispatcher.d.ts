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
import type { ArtifactDispatcher } from './artifactDispatcher';
import type * as channels from '@protocol/channels';
import type * as stream from 'stream';
import type { Progress } from '@protocol/progress';
declare class StreamSdkObject extends SdkObject {
    readonly stream: stream.Readable;
    constructor(parent: SdkObject, stream: stream.Readable);
}
export declare class StreamDispatcher extends Dispatcher<StreamSdkObject, channels.StreamChannel, ArtifactDispatcher> implements channels.StreamChannel {
    _type_Stream: boolean;
    private _ended;
    constructor(scope: ArtifactDispatcher, stream: stream.Readable);
    read(params: channels.StreamReadParams, progress: Progress): Promise<channels.StreamReadResult>;
    close(params: channels.StreamCloseParams, progress: Progress): Promise<void>;
}
export {};
