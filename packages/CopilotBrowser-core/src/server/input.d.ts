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
import type { Progress } from './progress';
import type { Page } from './page';
import type * as types from './types';
export declare const keypadLocation = 3;
export type KeyDescription = {
    keyCode: number;
    keyCodeWithoutLocation: number;
    key: string;
    text: string;
    code: string;
    location: number;
    shifted?: KeyDescription;
};
export interface RawKeyboard {
    keydown(progress: Progress, modifiers: Set<types.KeyboardModifier>, keyName: string, description: KeyDescription, autoRepeat: boolean): Promise<void>;
    keyup(progress: Progress, modifiers: Set<types.KeyboardModifier>, keyName: string, description: KeyDescription): Promise<void>;
    sendText(progress: Progress, text: string): Promise<void>;
}
export declare class Keyboard {
    private _pressedModifiers;
    private _pressedKeys;
    private _raw;
    private _page;
    constructor(raw: RawKeyboard, page: Page);
    down(progress: Progress, key: string): Promise<void>;
    private _keyDescriptionForString;
    up(progress: Progress, key: string): Promise<void>;
    insertText(progress: Progress, text: string): Promise<void>;
    type(progress: Progress, text: string, options?: {
        delay?: number;
    }): Promise<void>;
    press(progress: Progress, key: string, options?: {
        delay?: number;
    }): Promise<void>;
    ensureModifiers(progress: Progress, mm: types.SmartKeyboardModifier[]): Promise<types.KeyboardModifier[]>;
    _modifiers(): Set<types.KeyboardModifier>;
}
export declare function resolveSmartModifierString(key: string): string;
export declare function resolveSmartModifier(m: types.SmartKeyboardModifier): types.KeyboardModifier;
export interface RawMouse {
    move(progress: Progress, x: number, y: number, button: types.MouseButton | 'none', buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, forClick: boolean): Promise<void>;
    down(progress: Progress, x: number, y: number, button: types.MouseButton, buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, clickCount: number): Promise<void>;
    up(progress: Progress, x: number, y: number, button: types.MouseButton, buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, clickCount: number): Promise<void>;
    wheel(progress: Progress, x: number, y: number, buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, deltaX: number, deltaY: number): Promise<void>;
}
export declare class Mouse {
    private _keyboard;
    private _x;
    private _y;
    private _lastButton;
    private _buttons;
    private _raw;
    private _page;
    constructor(raw: RawMouse, page: Page);
    currentPoint(): {
        x: number;
        y: number;
    };
    move(progress: Progress, x: number, y: number, options?: {
        steps?: number;
        forClick?: boolean;
    }): Promise<void>;
    down(progress: Progress, options?: {
        button?: types.MouseButton;
        clickCount?: number;
    }): Promise<void>;
    up(progress: Progress, options?: {
        button?: types.MouseButton;
        clickCount?: number;
    }): Promise<void>;
    click(progress: Progress, x: number, y: number, options?: {
        delay?: number;
        button?: types.MouseButton;
        clickCount?: number;
        steps?: number;
    }): Promise<void>;
    wheel(progress: Progress, deltaX: number, deltaY: number): Promise<void>;
}
export interface RawTouchscreen {
    tap(progress: Progress, x: number, y: number, modifiers: Set<types.KeyboardModifier>): Promise<void>;
}
export declare class Touchscreen {
    private _raw;
    private _page;
    constructor(raw: RawTouchscreen, page: Page);
    tap(progress: Progress, x: number, y: number): Promise<void>;
}
