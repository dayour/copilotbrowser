"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DragManager = void 0;
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
const crProtocolHelper_1 = require("./crProtocolHelper");
const utils_1 = require("../../utils");
class DragManager {
    _crPage;
    _dragState = null;
    _lastPosition = { x: 0, y: 0 };
    constructor(page) {
        this._crPage = page;
    }
    async cancelDrag() {
        if (!this._dragState)
            return false;
        await this._crPage._mainFrameSession._client.send('Input.dispatchDragEvent', {
            type: 'dragCancel',
            x: this._lastPosition.x,
            y: this._lastPosition.y,
            data: {
                items: [],
                dragOperationsMask: 0xFFFF,
            }
        });
        this._dragState = null;
        return true;
    }
    async interceptDragCausedByMove(progress, x, y, button, buttons, modifiers, moveCallback) {
        this._lastPosition = { x, y };
        if (this._dragState) {
            await progress.race(this._crPage._mainFrameSession._client.send('Input.dispatchDragEvent', {
                type: 'dragOver',
                x,
                y,
                data: this._dragState,
                modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
            }));
            return;
        }
        if (button !== 'left')
            return moveCallback();
        const client = this._crPage._mainFrameSession._client;
        let onDragIntercepted;
        const dragInterceptedPromise = new Promise(x => onDragIntercepted = x);
        function setupDragListeners() {
            let didStartDrag = Promise.resolve(false);
            let dragEvent = null;
            const dragListener = (event) => dragEvent = event;
            const mouseListener = () => {
                didStartDrag = new Promise(callback => {
                    window.addEventListener('dragstart', dragListener, { once: true, capture: true });
                    setTimeout(() => callback(dragEvent ? !dragEvent.defaultPrevented : false), 0);
                });
            };
            window.addEventListener('mousemove', mouseListener, { once: true, capture: true });
            window.__cleanupDrag = async () => {
                const val = await didStartDrag;
                window.removeEventListener('mousemove', mouseListener, { capture: true });
                window.removeEventListener('dragstart', dragListener, { capture: true });
                delete window.__cleanupDrag;
                return val;
            };
        }
        try {
            let expectingDrag = false;
            await progress.race(this._crPage._page.safeNonStallingEvaluateInAllFrames(`(${setupDragListeners.toString()})()`, 'utility'));
            client.on('Input.dragIntercepted', onDragIntercepted);
            await client.send('Input.setInterceptDrags', { enabled: true });
            try {
                await progress.race(moveCallback());
                expectingDrag = (await Promise.all(this._crPage._page.frames().map(async (frame) => {
                    return frame.nonStallingEvaluateInExistingContext('window.__cleanupDrag?.()', 'utility').catch(() => false);
                }))).some(x => x);
            }
            finally {
                client.off('Input.dragIntercepted', onDragIntercepted);
                await client.send('Input.setInterceptDrags', { enabled: false });
            }
            this._dragState = expectingDrag ? (await dragInterceptedPromise).data : null;
        }
        catch (error) {
            // Cleanup without blocking, it will be done before the next copilotbrowser action.
            this._crPage._page.safeNonStallingEvaluateInAllFrames('window.__cleanupDrag?.()', 'utility').catch(() => { });
            throw error;
        }
        if (this._dragState) {
            await progress.race(this._crPage._mainFrameSession._client.send('Input.dispatchDragEvent', {
                type: 'dragEnter',
                x,
                y,
                data: this._dragState,
                modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
            }));
        }
    }
    isDragging() {
        return !!this._dragState;
    }
    async drop(progress, x, y, modifiers) {
        (0, utils_1.assert)(this._dragState, 'missing drag state');
        await progress.race(this._crPage._mainFrameSession._client.send('Input.dispatchDragEvent', {
            type: 'drop',
            x,
            y,
            data: this._dragState,
            modifiers: (0, crProtocolHelper_1.toModifiersMask)(modifiers),
        }));
        this._dragState = null;
    }
}
exports.DragManager = DragManager;
