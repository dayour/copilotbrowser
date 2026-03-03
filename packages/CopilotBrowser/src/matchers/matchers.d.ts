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
import { MatcherResult } from './matcherHint';
import type { ExpectMatcherState } from '../../types/test';
import type { TestStepInfoImpl } from '../worker/testInfo';
import type { APIResponse, Locator, Frame, Page } from '@copilotbrowser/copilotbrowser';
import type { FrameExpectParams } from '@copilotbrowser/copilotbrowser/lib/client/types';
import type { ExpectMatcherUtils } from '../../types/test';
import type { InternalMatcherUtils, URLPattern } from '@copilotbrowser/copilotbrowser/lib/utils';
export type ExpectMatcherStateInternal = Omit<ExpectMatcherState, 'utils'> & {
    _stepInfo?: TestStepInfoImpl;
    utils: ExpectMatcherUtils & InternalMatcherUtils;
};
export interface LocatorEx extends Locator {
    _selector: string;
    _expect(expression: string, options: FrameExpectParams): Promise<{
        matches: boolean;
        received?: any;
        log?: string[];
        timedOut?: boolean;
        errorMessage?: string;
    }>;
}
export interface FrameEx extends Frame {
    _expect(expression: string, options: FrameExpectParams): Promise<{
        matches: boolean;
        received?: any;
        log?: string[];
        timedOut?: boolean;
        errorMessage?: string;
    }>;
}
interface APIResponseEx extends APIResponse {
    _fetchLog(): Promise<string[]>;
}
export declare function toBeAttached(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    attached?: boolean;
    timeout?: number;
}): any;
export declare function toBeChecked(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    checked?: boolean;
    indeterminate?: boolean;
    timeout?: number;
}): any;
export declare function toBeDisabled(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    timeout?: number;
}): any;
export declare function toBeEditable(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    editable?: boolean;
    timeout?: number;
}): any;
export declare function toBeEmpty(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    timeout?: number;
}): any;
export declare function toBeEnabled(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    enabled?: boolean;
    timeout?: number;
}): any;
export declare function toBeFocused(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    timeout?: number;
}): any;
export declare function toBeHidden(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    timeout?: number;
}): any;
export declare function toBeVisible(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    visible?: boolean;
    timeout?: number;
}): any;
export declare function toBeInViewport(this: ExpectMatcherStateInternal, locator: LocatorEx, options?: {
    timeout?: number;
    ratio?: number;
}): any;
export declare function toContainText(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp | (string | RegExp)[], options?: {
    timeout?: number;
    useInnerText?: boolean;
    ignoreCase?: boolean;
}): any;
export declare function toHaveAccessibleDescription(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp, options?: {
    timeout?: number;
    ignoreCase?: boolean;
}): any;
export declare function toHaveAccessibleName(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp, options?: {
    timeout?: number;
    ignoreCase?: boolean;
}): any;
export declare function toHaveAccessibleErrorMessage(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp, options?: {
    timeout?: number;
    ignoreCase?: boolean;
}): any;
export declare function toHaveAttribute(this: ExpectMatcherStateInternal, locator: LocatorEx, name: string, expected: string | RegExp | undefined | {
    timeout?: number;
}, options?: {
    timeout?: number;
    ignoreCase?: boolean;
}): any;
export declare function toHaveClass(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp | (string | RegExp)[], options?: {
    timeout?: number;
}): any;
export declare function toContainClass(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | string[], options?: {
    timeout?: number;
}): any;
export declare function toHaveCount(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: number, options?: {
    timeout?: number;
}): any;
export declare function toHaveCSS(this: ExpectMatcherStateInternal, locator: LocatorEx, name: string, expected: string | RegExp, options?: {
    timeout?: number;
}): Promise<MatcherResult<any, any>>;
export declare function toHaveCSS(this: ExpectMatcherStateInternal, locator: LocatorEx, styles: Record<string, string>, options?: {
    timeout?: number;
}): Promise<MatcherResult<any, any>>;
export declare function toHaveId(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp, options?: {
    timeout?: number;
}): any;
export declare function toHaveJSProperty(this: ExpectMatcherStateInternal, locator: LocatorEx, name: string, expected: any, options?: {
    timeout?: number;
}): any;
export declare function toHaveRole(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string, options?: {
    timeout?: number;
    ignoreCase?: boolean;
}): any;
export declare function toHaveText(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp | (string | RegExp)[], options?: {
    timeout?: number;
    useInnerText?: boolean;
    ignoreCase?: boolean;
}): any;
export declare function toHaveValue(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: string | RegExp, options?: {
    timeout?: number;
}): any;
export declare function toHaveValues(this: ExpectMatcherStateInternal, locator: LocatorEx, expected: (string | RegExp)[], options?: {
    timeout?: number;
}): any;
export declare function toHaveTitle(this: ExpectMatcherStateInternal, page: Page, expected: string | RegExp, options?: {
    timeout?: number;
}): any;
export declare function toHaveURL(this: ExpectMatcherStateInternal, page: Page, expected: string | RegExp | URLPattern | ((url: URL) => boolean), options?: {
    ignoreCase?: boolean;
    timeout?: number;
}): any;
export declare function toBeOK(this: ExpectMatcherStateInternal, response: APIResponseEx): Promise<{
    message: () => string;
    pass: boolean;
}>;
export declare function toPass(this: ExpectMatcherState, callback: () => any, options?: {
    intervals?: number[];
    timeout?: number;
}): Promise<{
    message: () => any;
    pass: boolean;
}>;
export declare function computeMatcherTitleSuffix(matcherName: string, receiver: any, args: any[]): {
    short?: string;
    long?: string;
};
export {};
