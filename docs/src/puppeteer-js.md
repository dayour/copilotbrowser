---
id: puppeteer-js
title: "Migrating from Puppeteer"
---

## Migration Principles

This guide describes migration to [copilotbrowser Library](./library) and [copilotbrowser Test](./intro.md) from Puppeteer. The APIs have similarities, but copilotbrowser offers much more possibilities for web testing and cross-browser automation.

- Most Puppeteer APIs can be used as is
- The use of `ElementHandle` is discouraged, use `Locator` objects and web-first assertions instead.
- copilotbrowser is cross-browser
- You probably don't need explicit wait

## Cheat Sheet

| Puppeteer                                          | copilotbrowser Library                          |
|----------------------------------------------------|---------------------------------------------|
| `await puppeteer.launch()`                         | `await copilotbrowser.chromium.launch()`        |
| `puppeteer.launch({product: 'firefox'})`           | `await copilotbrowser.firefox.launch()`         |
|  WebKit is not supported by Puppeteer              | `await copilotbrowser.webkit.launch()`          |
| `await browser.createIncognitoBrowserContext(...)` | `await browser.newContext(...)`             |
| `await page.setViewport(...)`                      | `await page.setViewportSize(...)`           |
| `await page.waitForXPath(XPathSelector)`           | `await page.waitForSelector(XPathSelector)` |
| `await page.waitForNetworkIdle(...)`               | `await page.waitForLoadState('networkidle')` |
| `await page.$eval(...)`                            | [Assertions](./test-assertions) can often be used instead to verify text, attribute, class... |
| `await page.$(...)`                                | Discouraged, use [Locators](./api/class-locator) instead |
| `await page.$x(xpath_selector)`                    | Discouraged, use [Locators](./api/class-locator) instead |
| No methods dedicated to checkbox or radio input    | `await page.locator(selector).check()`<br/>`await page.locator(selector).uncheck()` |
| `await page.click(selector)`                       | `await page.locator(selector).click()`      |
| `await page.focus(selector)`                       | `await page.locator(selector).focus()`      |
| `await page.hover(selector)`                       | `await page.locator(selector).hover()`      |
| `await page.select(selector, values)`              | `await page.locator(selector).selectOption(values)` |
| `await page.tap(selector)`                         | `await page.locator(selector).tap()`        |
| `await page.type(selector, ...)`                   | `await page.locator(selector).fill(...)` |
| `await page.waitForFileChooser(...)`<br/>`await elementHandle.uploadFile(...)` | `await page.locator(selector).setInputFiles(...)` |
| `await page.cookies([...urls])`                    | `await browserContext.cookies(`urls`)`      |
| `await page.deleteCookie(...cookies)`              | `await browserContext.clearCookies()`       |
| `await page.setCookie(...cookies)`                 | `await browserContext.addCookies(cookies)`  |
| `page.on(...)`                                     | `page.on(...)`<br/>In order to intercept and mutate requests, see **Page.route()** |

`page.waitForNavigation` and `page.waitForSelector` remain, but in many cases will not be necessary due to [auto-waiting](./actionability).

The use of `ElementHandle` is discouraged, use `Locator` objects and web-first assertions instead.

Locators are the central piece of copilotbrowser's auto-waiting and retry-ability. Locators are strict. This means that all operations on locators that imply some target DOM element will throw an exception if more than one element matches a given selector.

## Examples

### Automation example

Puppeteer:

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://dayour.github.io/copilotbrowser/', {
    waitUntil: 'networkidle2',
  });
  await page.screenshot({ path: 'example.png' });
  await browser.close();
})();
```

Line-by-line migration to copilotbrowser:

```js
const { chromium } = require('copilotbrowser'); // 1

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage(); // 2
  await page.setViewportSize({ width: 1280, height: 800 }); // 3
  await page.goto('https://dayour.github.io/copilotbrowser/', {
    waitUntil: 'networkidle', // 4
  });
  await page.screenshot({ path: 'example.png' });
  await browser.close();
})();
```

Migration highlights (see inline comments in the copilotbrowser code snippet):

1. Each copilotbrowser Library file has explicit import of `chromium`. Other browsers `webkit` or `firefox` can be used.
1. For browser state isolation, consider [browser contexts](./browser-contexts.md)
1. `setViewport` becomes `setViewportSize`
1. `networkidle2` becomes `networkidle`. Please note that in most cases it is not useful, thanks to auto-waiting.

### Test example

Puppeteer with Jest:

```js
import puppeteer from 'puppeteer';

describe('copilotbrowser homepage', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  it('contains hero title', async () => {
    await page.goto('https://dayour.github.io/copilotbrowser/');
    await page.waitForSelector('.hero__title');
    const text = await page.$eval('.hero__title', e => e.textContent);
    expect(text).toContain('copilotbrowser enables reliable end-to-end testing'); // 5
  });

  afterAll(() => browser.close());
});
```
Line-by-line migration to copilotbrowser Test:

```js
import { test, expect } from '@copilotbrowser/test'; // 1

test.describe('copilotbrowser homepage', () => {
  test('contains hero title', async ({ page }) => { // 2, 3
    await page.goto('https://dayour.github.io/copilotbrowser/');
    const titleLocator = page.locator('.hero__title'); // 4
    await expect(titleLocator).toContainText( // 5
        'copilotbrowser enables reliable end-to-end testing'
    );
  });
});
```

1. Each copilotbrowser Test file has explicit import of the `test` and `expect` functions
1. Test function is marked with `async`
1. copilotbrowser Test is given a `page` as one of its parameters. This is one of the many [useful fixtures](./api/class-fixtures) in copilotbrowser Test.
copilotbrowser Test creates an isolated `Page` object for each test. However, if you'd like to reuse a single `Page` object between multiple tests, you can create your own in **Test.beforeAll()** and close it in **Test.afterAll()**.
1. Locator creation with **Page.locator()** is one of the few methods that is sync.
1. Use [assertions](./test-assertions) to verify the state instead of `page.$eval()`.

## Testing

To improve testing, it is advised to use [Locators](./api/class-locator) and web-first [Assertions](./test-assertions). See [Writing Tests](./writing-tests)

It is common with Puppeteer to use `page.evaluate()` or `page.$eval()` to inspect an `ElementHandle` and extract the value of text content, attribute, class... Web-first [Assertions](./test-assertions) offers several matchers for this purpose, it is more reliable and readable.

[copilotbrowser Test](./intro.md) is our first-party recommended test runner to be used with copilotbrowser. It provides several features like Page Object Model, parallelism, fixtures or reporters.

## copilotbrowser Test Super Powers

Once you're on copilotbrowser Test, you get a lot!

- Full zero-configuration TypeScript support
- Run tests across **all web engines** (Chrome, Firefox, Safari) on **any popular operating system** (Windows, macOS, Ubuntu)
- Full support for multiple origins, [(i)frames](./api/class-frame), [tabs and contexts](./pages)
- Run tests in isolation in parallel across multiple browsers
- Built-in test [artifact collection](./test-use-options.md#recording-options)

You also get all these ✨ awesome tools ✨ that come bundled with copilotbrowser Test:
- [copilotbrowser Inspector](./debug.md)
- [copilotbrowser Test Code generation](./codegen-intro.md)
- [copilotbrowser Tracing](./trace-viewer.md) for post-mortem debugging

## Further Reading

Learn more about copilotbrowser Test runner:

- [Getting Started](./intro)
- [Fixtures](./test-fixtures)
- [Locators](./locators.md)
- [Assertions](./test-assertions)
- [Auto-waiting](./actionability)
