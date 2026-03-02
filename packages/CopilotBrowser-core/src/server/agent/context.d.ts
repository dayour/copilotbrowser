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
import type * as loopTypes from '@lowire/loop';
import type * as actions from './actions';
import type { Page } from '../page';
import type { Progress } from '../progress';
import type { Language } from '../../utils/isomorphic/locatorGenerators.ts';
import type * as channels from '@protocol/channels';
type HistoryItem = {
    type: 'expect' | 'perform';
    description: string;
};
export declare class Context {
    readonly page: Page;
    readonly sdkLanguage: Language;
    readonly agentParams: channels.PageAgentParams;
    readonly events: loopTypes.LoopEvents;
    private _actions;
    private _history;
    private _budget;
    constructor(page: Page, agentParams: channels.PageAgentParams, events: loopTypes.LoopEvents);
    runActionAndWait(progress: Progress, action: actions.Action): Promise<loopTypes.ToolResult>;
    runActionsAndWait(progress: Progress, action: actions.Action[], options?: {
        noWait?: boolean;
    }): Promise<loopTypes.ToolResult>;
    runActionNoWait(progress: Progress, action: actions.Action): Promise<loopTypes.ToolResult>;
    actions(): (({
        method: "navigate";
        url: string;
    } | {
        method: "click";
        selector: string;
        button?: "left" | "right" | "middle";
        clickCount?: number;
        modifiers?: ("Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift")[];
    } | {
        method: "drag";
        sourceSelector: string;
        targetSelector: string;
    } | {
        method: "hover";
        selector: string;
        modifiers?: ("Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift")[];
    } | {
        method: "selectOption";
        selector: string;
        labels: string[];
    } | {
        method: "pressKey";
        key: string;
    } | {
        method: "pressSequentially";
        selector: string;
        text: string;
        submit?: boolean;
    } | {
        method: "fill";
        selector: string;
        text: string;
        submit?: boolean;
    } | {
        method: "setChecked";
        selector: string;
        checked: boolean;
    } | {
        method: "expectVisible";
        selector: string;
        isNot?: boolean;
    } | {
        method: "expectValue";
        selector: string;
        type: "checkbox" | "combobox" | "radio" | "slider" | "textbox";
        value: string;
        isNot?: boolean;
    } | {
        method: "expectAria";
        template: string;
        isNot?: boolean;
    } | {
        method: "expectURL";
        value?: string;
        regex?: string;
        isNot?: boolean;
    } | {
        method: "expectTitle";
        value: string;
        isNot?: boolean;
    }) & {
        code: string;
    })[];
    history(): HistoryItem[];
    pushHistory(item: HistoryItem): void;
    consumeTokens(tokens: number): void;
    maxTokensRemaining(): number | undefined;
    waitForCompletion<R>(progress: Progress, callback: () => Promise<R>, options?: {
        noWait?: boolean;
    }): Promise<R>;
    takeSnapshot(progress: Progress): Promise<string>;
    snapshotResult(progress: Progress, error?: Error): Promise<loopTypes.ToolResult>;
    refSelectors(progress: Progress, params: {
        element: string;
        ref: string;
    }[]): Promise<string[]>;
}
export declare function redactSecrets(text: string, secrets: channels.NameValue[] | undefined): string;
export declare function applySecrets(text: string, secrets: channels.NameValue[] | undefined): string;
export {};
