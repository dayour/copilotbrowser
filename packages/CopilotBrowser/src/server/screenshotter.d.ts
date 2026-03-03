/**
 * Copyright 2019 Google Inc. All rights reserved.
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
import type * as dom from './dom';
import type { Frame } from './frames';
import type { Page } from './page';
import type { Progress } from './progress';
import type { Rect } from '../utils/isomorphic/types';
declare global {
    interface Window {
        __pwCleanupScreenshot?: () => void;
    }
}
export type ScreenshotOptions = {
    type?: 'png' | 'jpeg';
    quality?: number;
    omitBackground?: boolean;
    animations?: 'disabled' | 'allow';
    mask?: {
        frame: Frame;
        selector: string;
    }[];
    maskColor?: string;
    fullPage?: boolean;
    clip?: Rect;
    scale?: 'css' | 'device';
    caret?: 'hide' | 'initial';
    style?: string;
};
export declare class Screenshotter {
    private _queue;
    private _page;
    constructor(page: Page);
    private _originalViewportSize;
    private _fullPageSize;
    screenshotPage(progress: Progress, options: ScreenshotOptions): Promise<Buffer>;
    screenshotElement(progress: Progress, handle: dom.ElementHandle, options: ScreenshotOptions): Promise<Buffer>;
    _preparePageForScreenshot(progress: Progress, frame: Frame, screenshotStyle: string | undefined, hideCaret: boolean, disableAnimations: boolean): Promise<void>;
    _restorePageAfterScreenshot(): Promise<void>;
    _maskElements(progress: Progress, options: ScreenshotOptions): Promise<() => Promise<void>>;
    private _screenshot;
}
export declare function validateScreenshotOptions(options: ScreenshotOptions): 'png' | 'jpeg';
