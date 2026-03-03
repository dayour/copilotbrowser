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
import type { PageDispatcher } from './pageDispatcher';
import type { DispatcherScope } from './dispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class PageAgentDispatcher extends Dispatcher<SdkObject, channels.PageAgentChannel, DispatcherScope> implements channels.PageAgentChannel {
    _type_PageAgent: boolean;
    _type_EventTarget: boolean;
    private _page;
    private _usage;
    private _context;
    constructor(scope: PageDispatcher, options: channels.PageAgentParams);
    perform(params: channels.PageAgentPerformParams, progress: Progress): Promise<channels.PageAgentPerformResult>;
    expect(params: channels.PageAgentExpectParams, progress: Progress): Promise<channels.PageAgentExpectResult>;
    extract(params: channels.PageAgentExtractParams, progress: Progress): Promise<channels.PageAgentExtractResult>;
    usage(params: channels.PageAgentUsageParams, progress: Progress): Promise<channels.PageAgentUsageResult>;
    dispose(params: channels.PageAgentDisposeParams, progress: Progress): Promise<void>;
    private _eventSupport;
}
