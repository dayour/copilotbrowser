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
import type { CRSession } from './crConnection';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class CRCoverage {
    private _jsCoverage;
    private _cssCoverage;
    constructor(client: CRSession);
    startJSCoverage(progress: Progress, options: channels.PageStartJSCoverageParams): Promise<void>;
    stopJSCoverage(): Promise<channels.PageStopJSCoverageResult>;
    startCSSCoverage(progress: Progress, options: channels.PageStartCSSCoverageParams): Promise<void>;
    stopCSSCoverage(): Promise<channels.PageStopCSSCoverageResult>;
}
