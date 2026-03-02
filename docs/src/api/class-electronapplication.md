---
id: class-electronapplication
---

# class: ElectronApplication
> *Added in: v1.9*
>
> **Languages:** JavaScript

Electron application representation. You can use **Electron.launch()** to
obtain the application instance. This instance you can control main electron process
as well as work with Electron windows:

```js
const { _electron: electron } = require('copilotbrowser');

(async () => {
  // Launch Electron app.
  const electronApp = await electron.launch({ args: ['main.js'] });

  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath();
  });
  console.log(appPath);

  // Get the first window that the app opens, wait if necessary.
  const window = await electronApp.firstWindow();
  // Print the title.
  console.log(await window.title());
  // Capture a screenshot.
  await window.screenshot({ path: 'intro.png' });
  // Direct Electron console to Node terminal.
  window.on('console', console.log);
  // Click button.
  await window.click('text=Click me');
  // Exit app.
  await electronApp.close();
})();
```

## event: ElectronApplication.close
> *Added in: v1.9*

This event is issued when the application process has been terminated.

## event: ElectronApplication.console
> *Added in: v1.42*
- argument: <`ConsoleMessage`>

Emitted when JavaScript within the Electron main process calls one of console API methods, e.g. `console.log` or `console.dir`.

The arguments passed into `console.log` are available on the `ConsoleMessage` event handler argument.

**Usage**

```js
electronApp.on('console', async msg => {
  const values = [];
  for (const arg of msg.args())
    values.push(await arg.jsonValue());
  console.log(...values);
});
await electronApp.evaluate(() => console.log('hello', 5, { foo: 'bar' }));
```

## event: ElectronApplication.window
> *Added in: v1.9*
- argument: <`Page`>

This event is issued for every window that is created **and loaded** in Electron. It contains a `Page` that can
be used for copilotbrowser automation.

## async method: ElectronApplication.browserWindow
> *Added in: v1.11*
**Returns:** `JSHandle`

Returns the BrowserWindow object that corresponds to the given copilotbrowser page.

### param: ElectronApplication.browserWindow.page
> *Added in: v1.11*
- `page` <`Page`>

Page to retrieve the window for.

## async method: ElectronApplication.close
> *Added in: v1.9*

Closes Electron application.

## method: ElectronApplication.context
> *Added in: v1.9*
**Returns:** `BrowserContext`

This method returns browser context that can be used for setting up context-wide routing, etc.

## async method: ElectronApplication.evaluate
> *Added in: v1.9*
**Returns:** `Serializable`

Returns the return value of **expression**.

If the function passed to the **ElectronApplication.evaluate()** returns a `Promise`, then
**ElectronApplication.evaluate()** would wait for the promise to resolve and return its value.

If the function passed to the **ElectronApplication.evaluate()** returns a non-`Serializable` value, then
**ElectronApplication.evaluate()** returns `undefined`. copilotbrowser also supports transferring
some additional values that are not serializable by `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`.

### param: ElectronApplication.evaluate.expression = %%-evaluate-expression-%%
> *Added in: v1.9*

### param: ElectronApplication.evaluate.expression = %%-js-electron-evaluate-workerfunction-%%
> *Added in: v1.9*

### param: ElectronApplication.evaluate.arg
> *Added in: v1.9*
- `arg` ?<`EvaluationArgument`>

Optional argument to pass to **expression**.

## async method: ElectronApplication.evaluateHandle
> *Added in: v1.9*
**Returns:** `JSHandle`

Returns the return value of **expression** as a `JSHandle`.

The only difference between **ElectronApplication.evaluate()** and **ElectronApplication.evaluateHandle()** is that **ElectronApplication.evaluateHandle()** returns `JSHandle`.

If the function passed to the **ElectronApplication.evaluateHandle()** returns a `Promise`, then
**ElectronApplication.evaluateHandle()** would wait for the promise to resolve and return its value.

### param: ElectronApplication.evaluateHandle.expression = %%-evaluate-expression-%%
> *Added in: v1.9*

### param: ElectronApplication.evaluateHandle.expression = %%-js-electron-evaluate-workerfunction-%%
> *Added in: v1.9*

### param: ElectronApplication.evaluateHandle.arg
> *Added in: v1.9*
- `arg` ?<`EvaluationArgument`>

Optional argument to pass to **expression**.

## async method: ElectronApplication.firstWindow
> *Added in: v1.9*
**Returns:** `Page`

Convenience method that waits for the first application window to be opened.

**Usage**

```js
const electronApp = await electron.launch({
  args: ['main.js']
});
const window = await electronApp.firstWindow();
// ...
```

### option: ElectronApplication.firstWindow.timeout
> *Added in: v1.33*
- `timeout` ?<`float`>

Maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds).
Pass `0` to disable timeout. The default value can be changed by using the
**BrowserContext.setDefaultTimeout()**.

## method: ElectronApplication.process
> *Added in: v1.21*
**Returns:** `ChildProcess`

Returns the main process for this Electron Application.

## async method: ElectronApplication.waitForEvent
> *Added in: v1.9*
**Returns:** `any`

Waits for event to fire and passes its value into the predicate function. Returns when the predicate returns truthy value. Will throw an error if the application is closed before the event is fired. Returns the event data value.

**Usage**

```js
const windowPromise = electronApp.waitForEvent('window');
await mainWindow.click('button');
const window = await windowPromise;
```

### param: ElectronApplication.waitForEvent.event = %%-wait-for-event-event-%%
> *Added in: v1.9*

### param: ElectronApplication.waitForEvent.optionsOrPredicate
> *Added in: v1.9*
>
> **Languages:** JavaScript
- `optionsOrPredicate` ?<`function`|`Object`>
  - `predicate` <`function`> receives the event data and resolves to truthy value when the waiting should resolve.
  - `timeout` ?<`float`> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to
    disable timeout. The default value can be changed by using the **BrowserContext.setDefaultTimeout()**.

Either a predicate that receives an event or an options object. Optional.

## method: ElectronApplication.windows
> *Added in: v1.9*
**Returns:** `Array<Page>`

Convenience method that returns all the opened windows.
