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

import vm from 'vm';

import { ManualPromise } from 'copilotbrowser-core/lib/utils';
import { z } from 'copilotbrowser-core/lib/mcpBundle';

import { defineTool, defineTabTool } from './tool';

import type * as copilotbrowser from 'copilotbrowser-core';
import type * as actions from '@recorder/actions';

type FollowMeRecording = {
  id: string;
  startedAt: number;
  stoppedAt?: number;
  codeChunks: string[];
};

type FollowMeState = {
  active: FollowMeRecording | undefined;
  recordings: Map<string, FollowMeRecording>;
};

function followMeState(context: any): FollowMeState {
  if (!context.__followMe)
    context.__followMe = { active: undefined, recordings: new Map() } as FollowMeState;
  return context.__followMe as FollowMeState;
}

function buildReplayFunction(codeChunks: string[]): string {
  const body = codeChunks
      .join('\n')
      .split('\n')
      .map(line => line.trimEnd())
      .filter(line => line.length)
      .map(line => '  ' + line)
      .join('\n');
  return `async (page) => {\n${body}\n}`;
}

const start = defineTool({
  capability: 'core-follow-me',

  schema: {
    name: 'browser_follow_me_start',
    title: 'Start "follow me" recording',
    description: 'Start recording browser interactions so they can be replayed later',
    inputSchema: z.object({
      language: z.enum(['javascript', 'copilotbrowser-test']).optional().describe('Code style to generate (default: javascript).'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const state = followMeState(context as any);
    if (state.active)
      throw new Error('Follow me recording is already active. Call browser_follow_me_stop first.');

    // Ensure we have a context (and a tab) before enabling recorder.
    await context.ensureTab();
    const browserContext = await context.ensureBrowserContext();

    const id = `followme_${Date.now().toString(36)}`;
    const recording: FollowMeRecording = {
      id,
      startedAt: Date.now(),
      codeChunks: [],
    };

    // The recorder emits incremental code per action. We store chunks in order.
    const eventSink = {
      actionAdded: (_page: copilotbrowser.Page, _action: actions.ActionInContext, code: string) => {
        if (!code)
          return;
        recording.codeChunks.push(code);
      },
      actionUpdated: (_page: copilotbrowser.Page, _action: actions.ActionInContext, code: string) => {
        if (!code)
          return;
        if (recording.codeChunks.length)
          recording.codeChunks[recording.codeChunks.length - 1] = code;
        else
          recording.codeChunks.push(code);
      },
      signalAdded: () => {},
    };

    // Use recorderMode=api to avoid opening the recorder UI.
    // Note: this relies on the server-side support in RecorderApp.show().
    await (browserContext as any)._enableRecorder({
      recorderMode: 'api',
      mode: 'recording',
      language: params.language ?? 'javascript',
      omitCallTracking: true,
      handleSIGINT: false,
    }, eventSink);

    state.active = recording;
    state.recordings.set(recording.id, recording);

    response.addTextResult(`Follow me recording started (id: ${recording.id}). Perform actions in the browser, then call browser_follow_me_stop.`);
  },
});

const stop = defineTool({
  capability: 'core-follow-me',

  schema: {
    name: 'browser_follow_me_stop',
    title: 'Stop "follow me" recording',
    description: 'Stop recording and return replayable copilotbrowser code',
    inputSchema: z.object({
      id: z.string().optional().describe('Recording id to stop (defaults to the active recording).'),
      saveAs: z.string().optional().describe('Optional filename to save the replay function into (relative to workspace roots).'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const state = followMeState(context as any);
    const active = state.active;
    const recording = params.id ? state.recordings.get(params.id) : active;
    if (!recording)
      throw new Error('No follow me recording found to stop. Call browser_follow_me_start first.');
    if (active?.id !== recording.id)
      throw new Error(`Recording ${recording.id} is not the active recording.`);

    const browserContext = await context.ensureBrowserContext();
    await (browserContext as any)._disableRecorder();

    recording.stoppedAt = Date.now();
    state.active = undefined;

    const fn = buildReplayFunction(recording.codeChunks);

    if (params.saveAs)
      await response.addResult('Follow me replay script', fn + '\n', { prefix: 'follow-me', ext: 'js', suggestedFilename: params.saveAs });

    response.addTextResult(`Follow me recording stopped (id: ${recording.id}).`);
    response.addTextResult('Replay function:');
    response.addTextResult('```js\n' + fn + '\n```');

    // Help the agent replay it via browser_run_code.
    response.addCode(`await (${fn})(page);`);
  },
});

const replay = defineTabTool({
  capability: 'core-follow-me',

  schema: {
    name: 'browser_follow_me_replay',
    title: 'Replay a "follow me" recording',
    description: 'Replay the last (or specified) follow me recording in the current page',
    inputSchema: z.object({
      id: z.string().optional().describe('Recording id to replay (defaults to the most recent recording).'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    const state = followMeState(tab.context as any);
    if (state.active)
      throw new Error('Cannot replay while a follow me recording is active. Call browser_follow_me_stop first.');

    let recording: FollowMeRecording | undefined;
    if (params.id) {
      recording = state.recordings.get(params.id);
    } else {
      // Most recent recording.
      const all = [...state.recordings.values()];
      all.sort((a, b) => (b.stoppedAt ?? b.startedAt) - (a.stoppedAt ?? a.startedAt));
      recording = all[0];
    }

    if (!recording)
      throw new Error('No follow me recording available to replay.');

    const fn = buildReplayFunction(recording.codeChunks);
    response.addCode(`await (${fn})(page);`);

    // Execute similarly to browser_run_code.
    const __end__ = new ManualPromise<void>();
    const vmContext = { page: tab.page, __end__ };
    vm.createContext(vmContext);
    await tab.waitForCompletion(async () => {
      const snippet = `(async () => {
        try {
          const result = await (${fn})(page);
          __end__.resolve(JSON.stringify(result));
        } catch (e) {
          __end__.reject(e);
        }
      })()`;
      await vm.runInContext(snippet, vmContext);
      const result = await __end__;
      if (typeof result === 'string')
        response.addTextResult(result);
    });
  },
});

export default [
  start,
  stop,
  replay,
];
