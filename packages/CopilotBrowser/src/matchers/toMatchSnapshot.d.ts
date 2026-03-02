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
import type { ExpectMatcherStateInternal } from './matchers';
import type { FullProjectInternal } from '../common/config';
import type { Locator, Page } from 'copilotbrowser-core';
import type { ImageComparatorOptions } from 'copilotbrowser-core/lib/utils';
type NameOrSegments = string | string[];
type ToHaveScreenshotConfigOptions = NonNullable<NonNullable<FullProjectInternal['expect']>['toHaveScreenshot']> & {
    _comparator?: string;
};
type ToHaveScreenshotOptions = ToHaveScreenshotConfigOptions & {
    clip?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    fullPage?: boolean;
    mask?: Array<Locator>;
    maskColor?: string;
    omitBackground?: boolean;
    timeout?: number;
};
export declare function toMatchSnapshot(this: ExpectMatcherStateInternal, received: Buffer | string, nameOrOptions?: NameOrSegments | {
    name?: NameOrSegments;
} & ImageComparatorOptions, optOptions?: ImageComparatorOptions): MatcherResult<NameOrSegments | {
    name?: NameOrSegments;
}, string>;
export declare function toHaveScreenshotStepTitle(nameOrOptions?: NameOrSegments | {
    name?: NameOrSegments;
} & ToHaveScreenshotOptions, optOptions?: ToHaveScreenshotOptions): string;
export declare function toHaveScreenshot(this: ExpectMatcherStateInternal, pageOrLocator: Page | Locator, nameOrOptions?: NameOrSegments | {
    name?: NameOrSegments;
} & ToHaveScreenshotOptions, optOptions?: ToHaveScreenshotOptions): Promise<MatcherResult<NameOrSegments | {
    name?: NameOrSegments;
}, string>>;
export {};
