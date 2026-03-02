---
id: class-worker
---

# class: Worker
> *Added in: v1.8*

The Worker class represents a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). `worker`
event is emitted on the page object to signal a worker creation. `close` event is emitted on the worker object when the
worker is gone.

```js
page.on('worker', worker => {
  console.log('Worker created: ' + worker.url());
  worker.on('close', worker => console.log('Worker destroyed: ' + worker.url()));
});

console.log('Current workers:');
for (const worker of page.workers())
  console.log('  ' + worker.url());
```

```java
page.onWorker(worker -> {
  System.out.println("Worker created: " + worker.url());
  worker.onClose(worker1 -> System.out.println("Worker destroyed: " + worker1.url()));
});
System.out.println("Current workers:");
for (Worker worker : page.workers())
  System.out.println("  " + worker.url());
```

```py
def handle_worker(worker):
    print("worker created: " + worker.url)
    worker.on("close", lambda: print("worker destroyed: " + worker.url))

page.on('worker', handle_worker)

print("current workers:")
for worker in page.workers:
    print("    " + worker.url)
```

```csharp
page.Worker += (_, worker) =>
{
    Console.WriteLine($"Worker created: {worker.Url}");
    worker.Close += (_, _) => Console.WriteLine($"Worker closed {worker.Url}");
};

Console.WriteLine("Current Workers:");
foreach(var pageWorker in page.Workers)
{
    Console.WriteLine($"\tWorker: {pageWorker.Url}");
}
```

## event: Worker.close
> *Added in: v1.8*
- argument: <`Worker`>

Emitted when this dedicated [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) is terminated.

## event: Worker.console
> *Added in: v1.57*
- argument: <`ConsoleMessage`>

Emitted when JavaScript within the worker calls one of console API methods, e.g. `console.log` or `console.dir`.

## async method: Worker.evaluate
> *Added in: v1.8*
**Returns:** `Serializable`

Returns the return value of **expression**.

If the function passed to the **Worker.evaluate()** returns a `Promise`, then **Worker.evaluate()** would wait for the promise
to resolve and return its value.

If the function passed to the **Worker.evaluate()** returns a non-`Serializable` value, then **Worker.evaluate()** returns `undefined`. copilotbrowser also supports transferring some
additional values that are not serializable by `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`.

### param: Worker.evaluate.expression = %%-evaluate-expression-%%
> *Added in: v1.8*

### param: Worker.evaluate.expression = %%-js-worker-evaluate-workerfunction-%%
> *Added in: v1.8*

### param: Worker.evaluate.arg
> *Added in: v1.8*
- `arg` ?<`EvaluationArgument`>

Optional argument to pass to **expression**.

## async method: Worker.evaluateHandle
> *Added in: v1.8*
**Returns:** `JSHandle`

Returns the return value of **expression** as a `JSHandle`.

The only difference between **Worker.evaluate()** and
**Worker.evaluateHandle()** is that **Worker.evaluateHandle()**
returns `JSHandle`.

If the function passed to the **Worker.evaluateHandle()** returns a `Promise`, then **Worker.evaluateHandle()** would wait for
the promise to resolve and return its value.

### param: Worker.evaluateHandle.expression = %%-evaluate-expression-%%
> *Added in: v1.8*

### param: Worker.evaluateHandle.expression = %%-js-worker-evaluate-workerfunction-%%
> *Added in: v1.8*

### param: Worker.evaluateHandle.arg
> *Added in: v1.8*
- `arg` ?<`EvaluationArgument`>

Optional argument to pass to **expression**.

## method: Worker.url
> *Added in: v1.8*
**Returns:** `string`

## async method: Worker.waitForClose
> *Added in: v1.10*
>
> **Languages:** Java
**Returns:** `Worker`

Performs action and waits for the Worker to close.

### option: Worker.waitForClose.timeout = %%-wait-for-event-timeout-%%
> *Added in: v1.9*

### param: Worker.waitForClose.callback = %%-java-wait-for-event-callback-%%
> *Added in: v1.9*

## async method: Worker.waitForConsoleMessage
> *Added in: v1.57*
>
> **Languages:** Java
**Returns:** `ConsoleMessage`

Performs action and waits for a console message.

### option: Worker.waitForConsoleMessage.predicate
> *Added in: v1.57*
- `predicate` <`function`\(`ConsoleMessage`\):`boolean`>

Receives the `ConsoleMessage` object and resolves to true when the waiting should resolve.

### option: Worker.waitForConsoleMessage.timeout = %%-wait-for-event-timeout-%%
> *Added in: v1.57*

### param: Worker.waitForConsoleMessage.callback = %%-java-wait-for-event-callback-%%
> *Added in: v1.57*

## async method: Worker.waitForEvent
> *Added in: v1.57*
>
> **Languages:** JavaScript, Python
**Returns:** `any`

Waits for event to fire and passes its value into the predicate function.
Returns when the predicate returns truthy value.
Will throw an error if the page is closed before the event is fired.
Returns the event data value.

**Usage**

```js
// Start waiting for download before clicking. Note no await.
const consolePromise = worker.waitForEvent('console');
await worker.evaluate('console.log(42)');
const consoleMessage = await consolePromise;
```

```python async
async with worker.expect_event("console") as event_info:
    await worker.evaluate("console.log(42)")
message = await event_info.value
```

```python sync
with worker.expect_event("console") as event_info:
    worker.evaluate("console.log(42)")
message = event_info.value
```

## async method: Worker.waitForEvent
> *Added in: v1.57*
>
> **Languages:** Python
**Returns:** `EventContextManager`

### param: Worker.waitForEvent.event = %%-wait-for-event-event-%%
> *Added in: v1.57*

### param: Worker.waitForEvent.optionsOrPredicate
> *Added in: v1.57*
>
> **Languages:** JavaScript
- `optionsOrPredicate` ?<`function`|`Object`>
  - `predicate` <`function`> Receives the event data and resolves to truthy value when the waiting should resolve.
  - `timeout` ?<`float`> Maximum time to wait for in milliseconds. Defaults to `0` - no timeout. The default value can be changed via `actionTimeout` option in the config, or by using the **BrowserContext.setDefaultTimeout()** or **Page.setDefaultTimeout()** methods.

Either a predicate that receives an event or an options object. Optional.

### option: Worker.waitForEvent.predicate = %%-wait-for-event-predicate-%%
> *Added in: v1.57*

### option: Worker.waitForEvent.timeout = %%-wait-for-event-timeout-%%
> *Added in: v1.57*
