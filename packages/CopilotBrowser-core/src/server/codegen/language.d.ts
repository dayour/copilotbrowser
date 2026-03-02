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
import type { BrowserContextOptions } from '../../..';
import type * as types from '../types';
import type { LanguageGenerator, LanguageGeneratorOptions } from './types';
import type * as actions from '@recorder/actions';
export declare function generateCode(actions: actions.ActionInContext[], languageGenerator: LanguageGenerator, options: LanguageGeneratorOptions): {
    header: string;
    footer: string;
    actionTexts: string[];
    text: string;
};
export declare function sanitizeDeviceOptions(device: any, options: BrowserContextOptions): BrowserContextOptions;
export declare function toSignalMap(action: actions.Action): {
    popup: any;
    download: any;
    dialog: any;
};
export declare function toKeyboardModifiers(modifiers: number): types.SmartKeyboardModifier[];
export declare function fromKeyboardModifiers(modifiers?: types.SmartKeyboardModifier[]): number;
export declare function toClickOptionsForSourceCode(action: actions.ClickAction): types.MouseClickOptions;
