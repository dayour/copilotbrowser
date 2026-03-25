/**
 * Copyright (c) DarbotLabs.
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

const clockInstall = defineTabTool({
  capability: 'clock',

  schema: {
    name: 'browser_clock_install',
    title: 'Install fake clock',
    description: 'Autonomously install fake clock to control time in the browser. Useful for testing time-dependent behavior like animations, timeouts, and scheduled tasks.',
    inputSchema: z.object({
      time: z.string().optional().describe('Initial time to set in ISO 8601 format (e.g., "2024-02-02T08:00:00"). Defaults to current time if not specified.'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    const clockOptions = params.time ? { time: params.time } : {};
    await (tab.page as any).clock.install(clockOptions);
    const timeStr = params.time ?? 'current time';
    response.addTextResult(`Fake clock installed at ${timeStr}`);
    response.addCode(`await page.clock.install(${params.time ? `{ time: '${params.time}' }` : ''});`);
  },
});

const clockFastForward = defineTabTool({
  capability: 'clock',

  schema: {
    name: 'browser_clock_fast_forward',
    title: 'Fast-forward clock',
    description: 'Autonomously advance the fake clock time by a specified duration. Timers and animations will fire as if that time had passed.',
    inputSchema: z.object({
      milliseconds: z.number().describe('Number of milliseconds to fast forward'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    await (tab.page as any).clock.fastForward(params.milliseconds);
    response.addTextResult(`Clock advanced by ${params.milliseconds}ms`);
    response.addCode(`await page.clock.fastForward(${params.milliseconds});`);
  },
});

const clockPause = defineTabTool({
  capability: 'clock',

  schema: {
    name: 'browser_clock_pause',
    title: 'Pause clock',
    description: 'Autonomously pause the clock at a specific time. Time will stop until resumed.',
    inputSchema: z.object({
      time: z.string().optional().describe('Time to pause at in ISO 8601 format. If not specified, pauses at current fake time.'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    const pauseArg = params.time ?? Date.now();
    await (tab.page as any).clock.pauseAt(pauseArg);
    const timeStr = params.time ?? 'current time';
    response.addTextResult(`Clock paused at ${timeStr}`);
    response.addCode(`await page.clock.pauseAt(${params.time ? `'${params.time}'` : 'Date.now()'});`);
  },
});

const clockResume = defineTabTool({
  capability: 'clock',

  schema: {
    name: 'browser_clock_resume',
    title: 'Resume clock',
    description: 'Autonomously resume the paused clock. Time will continue flowing from where it was paused.',
    inputSchema: z.object({}),
    type: 'action',
  },

  handle: async (tab, _params, response) => {
    await (tab.page as any).clock.resume();
    response.addTextResult('Clock resumed');
    response.addCode(`await page.clock.resume();`);
  },
});

const clockSetFixedTime = defineTabTool({
  capability: 'clock',

  schema: {
    name: 'browser_clock_set_fixed_time',
    title: 'Set fixed time',
    description: 'Autonomously set a fixed time that will be returned by Date.now() and new Date(). Time will not advance automatically.',
    inputSchema: z.object({
      time: z.string().describe('Fixed time to set in ISO 8601 format (e.g., "2024-12-25T00:00:00")'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    await (tab.page as any).clock.setFixedTime(params.time);
    response.addTextResult(`Clock fixed at ${params.time}`);
    response.addCode(`await page.clock.setFixedTime('${params.time}');`);
  },
});

export default [
  clockInstall,
  clockFastForward,
  clockPause,
  clockResume,
  clockSetFixedTime,
];
