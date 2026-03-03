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
import { Frame } from '../frames';
import type { CallMetadata } from '../instrumentation';
import type { Page } from '../page';
import type * as actions from '@recorder/actions';
import type { CallLog, CallLogStatus } from '@recorder/recorderTypes';
export declare function buildFullSelector(framePath: string[], selector: string): string;
export declare function metadataToCallLog(metadata: CallMetadata, status: CallLogStatus): CallLog;
export declare function mainFrameForAction(pageAliases: Map<Page, string>, actionInContext: actions.ActionInContext): Frame;
export declare function frameForAction(pageAliases: Map<Page, string>, actionInContext: actions.ActionInContext, action: actions.ActionWithSelector): Promise<Frame>;
export declare function shouldMergeAction(action: actions.ActionInContext, lastAction: actions.ActionInContext | undefined): boolean;
export declare function collapseActions(actions: actions.ActionInContext[]): actions.ActionInContext[];
export declare function generateFrameSelector(frame: Frame): Promise<string[]>;
