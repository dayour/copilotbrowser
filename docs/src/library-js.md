---
id: library-js
title: "Library"
sidebar_label: "Library (JavaScript)"
---

## Introduction

copilotbrowser Library provides unified APIs for launching and interacting with browsers, while copilotbrowser Test provides all this plus a fully managed end-to-end Test Runner and experience.

Under most circumstances, for end-to-end testing, you'll want to use `@copilotbrowser/test` (copilotbrowser Test), and not `copilotbrowser` (copilotbrowser Library) directly. To get started with copilotbrowser Test, follow the [Getting Started Guide](./intro.md).

## Differences when using library

### Library Example

The following is an example of using the copilotbrowser Library directly to launch Chromium, go to a page, and check its title:


```js tab=js-ts
import { chromium, devices } from 'copilotbrowser';
import assert from 'node:assert';

(async () => {
  // Setup
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['iPhone 11']);
  const page = await context.newPage();

  // The actual interesting bit
  await context.route('**.jpg', route => route.abort());
  await page.goto('https://example.com/');

  assert(await page.title() === 'Example Domain'); // 👎 not a Web First assertion

  // Teardown
  await context.close();
  await browser.close();
})();
```

```js tab=js-js
const assert = require('node:assert');
const { chromium, devices } = require('copilotbrowser');

(async () => {
  // Setup
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['iPhone 11']);
  const page = await context.newPage();

  // The actual interesting bit
  await context.route('**.jpg', route => route.abort());
  await page.goto('https://example.com/');

  assert(await page.title() === 'Example Domain'); // 👎 not a Web First assertion

  // Teardown
  await context.close();
  await browser.close();
})();
```

Run it with `node my-script.js`.

### Test Example

A test to achieve similar behavior, would look like:

```js tab=js-ts
import { expect, test, devices } from '@copilotbrowser/test';

test.use(devices['iPhone 11']);

test('should be titled', async ({ page, context }) => {
  await context.route('**.jpg', route => route.abort());
  await page.goto('https://example.com/');

  await expect(page).toHaveTitle('Example');
});
```

```js tab=js-js
const { expect, test, devices } = require('@copilotbrowser/test');

test.use(devices['iPhone 11']);

test('should be titled', async ({ page, context }) => {
  await context.route('**.jpg', route => route.abort());
  await page.goto('https://example.com/');

  await expect(page).toHaveTitle('Example');
});
```

Run it with `npx copilotbrowser test`.

### Key Differences

The key differences to note are as follows:

| | Library | Test |
| - | - | - |
| Installation | `npm install copilotbrowser` | `npm init copilotbrowser@latest` - note `install` vs. `init` |
| Install browsers | Install `@copilotbrowser/browser-chromium`, `@copilotbrowser/browser-firefox` and/or `@copilotbrowser/browser-webkit` | `npx copilotbrowser install` or `npx copilotbrowser install chromium` for a single one |
| `import` from | `copilotbrowser` | `@copilotbrowser/test` |
| Initialization | Explicitly need to: <ol><li>Pick a browser to use, e.g. `chromium`</li><li>Launch browser with **BrowserType.launch()**</li><li>Create a context with **Browser.newContext()**, <em>and</em> pass any context options explicitly, e.g. `devices['iPhone 11']`</li><li>Create a page with **BrowserContext.newPage()**</li></ol> | An isolated `page` and `context` are provided to each test out-of the box, along with other [built-in fixtures](./test-fixtures.md#built-in-fixtures). No explicit creation. If referenced by the test in its arguments, the Test Runner will create them for the test. (i.e. lazy-initialization) |
| Assertions | No built-in Web-First Assertions | [Web-First assertions](./test-assertions.md) like: <ul><li>**PageAssertions.toHaveTitle()**</li><li>**PageAssertions.toHaveScreenshot()**</li></ul> which auto-wait and retry for the condition to be met.|
| Timeouts | Defaults to 30s for most operations. | Most operations don't time out, but every test has a timeout that makes it fail (30s by default). |
| Cleanup | Explicitly need to: <ol><li>Close context with **BrowserContext.close()**</li><li>Close browser with **Browser.close()**</li></ol> | No explicit close of [built-in fixtures](./test-fixtures.md#built-in-fixtures); the Test Runner will take care of it.
| Running | When using the Library, you run the code as a node script, possibly with some compilation first. | When using the Test Runner, you use the `npx copilotbrowser test` command. Along with your [config](./test-configuration.md), the Test Runner handles any compilation and choosing what to run and how to run it. |

In addition to the above, copilotbrowser Test, as a full-featured Test Runner, includes:

- [Configuration Matrix and Projects](./test-configuration.md): In the above example, in the copilotbrowser Library version, if we wanted to run with a different device or browser, we'd have to modify the script and plumb the information through. With copilotbrowser Test, we can just specify the [matrix of configurations](./test-configuration.md) in one place, and it will create run the one test under each of these configurations.
- [Parallelization](./test-parallel.md)
- [Web-First Assertions](./test-assertions.md)
- [Reporting](./test-reporters.md)
- [Retries](./test-retries.md)
- [Easily Enabled Tracing](./trace-viewer-intro.md)
- and more…

## Usage

Use npm or Yarn to install copilotbrowser library in your Node.js project. See [system requirements](./intro.md#system-requirements).

```bash
npm i -D copilotbrowser
```

You will also need to install browsers - either manually or by adding a package that will do it for you automatically.

```bash
# Download the Chromium, Firefox and WebKit browser
npx copilotbrowser install chromium firefox webkit

# Alternatively, add packages that will download a browser upon npm install
npm i -D @copilotbrowser/browser-chromium @copilotbrowser/browser-firefox @copilotbrowser/browser-webkit
```

See [managing browsers](./browsers.md#managing-browser-binaries) for more options.

Once installed, you can import copilotbrowser in a Node.js script, and launch any of the 3 browsers (`chromium`, `firefox` and `webkit`).

```js
const { chromium } = require('copilotbrowser');

(async () => {
  const browser = await chromium.launch();
  // Create pages, interact with UI elements, assert values
  await browser.close();
})();
```

copilotbrowser APIs are asynchronous and return Promise objects. Our code examples use [the async/await pattern](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await) to ease readability. The code is wrapped in an unnamed async arrow function which is invoking itself.

```js
(async () => { // Start of async arrow function
  // Function code
  // ...
})(); // End of the function and () to invoke itself
```

## First script

In our first script, we will navigate to `https://dayour.github.io/copilotbrowser/` and take a screenshot in WebKit.

```js
const { webkit } = require('copilotbrowser');

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto('https://dayour.github.io/copilotbrowser/');
  await page.screenshot({ path: `example.png` });
  await browser.close();
})();
```

By default, copilotbrowser runs the browsers in headless mode. To see the browser UI, pass the `headless: false` flag while launching the browser. You can also use `slowMo` to slow down execution. Learn more in the debugging tools [section](./debug.md).

```js
firefox.launch({ headless: false, slowMo: 50 });
```

## Record scripts

[Command line tools](./test-cli.md) can be used to record user interactions and generate JavaScript code.

```bash
npx copilotbrowser codegen wikipedia.org
```

## Browser downloads

To download copilotbrowser browsers run:

```bash
# Explicitly download browsers
npx copilotbrowser install
```

Alternatively, you can add `@copilotbrowser/browser-chromium`, `@copilotbrowser/browser-firefox` and `@copilotbrowser/browser-webkit` packages to automatically download the respective browser during the package installation.

```bash
# Use a helper package that downloads a browser on npm install
npm install @copilotbrowser/browser-chromium
```

**Download behind a firewall or a proxy**

Pass `HTTPS_PROXY` environment variable to download through a proxy.

```bash tab=bash-bash lang=js
# Manual
HTTPS_PROXY=https://192.0.2.1 npx copilotbrowser install

# Through @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
HTTPS_PROXY=https://192.0.2.1 npm install
```

```batch tab=bash-batch lang=js
# Manual
set HTTPS_PROXY=https://192.0.2.1
npx copilotbrowser install

# Through @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
set HTTPS_PROXY=https://192.0.2.1
npm install
```

```powershell tab=bash-powershell lang=js
# Manual
$Env:HTTPS_PROXY=https://192.0.2.1
npx copilotbrowser install

# Through @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
$Env:HTTPS_PROXY=https://192.0.2.1
npm install
```

**Download from artifact repository**

By default, copilotbrowser downloads browsers from Microsoft's CDN. Pass `copilotbrowser_DOWNLOAD_HOST` environment variable to download from an internal artifacts repository instead.

```bash tab=bash-bash lang=js
# Manual
copilotbrowser_DOWNLOAD_HOST=192.0.2.1 npx copilotbrowser install

# Through @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
copilotbrowser_DOWNLOAD_HOST=192.0.2.1 npm install
```

```batch tab=bash-batch lang=js
# Manual
set copilotbrowser_DOWNLOAD_HOST=192.0.2.1
npx copilotbrowser install

# Through @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
set copilotbrowser_DOWNLOAD_HOST=192.0.2.1
npm install
```

```powershell tab=bash-powershell lang=js
# Manual
$Env:copilotbrowser_DOWNLOAD_HOST=192.0.2.1
npx copilotbrowser install

# Through @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
$Env:copilotbrowser_DOWNLOAD_HOST=192.0.2.1
npm install
```

**Skip browser download**

In certain cases, it is desired to avoid browser downloads altogether because browser binaries are managed separately. This can be done by setting `copilotbrowser_SKIP_BROWSER_DOWNLOAD` variable before installing packages.

```bash tab=bash-bash lang=js
# When using @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
copilotbrowser_SKIP_BROWSER_DOWNLOAD=1 npm install
```

```batch tab=bash-batch lang=js
# When using @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
set copilotbrowser_SKIP_BROWSER_DOWNLOAD=1
npm install
```

```powershell tab=bash-powershell lang=js
# When using @copilotbrowser/browser-chromium, @copilotbrowser/browser-firefox
# and @copilotbrowser/browser-webkit helper packages
$Env:copilotbrowser_SKIP_BROWSER_DOWNLOAD=1
npm install
```

## TypeScript support

copilotbrowser includes built-in support for TypeScript. Type definitions will be imported automatically. It is recommended to use type-checking to improve the IDE experience.

### In JavaScript
Add the following to the top of your JavaScript file to get type-checking in VS Code or WebStorm.

```js
// @ts-check
// ...
```

Alternatively, you can use JSDoc to set types for variables.

```js
/** @type {import('copilotbrowser').Page} */
let page;
```

### In TypeScript
TypeScript support will work out-of-the-box. Types can also be imported explicitly.

```js
let page: import('copilotbrowser').Page;
```
