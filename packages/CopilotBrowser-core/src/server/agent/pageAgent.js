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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageAgentPerform = pageAgentPerform;
exports.pageAgentExpect = pageAgentExpect;
exports.pageAgentExtract = pageAgentExtract;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tool_1 = require("./tool");
const utilsBundle_1 = require("../../utilsBundle");
const mcpBundle_1 = require("../../mcpBundle");
const actionRunner_1 = require("./actionRunner");
const performTools_1 = __importDefault(require("./performTools"));
const expectTools_1 = __importDefault(require("./expectTools"));
const actions = __importStar(require("./actions"));
async function pageAgentPerform(progress, context, userTask, callParams) {
    const cacheKey = (callParams.cacheKey ?? userTask).trim();
    if (await cachedPerform(progress, context, cacheKey))
        return;
    const task = `
### Instructions
- Perform the following task on the page.
- Your reply should be a tool call that performs action the page.
- If you see text surrounded by <secret></secret>, it is a secret and you should preserve it as such. It will be replaced with the actual value before the tool call.

### Task
${userTask}
`;
    progress.disableTimeout();
    await runLoop(progress, context, performTools_1.default, task, undefined, callParams);
    await updateCache(context, cacheKey);
}
async function pageAgentExpect(progress, context, expectation, callParams) {
    const cacheKey = (callParams.cacheKey ?? expectation).trim();
    if (await cachedPerform(progress, context, cacheKey))
        return;
    const task = `
### Instructions
- Call one of the "browser_expect_*" tools to verify / assert the condition.
- If you see text surrounded by <secret></secret>, it is a secret and you should preserve it as such. It will be replaced with the actual value before the tool call.

### Expectation
${expectation}
`;
    progress.disableTimeout();
    await runLoop(progress, context, expectTools_1.default, task, undefined, callParams);
    await updateCache(context, cacheKey);
}
async function pageAgentExtract(progress, context, query, schema, callParams) {
    const task = `
### Instructions
Extract the following information from the page. Do not perform any actions, just extract the information.
If you see text surrounded by <secret></secret>, it is a secret and you should preserve it as such. It will be replaced with the actual value before the tool call.

### Query
${query}`;
    const { result } = await runLoop(progress, context, [], task, schema, callParams);
    return result;
}
async function runLoop(progress, context, toolDefinitions, userTask, resultSchema, params) {
    if (!context.agentParams.api || !context.agentParams.model)
        throw new Error(`This action requires the API and API key to be set on the page agent. Did you mean to --run-agents=missing?`);
    if (!context.agentParams.apiKey)
        throw new Error(`This action requires API key to be set on the page agent.`);
    if (context.agentParams.apiEndpoint && !URL.canParse(context.agentParams.apiEndpoint))
        throw new Error(`Agent API endpoint "${context.agentParams.apiEndpoint}" is not a valid URL.`);
    const snapshot = await context.takeSnapshot(progress);
    const { tools, callTool, reportedResult, refusedToPerformReason } = (0, tool_1.toolsForLoop)(progress, context, toolDefinitions, { resultSchema, refuseToPerform: 'allow' });
    const apiCacheTextBefore = context.agentParams.apiCacheFile ?
        await fs_1.default.promises.readFile(context.agentParams.apiCacheFile, 'utf-8').catch(() => '{}') : '{}';
    const apiCacheBefore = JSON.parse(apiCacheTextBefore || '{}');
    const loop = new mcpBundle_1.Loop({
        api: context.agentParams.api,
        apiEndpoint: context.agentParams.apiEndpoint,
        apiKey: context.agentParams.apiKey,
        apiTimeout: context.agentParams.apiTimeout ?? 0,
        model: context.agentParams.model,
        maxTokens: params.maxTokens ?? context.maxTokensRemaining(),
        maxToolCalls: params.maxActions ?? context.agentParams.maxActions ?? 10,
        maxToolCallRetries: params.maxActionRetries ?? context.agentParams.maxActionRetries ?? 3,
        summarize: true,
        debug: utilsBundle_1.debug,
        callTool,
        tools,
        cache: apiCacheBefore,
        ...context.events,
    });
    const task = [];
    if (context.agentParams.systemPrompt) {
        task.push('### System');
        task.push(context.agentParams.systemPrompt);
        task.push('');
    }
    task.push('### Task');
    task.push(userTask);
    if (context.history().length) {
        task.push('### Context history');
        task.push(context.history().map(h => `- ${h.type}: ${h.description}`).join('\n'));
        task.push('');
    }
    task.push('### Page snapshot');
    task.push(snapshot);
    task.push('');
    const { error, usage } = await loop.run(task.join('\n'), { signal: progress.signal });
    context.consumeTokens(usage.input + usage.output);
    if (context.agentParams.apiCacheFile) {
        const apiCacheAfter = { ...apiCacheBefore, ...loop.cache() };
        const sortedCache = Object.fromEntries(Object.entries(apiCacheAfter).sort(([a], [b]) => a.localeCompare(b)));
        const apiCacheTextAfter = JSON.stringify(sortedCache, undefined, 2);
        if (apiCacheTextAfter !== apiCacheTextBefore) {
            await fs_1.default.promises.mkdir(path_1.default.dirname(context.agentParams.apiCacheFile), { recursive: true });
            await fs_1.default.promises.writeFile(context.agentParams.apiCacheFile, apiCacheTextAfter);
        }
    }
    if (refusedToPerformReason())
        throw new Error(`Agent refused to perform action: ${refusedToPerformReason()}`);
    if (error)
        throw new Error(`Agentic loop failed: ${error}`);
    return { result: reportedResult ? reportedResult() : undefined };
}
async function cachedPerform(progress, context, cacheKey) {
    if (!context.agentParams?.cacheFile)
        return;
    const cache = await cachedActions(context.agentParams?.cacheFile);
    const entry = cache.actions[cacheKey];
    if (!entry)
        return;
    for (const action of entry.actions)
        await (0, actionRunner_1.runAction)(progress, 'run', context.page, action, context.agentParams.secrets ?? []);
    return entry.actions;
}
async function updateCache(context, cacheKey) {
    const cacheFile = context.agentParams?.cacheFile;
    const cacheOutFile = context.agentParams?.cacheOutFile;
    const cacheFileKey = cacheFile ?? cacheOutFile;
    const cache = cacheFileKey ? await cachedActions(cacheFileKey) : { actions: {}, newActions: {} };
    const newEntry = { actions: context.actions() };
    cache.actions[cacheKey] = newEntry;
    cache.newActions[cacheKey] = newEntry;
    if (cacheOutFile) {
        const entries = Object.entries(cache.newActions);
        entries.sort((e1, e2) => e1[0].localeCompare(e2[0]));
        await fs_1.default.promises.writeFile(cacheOutFile, JSON.stringify(Object.fromEntries(entries), undefined, 2));
    }
    else if (cacheFile) {
        const entries = Object.entries(cache.actions);
        entries.sort((e1, e2) => e1[0].localeCompare(e2[0]));
        await fs_1.default.promises.writeFile(cacheFile, JSON.stringify(Object.fromEntries(entries), undefined, 2));
    }
}
const allCaches = new Map();
async function cachedActions(cacheFile) {
    let cache = allCaches.get(cacheFile);
    if (!cache) {
        const content = await fs_1.default.promises.readFile(cacheFile, 'utf-8').catch(() => '');
        let json;
        try {
            json = JSON.parse(content.trim() || '{}');
        }
        catch (error) {
            throw new Error(`Failed to parse cache file ${cacheFile}:\n${error.message}`);
        }
        const parsed = actions.cachedActionsSchema.safeParse(json);
        if (parsed.error)
            throw new Error(`Failed to parse cache file ${cacheFile}:\n${mcpBundle_1.z.prettifyError(parsed.error)}`);
        cache = { actions: parsed.data, newActions: {} };
        allCaches.set(cacheFile, cache);
    }
    return cache;
}
