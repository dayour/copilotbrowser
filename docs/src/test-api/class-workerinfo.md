---
id: class-workerinfo
---

# class: WorkerInfo
> *Added in: v1.10*
>
> **Languages:** JavaScript

`WorkerInfo` contains information about the worker that is running tests and is available to worker-scoped fixtures. `WorkerInfo` is a subset of `TestInfo` that is available in many other places.

## property: WorkerInfo.config
> *Added in: v1.10*
>
> **Type:** `FullConfig`

Processed configuration from the [configuration file](../test-configuration.md).


## property: WorkerInfo.parallelIndex
> *Added in: v1.10*
>
> **Type:** `int`

The index of the worker between `0` and `workers - 1`. It is guaranteed that workers running at the same time have a different `parallelIndex`. When a worker is restarted, for example after a failure, the new worker process has the same `parallelIndex`.

Also available as `process.env.TEST_PARALLEL_INDEX`. Learn more about [parallelism and sharding](../test-parallel.md) with copilotbrowser Test.


## property: WorkerInfo.project
> *Added in: v1.10*
>
> **Type:** `FullProject`

Processed project configuration from the [configuration file](../test-configuration.md).


## property: WorkerInfo.workerIndex
> *Added in: v1.10*
>
> **Type:** `int`

The unique index of the worker process that is running the test. When a worker is restarted, for example after a failure, the new worker process gets a new unique `workerIndex`.

Also available as `process.env.TEST_WORKER_INDEX`. Learn more about [parallelism and sharding](../test-parallel.md) with copilotbrowser Test.
