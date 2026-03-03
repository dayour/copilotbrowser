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
import type { Location } from './../types/testReporter';
import type { TestInfoErrorImpl } from './common/ipc';
import type { StackFrame } from '@protocol/channels';
import type { RawStack } from '@copilotbrowser/copilotbrowser/lib/utils';
import type { TestCase } from './common/test';
export declare function filterStackTrace(e: Error): {
    message: string;
    stack: string;
    cause?: ReturnType<typeof filterStackTrace>;
};
export declare function filterStackFile(file: string): boolean;
export declare function filteredStackTrace(rawStack: RawStack): StackFrame[];
export declare function serializeError(error: Error | any): TestInfoErrorImpl;
export type Matcher = (value: string) => boolean;
export type TestFileFilter = {
    re?: RegExp;
    exact?: string;
    line: number | null;
    column: number | null;
};
export type TestCaseFilter = (test: TestCase) => boolean;
export declare function parseLocationArg(arg: string): {
    file: string;
    line: number | null;
    column: number | null;
};
export declare function createFileFiltersFromArguments(args: string[]): TestFileFilter[];
export declare function createFileMatcherFromArguments(args: string[]): Matcher;
export declare function createFileMatcher(patterns: string | RegExp | (string | RegExp)[]): Matcher;
export declare function createTitleMatcher(patterns: RegExp | RegExp[]): Matcher;
export declare function mergeObjects<A extends object, B extends object, C extends object>(a: A | undefined | void, b: B | undefined | void, c: C | undefined | void): A & B & C;
export declare function forceRegExp(pattern: string): RegExp;
export declare function relativeFilePath(file: string): string;
export declare function formatLocation(location: Location): string;
export declare function errorWithFile(file: string, message: string): Error;
export declare function expectTypes(receiver: any, types: string[], matcherName: string): void;
export declare const windowsFilesystemFriendlyLength = 60;
export declare function trimLongString(s: string, length?: number): string;
export declare function addSuffixToFilePath(filePath: string, suffix: string): string;
export declare function sanitizeFilePathBeforeExtension(filePath: string, ext?: string): string;
/**
 * Returns absolute path contained within parent directory.
 */
export declare function getContainedPath(parentPath: string, subPath?: string): string | null;
export declare const debugTest: any;
export declare function getPackageJsonPath(folderPath: string): string;
export declare function resolveReporterOutputPath(defaultValue: string, configDir: string, configValue: string | undefined): string;
export declare function normalizeAndSaveAttachment(outputPath: string, name: string, options?: {
    path?: string;
    body?: string | Buffer;
    contentType?: string;
}): Promise<{
    name: string;
    path?: string;
    body?: Buffer;
    contentType: string;
}>;
export declare function fileIsModule(file: string): boolean;
export declare function resolveImportSpecifierAfterMapping(resolved: string, afterPathMapping: boolean): string | undefined;
export declare function fileExistsAsync(resolved: string): Promise<boolean>;
export declare function removeDirAndLogToConsole(dir: string): Promise<void>;
export { ansiRegex, stripAnsiEscapes } from '@copilotbrowser/copilotbrowser/lib/utils';
