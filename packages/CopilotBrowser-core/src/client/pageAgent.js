"use strict";
/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
exports.PageAgent = void 0;
const channelOwner_1 = require("./channelOwner");
const events_1 = require("./events");
const page_1 = require("./page");
class PageAgent extends channelOwner_1.ChannelOwner {
    _page;
    _expectTimeout;
    static from(channel) {
        return channel._object;
    }
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this._page = page_1.Page.from(initializer.page);
        this._channel.on('turn', params => this.emit(events_1.Events.PageAgent.Turn, params));
    }
    async expect(expectation, options = {}) {
        const timeout = options.timeout ?? this._expectTimeout ?? 5000;
        await this._channel.expect({ expectation, ...options, timeout });
    }
    async perform(task, options = {}) {
        const timeout = this._page._timeoutSettings.timeout(options);
        const { usage } = await this._channel.perform({ task, ...options, timeout });
        return { usage };
    }
    async extract(query, schema, options = {}) {
        const timeout = this._page._timeoutSettings.timeout(options);
        const { result, usage } = await this._channel.extract({ query, schema: this._page._platform.zodToJsonSchema(schema), ...options, timeout });
        return { result, usage };
    }
    async usage() {
        const { usage } = await this._channel.usage({});
        return usage;
    }
    async dispose() {
        await this._channel.dispose();
    }
    async [Symbol.asyncDispose]() {
        await this.dispose();
    }
}
exports.PageAgent = PageAgent;
