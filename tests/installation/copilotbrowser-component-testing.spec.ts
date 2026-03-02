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
import { test } from './npmTest';
import path from 'path';

test.slow();

test('pnpm: @copilotbrowser/experimental-ct-react should work', async ({ exec, tmpWorkspace, writeFiles }) => {
  await exec('pnpm add @copilotbrowser/experimental-ct-react react react-dom');
  await exec('pnpm exec copilotbrowser install');
  await writeFiles({
    'copilotbrowser.config.ts': `
      import { defineConfig } from '@copilotbrowser/experimental-ct-react';
      export default defineConfig({});
    `,
    'copilotbrowser/index.html': `<script type="module" src="./index.js"></script>`,
    'copilotbrowser/index.js': ``,
    'Button.tsx': `
      export function Button({ onClick }) {
        return <button onClick={onClick}>Submit</button>;
      }
    `,
    'example.spec.tsx': `
      import { test, expect } from '@copilotbrowser/experimental-ct-react';
      import { Button } from './Button';

      test('sample test', async ({ page, mount }) => {
        let clicked = false;
        const component = await mount(
          <Button title='Submit' onClick={() => { clicked = true }}></Button>
        );
        await expect(component).toContainText('Submit');
        await component.click();
        expect(clicked).toBeTruthy();
      });
    `,
  });
  await exec('pnpm exec copilotbrowser test -c . --browser=chromium --reporter=list,json example.spec.tsx', { env: { copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'), '--validate-chromium-project-only');
});

test('pnpm: JSX inside a @copilotbrowser/test should work', async ({ exec, tmpWorkspace, writeFiles }) => {
  await exec('pnpm add @copilotbrowser/test');
  await exec('pnpm exec copilotbrowser install');
  await writeFiles({
    'Button.tsx': `
      export function Button({ onClick }) {
        return <button onClick={onClick}>Submit</button>;
      }
    `,
    'example.spec.ts': `
      import { test, expect } from '@copilotbrowser/test';
      import { Button } from './Button';

      test('sample test', async ({ page }) => {
        expect(Button).toEqual(expect.any(Function));
      });
    `,
  });
  await exec(`node node_modules/@copilotbrowser/test/cli.js test --browser=chromium --reporter=list,json example.spec.ts`, { env: { copilotbrowser_JSON_OUTPUT_NAME: 'report.json' } });
  await exec('node read-json-report.js', path.join(tmpWorkspace, 'report.json'), '--validate-chromium-project-only');
});
