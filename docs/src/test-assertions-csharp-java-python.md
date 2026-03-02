---
id: test-assertions-csharp-java-python
title: "Assertions"
sidebar_label: "Assertions (C#/Java/Python)"
---

## List of assertions

| Assertion | Description |
| :- | :- |
| **LocatorAssertions.toBeAttached()** | Element is attached |
| **LocatorAssertions.toBeChecked()** | Checkbox is checked |
| **LocatorAssertions.toBeDisabled()** | Element is disabled |
| **LocatorAssertions.toBeEditable()** | Element is editable |
| **LocatorAssertions.toBeEmpty()** | Container is empty |
| **LocatorAssertions.toBeEnabled()** | Element is enabled |
| **LocatorAssertions.toBeFocused()** | Element is focused |
| **LocatorAssertions.toBeHidden()** | Element is not visible |
| **LocatorAssertions.toBeInViewport()** | Element intersects viewport |
| **LocatorAssertions.toBeVisible()** | Element is visible |
| **LocatorAssertions.toContainClass()** | Element has specified CSS classes |
| **LocatorAssertions.toContainText()** | Element contains text |
| **LocatorAssertions.toHaveAccessibleDescription()** | Element has a matching [accessible description](https://w3c.github.io/accname/#dfn-accessible-description) |
| **LocatorAssertions.toHaveAccessibleName()** | Element has a matching [accessible name](https://w3c.github.io/accname/#dfn-accessible-name) |
| **LocatorAssertions.toHaveAttribute()** | Element has a DOM attribute |
| **LocatorAssertions.toHaveClass()** | Element has a class property |
| **LocatorAssertions.toHaveCount()** | List has exact number of children |
| **LocatorAssertions.toHaveCSS()** | Element has CSS property |
| **LocatorAssertions.toHaveId()** | Element has an ID |
| **LocatorAssertions.toHaveJSProperty()** | Element has a JavaScript property |
| **LocatorAssertions.toHaveRole()** | Element has a specific [ARIA role](https://www.w3.org/TR/wai-aria-1.2/#roles) |
| **LocatorAssertions.toHaveText()** | Element matches text |
| **LocatorAssertions.toHaveValue()** | Input has a value |
| **LocatorAssertions.toHaveValues()** | Select has options selected |
| **LocatorAssertions.toMatchAriaSnapshot()** | Element matches provided Aria snapshot |
| **PageAssertions.toHaveTitle()** | Page has a title |
| **PageAssertions.toHaveURL()** | Page has a URL |
| **APIResponseAssertions.toBeOK()** | Response has an OK status |

## Custom Expect Message

You can specify a custom expect message as a second argument to the `expect` function, for example:

```python
expect(page.get_by_text("Name"), "should be logged in").to_be_visible()
```

When expect fails, the error would look like this:

```bash
    def test_foobar(page: Page) -> None:
>       expect(page.get_by_text("Name"), "should be logged in").to_be_visible()
E       AssertionError: should be logged in
E       Actual value: None
E       Call log:
E       LocatorAssertions.to_be_visible with timeout 5000ms
E       waiting for get_by_text("Name")
E       waiting for get_by_text("Name")

tests/test_foobar.py:22: AssertionError
```

## Setting a custom timeout

You can specify a custom timeout for assertions either globally or per assertion. The default timeout is 5 seconds.

### Global timeout

```python title="conftest.py"
from copilotbrowser.sync_api import expect

expect.set_options(timeout=10_000)
```

### Global timeout


```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.NUnit;
using NUnit.Framework;

namespace copilotbrowserTests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class Tests : PageTest
{
    [OneTimeSetUp]
    public void GlobalSetup()
    {
        SetDefaultExpectTimeout(10_000);
    }
    // ...
}
```


```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace copilotbrowserTests;

[TestClass]
public class UnitTest1 : PageTest
{
    [ClassInitialize]
    public static void GlobalSetup(TestContext context)
    {
        SetDefaultExpectTimeout(10_000);
    }
    // ...
}
```


```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    UnitTest1()
    {
        SetDefaultExpectTimeout(10_000);
    }
    // ...
}
```

```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit.v3;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    UnitTest1()
    {
        SetDefaultExpectTimeout(10_000);
    }
    // ...
}
```

### Per assertion timeout

```python title="test_foobar.py"
from copilotbrowser.sync_api import expect

def test_foobar(page: Page) -> None:
    expect(page.get_by_text("Name")).to_be_visible(timeout=10_000)
```

```csharp title="UnitTest1.cs"
await Expect(Page.GetByText("Name")).ToBeVisibleAsync(new() { Timeout = 10_000 });
```
