/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
import type * as js from '../javascript';
import type { ElectronApplicationDispatcher } from './electronDispatcher';
import type { FrameDispatcher } from './frameDispatcher';
import type { PageDispatcher, WorkerDispatcher } from './pageDispatcher';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export type JSHandleDispatcherParentScope = PageDispatcher | FrameDispatcher | WorkerDispatcher | ElectronApplicationDispatcher;
export declare class JSHandleDispatcher<ParentScope extends JSHandleDispatcherParentScope = JSHandleDispatcherParentScope> extends Dispatcher<js.JSHandle, channels.JSHandleChannel, ParentScope> implements channels.JSHandleChannel {
    _type_JSHandle: boolean;
    static fromJSHandle(scope: JSHandleDispatcherParentScope, handle: js.JSHandle): JSHandleDispatcher;
    protected constructor(scope: ParentScope, jsHandle: js.JSHandle);
    evaluateExpression(params: channels.JSHandleEvaluateExpressionParams, progress: Progress): Promise<channels.JSHandleEvaluateExpressionResult>;
    evaluateExpressionHandle(params: channels.JSHandleEvaluateExpressionHandleParams, progress: Progress): Promise<channels.JSHandleEvaluateExpressionHandleResult>;
    getProperty(params: channels.JSHandleGetPropertyParams, progress: Progress): Promise<channels.JSHandleGetPropertyResult>;
    getPropertyList(params: channels.JSHandleGetPropertyListParams, progress: Progress): Promise<channels.JSHandleGetPropertyListResult>;
    jsonValue(params: channels.JSHandleJsonValueParams, progress: Progress): Promise<channels.JSHandleJsonValueResult>;
    dispose(_: any, progress: Progress): Promise<void>;
}
export declare function parseArgument(arg: channels.SerializedArgument): any;
export declare function parseValue(v: channels.SerializedValue): any;
export declare function serializeResult(arg: any): channels.SerializedValue;
