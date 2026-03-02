---
id: class-pageassertions
---

# class: PageAssertions
> *Added in: v1.17*

The `PageAssertions` class provides assertion methods that can be used to make assertions about the `Page` state in the tests.

```js
import { test, expect } from '@copilotbrowser/test';

test('navigates to login', async ({ page }) => {
  // ...
  await page.getByText('Sign in').click();
  await expect(page).toHaveURL(/.*\/login/);
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
    page.getByText("Sign in").click();
    assertThat(page).hasURL(Pattern.compile(".*/login"));
  }
}
```

```python async
import re
from copilotbrowser.async_api import Page, expect

async def test_navigates_to_login_page(page: Page) -> None:
    # ..
    await page.get_by_text("Sign in").click()
    await expect(page).to_have_url(re.compile(r".*/login"))
```

```python sync
import re
from copilotbrowser.sync_api import Page, expect

def test_navigates_to_login_page(page: Page) -> None:
    # ..
    page.get_by_text("Sign in").click()
    expect(page).to_have_url(re.compile(r".*/login"))
```

```csharp
using System.Text.RegularExpressions;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTests : PageTest
{
    [TestMethod]
    public async Task NavigateToLoginPage()
    {
        await Page.GetByRole(AriaRole.Button, new() { Name = "Sign In" }).ClickAsync();
        await Expect(Page).ToHaveURLAsync(new Regex(".*/login"));
    }
}
```

## property: PageAssertions.not
> *Added in: v1.20*
>
> **Languages:** Java, JavaScript, C#
**Returns:** `PageAssertions`

Makes the assertion check for the opposite condition.

**Usage**

For example, this code tests that the page URL doesn't contain `"error"`:

```js
await expect(page).not.toHaveURL('error');
```

```java
assertThat(page).not().hasURL("error");
```

```csharp
await Expect(Page).Not.ToHaveURLAsync("error");
```

## async method: PageAssertions.NotToHaveTitle
> *Added in: v1.20*
>
> **Languages:** Python

The opposite of **PageAssertions.toHaveTitle()**.

### param: PageAssertions.NotToHaveTitle.titleOrRegExp
> *Added in: v1.18*
- `titleOrRegExp` <`string`|`RegExp`>

Expected title or RegExp.

### option: PageAssertions.NotToHaveTitle.timeout = %%-csharp-java-python-assertions-timeout-%%
> *Added in: v1.18*

## async method: PageAssertions.NotToHaveURL
> *Added in: v1.20*
>
> **Languages:** Python

The opposite of **PageAssertions.toHaveURL()**.

### param: PageAssertions.NotToHaveURL.urlOrRegExp
> *Added in: v1.18*
- `urlOrRegExp` <`string`|`RegExp`>

Expected URL string or RegExp.

### option: PageAssertions.NotToHaveURL.ignoreCase
> *Added in: v1.44*
- `ignoreCase` <`boolean`>

Whether to perform case-insensitive match. **ignoreCase** option takes precedence over the corresponding regular expression flag if specified.

### option: PageAssertions.NotToHaveURL.timeout = %%-csharp-java-python-assertions-timeout-%%
> *Added in: v1.18*

## async method: PageAssertions.toHaveScreenshot#1
> *Added in: v1.23*
>
> **Languages:** JavaScript

This function will wait until two consecutive page screenshots
yield the same result, and then compare the last screenshot with the expectation.

**Usage**

```js
await expect(page).toHaveScreenshot('image.png');
```

Note that screenshot assertions only work with copilotbrowser test runner.

### param: PageAssertions.toHaveScreenshot#1.name
> *Added in: v1.23*
- `name` <`string`|`Array`<`string`>>

Snapshot name.

### option: PageAssertions.toHaveScreenshot#1.timeout = %%-js-assertions-timeout-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.animations = %%-screenshot-option-animations-default-disabled-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.caret = %%-screenshot-option-caret-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.clip = %%-screenshot-option-clip-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.fullPage = %%-screenshot-option-full-page-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.mask = %%-screenshot-option-mask-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.maskColor = %%-screenshot-option-mask-color-%%
> *Added in: v1.35*

### option: PageAssertions.toHaveScreenshot#1.stylePath = %%-screenshot-option-style-path-%%
> *Added in: v1.41*

### option: PageAssertions.toHaveScreenshot#1.omitBackground = %%-screenshot-option-omit-background-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.scale = %%-screenshot-option-scale-default-css-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.maxDiffPixels = %%-assertions-max-diff-pixels-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.maxDiffPixelRatio = %%-assertions-max-diff-pixel-ratio-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#1.threshold = %%-assertions-threshold-%%
> *Added in: v1.23*

## async method: PageAssertions.toHaveScreenshot#2
> *Added in: v1.23*
>
> **Languages:** JavaScript

This function will wait until two consecutive page screenshots
yield the same result, and then compare the last screenshot with the expectation.

**Usage**

```js
await expect(page).toHaveScreenshot();
```

Note that screenshot assertions only work with copilotbrowser test runner.

### option: PageAssertions.toHaveScreenshot#2.timeout = %%-js-assertions-timeout-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.animations = %%-screenshot-option-animations-default-disabled-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.caret = %%-screenshot-option-caret-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.clip = %%-screenshot-option-clip-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.fullPage = %%-screenshot-option-full-page-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.mask = %%-screenshot-option-mask-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.maskColor = %%-screenshot-option-mask-color-%%
> *Added in: v1.35*

### option: PageAssertions.toHaveScreenshot#2.stylePath = %%-screenshot-option-style-path-%%
> *Added in: v1.41*

### option: PageAssertions.toHaveScreenshot#2.omitBackground = %%-screenshot-option-omit-background-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.scale = %%-screenshot-option-scale-default-css-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.maxDiffPixels = %%-assertions-max-diff-pixels-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.maxDiffPixelRatio = %%-assertions-max-diff-pixel-ratio-%%
> *Added in: v1.23*

### option: PageAssertions.toHaveScreenshot#2.threshold = %%-assertions-threshold-%%
> *Added in: v1.23*

## async method: PageAssertions.toHaveTitle
> *Added in: v1.20*
>
> **Languages:** *(all)*

Ensures the page has the given title.

**Usage**

```js
await expect(page).toHaveTitle(/.*checkout/);
```

```java
assertThat(page).hasTitle("copilotbrowser");
```

```python async
import re
from copilotbrowser.async_api import expect

# ...
await expect(page).to_have_title(re.compile(r".*checkout"))
```

```python sync
import re
from copilotbrowser.sync_api import expect

# ...
expect(page).to_have_title(re.compile(r".*checkout"))
```

```csharp
await Expect(Page).ToHaveTitleAsync("copilotbrowser");
```

### param: PageAssertions.toHaveTitle.titleOrRegExp
> *Added in: v1.18*
- `titleOrRegExp` <`string`|`RegExp`>

Expected title or RegExp.

### option: PageAssertions.toHaveTitle.timeout = %%-js-assertions-timeout-%%
> *Added in: v1.18*

### option: PageAssertions.toHaveTitle.timeout = %%-csharp-java-python-assertions-timeout-%%
> *Added in: v1.18*

## async method: PageAssertions.toHaveURL
> *Added in: v1.20*
>
> **Languages:** *(all)*

Ensures the page is navigated to the given URL.

**Usage**

```js
// Check for the page URL to be 'https://dayour.github.io/copilotbrowser/docs/intro' (including query string)
await expect(page).toHaveURL('https://dayour.github.io/copilotbrowser/docs/intro');

// Check for the page URL to contain 'doc', followed by an optional 's', followed by '/'
await expect(page).toHaveURL(/docs?\//);

// Check for the page URL to match the URL pattern
await expect(page).toHaveURL(new URLPattern({ pathname: '/docs/*' }));

// Check for the predicate to be satisfied
// For example: verify query strings
await expect(page).toHaveURL(url => {
  const params = url.searchParams;
  return params.has('search') && params.has('options') && params.get('id') === '5';
});
```

```java
assertThat(page).hasURL(".com");
```

```python async
import re
from copilotbrowser.async_api import expect

# ...
await expect(page).to_have_url(re.compile(".*checkout"))
```

```python sync
import re
from copilotbrowser.sync_api import expect

# ...
expect(page).to_have_url(re.compile(".*checkout"))
```

```csharp
await Expect(Page).ToHaveURLAsync(new Regex(".*checkout"));
```

### param: PageAssertions.toHaveURL.url
> *Added in: v1.18*
>
> **Languages:** JavaScript
- `url` <`string`|`RegExp`|`URLPattern`|`function`\(`URL`\):`boolean`>

Expected URL string, RegExp, or predicate receiving `URL` to match.
When **Browser.newContext.baseURL** is provided via the context options and the `url` argument is a string, the two values are merged via the [`new URL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) constructor and used for the comparison against the current browser URL.

### param: PageAssertions.toHaveURL.urlOrRegExp
> *Added in: v1.18*
>
> **Languages:** C#, Python, Java
- `urlOrRegExp` <`string`|`RegExp`>

Expected URL string or RegExp.

### option: PageAssertions.toHaveURL.ignoreCase
> *Added in: v1.44*
- `ignoreCase` <`boolean`>

Whether to perform case-insensitive match. **ignoreCase** option takes precedence over the corresponding regular expression parameter if specified. A provided predicate ignores this flag.

### option: PageAssertions.toHaveURL.timeout = %%-js-assertions-timeout-%%
> *Added in: v1.18*

### option: PageAssertions.toHaveURL.timeout = %%-csharp-java-python-assertions-timeout-%%
> *Added in: v1.18*
