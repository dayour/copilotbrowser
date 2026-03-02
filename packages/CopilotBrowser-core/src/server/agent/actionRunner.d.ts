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
import type * as actions from './actions';
import type { Page } from '../page';
import type { Progress } from '../progress';
import type { NameValue } from '@protocol/channels';
export declare function runAction(progress: Progress, mode: 'generate' | 'run', page: Page, action: actions.Action, secrets: NameValue[]): Promise<any>;
export declare function traceParamsForAction(progress: Progress, action: actions.Action, mode: 'generate' | 'run'): {
    title?: string;
    type: string;
    method: string;
    params: any;
};
