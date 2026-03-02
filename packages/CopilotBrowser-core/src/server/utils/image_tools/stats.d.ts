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
import type { ImageChannel } from './imageChannel';
export interface Stats {
    c1: ImageChannel;
    c2: ImageChannel;
    meanC1(x1: number, y1: number, x2: number, y2: number): number;
    meanC2(x1: number, y1: number, x2: number, y2: number): number;
    varianceC1(x1: number, y1: number, x2: number, y2: number): number;
    varianceC2(x1: number, y1: number, x2: number, y2: number): number;
    covariance(x1: number, y1: number, x2: number, y2: number): number;
}
export declare function ssim(stats: Stats, x1: number, y1: number, x2: number, y2: number): number;
export declare class FastStats implements Stats {
    c1: ImageChannel;
    c2: ImageChannel;
    private _partialSumC1;
    private _partialSumC2;
    private _partialSumMult;
    private _partialSumSq1;
    private _partialSumSq2;
    constructor(c1: ImageChannel, c2: ImageChannel);
    _sum(partialSum: number[], x1: number, y1: number, x2: number, y2: number): number;
    meanC1(x1: number, y1: number, x2: number, y2: number): number;
    meanC2(x1: number, y1: number, x2: number, y2: number): number;
    varianceC1(x1: number, y1: number, x2: number, y2: number): number;
    varianceC2(x1: number, y1: number, x2: number, y2: number): number;
    covariance(x1: number, y1: number, x2: number, y2: number): number;
}
