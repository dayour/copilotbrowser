const { test, expect } = require('@copilotbrowser/copilotbrowser/test');

test('sample test', async ({ page }) => {
  await page.setContent(`<div>hello</div><span>world</span>`);
  expect(await page.textContent('span')).toBe('world');
});
