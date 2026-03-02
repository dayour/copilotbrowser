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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const channelOwner_1 = require("./channelOwner");
const errors_1 = require("./errors");
const events_1 = require("./events");
const jsHandle_1 = require("./jsHandle");
const manualPromise_1 = require("../utils/isomorphic/manualPromise");
const timeoutSettings_1 = require("./timeoutSettings");
const waiter_1 = require("./waiter");
class Worker extends channelOwner_1.ChannelOwner {
    _page; // Set for web workers.
    _context; // Set for service workers.
    _closedScope = new manualPromise_1.LongStandingScope();
    static fromNullable(worker) {
        return worker ? Worker.from(worker) : null;
    }
    static from(worker) {
        return worker._object;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._setEventToSubscriptionMapping(new Map([
            [events_1.Events.Worker.Console, 'console'],
        ]));
        this._channel.on('close', () => {
            if (this._page)
                this._page._workers.delete(this);
            if (this._context)
                this._context._serviceWorkers.delete(this);
            this.emit(events_1.Events.Worker.Close, this);
        });
        this.once(events_1.Events.Worker.Close, () => this._closedScope.close(this._page?._closeErrorWithReason() || new errors_1.TargetClosedError()));
    }
    url() {
        return this._initializer.url;
    }
    async evaluate(pageFunction, arg) {
        (0, jsHandle_1.assertMaxArguments)(arguments.length, 2);
        const result = await this._channel.evaluateExpression({ expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return (0, jsHandle_1.parseResult)(result.value);
    }
    async evaluateHandle(pageFunction, arg) {
        (0, jsHandle_1.assertMaxArguments)(arguments.length, 2);
        const result = await this._channel.evaluateExpressionHandle({ expression: String(pageFunction), isFunction: typeof pageFunction === 'function', arg: (0, jsHandle_1.serializeArgument)(arg) });
        return jsHandle_1.JSHandle.from(result.handle);
    }
    async waitForEvent(event, optionsOrPredicate = {}) {
        return await this._wrapApiCall(async () => {
            const timeoutSettings = this._page?._timeoutSettings ?? this._context?._timeoutSettings ?? new timeoutSettings_1.TimeoutSettings(this._platform);
            const timeout = timeoutSettings.timeout(typeof optionsOrPredicate === 'function' ? {} : optionsOrPredicate);
            const predicate = typeof optionsOrPredicate === 'function' ? optionsOrPredicate : optionsOrPredicate.predicate;
            const waiter = waiter_1.Waiter.createForEvent(this, event);
            waiter.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded while waiting for event "${event}"`);
            if (event !== events_1.Events.Worker.Close)
                waiter.rejectOnEvent(this, events_1.Events.Worker.Close, () => new errors_1.TargetClosedError());
            const result = await waiter.waitForEvent(this, event, predicate);
            waiter.dispose();
            return result;
        });
    }
}
exports.Worker = Worker;
