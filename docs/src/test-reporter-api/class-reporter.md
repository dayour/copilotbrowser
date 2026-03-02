---
id: class-reporter
---

# class: Reporter
> *Added in: v1.10*
>
> **Languages:** JavaScript

Test runner notifies the reporter about various events during test execution. All methods of the reporter are optional.

You can create a custom reporter by implementing a class with some of the reporter methods. Make sure to export this class as default.

```js tab=js-js title="my-awesome-reporter.js"
// @ts-check

/** @implements {import('@copilotbrowser/test/reporter').Reporter} */
class MyReporter {
  constructor(options) {
    console.log(`my-awesome-reporter setup with customOption set to ${options.customOption}`);
  }

  onBegin(config, suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test) {
    console.log(`Starting test ${test.title}`);
  }

  onTestEnd(test, result) {
    console.log(`Finished test ${test.title}: ${result.status}`);
  }

  onEnd(result) {
    console.log(`Finished the run: ${result.status}`);
  }
}

module.exports = MyReporter;
```

```js tab=js-ts title="my-awesome-reporter.ts"
import type {
  Reporter, FullConfig, Suite, TestCase, TestResult, FullResult
} from '@copilotbrowser/test/reporter';

class MyReporter implements Reporter {
  constructor(options: { customOption?: string } = {}) {
    console.log(`my-awesome-reporter setup with customOption set to ${options.customOption}`);
  }

  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase) {
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

Now use this reporter with **TestConfig.reporter**. Learn more about [using reporters](../test-reporters.md).

```js title="copilotbrowser.config.ts"
import { defineConfig } from '@copilotbrowser/test';

export default defineConfig({
  reporter: [['./my-awesome-reporter.ts', { customOption: 'some value' }]],
});
```

Here is a typical order of reporter calls:
* **Reporter.onBegin()** is called once with a root suite that contains all other suites and tests. Learn more about [suites hierarchy]`Suite`.
* **Reporter.onTestBegin()** is called for each test run. It is given a `TestCase` that is executed, and a `TestResult` that is almost empty. Test result will be populated while the test runs (for example, with steps and stdio) and will get final `status` once the test finishes.
* **Reporter.onStepBegin()** and **Reporter.onStepEnd()** are called for each executed step inside the test. When steps are executed, test run has not finished yet.
* **Reporter.onTestEnd()** is called when test run has finished. By this time, `TestResult` is complete and you can use **TestResult.status**, **TestResult.error** and more.
* **Reporter.onEnd()** is called once after all tests that should run had finished.
* **Reporter.onExit()** is called immediately before the test runner exits.

Additionally, **Reporter.onStdOut()** and **Reporter.onStdErr()** are called when standard output is produced in the worker process, possibly during a test execution,
and **Reporter.onError()** is called when something went wrong outside of the test execution.

If your custom reporter does not print anything to the terminal, implement **Reporter.printsToStdio()** and return `false`. This way, copilotbrowser will use one of the standard terminal reporters in addition to your custom reporter to enhance user experience.

**Reporter errors**

copilotbrowser will swallow any errors thrown in your custom reporter methods. If you need to detect or fail on reporter
errors, you must wrap and handle them yourself.

**Merged report API notes**

When merging multiple [`blob`](../test-reporters#blob-reporter) reports via [`merge-reports`](../test-sharding#merge-reports-cli) CLI
command, the same `Reporter` API is called to produce final reports and all existing reporters
should work without any changes. There some subtle differences though which might affect some custom
reporters.

* Projects from different shards are always kept as separate `TestProject` objects. E.g. if project 'Desktop Chrome' was sharded across 5 machines then there will be 5 instances of projects with the same name in the config passed to **Reporter.onBegin()**.

## optional method: Reporter.onBegin
> *Added in: v1.10*

Called once before running tests. All tests have been already discovered and put into a hierarchy of `Suite`s.

### param: Reporter.onBegin.config
> *Added in: v1.10*
- `config` <`FullConfig`>

Resolved configuration.

### param: Reporter.onBegin.suite
> *Added in: v1.10*
- `suite` <`Suite`>

The root suite that contains all projects, files and test cases.

## optional async method: Reporter.onEnd
> *Added in: v1.10*
- `result` ?<`Object`>
  - `status` ?<`FullStatus`<"passed"|"failed"|"timedout"|"interrupted">>

Called after all tests have been run, or testing has been interrupted. Note that this method may return a `Promise` and copilotbrowser Test will await it.
Reporter is allowed to override the status and hence affect the exit code of the test runner.

### param: Reporter.onEnd.result
> *Added in: v1.10*
- `result` <`Object`>
  - `status` <`FullStatus`<"passed"|"failed"|"timedout"|"interrupted">> Test run status.
  - `startTime` <`Date`> Test run start wall time.
  - `duration` <`int`> Test run duration in milliseconds.

Result of the full test run, `status` can be one of:
* `'passed'` - Everything went as expected.
* `'failed'` - Any test has failed.
* `'timedout'` - The **TestConfig.globalTimeout** has been reached.
* `'interrupted'` - Interrupted by the user.

## optional method: Reporter.onError
> *Added in: v1.10*

Called on some global error, for example unhandled exception in the worker process.

### param: Reporter.onError.error
> *Added in: v1.10*
- `error` <`TestError`>

The error.

## optional async method: Reporter.onExit
> *Added in: v1.33*

Called immediately before test runner exists. At this point all the reporters
have received the **Reporter.onEnd()** signal, so all the reports should
be build. You can run the code that uploads the reports in this hook.

## optional method: Reporter.onStdErr
> *Added in: v1.10*

Called when something has been written to the standard error in the worker process.

### param: Reporter.onStdErr.chunk
> *Added in: v1.10*
- `chunk` <`string`|`Buffer`>

Output chunk.

### param: Reporter.onStdErr.test
> *Added in: v1.10*
- `test` <`void`|`TestCase`>

Test that was running. Note that output may happen when no test is running, in which case this will be `void`.

### param: Reporter.onStdErr.result
> *Added in: v1.10*
- `result` <`void`|`TestResult`>

Result of the test run, this object gets populated while the test runs.


## optional method: Reporter.onStdOut
> *Added in: v1.10*

Called when something has been written to the standard output in the worker process.

### param: Reporter.onStdOut.chunk
> *Added in: v1.10*
- `chunk` <`string`|`Buffer`>

Output chunk.

### param: Reporter.onStdOut.test
> *Added in: v1.10*
- `test` <`void`|`TestCase`>

Test that was running. Note that output may happen when no test is running, in which case this will be `void`.

### param: Reporter.onStdOut.result
> *Added in: v1.10*
- `result` <`void`|`TestResult`>

Result of the test run, this object gets populated while the test runs.

## optional method: Reporter.onStepBegin
> *Added in: v1.10*

Called when a test step started in the worker process.

### param: Reporter.onStepBegin.test
> *Added in: v1.10*
- `test` <`TestCase`>

Test that the step belongs to.

### param: Reporter.onStepBegin.result
> *Added in: v1.10*
- `result` <`TestResult`>

Result of the test run, this object gets populated while the test runs.

### param: Reporter.onStepBegin.step
> *Added in: v1.10*
- `step` <`TestStep`>

Test step instance that has started.

## optional method: Reporter.onStepEnd
> *Added in: v1.10*

Called when a test step finished in the worker process.

### param: Reporter.onStepEnd.test
> *Added in: v1.10*
- `test` <`TestCase`>

Test that the step belongs to.

### param: Reporter.onStepEnd.result
> *Added in: v1.10*
- `result` <`TestResult`>

Result of the test run.

### param: Reporter.onStepEnd.step
> *Added in: v1.10*
- `step` <`TestStep`>

Test step instance that has finished.

## optional method: Reporter.onTestBegin
> *Added in: v1.10*

Called after a test has been started in the worker process.

### param: Reporter.onTestBegin.test
> *Added in: v1.10*
- `test` <`TestCase`>

Test that has been started.

### param: Reporter.onTestBegin.result
> *Added in: v1.10*
- `result` <`TestResult`>

Result of the test run, this object gets populated while the test runs.


## optional method: Reporter.onTestEnd
> *Added in: v1.10*

Called after a test has been finished in the worker process.

### param: Reporter.onTestEnd.test
> *Added in: v1.10*
- `test` <`TestCase`>

Test that has been finished.

### param: Reporter.onTestEnd.result
> *Added in: v1.10*
- `result` <`TestResult`>

Result of the test run.


## optional method: Reporter.printsToStdio
> *Added in: v1.10*
**Returns:** `boolean`

Whether this reporter uses stdio for reporting. When it does not, copilotbrowser Test could add some output to enhance user experience. If your reporter does not print to the terminal, it is strongly recommended to return `false`.
