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
  private _router: ToolRouter;
  private _providerConfig: LLMProviderConfig | undefined;
  private static readonly MIN_TOOL_INTERVAL_MS = 2000;

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
    // Rate limit: enforce minimum interval between tool calls
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
      return {
        content: [{ type: 'text' as const, text: `### Error\n${String(error)}` }],
        isError: true,
      };
    } finally {
      context.setRunningTool(undefined);
    }
    return responseObject;
  }

  serverClosed() {
    void this._context?.dispose().catch(logUnhandledError);
  }
}
