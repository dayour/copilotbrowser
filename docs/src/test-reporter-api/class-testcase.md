---
id: class-testcase
---

# class: TestCase
> *Added in: v1.10*
>
> **Languages:** JavaScript

`TestCase` corresponds to every **Test.(call)()** call in a test file. When a single **Test.(call)()** is running in multiple projects or repeated multiple times, it will have multiple `TestCase` objects in corresponding projects' suites.

## property: TestCase.annotations
> *Added in: v1.10*
>
> **Type:** `Array<Object>`
  - `type` <`string`> Annotation type, for example `'skip'` or `'fail'`.
  - `description` ?<`string`> Optional description.
  - `location` ?<`Location`> Optional location in the source where the annotation is added.

**TestResult.annotations** of the last test run.

## property: TestCase.expectedStatus
> *Added in: v1.10*
>
> **Type:** `TestStatus<"passed"|"failed"|"timedOut"|"skipped"|"interrupted">`

Expected test status.
* Tests marked as **Test.skip()** or **Test.fixme()** are expected to be `'skipped'`.
* Tests marked as **Test.fail()** are expected to be `'failed'`.
* Other tests are expected to be `'passed'`.

See also **TestResult.status** for the actual status.

## property: TestCase.id
> *Added in: v1.25*
>
> **Type:** `string`

A test ID that is computed based on the test file name, test title and project name. The ID is unique within copilotbrowser session.

## property: TestCase.location
> *Added in: v1.10*
>
> **Type:** `Location`

Location in the source where the test is defined.

## method: TestCase.ok
> *Added in: v1.10*
**Returns:** `boolean`

Whether the test is considered running fine. Non-ok tests fail the test run with non-zero exit code.

## method: TestCase.outcome
> *Added in: v1.10*
**Returns:** `TestOutcome<"skipped"|"expected"|"unexpected"|"flaky">`

Testing outcome for this test. Note that outcome is not the same as **TestResult.status**:
* Test that is expected to fail and actually fails is `'expected'`.
* Test that passes on a second retry is `'flaky'`.

## property: TestCase.parent
> *Added in: v1.10*
>
> **Type:** `Suite`

Suite this test case belongs to.

## property: TestCase.repeatEachIndex
> *Added in: v1.10*
>
> **Type:** `int`

Contains the repeat index when running in "repeat each" mode. This mode is enabled by passing `--repeat-each` to the [command line](../test-cli.md).

## property: TestCase.results
> *Added in: v1.10*
>
> **Type:** `Array<TestResult>`

Results for each run of this test.

## property: TestCase.retries
> *Added in: v1.10*
>
> **Type:** `int`

The maximum number of retries given to this test in the configuration.

Learn more about [test retries](../test-retries.md#retries).

## property: TestCase.tags
> *Added in: v1.42*
>
> **Type:** `Array<string>`

The list of tags defined on the test or suite via **Test.(call)()** or **Test.describe()**, as well as `@`-tokens extracted from test and suite titles.

Learn more about [test tags](../test-annotations.md#tag-tests).

## property: TestCase.timeout
> *Added in: v1.10*
>
> **Type:** `float`

The timeout given to the test. Affected by **TestConfig.timeout**, **TestProject.timeout**, **Test.setTimeout()**, **Test.slow()** and **TestInfo.setTimeout()**.

## property: TestCase.title
> *Added in: v1.10*
>
> **Type:** `string`

Test title as passed to the **Test.(call)()** call.

## method: TestCase.titlePath
> *Added in: v1.10*
**Returns:** `Array<string>`

Returns a list of titles from the root down to this test.

## property: TestCase.type
> *Added in: v1.44*
**Returns:** `TestCaseType<"test">`

Returns "test". Useful for detecting test cases in **Suite.entries()**.
