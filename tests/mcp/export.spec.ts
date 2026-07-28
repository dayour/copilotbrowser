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

import fs from 'fs';
import { test, expect } from './fixtures';

test('browser_export_copilotbrowser_test writes a recorded test file', async ({ startClient, server }, testInfo) => {
  const { client } = await startClient();

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.EMPTY_PAGE },
  });

  const result = await client.callTool({
    name: 'browser_export_copilotbrowser_test',
    arguments: { filename: 'recorded-flow.spec.ts', testName: 'smoke flow' },
  });

  expect(result).toHaveResponse({
    result: expect.stringContaining('recorded-flow.spec.ts'),
  });

  const content = await fs.promises.readFile(testInfo.outputPath('recorded-flow.spec.ts'), 'utf-8');
  expect(content).toContain(`test('smoke flow'`);
  expect(content).toContain(`import { test, expect } from '@copilotbrowser/copilotbrowser/test';`);
  expect(content).toContain('await page.goto(');
});

test('browser_export_github_actions writes workflow template', async ({ startClient }, testInfo) => {
  const { client } = await startClient();

  const result = await client.callTool({
    name: 'browser_export_github_actions',
    arguments: {},
  });

  expect(result).toHaveResponse({
    result: expect.stringContaining('.github/workflows/copilotbrowser.yml'),
  });

  const content = await fs.promises.readFile(testInfo.outputPath('.github', 'workflows', 'copilotbrowser.yml'), 'utf-8');
  expect(content).toContain('actions/setup-node');
  expect(content).toContain('copilotbrowser install --with-deps');
});