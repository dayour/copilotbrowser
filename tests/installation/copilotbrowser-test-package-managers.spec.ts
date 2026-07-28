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
import { test, expect } from './npmTest';
import path from 'path';

test('npm: @copilotbrowser/copilotbrowser should work', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/copilotbrowser');
  await exec('npx copilotbrowser install');
  await exec('npx copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/copilotbrowser chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('npm: copilotbrowser + @copilotbrowser/copilotbrowser should work', async ({ exec, tmpWorkspace }) => {
  await exec('npm i copilotbrowser');
  await exec('npm i @copilotbrowser/copilotbrowser');
  await exec('npx copilotbrowser install');
  await exec('npx copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/copilotbrowser chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('npm: @copilotbrowser/copilotbrowser + copilotbrowser should work', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/copilotbrowser');
  await exec('npm i copilotbrowser');
  await exec('npx copilotbrowser install');
  await exec('npx copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/copilotbrowser chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('npm: @copilotbrowser/copilotbrowser should install copilotbrowser bin', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/copilotbrowser');
  const result = await exec('npx copilotbrowser --version');
  expect(result).toContain('Version 1.');
});

test('npm: uninstalling copilotbrowser removes copilotbrowser bin', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/copilotbrowser');
  await exec('npm i copilotbrowser');
  await exec('npm uninstall copilotbrowser');
  await exec('npx copilotbrowser test', { expectToExitWithError: true, message: 'command not found' });
});

test('yarn: @copilotbrowser/copilotbrowser should work', async ({ exec, tmpWorkspace }) => {
  await exec('yarn add @copilotbrowser/copilotbrowser');
  await exec('yarn copilotbrowser install');
  await exec('yarn copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/copilotbrowser chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('pnpm: @copilotbrowser/copilotbrowser should work', async ({ exec, tmpWorkspace }) => {
  await exec('pnpm add @copilotbrowser/copilotbrowser');
  await exec('pnpm exec copilotbrowser install');
  await exec('pnpm exec copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/copilotbrowser chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});
