---
id: running-tests-java
title: "Running and debugging tests"
sidebar_label: "Running and debugging tests (Java)"
---

## Introduction

copilotbrowser tests can be run in a variety of ways. We recommend hooking it up to your favorite test runner, e.g., [JUnit](./test-runners.md), since it gives you the ability to run tests in parallel, run single test, etc.

You can run a single test, a set of tests or all tests. Tests can be run on one browser or multiple browsers. By default tests are run in a headless manner meaning no browser window will be opened while running the tests and results will be seen in the terminal. If you prefer, you can run your tests in headed mode by using the `launch(new BrowserType.LaunchOptions().setHeadless(false))` option.

In [JUnit](https://junit.org/junit5/), you can initialize `copilotbrowser` and `Browser` in [@BeforeAll](https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/BeforeAll.html) method and
destroy them in [@AfterAll](https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/AfterAll.html). In the example below, all three test methods use the same
`Browser`. Each test uses its own `BrowserContext` and `Page`.

```java
package org.example;

import com.microsoft.copilotbrowser.Browser;
import com.microsoft.copilotbrowser.BrowserContext;
import com.microsoft.copilotbrowser.Page;
import com.microsoft.copilotbrowser.copilotbrowser;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class TestExample {
  // Shared between all tests in this class.
  static copilotbrowser copilotbrowser;
  static Browser browser;

  // New instance for each test method.
  BrowserContext context;
  Page page;

  @BeforeAll
  static void launchBrowser() {
    copilotbrowser = copilotbrowser.create();
    browser = copilotbrowser.chromium().launch();
  }

  @AfterAll
  static void closeBrowser() {
    copilotbrowser.close();
  }

  @BeforeEach
  void createContextAndPage() {
    context = browser.newContext();
    page = context.newPage();
  }

  @AfterEach
  void closeContext() {
    context.close();
  }

  @Test
  void shouldClickButton() {
    page.navigate("data:text/html,<script>var result;</script><button onclick='result=\"Clicked\"'>Go</button>");
    page.locator("button").click();
    assertEquals("Clicked", page.evaluate("result"));
  }

  @Test
  void shouldCheckTheBox() {
    page.setContent("<input id='checkbox' type='checkbox'></input>");
    page.locator("input").check();
    assertTrue((Boolean) page.evaluate("() => window['checkbox'].checked"));
  }

  @Test
  void shouldSearchWiki() {
    page.navigate("https://www.wikipedia.org/");
    page.locator("input[name=\"search\"]").click();
    page.locator("input[name=\"search\"]").fill("copilotbrowser");
    page.locator("input[name=\"search\"]").press("Enter");
    assertEquals("https://en.wikipedia.org/wiki/copilotbrowser", page.url());
  }
}
```

See [here](./test-runners.md) for further details on how to run tests in parallel, etc.

See experimental [JUnit integration](./junit.md) to automatically initialize copilotbrowser objects and more.

### Run tests in headed mode

If you prefer, you can run your tests in headed mode by using the `launch(new BrowserType.LaunchOptions().setHeadless(false))` option.

## What's Next

- [Debugging tests](./debug.md)
- [Generate tests with Codegen](./codegen.md)
- [See a trace of your tests](./trace-viewer-intro.md)
