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
 * Focused unit tests for the ToolRouter routing engine.
 *
 * These tests exercise the pure routing logic — strategy chaining, dispatch
 * decisions, and tool resolution — without starting a browser or MCP server.
 * All Tool objects are minimal stubs that satisfy the interface shape.
 */

import { test, expect } from '@copilotbrowser/test';

// Import from compiled output (consistent with other tests in this directory).
import { ToolRouter, passthroughStrategy } from '../../packages/CopilotBrowser/lib/mcp/browser/toolRouter';

import type { ToolRoutingStrategy, ToolListingContext, ToolDispatchContext } from '../../packages/CopilotBrowser/lib/mcp/browser/toolRouter';
import type { Tool } from '../../packages/CopilotBrowser/lib/mcp/browser/tools/tool';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Tool stub.  Only the fields referenced by ToolRouter are
 * populated; all other fields use placeholder values so the stub compiles
 * without a real zod schema or handler.
 */
function makeTool(name: string, capability = 'core'): Tool {
  return {
    capability: capability as any,
    schema: {
      name,
      title: name,
      description: name,
      inputSchema: { parse: (x: any) => x } as any,
      type: 'readOnly',
    },
    handle: async () => {},
  };
}

/** Minimal config stub — only the ToolRouter reads it opaquely via strategies. */
const stubConfig: any = {};

/** Minimal listing context. */
function listCtx(extra?: Partial<ToolListingContext>): ToolListingContext {
  return { config: stubConfig, ...extra };
}

/** Minimal dispatch context for a given tool name. */
function dispatchCtx(toolName: string, extra?: Partial<ToolDispatchContext>): ToolDispatchContext {
  return { toolName, config: stubConfig, ...extra };
}

// ---------------------------------------------------------------------------
// Tests: passthroughStrategy
// ---------------------------------------------------------------------------

test('passthroughStrategy has a name', () => {
  expect(passthroughStrategy.name).toBe('passthrough');
});

test('passthroughStrategy has no filterTools or beforeDispatch hooks', () => {
  expect(passthroughStrategy.filterTools).toBeUndefined();
  expect(passthroughStrategy.beforeDispatch).toBeUndefined();
});

// ---------------------------------------------------------------------------
// Tests: ToolRouter construction
// ---------------------------------------------------------------------------

test('router always includes passthrough as first strategy', () => {
  const router = new ToolRouter([]);
  expect(router.strategies[0]).toBe(passthroughStrategy);
  expect(router.strategies.length).toBe(1);
});

test('router prepends passthrough before custom strategies', () => {
  const custom: ToolRoutingStrategy = { name: 'custom' };
  const router = new ToolRouter([], [custom]);
  expect(router.strategies[0]).toBe(passthroughStrategy);
  expect(router.strategies[1]).toBe(custom);
  expect(router.strategies.length).toBe(2);
});

// ---------------------------------------------------------------------------
// Tests: listTools — backward compatibility
// ---------------------------------------------------------------------------

test('listTools returns all tools when no strategy filters', () => {
  const tools = [makeTool('a'), makeTool('b'), makeTool('c')];
  const router = new ToolRouter(tools);
  expect(router.listTools(listCtx())).toEqual(tools);
});

test('listTools returns empty list for empty tool set', () => {
  const router = new ToolRouter([]);
  expect(router.listTools(listCtx())).toEqual([]);
});

// ---------------------------------------------------------------------------
// Tests: listTools — strategy filtering
// ---------------------------------------------------------------------------

test('filterTools strategy can narrow the tool list', () => {
  const tools = [makeTool('browser_click'), makeTool('browser_snapshot'), makeTool('browser_pdf_save')];
  const noPdf: ToolRoutingStrategy = {
    name: 'no-pdf',
    filterTools: ts => ts.filter(t => !t.schema.name.startsWith('browser_pdf')),
  };
  const router = new ToolRouter(tools, [noPdf]);
  const visible = router.listTools(listCtx());
  expect(visible.map(t => t.schema.name)).toEqual(['browser_click', 'browser_snapshot']);
});

test('filterTools strategy returning undefined leaves list unchanged', () => {
  const tools = [makeTool('browser_click'), makeTool('browser_snapshot')];
  const noop: ToolRoutingStrategy = {
    name: 'noop',
    filterTools: () => undefined,
  };
  const router = new ToolRouter(tools, [noop]);
  expect(router.listTools(listCtx())).toEqual(tools);
});

test('filterTools strategies are applied in registration order', () => {
  const tools = [makeTool('a'), makeTool('b'), makeTool('c'), makeTool('d')];

  // First strategy keeps a, b, c. Second strategy further removes c.
  const first: ToolRoutingStrategy = {
    name: 'first',
    filterTools: ts => ts.filter(t => t.schema.name !== 'd'),
  };
  const second: ToolRoutingStrategy = {
    name: 'second',
    filterTools: ts => ts.filter(t => t.schema.name !== 'c'),
  };
  const router = new ToolRouter(tools, [first, second]);
  expect(router.listTools(listCtx()).map(t => t.schema.name)).toEqual(['a', 'b']);
});

test('filterTools strategy receives provider config in listing context', () => {
  const capturedContexts: ToolListingContext[] = [];
  const capturing: ToolRoutingStrategy = {
    name: 'capturing',
    filterTools: (ts, ctx) => {
      capturedContexts.push(ctx);
      return undefined;
    },
  };
  const router = new ToolRouter([makeTool('x')], [capturing]);
  const providerConfig: any = { api: 'openai', apiKey: 'k', model: 'm' };
  router.listTools(listCtx({ providerConfig }));
  expect(capturedContexts[0].providerConfig).toBe(providerConfig);
});

// ---------------------------------------------------------------------------
// Tests: resolveDispatch — default behaviour
// ---------------------------------------------------------------------------

test('resolveDispatch returns allow when no strategy produces a decision', () => {
  const router = new ToolRouter([]);
  expect(router.resolveDispatch(dispatchCtx('browser_click'))).toEqual({ kind: 'allow' });
});

// ---------------------------------------------------------------------------
// Tests: resolveDispatch — deny
// ---------------------------------------------------------------------------

test('deny decision is returned and short-circuits remaining strategies', () => {
  const secondCalled: boolean[] = [];

  const denyAll: ToolRoutingStrategy = {
    name: 'deny-all',
    beforeDispatch: () => ({ kind: 'deny', reason: 'not allowed' }),
  };
  const shouldNotRun: ToolRoutingStrategy = {
    name: 'should-not-run',
    beforeDispatch: () => {
      secondCalled.push(true);
      return { kind: 'allow' };
    },
  };

  const router = new ToolRouter([], [denyAll, shouldNotRun]);
  const decision = router.resolveDispatch(dispatchCtx('browser_click'));
  expect(decision).toEqual({ kind: 'deny', reason: 'not allowed' });
  expect(secondCalled).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Tests: resolveDispatch — redirect
// ---------------------------------------------------------------------------

test('redirect decision is returned with target tool name', () => {
  const redirector: ToolRoutingStrategy = {
    name: 'redirector',
    beforeDispatch: ctx => ctx.toolName === 'browser_legacy'
      ? { kind: 'redirect', targetToolName: 'browser_snapshot' }
      : undefined,
  };
  const router = new ToolRouter([], [redirector]);
  const decision = router.resolveDispatch(dispatchCtx('browser_legacy'));
  expect(decision).toEqual({ kind: 'redirect', targetToolName: 'browser_snapshot' });
});

test('redirect does not affect unmatched tool names', () => {
  const redirector: ToolRoutingStrategy = {
    name: 'redirector',
    beforeDispatch: ctx => ctx.toolName === 'browser_legacy'
      ? { kind: 'redirect', targetToolName: 'browser_snapshot' }
      : undefined,
  };
  const router = new ToolRouter([], [redirector]);
  expect(router.resolveDispatch(dispatchCtx('browser_click'))).toEqual({ kind: 'allow' });
});

// ---------------------------------------------------------------------------
// Tests: resolveDispatch — first-wins ordering
// ---------------------------------------------------------------------------

test('first strategy with a non-undefined decision wins', () => {
  const first: ToolRoutingStrategy = {
    name: 'first',
    beforeDispatch: () => undefined,
  };
  const second: ToolRoutingStrategy = {
    name: 'second',
    beforeDispatch: () => ({ kind: 'deny', reason: 'second wins' }),
  };
  const third: ToolRoutingStrategy = {
    name: 'third',
    beforeDispatch: () => ({ kind: 'allow' }),
  };
  const router = new ToolRouter([], [first, second, third]);
  expect(router.resolveDispatch(dispatchCtx('x'))).toEqual({ kind: 'deny', reason: 'second wins' });
});

// ---------------------------------------------------------------------------
// Tests: resolveTool
// ---------------------------------------------------------------------------

test('resolveTool resolves allow correctly', () => {
  const tool = makeTool('browser_click');
  const router = new ToolRouter([tool]);
  const result = router.resolveTool('browser_click', dispatchCtx('browser_click'));
  expect(result.found).toBe(true);
  if (result.found) {
    expect(result.tool).toBe(tool);
    expect(result.decision).toEqual({ kind: 'allow' });
  }
});

test('resolveTool returns not-found for unknown tool name', () => {
  const router = new ToolRouter([makeTool('browser_click')]);
  const result = router.resolveTool('browser_unknown', dispatchCtx('browser_unknown'));
  expect(result.found).toBe(false);
  expect(result.decision).toEqual({ kind: 'allow' });
});

test('resolveTool returns not-found with deny reason on deny decision', () => {
  const blocker: ToolRoutingStrategy = {
    name: 'blocker',
    beforeDispatch: () => ({ kind: 'deny', reason: 'blocked by policy' }),
  };
  const router = new ToolRouter([makeTool('browser_click')], [blocker]);
  const result = router.resolveTool('browser_click', dispatchCtx('browser_click'));
  expect(result.found).toBe(false);
  if (!result.found)
    expect(result.decision).toEqual({ kind: 'deny', reason: 'blocked by policy' });
});

test('resolveTool resolves redirect to target tool', () => {
  const original = makeTool('browser_legacy');
  const target = makeTool('browser_snapshot');
  const redirector: ToolRoutingStrategy = {
    name: 'redirector',
    beforeDispatch: ctx => ctx.toolName === 'browser_legacy'
      ? { kind: 'redirect', targetToolName: 'browser_snapshot' }
      : undefined,
  };
  const router = new ToolRouter([original, target], [redirector]);
  const result = router.resolveTool('browser_legacy', dispatchCtx('browser_legacy'));
  expect(result.found).toBe(true);
  if (result.found) {
    expect(result.tool).toBe(target);
    expect(result.decision).toEqual({ kind: 'redirect', targetToolName: 'browser_snapshot' });
  }
});

test('resolveTool returns not-found when redirect target does not exist', () => {
  const redirector: ToolRoutingStrategy = {
    name: 'redirector',
    beforeDispatch: () => ({ kind: 'redirect', targetToolName: 'browser_nonexistent' }),
  };
  const router = new ToolRouter([makeTool('browser_click')], [redirector]);
  const result = router.resolveTool('browser_click', dispatchCtx('browser_click'));
  expect(result.found).toBe(false);
  // Redirect target not found => synthetic allow so caller emits "tool not found" error.
  expect(result.decision).toEqual({ kind: 'allow' });
});

// ---------------------------------------------------------------------------
// Tests: provider-aware dispatch
// ---------------------------------------------------------------------------

test('dispatch context carries provider config to strategies', () => {
  const capturedContexts: ToolDispatchContext[] = [];
  const capturing: ToolRoutingStrategy = {
    name: 'capturing',
    beforeDispatch: ctx => {
      capturedContexts.push(ctx);
      return undefined;
    },
  };
  const providerConfig: any = { api: 'anthropic', apiKey: 'k', model: 'claude' };
  const router = new ToolRouter([makeTool('browser_click')], [capturing]);
  router.resolveDispatch(dispatchCtx('browser_click', { providerConfig }));
  expect(capturedContexts[0].providerConfig).toBe(providerConfig);
});

test('strategy can make deny decision based on provider config', () => {
  const visionOnly: ToolRoutingStrategy = {
    name: 'vision-only-on-openai',
    beforeDispatch: ctx =>
      ctx.toolName.startsWith('browser_mouse') && ctx.providerConfig?.api !== 'openai'
        ? { kind: 'deny', reason: 'vision tools require openai provider' }
        : undefined,
  };
  const router = new ToolRouter([makeTool('browser_mouse_move_xy', 'vision')], [visionOnly]);

  // With a non-openai provider: should deny
  const denyResult = router.resolveTool(
      'browser_mouse_move_xy',
      dispatchCtx('browser_mouse_move_xy', {
        providerConfig: { api: 'anthropic', apiKey: 'k', model: 'm' } as any,
      })
  );
  expect(denyResult.found).toBe(false);
  if (!denyResult.found)
    expect(denyResult.decision.kind).toBe('deny');

  // With openai provider: should allow
  const allowResult = router.resolveTool(
      'browser_mouse_move_xy',
      dispatchCtx('browser_mouse_move_xy', {
        providerConfig: { api: 'openai', apiKey: 'k', model: 'm' } as any,
      })
  );
  expect(allowResult.found).toBe(true);
});

// ---------------------------------------------------------------------------
// Tests: strategy chain composition edge cases
// ---------------------------------------------------------------------------

test('empty strategy list routes all dispatches to allow', () => {
  const tools = [makeTool('a'), makeTool('b')];
  const router = new ToolRouter(tools);
  // All dispatches allow
  expect(router.resolveDispatch(dispatchCtx('a'))).toEqual({ kind: 'allow' });
  expect(router.resolveDispatch(dispatchCtx('b'))).toEqual({ kind: 'allow' });
  // All tools are listed
  expect(router.listTools(listCtx())).toEqual(tools);
});

test('strategies array is read-only from outside', () => {
  const router = new ToolRouter([]);
  const strats = router.strategies;
  expect(() => {
    (strats as any).push({ name: 'injected' });
  }).toThrow();
});

// ---------------------------------------------------------------------------
// Tests: filterTools — empty result and ordering
// ---------------------------------------------------------------------------

test('filterTools returning empty array clears the visible tool list', () => {
  // Empty array is a valid return — distinct from undefined which means "no change".
  const tools = [makeTool('a'), makeTool('b'), makeTool('c')];
  const clearAll: ToolRoutingStrategy = {
    name: 'clear-all',
    filterTools: () => [],
  };
  const router = new ToolRouter(tools, [clearAll]);
  expect(router.listTools(listCtx())).toEqual([]);
});

test('listTools preserves tool registration order when no strategy filters', () => {
  // The router must not sort or reorder the input array.
  const names = ['z', 'a', 'm', 'b'];
  const tools = names.map(n => makeTool(n));
  const router = new ToolRouter(tools);
  expect(router.listTools(listCtx()).map(t => t.schema.name)).toEqual(names);
});

// ---------------------------------------------------------------------------
// Tests: hook independence
// ---------------------------------------------------------------------------

test('filterTools hook is not called during resolveDispatch; beforeDispatch hook is not called during listTools', () => {
  // Each hook must be invoked only by its corresponding router method.
  const calls = { filter: 0, dispatch: 0 };

  const filterOnly: ToolRoutingStrategy = {
    name: 'filter-only',
    filterTools: ts => {
      calls.filter++;
      return ts.filter(t => t.schema.name !== 'hidden');
    },
  };
  const dispatchOnly: ToolRoutingStrategy = {
    name: 'dispatch-only',
    beforeDispatch: () => {
      calls.dispatch++;
      return { kind: 'allow' };
    },
  };

  const router = new ToolRouter([makeTool('visible'), makeTool('hidden')], [filterOnly, dispatchOnly]);

  // listTools must call filterTools but must NOT call beforeDispatch.
  const listed = router.listTools(listCtx());
  expect(listed.map(t => t.schema.name)).toEqual(['visible']);
  expect(calls.filter).toBe(1);
  expect(calls.dispatch).toBe(0);

  // resolveDispatch must call beforeDispatch but must NOT call filterTools.
  router.resolveDispatch(dispatchCtx('visible'));
  expect(calls.filter).toBe(1); // unchanged
  expect(calls.dispatch).toBe(1);
});

// ---------------------------------------------------------------------------
// Tests: failure modes — errors propagate out of the router
// ---------------------------------------------------------------------------

test('listTools propagates errors thrown by a filterTools strategy', () => {
  // The router has no internal catch; strategy failures must bubble to the caller.
  const failing: ToolRoutingStrategy = {
    name: 'failing-filter',
    filterTools: () => { throw new Error('filter strategy failure'); },
  };
  const router = new ToolRouter([makeTool('x')], [failing]);
  expect(() => router.listTools(listCtx())).toThrow('filter strategy failure');
});

test('resolveDispatch propagates errors thrown by a beforeDispatch strategy', () => {
  // Same contract for dispatch: strategy errors must not be silently swallowed.
  const failing: ToolRoutingStrategy = {
    name: 'failing-dispatch',
    beforeDispatch: () => { throw new Error('dispatch strategy failure'); },
  };
  const router = new ToolRouter([], [failing]);
  expect(() => router.resolveDispatch(dispatchCtx('any'))).toThrow('dispatch strategy failure');
});

// ---------------------------------------------------------------------------
// Tests: redirect edge cases
// ---------------------------------------------------------------------------

test('resolveTool redirect targeting the same tool name resolves to that tool', () => {
  // A strategy that redirects a call back to the same tool name must not loop;
  // the router performs a single name lookup on the target, not recursive resolution.
  const self = makeTool('browser_click');
  const selfRedirector: ToolRoutingStrategy = {
    name: 'self-redirector',
    beforeDispatch: () => ({ kind: 'redirect', targetToolName: 'browser_click' }),
  };
  const router = new ToolRouter([self], [selfRedirector]);
  const result = router.resolveTool('browser_click', dispatchCtx('browser_click'));
  expect(result.found).toBe(true);
  if (result.found) {
    expect(result.tool).toBe(self);
    expect(result.decision).toEqual({ kind: 'redirect', targetToolName: 'browser_click' });
  }
});

// ---------------------------------------------------------------------------
// Tests: strategies accessor stability
// ---------------------------------------------------------------------------

test('strategies accessor returns a new frozen array instance on each call', () => {
  // Each call produces a fresh snapshot; mutations on one copy do not affect
  // another, and both snapshots are frozen.
  const router = new ToolRouter([]);
  const s1 = router.strategies;
  const s2 = router.strategies;
  expect(s1).not.toBe(s2);           // distinct instances
  expect(Object.isFrozen(s1)).toBe(true);
  expect(Object.isFrozen(s2)).toBe(true);
  // Snapshot content is identical.
  expect([...s1]).toEqual([...s2]);
});
