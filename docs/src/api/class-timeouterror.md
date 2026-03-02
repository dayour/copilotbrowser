---
id: class-timeouterror
---

# class: TimeoutError
> *Added in: v1.8*
* extends: `Error`

TimeoutError is emitted whenever certain operations are terminated due to timeout, e.g. **Locator.waitFor()** or **BrowserType.launch()**.

```js
const copilotbrowser = require('copilotbrowser');

(async () => {
  const browser = await copilotbrowser.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.locator('text=Foo').click({
      timeout: 100,
    });
  } catch (error) {
    if (error instanceof copilotbrowser.errors.TimeoutError)
      console.log('Timeout!');
  }
  await browser.close();
})();
```

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, TimeoutError as copilotbrowserTimeoutError, copilotbrowser

async def run(copilotbrowser: copilotbrowser):
    browser = await copilotbrowser.chromium.launch()
    page = await browser.new_page()
    try:
      await page.locator("text=Example").click(timeout=100)
    except copilotbrowserTimeoutError:
      print("Timeout!")
    await browser.close()

async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)

asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser, TimeoutError as copilotbrowserTimeoutError

with sync_copilotbrowser() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
      page.locator("text=Example").click(timeout=100)
    except copilotbrowserTimeoutError:
      print("Timeout!")
    browser.close()
```

```java
package org.example;

import com.microsoft.copilotbrowser.*;

public class TimeoutErrorExample {
  public static void main(String[] args) {
    try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
      Browser browser = copilotbrowser.firefox().launch();
      BrowserContext context = browser.newContext();
      Page page = context.newPage();
      try {
        page.locator("text=Example").click(new Locator.ClickOptions().setTimeout(100));
      } catch (TimeoutError e) {
        System.out.println("Timeout!");
      }
    }
  }
}
```

```csharp
using Microsoft.copilotbrowser;

using var copilotbrowser = await copilotbrowser.CreateAsync();
await using var browser = await copilotbrowser.Chromium.LaunchAsync();
var page = await browser.NewPageAsync();
try
{
    await page.ClickAsync("text=Example", new() { Timeout = 100 });
}
catch (TimeoutException)
{
    Console.WriteLine("Timeout!");
}
```
