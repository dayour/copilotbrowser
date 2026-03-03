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

import { wrapObject } from './injected/serializers';
import { Router } from './router';

import type { ContextReuseMode, FullConfigInternal } from '../../copilotbrowser/src/common/config';
import type { RouterFixture } from '../index';
import type { ImportRef } from './injected/importRegistry';
import type { Component, JsxComponent, MountOptions, ObjectComponentOptions } from '../types/component';
import type { Fixtures, Locator, Page, copilotbrowserTestArgs, copilotbrowserTestOptions, copilotbrowserWorkerArgs, copilotbrowserWorkerOptions } from '@copilotbrowser/copilotbrowser/test';
import type { Page as PageImpl } from '@copilotbrowser/copilotbrowser/lib/client/page';

let boundCallbacksForMount: Function[] = [];

interface MountResult extends Locator {
  unmount(locator: Locator): Promise<void>;
  update(options: Omit<MountOptions, 'hooksConfig'> | string | JsxComponent): Promise<void>;
}

type TestFixtures = copilotbrowserTestArgs & copilotbrowserTestOptions & {
  mount: (component: any, options: any) => Promise<MountResult>;
  router: RouterFixture;
};
type WorkerFixtures = copilotbrowserWorkerArgs & copilotbrowserWorkerOptions;
type BaseTestFixtures = {
  _optionContextReuseMode: ContextReuseMode
};

export const fixtures: Fixtures<TestFixtures, WorkerFixtures, BaseTestFixtures> = {

  _optionContextReuseMode: 'when-possible',

  serviceWorkers: 'block',

  page: async ({ page }, use, info) => {
    if (!((info as any)._configInternal as FullConfigInternal).defineConfigWasUsed)
      throw new Error('Component testing requires the use of the defineConfig() in your copilotbrowser-ct.config.{ts,js}: https://aka.ms/copilotbrowser/ct-define-config');
    if (!process.env.copilotbrowser_TEST_BASE_URL)
      throw new Error('Component testing could not determine the base URL of your component under test. Ensure you have supplied a template copilotbrowser/index.html or have set the copilotbrowser_TEST_BASE_URL environment variable.');
    await (page as unknown as PageImpl)._wrapApiCall(async () => {
      await page.exposeFunction('__ctDispatchFunction', (ordinal: number, args: any[]) => {
        boundCallbacksForMount[ordinal](...args);
      });
      await page.goto(process.env.copilotbrowser_TEST_BASE_URL!);
    }, { internal: true });
    await use(page);
  },

  mount: async ({ page }, use) => {
    await use(async (componentRef: JsxComponent | ImportRef, options?: ObjectComponentOptions & MountOptions) => {
      const selector = await (page as unknown as PageImpl)._wrapApiCall(async () => {
        return await innerMount(page, componentRef, options);
      }, { internal: true });
      const locator = page.locator(selector);
      return Object.assign(locator, {
        unmount: async () => {
          await locator.evaluate(async () => {
            const rootElement = document.getElementById('root')!;
            await window.copilotbrowserUnmount(rootElement);
          });
        },
        update: async (options: JsxComponent | ObjectComponentOptions) => {
          if (isJsxComponent(options))
            return await innerUpdate(page, options);
          await innerUpdate(page, componentRef, options);
        }
      });
    });
    boundCallbacksForMount = [];
  },

  router: async ({ context, baseURL }, use) => {
    const router = new Router(context, baseURL);
    await use(router);
    await router.dispose();
  },
};

function isJsxComponent(component: any): component is JsxComponent {
  return typeof component === 'object' && component && component.__pw_type === 'jsx';
}

async function innerUpdate(page: Page, componentRef: JsxComponent | ImportRef, options: ObjectComponentOptions = {}): Promise<void> {
  const component = wrapObject(createComponent(componentRef, options), boundCallbacksForMount);

  await page.evaluate(async ({ component }) => {
    component = await window.__pwUnwrapObject(component);
    const rootElement = document.getElementById('root')!;
    return await window.copilotbrowserUpdate(rootElement, component);
  }, { component });
}

async function innerMount(page: Page, componentRef: JsxComponent | ImportRef, options: ObjectComponentOptions & MountOptions = {}): Promise<string> {
  const component = wrapObject(createComponent(componentRef, options), boundCallbacksForMount);

  // WebKit does not wait for deferred scripts.
  await page.waitForFunction(() => !!window.copilotbrowserMount);

  const selector = await page.evaluate(async ({ component, hooksConfig }) => {
    component = await window.__pwUnwrapObject(component);
    hooksConfig = await window.__pwUnwrapObject(hooksConfig);
    let rootElement = document.getElementById('root');
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);
    }
    await window.copilotbrowserMount(component, rootElement, hooksConfig);

    return '#root >> internal:control=component';
  }, { component, hooksConfig: options.hooksConfig });
  return selector;
}

function createComponent(component: JsxComponent | ImportRef, options: ObjectComponentOptions = {}): Component {
  if (component.__pw_type === 'jsx')
    return component;
  return {
    __pw_type: 'object-component',
    type: component,
    ...options,
  };
}
