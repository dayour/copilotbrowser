---
id: writing-tests-python
title: "Writing tests"
sidebar_label: "Writing tests (Python)"
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
- [How to use test hooks](/writing-tests.md#using-fixtures)

## First test

Take a look at the following example to see how to write a test. Note how the file name follows the `test_` prefix convention as well as each test name.

```python title="test_example.py"
import re
from copilotbrowser.sync_api import Page, expect

def test_has_title(page: Page):
    page.goto("https://dayour.github.io/copilotbrowser/")

    # Expect a title "to contain" a substring.
    expect(page).to_have_title(re.compile("copilotbrowser"))

def test_get_started_link(page: Page):
    page.goto("https://dayour.github.io/copilotbrowser/")

    # Click the get started link.
    page.get_by_role("link", name="Get started").click()

    # Expects page to have a heading with the name of Installation.
    expect(page.get_by_role("heading", name="Installation")).to_be_visible()
```

## Actions

### Navigation

Most of the tests will start with navigating page to the URL. After that, test
will be able to interact with the page elements.

```js
await page.goto('https://dayour.github.io/copilotbrowser/');
```

```python
page.goto("https://dayour.github.io/copilotbrowser/")
```

copilotbrowser will wait for page to reach the load state prior to moving forward.
Learn more about the **Page.goto()** options.

### Interactions

Performing actions starts with locating the elements. copilotbrowser uses [Locators API](./locators.md) for that. Locators represent a way to find element(s) on the page at any moment, learn more about the [different types](./locators.md) of locators available. copilotbrowser will wait for the element to be [actionable](./actionability.md) prior to performing the action, so there is no need to wait for it to become available.


```python
# Create a locator.
get_started = page.get_by_role("link", name="Get started")

# Click it.
get_started.click()
```

In most cases, it'll be written in one line:

```python
page.get_by_role("link", name="Get started").click()
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

copilotbrowser includes [assertions](./test-assertions.md) that will wait until the expected condition is met. Using these assertions allows making the tests non-flaky and resilient. For example, this code will wait until the page gets the title containing "copilotbrowser":

```python
import re
from copilotbrowser.sync_api import expect

expect(page).to_have_title(re.compile("copilotbrowser"))
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


### Test isolation

The copilotbrowser Pytest plugin is based on the concept of test fixtures such as the [built in page fixture](./test-runners.md), which is passed into your test. Pages are [isolated between tests due to the Browser Context](./browser-contexts), which is equivalent to a brand new browser profile, where every test gets a fresh environment, even when multiple tests run in a single Browser.

```python title="test_example.py"
from copilotbrowser.sync_api import Page

def test_example_test(page: Page):
  pass
  # "page" belongs to an isolated BrowserContext, created for this specific test.

def test_another_test(page: Page):
  pass
  # "page" in this second test is completely isolated from the first test.
```

### Using fixtures

You can use various [fixtures](https://docs.pytest.org/en/6.2.x/fixture.html#autouse-fixtures-fixtures-you-don-t-have-to-request) to execute code before or after your tests and to share objects between them. A `function` scoped fixture e.g. with autouse behaves like a beforeEach/afterEach. And a `module` scoped fixture with autouse behaves like a beforeAll/afterAll which runs before all and after all the tests.

```python title="test_example.py"
import pytest
from copilotbrowser.sync_api import Page, expect

@pytest.fixture(scope="function", autouse=True)
def before_each_after_each(page: Page):
    
    print("before the test runs")

    # Go to the starting url before each test.
    page.goto("https://dayour.github.io/copilotbrowser/")
    yield
    
    print("after the test runs")

def test_main_navigation(page: Page):
    # Assertions use the expect API.
    expect(page).to_have_url("https://dayour.github.io/copilotbrowser/")
```

## What's next

- [Run single test, multiple tests, headed mode](./running-tests.md)
- [Generate tests with Codegen](./codegen-intro.md)
- [See a trace of your tests](./trace-viewer-intro.md)
- [Run tests on CI with GitHub Actions](./ci-intro.md)
