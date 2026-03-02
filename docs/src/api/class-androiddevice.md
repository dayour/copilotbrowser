---
id: class-androiddevice
---

# class: AndroidDevice
> *Added in: v1.9*
>
> **Languages:** JavaScript

`AndroidDevice` represents a connected device, either real hardware or emulated. Devices can be obtained using **Android.devices()**.

## event: AndroidDevice.close
> *Added in: v1.28*
- argument: <`AndroidDevice`>

Emitted when the device connection gets closed.

## event: AndroidDevice.webView
> *Added in: v1.9*
- argument: <`AndroidWebView`>

Emitted when a new WebView instance is detected.

## async method: AndroidDevice.close
> *Added in: v1.9*

Disconnects from the device.

## async method: AndroidDevice.drag
> *Added in: v1.9*

Drags the widget defined by **selector** towards **dest** point.

### param: AndroidDevice.drag.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to drag.

### param: AndroidDevice.drag.dest
> *Added in: v1.9*
- `dest` <`Object`>
  - `x` <`float`>
  - `y` <`float`>

Point to drag to.

### option: AndroidDevice.drag.speed
> *Added in: v1.9*
- `speed` <`float`>

Optional speed of the drag in pixels per second.

### option: AndroidDevice.drag.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.fill
> *Added in: v1.9*

Fills the specific **selector** input box with **text**.

### param: AndroidDevice.fill.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to fill.

### param: AndroidDevice.fill.text
> *Added in: v1.9*
- `text` <`string`>

Text to be filled in the input box.

### option: AndroidDevice.fill.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.fling
> *Added in: v1.9*

Flings the widget defined by **selector** in  the specified **direction**.

### param: AndroidDevice.fling.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to fling.

### param: AndroidDevice.fling.direction
> *Added in: v1.9*
- `direction` <`AndroidFlingDirection`<"down"|"up"|"left"|"right">>

Fling direction.

### option: AndroidDevice.fling.speed
> *Added in: v1.9*
- `speed` <`float`>

Optional speed of the fling in pixels per second.

### option: AndroidDevice.fling.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.info
> *Added in: v1.9*
**Returns:** `AndroidElementInfo`

Returns information about a widget defined by **selector**.

### param: AndroidDevice.info.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to return information about.

## property: AndroidDevice.input
> *Added in: v1.9*
>
> **Type:** `AndroidInput`

## async method: AndroidDevice.installApk
> *Added in: v1.9*

Installs an apk on the device.

### param: AndroidDevice.installApk.file
> *Added in: v1.9*
- `file` <`string`|`Buffer`>

Either a path to the apk file, or apk file content.

### option: AndroidDevice.installApk.args
> *Added in: v1.9*
- `args` <`Array`<`string`>>

Optional arguments to pass to the `shell:cmd package install` call. Defaults to `-r -t -S`.

## async method: AndroidDevice.launchBrowser
> *Added in: v1.9*
**Returns:** `BrowserContext`

Launches Chrome browser on the device, and returns its persistent context.

### option: AndroidDevice.launchBrowser.pkg
> *Added in: v1.9*
- `pkg` <`string`>

Optional package name to launch instead of default Chrome for Android.

### option: AndroidDevice.launchBrowser.-inline- = %%-shared-context-params-list-v1.8-%%
> *Added in: v1.9*

### option: AndroidDevice.launchBrowser.proxy = %%-browser-option-proxy-%%
> *Added in: v1.29*

### option: AndroidDevice.launchBrowser.args = %%-browser-option-args-%%
> *Added in: v1.29*

## async method: AndroidDevice.longTap
> *Added in: v1.9*

Performs a long tap on the widget defined by **selector**.

### param: AndroidDevice.longTap.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to tap on.

### option: AndroidDevice.longTap.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## method: AndroidDevice.model
> *Added in: v1.9*
**Returns:** `string`

Device model.

## async method: AndroidDevice.open
> *Added in: v1.9*
**Returns:** `AndroidSocket`

Launches a process in the shell on the device and returns a socket to communicate with the launched process.

### param: AndroidDevice.open.command
> *Added in: v1.9*
- `command` <`string`>

Shell command to execute.

## async method: AndroidDevice.pinchClose
> *Added in: v1.9*

Pinches the widget defined by **selector** in the closing direction.

### param: AndroidDevice.pinchClose.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to pinch close.

### param: AndroidDevice.pinchClose.percent
> *Added in: v1.9*
- `percent` <`float`>

The size of the pinch as a percentage of the widget's size.

### option: AndroidDevice.pinchClose.speed
> *Added in: v1.9*
- `speed` <`float`>

Optional speed of the pinch in pixels per second.

### option: AndroidDevice.pinchClose.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.pinchOpen
> *Added in: v1.9*

Pinches the widget defined by **selector** in the open direction.

### param: AndroidDevice.pinchOpen.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to pinch open.

### param: AndroidDevice.pinchOpen.percent
> *Added in: v1.9*
- `percent` <`float`>

The size of the pinch as a percentage of the widget's size.

### option: AndroidDevice.pinchOpen.speed
> *Added in: v1.9*
- `speed` <`float`>

Optional speed of the pinch in pixels per second.

### option: AndroidDevice.pinchOpen.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.press
> *Added in: v1.9*

Presses the specific **key** in the widget defined by **selector**.

### param: AndroidDevice.press.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to press the key in.

### param: AndroidDevice.press.key
> *Added in: v1.9*
- `key` <`AndroidKey`>

The key to press.

### option: AndroidDevice.press.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.push
> *Added in: v1.9*

Copies a file to the device.

### param: AndroidDevice.push.file
> *Added in: v1.9*
- `file` <`string`|`Buffer`>

Either a path to the file, or file content.

### param: AndroidDevice.push.path
> *Added in: v1.9*
- `path` <`string`>

Path to the file on the device.

### option: AndroidDevice.push.mode
> *Added in: v1.9*
- `mode` <`int`>

Optional file mode, defaults to `644` (`rw-r--r--`).

## async method: AndroidDevice.screenshot
> *Added in: v1.9*
**Returns:** `Buffer`

Returns the buffer with the captured screenshot of the device.

### option: AndroidDevice.screenshot.path
> *Added in: v1.9*
- `path` <`path`>

The file path to save the image to. If **path** is a
relative path, then it is resolved relative to the current working directory. If no path is provided, the image won't be
saved to the disk.

## async method: AndroidDevice.scroll
> *Added in: v1.9*

Scrolls the widget defined by **selector** in  the specified **direction**.

### param: AndroidDevice.scroll.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to scroll.

### param: AndroidDevice.scroll.direction
> *Added in: v1.9*
- `direction` <`AndroidScrollDirection`<"down"|"up"|"left"|"right">>

Scroll direction.

### param: AndroidDevice.scroll.percent
> *Added in: v1.9*
- `percent` <`float`>

Distance to scroll as a percentage of the widget's size.

### option: AndroidDevice.scroll.speed
> *Added in: v1.9*
- `speed` <`float`>

Optional speed of the scroll in pixels per second.

### option: AndroidDevice.scroll.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## method: AndroidDevice.serial
> *Added in: v1.9*
**Returns:** `string`

Device serial number.

## method: AndroidDevice.setDefaultTimeout
> *Added in: v1.9*

This setting will change the default maximum time for all the methods accepting **timeout** option.

### param: AndroidDevice.setDefaultTimeout.timeout
> *Added in: v1.9*
- `timeout` <`float`>

Maximum time in milliseconds

## async method: AndroidDevice.shell
> *Added in: v1.9*
**Returns:** `Buffer`

Executes a shell command on the device and returns its output.

### param: AndroidDevice.shell.command
> *Added in: v1.9*
- `command` <`string`>

Shell command to execute.

## async method: AndroidDevice.swipe
> *Added in: v1.9*

Swipes the widget defined by **selector** in  the specified **direction**.

### param: AndroidDevice.swipe.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to swipe.

### param: AndroidDevice.swipe.direction
> *Added in: v1.9*
- `direction` <`AndroidSwipeDirection`<"down"|"up"|"left"|"right">>

Swipe direction.

### param: AndroidDevice.swipe.percent
> *Added in: v1.9*
- `percent` <`float`>

Distance to swipe as a percentage of the widget's size.

### option: AndroidDevice.swipe.speed
> *Added in: v1.9*
- `speed` <`float`>

Optional speed of the swipe in pixels per second.

### option: AndroidDevice.swipe.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.tap
> *Added in: v1.9*

Taps on the widget defined by **selector**.

### param: AndroidDevice.tap.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to tap on.

### option: AndroidDevice.tap.duration
> *Added in: v1.9*
- `duration` <`float`>

Optional duration of the tap in milliseconds.

### option: AndroidDevice.tap.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.wait
> *Added in: v1.9*

Waits for the specific **selector** to either appear or disappear, depending on the **state**.

### param: AndroidDevice.wait.selector
> *Added in: v1.9*
- `selector` <`AndroidSelector`>

Selector to wait for.

### option: AndroidDevice.wait.state
> *Added in: v1.9*
- `state` <`AndroidDeviceState`<"gone">>

Optional state. Can be either:
* default - wait for element to be present.
* `'gone'` - wait for element to not be present.

### option: AndroidDevice.wait.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## async method: AndroidDevice.waitForEvent
> *Added in: v1.9*
**Returns:** `any`

Waits for event to fire and passes its value into the predicate function. Returns when the predicate returns truthy value.

### param: AndroidDevice.waitForEvent.event = %%-wait-for-event-event-%%
> *Added in: v1.9*

### param: AndroidDevice.waitForEvent.optionsOrPredicate
> *Added in: v1.9*
- `optionsOrPredicate` ?<`function`|`Object`>
  - `predicate` <`function`> receives the event data and resolves to truthy value when the waiting should resolve.
  - `timeout` ?<`float`> maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to
    disable timeout. The default value can be changed by using the **AndroidDevice.setDefaultTimeout()**.

Either a predicate that receives an event or an options object. Optional.

## async method: AndroidDevice.webView
> *Added in: v1.9*
**Returns:** `AndroidWebView`

This method waits until `AndroidWebView` matching the **selector** is opened and returns it. If there is already an open `AndroidWebView` matching the **selector**, returns immediately.

### param: AndroidDevice.webView.selector
> *Added in: v1.9*
- `selector` <`Object`>
  - `pkg` ?<`string`> Optional Package identifier.
  - `socketName` ?<`string`> Optional webview socket name.

### option: AndroidDevice.webView.timeout = %%-android-timeout-%%
> *Added in: v1.9*

## method: AndroidDevice.webViews
> *Added in: v1.9*
**Returns:** `Array<AndroidWebView>`

Currently open WebViews.
