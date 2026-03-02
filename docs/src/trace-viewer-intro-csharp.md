---
id: trace-viewer-intro-csharp
title: "Trace viewer"
sidebar_label: "Trace viewer (C#)"
---

## Introduction

copilotbrowser Trace Viewer is a GUI tool that lets you explore recorded copilotbrowser traces of your tests meaning you can go back and forward though each action of your test and visually see what was happening during each action.

**You will learn**

- How to record a trace
- How to open the trace viewer

## Recording a trace

Traces can be recorded using the **BrowserContext.tracing** API as follows:


```csharp
namespace copilotbrowserTests;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class Tests : PageTest
{
    [SetUp]
    public async Task Setup()
    {
        await Context.Tracing.StartAsync(new()
        {
            Title = $"{TestContext.CurrentContext.Test.ClassName}.{TestContext.CurrentContext.Test.Name}",
            Screenshots = true,
            Snapshots = true,
            Sources = true
        });
    }

    [TearDown]
    public async Task TearDown()
    {
        await Context.Tracing.StopAsync(new()
        {
            Path = Path.Combine(
                TestContext.CurrentContext.WorkDirectory,
                "copilotbrowser-traces",
                $"{TestContext.CurrentContext.Test.ClassName}.{TestContext.CurrentContext.Test.Name}.zip"
            )
        });
    }

    [Test]
    public async Task GetStartedLink()
    {
        // ..
    }
}
```


```csharp
using System.Text.RegularExpressions;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTest : PageTest
{
    [TestInitialize]
    public async Task TestInitialize()
    {
         await Context.Tracing.StartAsync(new()
        {
            Title = $"{TestContext.FullyQualifiedTestClassName}.{TestContext.TestName}",
            Screenshots = true,
            Snapshots = true,
            Sources = true
        });
    }

    [TestCleanup]
    public async Task TestCleanup()
    {
        await Context.Tracing.StopAsync(new()
        {
            Path = Path.Combine(
                Environment.CurrentDirectory,
                "copilotbrowser-traces",
                $"{TestContext.FullyQualifiedTestClassName}.{TestContext.TestName}.zip"
            )
        });
    }

    [TestMethod]
    public async Task GetStartedLink()
    {
        // ...
    }
}
```


```csharp
using System.Reflection;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit;
using Xunit.Sdk;

namespace copilotbrowserTests;

[WithTestName]
public class UnitTest1 : PageTest
{
    public override async Task InitializeAsync()
    {
        await base.InitializeAsync().ConfigureAwait(false);
        await Context.Tracing.StartAsync(new()
        {
            Title = $"{WithTestNameAttribute.CurrentClassName}.{WithTestNameAttribute.CurrentTestName}",
            Screenshots = true,
            Snapshots = true,
            Sources = true
        });
    }

    public override async Task DisposeAsync()
    {
        await Context.Tracing.StopAsync(new()
        {
            Path = Path.Combine(
                Environment.CurrentDirectory,
                "copilotbrowser-traces",
               $"{WithTestNameAttribute.CurrentClassName}.{WithTestNameAttribute.CurrentTestName}.zip"
            )
        });
        await base.DisposeAsync().ConfigureAwait(false);
    }

    [Fact]
    public async Task GetStartedLink()
    {
        // ...
        await Page.GotoAsync("https://dayour.github.io/copilotbrowser/dotnet/docs/intro");
    }
}

public class WithTestNameAttribute : BeforeAfterTestAttribute
{
    public static string CurrentTestName = string.Empty;
    public static string CurrentClassName = string.Empty;

    public override void Before(MethodInfo methodInfo)
    {
        CurrentTestName = methodInfo.Name;
        CurrentClassName = methodInfo.DeclaringType!.Name;
    }

    public override void After(MethodInfo methodInfo)
    {
    }
}
```

```csharp
using System.Reflection;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.Xunit.v3;
using Xunit.Sdk;

namespace copilotbrowserTests;

[WithTestName]
public class UnitTest1 : PageTest
{
    public override async Task InitializeAsync()
    {
        await base.InitializeAsync().ConfigureAwait(false);
        await Context.Tracing.StartAsync(new()
        {
            Title = $"{WithTestNameAttribute.CurrentClassName}.{WithTestNameAttribute.CurrentTestName}",
            Screenshots = true,
            Snapshots = true,
            Sources = true
        });
    }

    public override async Task DisposeAsync()
    {
        await Context.Tracing.StopAsync(new()
        {
            Path = Path.Combine(
                Environment.CurrentDirectory,
                "copilotbrowser-traces",
               $"{WithTestNameAttribute.CurrentClassName}.{WithTestNameAttribute.CurrentTestName}.zip"
            )
        });
        await base.DisposeAsync().ConfigureAwait(false);
    }

    [Fact]
    public async Task GetStartedLink()
    {
        // ...
        await Page.GotoAsync("https://dayour.github.io/copilotbrowser/dotnet/docs/intro");
    }
}

public class WithTestNameAttribute : BeforeAfterTestAttribute
{
    public static string CurrentTestName = string.Empty;
    public static string CurrentClassName = string.Empty;

    public override void Before(MethodInfo methodInfo)
    {
        CurrentTestName = methodInfo.Name;
        CurrentClassName = methodInfo.DeclaringType!.Name;
    }

    public override void After(MethodInfo methodInfo)
    {
    }
}
```

This will record a zip file for each test, e.g. `copilotbrowserTests.ExampleTest.GetStartedLink.zip` and place it into the `bin/Debug/net8.0/copilotbrowser-traces/` directory.

## Opening the trace

You can open the saved trace using the copilotbrowser CLI or in your browser on [`trace.copilotbrowser.dev`](https://trace.copilotbrowser.dev). Make sure to add the full path to where your trace's zip file is located. Once opened you can click on each action or use the timeline to see the state of the page before and after each action. You can also inspect the log, source and network during each step of the test. The trace viewer creates a DOM snapshot so you can fully interact with it, open devtools etc.


```bash csharp
pwsh bin/Debug/net8.0/copilotbrowser.ps1 show-trace bin/Debug/net8.0/copilotbrowser-traces/copilotbrowserTests.ExampleTest.GetStartedLink.zip
```

![copilotbrowser trace viewer dotnet](https://github.com/dayour/copilotbrowser/assets/13063165/4372d661-5bfa-4e1f-be65-0d2fe165a75c)


Check out our detailed guide on [Trace Viewer](/trace-viewer.md) to learn more about the trace viewer and how to setup your tests to record a trace only when the test fails.

## What's next

- [Run tests on CI with GitHub Actions](/ci-intro.md)
- [Learn more about the MSTest, NUnit, xUnit, and xUnit v3 base classes](./test-runners.md)
