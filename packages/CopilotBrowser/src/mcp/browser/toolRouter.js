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
exports.ToolRouter = exports.passthroughStrategy = void 0;
// ---------------------------------------------------------------------------
// Built-in strategies
// ---------------------------------------------------------------------------
/**
 * Built-in no-op strategy.  Prepended to every router's strategy list so the
 * composition logic is always exercised — including in tests where no custom
 * strategies are registered.
 *
 * It implements neither hook, so it produces no change to the tool list and
 * no dispatch decision.
 */
exports.passthroughStrategy = {
    name: 'passthrough',
};
// ---------------------------------------------------------------------------
// ToolRouter
// ---------------------------------------------------------------------------
/**
 * The central tool routing engine.
 *
 * Accepts a static tool list and an ordered array of custom strategies.
 * The built-in `passthroughStrategy` is always prepended so the chain is
 * never empty.
 *
 * Usage
 * -----
 * ```ts
 * const router = new ToolRouter(tools);                           // default behaviour
 * const router = new ToolRouter(tools, [myDenyReadOnlyStrategy]); // with custom policy
 *
 * const visible = router.listTools({ config });
 * const result  = router.resolveTool('browser_click', { toolName: 'browser_click', config });
 * if (result.found)
 *   await result.tool.handle(context, parsedArgs, response);
 * ```
 */
class ToolRouter {
    _tools;
    _strategies;
    constructor(tools, strategies = []) {
        this._tools = tools;
        // Always prepend passthrough so the composition path is always exercised.
        this._strategies = [exports.passthroughStrategy, ...strategies];
    }
    /**
     * Returns the filtered tool list after running every strategy's
     * `filterTools` hook in registration order.
     *
     * Each strategy sees the output of the previous one, allowing progressive
     * narrowing.  If no strategy returns a non-undefined value, the original
     * full tool list is returned — preserving backward compatibility.
     */
    listTools(context) {
        let tools = this._tools;
        for (const strategy of this._strategies) {
            const filtered = strategy.filterTools?.(tools, context);
            if (filtered !== undefined)
                tools = filtered;
        }
        return tools;
    }
    /**
     * Walks the strategy chain and returns the first non-undefined
     * `DispatchDecision`.  Falls back to `{ kind: 'allow' }` if every
     * strategy abstains, ensuring callers always receive a concrete decision.
     */
    resolveDispatch(context) {
        for (const strategy of this._strategies) {
            const decision = strategy.beforeDispatch?.(context);
            if (decision !== undefined)
                return decision;
        }
        return { kind: 'allow' };
    }
    /**
     * Combined helper that resolves the dispatch decision and looks up the
     * corresponding `Tool` object in a single call.
     *
     * - `deny` decisions return `{ found: false }` immediately.
     * - `redirect` decisions resolve the **target** tool name instead of the
     *   original name, enabling transparent aliasing without client changes.
     * - An unknown tool name (after redirect resolution) returns
     *   `{ found: false, decision: { kind: 'allow' } }` so the caller can
     *   emit the standard "tool not found" error — matching pre-router
     *   behaviour exactly.
     */
    resolveTool(name, context) {
        const decision = this.resolveDispatch(context);
        if (decision.kind === 'deny')
            return { found: false, decision };
        const effectiveName = decision.kind === 'redirect' ? decision.targetToolName : name;
        const tool = this._tools.find(t => t.schema.name === effectiveName);
        if (!tool) {
            // Unknown name — not-found with synthetic allow preserves existing error path.
            return { found: false, decision: { kind: 'allow' } };
        }
        return { found: true, tool, decision };
    }
    /** Read-only view of the full strategy chain (including passthrough). */
    get strategies() {
        return this._strategies;
    }
}
exports.ToolRouter = ToolRouter;
