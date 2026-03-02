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

import { test, expect } from './fixtures';

test('follow me records and replays actions', async ({ client, server }) => {
  server.setContent('/', `
    <button id="btn" onclick="console.log('clicked')">Submit</button>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  const started = await client.callTool({
    name: 'browser_follow_me_start',
    arguments: {},
  });

  expect(started).toHaveResponse({
    result: expect.stringContaining('Follow me recording started'),
  });

  // Assert recording is active before we attempt to stop it.
  expect(await client.callTool({
    name: 'browser_follow_me_start',
    arguments: {},
  })).toHaveResponse({
    isError: true,
    error: expect.stringContaining('already active'),
  });

  // Simulate a user action by invoking the recorder's exposed binding.
  // This avoids needing real OS-level input in CI.
  await client.callTool({
    name: 'browser_run_code',
    arguments: {
      code: `async (page) => {
        await page.evaluate(async () => {
          // The recorder exposes these bindings when enabled.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const w = window as any;
          if (!w.__pw_recorderPerformAction)
            throw new Error('Recorder binding not installed');
          await w.__pw_recorderPerformAction({
            name: 'click',
            selector: 'css=#btn',
            signals: [],
            button: 'left',
            modifiers: 0,
            clickCount: 1,
          });
        });
      }`,
    },
  });

  const stopped = await client.callTool({
    name: 'browser_follow_me_stop',
    arguments: {},
  });

  expect(stopped).toHaveResponse({
    result: expect.stringContaining('async (page) =>'),
  });
  expect(stopped).toHaveResponse({
    result: expect.stringMatching(/\.click\(\)/),
  });

  const replayed = await client.callTool({
    name: 'browser_follow_me_replay',
    arguments: {},
  });

  expect(replayed).toHaveResponse({
    events: expect.stringContaining('[LOG] clicked'),
  });
});
