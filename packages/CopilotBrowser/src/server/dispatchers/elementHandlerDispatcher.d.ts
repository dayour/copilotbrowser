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
import { FrameDispatcher } from './frameDispatcher';
import { JSHandleDispatcher } from './jsHandleDispatcher';
import type { ElementHandle } from '../dom';
import type * as js from '../javascript';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class ElementHandleDispatcher extends JSHandleDispatcher<FrameDispatcher> implements channels.ElementHandleChannel {
    _type_ElementHandle: boolean;
    readonly _elementHandle: ElementHandle;
    static from(scope: FrameDispatcher, handle: ElementHandle): ElementHandleDispatcher;
    static fromNullable(scope: FrameDispatcher, handle: ElementHandle | null): ElementHandleDispatcher | undefined;
    static fromJSOrElementHandle(scope: FrameDispatcher, handle: js.JSHandle): JSHandleDispatcher;
    private constructor();
    ownerFrame(params: channels.ElementHandleOwnerFrameParams, progress: Progress): Promise<channels.ElementHandleOwnerFrameResult>;
    contentFrame(params: channels.ElementHandleContentFrameParams, progress: Progress): Promise<channels.ElementHandleContentFrameResult>;
    getAttribute(params: channels.ElementHandleGetAttributeParams, progress: Progress): Promise<channels.ElementHandleGetAttributeResult>;
    inputValue(params: channels.ElementHandleInputValueParams, progress: Progress): Promise<channels.ElementHandleInputValueResult>;
    textContent(params: channels.ElementHandleTextContentParams, progress: Progress): Promise<channels.ElementHandleTextContentResult>;
    innerText(params: channels.ElementHandleInnerTextParams, progress: Progress): Promise<channels.ElementHandleInnerTextResult>;
    innerHTML(params: channels.ElementHandleInnerHTMLParams, progress: Progress): Promise<channels.ElementHandleInnerHTMLResult>;
    isChecked(params: channels.ElementHandleIsCheckedParams, progress: Progress): Promise<channels.ElementHandleIsCheckedResult>;
    isDisabled(params: channels.ElementHandleIsDisabledParams, progress: Progress): Promise<channels.ElementHandleIsDisabledResult>;
    isEditable(params: channels.ElementHandleIsEditableParams, progress: Progress): Promise<channels.ElementHandleIsEditableResult>;
    isEnabled(params: channels.ElementHandleIsEnabledParams, progress: Progress): Promise<channels.ElementHandleIsEnabledResult>;
    isHidden(params: channels.ElementHandleIsHiddenParams, progress: Progress): Promise<channels.ElementHandleIsHiddenResult>;
    isVisible(params: channels.ElementHandleIsVisibleParams, progress: Progress): Promise<channels.ElementHandleIsVisibleResult>;
    dispatchEvent(params: channels.ElementHandleDispatchEventParams, progress: Progress): Promise<void>;
    scrollIntoViewIfNeeded(params: channels.ElementHandleScrollIntoViewIfNeededParams, progress: Progress): Promise<void>;
    hover(params: channels.ElementHandleHoverParams, progress: Progress): Promise<void>;
    click(params: channels.ElementHandleClickParams, progress: Progress): Promise<void>;
    dblclick(params: channels.ElementHandleDblclickParams, progress: Progress): Promise<void>;
    tap(params: channels.ElementHandleTapParams, progress: Progress): Promise<void>;
    selectOption(params: channels.ElementHandleSelectOptionParams, progress: Progress): Promise<channels.ElementHandleSelectOptionResult>;
    fill(params: channels.ElementHandleFillParams, progress: Progress): Promise<void>;
    selectText(params: channels.ElementHandleSelectTextParams, progress: Progress): Promise<void>;
    setInputFiles(params: channels.ElementHandleSetInputFilesParams, progress: Progress): Promise<void>;
    focus(params: channels.ElementHandleFocusParams, progress: Progress): Promise<void>;
    type(params: channels.ElementHandleTypeParams, progress: Progress): Promise<void>;
    press(params: channels.ElementHandlePressParams, progress: Progress): Promise<void>;
    check(params: channels.ElementHandleCheckParams, progress: Progress): Promise<void>;
    uncheck(params: channels.ElementHandleUncheckParams, progress: Progress): Promise<void>;
    boundingBox(params: channels.ElementHandleBoundingBoxParams, progress: Progress): Promise<channels.ElementHandleBoundingBoxResult>;
    screenshot(params: channels.ElementHandleScreenshotParams, progress: Progress): Promise<channels.ElementHandleScreenshotResult>;
    querySelector(params: channels.ElementHandleQuerySelectorParams, progress: Progress): Promise<channels.ElementHandleQuerySelectorResult>;
    querySelectorAll(params: channels.ElementHandleQuerySelectorAllParams, progress: Progress): Promise<channels.ElementHandleQuerySelectorAllResult>;
    evalOnSelector(params: channels.ElementHandleEvalOnSelectorParams, progress: Progress): Promise<channels.ElementHandleEvalOnSelectorResult>;
    evalOnSelectorAll(params: channels.ElementHandleEvalOnSelectorAllParams, progress: Progress): Promise<channels.ElementHandleEvalOnSelectorAllResult>;
    waitForElementState(params: channels.ElementHandleWaitForElementStateParams, progress: Progress): Promise<void>;
    waitForSelector(params: channels.ElementHandleWaitForSelectorParams, progress: Progress): Promise<channels.ElementHandleWaitForSelectorResult>;
    private _browserContextDispatcher;
}
