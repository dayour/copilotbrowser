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

/* eslint-disable no-console */

import { gracefullyProcessExitDoNotHang } from '../server/utils/processLauncher';
import { getPackageManager } from '../utils';
import { program } from './program';
export { program } from './program';

function printcopilotbrowserTestError(command: string) {
  const packages: string[] = [];
  for (const pkg of ['copilotbrowser', 'copilotbrowser-chromium', 'copilotbrowser-firefox', 'copilotbrowser-webkit']) {
    try {
      require.resolve(pkg);
      packages.push(pkg);
    } catch (e) {
    }
  }
  if (!packages.length)
    packages.push('copilotbrowser');
  const packageManager = getPackageManager();
  if (packageManager === 'yarn') {
    console.error(`Please install @copilotbrowser/test package before running "yarn copilotbrowser ${command}"`);
    console.error(`  yarn remove ${packages.join(' ')}`);
    console.error('  yarn add -D @copilotbrowser/test');
  } else if (packageManager === 'pnpm') {
    console.error(`Please install @copilotbrowser/test package before running "pnpm exec copilotbrowser ${command}"`);
    console.error(`  pnpm remove ${packages.join(' ')}`);
    console.error('  pnpm add -D @copilotbrowser/test');
  } else {
    console.error(`Please install @copilotbrowser/test package before running "npx copilotbrowser ${command}"`);
    console.error(`  npm uninstall ${packages.join(' ')}`);
    console.error('  npm install -D @copilotbrowser/test');
  }
}

const kExternalcopilotbrowserTestCommands = [
  ['test', 'Run tests with copilotbrowser Test.'],
  ['show-report', 'Show copilotbrowser Test HTML report.'],
  ['merge-reports', 'Merge copilotbrowser Test Blob reports'],
];
function addExternalcopilotbrowserTestCommands() {
  for (const [command, description] of kExternalcopilotbrowserTestCommands) {
    const copilotbrowserTest = program.command(command)
        .allowUnknownOption(true)
        .allowExcessArguments(true);
    copilotbrowserTest.description(`${description} Available in @copilotbrowser/test package.`);
    copilotbrowserTest.action(async () => {
      printcopilotbrowserTestError(command);
      gracefullyProcessExitDoNotHang(1);
    });
  }
}

if (!process.env.PW_LANG_NAME)
  addExternalcopilotbrowserTestCommands();
