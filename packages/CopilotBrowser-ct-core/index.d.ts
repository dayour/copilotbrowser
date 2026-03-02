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

import type {
  TestType as BaseTestType,
  copilotbrowserTestArgs,
  copilotbrowserTestConfig as BasecopilotbrowserTestConfig,
  copilotbrowserTestOptions,
  copilotbrowserWorkerArgs,
  copilotbrowserWorkerOptions,
  BrowserContext,
} from 'copilotbrowser/test';
import type { InlineConfig } from 'vite';

export type copilotbrowserTestConfig<T = {}, W = {}> = Omit<BasecopilotbrowserTestConfig<T, W>, 'use'> & {
  use?: BasecopilotbrowserTestConfig<T, W>['use'] & {
    ctPort?: number;
    ctTemplateDir?: string;
    ctCacheDir?: string;
    ctViteConfig?: InlineConfig | (() => Promise<InlineConfig>);
  };
};

interface RequestHandler {
  run(args: { request: Request, requestId?: string, resolutionContext?: { baseUrl?: string } }): Promise<{ response?: Response } | null>;
}

export interface RouterFixture {
  route(...args: Parameters<BrowserContext['route']>): Promise<void>;
  use(...handlers: RequestHandler[]): Promise<void>;
}

export type TestType<ComponentFixtures> = BaseTestType<
  copilotbrowserTestArgs & copilotbrowserTestOptions & ComponentFixtures & { router: RouterFixture },
  copilotbrowserWorkerArgs & copilotbrowserWorkerOptions
>;

export function defineConfig(config: copilotbrowserTestConfig): copilotbrowserTestConfig;
export function defineConfig<T>(config: copilotbrowserTestConfig<T>): copilotbrowserTestConfig<T>;
export function defineConfig<T, W>(config: copilotbrowserTestConfig<T, W>): copilotbrowserTestConfig<T, W>;
export function defineConfig(config: copilotbrowserTestConfig, ...configs: copilotbrowserTestConfig[]): copilotbrowserTestConfig;
export function defineConfig<T>(config: copilotbrowserTestConfig<T>, ...configs: copilotbrowserTestConfig<T>[]): copilotbrowserTestConfig<T>;
export function defineConfig<T, W>(config: copilotbrowserTestConfig<T, W>, ...configs: copilotbrowserTestConfig<T, W>[]): copilotbrowserTestConfig<T, W>;

export { expect, devices, Locator } from 'copilotbrowser/test';
