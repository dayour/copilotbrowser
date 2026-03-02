---
id: class-testresult
---

# class: TestResult
> *Added in: v1.10*
>
> **Languages:** JavaScript

A result of a single `TestCase` run.

## property: TestResult.attachments
> *Added in: v1.10*
>
> **Type:** `Array<Object>`
  - `name` <`string`> Attachment name.
  - `contentType` <`string`> Content type of this attachment to properly present in the report, for example `'application/json'` or `'image/png'`.
  - `path` ?<`string`> Optional path on the filesystem to the attached file.
  - `body` ?<`Buffer`> Optional attachment body used instead of a file.

The list of files or buffers attached during the test execution through **TestInfo.attachments**.

## property: TestResult.annotations
> *Added in: v1.52*
>
> **Type:** `Array<Object>`
  - `type` <`string`> Annotation type, for example `'skip'` or `'fail'`.
  - `description` ?<`string`> Optional description.
  - `location` ?<`Location`> Optional location in the source where the annotation is added.

The list of annotations applicable to the current test. Includes:
* annotations defined on the test or suite via **Test.(call)()** and **Test.describe()**;
* annotations implicitly added by methods **Test.skip()**, **Test.fixme()** and **Test.fail()**;
* annotations appended to **TestInfo.annotations** during the test execution.

Annotations are available during test execution through **TestInfo.annotations**.

Learn more about [test annotations](../test-annotations.md).

## property: TestResult.duration
> *Added in: v1.10*
>
> **Type:** `float`

Running time in milliseconds.

## property: TestResult.error
> *Added in: v1.10*
- type: ?<`TestError`>

First error thrown during test execution, if any. This is equal to the first
element in **TestResult.errors**.

## property: TestResult.errors
> *Added in: v1.10*
>
> **Type:** `Array<TestError>`

Errors thrown during the test execution.

## property: TestResult.retry
> *Added in: v1.10*
>
> **Type:** `int`

When test is retried multiple times, each retry attempt is given a sequential number.

Learn more about [test retries](../test-retries.md#retries).

## property: TestResult.startTime
> *Added in: v1.10*
>
> **Type:** `Date`

Start time of this particular test run.

## property: TestResult.status
> *Added in: v1.10*
>
> **Type:** `TestStatus<"passed"|"failed"|"timedOut"|"skipped"|"interrupted">`

The status of this test result. See also **TestCase.expectedStatus**.

## property: TestResult.stderr
> *Added in: v1.10*
>
> **Type:** `Array<string|Buffer>`

Anything written to the standard error during the test run.

## property: TestResult.stdout
> *Added in: v1.10*
>
> **Type:** `Array<string|Buffer>`

Anything written to the standard output during the test run.

## property: TestResult.steps
> *Added in: v1.10*
>
> **Type:** `Array<TestStep>`

List of steps inside this test run.

## property: TestResult.workerIndex
> *Added in: v1.10*
>
> **Type:** `int`

Index of the worker where the test was run. If the test was not run a single time, for example when the user interrupted testing, the only result will have a `workerIndex` equal to `-1`.

Learn more about [parallelism and sharding](../test-parallel.md) with copilotbrowser Test.

## property: TestResult.parallelIndex
> *Added in: v1.30*
>
> **Type:** `int`

The index of the worker between `0` and `workers - 1`. It is guaranteed that workers running at the same time have a different `parallelIndex`.
