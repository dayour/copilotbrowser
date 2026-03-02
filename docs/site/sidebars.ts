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
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'intro-js',
        'intro-python',
        'intro-java',
        'intro-csharp',
        'getting-started-vscode-js',
      ],
    },
    {
      type: 'category',
      label: 'Writing Tests',
      items: [
        'writing-tests-js',
        'writing-tests-java',
        'writing-tests-python',
        'writing-tests-csharp',
      ],
    },
    {
      type: 'category',
      label: 'Running Tests',
      items: [
        'running-tests-js',
        'running-tests-java',
        'running-tests-python',
        'running-tests-csharp',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'locators',
        'actionability',
        'pages',
        'frames',
        'browser-contexts',
        'browsers',
        'navigations',
        'evaluating',
        'handles',
        'events',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'auth',
        'best-practices-js',
        'clock',
        'codegen-intro',
        'codegen',
        'debug',
        'dialogs',
        'downloads',
        'emulation',
        'input',
        'mock',
        'mock-browser-js',
        'network',
        'other-locators',
        'pom',
        'screenshots',
        'touch-events',
        'videos',
        'selenium-grid',
        'webview2',
      ],
    },
    {
      type: 'category',
      label: 'Test Configuration',
      items: [
        'test-configuration-js',
        'test-use-options-js',
        'test-projects-js',
        'test-fixtures-js',
        'test-annotations-js',
        'test-parameterize-js',
        'test-parallel-js',
        'test-retries-js',
        'test-sharding-js',
        'test-timeouts-js',
        'test-typescript-js',
        'test-global-setup-teardown-js',
        'test-webserver-js',
        'test-snapshots-js',
        'test-components-js',
        'test-reporters-js',
        'test-cli-js',
        'test-ui-mode-js',
        'test-agents-js',
      ],
    },
    {
      type: 'category',
      label: 'Assertions',
      items: [
        'test-assertions-js',
        'test-assertions-csharp-java-python',
        'aria-snapshots',
      ],
    },
    {
      type: 'category',
      label: 'API Testing',
      items: [
        'api-testing-js',
        'api-testing-java',
        'api-testing-python',
        'api-testing-csharp',
      ],
    },
    {
      type: 'category',
      label: 'Accessibility Testing',
      items: [
        'accessibility-testing-js',
        'accessibility-testing-java',
      ],
    },
    {
      type: 'category',
      label: 'Ecosystem & Integrations',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Docker',
          items: ['docker'],
        },
        {
          type: 'category',
          label: 'VS Code Extension',
          items: ['getting-started-vscode-js'],
        },
        {
          type: 'category',
          label: 'Chrome Extension',
          items: ['chrome-extensions-js-python'],
        },
        {
          type: 'category',
          label: 'CI/CD & Azure',
          items: ['ci-intro', 'ci'],
        },
        {
          type: 'category',
          label: 'MCP & Copilot Studio',
          items: ['extensibility'],
        },
        {
          type: 'category',
          label: 'Trace Viewer',
          items: [
            'trace-viewer-intro-js',
            'trace-viewer-intro-csharp',
            'trace-viewer-intro-java-python',
            'trace-viewer',
          ],
        },
        {
          type: 'category',
          label: 'Service Workers',
          items: ['service-workers-js-python'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Library Mode',
      items: [
        'library-js',
        'library-csharp',
        'library-python',
        'languages',
      ],
    },
    {
      type: 'category',
      label: 'Test Runners',
      items: [
        'test-runners-csharp',
        'test-runners-java',
        'test-runners-python',
        'junit-java',
        'threading-java',
      ],
    },
    {
      type: 'category',
      label: 'Migrations',
      items: [
        'protractor-js',
        'puppeteer-js',
        'testing-library-js',
        'canary-releases-js',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [{ type: 'autogenerated', dirName: 'api' }],
    },
    {
      type: 'category',
      label: 'Test API Reference',
      items: [{ type: 'autogenerated', dirName: 'test-api' }],
    },
    {
      type: 'category',
      label: 'Test Reporter API',
      items: [{ type: 'autogenerated', dirName: 'test-reporter-api' }],
    },
    {
      type: 'category',
      label: 'Release Notes',
      items: [
        'release-notes-js',
        'release-notes-java',
        'release-notes-python',
        'release-notes-csharp',
      ],
    },
  ],
};

export default sidebars;
