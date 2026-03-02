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
export declare function blendWithWhite(c: number, a: number): number;
export declare function rgb2gray(r: number, g: number, b: number): number;
export declare function colorDeltaE94(rgb1: number[], rgb2: number[]): number;
export declare function srgb2xyz(rgb: number[]): number[];
export declare function xyz2lab(xyz: number[]): number[];
