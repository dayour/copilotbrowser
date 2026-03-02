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
import type { Locator } from 'copilotbrowser-core';
import type { ExpectMatcherStateInternal } from './matchers';
export declare function toEqual<T>(this: ExpectMatcherStateInternal, matcherName: string, locator: Locator, receiverType: string, query: (isNot: boolean, timeout: number) => Promise<{
    matches: boolean;
    received?: any;
    log?: string[];
    timedOut?: boolean;
    errorMessage?: string;
}>, expected: T, options?: {
    timeout?: number;
    contains?: boolean;
}): Promise<MatcherResult<any, any>>;
