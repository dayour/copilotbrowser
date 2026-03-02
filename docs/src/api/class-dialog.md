---
id: class-dialog
---

# class: Dialog
> *Added in: v1.8*

`Dialog` objects are dispatched by page via the **Page.event('dialog')** event.

An example of using `Dialog` class:

```js
const { chromium } = require('copilotbrowser');  // Or 'firefox' or 'webkit'.

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.dismiss();
  });
  await page.evaluate(() => alert('1'));
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
      page.onDialog(dialog -> {
        System.out.println(dialog.message());
        dialog.dismiss();
      });
      page.evaluate("alert('1')");
      browser.close();
    }
  }
}
```

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, copilotbrowser

async def handle_dialog(dialog):
    print(dialog.message)
    await dialog.dismiss()

async def run(copilotbrowser: copilotbrowser):
    chromium = copilotbrowser.chromium
    browser = await chromium.launch()
    page = await browser.new_page()
    page.on("dialog", handle_dialog)
    page.evaluate("alert('1')")
    await browser.close()

async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)
asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser, copilotbrowser

def handle_dialog(dialog):
    print(dialog.message)
    dialog.dismiss()

def run(copilotbrowser: copilotbrowser):
    chromium = copilotbrowser.chromium
    browser = chromium.launch()
    page = browser.new_page()
    page.on("dialog", handle_dialog)
    page.evaluate("alert('1')")
    browser.close()

with sync_copilotbrowser() as copilotbrowser:
    run(copilotbrowser)
```

```csharp
using Microsoft.copilotbrowser;
using System.Threading.Tasks;

class DialogExample
{
    public static async Task Run()
    {
        using var copilotbrowser = await copilotbrowser.CreateAsync();
        await using var browser = await copilotbrowser.Chromium.LaunchAsync();
        var page = await browser.NewPageAsync();

        page.Dialog += async (_, dialog) =>
        {
            System.Console.WriteLine(dialog.Message);
            await dialog.DismissAsync();
        };

        await page.EvaluateAsync("alert('1');");
    }
}
```

:::note
Dialogs are dismissed automatically, unless there is a **Page.event('dialog')** listener.
When listener is present, it **must** either **Dialog.accept()** or **Dialog.dismiss()** the dialog - otherwise the page will [freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop#never_blocking) waiting for the dialog, and actions like click will never finish.
:::

## async method: Dialog.accept
> *Added in: v1.8*

Returns when the dialog has been accepted.

### param: Dialog.accept.promptText
> *Added in: v1.8*
- `promptText` ?<`string`>

A text to enter in prompt. Does not cause any effects if the dialog's `type` is not prompt. Optional.

## method: Dialog.defaultValue
> *Added in: v1.8*
**Returns:** `string`

If dialog is prompt, returns default prompt value. Otherwise, returns empty string.

## async method: Dialog.dismiss
> *Added in: v1.8*

Returns when the dialog has been dismissed.

## method: Dialog.message
> *Added in: v1.8*
**Returns:** `string`

A message displayed in the dialog.

## method: Dialog.page
> *Added in: v1.34*
**Returns:** `null|Page`

The page that initiated this dialog, if available.

## method: Dialog.type
> *Added in: v1.8*
**Returns:** `string`

Returns dialog's type, can be one of `alert`, `beforeunload`, `confirm` or `prompt`.
