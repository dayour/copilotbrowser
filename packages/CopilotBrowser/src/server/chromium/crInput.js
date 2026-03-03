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
const crProtocolHelper_1 = require("./crProtocolHelper");
class RawKeyboardImpl {
    _client;
    _isMac;
    _dragManger;
    constructor(_client, _isMac, _dragManger) {
        this._client = _client;
        this._isMac = _isMac;
        this._dragManger = _dragManger;
    }
    _commandsForCode(code, modifiers) {
        if (!this._isMac)
            return [];
        const parts = [];
        for (const modifier of (['Shift', 'Control', 'Alt', 'Meta'])) {
            if (modifiers.has(modifier))
                parts.push(modifier);
        }
        parts.push(code);
        const shortcut = parts.join('+');
        let commands = macEditingCommands_1.macEditingCommands[shortcut] || [];
        if ((0, utils_1.isString)(commands))
            commands = [commands];
        // Commands that insert text are not supported
        commands = commands.filter(x => !x.startsWith('insert'));
        // remove the trailing : to match the Chromium command names.
        return commands.map(c => c.substring(0, c.length - 1));
    }
    async keydown(progress, modifiers, keyName, description, autoRepeat) {
        const { code, key, location, text } = description;
        if (code === 'Escape' && await progress.race(this._dragManger.cancelDrag()))
            return;
        const commands = this._commandsForCode(code, modifiers);
        await progress.race(this._client.send('Input.dispatchKeyEvent', {
            type: text ? 'keyDown' : 'rawKeyDown',
            modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
            windowsVirtualKeyCode: description.keyCodeWithoutLocation,
            code,
            commands,
            key,
            text,
            unmodifiedText: text,
            autoRepeat,
            location,
            isKeypad: location === input.keypadLocation
        }));
    }
    async keyup(progress, modifiers, keyName, description) {
        const { code, key, location } = description;
        await progress.race(this._client.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
            key,
            windowsVirtualKeyCode: description.keyCodeWithoutLocation,
            code,
            location
        }));
    }
    async sendText(progress, text) {
        await progress.race(this._client.send('Input.insertText', { text }));
    }
}
exports.RawKeyboardImpl = RawKeyboardImpl;
class RawMouseImpl {
    _client;
    _page;
    _dragManager;
    constructor(page, client, dragManager) {
        this._page = page;
        this._client = client;
        this._dragManager = dragManager;
    }
    async move(progress, x, y, button, buttons, modifiers, forClick) {
        const actualMove = async () => {
            await progress.race(this._client.send('Input.dispatchMouseEvent', {
                type: 'mouseMoved',
                button,
                buttons: (0, crProtocolHelper_1.toButtonsMask)(buttons),
                x,
                y,
                modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
                force: buttons.size > 0 ? 0.5 : 0,
            }));
        };
        if (forClick) {
            // Avoid extra protocol calls related to drag and drop, because click relies on
            // move-down-up protocol commands being sent synchronously.
            await actualMove();
            return;
        }
        await this._dragManager.interceptDragCausedByMove(progress, x, y, button, buttons, modifiers, actualMove);
    }
    async down(progress, x, y, button, buttons, modifiers, clickCount) {
        if (this._dragManager.isDragging())
            return;
        await progress.race(this._client.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            button,
            buttons: (0, crProtocolHelper_1.toButtonsMask)(buttons),
            x,
            y,
            modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
            clickCount,
            force: buttons.size > 0 ? 0.5 : 0,
        }));
    }
    async up(progress, x, y, button, buttons, modifiers, clickCount) {
        if (this._dragManager.isDragging()) {
            await this._dragManager.drop(progress, x, y, modifiers);
            return;
        }
        await progress.race(this._client.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            button,
            buttons: (0, crProtocolHelper_1.toButtonsMask)(buttons),
            x,
            y,
            modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
            clickCount
        }));
    }
    async wheel(progress, x, y, buttons, modifiers, deltaX, deltaY) {
        await progress.race(this._client.send('Input.dispatchMouseEvent', {
            type: 'mouseWheel',
            x,
            y,
            modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
            deltaX,
            deltaY,
        }));
    }
}
exports.RawMouseImpl = RawMouseImpl;
class RawTouchscreenImpl {
    _client;
    constructor(client) {
        this._client = client;
    }
    async tap(progress, x, y, modifiers) {
        await progress.race(Promise.all([
            this._client.send('Input.dispatchTouchEvent', {
                type: 'touchStart',
                modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
                touchPoints: [{
                        x, y
                    }]
            }),
            this._client.send('Input.dispatchTouchEvent', {
                type: 'touchEnd',
                modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
                touchPoints: []
            }),
        ]));
    }
}
exports.RawTouchscreenImpl = RawTouchscreenImpl;
