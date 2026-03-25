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

import { z } from '@copilotbrowser/copilotbrowser/lib/mcpBundle';
import { defineTool } from './tool';
import { launchEdge, sendKeys, cycleTabs, focusEdge } from '../nativeBrowser';

const nativeNavigate = defineTool({
  capability: 'core-native',

  schema: {
    name: 'browser_native_navigate',
    title: 'Native navigate',
    description: 'Open a URL in the user\'s real (non-isolated) Edge browser. Uses the active Edge profile with existing auth sessions and cookies. Opens as a new tab if Edge is already running.',
    inputSchema: z.object({
      url: z.string().describe('The URL to navigate to'),
    }),
    type: 'action',
  },

  handle: async (_context, params, response) => {
    const result = launchEdge(params.url);
    if (result.success)
      response.addTextResult(result.message);
    else
      response.addError(result.message);
  },
});

const nativeTabCycle = defineTool({
  capability: 'core-native',

  schema: {
    name: 'browser_native_tab_cycle',
    title: 'Cycle browser tabs',
    description: 'Cycle through tabs in the user\'s real Edge browser using Ctrl+Tab. Useful for reviewing open tabs with a visible pause on each. Windows only.',
    inputSchema: z.object({
      count: z.number().default(10).describe('Number of tabs to cycle through'),
      delayMs: z.number().default(2000).describe('Delay in milliseconds between each tab switch'),
    }),
    type: 'action',
  },

  handle: async (_context, params, response) => {
    const result = await cycleTabs(params.count, params.delayMs);
    if (result.success)
      response.addTextResult(result.message);
    else
      response.addError(result.message);
  },
});

const nativeSendKeys = defineTool({
  capability: 'core-native',

  schema: {
    name: 'browser_native_sendkeys',
    title: 'Send keys to browser',
    description: 'Send keystrokes to the active Edge browser window using OS-level input. Supports SendKeys syntax: ^=Ctrl, +=Shift, %=Alt, {TAB}, {ENTER}, etc. Windows only.',
    inputSchema: z.object({
      keys: z.string().describe('Keys to send in SendKeys format (e.g., "^{TAB}" for Ctrl+Tab, "^t" for Ctrl+T, "%{F4}" for Alt+F4)'),
    }),
    type: 'action',
  },

  handle: async (_context, params, response) => {
    const result = sendKeys(params.keys);
    if (result.success)
      response.addTextResult(result.message);
    else
      response.addError(result.message);
  },
});

const nativeFocus = defineTool({
  capability: 'core-native',

  schema: {
    name: 'browser_native_focus',
    title: 'Focus browser window',
    description: 'Bring the Edge browser window to the foreground. Windows only.',
    inputSchema: z.object({}),
    type: 'action',
  },

  handle: async (_context, _params, response) => {
    const result = focusEdge();
    if (result.success)
      response.addTextResult(result.message);
    else
      response.addError(result.message);
  },
});

export default [
  nativeNavigate,
  nativeTabCycle,
  nativeSendKeys,
  nativeFocus,
];
