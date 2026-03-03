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
import type { BrowserType } from './browserType';
import type { Page } from './page';
import type * as types from './types';
export declare function launchApp(browserType: BrowserType, options: {
    sdkLanguage: string;
    windowSize: types.Size;
    windowPosition?: types.Point;
    persistentContextOptions?: Parameters<BrowserType['launchPersistentContext']>[2];
}): Promise<{
    context: any;
    page: any;
}>;
export declare function syncLocalStorageWithSettings(page: Page, appName: string): Promise<void>;
