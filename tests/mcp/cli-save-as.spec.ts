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

test('screenshot', async ({ cli, server, mcpBrowser }) => {
  await cli('open', server.HELLO_WORLD);
  const { attachments } = await cli('screenshot');
  expect(attachments[0].name).toEqual('Screenshot of viewport');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});

test('screenshot <ref>', async ({ cli, server, mcpBrowser }) => {
  server.setContent('/', `<div id="square" style="width: 100px; height: 100px; background-color: red;"></div>`, 'text/html');
  await cli('open', server.PREFIX);
  const { attachments } = await cli('screenshot', 'e2');
  expect(attachments[0].name).toEqual('Screenshot of element');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});

test('screenshot --full-page', async ({ cli, server, mcpBrowser }) => {
  await cli('open', server.HELLO_WORLD);
  const { attachments } = await cli('screenshot', '--full-page');
  expect(attachments[0].name).toEqual('Screenshot of full page');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});

test('screenshot --filename', async ({ cli, server, mcpBrowser }) => {
  await cli('open', server.HELLO_WORLD);
  const { output, attachments } = await cli('screenshot', '--filename=screenshot.png');
  expect(output).toContain('[Screenshot of viewport](screenshot.png)');
  expect(attachments[0].name).toEqual('Screenshot of viewport');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});

test('pdf', async ({ cli, server, mcpBrowser }) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF is only supported in Chromium and Chrome');
  await cli('open', server.HELLO_WORLD);
  const { attachments } = await cli('pdf');
  expect(attachments[0].name).toEqual('Page as pdf');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});

test('pdf --filename', async ({ cli, server, mcpBrowser }) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF is only supported in Chromium and Chrome');
  await cli('open', server.HELLO_WORLD);
  const { output, attachments } = await cli('pdf', '--filename=pdf.pdf');
  expect(output).toContain('[Page as pdf](pdf.pdf)');
  expect(attachments[0].name).toEqual('Page as pdf');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});

test('pdf-text <file>', async ({ cli, server, mcpBrowser }) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF extraction test requires generating a source PDF in Chromium or Chrome');
  await cli('open', server.HELLO_WORLD);
  await cli('pdf', '--filename=source.pdf');
  const { output } = await cli('pdf-text', 'source.pdf');
  expect(output).toContain('Hello, world!');
});

test('pdf-metadata <file> --filename', async ({ cli, server, mcpBrowser }) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF extraction test requires generating a source PDF in Chromium or Chrome');
  await cli('open', server.HELLO_WORLD);
  await cli('pdf', '--filename=source.pdf');
  const { output, attachments } = await cli('pdf-metadata', 'source.pdf', '--filename=metadata.json');
  expect(output).toContain('[Extracted PDF metadata](metadata.json)');
  expect(attachments[0].name).toEqual('Extracted PDF metadata');
  expect(attachments[0].data?.toString()).toContain('"pages": 1');
});

test('pdf-markdown <file> --filename', async ({ cli, server, mcpBrowser }) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF extraction test requires generating a source PDF in Chromium or Chrome');
  await cli('open', server.HELLO_WORLD);
  await cli('pdf', '--filename=source.pdf');
  const { output, attachments } = await cli('pdf-markdown', 'source.pdf', '--filename=source.md');
  expect(output).toContain('[PDF as Markdown](source.md)');
  expect(attachments[0].name).toEqual('PDF as Markdown');
  expect(attachments[0].data?.toString()).toContain('Hello, world!');
});

test('pdf-convert <file>', async ({ cli, server, mcpBrowser }, testInfo) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF extraction test requires generating a source PDF in Chromium or Chrome');
  await cli('open', server.HELLO_WORLD);
  await cli('pdf', '--filename=source.pdf');
  const { output } = await cli('pdf-convert', 'source.pdf', '--output-dir=bundle', '--page-images', '--max-pages=1', '--scale=3');
  expect(output).toContain('manifest.json');
  expect(output).toContain('document.md');
  expect(fs.existsSync(testInfo.outputPath('bundle', 'manifest.json'))).toBeTruthy();
  expect(fs.existsSync(testInfo.outputPath('bundle', 'document.md'))).toBeTruthy();
  expect(fs.existsSync(testInfo.outputPath('bundle', 'images', 'page-001.png'))).toBeTruthy();
});

test('pdf-image <file> <page>', async ({ cli, server, mcpBrowser }) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF extraction test requires generating a source PDF in Chromium or Chrome');
  await cli('open', server.HELLO_WORLD);
  await cli('pdf', '--filename=source.pdf');
  const { output, attachments } = await cli('pdf-image', 'source.pdf', '1', '--scale=3', '--filename=page-1.png');
  expect(output).toContain('[PDF page 1](page-1.png)');
  expect(attachments[0].name).toEqual('PDF page 1');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});

test('pdf-images <file>', async ({ cli, server, mcpBrowser }) => {
  test.skip(mcpBrowser !== 'chromium' && mcpBrowser !== 'chrome', 'PDF extraction test requires generating a source PDF in Chromium or Chrome');
  await cli('open', server.HELLO_WORLD);
  await cli('pdf', '--filename=source.pdf');
  const { output, attachments } = await cli('pdf-images', 'source.pdf', '--filename-prefix=pages/page', '--max-pages=1', '--scale=3');
  expect(output).toContain('Extracted 1 page image');
  expect(output).toContain('[PDF page 1](pages/page-1.png)');
  expect(attachments[0].name).toEqual('PDF page 1');
  expect(attachments[0].data).toEqual(expect.any(Buffer));
});
