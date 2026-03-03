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

import { FullConfig } from './config';
import { Context } from './context';
import { logUnhandledError } from '../log';
import { Response } from './response';
import { SessionLog } from './sessionLog';
import { browserTools, filteredTools } from './tools';
import { toMcpTool } from '../sdk/tool';
import { ToolRouter } from './toolRouter';

import type { Tool } from './tools/tool';
import type { BrowserContextFactory } from './browserContextFactory';
import type * as mcpServer from '../sdk/server';
import type { ServerBackend } from '../sdk/server';
import type { ToolRoutingStrategy, ToolListingContext, ToolDispatchContext } from './toolRouter';
import type { LLMProviderConfig } from '../../../types/test';

export class BrowserServerBackend implements ServerBackend {
  private _tools: Tool[];
  private _context: Context | undefined;
  private _sessionLog: SessionLog | undefined;
  private _config: FullConfig;
  private _browserContextFactory: BrowserContextFactory;
  private _lastToolCallTime = 0;
  private _pendingCalls = 0;
  private _router: ToolRouter;
  private _providerConfig: LLMProviderConfig | undefined;
  private static readonly MIN_TOOL_INTERVAL_MS = 3000;
  private static readonly MAX_CONCURRENT_CALLS = 2;

  constructor(config: FullConfig, factory: BrowserContextFactory, options: { allTools?: boolean, structuredOutput?: boolean, routingStrategies?: ToolRoutingStrategy[], providerConfig?: LLMProviderConfig } = {}) {
    this._config = config;
    this._browserContextFactory = factory;
    this._tools = options.allTools ? browserTools : filteredTools(config);
    this._providerConfig = options.providerConfig;
    this._router = new ToolRouter(this._tools, options.routingStrategies ?? []);
  }

  async initialize(clientInfo: mcpServer.ClientInfo): Promise<void> {
    this._sessionLog = this._config.saveSession ? await SessionLog.create(this._config, clientInfo) : undefined;
    this._context = new Context({
      config: this._config,
      browserContextFactory: this._browserContextFactory,
      sessionLog: this._sessionLog,
      clientInfo,
    });
  }

  async listTools(): Promise<mcpServer.Tool[]> {
    const context: ToolListingContext = { config: this._config, providerConfig: this._providerConfig };
    return this._router.listTools(context).map(tool => toMcpTool(tool.schema));
  }

  async callTool(name: string, rawArguments: mcpServer.CallToolRequest['params']['arguments']) {
    // Guard: reject if too many calls are already in flight (prevents LLM call-spam)
    if (this._pendingCalls >= BrowserServerBackend.MAX_CONCURRENT_CALLS) {
      return {
        content: [{ type: 'text' as const, text: `### Error\n**Tool:** ${name}\n**Error:** Too many concurrent tool calls (max ${BrowserServerBackend.MAX_CONCURRENT_CALLS}). Wait for the previous call to complete before issuing another.` }],
        isError: true,
      };
    }
    this._pendingCalls++;
    // Rate limit: enforce minimum interval between tool calls (3 s)
    const now = Date.now();
    const elapsed = now - this._lastToolCallTime;
    if (this._lastToolCallTime > 0 && elapsed < BrowserServerBackend.MIN_TOOL_INTERVAL_MS) {
      const waitMs = BrowserServerBackend.MIN_TOOL_INTERVAL_MS - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    this._lastToolCallTime = Date.now();

    const dispatchCtx: ToolDispatchContext = { toolName: name, config: this._config, providerConfig: this._providerConfig };
    const resolved = this._router.resolveTool(name, dispatchCtx);

    if (!resolved.found) {
      this._pendingCalls--;
      if (resolved.decision.kind === 'deny') {
        return {
          content: [{ type: 'text' as const, text: `### Error\n${resolved.decision.reason}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text' as const, text: `### Error\nTool "${name}" not found` }],
        isError: true,
      };
    }

    const tool = resolved.tool;
    const parsedArguments = tool.schema.inputSchema.parse(rawArguments || {}) as any;
    const cwd = rawArguments?._meta && typeof rawArguments?._meta === 'object' && (rawArguments._meta as any)?.cwd;
    const context = this._context!;
    const response = new Response(context, name, parsedArguments, cwd);
    context.setRunningTool(name);
    let responseObject: mcpServer.CallToolResult;
    try {
      await tool.handle(context, parsedArguments, response);
      // Force writeback: action tools must always include page state validation
      // This prevents blind fire-and-forget from aggressive LLM clients
      if (tool.schema.type === 'action')
        response.setIncludeSnapshot();
      responseObject = await response.serialize();
      this._sessionLog?.logResponse(name, parsedArguments, responseObject);
    } catch (error: any) {
      // Structured error recovery: give LLMs actionable state instead of raw stack traces
      const browserState = this._detectBrowserState(context);
      const suggestion = this._recoverySuggestion(name, browserState, error);
      const errorText = [
        `### Error`,
        `**Tool:** ${name}`,
        `**Error:** ${error.message || String(error)}`,
        `**Browser state:** ${browserState}`,
        `**Recovery:** ${suggestion}`,
      ].join('\n');
      return {
        content: [{ type: 'text' as const, text: errorText }],
        isError: true,
      };
    } finally {
      context.setRunningTool(undefined);
      this._pendingCalls--;
    }
    return responseObject;
  }

  private _detectBrowserState(context: Context): 'alive' | 'no-page' | 'dead' {
    try {
      const tab = context.currentTab();
      if (!tab)
        return 'no-page';
      tab.page.url();
      return 'alive';
    } catch {
      return 'dead';
    }
  }

  private _recoverySuggestion(toolName: string, browserState: string, error: any): string {
    if (browserState === 'dead')
      return 'Browser context is dead. Call browser_navigate to open a new page, which will create a fresh context.';
    if (browserState === 'no-page')
      return 'No open page. Call browser_navigate with a URL to open one.';
    const msg = String(error.message || error);
    if (msg.includes('Timeout'))
      return 'Action timed out. The page may be loading or unresponsive. Try browser_wait_for or browser_snapshot to check page state.';
    if (msg.includes('modal state'))
      return 'A dialog or file chooser is blocking. Use browser_handle_dialog or browser_file_upload first.';
    if (msg.includes('Ref') && msg.includes('not found'))
      return 'Element ref is stale. Call browser_snapshot to get fresh refs after page changes.';
    return 'Retry the action, or call browser_snapshot to inspect current page state before proceeding.';
  }

  serverClosed() {
    void this._context?.dispose().catch(logUnhandledError);
  }
}
