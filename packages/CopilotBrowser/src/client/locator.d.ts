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
import { ElementHandle } from './elementHandle';
import type { Frame } from './frame';
import type { FilePayload, FrameExpectParams, Rect, SelectOption, SelectOptionOptions, TimeoutOptions } from './types';
import type * as structs from '../../types/structs';
import type * as api from '../../types/types';
import type { ByRoleOptions } from '../utils/isomorphic/locatorUtils';
import type * as channels from '@protocol/channels';
export type LocatorOptions = {
    hasText?: string | RegExp;
    hasNotText?: string | RegExp;
    has?: Locator;
    hasNot?: Locator;
    visible?: boolean;
};
export declare class Locator {
    _frame: Frame;
    _selector: string;
    constructor(frame: Frame, selector: string, options?: LocatorOptions);
    private _withElement;
    _equals(locator: Locator): boolean;
    page(): import("./page").Page;
    boundingBox(options?: TimeoutOptions): Promise<Rect | null>;
    check(options?: channels.ElementHandleCheckOptions & TimeoutOptions): Promise<void>;
    click(options?: channels.ElementHandleClickOptions & TimeoutOptions): Promise<void>;
    dblclick(options?: channels.ElementHandleDblclickOptions & TimeoutOptions): Promise<void>;
    dispatchEvent(type: string, eventInit?: Object, options?: TimeoutOptions): Promise<void>;
    dragTo(target: Locator, options?: channels.FrameDragAndDropOptions & TimeoutOptions): Promise<any>;
    evaluate<R, Arg>(pageFunction: structs.PageFunctionOn<SVGElement | HTMLElement, Arg, R>, arg?: Arg, options?: TimeoutOptions): Promise<R>;
    _evaluateFunction(functionDeclaration: string, options?: TimeoutOptions): Promise<any>;
    evaluateAll<R, Arg>(pageFunction: structs.PageFunctionOn<Element[], Arg, R>, arg?: Arg): Promise<R>;
    evaluateHandle<R, Arg>(pageFunction: structs.PageFunctionOn<any, Arg, R>, arg?: Arg, options?: TimeoutOptions): Promise<structs.SmartHandle<R>>;
    fill(value: string, options?: channels.ElementHandleFillOptions & TimeoutOptions): Promise<void>;
    clear(options?: channels.ElementHandleFillOptions): Promise<void>;
    _highlight(): Promise<any>;
    highlight(): Promise<any>;
    locator(selectorOrLocator: string | Locator, options?: Omit<LocatorOptions, 'visible'>): Locator;
    getByTestId(testId: string | RegExp): Locator;
    getByAltText(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByLabel(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByPlaceholder(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByText(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByTitle(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByRole(role: string, options?: ByRoleOptions): Locator;
    frameLocator(selector: string): FrameLocator;
    filter(options?: LocatorOptions): Locator;
    elementHandle(options?: TimeoutOptions): Promise<ElementHandle<SVGElement | HTMLElement>>;
    elementHandles(): Promise<api.ElementHandle<SVGElement | HTMLElement>[]>;
    contentFrame(): FrameLocator;
    describe(description: string): Locator;
    description(): string | null;
    first(): Locator;
    last(): Locator;
    nth(index: number): Locator;
    and(locator: Locator): Locator;
    or(locator: Locator): Locator;
    focus(options?: TimeoutOptions): Promise<void>;
    blur(options?: TimeoutOptions): Promise<void>;
    count(_options?: {}): Promise<number>;
    _resolveSelector(): Promise<{
        resolvedSelector: string;
    }>;
    getAttribute(name: string, options?: TimeoutOptions): Promise<string | null>;
    hover(options?: channels.ElementHandleHoverOptions & TimeoutOptions): Promise<void>;
    innerHTML(options?: TimeoutOptions): Promise<string>;
    innerText(options?: TimeoutOptions): Promise<string>;
    inputValue(options?: TimeoutOptions): Promise<string>;
    isChecked(options?: TimeoutOptions): Promise<boolean>;
    isDisabled(options?: TimeoutOptions): Promise<boolean>;
    isEditable(options?: TimeoutOptions): Promise<boolean>;
    isEnabled(options?: TimeoutOptions): Promise<boolean>;
    isHidden(options?: TimeoutOptions): Promise<boolean>;
    isVisible(options?: TimeoutOptions): Promise<boolean>;
    press(key: string, options?: channels.ElementHandlePressOptions & TimeoutOptions): Promise<void>;
    screenshot(options?: Omit<channels.ElementHandleScreenshotOptions, 'mask'> & TimeoutOptions & {
        path?: string;
        mask?: api.Locator[];
    }): Promise<Buffer>;
    ariaSnapshot(options?: TimeoutOptions): Promise<string>;
    scrollIntoViewIfNeeded(options?: channels.ElementHandleScrollIntoViewIfNeededOptions & TimeoutOptions): Promise<void>;
    selectOption(values: string | api.ElementHandle | SelectOption | string[] | api.ElementHandle[] | SelectOption[] | null, options?: SelectOptionOptions): Promise<string[]>;
    selectText(options?: channels.ElementHandleSelectTextOptions & TimeoutOptions): Promise<void>;
    setChecked(checked: boolean, options?: channels.ElementHandleCheckOptions & TimeoutOptions): Promise<void>;
    setInputFiles(files: string | FilePayload | string[] | FilePayload[], options?: channels.ElementHandleSetInputFilesOptions & TimeoutOptions): Promise<void>;
    tap(options?: channels.ElementHandleTapOptions & TimeoutOptions): Promise<void>;
    textContent(options?: TimeoutOptions): Promise<string | null>;
    type(text: string, options?: channels.ElementHandleTypeOptions & TimeoutOptions): Promise<void>;
    pressSequentially(text: string, options?: channels.ElementHandleTypeOptions & TimeoutOptions): Promise<void>;
    uncheck(options?: channels.ElementHandleUncheckOptions & TimeoutOptions): Promise<void>;
    all(): Promise<Locator[]>;
    allInnerTexts(): Promise<string[]>;
    allTextContents(): Promise<string[]>;
    waitFor(options: channels.FrameWaitForSelectorOptions & TimeoutOptions & {
        state: 'attached' | 'visible';
    }): Promise<void>;
    waitFor(options?: channels.FrameWaitForSelectorOptions & TimeoutOptions): Promise<void>;
    _expect(expression: string, options: FrameExpectParams): Promise<{
        matches: boolean;
        received?: any;
        log?: string[];
        timedOut?: boolean;
        errorMessage?: string;
    }>;
    private _inspect;
    toString(): string;
}
export declare class FrameLocator {
    private _frame;
    private _frameSelector;
    constructor(frame: Frame, selector: string);
    locator(selectorOrLocator: string | Locator, options?: LocatorOptions): Locator;
    getByTestId(testId: string | RegExp): Locator;
    getByAltText(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByLabel(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByPlaceholder(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByText(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByTitle(text: string | RegExp, options?: {
        exact?: boolean;
    }): Locator;
    getByRole(role: string, options?: ByRoleOptions): Locator;
    owner(): Locator;
    frameLocator(selector: string): FrameLocator;
    first(): FrameLocator;
    last(): FrameLocator;
    nth(index: number): FrameLocator;
}
export declare function testIdAttributeName(): string;
export declare function setTestIdAttribute(attributeName: string): void;
