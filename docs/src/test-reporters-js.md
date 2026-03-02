---
id: test-reporters-js
title: "Reporters"
---

## Introduction

copilotbrowser Test comes with a few built-in reporters for different needs and ability to provide custom reporters. The easiest way to try out built-in reporters is to pass `--reporter` [command line option](./test-cli.md).


```bash
npx copilotbrowser test --reporter=line
```

For more control, you can specify reporters programmatically in the [configuration file](./test-configuration.md).

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: 'line',
});
```

### Multiple reporters

You can use multiple reporters at the same time. For example  you can use `'list'` for nice terminal output and `'json'` to get a comprehensive json file with the test results.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['json', {  outputFile: 'test-results.json' }]
  ],
});
```

### Reporters on CI

You can use different reporters locally and on CI. For example, using concise `'dot'` reporter avoids too much output. This is the default on CI.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  // Concise 'dot' for CI, default 'list' when running locally
  reporter: process.env.CI ? 'dot' : 'list',
});
```

## Built-in reporters

All built-in reporters show detailed information about failures, and mostly differ in verbosity for successful runs.

### List reporter

List reporter is default (except on CI where the `dot` reporter is default). It prints a line for each test being run.

```bash
npx copilotbrowser test --reporter=list
```

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: 'list',
});
```

Here is an example output in the middle of a test run. Failures will be listed at the end.
```bash
npx copilotbrowser test --reporter=list
Running 124 tests using 6 workers

 1  ✓ should access error in env (438ms)
 2  ✓ handle long test names (515ms)
 3  x 1) render expected (691ms)
 4  ✓ should timeout (932ms)
 5    should repeat each:
 6  ✓ should respect enclosing .gitignore (569ms)
 7    should teardown env after timeout:
 8    should respect excluded tests:
 9  ✓ should handle env beforeEach error (638ms)
10    should respect enclosing .gitignore:
```

You can opt into the step rendering via passing the following config option:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [['list', { printSteps: true }]],
});
```

List report supports the following configuration options and environment variables:

| Environment Variable Name | Reporter Config Option| Description | Default
|---|---|---|---|
| `copilotbrowser_LIST_PRINT_STEPS` | `printSteps` | Whether to print each step on its own line. | `false`
| `copilotbrowser_FORCE_TTY` | | Whether to produce output suitable for a live terminal. Supports `true`, `1`, `false`, `0`, `[WIDTH]`, and `[WIDTH]x[HEIGHT]`. `[WIDTH]` and `[WIDTH]x[HEIGHT]` specifies the TTY dimensions. | `true` when terminal is in TTY mode, `false` otherwise.
| `FORCE_COLOR` | | Whether to produce colored output. | `true` when terminal is in TTY mode, `false` otherwise.


### Line reporter

Line reporter is more concise than the list reporter. It uses a single line to report last finished test, and prints failures when they occur. Line reporter is useful for large test suites where it shows the progress but does not spam the output by listing all the tests.

```bash
npx copilotbrowser test --reporter=line
```

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: 'line',
});
```

Here is an example output in the middle of a test run. Failures are reported inline.
```bash
npx copilotbrowser test --reporter=line
Running 124 tests using 6 workers
  1) dot-reporter.spec.ts:20:1 › render expected ===================================================

    Error: expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 0

[23/124] gitignore.spec.ts - should respect nested .gitignore
```

Line report supports the following configuration options and environment variables:

| Environment Variable Name | Reporter Config Option| Description | Default
|---|---|---|---|
| `copilotbrowser_FORCE_TTY` | | Whether to produce output suitable for a live terminal. Supports `true`, `1`, `false`, `0`, `[WIDTH]`, and `[WIDTH]x[HEIGHT]`. `[WIDTH]` and `[WIDTH]x[HEIGHT]` specifies the TTY dimensions. | `true` when terminal is in TTY mode, `false` otherwise.
| `FORCE_COLOR` | | Whether to produce colored output. | `true` when terminal is in TTY mode, `false` otherwise.


### Dot reporter

Dot reporter is very concise - it only produces a single character per successful test run. It is the default on CI and useful where you don't want a lot of output.

```bash
npx copilotbrowser test --reporter=dot
```

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: 'dot',
});
```

Here is an example output in the middle of a test run. Failures will be listed at the end.
```bash
npx copilotbrowser test --reporter=dot
Running 124 tests using 6 workers
······F·············································
```

One character is displayed for each test that has run, indicating its status:

| Character | Description
|---|---|
| `·` | Passed
| `F` | Failed
| `×` | Failed or timed out - and will be retried
| `±` | Passed on retry (flaky)
| `T` | Timed out
| `°` | Skipped

Dot report supports the following configuration options and environment variables:

| Environment Variable Name | Reporter Config Option| Description | Default
|---|---|---|---|
| `copilotbrowser_FORCE_TTY` | | Whether to produce output suitable for a live terminal. Supports `true`, `1`, `false`, `0`, `[WIDTH]`, and `[WIDTH]x[HEIGHT]`. `[WIDTH]` and `[WIDTH]x[HEIGHT]` specifies the TTY dimensions. | `true` when terminal is in TTY mode, `false` otherwise.
| `FORCE_COLOR` | | Whether to produce colored output. | `true` when terminal is in TTY mode, `false` otherwise.

### HTML reporter

HTML reporter produces a self-contained folder that contains report for the test run that can be served as a web page.

```bash
npx copilotbrowser test --reporter=html
```

By default, HTML report is opened automatically if some of the tests failed. You can control this behavior via the
`open` property in the copilotbrowser config or the `copilotbrowser_HTML_OPEN` environmental variable. The possible values for that property are `always`, `never` and `on-failure`
(default).

You can also configure `host` and `port` that are used to serve the HTML report.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [['html', { open: 'never' }]],
});
```

By default, report is written into the `copilotbrowser-report` folder in the current working directory. One can override
that location using the `copilotbrowser_HTML_OUTPUT_DIR` environment variable or a reporter configuration.

In configuration file, pass options directly:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [['html', { outputFolder: 'my-report' }]],
});
```

If you are uploading attachments from a data folder to another location, you can use `attachmentsBaseURL` option to let html report know where to look for them.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [['html', { attachmentsBaseURL: 'https://external-storage.com/' }]],
});
```

A quick way of opening the last test run report is:

```bash
npx copilotbrowser show-report
```

Or if there is a custom folder name:

```bash
npx copilotbrowser show-report my-report
```

HTML report supports the following configuration options and environment variables:

| Environment Variable Name | Reporter Config Option| Description | Default
|---|---|---|---|
| `copilotbrowser_HTML_TITLE` | `title` | A title to display in the generated report. | No title is displayed by default
| `copilotbrowser_HTML_OUTPUT_DIR` | `outputFolder` | Directory to save the report to. | `copilotbrowser-report`
| `copilotbrowser_HTML_OPEN` | `open` | When to open the html report in the browser, one of `'always'`, `'never'` or `'on-failure'` | `'on-failure'`
| `copilotbrowser_HTML_HOST` | `host` | When report opens in the browser, it will be served bound to this hostname. | `localhost`
| `copilotbrowser_HTML_PORT` | `port` | When report opens in the browser, it will be served on this port. | `9323` or any available port when `9323` is not available.
| `copilotbrowser_HTML_ATTACHMENTS_BASE_URL` | `attachmentsBaseURL` | A separate location where attachments from the `data` subdirectory are uploaded. Only needed when you upload report and `data` separately to different locations. | `data/`
| `copilotbrowser_HTML_NO_COPY_PROMPT` | `noCopyPrompt` | If true, disable rendering of the Copy prompt for errors. Supports `true`, `1`, `false`, and `0`. | `false`
| `copilotbrowser_HTML_NO_SNIPPETS` | `noSnippets` | If true, disable rendering code snippets in the action log. If there is a top level error, that report section with code snippet will still render. Supports `true`, `1`, `false`, and `0`. | `false`

### Blob reporter

Blob reports contain all the details about the test run and can be used later to produce any other report. Their primary function is to facilitate the merging of reports from [sharded tests](./test-sharding.md).

```bash
npx copilotbrowser test --reporter=blob
```

By default, the report is written into the `blob-report` directory in the package.json directory or current working directory (if no package.json is found).

The report file name looks like `report-<hash>.zip` or `report-<hash>-<shard_number>.zip` when [sharding](./test-sharding.md) is used. The hash is an optional value computed from `--grep`, `--grepInverted`, `--project`, **TestConfig.tag** and file filters passed as command line arguments. The hash guarantees that running copilotbrowser with different command line options will produce different but stable between runs report names. The output file name can be overridden in the configuration file or passed as `'copilotbrowser_BLOB_OUTPUT_FILE'` environment variable.



When using blob report to merge multiple shards, you don't have to pass any options.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: 'blob',
});
```



When running tests in different environments, you might want to use **TestConfig.tag** to add a global tag corresponding to the environment. This tag will bring clarity to the merged report, and it will be used to produce a unique blob report name.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: 'blob',
  tag: process.env.CI_ENVIRONMENT_NAME,  // for example "@APIv2" or "@linux"
});
```



Blob report supports following configuration options and environment variables:

| Environment Variable Name | Reporter Config Option| Description | Default
|---|---|---|---|
| `copilotbrowser_BLOB_OUTPUT_DIR` | `outputDir` | Directory to save the output. Existing content is deleted before writing the new report. | `blob-report`
| `copilotbrowser_BLOB_OUTPUT_NAME` | `fileName` | Report file name. | `report-<project>-<hash>-<shard_number>.zip`
| `copilotbrowser_BLOB_OUTPUT_FILE` | `outputFile` | Full path to the output file. If defined, `outputDir` and `fileName` will be ignored. | `undefined`

### JSON reporter

JSON reporter produces an object with all information about the test run.

Most likely you want to write the JSON to a file. When running with `--reporter=json`, use `copilotbrowser_JSON_OUTPUT_NAME` environment variable:

```bash tab=bash-bash
copilotbrowser_JSON_OUTPUT_NAME=results.json npx copilotbrowser test --reporter=json
```

```batch tab=bash-batch
set copilotbrowser_JSON_OUTPUT_NAME=results.json
npx copilotbrowser test --reporter=json
```

```powershell tab=bash-powershell
$env:copilotbrowser_JSON_OUTPUT_NAME="results.json"
npx copilotbrowser test --reporter=json
```

In configuration file, pass options directly:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [['json', { outputFile: 'results.json' }]],
});
```

JSON report supports following configuration options and environment variables:

| Environment Variable Name | Reporter Config Option| Description | Default
|---|---|---|---|
| `copilotbrowser_JSON_OUTPUT_DIR` | | Directory to save the output file. Ignored if output file is specified. | `cwd` or config directory.
| `copilotbrowser_JSON_OUTPUT_NAME` | `outputFile` | Base file name for the output, relative to the output dir. | JSON report is printed to the stdout.
| `copilotbrowser_JSON_OUTPUT_FILE` | `outputFile` | Full path to the output file. If defined, `copilotbrowser_JSON_OUTPUT_DIR` and `copilotbrowser_JSON_OUTPUT_NAME` will be ignored. | JSON report is printed to the stdout.

### JUnit reporter

JUnit reporter produces a JUnit-style xml report.

Most likely you want to write the report to an xml file. When running with `--reporter=junit`, use `copilotbrowser_JUNIT_OUTPUT_NAME` environment variable:

```bash tab=bash-bash
copilotbrowser_JUNIT_OUTPUT_NAME=results.xml npx copilotbrowser test --reporter=junit
```

```batch tab=bash-batch
set copilotbrowser_JUNIT_OUTPUT_NAME=results.xml
npx copilotbrowser test --reporter=junit
```

```powershell tab=bash-powershell
$env:copilotbrowser_JUNIT_OUTPUT_NAME="results.xml"
npx copilotbrowser test --reporter=junit
```

In configuration file, pass options directly:

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [['junit', { outputFile: 'results.xml' }]],
});
```

JUnit report supports following configuration options and environment variables:

| Environment Variable Name | Reporter Config Option| Description | Default
|---|---|---|---|
| `copilotbrowser_JUNIT_OUTPUT_DIR` | | Directory to save the output file. Ignored if output file is not specified. | `cwd` or config directory.
| `copilotbrowser_JUNIT_OUTPUT_NAME` | `outputFile` | Base file name for the output, relative to the output dir. | JUnit report is printed to the stdout.
| `copilotbrowser_JUNIT_OUTPUT_FILE` | `outputFile` | Full path to the output file. If defined, `copilotbrowser_JUNIT_OUTPUT_DIR` and `copilotbrowser_JUNIT_OUTPUT_NAME` will be ignored. | JUnit report is printed to the stdout.
| `copilotbrowser_JUNIT_STRIP_ANSI` | `stripANSIControlSequences` | Whether to remove ANSI control sequences from the text before writing it in the report. | By default output text is added as is.
| `copilotbrowser_JUNIT_INCLUDE_PROJECT_IN_TEST_NAME` | `includeProjectInTestName` | Whether to include copilotbrowser project name in every test case as a name prefix. | By default not included.
| `copilotbrowser_JUNIT_SUITE_ID` |  | Value of the `id` attribute on the root `<testsuites/>` report entry. | Empty string.
| `copilotbrowser_JUNIT_SUITE_NAME` |  | Value of the `name` attribute on the root `<testsuites/>` report entry. | Empty string.

### GitHub Actions annotations

You can use the built in `github` reporter to get automatic failure annotations when running in GitHub actions.

Note that all other reporters work on GitHub Actions as well, but do not provide annotations. Also, it is not recommended to
use this annotation type if running your tests with a matrix strategy as the stack trace failures will multiply and obscure the
GitHub file view.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  // 'github' for GitHub Actions CI to generate annotations, plus a concise 'dot'
  // default 'list' when running locally
  reporter: process.env.CI ? 'github' : 'list',
});
```

## Custom reporters

You can create a custom reporter by implementing a class with some of the reporter methods. Learn more about the `Reporter` API.

```js title="my-awesome-reporter.ts"
import type {
  FullConfig, FullResult, Reporter, Suite, TestCase, TestResult
} from '@copilotbrowser/test/reporter';

class MyReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    console.log(`Starting test ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`Finished test ${test.title}: ${result.status}`);
  }

  onEnd(result: FullResult) {
    console.log(`Finished the run: ${result.status}`);
  }
}

export default MyReporter;
```

Now use this reporter with **TestConfig.reporter**.

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: './my-awesome-reporter.ts',
});
```

Or just pass the reporter file path as `--reporter` command line option:

```bash
npx copilotbrowser test --reporter="./myreporter/my-awesome-reporter.ts"
```

Here's a short list of open source reporter implementations that you can take a look at when writing your own reporter:

* [Allure Reporter](https://github.com/allure-framework/allure-js/tree/main/packages/allure-copilotbrowser)
* [Github Actions Reporter](https://github.com/estruyf/copilotbrowser-github-actions-reporter)
* [Mail Reporter](https://github.com/estruyf/copilotbrowser-mail-reporter)
* [ReportPortal](https://github.com/reportportal/agent-js-copilotbrowser)
* [Monocart](https://github.com/cenfun/monocart-reporter)
