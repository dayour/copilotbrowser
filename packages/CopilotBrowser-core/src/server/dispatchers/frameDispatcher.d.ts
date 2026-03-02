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
import { Frame } from '../frames';
import { Dispatcher } from './dispatcher';
import type { Progress } from '../progress';
import type { BrowserContextDispatcher } from './browserContextDispatcher';
import type { PageDispatcher } from './pageDispatcher';
import type * as channels from '@protocol/channels';
export declare class FrameDispatcher extends Dispatcher<Frame, channels.FrameChannel, BrowserContextDispatcher | PageDispatcher> implements channels.FrameChannel {
    _type_Frame: boolean;
    private _frame;
    private _browserContextDispatcher;
    static from(scope: BrowserContextDispatcher, frame: Frame): FrameDispatcher;
    static fromNullable(scope: BrowserContextDispatcher, frame: Frame | null): FrameDispatcher | undefined;
    private constructor();
    goto(params: channels.FrameGotoParams, progress: Progress): Promise<channels.FrameGotoResult>;
    frameElement(params: channels.FrameFrameElementParams, progress: Progress): Promise<channels.FrameFrameElementResult>;
    evaluateExpression(params: channels.FrameEvaluateExpressionParams, progress: Progress): Promise<channels.FrameEvaluateExpressionResult>;
    evaluateExpressionHandle(params: channels.FrameEvaluateExpressionHandleParams, progress: Progress): Promise<channels.FrameEvaluateExpressionHandleResult>;
    waitForSelector(params: channels.FrameWaitForSelectorParams, progress: Progress): Promise<channels.FrameWaitForSelectorResult>;
    dispatchEvent(params: channels.FrameDispatchEventParams, progress: Progress): Promise<void>;
    evalOnSelector(params: channels.FrameEvalOnSelectorParams, progress: Progress): Promise<channels.FrameEvalOnSelectorResult>;
    evalOnSelectorAll(params: channels.FrameEvalOnSelectorAllParams, progress: Progress): Promise<channels.FrameEvalOnSelectorAllResult>;
    querySelector(params: channels.FrameQuerySelectorParams, progress: Progress): Promise<channels.FrameQuerySelectorResult>;
    querySelectorAll(params: channels.FrameQuerySelectorAllParams, progress: Progress): Promise<channels.FrameQuerySelectorAllResult>;
    queryCount(params: channels.FrameQueryCountParams, progress: Progress): Promise<channels.FrameQueryCountResult>;
    content(params: channels.FrameContentParams, progress: Progress): Promise<channels.FrameContentResult>;
    setContent(params: channels.FrameSetContentParams, progress: Progress): Promise<void>;
    addScriptTag(params: channels.FrameAddScriptTagParams, progress: Progress): Promise<channels.FrameAddScriptTagResult>;
    addStyleTag(params: channels.FrameAddStyleTagParams, progress: Progress): Promise<channels.FrameAddStyleTagResult>;
    click(params: channels.FrameClickParams, progress: Progress): Promise<void>;
    dblclick(params: channels.FrameDblclickParams, progress: Progress): Promise<void>;
    dragAndDrop(params: channels.FrameDragAndDropParams, progress: Progress): Promise<void>;
    tap(params: channels.FrameTapParams, progress: Progress): Promise<void>;
    fill(params: channels.FrameFillParams, progress: Progress): Promise<void>;
    focus(params: channels.FrameFocusParams, progress: Progress): Promise<void>;
    blur(params: channels.FrameBlurParams, progress: Progress): Promise<void>;
    textContent(params: channels.FrameTextContentParams, progress: Progress): Promise<channels.FrameTextContentResult>;
    innerText(params: channels.FrameInnerTextParams, progress: Progress): Promise<channels.FrameInnerTextResult>;
    innerHTML(params: channels.FrameInnerHTMLParams, progress: Progress): Promise<channels.FrameInnerHTMLResult>;
    resolveSelector(params: channels.FrameResolveSelectorParams, progress: Progress): Promise<channels.FrameResolveSelectorResult>;
    getAttribute(params: channels.FrameGetAttributeParams, progress: Progress): Promise<channels.FrameGetAttributeResult>;
    inputValue(params: channels.FrameInputValueParams, progress: Progress): Promise<channels.FrameInputValueResult>;
    isChecked(params: channels.FrameIsCheckedParams, progress: Progress): Promise<channels.FrameIsCheckedResult>;
    isDisabled(params: channels.FrameIsDisabledParams, progress: Progress): Promise<channels.FrameIsDisabledResult>;
    isEditable(params: channels.FrameIsEditableParams, progress: Progress): Promise<channels.FrameIsEditableResult>;
    isEnabled(params: channels.FrameIsEnabledParams, progress: Progress): Promise<channels.FrameIsEnabledResult>;
    isHidden(params: channels.FrameIsHiddenParams, progress: Progress): Promise<channels.FrameIsHiddenResult>;
    isVisible(params: channels.FrameIsVisibleParams, progress: Progress): Promise<channels.FrameIsVisibleResult>;
    hover(params: channels.FrameHoverParams, progress: Progress): Promise<void>;
    selectOption(params: channels.FrameSelectOptionParams, progress: Progress): Promise<channels.FrameSelectOptionResult>;
    setInputFiles(params: channels.FrameSetInputFilesParams, progress: Progress): Promise<channels.FrameSetInputFilesResult>;
    type(params: channels.FrameTypeParams, progress: Progress): Promise<void>;
    press(params: channels.FramePressParams, progress: Progress): Promise<void>;
    check(params: channels.FrameCheckParams, progress: Progress): Promise<void>;
    uncheck(params: channels.FrameUncheckParams, progress: Progress): Promise<void>;
    waitForTimeout(params: channels.FrameWaitForTimeoutParams, progress: Progress): Promise<void>;
    waitForFunction(params: channels.FrameWaitForFunctionParams, progress: Progress): Promise<channels.FrameWaitForFunctionResult>;
    title(params: channels.FrameTitleParams, progress: Progress): Promise<channels.FrameTitleResult>;
    highlight(params: channels.FrameHighlightParams, progress: Progress): Promise<void>;
    expect(params: channels.FrameExpectParams, progress: Progress): Promise<channels.FrameExpectResult>;
    ariaSnapshot(params: channels.FrameAriaSnapshotParams, progress: Progress): Promise<channels.FrameAriaSnapshotResult>;
}
