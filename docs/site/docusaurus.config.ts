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
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'copilotbrowser',
  tagline: 'A high-level API to automate web browsers',
  favicon: 'img/favicon.ico',

  // future: {
  //   v4: true,
  // },

  url: 'https://dayour.github.io',
  baseUrl: '/copilotbrowser/',

  organizationName: 'dayour',
  projectName: 'copilotbrowser',

  headTags: [
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', sizes: '180x180', href: '/copilotbrowser/img/apple-touch-icon.png' } },
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/copilotbrowser/img/favicon-32x32.png' } },
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/copilotbrowser/img/favicon-16x16.png' } },
    { tagName: 'meta', attributes: { name: 'theme-color', content: '#0b1020' } },
  ],

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    format: 'md',
    hooks: {
      onBrokenMarkdownImages: 'ignore',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../src',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/dayour/copilotbrowser/tree/main/docs/src/',
          async sidebarItemsGenerator({ defaultSidebarItemsGenerator, ...args }) {
            const items = await defaultSidebarItemsGenerator(args);
            return items;
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    announcementBar: {
      id: 'v2_launch',
      content: '🚀 copilotbrowser v2.0 is here — <a href="/copilotbrowser/docs/release-notes-js">see what\'s new</a>',
      backgroundColor: '#312e81',
      textColor: '#e0e7ff',
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'copilotbrowser',
      logo: {
        alt: 'copilotbrowser Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/api/class-copilotbrowser',
          label: 'API',
          position: 'left',
        },
        {
          to: '/install',
          label: 'Install',
          position: 'left',
        },
        {
          type: 'dropdown',
          label: 'Ecosystem',
          position: 'left',
          items: [
            { label: '🐳 Docker', to: '/docs/docker' },
            { label: '💻 VS Code Extension', to: '/docs/getting-started-vscode-js' },
            { label: '🧩 Chrome Extension', to: '/docs/chrome-extensions-js-python' },
            { label: '☁️ CI/CD & Azure', to: '/docs/ci' },
            { label: '🤖 Copilot Studio / MCP', to: '/docs/extensibility' },
            { label: '📸 Trace Viewer', to: '/docs/trace-viewer' },
          ],
        },
        {
          href: 'https://github.com/dayour/copilotbrowser',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Get Started',
          items: [
            { label: 'Installation', to: '/install' },
            { label: 'JavaScript / TypeScript', to: '/docs/intro-js' },
            { label: 'Python', to: '/docs/intro-python' },
            { label: 'Java', to: '/docs/intro-java' },
            { label: 'C# / .NET', to: '/docs/intro-csharp' },
          ],
        },
        {
          title: 'Guides',
          items: [
            { label: 'Writing Tests', to: '/docs/writing-tests-js' },
            { label: 'Locators', to: '/docs/locators' },
            { label: 'Assertions', to: '/docs/test-assertions-js' },
            { label: 'API Testing', to: '/docs/api-testing-js' },
            { label: 'Debugging', to: '/docs/debug' },
          ],
        },
        {
          title: 'Ecosystem',
          items: [
            { label: 'Docker', to: '/docs/docker' },
            { label: 'VS Code Extension', to: '/docs/getting-started-vscode-js' },
            { label: 'Chrome Extension', to: '/docs/chrome-extensions-js-python' },
            { label: 'CI/CD & Azure', to: '/docs/ci' },
            { label: 'Trace Viewer', to: '/docs/trace-viewer' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: 'https://github.com/dayour/copilotbrowser' },
            { label: 'Issues', href: 'https://github.com/dayour/copilotbrowser/issues' },
            { label: 'Releases', to: '/docs/release-notes-js' },
            { label: 'Contributing', href: 'https://github.com/dayour/copilotbrowser/blob/main/CONTRIBUTING.md' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} copilotbrowser contributors. Apache 2.0 License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'csharp', 'python', 'bash', 'powershell', 'json', 'yaml', 'groovy'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
