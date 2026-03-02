/* eslint-disable notice/notice */

import { test as baseTest } from '@copilotbrowser/test';

export { expect } from '@copilotbrowser/test';

export const test = baseTest.extend({
  agentOptions: {
    provider: {
      api: 'anthropic',
      apiKey: process.env.AZURE_SONNET_API_KEY!,
      apiEndpoint: process.env.AZURE_SONNET_ENDPOINT!,
      model: 'claude-sonnet-4-5',
    },
  },
  page: async ({ page }, use) => {
    await page.goto('https://demo.copilotbrowser.dev/todomvc');
    await use(page);
  },
});
