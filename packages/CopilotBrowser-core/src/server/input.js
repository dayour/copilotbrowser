"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Touchscreen = exports.Mouse = exports.Keyboard = exports.keypadLocation = void 0;
exports.resolveSmartModifierString = resolveSmartModifierString;
exports.resolveSmartModifier = resolveSmartModifier;
const utils_1 = require("../utils");
const keyboardLayout = __importStar(require("./usKeyboardLayout"));
const dom_1 = require("./dom");
exports.keypadLocation = keyboardLayout.keypadLocation;
const kModifiers = ['Alt', 'Control', 'Meta', 'Shift'];
class Keyboard {
    _pressedModifiers = new Set();
    _pressedKeys = new Set();
    _raw;
    _page;
    constructor(raw, page) {
        this._raw = raw;
        this._page = page;
    }
    async down(progress, key) {
        const description = this._keyDescriptionForString(key);
        const autoRepeat = this._pressedKeys.has(description.code);
        this._pressedKeys.add(description.code);
        if (kModifiers.includes(description.key))
            this._pressedModifiers.add(description.key);
        await this._raw.keydown(progress, this._pressedModifiers, key, description, autoRepeat);
    }
    _keyDescriptionForString(str) {
        const keyString = resolveSmartModifierString(str);
        let description = usKeyboardLayout.get(keyString);
        if (!description)
            throw new dom_1.NonRecoverableDOMError(`Unknown key: "${keyString}"`);
        const shift = this._pressedModifiers.has('Shift');
        description = shift && description.shifted ? description.shifted : description;
        // if any modifiers besides shift are pressed, no text should be sent
        if (this._pressedModifiers.size > 1 || (!this._pressedModifiers.has('Shift') && this._pressedModifiers.size === 1))
            return { ...description, text: '' };
        return description;
    }
    async up(progress, key) {
        const description = this._keyDescriptionForString(key);
        if (kModifiers.includes(description.key))
            this._pressedModifiers.delete(description.key);
        this._pressedKeys.delete(description.code);
        await this._raw.keyup(progress, this._pressedModifiers, key, description);
    }
    async insertText(progress, text) {
        await this._raw.sendText(progress, text);
    }
    async type(progress, text, options) {
        const delay = (options && options.delay) || undefined;
        for (const char of text) {
            if (usKeyboardLayout.has(char)) {
                await this.press(progress, char, { delay });
            }
            else {
                if (delay)
                    await progress.wait(delay);
                await this.insertText(progress, char);
            }
        }
    }
    async press(progress, key, options = {}) {
        function split(keyString) {
            const keys = [];
            let building = '';
            for (const char of keyString) {
                if (char === '+' && building) {
                    keys.push(building);
                    building = '';
                }
                else {
                    building += char;
                }
            }
            keys.push(building);
            return keys;
        }
        const tokens = split(key);
        key = tokens[tokens.length - 1];
        for (let i = 0; i < tokens.length - 1; ++i)
            await this.down(progress, tokens[i]);
        await this.down(progress, key);
        if (options.delay)
            await progress.wait(options.delay);
        await this.up(progress, key);
        for (let i = tokens.length - 2; i >= 0; --i)
            await this.up(progress, tokens[i]);
    }
    async ensureModifiers(progress, mm) {
        const modifiers = mm.map(resolveSmartModifier);
        for (const modifier of modifiers) {
            if (!kModifiers.includes(modifier))
                throw new Error('Unknown modifier ' + modifier);
        }
        const restore = Array.from(this._pressedModifiers);
        for (const key of kModifiers) {
            const needDown = modifiers.includes(key);
            const isDown = this._pressedModifiers.has(key);
            if (needDown && !isDown)
                await this.down(progress, key);
            else if (!needDown && isDown)
                await this.up(progress, key);
        }
        return restore;
    }
    _modifiers() {
        return this._pressedModifiers;
    }
}
exports.Keyboard = Keyboard;
function resolveSmartModifierString(key) {
    if (key === 'ControlOrMeta')
        return process.platform === 'darwin' ? 'Meta' : 'Control';
    return key;
}
function resolveSmartModifier(m) {
    return resolveSmartModifierString(m);
}
class Mouse {
    _keyboard;
    _x = 0;
    _y = 0;
    _lastButton = 'none';
    _buttons = new Set();
    _raw;
    _page;
    constructor(raw, page) {
        this._raw = raw;
        this._page = page;
        this._keyboard = this._page.keyboard;
    }
    currentPoint() {
        return { x: this._x, y: this._y };
    }
    async move(progress, x, y, options = {}) {
        const { steps = 1 } = options;
        const fromX = this._x;
        const fromY = this._y;
        this._x = x;
        this._y = y;
        for (let i = 1; i <= steps; i++) {
            const middleX = fromX + (x - fromX) * (i / steps);
            const middleY = fromY + (y - fromY) * (i / steps);
            await this._raw.move(progress, middleX, middleY, this._lastButton, this._buttons, this._keyboard._modifiers(), !!options.forClick);
        }
    }
    async down(progress, options = {}) {
        const { button = 'left', clickCount = 1 } = options;
        this._lastButton = button;
        this._buttons.add(button);
        await this._raw.down(progress, this._x, this._y, this._lastButton, this._buttons, this._keyboard._modifiers(), clickCount);
    }
    async up(progress, options = {}) {
        const { button = 'left', clickCount = 1 } = options;
        this._lastButton = 'none';
        this._buttons.delete(button);
        await this._raw.up(progress, this._x, this._y, button, this._buttons, this._keyboard._modifiers(), clickCount);
    }
    async click(progress, x, y, options = {}) {
        const { delay = null, clickCount = 1, steps } = options;
        if (delay) {
            await this.move(progress, x, y, { forClick: true, steps });
            for (let cc = 1; cc <= clickCount; ++cc) {
                await this.down(progress, { ...options, clickCount: cc });
                await progress.wait(delay);
                await this.up(progress, { ...options, clickCount: cc });
                if (cc < clickCount)
                    await progress.wait(delay);
            }
        }
        else {
            const promises = [];
            const movePromise = this.move(progress, x, y, { forClick: true, steps });
            if (steps !== undefined && steps > 1)
                await movePromise;
            else
                promises.push(movePromise);
            for (let cc = 1; cc <= clickCount; ++cc) {
                promises.push(this.down(progress, { ...options, clickCount: cc }));
                promises.push(this.up(progress, { ...options, clickCount: cc }));
            }
            await Promise.all(promises);
        }
    }
    async wheel(progress, deltaX, deltaY) {
        await this._raw.wheel(progress, this._x, this._y, this._buttons, this._keyboard._modifiers(), deltaX, deltaY);
    }
}
exports.Mouse = Mouse;
const aliases = new Map([
    ['ShiftLeft', ['Shift']],
    ['ControlLeft', ['Control']],
    ['AltLeft', ['Alt']],
    ['MetaLeft', ['Meta']],
    ['Enter', ['\n', '\r']],
]);
const usKeyboardLayout = buildLayoutClosure(keyboardLayout.USKeyboardLayout);
function buildLayoutClosure(layout) {
    const result = new Map();
    for (const code in layout) {
        const definition = layout[code];
        const description = {
            key: definition.key || '',
            keyCode: definition.keyCode || 0,
            keyCodeWithoutLocation: definition.keyCodeWithoutLocation || definition.keyCode || 0,
            code,
            text: definition.text || '',
            location: definition.location || 0,
        };
        if (definition.key.length === 1)
            description.text = description.key;
        // Generate shifted definition.
        let shiftedDescription;
        if (definition.shiftKey) {
            (0, utils_1.assert)(definition.shiftKey.length === 1);
            shiftedDescription = { ...description };
            shiftedDescription.key = definition.shiftKey;
            shiftedDescription.text = definition.shiftKey;
            if (definition.shiftKeyCode)
                shiftedDescription.keyCode = definition.shiftKeyCode;
        }
        // Map from code: Digit3 -> { ... description, shifted }
        result.set(code, { ...description, shifted: shiftedDescription });
        // Map from aliases: Shift -> non-shiftable definition
        if (aliases.has(code)) {
            for (const alias of aliases.get(code))
                result.set(alias, description);
        }
        // Do not use numpad when converting keys to codes.
        if (definition.location)
            continue;
        // Map from key, no shifted
        if (description.key.length === 1)
            result.set(description.key, description);
        // Map from shiftKey, no shifted
        if (shiftedDescription)
            result.set(shiftedDescription.key, { ...shiftedDescription, shifted: undefined });
    }
    return result;
}
class Touchscreen {
    _raw;
    _page;
    constructor(raw, page) {
        this._raw = raw;
        this._page = page;
    }
    async tap(progress, x, y) {
        if (!this._page.browserContext._options.hasTouch)
            throw new Error('hasTouch must be enabled on the browser context before using the touchscreen.');
        await this._raw.tap(progress, x, y, this._page.keyboard._modifiers());
    }
}
exports.Touchscreen = Touchscreen;
