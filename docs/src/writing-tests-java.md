---
id: writing-tests-java
title: "Writing tests"
sidebar_label: "Writing tests (Java)"
---

## Introduction

copilotbrowser assertions are created specifically for the dynamic web. Checks are automatically retried until the necessary conditions are met. copilotbrowser comes with [auto-wait](./actionability.md) built in meaning it waits for elements to be actionable prior to performing actions. copilotbrowser provides [assertThat](./test-assertions.md) overloads to write assertions.

Take a look at the example test below to see how to write a test using web first assertions, locators and selectors.

```java
package org.example;

import java.util.regex.Pattern;
import com.microsoft.copilotbrowser.*;
import com.microsoft.copilotbrowser.options.AriaRole;

import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;

public class App {
    public static void main(String[] args) {
        try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
            Browser browser = copilotbrowser.chromium().launch();
            Page page = browser.newPage();
            page.navigate("https://copilotbrowser.dev");

            // Expect a title "to contain" a substring.
            assertThat(page).hasTitle(Pattern.compile("copilotbrowser"));

            // create a locator
            Locator getStarted = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Get Started"));

            // Expect an attribute "to be strictly equal" to the value.
            assertThat(getStarted).hasAttribute("href", "/docs/intro");

            // Click the get started link.
            getStarted.click();

            // Expects page to have a heading with the name of Installation.
            assertThat(page.getByRole(AriaRole.HEADING,
               new Page.GetByRoleOptions().setName("Installation"))).isVisible();
        }
    }
}
```


### Assertions

copilotbrowser provides [`assertThat`](./test-assertions.md) overloads which will wait until the expected condition is met.

```java
import java.util.regex.Pattern;
import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;

assertThat(page).hasTitle(Pattern.compile("copilotbrowser"));
```


### Locators

[Locators](./locators.md) are the central piece of copilotbrowser's auto-waiting and retry-ability. Locators represent a way to find element(s) on the page at any moment and are used to perform actions on elements such as `.click` `.fill` etc. Custom locators can be created with the **Page.locator()** method.

```java
import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;

Locator getStarted = page.locator("text=Get Started");

assertThat(getStarted).hasAttribute("href", "/docs/intro");
getStarted.click();
```

copilotbrowser supports many different locators like [role](./locators.md#locate-by-role) [text](./locators.md#get-by-text), [test id](./locators.md#get-by-test-id) and many more. Learn more about available locators and how to pick one in this [in-depth guide](./locators.md).


```java
import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;

assertThat(page.locator("text=Installation")).isVisible();
```


### Test Isolation

copilotbrowser has the concept of a `BrowserContext` which is an in-memory isolated browser profile. It's recommended to create a new `BrowserContext` for each test to ensure they don't interfere with each other.

```java
Browser browser = copilotbrowser.chromium().launch();
BrowserContext context = browser.newContext();
Page page = context.newPage();
```

## What's Next

- [Run single test, multiple tests, headed mode](./running-tests.md)
- [Generate tests with Codegen](./codegen.md)
- [See a trace of your tests](./trace-viewer-intro.md)
