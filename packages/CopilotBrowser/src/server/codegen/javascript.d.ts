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
import type { Language, LanguageGenerator, LanguageGeneratorOptions } from './types';
import type * as actions from '@recorder/actions';
export declare class JavaScriptLanguageGenerator implements LanguageGenerator {
    id: string;
    groupName: string;
    name: string;
    highlighter: Language;
    private _isTest;
    constructor(isTest: boolean);
    generateAction(actionInContext: actions.ActionInContext): string;
    private _generateActionCall;
    private _asLocator;
    generateHeader(options: LanguageGeneratorOptions): string;
    generateFooter(saveStorage: string | undefined): string;
    generateTestHeader(options: LanguageGeneratorOptions): string;
    generateTestFooter(saveStorage: string | undefined): string;
    generateStandaloneHeader(options: LanguageGeneratorOptions): string;
    generateStandaloneFooter(saveStorage: string | undefined): string;
}
export declare class JavaScriptFormatter {
    private _baseIndent;
    private _baseOffset;
    private _lines;
    constructor(offset?: number);
    prepend(text: string): void;
    add(text: string): void;
    newLine(): void;
    format(): string;
}
export declare function quoteMultiline(text: string, indent?: string): string;
