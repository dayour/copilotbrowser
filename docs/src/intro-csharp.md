---
id: intro-csharp
title: "Installation"
sidebar_label: "Installation (C#)"
---

## Introduction

copilotbrowser was created specifically to accommodate the needs of end-to-end testing. copilotbrowser supports all modern rendering engines including Chromium, WebKit, and Firefox. Test on Windows, Linux, and macOS, locally or on CI, headless or headed with native mobile emulation.

You can choose to use MSTest, NUnit, or xUnit [base classes](./test-runners.md) that copilotbrowser provides to write end-to-end tests. These classes support running tests on multiple browser engines, parallelizing tests, adjusting launch/context options and getting a `Page`/`BrowserContext` instance per test out of the box. Alternatively you can use the [library](./library.md) to manually write the testing infrastructure.

1. Start by creating a new project with `dotnet new`. This will create the `copilotbrowserTests` directory which includes a `UnitTest1.cs` file:


```bash
dotnet new nunit -n copilotbrowserTests
cd copilotbrowserTests
```


```bash
dotnet new mstest -n copilotbrowserTests
cd copilotbrowserTests
```


```bash
dotnet new xunit -n copilotbrowserTests
cd copilotbrowserTests
```


```bash
dotnet new xunit3 -n copilotbrowserTests
cd copilotbrowserTests
```


2. Install the necessary copilotbrowser dependencies:


```bash
dotnet add package Microsoft.copilotbrowser.NUnit
```


```bash
dotnet add package Microsoft.copilotbrowser.MSTest
```


```bash
dotnet add package Microsoft.copilotbrowser.Xunit
```


```bash
dotnet add package Microsoft.copilotbrowser.Xunit.v3
```


3. Build the project so the `copilotbrowser.ps1` is available inside the `bin` directory:

```bash
dotnet build
```

1. Install required browsers. This example uses `net8.0`, if you are using a different version of .NET you will need to adjust the command and change `net8.0` to your version.

```bash
pwsh bin/Debug/net8.0/copilotbrowser.ps1 install
```

If `pwsh` is not available, you will have to [install PowerShell](https://docs.microsoft.com/powershell/scripting/install/installing-powershell).

## Add Example Tests

Edit the `UnitTest1.cs` file with the code below to create an example end-to-end test:


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
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;

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


## Running the Example Tests

By default tests will be run on Chromium. This can be configured via the `BROWSER` environment variable, or by adjusting the [launch configuration options](./running-tests.md). Tests are run in headless mode meaning no browser will open up when running the tests. Results of the tests and test logs will be shown in the terminal.

```bash
dotnet test
```

See our doc on [Running and Debugging Tests](./running-tests.md) to learn more about running tests in headed mode, running multiple tests, running specific configurations etc.

## System requirements

- copilotbrowser is distributed as a .NET Standard 2.0 library. We recommend .NET 8.
- Windows 11+, Windows Server 2019+ or Windows Subsystem for Linux (WSL).
- macOS 14 Ventura, or later.
- Debian 12, Debian 13, Ubuntu 22.04, Ubuntu 24.04, on x86-64 and arm64 architecture.

## What's next

- [Write tests using web first assertions, page fixtures and locators](./writing-tests.md)
- [Run single test, multiple tests, headed mode](./running-tests.md)
- [Generate tests with Codegen](./codegen-intro.md)
- [See a trace of your tests](./trace-viewer-intro.md)
- [Run tests on CI](./ci-intro.md)
- [Learn more about the MSTest, NUnit, xUnit and xUnit v3 base classes](./test-runners.md)
