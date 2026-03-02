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
/**
 * Policy-based tool routing engine.
 *
 * Provides a pluggable strategy chain for both tool listing (filterTools) and
 * tool dispatch (beforeDispatch). The engine is provider-aware: strategies
 * receive an optional LLMProviderConfig so routing decisions can vary by
 * model, API endpoint, or other provider attributes.
 *
 * Backward compatibility: when constructed with an empty strategy list the
 * router delegates directly to the supplied tool array and approves every
 * dispatch — identical behaviour to the pre-router code path.
 */
import type { Tool } from './tools/tool';
import type { FullConfig } from './config';
import type { LLMProviderConfig } from '../../../types/test';
/**
 * Context supplied to strategies during tool listing.
 * Carries the resolved server config and an optional LLM provider config.
 */
export interface ToolListingContext {
    config: FullConfig;
    /**
     * Resolved LLM provider, if one is configured on the current session.
     * Strategies may use this to hide or expose tools based on provider
     * capabilities (e.g. vision-capable models vs. text-only models).
     */
    providerConfig?: LLMProviderConfig;
}
/**
 * Context supplied to strategies during a tool call dispatch.
 * Identifies which tool is being called and carries provider-aware metadata.
 */
export interface ToolDispatchContext {
    /** The tool name as received from the MCP client. */
    toolName: string;
    config: FullConfig;
    /**
     * Resolved LLM provider, if one is configured on the current session.
     * Strategies may use this to rate-limit, block, or redirect calls based
     * on provider identity.
     */
    providerConfig?: LLMProviderConfig;
}
/** Allow the tool call to proceed as-is. */
export interface AllowDecision {
    kind: 'allow';
}
/**
 * Block the tool call.  The router surfaces the reason as a tool error,
 * matching the standard MCP error response shape used elsewhere in the
 * backend.
 */
export interface DenyDecision {
    kind: 'deny';
    reason: string;
}
/**
 * Transparently reroute the call to a different tool name.
 * The target must exist in the router's tool list; if it does not the
 * router falls back to a "tool not found" error.
 */
export interface RedirectDecision {
    kind: 'redirect';
    targetToolName: string;
}
export type DispatchDecision = AllowDecision | DenyDecision | RedirectDecision;
/**
 * A single pluggable routing strategy.
 *
 * Both hooks are optional.  A strategy may implement either, both, or neither.
 * Unimplemented hooks are treated as no-ops — the next strategy in the chain
 * is consulted without any change to the routing state.
 */
export interface ToolRoutingStrategy {
    /** Human-readable identifier surfaced in debug output and error messages. */
    readonly name: string;
    /**
     * Optionally narrow or reorder the visible tool list returned to MCP clients.
     *
     * Semantics:
     * - Returning a `Tool[]` **replaces** the current list for all subsequent
     *   strategies in the chain.
     * - Returning `undefined` signals "no change"; the list is forwarded
     *   unchanged to the next strategy.
     *
     * Strategies are applied in registration order so early strategies act as
     * broad gates and later strategies can apply finer-grained filtering.
     */
    filterTools?(tools: Tool[], context: ToolListingContext): Tool[] | undefined;
    /**
     * Optionally intercept a pending dispatch before the tool handle is invoked.
     *
     * Semantics:
     * - Returning a `DispatchDecision` **short-circuits** the strategy chain;
     *   no further strategies are consulted for this call.
     * - Returning `undefined` signals "no opinion"; the next strategy is
     *   consulted.  If all strategies abstain, the router defaults to `allow`.
     */
    beforeDispatch?(context: ToolDispatchContext): DispatchDecision | undefined;
}
/** Resolved outcome of `ToolRouter.resolveTool`. */
export type ResolveToolResult = {
    found: true;
    tool: Tool;
    decision: AllowDecision | RedirectDecision;
} | {
    found: false;
    decision: DenyDecision | AllowDecision;
};
/**
 * Built-in no-op strategy.  Prepended to every router's strategy list so the
 * composition logic is always exercised — including in tests where no custom
 * strategies are registered.
 *
 * It implements neither hook, so it produces no change to the tool list and
 * no dispatch decision.
 */
export declare const passthroughStrategy: ToolRoutingStrategy;
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
export declare class ToolRouter {
    private readonly _tools;
    private readonly _strategies;
    constructor(tools: Tool[], strategies?: ToolRoutingStrategy[]);
    /**
     * Returns the filtered tool list after running every strategy's
     * `filterTools` hook in registration order.
     *
     * Each strategy sees the output of the previous one, allowing progressive
     * narrowing.  If no strategy returns a non-undefined value, the original
     * full tool list is returned — preserving backward compatibility.
     */
    listTools(context: ToolListingContext): Tool[];
    /**
     * Walks the strategy chain and returns the first non-undefined
     * `DispatchDecision`.  Falls back to `{ kind: 'allow' }` if every
     * strategy abstains, ensuring callers always receive a concrete decision.
     */
    resolveDispatch(context: ToolDispatchContext): DispatchDecision;
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
    resolveTool(name: string, context: ToolDispatchContext): ResolveToolResult;
    /** Read-only view of the full strategy chain (including passthrough). */
    get strategies(): readonly ToolRoutingStrategy[];
}
