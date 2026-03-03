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
import { SdkObject } from './instrumentation';
import type { Instrumentation } from './instrumentation';
import type { Page } from './page';
type OnHandle = (accept: boolean, promptText?: string) => Promise<void>;
export type DialogType = 'alert' | 'beforeunload' | 'confirm' | 'prompt';
export declare class Dialog extends SdkObject {
    private _page;
    private _type;
    private _message;
    private _onHandle;
    private _handled;
    private _defaultValue;
    constructor(page: Page, type: DialogType, message: string, onHandle: OnHandle, defaultValue?: string);
    page(): Page;
    type(): string;
    message(): string;
    defaultValue(): string;
    accept(promptText?: string): Promise<void>;
    dismiss(): Promise<void>;
    close(): Promise<void>;
}
export declare class DialogManager {
    private _instrumentation;
    private _dialogHandlers;
    private _openedDialogs;
    constructor(instrumentation: Instrumentation);
    dialogDidOpen(dialog: Dialog): void;
    dialogWillClose(dialog: Dialog): void;
    addDialogHandler(handler: (dialog: Dialog) => boolean): void;
    removeDialogHandler(handler: (dialog: Dialog) => boolean): void;
    hasOpenDialogsForPage(page: Page): boolean;
    closeBeforeUnloadDialogs(): Promise<void>;
}
export {};
