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
import { defineTabTool } from './tool';
import { elementSchema } from './snapshot';

const scroll = defineTabTool({
  capability: 'core',
  schema: {
    name: 'browser_scroll',
    title: 'Scroll page',
    description: 'Scroll the page. Positive deltaY scrolls down, negative scrolls up. Positive deltaX scrolls right, negative scrolls left.',
    inputSchema: z.object({
      deltaX: z.number().default(0).describe('Horizontal scroll amount in pixels. Positive scrolls right, negative scrolls left.'),
      deltaY: z.number().default(0).describe('Vertical scroll amount in pixels. Positive scrolls down, negative scrolls up.'),
    }),
    type: 'input',
  },

  handle: async (tab, params, response) => {
    response.setIncludeSnapshot();
    response.addCode(`// Scroll page by (${params.deltaX}, ${params.deltaY})`);
    response.addCode(`await page.mouse.wheel(${params.deltaX}, ${params.deltaY});`);
    await tab.page.mouse.wheel(params.deltaX, params.deltaY);
    // Brief settle time for scroll-triggered lazy loading
    await new Promise(f => setTimeout(f, 300));
  },
});

const scrollToElement = defineTabTool({
  capability: 'core',
  schema: {
    name: 'browser_scroll_to_element',
    title: 'Scroll to element',
    description: 'Scroll an element into view. Use this before interacting with elements that may be off-screen.',
    inputSchema: elementSchema,
    type: 'input',
  },

  handle: async (tab, params, response) => {
    response.setIncludeSnapshot();

    const { locator, resolved } = await tab.refLocator(params);
    response.addCode(`await page.${resolved}.scrollIntoViewIfNeeded();`);
    await locator.scrollIntoViewIfNeeded();
  },
});

export default [
  scroll,
  scrollToElement,
];
