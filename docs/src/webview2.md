---
id: webview2
title: "WebView2"
---

## Introduction

The following will explain how to use copilotbrowser with [Microsoft Edge WebView2](https://docs.microsoft.com/en-us/microsoft-edge/webview2/). WebView2 is a WinForms control, which will use Microsoft Edge under the hood to render web content. It is a part of the Microsoft Edge browser and is available on Windows 10 and Windows 11. copilotbrowser can be used to automate WebView2 applications and can be used to test web content in WebView2. For connecting to WebView2, copilotbrowser uses **BrowserType.connectOverCDP()** which connects to it via the Chrome DevTools Protocol (CDP).

## Overview

A WebView2 control can be instructed to listen to incoming CDP connections by setting either the `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` environment variable with `--remote-debugging-port=9222` or calling [EnsureCoreWebView2Async](https://docs.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.wpf.webview2.ensurecorewebview2async?view=webview2-dotnet-1.0.1343.22) with the `--remote-debugging-port=9222` argument. This will start the WebView2 process with the Chrome DevTools Protocol enabled which allows the automation by copilotbrowser. 9222 is an example port in this case, but any other unused port can be used as well.

```csharp generic
await this.webView.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateAsync(null, null, new CoreWebView2EnvironmentOptions()
{
  AdditionalBrowserArguments = "--remote-debugging-port=9222",
})).ConfigureAwait(false);
```

Once your application with the WebView2 control is running, you can connect to it via copilotbrowser:

```js
const browser = await copilotbrowser.chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];
const page = context.pages()[0];
```

```java
Browser browser = copilotbrowser.chromium().connectOverCDP("http://localhost:9222");
BrowserContext context = browser.contexts().get(0);
Page page = context.pages().get(0);
```

```python async
browser = await copilotbrowser.chromium.connect_over_cdp("http://localhost:9222")
context = browser.contexts[0]
page = context.pages[0]
```

```python sync
browser = copilotbrowser.chromium.connect_over_cdp("http://localhost:9222")
context = browser.contexts[0]
page = context.pages[0]
```

```csharp
var browser = await copilotbrowser.Chromium.ConnectOverCDPAsync("http://localhost:9222");
var context = browser.Contexts[0];
var page = context.Pages[0];
```

To ensure that the WebView2 control is ready, you can wait for the [`CoreWebView2InitializationCompleted`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.wpf.webview2.corewebview2initializationcompleted?view=webview2-dotnet-1.0.1343.22) event:

```csharp generic
this.webView.CoreWebView2InitializationCompleted += (_, e) =>
{
    if (e.IsSuccess)
    {
        Console.WriteLine("WebView2 initialized");
    }
};
```

## Writing and running tests

By default, the WebView2 control will use the same user data directory for all instances. This means that if you run multiple tests in parallel, they will interfere with each other. To avoid this, you should set the `WEBVIEW2_USER_DATA_FOLDER` environment variable (or use [WebView2.EnsureCoreWebView2Async Method](https://docs.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.wpf.webview2.ensurecorewebview2async?view=webview2-dotnet-1.0.1343.22)) to a different folder for each test. This will make sure that each test runs in its own user data directory.

Using the following, copilotbrowser will run your WebView2 application as a sub-process, assign a unique user data directory to it and provide the `Page` instance to your test:

<!-- source code is available here to verify that the examples are working https://github.com/mxschmitt/copilotbrowser-webview2-demo -->

```js title="webView2Test.ts"
import { test as base } from '@copilotbrowser/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import childProcess from 'child_process';

const EXECUTABLE_PATH = path.join(
    __dirname,
    '../../webview2-app/bin/Debug/net8.0-windows/webview2.exe',
);

export const test = base.extend({
  browser: async ({ copilotbrowser }, use, testInfo) => {
    const cdpPort = 10000 + testInfo.workerIndex;
    // Make sure that the executable exists and is executable
    fs.accessSync(EXECUTABLE_PATH, fs.constants.X_OK);
    const userDataDir = path.join(
        fs.realpathSync.native(os.tmpdir()),
        `copilotbrowser-webview2-tests/user-data-dir-${testInfo.workerIndex}`,
    );
    const webView2Process = childProcess.spawn(EXECUTABLE_PATH, [], {
      shell: true,
      env: {
        ...process.env,
        WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${cdpPort}`,
        WEBVIEW2_USER_DATA_FOLDER: userDataDir,
      }
    });
    await new Promise<void>(resolve => webView2Process.stdout.on('data', data => {
      if (data.toString().includes('WebView2 initialized'))
        resolve();
    }));
    const browser = await copilotbrowser.chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
    await use(browser);
    await browser.close();
    childProcess.execSync(`taskkill /pid ${webView2Process.pid} /T /F`);
    fs.rmdirSync(userDataDir, { recursive: true });
  },
  context: async ({ browser }, use) => {
    const context = browser.contexts()[0];
    await use(context);
  },
  page: async ({ context }, use) => {
    const page = context.pages()[0];
    await use(page);
  },
});

export { expect } from '@copilotbrowser/test';
```

```js title="example.spec.ts"
import { test, expect } from './webView2Test';

test('test WebView2', async ({ page }) => {
  await page.goto('https://copilotbrowser.dev');
  const getStarted = page.getByText('Get Started');
  await expect(getStarted).toBeVisible();
});
```

```java title="WebView2Process.java"
package com.example;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class WebView2Process {
  public int cdpPort;
  private Path _dataDir;
  private Process _process;
  private Path _executablePath = Path.of("../webview2-app/bin/Debug/net8.0-windows/webview2.exe");

  public WebView2Process() throws IOException {
    cdpPort = nextFreePort();
    _dataDir = Files.createTempDirectory("pw-java-webview2-tests-");

    if (!Files.exists(_executablePath)) {
      throw new RuntimeException("Executable not found: " + _executablePath);
    }
    ProcessBuilder pb = new ProcessBuilder().command(_executablePath.toAbsolutePath().toString());
    Map<String, String> envMap = pb.environment();
    envMap.put("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--remote-debugging-port=" + cdpPort);
    envMap.put("WEBVIEW2_USER_DATA_FOLDER", _dataDir.toString());
    _process = pb.start();
    // wait until "WebView2 initialized" got printed
    BufferedReader reader = new BufferedReader(new InputStreamReader(_process.getInputStream()));
    while (true) {
      String line = reader.readLine();
      if (line == null) {
        throw new RuntimeException("WebView2 process exited");
      }
      if (line.contains("WebView2 initialized")) {
        break;
      }
    }
  }

  private static final AtomicInteger nextUnusedPort = new AtomicInteger(9000);

  private static boolean available(int port) {
    try (ServerSocket ignored = new ServerSocket(port)) {
      return true;
    } catch (IOException ignored) {
      return false;
    }
  }

  static int nextFreePort() {
    for (int i = 0; i < 100; i++) {
      int port = nextUnusedPort.getAndIncrement();
      if (available(port)) {
        return port;
      }
    }
    throw new RuntimeException("Cannot find free port: " + nextUnusedPort.get());
  }

  public void dispose() {
    _process.destroy();
    try {
      _process.waitFor();
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
  }
}
```

```java title="TestExample.java"
package com.example;

import com.microsoft.copilotbrowser.Browser;
import com.microsoft.copilotbrowser.BrowserContext;
import com.microsoft.copilotbrowser.Locator;
import com.microsoft.copilotbrowser.Page;
import com.microsoft.copilotbrowser.copilotbrowser;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;

import java.io.IOException;

public class TestExample {
  // Shared between all tests in this class.
  static WebView2Process webview2Process;
  static copilotbrowser copilotbrowser;
  static Browser browser;
  static BrowserContext context;
  static Page page;

  @BeforeAll
  static void launchBrowser() throws IOException {
    copilotbrowser = copilotbrowser.create();
    webview2Process = new WebView2Process();
    browser = copilotbrowser.chromium().connectOverCDP("http://127.0.0.1:" + webview2Process.cdpPort);
    context = browser.contexts().get(0);
    page = context.pages().get(0);
  }

  @AfterAll
  static void closeBrowser() {
    webview2Process.dispose();
  }

  @Test
  public void shouldClickButton() {
    page.navigate("https://copilotbrowser.dev");
    Locator gettingStarted = page.getByText("Get started");
    assertThat(gettingStarted).isVisible();
  }
}
```

```python title="conftest.py"
import os
import socket
import tempfile
import pytest
from pathlib import Path
from copilotbrowser.sync_api import copilotbrowser, Browser, BrowserContext
import subprocess

EXECUTABLE_PATH = (
    Path(__file__).parent
    / ".."
    / "webview2-app"
    / "bin"
    / "Debug"
    / "net8.0-windows"
    / "webview2.exe"
)


@pytest.fixture(scope="session")
def data_dir():
    with tempfile.TemporaryDirectory(
        prefix="copilotbrowser-webview2-tests", ignore_cleanup_errors=True
    ) as tmpdirname:
        yield tmpdirname


@pytest.fixture(scope="session")
def webview2_process_cdp_port(data_dir: str):
    cdp_port = _find_free_port()
    process = subprocess.Popen(
        [EXECUTABLE_PATH],
        env={
            **dict(os.environ),
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS": f"--remote-debugging-port={cdp_port}",
            "WEBVIEW2_USER_DATA_FOLDER": data_dir,
        },
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
    )
    while True:
        line = process.stdout.readline()
        if "WebView2 initialized" in line:
            break
    yield cdp_port
    process.terminate()


@pytest.fixture(scope="session")
def browser(copilotbrowser: copilotbrowser, webview2_process_cdp_port: int):
    browser = copilotbrowser.chromium.connect_over_cdp(
        f"http://127.0.0.1:{webview2_process_cdp_port}"
    )
    yield browser


@pytest.fixture(scope="function")
def context(browser: Browser):
    context = browser.contexts[0]
    yield context


@pytest.fixture(scope="function")
def page(context: BrowserContext):
    page = context.pages[0]
    yield page


def _find_free_port(port=9000, max_port=65535):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    while port <= max_port:
        try:
            sock.bind(("", port))
            sock.close()
            return port
        except OSError:
            port += 1
    raise IOError("no free ports")
```

```python title="test_webview2.py"
from copilotbrowser.sync_api import Page, expect


def test_webview2(page: Page):
    page.goto("https://copilotbrowser.dev")
    get_started = page.get_by_text("Get Started")
    expect(get_started).to_be_visible()
```

```csharp
// WebView2Test.cs
using System.Diagnostics;
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTest : copilotbrowserTest
{
    public IBrowser Browser { get; internal set; } = null!;
    public IBrowserContext Context { get; internal set; } = null!;
    public IPage Page { get; internal set; } = null!;
    private Process? _webView2Process = null;
    private string _userDataDir = null!;
    private string _executablePath = Path.Join(Directory.GetCurrentDirectory(), @"..\..\..\..\webview2-app\bin\Debug\net8.0-windows\webview2.exe");

    [TestInitialize]
    public async Task BrowserTestInitialize()
    {
        var cdpPort = 10000 + WorkerIndex;
        Assert.IsTrue(File.Exists(_executablePath), "Make sure that the executable exists");
        _userDataDir = Path.Join(Path.GetTempPath(), $"copilotbrowser-webview2-tests/user-data-dir-{WorkerIndex}");
        // WebView2 does some lazy cleanups on shutdown so we can't clean it up after each test
        if (Directory.Exists(_userDataDir))
        {
            Directory.Delete(_userDataDir, true);
        }
        _webView2Process = Process.Start(new ProcessStartInfo(_executablePath)
        {
            EnvironmentVariables =
        {
            ["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = $"--remote-debugging-port={cdpPort}",
            ["WEBVIEW2_USER_DATA_FOLDER"] = _userDataDir,
        },
            RedirectStandardOutput = true,
        });
        while (!_webView2Process!.HasExited)
        {
            var output = await _webView2Process!.StandardOutput.ReadLineAsync();
            if (_webView2Process!.HasExited)
            {
                throw new Exception("WebView2 process exited unexpectedly");
            }
            if (output != null && output.Contains("WebView2 initialized"))
            {
                break;
            }
        }
        var cdpAddress = $"http://127.0.0.1:{cdpPort}";
        Browser = await copilotbrowser.Chromium.ConnectOverCDPAsync(cdpAddress);
        Context = Browser.Contexts[0];
        Page = Context.Pages[0];
    }

    [TestCleanup]
    public async Task BrowserTestCleanup()
    {
        _webView2Process!.Kill(true);
        await Browser.CloseAsync();
    }
}
```

```csharp
// UnitTest1.cs
using Microsoft.copilotbrowser;
using Microsoft.copilotbrowser.MSTest;

namespace copilotbrowserTests;

[TestClass]
public class ExampleTest : WebView2Test
{
    [TestMethod]
    public async Task HomepageHascopilotbrowserInTitleAndGetStartedLinkLinkingtoTheIntroPage()
    {
        await Page.GotoAsync("https://copilotbrowser.dev");
        var getStarted = Page.GetByText("Get Started");
        await Expect(getStarted).ToBeVisibleAsync();
    }
}
```

## Debugging

Inside your webview2 control, you can just right-click to open the context menu and select "Inspect" to open the DevTools or press <kbd>F12</kbd>. You can also use the [WebView2.CoreWebView2.OpenDevToolsWindow](https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.core.corewebview2.opendevtoolswindow?view=webview2-dotnet-1.0.1462.37) method to open the DevTools programmatically.

For debugging tests, see the copilotbrowser [Debugging guide](./debug).
