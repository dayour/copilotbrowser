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
import { Context } from './context';
import type * as loopTypes from '@lowire/loop';
import type { Progress } from '../progress';
export type CallParams = {
    cacheKey?: string;
    maxTokens?: number;
    maxActions?: number;
    maxActionRetries?: number;
};
export declare function pageAgentPerform(progress: Progress, context: Context, userTask: string, callParams: CallParams): Promise<void>;
export declare function pageAgentExpect(progress: Progress, context: Context, expectation: string, callParams: CallParams): Promise<void>;
export declare function pageAgentExtract(progress: Progress, context: Context, query: string, schema: loopTypes.Schema, callParams: CallParams): Promise<any>;
