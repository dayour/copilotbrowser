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
import { HarBackend } from './harBackend';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export type StackSession = {
    file: string;
    writer: Promise<void>;
    tmpDir: string | undefined;
    callStacks: channels.ClientSideCallMetadata[];
    live?: boolean;
};
export declare function zip(progress: Progress, stackSessions: Map<string, StackSession>, params: channels.LocalUtilsZipParams): Promise<void>;
export declare function harOpen(progress: Progress, harBackends: Map<string, HarBackend>, params: channels.LocalUtilsHarOpenParams): Promise<channels.LocalUtilsHarOpenResult>;
export declare function harLookup(progress: Progress, harBackends: Map<string, HarBackend>, params: channels.LocalUtilsHarLookupParams): Promise<channels.LocalUtilsHarLookupResult>;
export declare function harClose(harBackends: Map<string, HarBackend>, params: channels.LocalUtilsHarCloseParams): void;
export declare function harUnzip(progress: Progress, params: channels.LocalUtilsHarUnzipParams): Promise<void>;
export declare function tracingStarted(progress: Progress, stackSessions: Map<string, StackSession>, params: channels.LocalUtilsTracingStartedParams): Promise<channels.LocalUtilsTracingStartedResult>;
export declare function traceDiscarded(progress: Progress, stackSessions: Map<string, StackSession>, params: channels.LocalUtilsTraceDiscardedParams): Promise<void>;
export declare function addStackToTracingNoReply(stackSessions: Map<string, StackSession>, params: channels.LocalUtilsAddStackToTracingNoReplyParams): void;
