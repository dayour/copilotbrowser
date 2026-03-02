---
id: browser-contexts
title: "Isolation"
---

## Introduction

Tests written with copilotbrowser execute in isolated clean-slate environments called browser contexts. This isolation model improves reproducibility and prevents cascading test failures. 

## What is Test Isolation? 

Test Isolation is when each test is completely isolated from another test. Every test runs independently from any other test. This means that each test has its own local storage, session storage, cookies etc. copilotbrowser achieves this using `BrowserContext`s which are equivalent to incognito-like profiles. They are fast and cheap to create and are completely isolated, even when running in a single browser. copilotbrowser creates a context for each test, and provides a default `Page` in that context.

## Why is Test Isolation Important? 

- No failure carry-over. If one test fails it doesn't affect the other test.
- Easy to debug errors or flakiness, because you can run just a single test as many times as you'd like. 
- Don't have to think about the order when running in parallel, sharding, etc.

## Two Ways of Test Isolation

There are two different strategies when it comes to Test Isolation: start from scratch or cleanup in between. The problem with cleaning up in between tests is that it can be easy to forget to clean up and some things are impossible to clean up such as "visited links". State from one test can leak into the next test which could cause your test to fail and make debugging harder as the problem comes from another test. Starting from scratch means everything is new, so if the test fails you only have to look within that test to debug.

## How copilotbrowser Achieves Test Isolation

copilotbrowser uses browser contexts to achieve Test Isolation. Each test has its own Browser Context. Running the test creates a new browser context each time.  When using copilotbrowser as a Test Runner, browser contexts are created by default. Otherwise, you can create browser contexts manually.

```js tab=js-test
import { test } from '@copilotbrowser/test';

test('example test', async ({ page, context }) => {
  // "context" is an isolated BrowserContext, created for this specific test.
  // "page" belongs to this context.
});

test('another test', async ({ page, context }) => {
  // "context" and "page" in this second test are completely
  // isolated from the first test.
});
```

```js tab=js-library
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
```

```java
Browser browser = chromium.launch();
BrowserContext context = browser.newContext();
Page page = context.newPage();
```

```python async
browser = await copilotbrowser.chromium.launch()
context = await browser.new_context()
page = await context.new_page()
```

```python sync
browser = copilotbrowser.chromium.launch()
context = browser.new_context()
page = context.new_page()
```

```csharp
using var copilotbrowser = await copilotbrowser.CreateAsync();
var browser = await copilotbrowser.Chromium.LaunchAsync();
var context = await browser.NewContextAsync();
var page = await context.NewPageAsync();
```

Browser contexts can also be used to emulate multi-page scenarios involving mobile devices, permissions, locale and color scheme. Check out our [Emulation](./emulation.md) guide for more details.

## Multiple Contexts in a Single Test

copilotbrowser can create multiple browser contexts within a single scenario. This is useful when you want to test for multi-user functionality, like a chat.

```js tab=js-test
import { test } from '@copilotbrowser/test';

test('admin and user', async ({ browser }) => {
  // Create two isolated browser contexts
  const adminContext = await browser.newContext();
  const userContext = await browser.newContext();

  // Create pages and interact with contexts independently
  const adminPage = await adminContext.newPage();
  const userPage = await userContext.newPage();
});
```

```js tab=js-library
const { chromium } = require('copilotbrowser');

// Create a Chromium browser instance
const browser = await chromium.launch();

// Create two isolated browser contexts
const userContext = await browser.newContext();
const adminContext = await browser.newContext();

// Create pages and interact with contexts independently
const adminPage = await adminContext.newPage();
const userPage = await userContext.newPage();
```

```java
import com.microsoft.copilotbrowser.*;

public class Example {
  public static void main(String[] args) {
    try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
      BrowserType chromium = copilotbrowser.chromium();
      // Create a Chromium browser instance
      Browser browser = chromium.launch();
      // Create two isolated browser contexts
      BrowserContext userContext = browser.newContext();
      BrowserContext adminContext = browser.newContext();
      // Create pages and interact with contexts independently
    }
  }
}
```

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, copilotbrowser

async def run(copilotbrowser: copilotbrowser):
    # create a chromium browser instance
    chromium = copilotbrowser.chromium
    browser = await chromium.launch()

    # create two isolated browser contexts
    user_context = await browser.new_context()
    admin_context = await browser.new_context()

    # create pages and interact with contexts independently

async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)
asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser, copilotbrowser

def run(copilotbrowser: copilotbrowser):
    # create a chromium browser instance
    chromium = copilotbrowser.chromium
    browser = chromium.launch()

    # create two isolated browser contexts
    user_context = browser.new_context()
    admin_context = browser.new_context()

    # create pages and interact with contexts independently

with sync_copilotbrowser() as copilotbrowser:
    run(copilotbrowser)
```

```csharp
using Microsoft.copilotbrowser;
using System.Threading.Tasks;

class Program
{
    public static async Task Main()
    {
        using var copilotbrowser = await copilotbrowser.CreateAsync();
        // Create a Chromium browser instance
        await using var browser = await copilotbrowser.Chromium.LaunchAsync();
        await using var userContext = await browser.NewContextAsync();
        await using var adminContext = await browser.NewContextAsync();
        // Create pages and interact with contexts independently.
    }
}
```
