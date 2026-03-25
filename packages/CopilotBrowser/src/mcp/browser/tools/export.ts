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
import path from 'path';

import { z } from '@copilotbrowser/copilotbrowser/lib/mcpBundle';
import { defineTool } from './tool';

function normalizeSnippets(snippets: string[]): string[] {
  const lines: string[] = [];
  for (const snippet of snippets) {
    for (const line of snippet.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed)
        continue;
      if (lines[lines.length - 1] === trimmed)
        continue;
      lines.push(trimmed);
    }
  }
  return lines;
}

function buildRecordedTest(testName: string, snippets: string[]) {
  const body = normalizeSnippets(snippets).map(line => `  ${line}`).join('\n');
  return [
    `import { test, expect } from '@copilotbrowser/test';`,
    '',
    `test('${testName}', async ({ page }) => {`,
    body,
    `});`,
    '',
  ].join('\n');
}

const exportRecordedTest = defineTool({
  capability: 'core',

  schema: {
    name: 'browser_export_test',
    title: 'Export recorded test',
    description: 'Export the current MCP interaction history as a copilotbrowser test file.',
    inputSchema: z.object({
      filename: z.string().optional().describe('Target test file. Defaults to `copilotbrowser-recorded.spec.ts` in the workspace root.'),
      testName: z.string().default('recorded test').describe('Test name to use in the exported file.'),
    }),
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const snippets = context.generatedCode();
    if (!snippets.length) {
      response.addError('No generated browser actions are available yet. Run browser actions first, then export the test.');
      return;
    }

    const resolvedFile = await response.resolveClientFile({
      prefix: 'copilotbrowser-recorded.spec',
      ext: 'ts',
      suggestedFilename: params.filename ?? 'copilotbrowser-recorded.spec.ts',
    }, 'Recorded test');
    await fs.promises.mkdir(path.dirname(resolvedFile.fileName), { recursive: true });
    const content = buildRecordedTest(params.testName, snippets);
    await response.addFileResult(resolvedFile, content);
  },
});

const exportGithubActions = defineTool({
  capability: 'core',

  schema: {
    name: 'browser_export_github_actions',
    title: 'Export GitHub Actions workflow',
    description: 'Write a ready-to-run GitHub Actions workflow for copilotbrowser into the workspace.',
    inputSchema: z.object({
      filename: z.string().optional().describe('Workflow path. Defaults to `.github/workflows/copilotbrowser.yml`.'),
    }),
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const templatePath = path.resolve(__dirname, '../../../agents/copilot-setup-steps.yml');
    const yaml = await fs.promises.readFile(templatePath, 'utf-8');
    const resolvedFile = await response.resolveClientFile({
      prefix: 'copilotbrowser-workflow',
      ext: 'yml',
      suggestedFilename: params.filename ?? '.github/workflows/copilotbrowser.yml',
    }, 'GitHub Actions workflow');
    await fs.promises.mkdir(path.dirname(resolvedFile.fileName), { recursive: true });
    await response.addFileResult(resolvedFile, yaml);
  },
});

export default [
  exportRecordedTest,
  exportGithubActions,
];
