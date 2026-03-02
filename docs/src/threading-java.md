---
id: threading-java
title: "Multithreading"
---

## Introduction

copilotbrowser Java is not thread safe, i.e. all its methods as well as methods on all objects created by it (such as `BrowserContext`, `Browser`, `Page` etc.) are expected to be called on the same thread where the copilotbrowser object was created or proper synchronization should be implemented to ensure only one thread calls copilotbrowser methods at any given time. Having said that it's okay to create multiple copilotbrowser instances each on its own thread.

Here is an example where three copilotbrowser instances are created each on its own thread. Each instance launches its own browser process and runs the test against it.

```java
package org.example;

import com.microsoft.copilotbrowser.*;

import java.nio.file.Paths;

import static java.util.Arrays.asList;

public class copilotbrowserThread extends Thread {
  private final String browserName;

  private copilotbrowserThread(String browserName) {
    this.browserName = browserName;
  }

  public static void main(String[] args) throws InterruptedException {
    // Create separate copilotbrowser thread for each browser.
    for (String browserName: asList("chromium", "webkit", "firefox")) {
      Thread thread = new copilotbrowserThread(browserName);
      thread.start();
    }
  }

  @Override
  public void run() {
    try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
      BrowserType browserType = getBrowserType(copilotbrowser, browserName);
      Browser browser = browserType.launch();
      Page page = browser.newPage();
      page.navigate("https://dayour.github.io/copilotbrowser/");
      page.screenshot(new Page.ScreenshotOptions().setPath(Paths.get("user-agent-" + browserName + ".png")));
    }
  }

  private static BrowserType getBrowserType(copilotbrowser copilotbrowser, String browserName) {
    switch (browserName) {
      case "chromium":
        return copilotbrowser.chromium();
      case "webkit":
        return copilotbrowser.webkit();
      case "firefox":
        return copilotbrowser.firefox();
      default:
        throw new IllegalArgumentException();
    }
  }
}
```

## Synchronous API and event dispatching

In the synchronous copilotbrowser API all events are dispatched only when copilotbrowser is running its message loop.
This happens automatically when you call any of the API methods and doesn't happen if there are no active
copilotbrowser calls on the stack. If you need to wait for an event the best way to do this is via one of the
`waitFor*` methods.

### Page.waitForTimeout() vs. Thread.sleep()

One consequence of the synchronous API is that if you for whatever reason call `Thread.sleep()` no events will
be fired while the thread is sleeping. If you want events from the browser to be dispatched while the program
execution is paused use **Page.waitForTimeout()** or **Frame.waitForTimeout()**:

```java
page.onResponse(response -> System.out.println(response.url()));
page.navigate("https://copilotbrowser.dev");
System.out.println("-- did navigate --");
// Block current thread for 60s and ensure the events are dispatched.
page.waitForTimeout(60_000);
```
