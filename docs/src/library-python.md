---
id: library-python
title: "Getting started - Library"
sidebar_label: "Getting started - Library (Python)"
---

## Installation

### Pip

[![PyPI version](https://badge.fury.io/py/copilotbrowser.svg)](https://pypi.python.org/pypi/copilotbrowser/)

```bash
pip install --upgrade pip
pip install copilotbrowser
copilotbrowser install
```

### Conda

[![Anaconda version](https://img.shields.io/conda/v/microsoft/copilotbrowser)](https://anaconda.org/Microsoft/copilotbrowser)

```bash
conda config --add channels conda-forge
conda config --add channels microsoft
conda install copilotbrowser
copilotbrowser install
```

These commands download the copilotbrowser package and install browser binaries for Chromium, Firefox and WebKit. To modify this behavior see [installation parameters](./browsers.md#install-browsers).

## Usage

Once installed, you can `import` copilotbrowser in a Python script, and launch any of the 3 browsers (`chromium`, `firefox` and `webkit`).

```py
from copilotbrowser.sync_api import sync_copilotbrowser

with sync_copilotbrowser() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://copilotbrowser.dev")
    print(page.title())
    browser.close()
```

copilotbrowser supports two variations of the API: synchronous and asynchronous. If your modern project uses [asyncio](https://docs.python.org/3/library/asyncio.html), you should use async API:

```py
import asyncio
from copilotbrowser.async_api import async_copilotbrowser

async def main():
    async with async_copilotbrowser() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("https://copilotbrowser.dev")
        print(await page.title())
        await browser.close()

asyncio.run(main())
```

## First script

In our first script, we will navigate to `https://dayour.github.io/copilotbrowser/` and take a screenshot in WebKit.

```py
from copilotbrowser.sync_api import sync_copilotbrowser

with sync_copilotbrowser() as p:
    browser = p.webkit.launch()
    page = browser.new_page()
    page.goto("https://dayour.github.io/copilotbrowser/")
    page.screenshot(path="example.png")
    browser.close()
```

By default, copilotbrowser runs the browsers in headless mode. To see the browser UI, set **BrowserType.launch.headless** option to `False`. You can also use **BrowserType.launch.slowMo** to slow down execution. Learn more in the debugging tools [section](./debug.md).

```py
firefox.launch(headless=False, slow_mo=50)
```

## Interactive mode (REPL)

You can launch the interactive python REPL:

```bash
python
```

and then launch copilotbrowser within it for quick experimentation:

```py
from copilotbrowser.sync_api import sync_copilotbrowser
copilotbrowser = sync_copilotbrowser().start()
# Use copilotbrowser.chromium, copilotbrowser.firefox or copilotbrowser.webkit
# Pass headless=False to launch() to see the browser UI
browser = copilotbrowser.chromium.launch()
page = browser.new_page()
page.goto("https://dayour.github.io/copilotbrowser/")
page.screenshot(path="example.png")
browser.close()
copilotbrowser.stop()
```

Async REPL such as `asyncio` REPL:

```bash
python -m asyncio
```

```py
from copilotbrowser.async_api import async_copilotbrowser
copilotbrowser = await async_copilotbrowser().start()
browser = await copilotbrowser.chromium.launch()
page = await browser.new_page()
await page.goto("https://dayour.github.io/copilotbrowser/")
await page.screenshot(path="example.png")
await browser.close()
await copilotbrowser.stop()
```

## Pyinstaller

You can use copilotbrowser with [Pyinstaller](https://www.pyinstaller.org/) to create standalone executables.

```py title="main.py"
from copilotbrowser.sync_api import sync_copilotbrowser

with sync_copilotbrowser() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://dayour.github.io/copilotbrowser/")
    page.screenshot(path="example.png")
    browser.close()
```

If you want to bundle browsers with the executables:

```bash tab=bash-bash
copilotbrowser_BROWSERS_PATH=0 copilotbrowser install chromium
pyinstaller -F main.py
```

```batch tab=bash-batch
set copilotbrowser_BROWSERS_PATH=0
copilotbrowser install chromium
pyinstaller -F main.py
```

```powershell tab=bash-powershell
$env:copilotbrowser_BROWSERS_PATH="0"
copilotbrowser install chromium
pyinstaller -F main.py
```

:::note
Bundling the browsers with the executables will generate bigger binaries.
It is recommended to only bundle the browsers you use.
:::

## Known issues

### `time.sleep()` leads to outdated state

Most likely you don't need to wait manually, since copilotbrowser has [auto-waiting](./actionability.md). If you still rely on it, you should use `page.wait_for_timeout(5000)` instead of `time.sleep(5)` and it is better to not wait for a timeout at all, but sometimes it is useful for debugging. In these cases, use our wait (`wait_for_timeout`) method instead of the `time` module. This is because we internally rely on asynchronous operations and when using `time.sleep(5)` they can't get processed correctly.


### incompatible with `SelectorEventLoop` of `asyncio` on Windows

copilotbrowser runs the driver in a subprocess, so it requires `ProactorEventLoop` of `asyncio` on Windows because `SelectorEventLoop` does not supports async subprocesses.

On Windows Python 3.7, copilotbrowser sets the default event loop to `ProactorEventLoop` as it is default on Python 3.8+.

### Threading

copilotbrowser's API is not thread-safe. If you are using copilotbrowser in a multi-threaded environment, you should create a copilotbrowser instance per thread. See [threading issue](https://github.com/dayour/copilotbrowser-python/issues/623) for more details.
