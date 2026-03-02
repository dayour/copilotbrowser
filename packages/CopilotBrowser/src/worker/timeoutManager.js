"use strict";
/**
 * Copyright Microsoft Corporation. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutManagerError = exports.TimeoutManager = exports.kMaxDeadline = void 0;
const utils_1 = require("copilotbrowser-core/lib/utils");
const utils_2 = require("copilotbrowser-core/lib/utils");
const util_1 = require("../util");
exports.kMaxDeadline = 2147483647; // 2^31-1
class TimeoutManager {
    _defaultSlot;
    _running;
    _ignoreTimeouts = false;
    constructor(timeout) {
        this._defaultSlot = { timeout, elapsed: 0 };
    }
    setIgnoreTimeouts() {
        this._ignoreTimeouts = true;
        if (this._running)
            this._updateTimeout(this._running);
    }
    interrupt() {
        if (this._running)
            this._running.timeoutPromise.reject(this._createTimeoutError(this._running));
    }
    isTimeExhaustedFor(runnable) {
        const slot = runnable.fixture?.slot || runnable.slot || this._defaultSlot;
        // Note: the "-1" here matches the +1 in _updateTimeout.
        return slot.timeout > 0 && (slot.elapsed >= slot.timeout - 1);
    }
    async withRunnable(runnable, cb) {
        if (this._running)
            throw new Error(`Internal error: duplicate runnable`);
        const running = this._running = {
            runnable,
            slot: runnable.fixture?.slot || runnable.slot || this._defaultSlot,
            start: (0, utils_1.monotonicTime)(),
            deadline: exports.kMaxDeadline,
            timer: undefined,
            timeoutPromise: new utils_1.ManualPromise(),
        };
        let debugTitle = '';
        try {
            if (util_1.debugTest.enabled) {
                debugTitle = runnable.fixture ? `${runnable.fixture.phase} "${runnable.fixture.title}"` : runnable.type;
                const location = runnable.location ? ` at "${(0, util_1.formatLocation)(runnable.location)}"` : ``;
                (0, util_1.debugTest)(`started ${debugTitle}${location}`);
            }
            this._updateTimeout(running);
            return await Promise.race([
                cb(),
                running.timeoutPromise,
            ]);
        }
        finally {
            if (running.timer)
                clearTimeout(running.timer);
            running.timer = undefined;
            running.slot.elapsed += (0, utils_1.monotonicTime)() - running.start;
            this._running = undefined;
            if (util_1.debugTest.enabled)
                (0, util_1.debugTest)(`finished ${debugTitle}`);
        }
    }
    _updateTimeout(running) {
        if (running.timer)
            clearTimeout(running.timer);
        running.timer = undefined;
        if (this._ignoreTimeouts || !running.slot.timeout) {
            running.deadline = exports.kMaxDeadline;
            return;
        }
        running.deadline = running.start + (running.slot.timeout - running.slot.elapsed);
        // Compensate for Node.js troubles with timeouts that can fire too early.
        // We add an extra millisecond which seems to be enough.
        // See https://github.com/nodejs/node/issues/26578.
        const timeout = running.deadline - (0, utils_1.monotonicTime)() + 1;
        if (timeout <= 0)
            running.timeoutPromise.reject(this._createTimeoutError(running));
        else
            running.timer = setTimeout(() => running.timeoutPromise.reject(this._createTimeoutError(running)), timeout);
    }
    defaultSlot() {
        return this._defaultSlot;
    }
    slow() {
        const slot = this._running ? this._running.slot : this._defaultSlot;
        slot.timeout = slot.timeout * 3;
        if (this._running)
            this._updateTimeout(this._running);
    }
    setTimeout(timeout) {
        const slot = this._running ? this._running.slot : this._defaultSlot;
        slot.timeout = timeout;
        if (this._running)
            this._updateTimeout(this._running);
    }
    currentSlotDeadline() {
        return this._running ? this._running.deadline : exports.kMaxDeadline;
    }
    currentSlotType() {
        return this._running ? this._running.runnable.type : 'test';
    }
    _createTimeoutError(running) {
        let message = '';
        const timeout = running.slot.timeout;
        const runnable = running.runnable;
        switch (runnable.type) {
            case 'test': {
                if (runnable.fixture) {
                    if (runnable.fixture.phase === 'setup')
                        message = `Test timeout of ${timeout}ms exceeded while setting up "${runnable.fixture.title}".`;
                    else
                        message = `Tearing down "${runnable.fixture.title}" exceeded the test timeout of ${timeout}ms.`;
                }
                else {
                    message = `Test timeout of ${timeout}ms exceeded.`;
                }
                break;
            }
            case 'afterEach':
            case 'beforeEach':
                message = `Test timeout of ${timeout}ms exceeded while running "${runnable.type}" hook.`;
                break;
            case 'beforeAll':
            case 'afterAll':
                message = `"${runnable.type}" hook timeout of ${timeout}ms exceeded.`;
                break;
            case 'teardown': {
                if (runnable.fixture)
                    message = `Worker teardown timeout of ${timeout}ms exceeded while ${runnable.fixture.phase === 'setup' ? 'setting up' : 'tearing down'} "${runnable.fixture.title}".`;
                else
                    message = `Worker teardown timeout of ${timeout}ms exceeded.`;
                break;
            }
            case 'skip':
            case 'slow':
            case 'fixme':
            case 'fail':
                message = `"${runnable.type}" modifier timeout of ${timeout}ms exceeded.`;
                break;
        }
        const fixtureWithSlot = runnable.fixture?.slot ? runnable.fixture : undefined;
        if (fixtureWithSlot)
            message = `Fixture "${fixtureWithSlot.title}" timeout of ${timeout}ms exceeded during ${fixtureWithSlot.phase}.`;
        message = utils_2.colors.red(message);
        const location = (fixtureWithSlot || runnable).location;
        const error = new TimeoutManagerError(message);
        error.name = '';
        // Include location for hooks, modifiers and fixtures to distinguish between them.
        error.stack = message + (location ? `\n    at ${location.file}:${location.line}:${location.column}` : '');
        return error;
    }
}
exports.TimeoutManager = TimeoutManager;
class TimeoutManagerError extends Error {
}
exports.TimeoutManagerError = TimeoutManagerError;
