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
import { markdownFromPdfText } from '../../packages/copilotbrowser/src/mcp/browser/tools/pdfUtils';

test('save as pdf unavailable', async ({ startClient, server }) => {
  const { client } = await startClient();
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  expect(await client.callTool({
    name: 'browser_pdf_save',
  })).toHaveResponse({
    error: 'Tool "browser_pdf_save" not found',
    isError: true,
  });
});

test('save as pdf', async ({ startClient, mcpBrowser, server }, testInfo) => {
  const { client } = await startClient({
    config: { outputDir: testInfo.outputPath('output'), capabilities: ['pdf'] },
  });

  test.skip(!!mcpBrowser && !['chromium', 'chrome', 'msedge'].includes(mcpBrowser), 'Save as PDF is only supported in Chromium.');

  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toHaveResponse({
    snapshot: expect.stringContaining(`- generic [active] [ref=e1]: Hello, world!`),
  });

  expect(await client.callTool({
    name: 'browser_pdf_save',
  })).toHaveResponse({
    code: expect.stringContaining(`await page.pdf(`),
    result: expect.stringMatching(/\[Page as pdf\]\(.*page-[^:]+.pdf\)/),
  });
});

test('save as pdf (filename: output.pdf)', async ({ startClient, mcpBrowser, server }, testInfo) => {
  test.skip(!!mcpBrowser && !['chromium', 'chrome', 'msedge'].includes(mcpBrowser), 'Save as PDF is only supported in Chromium.');
  const { client } = await startClient({
    config: { capabilities: ['pdf'] },
  });

  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toHaveResponse({
    snapshot: expect.stringContaining(`- generic [active] [ref=e1]: Hello, world!`),
  });

  expect(await client.callTool({
    name: 'browser_pdf_save',
    arguments: {
      filename: 'output.pdf',
    },
  })).toHaveResponse({
    result: expect.stringContaining(`output.pdf`),
    code: expect.stringContaining(`await page.pdf(`),
  });

  const files = [...fs.readdirSync(testInfo.outputPath())];

  expect(fs.existsSync(testInfo.outputPath())).toBeTruthy();
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  expect(pdfFiles).toHaveLength(1);
  expect(pdfFiles[0]).toMatch(/^output.pdf$/);
});

test('extract pdf text', async ({ startClient, mcpBrowser, server }) => {
  test.skip(!!mcpBrowser && !['chromium', 'chrome', 'msedge'].includes(mcpBrowser), 'PDF extraction test requires generating a source PDF in Chromium.');
  const { client } = await startClient({
    config: { capabilities: ['pdf'] },
  });

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });
  await client.callTool({
    name: 'browser_pdf_save',
    arguments: { filename: 'source.pdf' },
  });

  expect(await client.callTool({
    name: 'browser_pdf_extract_text',
    arguments: { pdfPath: 'source.pdf' },
  })).toHaveResponse({
    result: expect.stringContaining('Hello, world!'),
  });
});

test('extract pdf metadata and markdown', async ({ startClient, mcpBrowser, server }, testInfo) => {
  test.skip(!!mcpBrowser && !['chromium', 'chrome', 'msedge'].includes(mcpBrowser), 'PDF extraction test requires generating a source PDF in Chromium.');
  const { client } = await startClient({
    config: { capabilities: ['pdf'] },
  });

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });
  await client.callTool({
    name: 'browser_pdf_save',
    arguments: { filename: 'source.pdf' },
  });

  expect(await client.callTool({
    name: 'browser_pdf_extract_metadata',
    arguments: { pdfPath: 'source.pdf' },
  })).toHaveResponse({
    result: expect.stringContaining('"pages": 1'),
  });

  expect(await client.callTool({
    name: 'browser_pdf_convert_to_markdown',
    arguments: { pdfPath: 'source.pdf', filename: 'source.md' },
  })).toHaveResponse({
    result: expect.stringContaining('source.md'),
  });
  expect(fs.readFileSync(testInfo.outputPath('source.md'), 'utf-8')).toContain('Hello, world!');
});

test('markdown cleanup removes viewer chrome and reflows simple content', async () => {
  const markdown = markdownFromPdfText({
    title: 'power-platform | Microsoft Learn',
    author: 'Unknown',
    subject: 'Unknown',
    creator: 'Microsoft Learn',
    producer: 'Microsoft Learn PDF 1.0',
    creationDate: '2025-10-23T01:41:13.000Z',
    modificationDate: '2025-10-23T01:41:13.000Z',
    pages: 1,
    version: '1.4',
  }, [
    'Tell us about your PDF experience.',
    '',
    'W H A T \' S N E W',
    'What\'s new in Power Platform?',
    '',
    'Power Platform training and',
    'certifications',
    '',
    '1. Sign in to the Power Platform admin center',
    'with your administrator account.',
  ].join('\n'), 'power-platform');

  expect(markdown).not.toContain('Tell us about your PDF experience.');
  expect(markdown).not.toContain('W H A T \' S N E W');
  expect(markdown).toContain('## What\'s new in Power Platform?');
  expect(markdown).toContain('Power Platform training and certifications');
  expect(markdown).toContain('1. Sign in to the Power Platform admin center with your administrator account.');
});

test('markdown conversion emits markdown tables and code blocks for structured content', async () => {
  const markdown = markdownFromPdfText({
    title: 'Structured PDF sample',
    author: 'Unknown',
    subject: 'Unknown',
    creator: 'copilotbrowser',
    producer: 'copilotbrowser',
    creationDate: '2025-10-23T01:41:13.000Z',
    modificationDate: '2025-10-23T01:41:13.000Z',
    pages: 1,
    version: '1.4',
  }, [
    'Property  Type  Description',
    'name  string',
    'Display name of the row',
    'id  guid',
    'Unique identifier',
    '',
    'const payload = {',
    'payload.name = "Contoso";',
    '};',
  ].join('\n'), 'structured-sample');

  expect(markdown).toContain('| Property | Type | Description |');
  expect(markdown).toContain('| name | string | Display name of the row |');
  expect(markdown).toContain('| id | guid | Unique identifier |');
  expect(markdown).toContain('```text');
  expect(markdown).toContain('const payload = {');
  expect(markdown).toContain('payload.name = "Contoso";');
});

test('convert pdf to bundle', async ({ startClient, mcpBrowser, server }, testInfo) => {
  test.skip(!!mcpBrowser && !['chromium', 'chrome', 'msedge'].includes(mcpBrowser), 'PDF extraction test requires generating a source PDF in Chromium.');
  const { client } = await startClient({
    config: { capabilities: ['pdf'] },
  });

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });
  await client.callTool({
    name: 'browser_pdf_save',
    arguments: { filename: 'source.pdf' },
  });

  expect(await client.callTool({
    name: 'browser_pdf_convert_to_bundle',
    arguments: { pdfPath: 'source.pdf', outputDir: 'bundle', includePageImages: true, maxPages: 1, scale: 3 },
  })).toHaveResponse({
    result: expect.stringContaining('manifest.json'),
  });

  const manifest = JSON.parse(fs.readFileSync(testInfo.outputPath('bundle', 'manifest.json'), 'utf-8'));
  expect(manifest.kind).toBe('pdf-conversion');
  expect(manifest.source.pathRedacted).toBeTruthy();
  expect(manifest.render.includedPageImages).toBeTruthy();
  expect(manifest.render.renderedPageCount).toBe(1);
  expect(manifest.artifacts.pageImageFiles).toEqual(['images/page-001.png']);
  expect(fs.existsSync(testInfo.outputPath('bundle', 'document.md'))).toBeTruthy();
  expect(fs.existsSync(testInfo.outputPath('bundle', 'source.pdf'))).toBeTruthy();
  expect(fs.existsSync(testInfo.outputPath('bundle', 'images', 'page-001.png'))).toBeTruthy();
});

test('extract pdf page images', async ({ startClient, mcpBrowser, server }, testInfo) => {
  test.skip(!!mcpBrowser && !['chromium', 'chrome', 'msedge'].includes(mcpBrowser), 'PDF extraction test requires generating a source PDF in Chromium.');
  const { client } = await startClient({
    config: { capabilities: ['pdf'] },
  });

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });
  await client.callTool({
    name: 'browser_pdf_save',
    arguments: { filename: 'source.pdf' },
  });

  expect(await client.callTool({
    name: 'browser_pdf_extract_page_image',
    arguments: { pdfPath: 'source.pdf', pageNumber: 1, scale: 3, filename: 'page-1.png' },
  })).toHaveResponse({
    result: expect.stringContaining('page-1.png'),
  });
  expect(fs.existsSync(testInfo.outputPath('page-1.png'))).toBeTruthy();

  expect(await client.callTool({
    name: 'browser_pdf_extract_images',
    arguments: { pdfPath: 'source.pdf', filenamePrefix: 'pages/page', maxPages: 1, scale: 3 },
  })).toHaveResponse({
    result: expect.stringContaining('Extracted 1 page image'),
  });
  expect(fs.existsSync(testInfo.outputPath('pages', 'page-1.png'))).toBeTruthy();
});
