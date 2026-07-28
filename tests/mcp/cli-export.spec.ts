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
import { test, expect } from './cli-fixtures';

test('export-test writes recorded test file', async ({ cli, server }, testInfo) => {
  await cli('open', server.EMPTY_PAGE);
  await cli('export-test', 'recorded-cli.spec.ts');

  const content = await fs.promises.readFile(testInfo.outputPath('recorded-cli.spec.ts'), 'utf-8');
  expect(content).toContain(`import { test, expect } from '@copilotbrowser/copilotbrowser/test';`);
  expect(content).toContain('await page.goto(');
});

test('export-workflow writes GitHub Actions workflow', async ({ cli }, testInfo) => {
  await cli('export-workflow');

  const content = await fs.promises.readFile(testInfo.outputPath('.github', 'workflows', 'copilotbrowser.yml'), 'utf-8');
  expect(content).toContain('actions/setup-node');
  expect(content).toContain('copilotbrowser install --with-deps');
});