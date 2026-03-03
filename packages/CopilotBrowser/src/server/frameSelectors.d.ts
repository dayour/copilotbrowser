/**
 * Copyright (c) Microsoft Corporation.
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
import type { ElementHandle } from './dom';
import type { Frame } from './frames';
import type { InjectedScript } from '@injected/injectedScript';
import type { JSHandle } from './javascript';
import type * as types from './types';
import type { ParsedSelector } from '../utils/isomorphic/selectorParser';
export type SelectorInfo = {
    parsed: ParsedSelector;
    world: types.World;
    strict: boolean;
};
export type SelectorInFrame = {
    frame: Frame;
    info: SelectorInfo;
    scope?: ElementHandle;
};
export declare class FrameSelectors {
    readonly frame: Frame;
    constructor(frame: Frame);
    private _parseSelector;
    query(selector: string, options?: types.StrictOptions & {
        mainWorld?: boolean;
    }, scope?: ElementHandle): Promise<ElementHandle<Element> | null>;
    queryArrayInMainWorld(selector: string, scope?: ElementHandle): Promise<JSHandle<Element[]>>;
    queryCount(selector: string, options: any): Promise<number>;
    queryAll(selector: string, scope?: ElementHandle): Promise<ElementHandle<Element>[]>;
    private _jumpToAriaRefFrameIfNeeded;
    resolveFrameForSelector(selector: string, options?: types.StrictOptions, scope?: ElementHandle): Promise<SelectorInFrame | null>;
    resolveInjectedForSelector(selector: string, options?: {
        strict?: boolean;
        mainWorld?: boolean;
    }, scope?: ElementHandle): Promise<{
        injected: JSHandle<InjectedScript>;
        info: SelectorInfo;
        frame: Frame;
        scope?: ElementHandle;
    } | undefined>;
}
