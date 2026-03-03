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
import { SdkObject } from '../../server/instrumentation';
import { Progress } from '../progress';
import type { copilotbrowser } from '../copilotbrowser';
import type { RootDispatcher } from './dispatcher';
import type * as channels from '@protocol/channels';
export declare class LocalUtilsDispatcher extends Dispatcher<SdkObject, channels.LocalUtilsChannel, RootDispatcher> implements channels.LocalUtilsChannel {
    _type_LocalUtils: boolean;
    private _harBackends;
    private _stackSessions;
    constructor(scope: RootDispatcher, copilotbrowser: copilotbrowser);
    zip(params: channels.LocalUtilsZipParams, progress: Progress): Promise<void>;
    harOpen(params: channels.LocalUtilsHarOpenParams, progress: Progress): Promise<channels.LocalUtilsHarOpenResult>;
    harLookup(params: channels.LocalUtilsHarLookupParams, progress: Progress): Promise<channels.LocalUtilsHarLookupResult>;
    harClose(params: channels.LocalUtilsHarCloseParams, progress: Progress): Promise<void>;
    harUnzip(params: channels.LocalUtilsHarUnzipParams, progress: Progress): Promise<void>;
    tracingStarted(params: channels.LocalUtilsTracingStartedParams, progress: Progress): Promise<channels.LocalUtilsTracingStartedResult>;
    traceDiscarded(params: channels.LocalUtilsTraceDiscardedParams, progress: Progress): Promise<void>;
    addStackToTracingNoReply(params: channels.LocalUtilsAddStackToTracingNoReplyParams, progress: Progress): Promise<void>;
    connect(params: channels.LocalUtilsConnectParams, progress: Progress): Promise<channels.LocalUtilsConnectResult>;
    globToRegex(params: channels.LocalUtilsGlobToRegexParams, progress: Progress): Promise<channels.LocalUtilsGlobToRegexResult>;
}
