---
id: class-copilotbrowser
---

# class: copilotbrowser
> *Added in: v1.8*

copilotbrowser module provides a method to launch a browser instance. The following is a typical example of using copilotbrowser
to drive automation:

```js
const { chromium, firefox, webkit } = require('copilotbrowser');

(async () => {
  const browser = await chromium.launch();  // Or 'firefox' or 'webkit'.
  const page = await browser.newPage();
  await page.goto('http://example.com');
  // other actions...
  await browser.close();
})();
```

```java
import com.microsoft.copilotbrowser.*;

public class Example {
  public static void main(String[] args) {
    try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
      BrowserType chromium = copilotbrowser.chromium();
      Browser browser = chromium.launch();
      Page page = browser.newPage();
      page.navigate("http://example.com");
      // other actions...
      browser.close();
    }
  }
}
```

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, copilotbrowser

async def run(copilotbrowser: copilotbrowser):
    chromium = copilotbrowser.chromium # or "firefox" or "webkit".
    browser = await chromium.launch()
    page = await browser.new_page()
    await page.goto("http://example.com")
    # other actions...
    await browser.close()

async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)
asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser, copilotbrowser

def run(copilotbrowser: copilotbrowser):
    chromium = copilotbrowser.chromium # or "firefox" or "webkit".
    browser = chromium.launch()
    page = browser.new_page()
    page.goto("http://example.com")
    # other actions...
    browser.close()

with sync_copilotbrowser() as copilotbrowser:
    run(copilotbrowser)
```

```csharp
using Microsoft.copilotbrowser;
using System.Threading.Tasks;

class copilotbrowserExample
{
    public static async Task Main()
    {
        using var copilotbrowser = await copilotbrowser.CreateAsync();
        await using var browser = await copilotbrowser.Chromium.LaunchAsync();
        var page = await browser.NewPageAsync();

        await page.GotoAsync("https://www.microsoft.com");
        // other actions...
    }
}
```

## property: copilotbrowser.chromium
> *Added in: v1.8*
>
> **Type:** `BrowserType`

This object can be used to launch or connect to Chromium, returning instances of `Browser`.

## property: copilotbrowser.devices
> *Added in: v1.8*
>
> **Languages:** JavaScript, Python
>
> **Type:** `Object`

Returns a dictionary of devices to be used with **Browser.newContext()** or **Browser.newPage()**.

```js
const { webkit, devices } = require('copilotbrowser');
const iPhone = devices['iPhone 6'];

(async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({
    ...iPhone
  });
  const page = await context.newPage();
  await page.goto('http://example.com');
  // other actions...
  await browser.close();
})();
```

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, copilotbrowser

async def run(copilotbrowser: copilotbrowser):
    webkit = copilotbrowser.webkit
    iphone = copilotbrowser.devices["iPhone 6"]
    browser = await webkit.launch()
    context = await browser.new_context(**iphone)
    page = await context.new_page()
    await page.goto("http://example.com")
    # other actions...
    await browser.close()

async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)
asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser, copilotbrowser

def run(copilotbrowser: copilotbrowser):
    webkit = copilotbrowser.webkit
    iphone = copilotbrowser.devices["iPhone 6"]
    browser = webkit.launch()
    context = browser.new_context(**iphone)
    page = context.new_page()
    page.goto("http://example.com")
    # other actions...
    browser.close()

with sync_copilotbrowser() as copilotbrowser:
    run(copilotbrowser)
```

### C# (.NET)
* hidden
> *Added in: v1.8*
>
> **Languages:** C#
>
> **Type:** `IReadOnlyDictionary<string, BrowserNewContextOptions>`

Returns a dictionary of devices to be used with **Browser.newContext()** or **Browser.newPage()**.

```csharp
using Microsoft.copilotbrowser;
using System.Threading.Tasks;

class copilotbrowserExample
{
    public static async Task Main()
    {
        using var copilotbrowser = await copilotbrowser.CreateAsync();
        await using var browser = await copilotbrowser.Webkit.LaunchAsync();
        await using var context = await browser.NewContextAsync(copilotbrowser.Devices["iPhone 6"]);

        var page = await context.NewPageAsync();
        await page.GotoAsync("https://www.theverge.com");
        // other actions...
    }
}
```

## property: copilotbrowser.errors
> *Added in: v1.8*
>
> **Languages:** JavaScript
>
> **Type:** `Object`
  - `TimeoutError` <`function`> A class of `TimeoutError`.

copilotbrowser methods might throw errors if they are unable to fulfill a request. For example,
**Locator.waitFor()** might fail if the selector doesn't match any nodes during the given timeframe.

For certain types of errors copilotbrowser uses specific error classes. These classes are available via
[`copilotbrowser.errors`](#property-copilotbrowsererrors).

An example of handling a timeout error:

```js
try {
  await page.locator('.foo').waitFor();
} catch (e) {
  if (e instanceof copilotbrowser.errors.TimeoutError) {
    // Do something if this is a timeout.
  }
}
```

```python async
try:
  await page.wait_for_selector(".foo")
except TimeoutError as e:
  pass
  # do something if this is a timeout.
```

```python sync
try:
  page.wait_for_selector(".foo")
except TimeoutError as e:
  pass
  # do something if this is a timeout.
```

## property: copilotbrowser.firefox
> *Added in: v1.8*
>
> **Type:** `BrowserType`

This object can be used to launch or connect to Firefox, returning instances of `Browser`.

## property: copilotbrowser.request
> *Added in: v1.16*
>
> **Languages:** *(all)*
>
> **Type:** `APIRequest`

Exposes API that can be used for the Web API testing.

## property: copilotbrowser.selectors
> *Added in: v1.8*
>
> **Type:** `Selectors`

Selectors can be used to install custom selector engines. See
[extensibility](../extensibility.md) for more information.

## property: copilotbrowser.webkit
> *Added in: v1.8*
>
> **Type:** `BrowserType`

This object can be used to launch or connect to WebKit, returning instances of `Browser`.

## method: copilotbrowser.close
> *Added in: v1.9*
>
> **Languages:** Java

Terminates this instance of copilotbrowser, will also close all created browsers if they are still running.

## method: copilotbrowser.create
> *Added in: v1.10*
>
> **Languages:** Java
**Returns:** `copilotbrowser`

Launches new copilotbrowser driver process and connects to it. **copilotbrowser.close()** should be called when the instance is no longer needed.

```java
copilotbrowser copilotbrowser = copilotbrowser.create();
Browser browser = copilotbrowser.webkit().launch();
Page page = browser.newPage();
page.navigate("https://www.w3.org/");
copilotbrowser.close();
```

### option: copilotbrowser.create.env
> *Added in: v1.13*
>
> **Languages:** Java
- `env` <`Object`<`string`, `string`>>

Additional environment variables that will be passed to the driver process. By default driver
process inherits environment variables of the copilotbrowser process.

## async method: copilotbrowser.stop
> *Added in: v1.8*
>
> **Languages:** Python

Terminates this instance of copilotbrowser in case it was created bypassing the Python context manager. This is useful in REPL applications.

```py
from copilotbrowser.sync_api import sync_copilotbrowser

copilotbrowser = sync_copilotbrowser().start()

browser = copilotbrowser.chromium.launch()
page = browser.new_page()
page.goto("https://dayour.github.io/copilotbrowser/")
page.screenshot(path="example.png")
browser.close()

copilotbrowser.stop()
```
