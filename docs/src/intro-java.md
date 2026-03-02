---
id: intro-java
title: "Installation"
sidebar_label: "Installation (Java)"
---

## Introduction

copilotbrowser was created specifically to accommodate the needs of end-to-end testing. copilotbrowser supports all modern rendering engines including Chromium, WebKit, and Firefox. Test on Windows, Linux, and macOS, locally or on CI, headless or headed with native mobile emulation.

copilotbrowser is distributed as a set of [Maven](https://maven.apache.org/what-is-maven.html) modules. The easiest way to use it is to add one dependency to your project's `pom.xml` as described below. If you're not familiar with Maven please refer to its [documentation](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html).

## Usage

Get started by installing copilotbrowser and running the example file to see it in action.


```java title="src/main/java/org/example/App.java"
package org.example;

import com.microsoft.copilotbrowser.*;

public class App {
    public static void main(String[] args) {
        try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
            Browser browser = copilotbrowser.chromium().launch();
            Page page = browser.newPage();
            page.navigate("https://copilotbrowser.dev");
            System.out.println(page.title());
        }
    }
}
```


```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>org.example</groupId>
  <artifactId>examples</artifactId>
  <version>0.1-SNAPSHOT</version>
  <name>copilotbrowser Client Examples</name>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>com.microsoft.copilotbrowser</groupId>
      <artifactId>copilotbrowser</artifactId>
      <version>%%VERSION%%</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.10.1</version>
        <!-- References to interface static methods are allowed only at source level 1.8 or above -->
        <configuration>
          <source>1.8</source>
          <target>1.8</target>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```


With the App.java and pom.xml above, compile and execute your new program as follows:

```bash
mvn compile exec:java -D exec.mainClass="org.example.App"
```

Running it downloads the copilotbrowser package and installs browser binaries for Chromium, Firefox and WebKit. To modify this behavior see [installation parameters](./browsers.md#install-browsers).

## First script

In our first script, we will navigate to `copilotbrowser.dev` and take a screenshot in WebKit.

```java
package org.example;

import com.microsoft.copilotbrowser.*;
import java.nio.file.Paths;

public class App {
  public static void main(String[] args) {
    try (copilotbrowser copilotbrowser = copilotbrowser.create()) {
      Browser browser = copilotbrowser.webkit().launch();
      Page page = browser.newPage();
      page.navigate("https://dayour.github.io/copilotbrowser/");
      page.screenshot(new Page.ScreenshotOptions().setPath(Paths.get("example.png")));
    }
  }
}
```

By default, copilotbrowser runs the browsers in headless mode. To see the browser UI, **BrowserType.launch.headless** option to `false`. You can also use **BrowserType.launch.slowMo** to slow down execution. Learn more in the debugging tools [section](./debug.md).

```java
copilotbrowser.firefox().launch(new BrowserType.LaunchOptions().setHeadless(false).setSlowMo(50));
```

## Running the Example script

```bash
mvn compile exec:java -D exec.mainClass="org.example.App"
```

By default browsers launched with copilotbrowser run headless, meaning no browser UI will open up when running the script. To change that you can pass `new BrowserType.LaunchOptions().setHeadless(false)` when launching the browser.

## System requirements

- Java 8 or higher.
- Windows 11+, Windows Server 2019+ or Windows Subsystem for Linux (WSL).
- macOS 14 Ventura, or later.
- Debian 12, Debian 13, Ubuntu 22.04, Ubuntu 24.04, on x86-64 and arm64 architecture.

## What's next

- [Write tests using web first assertions, page fixtures and locators](./writing-tests.md)
- [Run single test, multiple tests, headed mode](./running-tests.md)
- [Generate tests with Codegen](./codegen.md)
- [See a trace of your tests](./trace-viewer-intro.md)
