---
id: library-csharp
title: "Getting started - Library"
sidebar_label: "Getting started - Library (C#)"
---

## Introduction

copilotbrowser can either be used with the [MSTest, NUnit, xUnit, or xUnit v3 base classes](./test-runners.md) or as a copilotbrowser Library (this guide). If you are working on an application that utilizes copilotbrowser capabilities or you are using copilotbrowser with another test runner, read on.

## Usage

Create a console project and add the copilotbrowser dependency.

```bash
# Create project
dotnet new console -n copilotbrowserDemo
cd copilotbrowserDemo

# Add project dependency
dotnet add package Microsoft.copilotbrowser
# Build the project
dotnet build
# Install required browsers - replace netX with actual output folder name, e.g. net8.0.
pwsh bin/Debug/netX/copilotbrowser.ps1 install

# If the pwsh command does not work (throws TypeNotFound), make sure to use an up-to-date version of PowerShell.
dotnet tool update --global PowerShell
```

Create a `Program.cs` that will navigate to `https://dayour.github.io/copilotbrowser/dotnet` and take a screenshot in Chromium.

```csharp
using Microsoft.copilotbrowser;

using var copilotbrowser = await copilotbrowser.CreateAsync();
await using var browser = await copilotbrowser.Chromium.LaunchAsync();
var page = await browser.NewPageAsync();
await page.GotoAsync("https://dayour.github.io/copilotbrowser/dotnet");
await page.ScreenshotAsync(new()
{
    Path = "screenshot.png"
});
```

Now run it.

```bash
dotnet run
```

By default, copilotbrowser runs the browsers in headless mode. To see the browser UI, set **BrowserType.launch.headless** option to `false`. You can also use **BrowserType.launch.slowMo** to slow down execution. Learn more in the debugging tools [section](./debug.md).

```csharp
await using var browser = await copilotbrowser.Firefox.LaunchAsync(new()
{
    Headless = false,
    SlowMo = 50,
});
```

## Using Assertions

You can do the following to leverage copilotbrowser's web-first assertions when you are using your own test framework. These will automatically retry until the condition is met, e.g. an element has a certain text or the timeout is reached:

```csharp
using Microsoft.copilotbrowser;
using static Microsoft.copilotbrowser.Assertions;

// Change the default 5 seconds timeout if you'd like.
SetDefaultExpectTimeout(10_000);

using var copilotbrowser = await copilotbrowser.CreateAsync();
await using var browser = await copilotbrowser.Chromium.LaunchAsync();
var page = await browser.NewPageAsync();
await page.GotoAsync("https://dayour.github.io/copilotbrowser/dotnet");
await Expect(page.GetByRole(AriaRole.Link, new() { Name = "Get started" })).ToBeVisibleAsync();
```

## Bundle drivers for different platforms

copilotbrowser by default does bundle only the driver for the .NET publish target runtime. If you want to bundle for additional platforms, you can
override this behavior by using either `all`, `none` or `linux`, `win`, `osx` in your project file.

```xml
<PropertyGroup>
  <copilotbrowserPlatform>all</copilotbrowserPlatform>
</PropertyGroup>
```

or:

```xml
<PropertyGroup>
  <copilotbrowserPlatform>osx;linux</copilotbrowserPlatform>
</PropertyGroup>
```
