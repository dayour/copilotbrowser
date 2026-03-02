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
import fs from 'fs';
import { Dispatcher } from './dispatcher';
import { SdkObject } from '../instrumentation';
import type { BrowserContextDispatcher } from './browserContextDispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
declare class WritableStreamSdkObject extends SdkObject {
    readonly streamOrDirectory: fs.WriteStream | string;
    readonly lastModifiedMs: number | undefined;
    constructor(parent: SdkObject, streamOrDirectory: fs.WriteStream | string, lastModifiedMs: number | undefined);
}
export declare class WritableStreamDispatcher extends Dispatcher<WritableStreamSdkObject, channels.WritableStreamChannel, BrowserContextDispatcher> implements channels.WritableStreamChannel {
    _type_WritableStream: boolean;
    constructor(scope: BrowserContextDispatcher, streamOrDirectory: fs.WriteStream | string, lastModifiedMs?: number);
    write(params: channels.WritableStreamWriteParams, progress: Progress): Promise<channels.WritableStreamWriteResult>;
    close(params: channels.WritableStreamCloseParams, progress: Progress): Promise<void>;
    path(): string;
}
export {};
