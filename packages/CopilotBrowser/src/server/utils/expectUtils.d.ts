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
import type { ExpectedTextValue } from '@protocol/channels';
export interface InternalMatcherUtils {
    printDiffOrStringify(expected: unknown, received: unknown, expectedLabel: string, receivedLabel: string, expand: boolean): string;
    printExpected(value: unknown): string;
    printReceived(object: unknown): string;
    DIM_COLOR(text: string): string;
    RECEIVED_COLOR(text: string): string;
    INVERTED_COLOR(text: string): string;
    EXPECTED_COLOR(text: string): string;
}
export declare function serializeExpectedTextValues(items: (string | RegExp)[], options?: {
    matchSubstring?: boolean;
    normalizeWhiteSpace?: boolean;
    ignoreCase?: boolean;
}): ExpectedTextValue[];
export declare const printReceivedStringContainExpectedSubstring: (utils: InternalMatcherUtils, received: string, start: number, length: number) => string;
export declare const printReceivedStringContainExpectedResult: (utils: InternalMatcherUtils, received: string, result: RegExpExecArray | null) => string;
type MatcherMessageDetails = {
    promise?: '' | 'rejects' | 'resolves';
    isNot?: boolean;
    receiver?: string;
    matcherName: string;
    expectation: string;
    locator?: string;
    printedExpected?: string;
    printedReceived?: string;
    printedDiff?: string;
    timedOut?: boolean;
    timeout?: number;
    errorMessage?: string;
    log?: string[];
};
export declare function formatMatcherMessage(utils: InternalMatcherUtils, details: MatcherMessageDetails): string;
export declare const callLogText: (utils: InternalMatcherUtils, log: string[] | undefined) => string;
export declare const simpleMatcherUtils: InternalMatcherUtils;
export {};
