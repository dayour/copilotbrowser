---
id: class-browser
---

# class: Browser
> *Added in: v1.8*

A Browser is created via **BrowserType.launch()**. An example of using a `Browser` to create a `Page`:

```js
const { firefox } = require('copilotbrowser');  // Or 'chromium' or 'webkit'.

(async () => {
  const browser = await firefox.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await browser.close();
})();
```

```java
import com.microsoft.copilotbrowser.*;

public class Example {
 public static void main(String[] args) {
   try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
     BrowserType firefox = copilotbrowser.firefox();
     Browser browser = firefox.launch();
     Page page = browser.newPage();
     page.navigate("https://example.com");
     browser.close();
   }
 }
}
```

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, copilotbrowser

async def run(copilotbrowser: copilotbrowser):
    firefox = copilotbrowser.firefox
    browser = await firefox.launch()
    page = await browser.new_page()
    await page.goto("https://example.com")
    await browser.close()

async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)
asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser, copilotbrowser

def run(copilotbrowser: copilotbrowser):
    firefox = copilotbrowser.firefox
    browser = firefox.launch()
    page = browser.new_page()
    page.goto("https://example.com")
    browser.close()

with sync_copilotbrowser() as copilotbrowser:
    run(copilotbrowser)
```

```csharp
using Microsoft.copilotbrowser;

using var copilotbrowser = await copilotbrowser.CreateAsync();
var firefox = copilotbrowser.Firefox;
var browser = await firefox.LaunchAsync(new() { Headless = false });
var page = await browser.NewPageAsync();
await page.GotoAsync("https://www.bing.com");
await browser.CloseAsync();
```

## event: Browser.disconnected
> *Added in: v1.8*
- argument: <`Browser`>

Emitted when Browser gets disconnected from the browser application. This might happen because of one of the following:
* Browser application is closed or crashed.
* The **Browser.close()** method was called.

## method: Browser.browserType
> *Added in: v1.23*
**Returns:** `BrowserType`

Get the browser type (chromium, firefox or webkit) that the browser belongs to.

## async method: Browser.close
> *Added in: v1.8*

In case this browser is obtained using **BrowserType.launch()**, closes the browser and all of its pages (if any
were opened).

In case this browser is connected to, clears all created contexts belonging to this browser and disconnects from the
browser server.

:::note
This is similar to force-quitting the browser. To close pages gracefully and ensure you receive page close events, call **BrowserContext.close()** on any `BrowserContext` instances you explicitly created earlier using **Browser.newContext()** **before** calling **Browser.close()**.
:::

The `Browser` object itself is considered to be disposed and cannot be used anymore.

### option: Browser.close.reason
> *Added in: v1.40*
- `reason` <`string`>

The reason to be reported to the operations interrupted by the browser closure.

## method: Browser.contexts
> *Added in: v1.8*
**Returns:** `Array<BrowserContext>`

Returns an array of all open browser contexts. In a newly created browser, this will return zero browser contexts.

**Usage**

```js
const browser = await pw.webkit.launch();
console.log(browser.contexts().length); // prints `0`

const context = await browser.newContext();
console.log(browser.contexts().length); // prints `1`
```

```java
Browser browser = pw.webkit().launch();
System.out.println(browser.contexts().size()); // prints "0"
BrowserContext context = browser.newContext();
System.out.println(browser.contexts().size()); // prints "1"
```

```python async
browser = await pw.webkit.launch()
print(len(browser.contexts)) # prints `0`
context = await browser.new_context()
print(len(browser.contexts)) # prints `1`
```

```python sync
browser = pw.webkit.launch()
print(len(browser.contexts)) # prints `0`
context = browser.new_context()
print(len(browser.contexts)) # prints `1`
```

```csharp
using var copilotbrowser = await copilotbrowser.CreateAsync();
var browser = await copilotbrowser.Webkit.LaunchAsync();
System.Console.WriteLine(browser.Contexts.Count); // prints "0"
var context = await browser.NewContextAsync();
System.Console.WriteLine(browser.Contexts.Count); // prints "1"
```

## method: Browser.isConnected
> *Added in: v1.8*
**Returns:** `boolean`

Indicates that the browser is connected.

## async method: Browser.newBrowserCDPSession
> *Added in: v1.11*
**Returns:** `CDPSession`

:::note
CDP Sessions are only supported on Chromium-based browsers.
:::

Returns the newly created browser session.

## async method: Browser.newContext
> *Added in: v1.8*
**Returns:** `BrowserContext`

Creates a new browser context. It won't share cookies/cache with other browser contexts.

:::note
If directly using this method to create `BrowserContext`s, it is best practice to explicitly close the returned context via **BrowserContext.close()** when your code is done with the `BrowserContext`,
and before calling **Browser.close()**. This will ensure the `context` is closed gracefully and any artifacts—like HARs and videos—are fully flushed and saved.
:::

**Usage**

```js
(async () => {
  const browser = await copilotbrowser.firefox.launch();  // Or 'chromium' or 'webkit'.
  // Create a new incognito browser context.
  const context = await browser.newContext();
  // Create a new page in a pristine context.
  const page = await context.newPage();
  await page.goto('https://example.com');

  // Gracefully close up everything
  await context.close();
  await browser.close();
})();
```

```java
Browser browser = copilotbrowser.firefox().launch();  // Or 'chromium' or 'webkit'.
// Create a new incognito browser context.
BrowserContext context = browser.newContext();
// Create a new page in a pristine context.
Page page = context.newPage();
page.navigate("https://example.com");

// Graceful close up everything
context.close();
browser.close();
```

```python async
browser = await copilotbrowser.firefox.launch() # or "chromium" or "webkit".
# create a new incognito browser context.
context = await browser.new_context()
# create a new page in a pristine context.
page = await context.new_page()
await page.goto("https://example.com")

# gracefully close up everything
await context.close()
await browser.close()
```

```python sync
browser = copilotbrowser.firefox.launch() # or "chromium" or "webkit".
# create a new incognito browser context.
context = browser.new_context()
# create a new page in a pristine context.
page = context.new_page()
page.goto("https://example.com")

# gracefully close up everything
context.close()
browser.close()
```

```csharp
using var copilotbrowser = await copilotbrowser.CreateAsync();
var browser = await copilotbrowser.Firefox.LaunchAsync();
// Create a new incognito browser context.
var context = await browser.NewContextAsync();
// Create a new page in a pristine context.
var page = await context.NewPageAsync(); ;
await page.GotoAsync("https://www.bing.com");

// Gracefully close up everything
await context.CloseAsync();
await browser.CloseAsync();
```

### option: Browser.newContext.-inline- = %%-shared-context-params-list-v1.8-%%
> *Added in: v1.8*

### option: Browser.newContext.proxy = %%-context-option-proxy-%%
> *Added in: v1.8*

### option: Browser.newContext.clientCertificates = %%-context-option-clientCertificates-%%
* since: 1.46

### option: Browser.newContext.storageState = %%-js-python-context-option-storage-state-%%
> *Added in: v1.8*

### option: Browser.newContext.storageState = %%-csharp-java-context-option-storage-state-%%
> *Added in: v1.8*

### option: Browser.newContext.storageStatePath = %%-csharp-java-context-option-storage-state-path-%%
> *Added in: v1.9*

## async method: Browser.newPage
> *Added in: v1.8*
**Returns:** `Page`

Creates a new page in a new browser context. Closing this page will close the context as well.

This is a convenience API that should only be used for the single-page scenarios and short snippets. Production code and
testing frameworks should explicitly create **Browser.newContext()** followed by the
**BrowserContext.newPage()** to control their exact life times.

### option: Browser.newPage.-inline- = %%-shared-context-params-list-v1.8-%%
> *Added in: v1.8*

### option: Browser.newPage.proxy = %%-context-option-proxy-%%
> *Added in: v1.8*

### option: Browser.newPage.clientCertificates = %%-context-option-clientCertificates-%%
* since: 1.46

### option: Browser.newPage.storageState = %%-js-python-context-option-storage-state-%%
> *Added in: v1.8*

### option: Browser.newPage.storageState = %%-csharp-java-context-option-storage-state-%%
> *Added in: v1.8*

### option: Browser.newPage.storageStatePath = %%-csharp-java-context-option-storage-state-path-%%
> *Added in: v1.9*

## async method: Browser.removeAllListeners
> *Added in: v1.47*
>
> **Languages:** JavaScript

Removes all the listeners of the given type (or all registered listeners if no type given).
Allows to wait for async listeners to complete or to ignore subsequent errors from these listeners.

### param: Browser.removeAllListeners.type
> *Added in: v1.47*
- `type` ?<`string`>

### option: Browser.removeAllListeners.behavior = %%-remove-all-listeners-options-behavior-%%
> *Added in: v1.47*

## async method: Browser.startTracing
> *Added in: v1.11*
>
> **Languages:** Java, JavaScript, Python

:::note
This API controls [Chromium Tracing](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool) which is a low-level chromium-specific debugging tool. API to control [copilotbrowser Tracing](../trace-viewer) could be found [here](./class-tracing).
:::

You can use **Browser.startTracing()** and **Browser.stopTracing()** to create a trace file that can
be opened in Chrome DevTools performance panel.

**Usage**

```js
await browser.startTracing(page, { path: 'trace.json' });
await page.goto('https://www.google.com');
await browser.stopTracing();
```

```java
browser.startTracing(page, new Browser.StartTracingOptions()
  .setPath(Paths.get("trace.json")));
page.navigate("https://www.google.com");
browser.stopTracing();
```

```python async
await browser.start_tracing(page, path="trace.json")
await page.goto("https://www.google.com")
await browser.stop_tracing()
```

```python sync
browser.start_tracing(page, path="trace.json")
page.goto("https://www.google.com")
browser.stop_tracing()
```

### param: Browser.startTracing.page
> *Added in: v1.11*
- `page` ?<`Page`>

Optional, if specified, tracing includes screenshots of the given page.

### option: Browser.startTracing.path
> *Added in: v1.11*
- `path` <`path`>

A path to write the trace file to.

### option: Browser.startTracing.screenshots
> *Added in: v1.11*
- `screenshots` <`boolean`>

captures screenshots in the trace.

### option: Browser.startTracing.categories
> *Added in: v1.11*
- `categories` <`Array`<`string`>>

specify custom categories to use instead of default.

## async method: Browser.stopTracing
> *Added in: v1.11*
>
> **Languages:** Java, JavaScript, Python
**Returns:** `Buffer`

:::note
This API controls [Chromium Tracing](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool) which is a low-level chromium-specific debugging tool. API to control [copilotbrowser Tracing](../trace-viewer) could be found [here](./class-tracing).
:::

Returns the buffer with trace data.

## method: Browser.version
> *Added in: v1.8*
**Returns:** `string`

Returns the browser version.
