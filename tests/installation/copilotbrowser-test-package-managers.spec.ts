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

test('npm: @copilotbrowser/test should work', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/test');
  await exec('npx copilotbrowser install');
  await exec('npx copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/test chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('npm: copilotbrowser + @copilotbrowser/test should work', async ({ exec, tmpWorkspace }) => {
  await exec('npm i copilotbrowser');
  await exec('npm i @copilotbrowser/test');
  await exec('npx copilotbrowser install');
  await exec('npx copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/test chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('npm: @copilotbrowser/test + copilotbrowser-core should work', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/test');
  await exec('npm i copilotbrowser-core');
  await exec('npx copilotbrowser install');
  await exec('npx copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/test chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('npm: @copilotbrowser/test should install copilotbrowser-core bin', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/test');
  const result = await exec('npx copilotbrowser-core --version');
  expect(result).toContain('Version 1.');
});

test('npm: uninstalling ct removes copilotbrowser bin', async ({ exec, tmpWorkspace }) => {
  await exec('npm i @copilotbrowser/test');
  await exec('npm i @copilotbrowser/experimental-ct-react');
  await exec('npm uninstall @copilotbrowser/experimental-ct-react');
  await exec('npx copilotbrowser test', { expectToExitWithError: true, message: 'command not found' });
});

test('yarn: @copilotbrowser/test should work', async ({ exec, tmpWorkspace }) => {
  await exec('yarn add @copilotbrowser/test');
  await exec('yarn copilotbrowser install');
  await exec('yarn copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/test chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});

test('pnpm: @copilotbrowser/test should work', async ({ exec, tmpWorkspace }) => {
  await exec('pnpm add @copilotbrowser/test');
  await exec('pnpm exec copilotbrowser install');
  await exec('pnpm exec copilotbrowser test -c . --browser=all --reporter=list,json sample.spec.js', { env: {  copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'));
  await exec('node sanity.js @copilotbrowser/test chromium firefox webkit');
  await exec('node', 'esm-copilotbrowser-test.mjs');
});
