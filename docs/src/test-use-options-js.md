---
id: test-use-options-js
title: "Configuration (use)"
---

## Introduction

In addition to configuring the test runner you can also configure [Emulation](#emulation-options), [Network](#network-options) and [Recording](#recording-options) for the `Browser` or `BrowserContext`. These options are passed to the `use: {}` object in the copilotbrowser config.

### Basic Options

Set the base URL and storage state for all tests:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:3000',

    // Populates context with given storage state.
    storageState: 'state.json',
  },
});
```


| Option | Description |
| :- | :- |
| **TestOptions.baseURL** | Base URL used for all pages in the context. Allows navigating by using just the path, for example `page.goto('/settings')`. |
| **TestOptions.storageState** | Populates context with given storage state. Useful for easy authentication, [learn more](./auth.md). |

### Emulation Options

With copilotbrowser you can emulate a real device such as a mobile phone or tablet. See our [guide on projects](./test-projects.md) for more info on emulating devices. You can also emulate the `"geolocation"`, `"locale"` and `"timezone"` for all tests or for a specific test as well as set the `"permissions"` to show notifications or change the `"colorScheme"`. See our [Emulation](./emulation.md) guide to learn more.


```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    // Emulates `'prefers-colors-scheme'` media feature.
    colorScheme: 'dark',

    // Context geolocation.
    geolocation: { longitude: 12.492507, latitude: 41.889938 },

    // Emulates the user locale.
    locale: 'en-GB',

    // Grants specified permissions to the browser context.
    permissions: ['geolocation'],

    // Emulates the user timezone.
    timezoneId: 'Europe/Paris',

    // Viewport used for all pages in the context.
    viewport: { width: 1280, height: 720 },
  },
});
```

| Option | Description |
| :- | :- |
| **TestOptions.colorScheme** | [Emulates](./emulation.md#color-scheme-and-media) `'prefers-colors-scheme'` media feature, supported values are `'light'` and `'dark'` |
| **TestOptions.geolocation** | Context [geolocation](./emulation.md#geolocation). |
| **TestOptions.locale** | [Emulates](./emulation.md#locale--timezone) the user locale, for example `en-GB`, `de-DE`, etc. |
| **TestOptions.permissions** | A list of [permissions](./emulation.md#permissions) to grant to all pages in the context. |
| **TestOptions.timezoneId** | Changes the [timezone](./emulation.md#locale--timezone) of the context. |
| **TestOptions.viewport** | [Viewport](./emulation.md#viewport) used for all pages in the context. |

### Network Options

Available options to configure networking:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    // Whether to automatically download all the attachments.
    acceptDownloads: false,

    // An object containing additional HTTP headers to be sent with every request.
    extraHTTPHeaders: {
      'X-My-Header': 'value',
    },

    // Credentials for HTTP authentication.
    httpCredentials: {
      username: 'user',
      password: 'pass',
    },

    // Whether to ignore HTTPS errors during navigation.
    ignoreHTTPSErrors: true,

    // Whether to emulate network being offline.
    offline: true,

    // Proxy settings used for all pages in the test.
    proxy: {
      server: 'http://myproxy.com:3128',
      bypass: 'localhost',
    },
  },
});
```

| Option | Description |
| :- | :- |
| **TestOptions.acceptDownloads** | Whether to automatically download all the attachments, defaults to `true`. [Learn more](./downloads.md) about working with downloads. |
| **TestOptions.extraHTTPHeaders** | An object containing additional HTTP headers to be sent with every request. All header values must be strings. |
| **TestOptions.httpCredentials** | Credentials for [HTTP authentication](./network.md#http-authentication). |
| **TestOptions.ignoreHTTPSErrors** | Whether to ignore HTTPS errors during navigation. |
| **TestOptions.offline** | Whether to emulate network being offline. |
| **TestOptions.proxy** | [Proxy settings](./network.md#http-proxy) used for all pages in the test. |


:::note
You don't have to configure anything to mock network requests. Just define a custom `Route` that mocks the network for a browser context. See our [network mocking guide](./network.md) to learn more.
:::

### Recording Options

With copilotbrowser you can capture screenshots, record videos as well as traces of your test. By default these are turned off but you can enable them by setting the `screenshot`, `video` and `trace` options in your `copilotbrowser.config.js` file.

Trace files, screenshots and videos will appear in the test output directory, typically `test-results`.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    // Capture screenshot after each test failure.
    screenshot: 'only-on-failure',

    // Record trace only when retrying a test for the first time.
    trace: 'on-first-retry',

    // Record video only when retrying a test for the first time.
    video: 'on-first-retry'
  },
});
```

| Option | Description |
| :- | :- |
| **TestOptions.screenshot** | Capture [screenshots](./screenshots.md) of your test. Options include `'off'`, `'on'` and `'only-on-failure'` |
| **TestOptions.trace** | copilotbrowser can produce test traces while running the tests. Later on, you can view the trace and get detailed information about copilotbrowser execution by opening [Trace Viewer](./trace-viewer.md). Options include: `'off'`, `'on'`, `'retain-on-failure'` and `'on-first-retry'`  |
| **TestOptions.video** | copilotbrowser can record [videos](./videos.md) for your tests. Options include: `'off'`, `'on'`, `'retain-on-failure'` and `'on-first-retry'` |


### Other Options

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    // Maximum time each action such as `click()` can take. Defaults to 0 (no limit).
    actionTimeout: 0,

    // Name of the browser that runs tests. For example `chromium`, `firefox`, `webkit`.
    browserName: 'chromium',

    // Toggles bypassing Content-Security-Policy.
    bypassCSP: true,

    // Channel to use, for example "chrome", "chrome-beta", "msedge", "msedge-beta".
    channel: 'chrome',

    // Run browser in headless mode.
    headless: false,

    // Change the default data-testid attribute.
    testIdAttribute: 'pw-test-id',
  },
});
```

| Option | Description |
| :- | :- |
| **TestOptions.actionTimeout** | Timeout for each copilotbrowser action in milliseconds. Defaults to `0` (no timeout). Learn more about [timeouts](./test-timeouts.md) and how to set them for a single test. |
| **TestOptions.browserName** | Name of the browser that runs tests. Defaults to 'chromium'. Options include `chromium`, `firefox`, or `webkit`. |
| **TestOptions.bypassCSP** |Toggles bypassing Content-Security-Policy. Useful when CSP includes the production origin. Defaults to `false`. |
| **TestOptions.channel** | Browser channel to use. [Learn more](./browsers.md) about different browsers and channels. |
| **TestOptions.headless** | Whether to run the browser in headless mode meaning no browser is shown when running tests. Defaults to `true`. |
| **TestOptions.testIdAttribute** | Changes the default [`data-testid` attribute](./locators.md#locate-by-test-id) used by copilotbrowser locators. |

### More browser and context options

Any options accepted by **BrowserType.launch()**, **Browser.newContext()** or **BrowserType.connect()** can be put into `launchOptions`, `contextOptions` or `connectOptions` respectively in the `use` section.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    launchOptions: {
      slowMo: 50,
    },
  },
});
```

However, most common ones like `headless` or `viewport` are available directly in the `use` section - see [basic options](#basic-options), [emulation](#emulation-options) or [network](#network-options).

### Explicit Context Creation and Option Inheritance

If using the built-in `browser` fixture, calling **Browser.newContext()** will create a context with options inherited from the config:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    userAgent: 'some custom ua',
    viewport: { width: 100, height: 100 },
  },
});
```

An example test illustrating the initial context options are set:

```js
test('should inherit use options on context when using built-in browser fixture', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  expect(await page.evaluate(() => navigator.userAgent)).toBe('some custom ua');
  expect(await page.evaluate(() => window.innerWidth)).toBe(100);
  await context.close();
});
```

### Configuration Scopes

You can configure copilotbrowser globally, per project, or per test. For example, you can set the locale to be used globally by adding `locale` to the `use` option of the copilotbrowser config, and then override it for a specific project using the `project` option in the config. You can also override it for a specific test by adding `test.use({})` in the test file and passing in the options.


```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    locale: 'en-GB'
  },
});
```

You can override options for a specific project using the `project` option in the copilotbrowser config.

```js
import { defineConfig, devices } from '@copilotbrowser/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'de-DE',
      },
    },
  ],
});
```

You can override options for a specific test file by using the `test.use()` method and passing in the options. For example to run tests with the French locale for a specific test:

```js
import { test, expect } from '@copilotbrowser/test';

test.use({ locale: 'fr-FR' });

test('example', async ({ page }) => {
  // ...
});
```

The same works inside a describe block. For example to run tests in a describe block with the French locale:

```js
import { test, expect } from '@copilotbrowser/test';

test.describe('french language block', () => {

  test.use({ locale: 'fr-FR' });

  test('example', async ({ page }) => {
    // ...
  });
});
```

### Reset an option

You can reset an option to the value defined in the config file. Consider the following config that sets a `baseURL`:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    baseURL: 'https://copilotbrowser.dev',
  },
});
```

You can now configure `baseURL` for a file, and also opt-out for a single test.

```js title="intro.spec.ts"
import { test } from '@copilotbrowser/test';

// Configure baseURL for this file.
test.use({ baseURL: 'https://dayour.github.io/copilotbrowser/docs/intro' });

test('check intro contents', async ({ page }) => {
  // This test will use "https://dayour.github.io/copilotbrowser/docs/intro" base url as defined above.
});

test.describe(() => {
  // Reset the value to a config-defined one.
  test.use({ baseURL: undefined });

  test('can navigate to intro from the home page', async ({ page }) => {
    // This test will use "https://copilotbrowser.dev" base url as defined in the config.
  });
});
```

If you would like to completely reset the value to `undefined`, use a long-form fixture notation.

```js title="intro.spec.ts"
import { test } from '@copilotbrowser/test';

// Completely unset baseURL for this file.
test.use({
  baseURL: [async ({}, use) => use(undefined), { scope: 'test' }],
});

test('no base url', async ({ page }) => {
  // This test will not have a base url.
});
```
