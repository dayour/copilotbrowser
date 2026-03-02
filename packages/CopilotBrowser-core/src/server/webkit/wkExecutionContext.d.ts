/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as js from '../javascript';
import type { Protocol } from './protocol';
import type { WKSession } from './wkConnection';
export declare class WKExecutionContext implements js.ExecutionContextDelegate {
    private readonly _session;
    readonly _contextId: number | undefined;
    constructor(session: WKSession, contextId: number | undefined);
    rawEvaluateJSON(expression: string): Promise<any>;
    rawEvaluateHandle(context: js.ExecutionContext, expression: string): Promise<js.JSHandle>;
    evaluateWithArguments(expression: string, returnByValue: boolean, utilityScript: js.JSHandle<any>, values: any[], handles: js.JSHandle[]): Promise<any>;
    getProperties(object: js.JSHandle): Promise<Map<string, js.JSHandle>>;
    releaseHandle(handle: js.JSHandle): Promise<void>;
}
export declare function createHandle(context: js.ExecutionContext, remoteObject: Protocol.Runtime.RemoteObject): js.JSHandle;
