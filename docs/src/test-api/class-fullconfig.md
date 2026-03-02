---
id: class-fullconfig
---

# class: FullConfig
> *Added in: v1.10*
>
> **Languages:** JavaScript

Resolved configuration which is accessible via **TestInfo.config** and is passed to the test reporters. To see the format of copilotbrowser configuration file, please see `TestConfig` instead.

## property: FullConfig.configFile
> *Added in: v1.20*
- type: ?<`string`>

Path to the configuration file used to run the tests. The value is an empty string if no config file was used.

## property: FullConfig.forbidOnly
> *Added in: v1.10*
>
> **Type:** `boolean`

See **TestConfig.forbidOnly**.

## property: FullConfig.fullyParallel
> *Added in: v1.20*
>
> **Type:** `boolean`

See **TestConfig.fullyParallel**.

## property: FullConfig.globalSetup
> *Added in: v1.10*
>
> **Type:** `null|string`

See **TestConfig.globalSetup**.

## property: FullConfig.globalTeardown
> *Added in: v1.10*
>
> **Type:** `null|string`

See **TestConfig.globalTeardown**.

## property: FullConfig.globalTimeout
> *Added in: v1.10*
>
> **Type:** `int`

See **TestConfig.globalTimeout**.

## property: FullConfig.grep
> *Added in: v1.10*
>
> **Type:** `RegExp|Array<RegExp>`

See **TestConfig.grep**.

## property: FullConfig.grepInvert
> *Added in: v1.10*
>
> **Type:** `null|RegExp|Array<RegExp>`

See **TestConfig.grepInvert**.

## property: FullConfig.maxFailures
> *Added in: v1.10*
>
> **Type:** `int`

See **TestConfig.maxFailures**.

## property: FullConfig.metadata
> *Added in: v1.10*
>
> **Type:** `Metadata`

See **TestConfig.metadata**.

## property: FullConfig.preserveOutput
> *Added in: v1.10*
>
> **Type:** `PreserveOutput<"always"|"never"|"failures-only">`

See **TestConfig.preserveOutput**.

## property: FullConfig.projects
> *Added in: v1.10*
>
> **Type:** `Array<FullProject>`

List of resolved projects.

## property: FullConfig.quiet
> *Added in: v1.10*
>
> **Type:** `boolean`

See **TestConfig.quiet**.

## property: FullConfig.reporter
> *Added in: v1.10*
>
> **Type:** `string|Array<Object>|BuiltInReporter<"list"|"dot"|"line"|"github"|"json"|"junit"|"null"|"html">`
  - `0` <`string`> Reporter name or module or file path
  - `1` <`Object`> An object with reporter options if any

See **TestConfig.reporter**.

## property: FullConfig.reportSlowTests
> *Added in: v1.10*
>
> **Type:** `null|Object`
  - `max` <`int`> The maximum number of slow test files to report.
  - `threshold` <`float`> Test file duration in milliseconds that is considered slow.

See **TestConfig.reportSlowTests**.

## property: FullConfig.rootDir
> *Added in: v1.20*
>
> **Type:** `string`

Base directory for all relative paths used in the reporters.

## property: FullConfig.runAgents
> *Added in: v1.58*
>
> **Type:** `'RunAgentsMode<"all"|"missing"|"none">`

Whether to run LLM agent for `PageAgent`:
* "all" disregards existing cache and performs all actions via LLM
* "missing" only performs actions that don't have generated cache actions
* "none" does not talk to LLM at all, relies on the cached actions (default)

## property: FullConfig.shard
> *Added in: v1.10*
>
> **Type:** `null|Object`
  - `total` <`int`> The total number of shards.
  - `current` <`int`> The index of the shard to execute, one-based.

See **TestConfig.shard**.

## property: FullConfig.tags
> *Added in: v1.57*
>
> **Type:** `Array<string>`

Resolved global tags. See **TestConfig.tag**.

## property: FullConfig.updateSnapshots
> *Added in: v1.10*
>
> **Type:** `UpdateSnapshots<"all"|"changed"|"missing"|"none">`

See **TestConfig.updateSnapshots**.

## property: FullConfig.updateSourceMethod
> *Added in: v1.50*
>
> **Type:** `UpdateSourceMethod<"overwrite"|"3way"|"patch">`

See **TestConfig.updateSourceMethod**.

## property: FullConfig.version
> *Added in: v1.20*
>
> **Type:** `string`

copilotbrowser version.

## property: FullConfig.webServer
> *Added in: v1.10*
>
> **Type:** `null|Object`

See **TestConfig.webServer**.

## property: FullConfig.workers
> *Added in: v1.10*
>
> **Type:** `int`

See **TestConfig.workers**.
