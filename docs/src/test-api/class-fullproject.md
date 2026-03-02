---
id: class-fullproject
---

# class: FullProject
> *Added in: v1.10*
>
> **Languages:** JavaScript

Runtime representation of the test project configuration. It is accessible in the tests via **TestInfo.project** and **WorkerInfo.project** and is passed to the test reporters. To see the format of the project in the copilotbrowser configuration file please see `TestProject` instead.

## property: FullProject.dependencies
> *Added in: v1.31*
>
> **Type:** `Array<string>`

See **TestProject.dependencies**.

## property: FullProject.grep
> *Added in: v1.10*
>
> **Type:** `RegExp|Array<RegExp>`

See **TestProject.grep**.

## property: FullProject.grepInvert
> *Added in: v1.10*
>
> **Type:** `null|RegExp|Array<RegExp>`

See **TestProject.grepInvert**.

## property: FullProject.ignoreSnapshots
> *Added in: v1.59*
>
> **Type:** `boolean`

See **TestProject.ignoreSnapshots**.

## property: FullProject.metadata
> *Added in: v1.10*
>
> **Type:** `Metadata`

See **TestProject.metadata**.

## property: FullProject.name
> *Added in: v1.10*
>
> **Type:** `string`

See **TestProject.name**.

## property: FullProject.snapshotDir
> *Added in: v1.10*
>
> **Type:** `string`

See **TestProject.snapshotDir**.

## property: FullProject.outputDir
> *Added in: v1.10*
>
> **Type:** `string`

See **TestProject.outputDir**.

## property: FullProject.repeatEach
> *Added in: v1.10*
>
> **Type:** `int`

See **TestProject.repeatEach**.

## property: FullProject.retries
> *Added in: v1.10*
>
> **Type:** `int`

See **TestProject.retries**.

## property: FullProject.teardown
> *Added in: v1.34*
- type: ?<`string`>

See **TestProject.teardown**.

## property: FullProject.testDir
> *Added in: v1.10*
>
> **Type:** `string`

See **TestProject.testDir**.

## property: FullProject.testIgnore
> *Added in: v1.10*
>
> **Type:** `string|RegExp|Array<string|RegExp>`

See **TestProject.testIgnore**.

## property: FullProject.testMatch
> *Added in: v1.10*
>
> **Type:** `string|RegExp|Array<string|RegExp>`

See **TestProject.testMatch**.

## property: FullProject.timeout
> *Added in: v1.10*
>
> **Type:** `int`

See **TestProject.timeout**.

## property: FullProject.use
> *Added in: v1.10*
>
> **Type:** `Fixtures`

See **TestProject.use**.
