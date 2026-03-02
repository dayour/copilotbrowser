---
id: class-teststep
---

# class: TestStep
> *Added in: v1.10*
>
> **Languages:** JavaScript

Represents a step in the `TestRun`.

## property: TestStep.category
> *Added in: v1.10*
>
> **Type:** `string`

Step category to differentiate steps with different origin and verbosity. Built-in categories are:
* `expect` for expect calls
* `fixture` for fixtures setup and teardown
* `hook` for hooks initialization and teardown
* `pw:api` for copilotbrowser API calls.
* `test.step` for test.step API calls.
* `test.attach` for testInfo.attach API calls.


## property: TestStep.duration
> *Added in: v1.10*
>
> **Type:** `float`

Running time in milliseconds.

## property: TestStep.location
> *Added in: v1.10*
- type: ?<`Location`>

Optional location in the source where the step is defined.

## property: TestStep.error
> *Added in: v1.10*
- type: ?<`TestError`>

Error thrown during the step execution, if any.

## property: TestStep.parent
> *Added in: v1.10*
- type: ?<`TestStep`>

Parent step, if any.

## property: TestStep.startTime
> *Added in: v1.10*
>
> **Type:** `Date`

Start time of this particular test step.

## property: TestStep.steps
> *Added in: v1.10*
>
> **Type:** `Array<TestStep>`

List of steps inside this step.

## property: TestStep.annotations
> *Added in: v1.51*
>
> **Type:** `Array<Object>`
  - `type` <`string`> Annotation type, for example `'skip'`.
  - `description` ?<`string`> Optional description.
  - `location` ?<`Location`> Optional location in the source where the annotation is added.

The list of annotations applicable to the current test step.

## property: TestStep.attachments
> *Added in: v1.50*
>
> **Type:** `Array<Object>`
  - `name` <`string`> Attachment name.
  - `contentType` <`string`> Content type of this attachment to properly present in the report, for example `'application/json'` or `'image/png'`.
  - `path` ?<`string`> Optional path on the filesystem to the attached file.
  - `body` ?<`Buffer`> Optional attachment body used instead of a file.

The list of files or buffers attached in the step execution through **TestInfo.attach()**.

## property: TestStep.title
> *Added in: v1.10*
>
> **Type:** `string`

User-friendly test step title.

## method: TestStep.titlePath
> *Added in: v1.10*
**Returns:** `Array<string>`

Returns a list of step titles from the root step down to this step.
