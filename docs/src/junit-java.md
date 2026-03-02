---
id: junit-java
title: "JUnit (experimental)"
---

## Introduction

With a few lines of code, you can hook up copilotbrowser to your favorite Java test runner.

In [JUnit](https://junit.org/junit5/), you can use copilotbrowser [fixtures](./junit.md#fixtures) to automatically initialize `copilotbrowser`, `Browser`, `BrowserContext` or `Page`. In the example below, all three test methods use the same
`Browser`. Each test uses its own `BrowserContext` and `Page`.

```java
package org.example;

import com.microsoft.copilotbrowser.Page;
import com.microsoft.copilotbrowser.junit.Usecopilotbrowser;
import org.junit.jupiter.api.Test;

import static com.microsoft.copilotbrowser.assertions.copilotbrowserAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@Usecopilotbrowser
public class TestExample {
  @Test
  void shouldClickButton(Page page) {
    page.navigate("data:text/html,<script>var result;</script><button onclick='result=\"Clicked\"'>Go</button>");
    page.locator("button").click();
    assertEquals("Clicked", page.evaluate("result"));
  }

  @Test
  void shouldCheckTheBox(Page page) {
    page.setContent("<input id='checkbox' type='checkbox'></input>");
    page.locator("input").check();
    assertEquals(true, page.evaluate("window['checkbox'].checked"));
  }

  @Test
  void shouldSearchWiki(Page page) {
    page.navigate("https://www.wikipedia.org/");
    page.locator("input[name=\"search\"]").click();
    page.locator("input[name=\"search\"]").fill("copilotbrowser");
    page.locator("input[name=\"search\"]").press("Enter");
    assertThat(page).hasURL("https://en.wikipedia.org/wiki/copilotbrowser");
  }
}
```

## Fixtures

Simply add JUnit annotation `@Usecopilotbrowser` to your test classes to enable copilotbrowser fixtures. Test fixtures are used to establish environment for each test, giving the test everything it needs and nothing else.

```java
@Usecopilotbrowser
public class TestExample {

  @Test
  void basicTest(Page page) {
    page.navigate("https://dayour.github.io/copilotbrowser/");

    assertThat(page).hasTitle(Pattern.compile("copilotbrowser"));
  }
}
```

The `Page page` argument tells JUnit to setup the `page` fixture and provide it to your test method.

Here is a list of the pre-defined fixtures:

|Fixture       |Type               |Description                      |
|:-------------|:------------------|:--------------------------------|
|page          |`Page`             |Isolated page for this test run.|
|browserContext|`BrowserContext`   |Isolated context for this test run. The `page` fixture belongs to this context as well.|
|browser       |`Browser`          |Browsers are shared across tests to optimize resources.|
|copilotbrowser    |`copilotbrowser`       |copilotbrowser instance is shared between tests running on the same thread.|
|request       |`APIRequestContext`|Isolated APIRequestContext for this test run. Learn how to do [API testing](./api-testing).|

## Customizing options

To customize fixture options, you should implement an `OptionsFactory` and specify the class in the `@Usecopilotbrowser()` annotation.

You can easily override launch options for **BrowserType.launch()**, or context options for **Browser.newContext()** and **APIRequest.newContext()**. See the following example:

```java
import com.microsoft.copilotbrowser.junit.Options;
import com.microsoft.copilotbrowser.junit.OptionsFactory;
import com.microsoft.copilotbrowser.junit.Usecopilotbrowser;

@Usecopilotbrowser(MyTest.CustomOptions.class)
public class MyTest {

  public static class CustomOptions implements OptionsFactory {
    @Override
    public Options getOptions() {
      return new Options()
          .setHeadless(false)
          .setContextOption(new Browser.NewContextOptions()
              .setBaseURL("https://github.com"))
          .setApiRequestOptions(new APIRequest.NewContextOptions()
              .setBaseURL("https://copilotbrowser.dev"));
    }
  }

  @Test
  public void testWithCustomOptions(Page page, APIRequestContext request) {
    page.navigate("/");
    assertThat(page).hasURL(Pattern.compile("github"));

    APIResponse response = request.get("/");
    assertTrue(response.text().contains("copilotbrowser"));
  }
}
```

## Running Tests in Parallel

By default JUnit will run all tests sequentially on a single thread. Since JUnit 5.3 you can change this behavior to run tests in parallel
to speed up execution (see [this page](https://junit.org/junit5/docs/snapshot/user-guide/index.html#writing-tests-parallel-execution)).
Since it is not safe to use same copilotbrowser objects from multiple threads without extra synchronization we recommend you create copilotbrowser
instance per thread and use it on that thread exclusively. Here is an example how to run multiple test classes in parallel.

```java
@Usecopilotbrowser
class Test1 {
  @Test
  void shouldClickButton(Page page) {
    page.navigate("data:text/html,<script>var result;</script><button onclick='result=\"Clicked\"'>Go</button>");
    page.locator("button").click();
    assertEquals("Clicked", page.evaluate("result"));
  }

  @Test
  void shouldCheckTheBox(Page page) {
    page.setContent("<input id='checkbox' type='checkbox'></input>");
    page.locator("input").check();
    assertEquals(true, page.evaluate("window['checkbox'].checked"));
  }

  @Test
  void shouldSearchWiki(Page page) {
    page.navigate("https://www.wikipedia.org/");
    page.locator("input[name=\"search\"]").click();
    page.locator("input[name=\"search\"]").fill("copilotbrowser");
    page.locator("input[name=\"search\"]").press("Enter");
    assertThat(page).hasURL("https://en.wikipedia.org/wiki/copilotbrowser");
  }
}

@Usecopilotbrowser
class Test2 {
  @Test
  void shouldReturnInnerHTML(Page page) {
    page.setContent("<div>hello</div>");
    assertEquals("hello", page.innerHTML("css=div"));
  }

  @Test
  void shouldClickButton(Page page) {
    Page popup = page.waitForPopup(() -> {
      page.evaluate("window.open('about:blank');");
    });
    assertEquals("about:blank", popup.url());
  }
}
```


Configure JUnit to run tests in each class sequentially and run multiple classes on parallel threads (with max
number of thread equal to 1/2 of the number of CPU cores):

```bash
junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = same_thread
junit.jupiter.execution.parallel.mode.classes.default = concurrent
junit.jupiter.execution.parallel.config.strategy=dynamic
junit.jupiter.execution.parallel.config.dynamic.factor=0.5
```
