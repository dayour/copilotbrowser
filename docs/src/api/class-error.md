---
id: class-error
---

# class: Error
> *Added in: v1.11*
>
> **Languages:** Python
* extends: `Exception`

Error is raised whenever certain operations are terminated abnormally, e.g.
browser closes while **Page.evaluate()** is running. All copilotbrowser exceptions
inherit from this class.

## property: Error.message
> *Added in: v1.11*
**Returns:** `str`

Message of the error.

## property: Error.name
> *Added in: v1.11*
**Returns:** `str`

Name of the error which got thrown inside the browser. Optional.

## property: Error.stack
> *Added in: v1.11*
**Returns:** `str`

Stack of the error which got thrown inside the browser. Optional.
