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
import type { Android } from './android/android';
import { DebugController } from './debugController';
import type { Electron } from './electron/electron';
import { SdkObject } from './instrumentation';
import type { BrowserType } from './browserType';
import type { Language } from '../utils';
import type { Browser } from './browser';
import type { Page } from './page';
type copilotbrowserOptions = {
    sdkLanguage: Language;
    isInternalcopilotbrowser?: boolean;
    isServer?: boolean;
};
export declare class copilotbrowser extends SdkObject {
    readonly chromium: BrowserType;
    readonly android: Android;
    readonly electron: Electron;
    readonly firefox: BrowserType;
    readonly webkit: BrowserType;
    readonly options: copilotbrowserOptions;
    readonly debugController: DebugController;
    private _allPages;
    private _allBrowsers;
    constructor(options: copilotbrowserOptions);
    allBrowsers(): Browser[];
    allPages(): Page[];
}
export declare function createcopilotbrowser(options: copilotbrowserOptions): copilotbrowser;
export {};
