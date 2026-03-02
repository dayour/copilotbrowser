---
id: class-selectors
---

# class: Selectors
> *Added in: v1.8*

Selectors can be used to install custom selector engines. See [extensibility](../extensibility.md) for more
information.

## async method: Selectors.register
> *Added in: v1.8*

Selectors must be registered before creating the page.

**Usage**

An example of registering selector engine that queries elements based on a tag name:

```js
const { selectors, firefox } = require('@copilotbrowser/test');  // Or 'chromium' or 'webkit'.

(async () => {
  // Must be a function that evaluates to a selector engine instance.
  const createTagNameEngine = () => ({
    // Returns the first element matching given selector in the root's subtree.
    query(root, selector) {
      return root.querySelector(selector);
    },

    // Returns all elements matching given selector in the root's subtree.
    queryAll(root, selector) {
      return Array.from(root.querySelectorAll(selector));
    }
  });

  // Register the engine. Selectors will be prefixed with "tag=".
  await selectors.register('tag', createTagNameEngine);

  const browser = await firefox.launch();
  const page = await browser.newPage();
  await page.setContent(`<div><button>Click me</button></div>`);

  // Use the selector prefixed with its name.
  const button = page.locator('tag=button');
  // We can combine it with built-in locators.
  await page.locator('tag=div').getByText('Click me').click();
  // Can use it in any methods supporting selectors.
  const buttonCount = await page.locator('tag=button').count();

  await browser.close();
})();
```

```java
// Script that evaluates to a selector engine instance. The script is evaluated in the page context.
String createTagNameEngine = "{\n" +
  "  // Returns the first element matching given selector in the root's subtree.\n" +
  "  query(root, selector) {\n" +
  "    return root.querySelector(selector);\n" +
  "  },\n" +
  "  // Returns all elements matching given selector in the root's subtree.\n" +
  "  queryAll(root, selector) {\n" +
  "    return Array.from(root.querySelectorAll(selector));\n" +
  "  }\n" +
  "}";
// Register the engine. Selectors will be prefixed with "tag=".
copilotbrowser.selectors().register("tag", createTagNameEngine);
Browser browser = copilotbrowser.firefox().launch();
Page page = browser.newPage();
page.setContent("<div><button>Click me</button></div>");
// Use the selector prefixed with its name.
Locator button = page.locator("tag=button");
// Combine it with built-in locators.
page.locator("tag=div").getByText("Click me").click();
// Can use it in any methods supporting selectors.
int buttonCount = (int) page.locator("tag=button").count();
browser.close();
```

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, copilotbrowser

async def run(copilotbrowser: copilotbrowser):
    tag_selector = """
      {
          // Returns the first element matching given selector in the root's subtree.
          query(root, selector) {
              return root.querySelector(selector);
          },
          // Returns all elements matching given selector in the root's subtree.
          queryAll(root, selector) {
              return Array.from(root.querySelectorAll(selector));
          }
      }"""

    # Register the engine. Selectors will be prefixed with "tag=".
    await copilotbrowser.selectors.register("tag", tag_selector)
    browser = await copilotbrowser.chromium.launch()
    page = await browser.new_page()
    await page.set_content('<div><button>Click me</button></div>')

    # Use the selector prefixed with its name.
    button = await page.query_selector('tag=button')
    # Combine it with built-in locators.
    await page.locator('tag=div').get_by_text('Click me').click()
    # Can use it in any methods supporting selectors.
    button_count = await page.locator('tag=button').count()
    print(button_count)
    await browser.close()

async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)

asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser, copilotbrowser

def run(copilotbrowser: copilotbrowser):
    tag_selector = """
      {
          // Returns the first element matching given selector in the root's subtree.
          query(root, selector) {
              return root.querySelector(selector);
          },
          // Returns all elements matching given selector in the root's subtree.
          queryAll(root, selector) {
              return Array.from(root.querySelectorAll(selector));
          }
      }"""

    # Register the engine. Selectors will be prefixed with "tag=".
    copilotbrowser.selectors.register("tag", tag_selector)
    browser = copilotbrowser.chromium.launch()
    page = browser.new_page()
    page.set_content('<div><button>Click me</button></div>')

    # Use the selector prefixed with its name.
    button = page.locator('tag=button')
    # Combine it with built-in locators.
    page.locator('tag=div').get_by_text('Click me').click()
    # Can use it in any methods supporting selectors.
    button_count = page.locator('tag=button').count()
    print(button_count)
    browser.close()

with sync_copilotbrowser() as copilotbrowser:
    run(copilotbrowser)
```

```csharp
using Microsoft.copilotbrowser;

using var copilotbrowser = await copilotbrowser.CreateAsync();
// Script that evaluates to a selector engine instance. The script is evaluated in the page context.
await copilotbrowser.Selectors.RegisterAsync("tag", new()
{
    Script = @"{
    // Returns the first element matching given selector in the root's subtree.
    query(root, selector) {
        return root.querySelector(selector);
      },
      // Returns all elements matching given selector in the root's subtree.
      queryAll(root, selector) {
        return Array.from(root.querySelectorAll(selector));
      }
    }"
});

await using var browser = await copilotbrowser.Chromium.LaunchAsync();
var page = await browser.NewPageAsync();
await page.SetContentAsync("<div><button>Click me</button></div>");
// Use the selector prefixed with its name.
var button = page.Locator("tag=button");
// Combine it with built-in locators.
await page.Locator("tag=div").GetByText("Click me").ClickAsync();
// Can use it in any methods supporting selectors.
int buttonCount = await page.Locator("tag=button").CountAsync();
```

### param: Selectors.register.name
> *Added in: v1.8*
- `name` <`string`>

Name that is used in selectors as a prefix, e.g. `{name: 'foo'}` enables `foo=myselectorbody` selectors. May only
contain `[a-zA-Z0-9_]` characters.

### param: Selectors.register.script
> *Added in: v1.8*
>
> **Languages:** JavaScript
- `script` <`function`|`string`|`Object`>
  - `path` ?<`path`> Path to the JavaScript file. If `path` is a relative path, then it is resolved relative to the
    current working directory. Optional.
  - `content` ?<`string`> Raw script content. Optional.

Script that evaluates to a selector engine instance. The script is evaluated in the page context.

### param: Selectors.register.script
> *Added in: v1.8*
>
> **Languages:** Java
- `script` <`string`|`path`>

Script that evaluates to a selector engine instance. The script is evaluated in the page context.

### param: Selectors.register.script
> *Added in: v1.8*
>
> **Languages:** Python
- `script` ?<`string`>

Raw script content.

### option: Selectors.register.script
> *Added in: v1.8*
>
> **Languages:** C#
- `script` <`string`>

Script that evaluates to a selector engine instance. The script is evaluated in the page context.

### option: Selectors.register.path
> *Added in: v1.8*
>
> **Languages:** Python
- `path` <`path`>

Path to the JavaScript file. If `path` is a relative path, then it is resolved relative to the current working directory.

### option: Selectors.register.path
> *Added in: v1.8*
>
> **Languages:** C#
- `path` <`path`>

Script that evaluates to a selector engine instance. The script is evaluated in the page context.

### option: Selectors.register.contentScript
> *Added in: v1.8*
- `contentScript` <`boolean`>

Whether to run this selector engine in isolated JavaScript environment. This environment has access to the same DOM, but
not any JavaScript objects from the frame's scripts. Defaults to `false`. Note that running as a content script is not
guaranteed when this engine is used together with other registered engines.

## method: Selectors.setTestIdAttribute
> *Added in: v1.27*

Defines custom attribute name to be used in **Page.getByTestId()**. `data-testid` is used by default.

### param: Selectors.setTestIdAttribute.attributeName
> *Added in: v1.27*
- `attributeName` <`string`>

Test id attribute name.
