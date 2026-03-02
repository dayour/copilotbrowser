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
type CSharpLanguageMode = 'library' | 'mstest' | 'nunit';
export declare class CSharpLanguageGenerator implements LanguageGenerator {
    id: string;
    groupName: string;
    name: string;
    highlighter: Language;
    _mode: CSharpLanguageMode;
    constructor(mode: CSharpLanguageMode);
    generateAction(actionInContext: actions.ActionInContext): string;
    _generateActionInner(actionInContext: actions.ActionInContext): string;
    private _formatPageAlias;
    private _generateActionCall;
    private _asLocator;
    generateHeader(options: LanguageGeneratorOptions): string;
    generateStandaloneHeader(options: LanguageGeneratorOptions): string;
    generateTestRunnerHeader(options: LanguageGeneratorOptions): string;
    generateFooter(saveStorage: string | undefined): string;
}
export {};
