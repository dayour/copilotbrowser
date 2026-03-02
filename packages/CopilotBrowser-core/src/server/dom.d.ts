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
import * as js from './javascript';
import type * as frames from './frames';
import type { ElementState, InjectedScript } from '@injected/injectedScript';
import type { Page } from './page';
import type { Progress } from './progress';
import type { ScreenshotOptions } from './screenshotter';
import type * as types from './types';
import type * as channels from '@protocol/channels';
export type InputFilesItems = {
    filePayloads?: types.FilePayload[];
    localPaths?: string[];
    localDirectory?: string;
};
type ActionName = 'click' | 'hover' | 'dblclick' | 'tap' | 'move and up' | 'move and down';
type PerformActionResult = 'error:notvisible' | 'error:notconnected' | 'error:notinviewport' | 'error:optionsnotfound' | 'error:optionnotenabled' | {
    missingState: ElementState;
} | {
    hitTargetDescription: string;
} | 'done';
export declare class NonRecoverableDOMError extends Error {
}
export declare function isNonRecoverableDOMError(error: Error): error is NonRecoverableDOMError;
export declare class FrameExecutionContext extends js.ExecutionContext {
    readonly frame: frames.Frame;
    private _injectedScriptPromise?;
    readonly world: types.World | null;
    constructor(delegate: js.ExecutionContextDelegate, frame: frames.Frame, world: types.World | null);
    adoptIfNeeded(handle: js.JSHandle): Promise<js.JSHandle> | null;
    evaluate<Arg, R>(pageFunction: js.Func1<Arg, R>, arg?: Arg): Promise<R>;
    evaluateHandle<Arg, R>(pageFunction: js.Func1<Arg, R>, arg?: Arg): Promise<js.SmartHandle<R>>;
    evaluateExpression(expression: string, options: {
        isFunction?: boolean;
    }, arg?: any): Promise<any>;
    evaluateExpressionHandle(expression: string, options: {
        isFunction?: boolean;
    }, arg?: any): Promise<js.JSHandle<any>>;
    injectedScript(): Promise<js.JSHandle<InjectedScript>>;
}
export declare class ElementHandle<T extends Node = Node> extends js.JSHandle<T> {
    __elementhandle: T;
    readonly _context: FrameExecutionContext;
    readonly _page: Page;
    readonly _objectId: string;
    readonly _frame: frames.Frame;
    constructor(context: FrameExecutionContext, objectId: string);
    _initializePreview(): Promise<void>;
    asElement(): ElementHandle<T> | null;
    evaluateInUtility<R, Arg>(pageFunction: js.Func1<[js.JSHandle<InjectedScript>, ElementHandle<T>, Arg], R>, arg: Arg): Promise<R | 'error:notconnected'>;
    evaluateHandleInUtility<R, Arg>(pageFunction: js.Func1<[js.JSHandle<InjectedScript>, ElementHandle<T>, Arg], R>, arg: Arg): Promise<js.JSHandle<R> | 'error:notconnected'>;
    ownerFrame(): Promise<frames.Frame | null>;
    isIframeElement(): Promise<boolean | 'error:notconnected'>;
    contentFrame(): Promise<frames.Frame | null>;
    getAttribute(progress: Progress, name: string): Promise<string | null>;
    inputValue(progress: Progress): Promise<string>;
    textContent(progress: Progress): Promise<string | null>;
    innerText(progress: Progress): Promise<string>;
    innerHTML(progress: Progress): Promise<string>;
    dispatchEvent(progress: Progress, type: string, eventInit?: Object): Promise<void>;
    _scrollRectIntoViewIfNeeded(progress: Progress, rect?: types.Rect): Promise<'error:notvisible' | 'error:notconnected' | 'done'>;
    _waitAndScrollIntoViewIfNeeded(progress: Progress, waitForVisible: boolean): Promise<void>;
    scrollIntoViewIfNeeded(progress: Progress): Promise<void>;
    private _clickablePoint;
    private _offsetPoint;
    _retryAction(progress: Progress, actionName: string, action: (retry: number) => Promise<PerformActionResult>, options: {
        trial?: boolean;
        force?: boolean;
        skipActionPreChecks?: boolean;
        noAutoWaiting?: boolean;
    }): Promise<'error:notconnected' | 'done'>;
    _retryPointerAction(progress: Progress, actionName: ActionName, waitForEnabled: boolean, action: (point: types.Point) => Promise<void>, options: {
        waitAfter: boolean | 'disabled';
    } & types.PointerActionOptions & types.PointerActionWaitOptions): Promise<'error:notconnected' | 'done'>;
    _performPointerAction(progress: Progress, actionName: ActionName, waitForEnabled: boolean, action: (point: types.Point) => Promise<void>, forceScrollOptions: ScrollIntoViewOptions | undefined, options: {
        waitAfter: boolean | 'disabled';
    } & types.PointerActionOptions & types.PointerActionWaitOptions): Promise<PerformActionResult>;
    private _markAsTargetElement;
    hover(progress: Progress, options: types.PointerActionOptions & types.PointerActionWaitOptions): Promise<void>;
    _hover(progress: Progress, options: types.PointerActionOptions & types.PointerActionWaitOptions): Promise<'error:notconnected' | 'done'>;
    click(progress: Progress, options: {
        noWaitAfter?: boolean;
    } & types.MouseClickOptions & types.PointerActionWaitOptions): Promise<void>;
    _click(progress: Progress, options: {
        waitAfter: boolean | 'disabled';
    } & types.MouseClickOptions & types.PointerActionWaitOptions): Promise<'error:notconnected' | 'done'>;
    dblclick(progress: Progress, options: types.MouseMultiClickOptions & types.PointerActionWaitOptions): Promise<void>;
    _dblclick(progress: Progress, options: types.MouseMultiClickOptions & types.PointerActionWaitOptions): Promise<'error:notconnected' | 'done'>;
    tap(progress: Progress, options: types.PointerActionWaitOptions): Promise<void>;
    _tap(progress: Progress, options: types.PointerActionWaitOptions): Promise<'error:notconnected' | 'done'>;
    selectOption(progress: Progress, elements: ElementHandle[], values: types.SelectOption[], options: types.CommonActionOptions): Promise<string[]>;
    _selectOption(progress: Progress, elements: ElementHandle[], values: types.SelectOption[], options: types.CommonActionOptions): Promise<string[] | 'error:notconnected'>;
    fill(progress: Progress, value: string, options: types.CommonActionOptions): Promise<void>;
    _fill(progress: Progress, value: string, options: types.CommonActionOptions): Promise<'error:notconnected' | 'done'>;
    selectText(progress: Progress, options: types.CommonActionOptions): Promise<void>;
    setInputFiles(progress: Progress, params: Omit<channels.ElementHandleSetInputFilesParams, 'timeout'>): Promise<void>;
    _setInputFiles(progress: Progress, items: InputFilesItems): Promise<'error:notconnected' | 'done'>;
    focus(progress: Progress): Promise<void>;
    _focus(progress: Progress, resetSelectionIfNotFocused?: boolean): Promise<'error:notconnected' | 'done'>;
    _blur(progress: Progress): Promise<'error:notconnected' | 'done'>;
    type(progress: Progress, text: string, options: {
        delay?: number;
    } & types.StrictOptions): Promise<void>;
    _type(progress: Progress, text: string, options: {
        delay?: number;
    } & types.StrictOptions): Promise<'error:notconnected' | 'done'>;
    press(progress: Progress, key: string, options: {
        delay?: number;
        noWaitAfter?: boolean;
    } & types.StrictOptions): Promise<void>;
    _press(progress: Progress, key: string, options: {
        delay?: number;
        noWaitAfter?: boolean;
    } & types.StrictOptions): Promise<'error:notconnected' | 'done'>;
    check(progress: Progress, options: {
        position?: types.Point;
    } & types.PointerActionWaitOptions): Promise<void>;
    uncheck(progress: Progress, options: {
        position?: types.Point;
    } & types.PointerActionWaitOptions): Promise<void>;
    _setChecked(progress: Progress, state: boolean, options: {
        position?: types.Point;
    } & types.PointerActionWaitOptions): Promise<'error:notconnected' | 'done'>;
    boundingBox(): Promise<types.Rect | null>;
    ariaSnapshot(): Promise<string>;
    screenshot(progress: Progress, options: ScreenshotOptions): Promise<Buffer>;
    querySelector(selector: string, options: types.StrictOptions): Promise<ElementHandle | null>;
    querySelectorAll(selector: string): Promise<ElementHandle<Element>[]>;
    evalOnSelector(selector: string, strict: boolean, expression: string, isFunction: boolean | undefined, arg: any): Promise<any>;
    evalOnSelectorAll(selector: string, expression: string, isFunction: boolean | undefined, arg: any): Promise<any>;
    isVisible(progress: Progress): Promise<boolean>;
    isHidden(progress: Progress): Promise<boolean>;
    isEnabled(progress: Progress): Promise<boolean>;
    isDisabled(progress: Progress): Promise<boolean>;
    isEditable(progress: Progress): Promise<boolean>;
    isChecked(progress: Progress): Promise<boolean>;
    waitForElementState(progress: Progress, state: 'visible' | 'hidden' | 'stable' | 'enabled' | 'disabled' | 'editable'): Promise<void>;
    waitForSelector(progress: Progress, selector: string, options: types.WaitForElementOptions): Promise<ElementHandle<Element> | null>;
    _adoptTo(context: FrameExecutionContext): Promise<ElementHandle<T>>;
    _checkFrameIsHitTarget(point: types.Point): Promise<{
        framePoint: types.Point | undefined;
    } | 'error:notconnected' | {
        hitTargetDescription: string;
    }>;
}
export declare function throwRetargetableDOMError<T>(result: T | 'error:notconnected'): T;
export declare function throwElementIsNotAttached(): never;
export declare function assertDone(result: 'done'): void;
export declare const kUnableToAdoptErrorMessage = "Unable to adopt element handle from a different document";
export {};
