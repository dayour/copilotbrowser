---
id: class-copilotbrowserassertions
---

# class: copilotbrowserAssertions
> **Languages:** JavaScript, Java, C#
>
> *Added in: v1.17*

copilotbrowser gives you Web-First Assertions with convenience methods for creating assertions that will wait and retry until the expected condition is met.

Consider the following example:

```js
import { test, expect } from '@copilotbrowser/test';

test('status becomes submitted', async ({ page }) => {
  // ...
  await page.locator('#submit-button').click();
  await expect(page.locator('.status')).toHaveText('Submitted');
});
```

```python async
from copilotbrowser.async_api import Page, expect

async def test_status_becomes_submitted(page: Page) -> None:
    # ..
    await page.locator("#submit-button").click()
    await expect(page.locator(".status")).to_have_text("Submitted")
```

```python sync
from copilotbrowser.sync_api import Page, expect

def test_status_becomes_submitted(page: Page) -> None:
    # ..
    page.locator("#submit-button").click()
    expect(page.locator(".status")).to_have_text("Submitted")
```

```java
import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;

public class TestExample {
  // ...
  @Test
  void statusBecomesSubmitted() {
    // ...
    page.locator("#submit-button").click();
    assertThat(page.locator(".status")).hasText("Submitted");
  }
}
```

```csharp
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTests : PageTest
{
    [TestMethod]
    public async Task StatusBecomesSubmitted()
    {
        await Page.GetByRole(AriaRole.Button, new() { Name = "Submit" }).ClickAsync();
        await Expect(Page.Locator(".status")).ToHaveTextAsync("Submitted");
    }
}
```

copilotbrowser will be re-testing the node with the selector `.status` until fetched Node has the `"Submitted"`
text. It will be re-fetching the node and checking it over and over, until the condition is met or until the timeout is
reached. You can pass this timeout as an option.

By default, the timeout for assertions is set to 5 seconds.

## method: copilotbrowserAssertions.expectAPIResponse
> *Added in: v1.18*
>
> **Languages:** *(all)*
**Returns:** `APIResponseAssertions`

Creates a `APIResponseAssertions` object for the given `APIResponse`.

**Usage**

```java
copilotbrowserAssertions.assertThat(response).isOK();
```

### param: copilotbrowserAssertions.expectAPIResponse.response
> *Added in: v1.18*
- `response` <`APIResponse`>

`APIResponse` object to use for assertions.

## method: copilotbrowserAssertions.expectGeneric
> *Added in: v1.9*
>
> **Languages:** JavaScript
**Returns:** `GenericAssertions`

Creates a `GenericAssertions` object for the given value.

### param: copilotbrowserAssertions.expectGeneric.value
> *Added in: v1.9*
>
> **Languages:** JavaScript
- `value` <`any`>

Value that will be asserted.

## method: copilotbrowserAssertions.expectLocator
> *Added in: v1.18*
>
> **Languages:** *(all)*
**Returns:** `LocatorAssertions`

Creates a `LocatorAssertions` object for the given `Locator`.

**Usage**

```java
copilotbrowserAssertions.assertThat(locator).isVisible();
```

```csharp
await Expect(locator).ToBeVisibleAsync();
```

### param: copilotbrowserAssertions.expectLocator.locator
> *Added in: v1.18*
- `locator` <`Locator`>

`Locator` object to use for assertions.

## method: copilotbrowserAssertions.expectPage
> *Added in: v1.18*
>
> **Languages:** *(all)*
**Returns:** `PageAssertions`

Creates a `PageAssertions` object for the given `Page`.

**Usage**

```java
copilotbrowserAssertions.assertThat(page).hasTitle("News");
```

```csharp
await Expect(Page).ToHaveTitleAsync("News");
```

### param: copilotbrowserAssertions.expectPage.page
> *Added in: v1.18*
- `page` <`Page`>

`Page` object to use for assertions.

## method: copilotbrowserAssertions.setDefaultAssertionTimeout
> *Added in: v1.25*
>
> **Languages:** Java

Changes default timeout for copilotbrowser assertions from 5 seconds to the specified value.

**Usage**

```java
copilotbrowserAssertions.setDefaultAssertionTimeout(30_000);
```

### param: copilotbrowserAssertions.setDefaultAssertionTimeout.timeout
> *Added in: v1.25*
- `timeout` <`float`>

Timeout in milliseconds.
