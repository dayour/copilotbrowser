---
id: class-testinfo
---

# class: TestInfo
> *Added in: v1.10*
>
> **Languages:** JavaScript

`TestInfo` contains information about currently running test. It is available to test functions, **Test.beforeEach()**, **Test.afterEach()**, **Test.beforeAll()** and **Test.afterAll()** hooks, and test-scoped fixtures. `TestInfo` provides utilities to control test execution: attach files, update test timeout, determine which test is currently running and whether it was retried, etc.

```js
import { test, expect } from '@copilotbrowser/test';

test('basic test', async ({ page }, testInfo) => {
  expect(testInfo.title).toBe('basic test');
  await page.screenshot(testInfo.outputPath('screenshot.png'));
});
```


## property: TestInfo.annotations
> *Added in: v1.10*
>
> **Type:** `Array<Object>`
  - `type` <`string`> Annotation type, for example `'skip'` or `'fail'`.
  - `description` ?<`string`> Optional description.
  - `location` ?<`Location`> Optional location in the source where the annotation is added.

The list of annotations applicable to the current test. Includes annotations from the test, annotations from all **Test.describe()** groups the test belongs to and file-level annotations for the test file.

Learn more about [test annotations](../test-annotations.md).

## property: TestInfo.attachments
> *Added in: v1.10*
>
> **Type:** `Array<Object>`
  - `name` <`string`> Attachment name.
  - `contentType` <`string`> Content type of this attachment to properly present in the report, for example `'application/json'` or `'image/png'`.
  - `path` ?<`string`> Optional path on the filesystem to the attached file.
  - `body` ?<`Buffer`> Optional attachment body used instead of a file.

The list of files or buffers attached to the current test. Some reporters show test attachments.

To add an attachment, use **TestInfo.attach()** instead of directly pushing onto this array.

## async method: TestInfo.attach
> *Added in: v1.10*

Attach a value or a file from disk to the current test. Some reporters show test attachments. Either **path** or **body** must be specified, but not both.

For example, you can attach a screenshot to the test:

```js
import { test, expect } from '@copilotbrowser/test';

test('basic test', async ({ page }, testInfo) => {
  await page.goto('https://copilotbrowser.dev');
  const screenshot = await page.screenshot();
  await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
});
```

Or you can attach files returned by your APIs:

```js
import { test, expect } from '@copilotbrowser/test';
import { download } from './my-custom-helpers';

test('basic test', async ({}, testInfo) => {
  const tmpPath = await download('a');
  await testInfo.attach('downloaded', { path: tmpPath });
});
```

:::note
**TestInfo.attach()** automatically takes care of copying attached files to a
location that is accessible to reporters. You can safely remove the attachment
after awaiting the attach call.
:::

### param: TestInfo.attach.name
> *Added in: v1.10*
- `name` <`string`>

Attachment name. The name will also be sanitized and used as the prefix of file name
when saving to disk.

### option: TestInfo.attach.body
> *Added in: v1.10*
- `body` <`string`|`Buffer`>

Attachment body. Mutually exclusive with **path**.

### option: TestInfo.attach.contentType
> *Added in: v1.10*
- `contentType` <`string`>

Content type of this attachment to properly present in the report, for example `'application/json'` or `'image/png'`. If omitted, content type is inferred based on the **path**, or defaults to `text/plain` for `string` attachments and `application/octet-stream` for `Buffer` attachments.

### option: TestInfo.attach.path
> *Added in: v1.10*
- `path` <`string`>

Path on the filesystem to the attached file. Mutually exclusive with **body**.


## property: TestInfo.column
> *Added in: v1.10*
>
> **Type:** `int`

Column number where the currently running test is declared.


## property: TestInfo.config
> *Added in: v1.10*
>
> **Type:** `FullConfig`

Processed configuration from the [configuration file](../test-configuration.md).


## property: TestInfo.duration
> *Added in: v1.10*
>
> **Type:** `int`

The number of milliseconds the test took to finish. Always zero before the test finishes, either successfully or not. Can be used in **Test.afterEach()** hook.


## property: TestInfo.error
> *Added in: v1.10*
- type: ?<`TestInfoError`>

First error thrown during test execution, if any. This is equal to the first
element in **TestInfo.errors**.

## property: TestInfo.errors
> *Added in: v1.10*
>
> **Type:** `Array<TestInfoError>`

Errors thrown during test execution, if any.


## property: TestInfo.expectedStatus
> *Added in: v1.10*
>
> **Type:** `TestStatus<"passed"|"failed"|"timedOut"|"skipped"|"interrupted">`

Expected status for the currently running test. This is usually `'passed'`, except for a few cases:
* `'skipped'` for skipped tests, e.g. with **Test.skip()**;
* `'failed'` for tests marked as failed with **Test.fail()**.

Expected status is usually compared with the actual **TestInfo.status**:

```js
import { test, expect } from '@copilotbrowser/test';

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus)
    console.log(`${testInfo.title} did not run as expected!`);
});
```

## method: TestInfo.fail#1
> *Added in: v1.10*

Marks the currently running test as "should fail". copilotbrowser Test runs this test and ensures that it is actually failing. This is useful for documentation purposes to acknowledge that some functionality is broken until it is fixed. This is similar to **Test.fail()**.

## method: TestInfo.fail#2
> *Added in: v1.10*

Conditionally mark the currently running test as "should fail" with an optional description. This is similar to **Test.fail()**.

### param: TestInfo.fail#2.condition
> *Added in: v1.10*
- `condition` <`boolean`>

Test is marked as "should fail" when the condition is `true`.

### param: TestInfo.fail#2.description
> *Added in: v1.10*
- `description` ?<`string`>

Optional description that will be reflected in a test report.


## property: TestInfo.file
> *Added in: v1.10*
>
> **Type:** `string`

Absolute path to a file where the currently running test is declared.


## method: TestInfo.fixme#1
> *Added in: v1.10*

Mark a test as "fixme", with the intention to fix it. Test is immediately aborted. This is similar to **Test.fixme()**.

## method: TestInfo.fixme#2
> *Added in: v1.10*

Conditionally mark the currently running test as "fixme" with an optional description. This is similar to **Test.fixme()**.

### param: TestInfo.fixme#2.condition
> *Added in: v1.10*
- `condition` <`boolean`>

Test is marked as "fixme" when the condition is `true`.

### param: TestInfo.fixme#2.description
> *Added in: v1.10*
- `description` ?<`string`>

Optional description that will be reflected in a test report.


## property: TestInfo.fn
> *Added in: v1.10*
>
> **Type:** `function`

Test function as passed to `test(title, testFunction)`.

## property: TestInfo.tags
> *Added in: v1.43*
>
> **Type:** `Array<string>`

Tags that apply to the test. Learn more about [tags](../test-annotations.md#tag-tests).

:::note
Any changes made to this list while the test is running will not be visible to test reporters.
:::

## property: TestInfo.testId
> *Added in: v1.32*
>
> **Type:** `string`

Test id matching the test case id in the reporter API.

## property: TestInfo.line
> *Added in: v1.10*
>
> **Type:** `int`

Line number where the currently running test is declared.

## property: TestInfo.snapshotDir
> *Added in: v1.10*
>
> **Type:** `string`

Absolute path to the snapshot output directory for this specific test. Each test suite gets its own directory so they cannot conflict.

This property does not account for the **TestProject.snapshotPathTemplate** configuration.

## property: TestInfo.outputDir
> *Added in: v1.10*
>
> **Type:** `string`

Absolute path to the output directory for this specific test run. Each test run gets its own directory so they cannot conflict.

## method: TestInfo.outputPath
> *Added in: v1.10*
**Returns:** `string`

Returns a path inside the **TestInfo.outputDir** where the test can safely put a temporary file. Guarantees that tests running in parallel will not interfere with each other.

```js
import { test, expect } from '@copilotbrowser/test';
import fs from 'fs';

test('example test', async ({}, testInfo) => {
  const file = testInfo.outputPath('dir', 'temporary-file.txt');
  await fs.promises.writeFile(file, 'Put some data to the dir/temporary-file.txt', 'utf8');
});
```

> Note that `pathSegments` accepts path segments to the test output directory such as `testInfo.outputPath('relative', 'path', 'to', 'output')`.
>
> However, this path must stay within the **TestInfo.outputDir** directory for each test (i.e. `test-results/a-test-title`), otherwise it will throw.

### param: TestInfo.outputPath.pathSegments
> *Added in: v1.10*
- `...pathSegments` <`Array`<`string`>>

Path segments to append at the end of the resulting path.

## property: TestInfo.parallelIndex
> *Added in: v1.10*
>
> **Type:** `int`

The index of the worker between `0` and `workers - 1`. It is guaranteed that workers running at the same time have a different `parallelIndex`. When a worker is restarted, for example after a failure, the new worker process has the same `parallelIndex`.

Also available as `process.env.TEST_PARALLEL_INDEX`. Learn more about [parallelism and sharding](../test-parallel.md) with copilotbrowser Test.

## property: TestInfo.project
> *Added in: v1.10*
>
> **Type:** `FullProject`

Processed project configuration from the [configuration file](../test-configuration.md).


## property: TestInfo.repeatEachIndex
> *Added in: v1.10*
>
> **Type:** `int`

Specifies a unique repeat index when running in "repeat each" mode. This mode is enabled by passing `--repeat-each` to the [command line](../test-cli.md).

## property: TestInfo.retry
> *Added in: v1.10*
>
> **Type:** `int`

Specifies the retry number when the test is retried after a failure. The first test run has **TestInfo.retry** equal to zero, the first retry has it equal to one, and so on. Learn more about [retries](../test-retries.md#retries).

```js
import { test, expect } from '@copilotbrowser/test';

test.beforeEach(async ({}, testInfo) => {
  // You can access testInfo.retry in any hook or fixture.
  if (testInfo.retry > 0)
    console.log(`Retrying!`);
});

test('my test', async ({ page }, testInfo) => {
  // Here we clear some server-side state when retrying.
  if (testInfo.retry)
    await cleanSomeCachesOnTheServer();
  // ...
});
```

## method: TestInfo.setTimeout
> *Added in: v1.10*

Changes the timeout for the currently running test. Zero means no timeout. Learn more about [various timeouts](../test-timeouts.md).

Timeout is usually specified in the [configuration file](../test-configuration.md), but it could be useful to change the timeout in certain scenarios:

```js
import { test, expect } from '@copilotbrowser/test';

test.beforeEach(async ({ page }, testInfo) => {
  // Extend timeout for all tests running this hook by 30 seconds.
  testInfo.setTimeout(testInfo.timeout + 30000);
});
```

### param: TestInfo.setTimeout.timeout
> *Added in: v1.10*
- `timeout` <`int`>

Timeout in milliseconds.

## method: TestInfo.skip#1
> *Added in: v1.10*

Unconditionally skip the currently running test. Test is immediately aborted. This is similar to **Test.skip()**.

## method: TestInfo.skip#2
> *Added in: v1.10*

Conditionally skips the currently running test with an optional description. This is similar to **Test.skip()**.

### param: TestInfo.skip#2.condition
> *Added in: v1.10*
- `condition` <`boolean`>

A skip condition. Test is skipped when the condition is `true`.

### param: TestInfo.skip#2.description
> *Added in: v1.10*
- `description` ?<`string`>

Optional description that will be reflected in a test report.


## method: TestInfo.slow#1
> *Added in: v1.10*

Marks the currently running test as "slow", giving it triple the default timeout. This is similar to **Test.slow()**.

## method: TestInfo.slow#2
> *Added in: v1.10*

Conditionally mark the currently running test as "slow" with an optional description, giving it triple the default timeout. This is similar to **Test.slow()**.

### param: TestInfo.slow#2.condition
> *Added in: v1.10*
- `condition` <`boolean`>

Test is marked as "slow" when the condition is `true`.

### param: TestInfo.slow#2.description
> *Added in: v1.10*
- `description` ?<`string`>

Optional description that will be reflected in a test report.


## method: TestInfo.snapshotPath
> *Added in: v1.10*
**Returns:** `string`

Returns a path to a snapshot file with the given `name`. Pass **kind** to obtain a specific path:
* `kind: 'screenshot'` for **PageAssertions.toHaveScreenshot()**;
* `kind: 'aria'` for **LocatorAssertions.toMatchAriaSnapshot()**;
* `kind: 'snapshot'` for **SnapshotAssertions.toMatchSnapshot()**.

**Usage**

```js
await expect(page).toHaveScreenshot('header.png');
// Screenshot assertion above expects screenshot at this path:
const screenshotPath = test.info().snapshotPath('header.png', { kind: 'screenshot' });

await expect(page.getByRole('main')).toMatchAriaSnapshot({ name: 'main.aria.yml' });
// Aria snapshot assertion above expects snapshot at this path:
const ariaSnapshotPath = test.info().snapshotPath('main.aria.yml', { kind: 'aria' });

expect('some text').toMatchSnapshot('snapshot.txt');
// Snapshot assertion above expects snapshot at this path:
const snapshotPath = test.info().snapshotPath('snapshot.txt');

expect('some text').toMatchSnapshot(['dir', 'subdir', 'snapshot.txt']);
// Snapshot assertion above expects snapshot at this path:
const nestedPath = test.info().snapshotPath('dir', 'subdir', 'snapshot.txt');
```

### param: TestInfo.snapshotPath.name
> *Added in: v1.10*
- `...name` <`Array`<`string`>>

The name of the snapshot or the path segments to define the snapshot file path. Snapshots with the same name in the same test file are expected to be the same.

When passing **kind**, multiple name segments are not supported.

### option: TestInfo.snapshotPath.kind
> *Added in: v1.53*
- `kind` <`SnapshotKind`<"snapshot"|"screenshot"|"aria">>

The snapshot kind controls which snapshot path template is used. See **TestConfig.snapshotPathTemplate** for more details. Defaults to `'snapshot'`.

## property: TestInfo.snapshotSuffix
> *Added in: v1.10*
>
> **Type:** `string`

:::note
Use of **TestInfo.snapshotSuffix** is discouraged. Please use **TestConfig.snapshotPathTemplate** to configure
snapshot paths.
:::

Suffix used to differentiate snapshots between multiple test configurations. For example, if snapshots depend on the platform, you can set `testInfo.snapshotSuffix` equal to `process.platform`. In this case `expect(value).toMatchSnapshot(snapshotName)` will use different snapshots depending on the platform. Learn more about [snapshots](../test-snapshots.md).

## property: TestInfo.status
> *Added in: v1.10*
- type: ?<`TestStatus`<"passed"|"failed"|"timedOut"|"skipped"|"interrupted">>

Actual status for the currently running test. Available after the test has finished in **Test.afterEach()** hook and fixtures.

Status is usually compared with the **TestInfo.expectedStatus**:

```js
import { test, expect } from '@copilotbrowser/test';

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus)
    console.log(`${testInfo.title} did not run as expected!`);
});
```

## property: TestInfo.timeout
> *Added in: v1.10*
>
> **Type:** `int`

Timeout in milliseconds for the currently running test. Zero means no timeout. Learn more about [various timeouts](../test-timeouts.md).

Timeout is usually specified in the [configuration file](../test-configuration.md)

```js
import { test, expect } from '@copilotbrowser/test';

test.beforeEach(async ({ page }, testInfo) => {
  // Extend timeout for all tests running this hook by 30 seconds.
  testInfo.setTimeout(testInfo.timeout + 30000);
});
```

## property: TestInfo.title
> *Added in: v1.10*
>
> **Type:** `string`

The title of the currently running test as passed to `test(title, testFunction)`.

## property: TestInfo.titlePath
> *Added in: v1.10*
>
> **Type:** `Array<string>`

The full title path starting with the test file name.

## property: TestInfo.workerIndex
> *Added in: v1.10*
>
> **Type:** `int`

The unique index of the worker process that is running the test. When a worker is restarted, for example after a failure, the new worker process gets a new unique `workerIndex`.

Also available as `process.env.TEST_WORKER_INDEX`. Learn more about [parallelism and sharding](../test-parallel.md) with copilotbrowser Test.
