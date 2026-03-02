---
id: class-apiresponseassertions
---

# class: APIResponseAssertions
> *Added in: v1.18*

The `APIResponseAssertions` class provides assertion methods that can be used to make assertions about the `APIResponse` in the tests.

```js
import { test, expect } from '@copilotbrowser/test';

test('navigates to login', async ({ page }) => {
  // ...
  const response = await page.request.get('https://copilotbrowser.dev');
  await expect(response).toBeOK();
});
```

```java
// ...
import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;

public class TestPage {
  // ...
  @Test
  void navigatesToLoginPage() {
    // ...
    APIResponse response = page.request().get("https://copilotbrowser.dev");
    assertThat(response).isOK();
  }
}
```

```python async
from copilotbrowser.async_api import Page, expect

async def test_navigates_to_login_page(page: Page) -> None:
    # ..
    response = await page.request.get('https://copilotbrowser.dev')
    await expect(response).to_be_ok()
```

```python sync
from copilotbrowser.sync_api import Page, expect

def test_navigates_to_login_page(page: Page) -> None:
    # ..
    response = page.request.get('https://copilotbrowser.dev')
    expect(response).to_be_ok()
```

## property: APIResponseAssertions.not
> *Added in: v1.20*
>
> **Languages:** Java, JavaScript, C#
**Returns:** `APIResponseAssertions`

Makes the assertion check for the opposite condition.

**Usage**

For example, this code tests that the response status is not successful:

```js
await expect(response).not.toBeOK();
```

```java
assertThat(response).not().isOK();
```

## async method: APIResponseAssertions.NotToBeOK
> *Added in: v1.19*
>
> **Languages:** Python

The opposite of **APIResponseAssertions.toBeOK()**.

## async method: APIResponseAssertions.toBeOK
> *Added in: v1.18*
>
> **Languages:** *(all)*

Ensures the response status code is within `200..299` range.

**Usage**

```js
await expect(response).toBeOK();
```

```java
assertThat(response).isOK();
```

```python async
from copilotbrowser.async_api import expect

# ...
await expect(response).to_be_ok()
```

```python sync
import re
from copilotbrowser.sync_api import expect

# ...
expect(response).to_be_ok()
```
