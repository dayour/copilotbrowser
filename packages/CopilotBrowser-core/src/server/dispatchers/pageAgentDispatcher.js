"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
exports.PageAgentDispatcher = void 0;
const dispatcher_1 = require("./dispatcher");
const pageAgent_1 = require("../agent/pageAgent");
const instrumentation_1 = require("../instrumentation");
const context_1 = require("../agent/context");
class PageAgentDispatcher extends dispatcher_1.Dispatcher {
    _type_PageAgent = true;
    _type_EventTarget = true;
    _page;
    _usage = { turns: 0, inputTokens: 0, outputTokens: 0 };
    _context;
    constructor(scope, options) {
        super(scope, new instrumentation_1.SdkObject(scope._object, 'pageAgent'), 'PageAgent', { page: scope });
        this._page = scope._object;
        this._context = new context_1.Context(this._page, options, this._eventSupport());
    }
    async perform(params, progress) {
        try {
            await (0, pageAgent_1.pageAgentPerform)(progress, this._context, params.task, params);
        }
        finally {
            this._context.pushHistory({ type: 'perform', description: params.task });
        }
        return { usage: this._usage };
    }
    async expect(params, progress) {
        try {
            await (0, pageAgent_1.pageAgentExpect)(progress, this._context, params.expectation, params);
        }
        finally {
            this._context.pushHistory({ type: 'expect', description: params.expectation });
        }
        return { usage: this._usage };
    }
    async extract(params, progress) {
        const result = await (0, pageAgent_1.pageAgentExtract)(progress, this._context, params.query, params.schema, params);
        return { result, usage: this._usage };
    }
    async usage(params, progress) {
        return { usage: this._usage };
    }
    async dispose(params, progress) {
        progress.metadata.potentiallyClosesScope = true;
        void this.stopPendingOperations(new Error('The agent is disposed'));
        this._dispose();
    }
    _eventSupport() {
        const self = this;
        return {
            onBeforeTurn(params) {
                if (self._disposed)
                    return;
                const userMessage = params.conversation.messages.find(m => m.role === 'user');
                self._dispatchEvent('turn', { role: 'user', message: userMessage?.content ?? '' });
            },
            onAfterTurn(params) {
                if (self._disposed)
                    return;
                const usage = { inputTokens: params.totalUsage.input, outputTokens: params.totalUsage.output };
                const intent = params.assistantMessage.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
                self._dispatchEvent('turn', { role: 'assistant', message: intent, usage });
                if (!params.assistantMessage.content.filter(c => c.type === 'tool_call').length)
                    self._dispatchEvent('turn', { role: 'assistant', message: `no tool calls`, usage });
                self._usage = { turns: self._usage.turns + 1, inputTokens: self._usage.inputTokens + usage.inputTokens, outputTokens: self._usage.outputTokens + usage.outputTokens };
            },
            onBeforeToolCall(params) {
                if (self._disposed)
                    return;
                self._dispatchEvent('turn', { role: 'assistant', message: `call tool "${params.toolCall.name}"` });
            },
            onAfterToolCall(params) {
                if (self._disposed)
                    return;
                const suffix = params.toolCall.result?.isError ? 'failed' : 'succeeded';
                self._dispatchEvent('turn', { role: 'user', message: `tool "${params.toolCall.name}" ${suffix}` });
            },
            onToolCallError(params) {
                if (self._disposed)
                    return;
                self._dispatchEvent('turn', { role: 'user', message: `tool "${params.toolCall.name}" failed: ${params.error.message}` });
            }
        };
    }
}
exports.PageAgentDispatcher = PageAgentDispatcher;
