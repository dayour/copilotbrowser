/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type * as input from '../input';
import type { Page } from '../page';
import type { Progress } from '../progress';
import type * as types from '../types';
import type { FFSession } from './ffConnection';
export declare class RawKeyboardImpl implements input.RawKeyboard {
    private _client;
    constructor(client: FFSession);
    keydown(progress: Progress, modifiers: Set<types.KeyboardModifier>, keyName: string, description: input.KeyDescription, autoRepeat: boolean): Promise<void>;
    keyup(progress: Progress, modifiers: Set<types.KeyboardModifier>, keyName: string, description: input.KeyDescription): Promise<void>;
    sendText(progress: Progress, text: string): Promise<void>;
}
export declare class RawMouseImpl implements input.RawMouse {
    private _client;
    private _page?;
    constructor(client: FFSession);
    move(progress: Progress, x: number, y: number, button: types.MouseButton | 'none', buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, forClick: boolean): Promise<void>;
    down(progress: Progress, x: number, y: number, button: types.MouseButton, buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, clickCount: number): Promise<void>;
    up(progress: Progress, x: number, y: number, button: types.MouseButton, buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, clickCount: number): Promise<void>;
    wheel(progress: Progress, x: number, y: number, buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, deltaX: number, deltaY: number): Promise<void>;
    setPage(page: Page): void;
}
export declare class RawTouchscreenImpl implements input.RawTouchscreen {
    private _client;
    constructor(client: FFSession);
    tap(progress: Progress, x: number, y: number, modifiers: Set<types.KeyboardModifier>): Promise<void>;
}
