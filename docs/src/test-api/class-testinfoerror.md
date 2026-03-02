---
id: class-testinfoerror
---

# class: TestInfoError
> *Added in: v1.10*
>
> **Languages:** JavaScript

Information about an error thrown during test execution.

## property: TestInfoError.cause
> *Added in: v1.49*
- type: ?<`TestInfoError`>

Error cause. Set when there is a [cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) for the error. Will be `undefined` if there is no cause or if the cause is not an instance of `Error`.

## property: TestInfoError.message
> *Added in: v1.10*
- type: ?<`string`>

Error message. Set when `Error` (or its subclass) has been thrown.

## property: TestInfoError.stack
> *Added in: v1.10*
- type: ?<`string`>

Error stack. Set when `Error` (or its subclass) has been thrown.

## property: TestInfoError.value
> *Added in: v1.10*
- type: ?<`string`>

The value that was thrown. Set when anything except the `Error` (or its subclass) has been thrown.
