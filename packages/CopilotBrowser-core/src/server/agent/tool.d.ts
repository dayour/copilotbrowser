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
import type zod from 'zod';
import type * as loopTypes from '@lowire/loop';
import type { Context } from './context';
import type { Progress } from '../progress';
export type ToolSchema<Input extends zod.Schema> = Omit<loopTypes.Tool, 'inputSchema'> & {
    title: string;
    inputSchema: Input;
};
export type ToolDefinition<Input extends zod.Schema = zod.Schema> = {
    schema: ToolSchema<Input>;
    handle: (progress: Progress, context: Context, params: zod.output<Input>) => Promise<loopTypes.ToolResult>;
};
export declare function defineTool<Input extends zod.Schema>(tool: ToolDefinition<Input>): ToolDefinition<Input>;
type ToolsForLoop = {
    tools: loopTypes.Tool[];
    callTool: loopTypes.ToolCallback;
    reportedResult?: () => any;
    refusedToPerformReason: () => string | undefined;
};
export declare function toolsForLoop(progress: Progress, context: Context, toolDefinitions: ToolDefinition[], options?: {
    resultSchema?: loopTypes.Schema;
    refuseToPerform?: 'allow' | 'deny';
}): ToolsForLoop;
export {};
