---
id: class-touchscreen
---

# class: Touchscreen
> *Added in: v1.8*

The Touchscreen class operates in main-frame CSS pixels relative to the top-left corner of the viewport. Methods on the
touchscreen can only be used in browser contexts that have been initialized with `hasTouch` set to true.

This class is limited to emulating tap gestures. For examples of other gestures simulated by manually dispatching touch events, see the [emulating legacy touch events](../touch-events.md) page.

## async method: Touchscreen.tap
> *Added in: v1.8*

Dispatches a `touchstart` and `touchend` event with a single touch at the position (**x**,**y**).

:::note
**Page.tap()** the method will throw if **Browser.newContext.hasTouch** option of the browser context is false.
:::

### param: Touchscreen.tap.x
> *Added in: v1.8*
- `x` <`float`>

X coordinate relative to the main frame's viewport in CSS pixels.

### param: Touchscreen.tap.y
> *Added in: v1.8*
- `y` <`float`>

Y coordinate relative to the main frame's viewport in CSS pixels.
