/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as js from '../javascript';
import * as dom from '../dom';
import * as bidi from './third_party/bidiProtocol';
import type { BidiSession } from './bidiConnection';
export declare class BidiExecutionContext implements js.ExecutionContextDelegate {
    private readonly _session;
    readonly _target: bidi.Script.Target;
    constructor(session: BidiSession, realmInfo: bidi.Script.RealmInfo);
    rawEvaluateJSON(expression: string): Promise<any>;
    rawEvaluateHandle(context: js.ExecutionContext, expression: string): Promise<js.JSHandle>;
    evaluateWithArguments(functionDeclaration: string, returnByValue: boolean, utilityScript: js.JSHandle, values: any[], handles: js.JSHandle[]): Promise<any>;
    getProperties(handle: js.JSHandle): Promise<Map<string, js.JSHandle>>;
    releaseHandle(handle: js.JSHandle): Promise<void>;
    nodeIdForElementHandle(handle: dom.ElementHandle): Promise<bidi.Script.SharedReference>;
    remoteObjectForNodeId(context: dom.FrameExecutionContext, nodeId: bidi.Script.SharedReference): Promise<dom.ElementHandle>;
    contentFrameIdForFrame(handle: dom.ElementHandle): Promise<string>;
    frameIdForWindowHandle(handle: js.JSHandle): Promise<string | null>;
    private _remoteValueForReference;
    private _rawCallFunction;
}
export declare function createHandle(context: js.ExecutionContext, remoteObject: bidi.Script.RemoteValue): js.JSHandle;
