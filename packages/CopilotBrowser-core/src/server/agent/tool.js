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
exports.defineTool = defineTool;
exports.toolsForLoop = toolsForLoop;
const mcpBundle_1 = require("../../mcpBundle");
const stringUtils_1 = require("../../utils/isomorphic/stringUtils");
function defineTool(tool) {
    return tool;
}
function toolsForLoop(progress, context, toolDefinitions, options = {}) {
    const tools = toolDefinitions.map(tool => {
        const result = {
            name: tool.schema.name,
            description: tool.schema.description,
            inputSchema: mcpBundle_1.z.toJSONSchema(tool.schema.inputSchema),
        };
        return result;
    });
    if (options.resultSchema) {
        tools.push({
            name: 'report_result',
            description: 'Report the result of the task.',
            inputSchema: options.resultSchema,
        });
    }
    if (options.refuseToPerform === 'allow') {
        tools.push({
            name: 'refuse_to_perform',
            description: 'Refuse to perform action.',
            inputSchema: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: `Call this when you believe that you can't perform the action because something is wrong with the page. The reason will be reported to the user.`,
                    },
                },
                required: ['reason'],
            },
        });
    }
    let reportedResult;
    let refusedToPerformReason;
    const callTool = async (params) => {
        if (params.name === 'report_result') {
            reportedResult = params.arguments;
            return {
                content: [{ type: 'text', text: 'Done' }],
                isError: false,
            };
        }
        if (params.name === 'refuse_to_perform') {
            refusedToPerformReason = params.arguments.reason;
            return {
                content: [{ type: 'text', text: 'Done' }],
                isError: false,
            };
        }
        const tool = toolDefinitions.find(t => t.schema.name === params.name);
        if (!tool) {
            return {
                content: [{ type: 'text',
                        text: `Tool ${params.name} not found. Available tools: ${toolDefinitions.map(t => t.schema.name)}`
                    }],
                isError: true,
            };
        }
        try {
            return await tool.handle(progress, context, params.arguments);
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: (0, stringUtils_1.stripAnsiEscapes)(error.message) }],
                isError: true,
            };
        }
    };
    return {
        tools,
        callTool,
        reportedResult: options.resultSchema ? () => reportedResult : undefined,
        refusedToPerformReason: () => refusedToPerformReason,
    };
}
