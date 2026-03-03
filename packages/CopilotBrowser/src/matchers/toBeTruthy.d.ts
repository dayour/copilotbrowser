/**
 * Copyright Microsoft Corporation. All rights reserved.
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
import type { MatcherResult } from './matcherHint';
import type { Locator } from '@copilotbrowser/copilotbrowser';
import type { ExpectMatcherStateInternal } from './matchers';
export declare function toBeTruthy(this: ExpectMatcherStateInternal, matcherName: string, locator: Locator, receiverType: string, expected: string, arg: string, query: (isNot: boolean, timeout: number) => Promise<{
    matches: boolean;
    log?: string[];
    received?: any;
    timedOut?: boolean;
    errorMessage?: string;
}>, options?: {
    timeout?: number;
}): Promise<MatcherResult<any, any>>;
