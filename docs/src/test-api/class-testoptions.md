---
id: class-testoptions
---

# class: TestOptions
> *Added in: v1.10*
>
> **Languages:** JavaScript

copilotbrowser Test provides many options to configure test environment, `Browser`, `BrowserContext` and more.

These options are usually provided in the [configuration file](../test-configuration.md) through **TestConfig.use** and **TestProject.use**.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';
export default defineConfig({
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
  },
});
```

Alternatively, with **Test.use()** you can override some options for a file.

```js title="example.spec.ts"
import { test, expect } from '@copilotbrowser/test';

// Run tests in this file with portrait-like viewport.
test.use({ viewport: { width: 600, height: 900 } });

test('my portrait test', async ({ page }) => {
  // ...
});
```

## property: TestOptions.acceptDownloads = %%-context-option-acceptdownloads-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    acceptDownloads: false,
  },
});
```

## property: TestOptions.agentOptions
> *Added in: v1.58*
>
> **Type:** `Object`
  - `provider` <`Object`>
    - `api` <`PageAgentAPI`<"openai"|"openai-compatible"|"anthropic"|"google">> API to use.
    - `apiEndpoint` ?<`string`> Endpoint to use if different from default.
    - `apiKey` <`string`> API key for the LLM provider.
    - `apiTimeout` ?<`int`> Amount of time to wait for the provider to respond to each request.
    - `model` <`string`> Model identifier within the provider. Required in non-cache mode.
  - `cachePathTemplate` ?<`string`> Cache file template to use/generate code for performed actions into.
  - `limits` <`Object`>
    - `maxTokens` ?<`int`> Maximum number of tokens to consume. The agentic loop will stop after input + output tokens exceed this value. Defaults to unlimited.
    - `maxActions` ?<`int`> Maximum number of agentic actions to generate, defaults to 10.
    - `maxActionRetries` ?<`int`> Maximum number retries per action, defaults to 3.
  - `secrets` ?<`Object`<`string`, `string`>> Secrets to hide from the LLM.
  - `systemPrompt` <`string`> System prompt for the agent's loop.

## property: TestOptions.baseURL = %%-context-option-baseURL-%%
> *Added in: v1.10*

**Usage**

```js
import { defineConfig, devices } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
  },
});
```

## property: TestOptions.browserName
> *Added in: v1.10*
>
> **Type:** `BrowserName<"chromium"|"firefox"|"webkit">`

Name of the browser that runs tests. Defaults to `'chromium'`. Most of the time you should set `browserName` in your `TestConfig`:

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig, devices } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    browserName: 'firefox',
  },
});
```

## property: TestOptions.actionTimeout
> *Added in: v1.10*
>
> **Type:** `int`

Default timeout for each copilotbrowser action in milliseconds, defaults to 0 (no timeout).

This is a default timeout for all copilotbrowser actions, same as configured via **Page.setDefaultTimeout()**.

**Usage**

```js
import { defineConfig, devices } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
  },
});
```

Learn more about [various timeouts](../test-timeouts.md).

## property: TestOptions.bypassCSP = %%-context-option-bypasscsp-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    bypassCSP: true,
  }
});
```

## property: TestOptions.channel = %%-browser-option-channel-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  projects: [
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge'
      },
    },
  ]
});
```

## property: TestOptions.clientCertificates = %%-context-option-clientCertificates-%%
* since: 1.46

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    clientCertificates: [{
      origin: 'https://example.com',
      certPath: './cert.pem',
      keyPath: './key.pem',
      passphrase: 'mysecretpassword',
    }],
  },
});
```

## property: TestOptions.colorScheme = %%-context-option-colorscheme-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    colorScheme: 'dark',
  },
});
```

## property: TestOptions.connectOptions
> *Added in: v1.10*
>
> **Type:** `void|Object`
  - `wsEndpoint` <`string`> A browser websocket endpoint to connect to.
  - `headers` ?<`void`|`Object`<`string`, `string`>> Additional HTTP headers to be sent with web socket connect request. Optional.
  - `timeout` ?<`int`> Timeout in milliseconds for the connection to be established. Optional, defaults to no timeout.
  - `exposeNetwork` ?<`string`> Option to expose network available on the connecting client to the browser being connected to. See **BrowserType.connect()** for more details.


**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    connectOptions: {
      wsEndpoint: 'ws://localhost:5678',
    },
  },
});
```

When connect options are specified, default **Fixtures.browser**, **Fixtures.context** and **Fixtures.page** use the remote browser instead of launching a browser locally, and any launch options like **TestOptions.headless** or **TestOptions.channel** are ignored.

## property: TestOptions.contextOptions
> *Added in: v1.10*
>
> **Type:** `Object`

Options used to create the context, as passed to **Browser.newContext()**. Specific options like **TestOptions.viewport** take priority over this.

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
});
```

## property: TestOptions.deviceScaleFactor = %%-context-option-devicescalefactor-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    viewport: { width: 2560, height: 1440 },
    deviceScaleFactor: 2,
  },
});
```

## property: TestOptions.extraHTTPHeaders = %%-context-option-extrahttpheaders-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    extraHTTPHeaders: {
      'X-My-Header': 'value',
    },
  },
});
```

## property: TestOptions.geolocation = %%-context-option-geolocation-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    geolocation: { longitude: 12.492507, latitude: 41.889938 },
  },
});
```
Learn more about [geolocation](../emulation.md#color-scheme-and-media).

## property: TestOptions.hasTouch = %%-context-option-hastouch-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    hasTouch: true
  },
});
```

## property: TestOptions.headless = %%-browser-option-headless-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    headless: false
  },
});
```

## property: TestOptions.httpCredentials = %%-context-option-httpcredentials-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    httpCredentials: {
      username: 'user',
      password: 'pass',
    },
  },
});
```

## property: TestOptions.ignoreHTTPSErrors = %%-context-option-ignorehttpserrors-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    ignoreHTTPSErrors: true,
  },
});
```

## property: TestOptions.isMobile = %%-context-option-ismobile-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    isMobile: false,
  },
});
```

## property: TestOptions.javaScriptEnabled = %%-context-option-javascriptenabled-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    javaScriptEnabled: false,
  },
});
```


## property: TestOptions.launchOptions
> *Added in: v1.10*
>
> **Type:** `Object`

Options used to launch the browser, as passed to **BrowserType.launch()**. Specific options **TestOptions.headless** and **TestOptions.channel** take priority over this.

:::warning
Use custom browser args at your own risk, as some of them may break copilotbrowser functionality.
:::

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--start-maximized']
        }
      }
    }
  ]
});
```

## property: TestOptions.locale
> *Added in: v1.10*
>
> **Type:** `string`

Specify user locale, for example `en-GB`, `de-DE`, etc. Locale will affect `navigator.language` value, `Accept-Language` request header value as well as number and date formatting rules. Defaults to `en-US`. Learn more about emulation in our [emulation guide](../emulation.md#locale--timezone).

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    locale: 'it-IT',
  },
});
```

## property: TestOptions.navigationTimeout
> *Added in: v1.10*
>
> **Type:** `int`

Timeout for each navigation action in milliseconds. Defaults to 0 (no timeout).

This is a default navigation timeout, same as configured via **Page.setDefaultNavigationTimeout()**.

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    navigationTimeout: 3000,
  },
});
```

Learn more about [various timeouts](../test-timeouts.md).

## property: TestOptions.offline = %%-context-option-offline-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    offline: true
  },
});
```

## property: TestOptions.permissions = %%-context-option-permissions-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    permissions: ['notifications'],
  },
});
```

## property: TestOptions.proxy = %%-browser-option-proxy-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    proxy: {
      server: 'http://myproxy.com:3128',
      bypass: 'localhost',
    },
  },
});
```

## property: TestOptions.screenshot
> *Added in: v1.10*
>
> **Type:** `Object|ScreenshotMode<"off"|"on"|"only-on-failure"|"on-first-failure">`
  - `mode` <`ScreenshotMode`<"off"|"on"|"only-on-failure"|"on-first-failure">> Automatic screenshot mode.
  - `fullPage` ?<`boolean`> When true, takes a screenshot of the full scrollable page, instead of the currently visible viewport. Defaults to `false`.
  - `omitBackground` ?<`boolean`> Hides default white background and allows capturing screenshots with transparency. Not applicable to `jpeg` images. Defaults to `false`.

Whether to automatically capture a screenshot after each test. Defaults to `'off'`.
* `'off'`: Do not capture screenshots.
* `'on'`: Capture screenshot after each test.
* `'only-on-failure'`: Capture screenshot after each test failure.
* `'on-first-failure'`: Capture screenshot after each test's first failure.

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
  },
});
```

Learn more about [automatic screenshots](../test-use-options.md#recording-options).

## property: TestOptions.storageState = %%-js-python-context-option-storage-state-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    storageState: 'storage-state.json',
  },
});
```

**Details**

When storage state is set up in the config, it is possible to reset storage state for a file:

```js title="not-signed-in.spec.ts"
import { test } from '@copilotbrowser/test';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('not signed in test', async ({ page }) => {
  // ...
});
```

## property: TestOptions.testIdAttribute
> *Added in: v1.27*

Custom attribute to be used in **Page.getByTestId()**. `data-testid` is used by default.

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    testIdAttribute: 'pw-test-id',
  },
});
```

## property: TestOptions.timezoneId = %%-context-option-timezoneid-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    timezoneId: 'Europe/Rome',
  },
});
```

## property: TestOptions.trace
> *Added in: v1.10*
>
> **Type:** `Object|TraceMode<"off"|"on"|"retain-on-failure"|"on-first-retry"|"retain-on-first-failure">`
  - `mode` <`TraceMode`<"off"|"on"|"retain-on-failure"|"on-first-retry"|"on-all-retries"|"retain-on-first-failure">> Trace recording mode.
  - `attachments` ?<`boolean`> Whether to include test attachments. Defaults to true. Optional.
  - `screenshots` ?<`boolean`> Whether to capture screenshots during tracing. Screenshots are used to build a timeline preview. Defaults to true. Optional.
  - `snapshots` ?<`boolean`> Whether to capture DOM snapshot on every action. Defaults to true. Optional.
  - `sources` ?<`boolean`> Whether to include source files for trace actions. Defaults to true. Optional.

Whether to record trace for each test. Defaults to `'off'`.
* `'off'`: Do not record trace.
* `'on'`: Record trace for each test.
* `'on-first-retry'`: Record trace only when retrying a test for the first time.
* `'on-all-retries'`: Record trace only when retrying a test.
* `'retain-on-failure'`: Record trace for each test. When test run passes, remove the recorded trace.
* `'retain-on-first-failure'`: Record trace for the first run of each test, but not for retries. When test run passes, remove the recorded trace.

For more control, pass an object that specifies `mode` and trace features to enable.

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    trace: 'on-first-retry'
  },
});
```

Learn more about [recording trace](../test-use-options.md#recording-options).

## property: TestOptions.userAgent = %%-context-option-useragent-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    userAgent: 'some custom ua',
  },
});
```

## property: TestOptions.video
> *Added in: v1.10*
>
> **Type:** `Object|VideoMode<"off"|"on"|"retain-on-failure"|"on-first-retry">`
  - `mode` <`VideoMode`<"off"|"on"|"retain-on-failure"|"on-first-retry">> Video recording mode.
  - `size` ?<`Object`> Size of the recorded video. Optional.
    - `width` <`int`>
    - `height` <`int`>

Whether to record video for each test. Defaults to `'off'`.
* `'off'`: Do not record video.
* `'on'`: Record video for each test.
* `'retain-on-failure'`: Record video for each test, but remove all videos from successful test runs.
* `'on-first-retry'`: Record video only when retrying a test for the first time.

To control video size, pass an object with `mode` and `size` properties. If video size is not specified, it will be equal to **TestOptions.viewport** scaled down to fit into 800x800. If `viewport` is not configured explicitly the video size defaults to 800x450. Actual picture of each page will be scaled down if necessary to fit the specified size.

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    video: 'on-first-retry',
  },
});
```

Learn more about [recording video](../test-use-options.md#recording-options).

## property: TestOptions.viewport = %%-context-option-viewport-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    viewport: { width: 100, height: 100 },
  },
});
```

## property: TestOptions.serviceWorkers = %%-context-option-service-worker-policy-%%
> *Added in: v1.10*

**Usage**

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  use: {
    serviceWorkers: 'allow'
  },
});
```
