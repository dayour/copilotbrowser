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
const mcpBundle_1 = require("../../mcpBundle");
const locatorUtils_1 = require("../../utils/isomorphic/locatorUtils");
const yaml_1 = require("../../utils/isomorphic/yaml");
const tool_1 = require("./tool");
const expectVisible = (0, tool_1.defineTool)({
    schema: {
        name: 'browser_expect_visible',
        title: 'Expect element visible',
        description: 'Expect element is visible on the page',
        inputSchema: mcpBundle_1.z.object({
            role: mcpBundle_1.z.string().describe('ROLE of the element. Can be found in the snapshot like this: \`- {ROLE} "Accessible Name":\`'),
            accessibleName: mcpBundle_1.z.string().describe('ACCESSIBLE_NAME of the element. Can be found in the snapshot like this: \`- role "{ACCESSIBLE_NAME}"\`'),
            isNot: mcpBundle_1.z.boolean().optional().describe('Expect the opposite'),
        }),
    },
    handle: async (progress, context, params) => {
        return await context.runActionAndWait(progress, {
            method: 'expectVisible',
            selector: (0, locatorUtils_1.getByRoleSelector)(params.role, { name: params.accessibleName }),
            isNot: params.isNot,
        });
    },
});
const expectVisibleText = (0, tool_1.defineTool)({
    schema: {
        name: 'browser_expect_visible_text',
        title: 'Expect text visible',
        description: `Expect text is visible on the page. Prefer ${expectVisible.schema.name} if possible.`,
        inputSchema: mcpBundle_1.z.object({
            text: mcpBundle_1.z.string().describe('TEXT to expect. Can be found in the snapshot like this: \`- role "Accessible Name": {TEXT}\` or like this: \`- text: {TEXT}\`'),
            isNot: mcpBundle_1.z.boolean().optional().describe('Expect the opposite'),
        }),
    },
    handle: async (progress, context, params) => {
        return await context.runActionAndWait(progress, {
            method: 'expectVisible',
            selector: (0, locatorUtils_1.getByTextSelector)(params.text),
            isNot: params.isNot,
        });
    },
});
const expectValue = (0, tool_1.defineTool)({
    schema: {
        name: 'browser_expect_value',
        title: 'Expect value',
        description: 'Expect element value',
        inputSchema: mcpBundle_1.z.object({
            type: mcpBundle_1.z.enum(['textbox', 'checkbox', 'radio', 'combobox', 'slider']).describe('Type of the element'),
            element: mcpBundle_1.z.string().describe('Human-readable element description'),
            ref: mcpBundle_1.z.string().describe('Exact target element reference from the page snapshot'),
            value: mcpBundle_1.z.string().describe('Value to expect. For checkbox, use "true" or "false".'),
            isNot: mcpBundle_1.z.boolean().optional().describe('Expect the opposite'),
        }),
    },
    handle: async (progress, context, params) => {
        const [selector] = await context.refSelectors(progress, [{ ref: params.ref, element: params.element }]);
        return await context.runActionAndWait(progress, {
            method: 'expectValue',
            selector,
            type: params.type,
            value: params.value,
            isNot: params.isNot,
        });
    },
});
const expectList = (0, tool_1.defineTool)({
    schema: {
        name: 'browser_expect_list_visible',
        title: 'Expect list visible',
        description: 'Expect list is visible on the page, ensures items are present in the element in the exact order',
        inputSchema: mcpBundle_1.z.object({
            listRole: mcpBundle_1.z.string().describe('Aria role of the list element as in the snapshot'),
            listAccessibleName: mcpBundle_1.z.string().optional().describe('Accessible name of the list element as in the snapshot'),
            itemRole: mcpBundle_1.z.string().describe('Aria role of the list items as in the snapshot, should all be the same'),
            items: mcpBundle_1.z.array(mcpBundle_1.z.string().describe('Text to look for in the list item, can be either from accessible name of self / nested text content')),
            isNot: mcpBundle_1.z.boolean().optional().describe('Expect the opposite'),
        }),
    },
    handle: async (progress, context, params) => {
        const template = `- ${params.listRole}:
${params.items.map(item => `  - ${params.itemRole}: ${(0, yaml_1.yamlEscapeValueIfNeeded)(item)}`).join('\n')}`;
        return await context.runActionAndWait(progress, {
            method: 'expectAria',
            template,
        });
    },
});
const expectURL = (0, tool_1.defineTool)({
    schema: {
        name: 'browser_expect_url',
        title: 'Expect URL',
        description: 'Expect the page URL to match the expected value. Either provide a url string or a regex pattern.',
        inputSchema: mcpBundle_1.z.object({
            url: mcpBundle_1.z.string().optional().describe('Expected URL string. Relative URLs are resolved against the baseURL.'),
            regex: mcpBundle_1.z.string().optional().describe('Regular expression pattern to match the URL against, e.g. /foo.*/i.'),
            isNot: mcpBundle_1.z.boolean().optional().describe('Expect the opposite'),
        }),
    },
    handle: async (progress, context, params) => {
        return await context.runActionAndWait(progress, {
            method: 'expectURL',
            value: params.url,
            regex: params.regex,
            isNot: params.isNot,
        });
    },
});
const expectTitle = (0, tool_1.defineTool)({
    schema: {
        name: 'browser_expect_title',
        title: 'Expect title',
        description: 'Expect the page title to match the expected value.',
        inputSchema: mcpBundle_1.z.object({
            title: mcpBundle_1.z.string().describe('Expected page title.'),
            isNot: mcpBundle_1.z.boolean().optional().describe('Expect the opposite'),
        }),
    },
    handle: async (progress, context, params) => {
        return await context.runActionAndWait(progress, {
            method: 'expectTitle',
            value: params.title,
            isNot: params.isNot,
        });
    },
});
exports.default = [
    expectVisible,
    expectVisibleText,
    expectValue,
    expectList,
    expectURL,
    expectTitle,
];
