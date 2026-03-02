"use strict";
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
exports.RawTouchscreenImpl = exports.RawMouseImpl = exports.RawKeyboardImpl = void 0;
const utils_1 = require("../../utils");
const input = __importStar(require("../input"));
const macEditingCommands_1 = require("../macEditingCommands");
function toModifiersMask(modifiers) {
    // From Source/WebKit/Shared/WebEvent.h
    let mask = 0;
    if (modifiers.has('Shift'))
        mask |= 1;
    if (modifiers.has('Control'))
        mask |= 2;
    if (modifiers.has('Alt'))
        mask |= 4;
    if (modifiers.has('Meta'))
        mask |= 8;
    return mask;
}
function toButtonsMask(buttons) {
    let mask = 0;
    if (buttons.has('left'))
        mask |= 1;
    if (buttons.has('right'))
        mask |= 2;
    if (buttons.has('middle'))
        mask |= 4;
    return mask;
}
class RawKeyboardImpl {
    _pageProxySession;
    _session;
    constructor(session) {
        this._pageProxySession = session;
    }
    setSession(session) {
        this._session = session;
    }
    async keydown(progress, modifiers, keyName, description, autoRepeat) {
        const parts = [];
        for (const modifier of (['Shift', 'Control', 'Alt', 'Meta'])) {
            if (modifiers.has(modifier))
                parts.push(modifier);
        }
        const { code, keyCode, key, text } = description;
        parts.push(code);
        const shortcut = parts.join('+');
        let commands = macEditingCommands_1.macEditingCommands[shortcut];
        if ((0, utils_1.isString)(commands))
            commands = [commands];
        await progress.race(this._pageProxySession.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            modifiers: toModifiersMask(modifiers),
            windowsVirtualKeyCode: keyCode,
            code,
            key,
            text,
            unmodifiedText: text,
            autoRepeat,
            macCommands: commands,
            isKeypad: description.location === input.keypadLocation
        }));
    }
    async keyup(progress, modifiers, keyName, description) {
        const { code, key } = description;
        await progress.race(this._pageProxySession.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            modifiers: toModifiersMask(modifiers),
            key,
            windowsVirtualKeyCode: description.keyCode,
            code,
            isKeypad: description.location === input.keypadLocation
        }));
    }
    async sendText(progress, text) {
        await progress.race(this._session.send('Page.insertText', { text }));
    }
}
exports.RawKeyboardImpl = RawKeyboardImpl;
class RawMouseImpl {
    _pageProxySession;
    _session;
    _page;
    constructor(session) {
        this._pageProxySession = session;
    }
    setSession(session) {
        this._session = session;
    }
    async move(progress, x, y, button, buttons, modifiers, forClick) {
        await progress.race(this._pageProxySession.send('Input.dispatchMouseEvent', {
            type: 'move',
            button,
            buttons: toButtonsMask(buttons),
            x,
            y,
            modifiers: toModifiersMask(modifiers)
        }));
    }
    async down(progress, x, y, button, buttons, modifiers, clickCount) {
        await progress.race(this._pageProxySession.send('Input.dispatchMouseEvent', {
            type: 'down',
            button,
            buttons: toButtonsMask(buttons),
            x,
            y,
            modifiers: toModifiersMask(modifiers),
            clickCount
        }));
    }
    async up(progress, x, y, button, buttons, modifiers, clickCount) {
        await progress.race(this._pageProxySession.send('Input.dispatchMouseEvent', {
            type: 'up',
            button,
            buttons: toButtonsMask(buttons),
            x,
            y,
            modifiers: toModifiersMask(modifiers),
            clickCount
        }));
    }
    async wheel(progress, x, y, buttons, modifiers, deltaX, deltaY) {
        if (this._page?.browserContext._options.isMobile)
            throw new Error('Mouse wheel is not supported in mobile WebKit');
        await this._session.send('Page.updateScrollingState');
        // Wheel events hit the compositor first, so wait one frame for it to be synced.
        await progress.race(this._page.mainFrame().evaluateExpression(`new Promise(requestAnimationFrame)`, { world: 'utility' }));
        await progress.race(this._pageProxySession.send('Input.dispatchWheelEvent', {
            x,
            y,
            deltaX,
            deltaY,
            modifiers: toModifiersMask(modifiers),
        }));
    }
    setPage(page) {
        this._page = page;
    }
}
exports.RawMouseImpl = RawMouseImpl;
class RawTouchscreenImpl {
    _pageProxySession;
    constructor(session) {
        this._pageProxySession = session;
    }
    async tap(progress, x, y, modifiers) {
        await progress.race(this._pageProxySession.send('Input.dispatchTapEvent', {
            x,
            y,
            modifiers: toModifiersMask(modifiers),
        }));
    }
}
exports.RawTouchscreenImpl = RawTouchscreenImpl;
