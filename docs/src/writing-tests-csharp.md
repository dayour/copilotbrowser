---
id: writing-tests-csharp
title: "Writing tests"
sidebar_label: "Writing tests (C#)"
---

## Introduction

copilotbrowser tests are simple, they

- **perform actions**, and
- **assert the state** against expectations.

There is no need to wait for anything prior to performing an action: copilotbrowser
automatically waits for the wide range of [actionability](./actionability.md)
checks to pass prior to performing each action.

There is also no need to deal with the race conditions when performing the checks -
copilotbrowser assertions are designed in a way that they describe the expectations
that need to be eventually met.

That's it! These design choices allow copilotbrowser users to forget about flaky
timeouts and racy checks in their tests altogether.

**You will learn**

- [How to write the first test](/writing-tests.md#first-test)
- [How to perform actions](/writing-tests.md#actions)
- [How to use assertions](/writing-tests.md#assertions)
- [How tests run in isolation](/writing-tests.md#test-isolation)
- [How to use test hooks](/writing-tests.md#using-test-hooks)
  
## First test

Take a look at the following example to see how to write a test.


```csharp title="UnitTest1.cs"
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.NUnit;
using NUnit.Framework;

namespace copilotbrowserTests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class ExampleTest : PageTest
{
    [Test]
    public async Task HasTitle()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Expect a title "to contain" a substring.
        await Expect(Page).ToHaveTitleAsync(new Regex("copilotbrowser"));
    }

    [Test]
    public async Task GetStartedLink()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Click the get started link.
        await Page.GetByRole(AriaRole.Link, new() { Name = "Get started" }).ClickAsync();

        // Expects page to have a heading with the name of Installation.
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = "Installation" })).ToBeVisibleAsync();
    } 
}
```


```csharp title="UnitTest1.cs"
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTest : PageTest
{
    [TestMethod]
    public async Task HasTitle()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Expect a title "to contain" a substring.
        await Expect(Page).ToHaveTitleAsync(new Regex("copilotbrowser"));
    }

    [TestMethod]
    public async Task GetStartedLink()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Click the get started link.
        await Page.GetByRole(AriaRole.Link, new() { Name = "Get started" }).ClickAsync();

        // Expects page to have a heading with the name of Installation.
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = "Installation" })).ToBeVisibleAsync();
    } 
}
```


```csharp title="UnitTest1.cs"
using System.Text.RegularExpressions;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    [Fact]
    public async Task HasTitle()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Expect a title "to contain" a substring.
        await Expect(Page).ToHaveTitleAsync(new Regex("copilotbrowser"));
    }

    [Fact]
    public async Task GetStartedLink()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Click the get started link.
        await Page.GetByRole(AriaRole.Link, new() { Name = "Get started" }).ClickAsync();

        // Expects page to have a heading with the name of Installation.
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = "Installation" })).ToBeVisibleAsync();
    } 
}
```

```csharp title="UnitTest1.cs"
using System.Text.RegularExpressions;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit.v3;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    [Fact]
    public async Task HasTitle()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Expect a title "to contain" a substring.
        await Expect(Page).ToHaveTitleAsync(new Regex("copilotbrowser"));
    }

    [Fact]
    public async Task GetStartedLink()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");

        // Click the get started link.
        await Page.GetByRole(AriaRole.Link, new() { Name = "Get started" }).ClickAsync();

        // Expects page to have a heading with the name of Installation.
        await Expect(Page.GetByRole(AriaRole.Heading, new() { Name = "Installation" })).ToBeVisibleAsync();
    } 
}
```

## Actions

### Navigation

Most of the tests will start by navigating the page to a URL. After that, the test
will be able to interact with the page elements.

```csharp
await Page.GotoAsync("https://copilotbrowser.dev");
```

copilotbrowser will wait for the page to reach the load state prior to moving forward.
Learn more about the **Page.goto()** options.

### Interactions

Performing actions starts with locating the elements. copilotbrowser uses [Locators API](./locators.md) for that. Locators represent a way to find element(s) on the page at any moment, learn more about the [different types](./locators.md) of locators available. copilotbrowser will wait for the element to be [actionable](./actionability.md) prior to performing the action, so there is no need to wait for it to become available.


```csharp
// Create a locator.
var getStarted = Page.GetByRole(AriaRole.Link, new() { Name = "Get started" });

// Click it.
await getStarted.ClickAsync();
```

In most cases, it'll be written in one line:

```csharp
await Page.GetByRole(AriaRole.Link, new() { Name = "Get started" }).ClickAsync();
```

### Basic actions

This is the list of the most popular copilotbrowser actions. Note that there are many more, so make sure to check the [Locator API](./api/class-locator.md) section to
learn more about them.

| Action | Description |
| :- | :- |
| **Locator.check()** | Check the input checkbox |
| **Locator.click()** | Click the element |
| **Locator.uncheck()** | Uncheck the input checkbox |
| **Locator.hover()** | Hover mouse over the element |
| **Locator.fill()** | Fill the form field, input text |
| **Locator.focus()** | Focus the element |
| **Locator.press()** | Press single key |
| **Locator.setInputFiles()** | Pick files to upload |
| **Locator.selectOption()** | Select option in the drop down |

## Assertions
  
copilotbrowser provides an async function called [Expect](./test-assertions) to assert and wait until the expected condition is met.

```csharp
await Expect(Page).ToHaveTitleAsync(new Regex("copilotbrowser"));
``` 
  
Here is the list of the most popular async assertions. Note that there are [many more](./test-assertions.md) to get familiar with:

| Assertion | Description |
| :- | :- |
| **LocatorAssertions.toBeChecked()** | Checkbox is checked |
| **LocatorAssertions.toBeEnabled()** | Control is enabled |
| **LocatorAssertions.toBeVisible()** | Element is visible |
| **LocatorAssertions.toContainText()** | Element contains text |
| **LocatorAssertions.toHaveAttribute()** | Element has attribute |
| **LocatorAssertions.toHaveCount()** | List of elements has given length |
| **LocatorAssertions.toHaveText()** | Element matches text |
| **LocatorAssertions.toHaveValue()** | Input element has value |
| **PageAssertions.toHaveTitle()** | Page has title |
| **PageAssertions.toHaveURL()** | Page has URL |


## Test Isolation

The copilotbrowser NUnit, MSTest, xUnit, and xUnit v3 test framework base classes will isolate each test from each other by providing a separate `Page` instance. Pages are isolated between tests due to the Browser Context, which is equivalent to a brand new browser profile, where every test gets a fresh environment, even when multiple tests run in a single Browser.


```csharp title="UnitTest1.cs"
using System.Threading.Tasks;
using Microsoft.copilotbrowser.NUnit;
using NUnit.Framework;

namespace copilotbrowserTests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class ExampleTest : PageTest
{
    [Test]
    public async Task BasicTest()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");
    }
}
```


```csharp title="UnitTest1.cs"
using System.Threading.Tasks;
using Microsoft.copilotbrowser.MSTest;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTest : PageTest
{
    [TestMethod]
    public async Task BasicTest()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");
    }
}
```


```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    [Fact]
    public async Task BasicTest()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");
    }
}
```


```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit.v3;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    [Fact]
    public async Task BasicTest()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");
    }
}
```


## Using Test Hooks


You can use `SetUp`/`TearDown` to prepare and clean up your test environment:

```csharp title="UnitTest1.cs"
using System.Threading.Tasks;
using Microsoft.copilotbrowser.NUnit;
using NUnit.Framework;

namespace copilotbrowserTests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class ExampleTest : PageTest
{
    [Test]
    public async Task MainNavigation()
    {
        // Assertions use the expect API.
        await Expect(Page).ToHaveURLAsync("https://dayour.github.io/copilotbrowser/");
    }

    [SetUp]
    public async Task SetUp()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");
    }
}
```


You can use `TestInitialize`/`TestCleanup` to prepare and clean up your test environment:

```csharp title="UnitTest1.cs"
using System.Threading.Tasks;
using Microsoft.copilotbrowser.MSTest;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTest : PageTest
{
    [TestMethod]
    public async Task MainNavigation()
    {
        // Assertions use the expect API.
        await Expect(Page).ToHaveURLAsync("https://dayour.github.io/copilotbrowser/");
    }

    [TestInitialize]
    public async Task TestInitialize()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");
    }
}
```


You can use `InitializeAsync`/`DisposeAsync` to prepare and clean up your test environment:

```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    [Fact]
    public async Task MainNavigation()
    {
        // Assertions use the expect API.
        await Expect(Page).ToHaveURLAsync("https://dayour.github.io/copilotbrowser/");
    }

    override public async Task InitializeAsync()
    {
        await base.InitializeAsync();
        await Page.GotoAsync("https://copilotbrowser.dev");
    }

    public override async Task DisposeAsync()
    {
        Console.WriteLine("After each test cleanup");
        await base.DisposeAsync();
    }
}
```

You can use `InitializeAsync`/`DisposeAsync` to prepare and clean up your test environment:

```csharp title="UnitTest1.cs"
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit.v3;

namespace copilotbrowserTests;

public class UnitTest1: PageTest
{
    [Fact]
    public async Task MainNavigation()
    {
        // Assertions use the expect API.
        await Expect(Page).ToHaveURLAsync("https://dayour.github.io/copilotbrowser/");
    }

    override public async Task InitializeAsync()
    {
        await base.InitializeAsync();
        await Page.GotoAsync("https://copilotbrowser.dev");
    }

    public override async Task DisposeAsync()
    {
        Console.WriteLine("After each test cleanup");
        await base.DisposeAsync();
    }
}
```

## What's Next

- [Run single test, multiple tests, headed mode](./running-tests.md)
- [Generate tests with Codegen](./codegen-intro.md)
- [See a trace of your tests](./trace-viewer-intro.md)
- [Run tests on CI](./ci-intro.md)
- [Learn more about the MSTest, NUnit, xUnit, or xUnit v3 base classes](./test-runners.md)
