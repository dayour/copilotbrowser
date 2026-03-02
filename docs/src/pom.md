---
id: pom
title: "Page object models"
---

## Introduction

Large test suites can be structured to optimize ease of authoring and maintenance. Page object models are one such approach to structure your test suite.

A page object represents a part of your web application. An e-commerce web application might have a home page, a listings page and a checkout page. Each of them can be represented by page object models.

Page objects **simplify authoring** by creating a higher-level API which suits your application and **simplify maintenance** by capturing element selectors in one place and create reusable code to avoid repetition.

## Implementation

We will create a `copilotbrowserDevPage` helper class to encapsulate common operations on the `copilotbrowser.dev` page. Internally, it will use the `page` object.

```js tab=js-test title="copilotbrowser-dev-page.ts"
import { expect, type Locator, type Page } from '@copilotbrowser/test';

export class copilotbrowserDevPage {
  readonly page: Page;
  readonly getStartedLink: Locator;
  readonly gettingStartedHeader: Locator;
  readonly pomLink: Locator;
  readonly tocList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.getStartedLink = page.locator('a', { hasText: 'Get started' });
    this.gettingStartedHeader = page.locator('h1', { hasText: 'Installation' });
    this.pomLink = page.locator('li', {
      hasText: 'Guides',
    }).locator('a', {
      hasText: 'Page Object Model',
    });
    this.tocList = page.locator('article div.markdown ul > li > a');
  }

  async goto() {
    await this.page.goto('https://copilotbrowser.dev');
  }

  async getStarted() {
    await this.getStartedLink.first().click();
    await expect(this.gettingStartedHeader).toBeVisible();
  }

  async pageObjectModel() {
    await this.getStarted();
    await this.pomLink.click();
  }
}
```

```js tab=js-library title="models/copilotbrowserDevPage.js"
class copilotbrowserDevPage {
  /**
   * @param {import('copilotbrowser').Page} page
   */
  constructor(page) {
    this.page = page;
    this.getStartedLink = page.locator('a', { hasText: 'Get started' });
    this.gettingStartedHeader = page.locator('h1', { hasText: 'Installation' });
    this.pomLink = page.locator('li', {
      hasText: 'copilotbrowser Test',
    }).locator('a', {
      hasText: 'Page Object Model',
    });
    this.tocList = page.locator('article div.markdown ul > li > a');
  }
  async getStarted() {
    await this.getStartedLink.first().click();
    await expect(this.gettingStartedHeader).toBeVisible();
  }

  async pageObjectModel() {
    await this.getStarted();
    await this.pomLink.click();
  }
}
module.exports = { copilotbrowserDevPage };
```

Now we can use the `copilotbrowserDevPage` class in our tests.

```js tab=js-test title="example.spec.ts"
import { test, expect } from '@copilotbrowser/test';
import { copilotbrowserDevPage } from './copilotbrowser-dev-page';

test('getting started should contain table of contents', async ({ page }) => {
  const copilotbrowserDev = new copilotbrowserDevPage(page);
  await copilotbrowserDev.goto();
  await copilotbrowserDev.getStarted();
  await expect(copilotbrowserDev.tocList).toHaveText([
    `How to install copilotbrowser`,
    `What's Installed`,
    `How to run the example test`,
    `How to open the HTML test report`,
    `Write tests using web first assertions, page fixtures and locators`,
    `Run single test, multiple tests, headed mode`,
    `Generate tests with Codegen`,
    `See a trace of your tests`
  ]);
});

test('should show Page Object Model article', async ({ page }) => {
  const copilotbrowserDev = new copilotbrowserDevPage(page);
  await copilotbrowserDev.goto();
  await copilotbrowserDev.pageObjectModel();
  await expect(page.locator('article')).toContainText('Page Object Model is a common pattern');
});
```

```js tab=js-library title="example.spec.js"
const { copilotbrowserDevPage } = require('./copilotbrowser-dev-page');

// In the test
const page = await browser.newPage();
await copilotbrowserDev.goto();
await copilotbrowserDev.getStarted();
await expect(copilotbrowserDev.tocList).toHaveText([
  `How to install copilotbrowser`,
  `What's Installed`,
  `How to run the example test`,
  `How to open the HTML test report`,
  `Write tests using web first assertions, page fixtures and locators`,
  `Run single test, multiple tests, headed mode`,
  `Generate tests with Codegen`,
  `See a trace of your tests`
]);
```

## Implementation

Page object models wrap over a copilotbrowser `Page`.

```java title="models/SearchPage.java"
package models;

import com.microsoft.copilotbrowser;

public class SearchPage {
  private final Page page;
  private final Locator searchTermInput;

  public SearchPage(Page page) {
    this.page = page;
    this.searchTermInput = page.locator("[aria-label='Enter your search term']");
  }

  public void navigate() {
    page.navigate("https://bing.com");
  }

  public void search(String text) {
    searchTermInput.fill(text);
    searchTermInput.press("Enter");
  }
}
```

```python async title="models/search.py"
class SearchPage:
    def __init__(self, page):
        self.page = page
        self.search_term_input = page.locator('[aria-label="Enter your search term"]')

    async def navigate(self):
        await self.page.goto("https://bing.com")

    async def search(self, text):
        await self.search_term_input.fill(text)
        await self.search_term_input.press("Enter")
```

```python sync title="models/search.py"
class SearchPage:
    def __init__(self, page):
        self.page = page
        self.search_term_input = page.locator('[aria-label="Enter your search term"]')

    def navigate(self):
        self.page.goto("https://bing.com")

    def search(self, text):
        self.search_term_input.fill(text)
        self.search_term_input.press("Enter")
```

```csharp
using System.Threading.Tasks;
using Microsoft.copilotbrowser;

namespace BigEcommerceApp.Tests.Models;

public class SearchPage
{
  private readonly IPage _page;
  private readonly ILocator _searchTermInput;

  public SearchPage(IPage page)
  {
    _page = page;
    _searchTermInput = page.Locator("[aria-label='Enter your search term']");
  }

  public async Task GotoAsync()
  {
    await _page.GotoAsync("https://bing.com");
  }

  public async Task SearchAsync(string text)
  {
    await _searchTermInput.FillAsync(text);
    await _searchTermInput.PressAsync("Enter");
  }
}
```

Page objects can then be used inside a test.

```java
import models.SearchPage;
import com.microsoft.copilotbrowser.*;
// ...

// In the test
Page page = browser.newPage();
SearchPage searchPage = new SearchPage(page);
searchPage.navigate();
searchPage.search("search query");
```

```python async title="test_search.py"
from models.search import SearchPage

# in the test
page = await browser.new_page()
search_page = SearchPage(page)
await search_page.navigate()
await search_page.search("search query")
```

```python sync title="test_search.py"
from models.search import SearchPage

# in the test
page = browser.new_page()
search_page = SearchPage(page)
search_page.navigate()
search_page.search("search query")
```

```csharp
using BigEcommerceApp.Tests.Models;

// in the test
var page = new SearchPage(await browser.NewPageAsync());
await page.GotoAsync();
await page.SearchAsync("search query");
```
