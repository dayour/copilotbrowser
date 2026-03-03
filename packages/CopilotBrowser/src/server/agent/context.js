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
exports.Context = void 0;
exports.redactSecrets = redactSecrets;
exports.applySecrets = applySecrets;
const browserContext_1 = require("../browserContext");
const actionRunner_1 = require("./actionRunner");
const codegen_1 = require("./codegen");
const stringUtils_1 = require("../../utils/isomorphic/stringUtils");
class Context {
    page;
    sdkLanguage;
    agentParams;
    events;
    _actions = [];
    _history = [];
    _budget;
    constructor(page, agentParams, events) {
        this.page = page;
        this.agentParams = agentParams;
        this.sdkLanguage = page.browserContext._browser.sdkLanguage();
        this.events = events;
        this._budget = { tokens: agentParams.maxTokens };
    }
    async runActionAndWait(progress, action) {
        return await this.runActionsAndWait(progress, [action]);
    }
    async runActionsAndWait(progress, action, options) {
        const error = await this.waitForCompletion(progress, async () => {
            for (const a of action) {
                await (0, actionRunner_1.runAction)(progress, 'generate', this.page, a, this.agentParams?.secrets ?? []);
                const code = await (0, codegen_1.generateCode)(this.sdkLanguage, a);
                this._actions.push({ ...a, code });
            }
            return undefined;
        }, options).catch((error) => error);
        return await this.snapshotResult(progress, error);
    }
    async runActionNoWait(progress, action) {
        return await this.runActionsAndWait(progress, [action], { noWait: true });
    }
    actions() {
        return this._actions.slice();
    }
    history() {
        return this._history;
    }
    pushHistory(item) {
        this._history.push(item);
        this._actions = [];
    }
    consumeTokens(tokens) {
        if (this._budget.tokens === undefined)
            return;
        this._budget.tokens = Math.max(0, this._budget.tokens - tokens);
    }
    maxTokensRemaining() {
        return this._budget.tokens;
    }
    async waitForCompletion(progress, callback, options) {
        if (options?.noWait)
            return await callback();
        const requests = [];
        const requestListener = (request) => requests.push(request);
        const disposeListeners = () => {
            this.page.browserContext.off(browserContext_1.BrowserContext.Events.Request, requestListener);
        };
        this.page.browserContext.on(browserContext_1.BrowserContext.Events.Request, requestListener);
        let result;
        try {
            result = await callback();
            await progress.wait(500);
        }
        finally {
            disposeListeners();
        }
        const requestedNavigation = requests.some(request => request.isNavigationRequest());
        if (requestedNavigation) {
            await this.page.mainFrame().waitForLoadState(progress, 'load');
            return result;
        }
        const promises = [];
        for (const request of requests) {
            if (['document', 'stylesheet', 'script', 'xhr', 'fetch'].includes(request.resourceType()))
                promises.push(request.response().then(r => r?.finished()));
            else
                promises.push(request.response());
        }
        if (promises.length)
            await progress.race([...promises, progress.wait(5000)]);
        else
            await progress.wait(500);
        return result;
    }
    async takeSnapshot(progress) {
        const { full } = await this.page.snapshotForAI(progress, { doNotRenderActive: this.agentParams.doNotRenderActive });
        return redactSecrets(full, this.agentParams?.secrets);
    }
    async snapshotResult(progress, error) {
        const snapshot = await this.takeSnapshot(progress);
        const text = [];
        if (error)
            text.push(`# Error\n${(0, stringUtils_1.stripAnsiEscapes)(error.message)}`);
        else
            text.push(`# Success`);
        text.push(`# Page snapshot\n${snapshot}`);
        return {
            isError: !!error,
            content: [{ type: 'text', text: text.join('\n\n') }],
        };
    }
    async refSelectors(progress, params) {
        return Promise.all(params.map(async (param) => {
            try {
                const { resolvedSelector } = await this.page.mainFrame().resolveSelector(progress, `aria-ref=${param.ref}`);
                return resolvedSelector;
            }
            catch (e) {
                throw new Error(`Ref ${param.ref} not found in the current page snapshot. Try capturing new snapshot.`);
            }
        }));
    }
}
exports.Context = Context;
function redactSecrets(text, secrets) {
    if (!secrets)
        return text;
    for (const { name, value } of secrets)
        text = text.replaceAll(value, `<secret>${name}</secret>`);
    return text;
}
function applySecrets(text, secrets) {
    if (!secrets)
        return text;
    const secret = secrets.find(s => s.name === text);
    if (secret)
        return secret.value;
    for (const { name, value } of secrets)
        text = text.replaceAll(`<secret>${name}</secret>`, value);
    return text;
}
