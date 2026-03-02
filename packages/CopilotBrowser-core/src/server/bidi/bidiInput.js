"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawTouchscreenImpl = exports.RawMouseImpl = exports.RawKeyboardImpl = void 0;
const input_1 = require("../input");
const bidiKeyboard_1 = require("./third_party/bidiKeyboard");
class RawKeyboardImpl {
    _session;
    constructor(session) {
        this._session = session;
    }
    setSession(session) {
        this._session = session;
    }
    async keydown(progress, modifiers, keyName, description, autoRepeat) {
        keyName = (0, input_1.resolveSmartModifierString)(keyName);
        const actions = [];
        actions.push({ type: 'keyDown', value: (0, bidiKeyboard_1.getBidiKeyValue)(keyName) });
        await this._performActions(progress, actions);
    }
    async keyup(progress, modifiers, keyName, description) {
        keyName = (0, input_1.resolveSmartModifierString)(keyName);
        const actions = [];
        actions.push({ type: 'keyUp', value: (0, bidiKeyboard_1.getBidiKeyValue)(keyName) });
        await this._performActions(progress, actions);
    }
    async sendText(progress, text) {
        const actions = [];
        for (const char of text) {
            const value = (0, bidiKeyboard_1.getBidiKeyValue)(char);
            actions.push({ type: 'keyDown', value });
            actions.push({ type: 'keyUp', value });
        }
        await this._performActions(progress, actions);
    }
    async _performActions(progress, actions) {
        await progress.race(this._session.send('input.performActions', {
            context: this._session.sessionId,
            actions: [
                {
                    type: 'key',
                    id: 'pw_keyboard',
                    actions,
                }
            ]
        }));
    }
}
exports.RawKeyboardImpl = RawKeyboardImpl;
class RawMouseImpl {
    _session;
    constructor(session) {
        this._session = session;
    }
    async move(progress, x, y, button, buttons, modifiers, forClick) {
        await this._performActions(progress, [{ type: 'pointerMove', x, y }]);
    }
    async down(progress, x, y, button, buttons, modifiers, clickCount) {
        await this._performActions(progress, [{ type: 'pointerDown', button: toBidiButton(button) }]);
    }
    async up(progress, x, y, button, buttons, modifiers, clickCount) {
        await this._performActions(progress, [{ type: 'pointerUp', button: toBidiButton(button) }]);
    }
    async wheel(progress, x, y, buttons, modifiers, deltaX, deltaY) {
        // Bidi throws when x/y are not integers.
        x = Math.floor(x);
        y = Math.floor(y);
        await progress.race(this._session.send('input.performActions', {
            context: this._session.sessionId,
            actions: [
                {
                    type: 'wheel',
                    id: 'pw_mouse_wheel',
                    actions: [{ type: 'scroll', x, y, deltaX, deltaY }],
                }
            ]
        }));
    }
    async _performActions(progress, actions) {
        await progress.race(this._session.send('input.performActions', {
            context: this._session.sessionId,
            actions: [
                {
                    type: 'pointer',
                    id: 'pw_mouse',
                    parameters: {
                        pointerType: "mouse" /* bidi.Input.PointerType.Mouse */,
                    },
                    actions,
                }
            ]
        }));
    }
}
exports.RawMouseImpl = RawMouseImpl;
class RawTouchscreenImpl {
    _session;
    constructor(session) {
        this._session = session;
    }
    async tap(progress, x, y, modifiers) {
    }
}
exports.RawTouchscreenImpl = RawTouchscreenImpl;
function toBidiButton(button) {
    switch (button) {
        case 'left': return 0;
        case 'right': return 2;
        case 'middle': return 1;
    }
    throw new Error('Unknown button: ' + button);
}
