---
id: class-elementhandle
---

# class: ElementHandle
> *Added in: v1.8*
* extends: `JSHandle`

ElementHandle represents an in-page DOM element. ElementHandles can be created with the **Page.querySelector()** method.

:::warning[Discouraged]
The use of ElementHandle is discouraged, use `Locator` objects and web-first assertions instead.
:::

```js
const hrefElement = await page.$('a');
await hrefElement.click();
```

```java
ElementHandle hrefElement = page.querySelector("a");
hrefElement.click();
```

```python async
href_element = await page.query_selector("a")
await href_element.click()
```

```python sync
href_element = page.query_selector("a")
href_element.click()
```

```csharp
var handle = await page.QuerySelectorAsync("a");
await handle.ClickAsync();
```

ElementHandle prevents DOM element from garbage collection unless the handle is disposed with
**JSHandle.dispose()**. ElementHandles are auto-disposed when their origin frame gets navigated.

ElementHandle instances can be used as an argument in **Page.evalOnSelector()** and **Page.evaluate()** methods.

The difference between the `Locator` and ElementHandle is that the ElementHandle points to a particular element, while `Locator` captures the logic of how to retrieve an element.

In the example below, handle points to a particular DOM element on page. If that element changes text or is used by React to render an entirely different component, handle is still pointing to that very DOM element. This can lead to unexpected behaviors.

```js
const handle = await page.$('text=Submit');
// ...
await handle.hover();
await handle.click();
```

```java
ElementHandle handle = page.querySelector("text=Submit");
handle.hover();
handle.click();
```

```python async
handle = await page.query_selector("text=Submit")
await handle.hover()
await handle.click()
```

```python sync
handle = page.query_selector("text=Submit")
handle.hover()
handle.click()
```

```csharp
var handle = await page.QuerySelectorAsync("text=Submit");
await handle.HoverAsync();
await handle.ClickAsync();
```

With the locator, every time the `element` is used, up-to-date DOM element is located in the page using the selector. So in the snippet below, underlying DOM element is going to be located twice.

```js
const locator = page.getByText('Submit');
// ...
await locator.hover();
await locator.click();
```

```java
Locator locator = page.getByText("Submit");
locator.hover();
locator.click();
```

```python async
locator = page.get_by_text("Submit")
await locator.hover()
await locator.click()
```

```python sync
locator = page.get_by_text("Submit")
locator.hover()
locator.click()
```

```csharp
var locator = page.GetByText("Submit");
await locator.HoverAsync();
await locator.ClickAsync();
```

## async method: ElementHandle.boundingBox
> *Added in: v1.8*
**Returns:** `null|Object`
  - `x` <`float`> the x coordinate of the element in pixels.
  - `y` <`float`> the y coordinate of the element in pixels.
  - `width` <`float`> the width of the element in pixels.
  - `height` <`float`> the height of the element in pixels.

This method returns the bounding box of the element, or `null` if the element is not visible. The bounding box is
calculated relative to the main frame viewport - which is usually the same as the browser window.

Scrolling affects the returned bounding box, similarly to
[Element.getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect). That
means `x` and/or `y` may be negative.

Elements from child frames return the bounding box relative to the main frame, unlike the
[Element.getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

Assuming the page is static, it is safe to use bounding box coordinates to perform input. For example, the following
snippet should click the center of the element.

**Usage**

```js
const box = await elementHandle.boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
```

```java
BoundingBox box = elementHandle.boundingBox();
page.mouse().click(box.x + box.width / 2, box.y + box.height / 2);
```

```python async
box = await element_handle.bounding_box()
await page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
```

```python sync
box = element_handle.bounding_box()
page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
```

```csharp
var box = await elementHandle.BoundingBoxAsync();
await page.Mouse.ClickAsync(box.X + box.Width / 2, box.Y + box.Height / 2);
```

## async method: ElementHandle.check
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.check()** instead. Read more about [locators](../locators.md).

This method checks the element by performing the following steps:
1. Ensure that element is a checkbox or a radio input. If not, this method throws. If the element is already
   checked, this method returns immediately.
1. Wait for [actionability](../actionability.md) checks on the element, unless **force** option is set.
1. Scroll the element into view if needed.
1. Use **Page.mouse** to click in the center of the element.
1. Ensure that the element is now checked. If not, this method throws.

If the element is detached from the DOM at any moment during the action, this method throws.

When all steps combined have not finished during the specified **timeout**, this method throws a
`TimeoutError`. Passing zero timeout disables this.

### option: ElementHandle.check.position = %%-input-position-%%
> *Added in: v1.11*

### option: ElementHandle.check.force = %%-input-force-%%
> *Added in: v1.8*

### option: ElementHandle.check.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.check.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.check.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.check.trial = %%-input-trial-%%
> *Added in: v1.11*

## async method: ElementHandle.click
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.click()** instead. Read more about [locators](../locators.md).

This method clicks the element by performing the following steps:
1. Wait for [actionability](../actionability.md) checks on the element, unless **force** option is set.
1. Scroll the element into view if needed.
1. Use **Page.mouse** to click in the center of the element, or the specified **position**.
1. Wait for initiated navigations to either succeed or fail, unless **noWaitAfter** option is set.

If the element is detached from the DOM at any moment during the action, this method throws.

When all steps combined have not finished during the specified **timeout**, this method throws a
`TimeoutError`. Passing zero timeout disables this.

### option: ElementHandle.click.button = %%-input-button-%%
> *Added in: v1.8*

### option: ElementHandle.click.clickCount = %%-input-click-count-%%
> *Added in: v1.8*

### option: ElementHandle.click.delay = %%-input-down-up-delay-%%
> *Added in: v1.8*

### option: ElementHandle.click.position = %%-input-position-%%
> *Added in: v1.8*

### option: ElementHandle.click.modifiers = %%-input-modifiers-%%
> *Added in: v1.8*

### option: ElementHandle.click.force = %%-input-force-%%
> *Added in: v1.8*

### option: ElementHandle.click.noWaitAfter = %%-input-no-wait-after-%%
> *Added in: v1.8*

### option: ElementHandle.click.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.click.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.click.trial = %%-input-trial-%%
> *Added in: v1.11*

### option: ElementHandle.click.steps = %%-input-mousemove-steps-%%
> *Added in: v1.57*

## async method: ElementHandle.contentFrame
> *Added in: v1.8*
**Returns:** `null|Frame`

Returns the content frame for element handles referencing iframe nodes, or `null` otherwise

## async method: ElementHandle.dblclick
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.dblclick()** instead. Read more about [locators](../locators.md).
> **Languages:** *(all)*

This method double clicks the element by performing the following steps:
1. Wait for [actionability](../actionability.md) checks on the element, unless **force** option is set.
1. Scroll the element into view if needed.
1. Use **Page.mouse** to double click in the center of the element, or the specified **position**.

If the element is detached from the DOM at any moment during the action, this method throws.

When all steps combined have not finished during the specified **timeout**, this method throws a
`TimeoutError`. Passing zero timeout disables this.

:::note
`elementHandle.dblclick()` dispatches two `click` events and a single `dblclick` event.
:::

### option: ElementHandle.dblclick.button = %%-input-button-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.delay = %%-input-down-up-delay-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.position = %%-input-position-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.modifiers = %%-input-modifiers-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.force = %%-input-force-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.dblclick.trial = %%-input-trial-%%
> *Added in: v1.11*

### option: ElementHandle.dblclick.steps = %%-input-mousemove-steps-%%
> *Added in: v1.57*

## async method: ElementHandle.dispatchEvent
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.dispatchEvent()** instead. Read more about [locators](../locators.md).

The snippet below dispatches the `click` event on the element. Regardless of the visibility state of the element, `click`
is dispatched. This is equivalent to calling
[element.click()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click).

**Usage**

```js
await elementHandle.dispatchEvent('click');
```

```java
elementHandle.dispatchEvent("click");
```

```python async
await element_handle.dispatch_event("click")
```

```python sync
element_handle.dispatch_event("click")
```

```csharp
await elementHandle.DispatchEventAsync("click");
```

Under the hood, it creates an instance of an event based on the given **type**, initializes it with
**eventInit** properties and dispatches it on the element. Events are `composed`, `cancelable` and bubble by
default.

Since **eventInit** is event-specific, please refer to the events documentation for the lists of initial
properties:
* [DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/DeviceMotionEvent)
* [DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/DeviceOrientationEvent)
* [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent/DragEvent)
* [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event/Event)
* [FocusEvent](https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent/FocusEvent)
* [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/KeyboardEvent)
* [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent)
* [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/PointerEvent)
* [TouchEvent](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent/TouchEvent)
* [WheelEvent](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/WheelEvent)

You can also specify `JSHandle` as the property value if you want live objects to be passed into the event:

```js
// Note you can only create DataTransfer in Chromium and Firefox
const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
await elementHandle.dispatchEvent('dragstart', { dataTransfer });
```

```java
// Note you can only create DataTransfer in Chromium and Firefox
JSHandle dataTransfer = page.evaluateHandle("() => new DataTransfer()");
Map<String, Object> arg = new HashMap<>();
arg.put("dataTransfer", dataTransfer);
elementHandle.dispatchEvent("dragstart", arg);
```

```python async
# note you can only create data_transfer in chromium and firefox
data_transfer = await page.evaluate_handle("new DataTransfer()")
await element_handle.dispatch_event("#source", "dragstart", {"dataTransfer": data_transfer})
```

```python sync
# note you can only create data_transfer in chromium and firefox
data_transfer = page.evaluate_handle("new DataTransfer()")
element_handle.dispatch_event("#source", "dragstart", {"dataTransfer": data_transfer})
```

```csharp
var dataTransfer = await page.EvaluateHandleAsync("() => new DataTransfer()");
await elementHandle.DispatchEventAsync("dragstart", new Dictionary<string, object>
{
    { "dataTransfer", dataTransfer }
});
```

### param: ElementHandle.dispatchEvent.type
> *Added in: v1.8*
- `type` <`string`>

DOM event type: `"click"`, `"dragstart"`, etc.

### param: ElementHandle.dispatchEvent.eventInit
> *Added in: v1.8*
- `eventInit` ?<`EvaluationArgument`>

Optional event-specific initialization properties.

## async method: ElementHandle.evalOnSelector
> *Added in: v1.9*
* discouraged: This method does not wait for the element to pass actionability
  checks and therefore can lead to the flaky tests. Use **Locator.evaluate()**,
  other `Locator` helper methods or web-first assertions instead.
> **Languages:** Java, Python, C#
**Returns:** `Serializable`

Returns the return value of **expression**.

The method finds an element matching the specified selector in the `ElementHandle`s subtree and passes it as a first
argument to **expression**. If no elements match the selector, the method throws an error.

If **expression** returns a `Promise`, then **ElementHandle.evalOnSelector()** would wait for the promise to resolve and return its
value.

**Usage**

```js
const tweetHandle = await page.$('.tweet');
expect(await tweetHandle.$eval('.like', node => node.innerText)).toBe('100');
expect(await tweetHandle.$eval('.retweets', node => node.innerText)).toBe('10');
```

```java
ElementHandle tweetHandle = page.querySelector(".tweet");
assertEquals("100", tweetHandle.evalOnSelector(".like", "node => node.innerText"));
assertEquals("10", tweetHandle.evalOnSelector(".retweets", "node => node.innerText"));
```

```python async
tweet_handle = await page.query_selector(".tweet")
assert await tweet_handle.eval_on_selector(".like", "node => node.innerText") == "100"
assert await tweet_handle.eval_on_selector(".retweets", "node => node.innerText") == "10"
```

```python sync
tweet_handle = page.query_selector(".tweet")
assert tweet_handle.eval_on_selector(".like", "node => node.innerText") == "100"
assert tweet_handle.eval_on_selector(".retweets", "node => node.innerText") == "10"
```

```csharp
var tweetHandle = await page.QuerySelectorAsync(".tweet");
Assert.AreEqual("100", await tweetHandle.EvalOnSelectorAsync(".like", "node => node.innerText"));
Assert.AreEqual("10", await tweetHandle.EvalOnSelectorAsync(".retweets", "node => node.innerText"));
```

### param: ElementHandle.evalOnSelector.selector = %%-query-selector-%%
> *Added in: v1.9*

### param: ElementHandle.evalOnSelector.expression = %%-evaluate-expression-%%
> *Added in: v1.9*

### param: ElementHandle.evalOnSelector.expression = %%-js-evalonselector-pagefunction-%%
> *Added in: v1.9*

### param: ElementHandle.evalOnSelector.arg
> *Added in: v1.9*
- `arg` ?<`EvaluationArgument`>

Optional argument to pass to **expression**.

## async method: ElementHandle.evalOnSelectorAll
> *Added in: v1.9*
* discouraged: In most cases, **Locator.evaluateAll()**,
  other `Locator` helper methods and web-first assertions do a better job.
> **Languages:** Java, Python, C#
**Returns:** `Serializable`

Returns the return value of **expression**.

The method finds all elements matching the specified selector in the `ElementHandle`'s subtree and passes an array of
matched elements as a first argument to **expression**.

If **expression** returns a `Promise`, then **ElementHandle.evalOnSelectorAll()** would wait for the promise to resolve and return its
value.

**Usage**

```html
<div class="feed">
  <div class="tweet">Hello!</div>
  <div class="tweet">Hi!</div>
</div>
```

```js
const feedHandle = await page.$('.feed');
expect(await feedHandle.$$eval('.tweet', nodes =>
  nodes.map(n => n.innerText))).toEqual(['Hello!', 'Hi!'],
);
```

```java
ElementHandle feedHandle = page.querySelector(".feed");
assertEquals(Arrays.asList("Hello!", "Hi!"), feedHandle.evalOnSelectorAll(".tweet", "nodes => nodes.map(n => n.innerText)"));
```

```python async
feed_handle = await page.query_selector(".feed")
assert await feed_handle.eval_on_selector_all(".tweet", "nodes => nodes.map(n => n.innerText)") == ["hello!", "hi!"]
```

```python sync
feed_handle = page.query_selector(".feed")
assert feed_handle.eval_on_selector_all(".tweet", "nodes => nodes.map(n => n.innerText)") == ["hello!", "hi!"]
```

```csharp
var feedHandle = await page.QuerySelectorAsync(".feed");
Assert.AreEqual(new [] { "Hello!", "Hi!" }, await feedHandle.EvalOnSelectorAllAsync<string[]>(".tweet", "nodes => nodes.map(n => n.innerText)"));
```

### param: ElementHandle.evalOnSelectorAll.selector = %%-query-selector-%%
> *Added in: v1.9*

### param: ElementHandle.evalOnSelectorAll.expression = %%-evaluate-expression-%%
> *Added in: v1.9*

### param: ElementHandle.evalOnSelectorAll.expression = %%-js-evalonselectorall-pagefunction-%%
> *Added in: v1.9*

### param: ElementHandle.evalOnSelectorAll.arg
> *Added in: v1.9*
- `arg` ?<`EvaluationArgument`>

Optional argument to pass to **expression**.

## async method: ElementHandle.fill
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.fill()** instead. Read more about [locators](../locators.md).

This method waits for [actionability](../actionability.md) checks, focuses the element, fills it and triggers an `input` event after filling. Note that you can pass an empty string to clear the input field.

If the target element is not an `<input>`, `<textarea>` or `[contenteditable]` element, this method throws an error. However, if the element is inside the `<label>` element that has an associated [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), the control will be filled instead.

To send fine-grained keyboard events, use **Locator.pressSequentially()**.

### param: ElementHandle.fill.value
> *Added in: v1.8*
- `value` <`string`>

Value to set for the `<input>`, `<textarea>` or `[contenteditable]` element.

### option: ElementHandle.fill.force = %%-input-force-%%
> *Added in: v1.13*

### option: ElementHandle.fill.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.fill.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.fill.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

## async method: ElementHandle.focus
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.focus()** instead. Read more about [locators](../locators.md).

Calls [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on the element.

## async method: ElementHandle.getAttribute
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.getAttribute()** instead. Read more about [locators](../locators.md).
**Returns:** `null|string`

Returns element attribute value.

### param: ElementHandle.getAttribute.name
> *Added in: v1.8*
- `name` <`string`>

Attribute name to get the value for.

## async method: ElementHandle.hover
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.hover()** instead. Read more about [locators](../locators.md).

This method hovers over the element by performing the following steps:
1. Wait for [actionability](../actionability.md) checks on the element, unless **force** option is set.
1. Scroll the element into view if needed.
1. Use **Page.mouse** to hover over the center of the element, or the specified **position**.

If the element is detached from the DOM at any moment during the action, this method throws.

When all steps combined have not finished during the specified **timeout**, this method throws a
`TimeoutError`. Passing zero timeout disables this.

### option: ElementHandle.hover.position = %%-input-position-%%
> *Added in: v1.8*

### option: ElementHandle.hover.modifiers = %%-input-modifiers-%%
> *Added in: v1.8*

### option: ElementHandle.hover.force = %%-input-force-%%
> *Added in: v1.8*

### option: ElementHandle.hover.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.hover.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.hover.trial = %%-input-trial-%%
> *Added in: v1.11*

### option: ElementHandle.hover.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.28*

## async method: ElementHandle.innerHTML
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.innerHTML()** instead. Read more about [locators](../locators.md).
**Returns:** `string`

Returns the `element.innerHTML`.

## async method: ElementHandle.innerText
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.innerText()** instead. Read more about [locators](../locators.md).
**Returns:** `string`

Returns the `element.innerText`.

## async method: ElementHandle.inputValue
> *Added in: v1.13*
* discouraged: Use locator-based **Locator.inputValue()** instead. Read more about [locators](../locators.md).
**Returns:** `string`

Returns `input.value` for the selected `<input>` or `<textarea>` or `<select>` element.

Throws for non-input elements. However, if the element is inside the `<label>` element that has an associated [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), returns the value of the control.

### option: ElementHandle.inputValue.timeout = %%-input-timeout-%%
> *Added in: v1.13*

### option: ElementHandle.inputValue.timeout = %%-input-timeout-js-%%
> *Added in: v1.13*

## async method: ElementHandle.isChecked
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.isChecked()** instead. Read more about [locators](../locators.md).
**Returns:** `boolean`

Returns whether the element is checked. Throws if the element is not a checkbox or radio input.

## async method: ElementHandle.isDisabled
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.isDisabled()** instead. Read more about [locators](../locators.md).
**Returns:** `boolean`

Returns whether the element is disabled, the opposite of [enabled](../actionability.md#enabled).

## async method: ElementHandle.isEditable
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.isEditable()** instead. Read more about [locators](../locators.md).
**Returns:** `boolean`

Returns whether the element is [editable](../actionability.md#editable).

## async method: ElementHandle.isEnabled
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.isEnabled()** instead. Read more about [locators](../locators.md).
**Returns:** `boolean`

Returns whether the element is [enabled](../actionability.md#enabled).

## async method: ElementHandle.isHidden
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.isHidden()** instead. Read more about [locators](../locators.md).
**Returns:** `boolean`

Returns whether the element is hidden, the opposite of [visible](../actionability.md#visible).

## async method: ElementHandle.isVisible
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.isVisible()** instead. Read more about [locators](../locators.md).
**Returns:** `boolean`

Returns whether the element is [visible](../actionability.md#visible).

## async method: ElementHandle.ownerFrame
> *Added in: v1.8*
**Returns:** `null|Frame`

Returns the frame containing the given element.

## async method: ElementHandle.press
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.press()** instead. Read more about [locators](../locators.md).

Focuses the element, and then uses **Keyboard.down()** and **Keyboard.up()**.

**key** can specify the intended
[keyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) value or a single character to
generate the text for. A superset of the **key** values can be found
[here](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values). Examples of the keys are:

`F1` - `F12`, `Digit0`- `Digit9`, `KeyA`- `KeyZ`, `Backquote`, `Minus`, `Equal`, `Backslash`, `Backspace`, `Tab`,
`Delete`, `Escape`, `ArrowDown`, `End`, `Enter`, `Home`, `Insert`, `PageDown`, `PageUp`, `ArrowRight`, `ArrowUp`, etc.

Following modification shortcuts are also supported: `Shift`, `Control`, `Alt`, `Meta`, `ShiftLeft`, `ControlOrMeta`.

Holding down `Shift` will type the text that corresponds to the **key** in the upper case.

If **key** is a single character, it is case-sensitive, so the values `a` and `A` will generate different
respective texts.

Shortcuts such as `key: "Control+o"`, `key: "Control++` or `key: "Control+Shift+T"` are supported as well. When specified with the
modifier, modifier is pressed and being held while the subsequent key is being pressed.

### param: ElementHandle.press.key
> *Added in: v1.8*
- `key` <`string`>

Name of the key to press or a character to generate, such as `ArrowLeft` or `a`.

### option: ElementHandle.press.delay
> *Added in: v1.8*
- `delay` <`float`>

Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.

### option: ElementHandle.press.noWaitAfter = %%-input-no-wait-after-%%
> *Added in: v1.8*

### option: ElementHandle.press.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.press.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

## async method: ElementHandle.querySelector
> *Added in: v1.9*
* discouraged: Use locator-based **Page.locator()** instead. Read more about [locators](../locators.md).
> **Languages:** Java, Python, C#
**Returns:** `null|ElementHandle`

The method finds an element matching the specified selector in the `ElementHandle`'s subtree. If no elements match the selector,
returns `null`.

### param: ElementHandle.querySelector.selector = %%-query-selector-%%
> *Added in: v1.9*

## async method: ElementHandle.querySelectorAll
> *Added in: v1.9*
* discouraged: Use locator-based **Page.locator()** instead. Read more about [locators](../locators.md).
> **Languages:** Java, Python, C#
**Returns:** `Array<ElementHandle>`

The method finds all elements matching the specified selector in the `ElementHandle`s subtree. If no elements match the selector,
returns empty array.

### param: ElementHandle.querySelectorAll.selector = %%-query-selector-%%
> *Added in: v1.9*

## async method: ElementHandle.screenshot
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.screenshot()** instead. Read more about [locators](../locators.md).
**Returns:** `Buffer`

This method captures a screenshot of the page, clipped to the size and position of this particular element. If the element is covered by other elements, it will not be actually visible on the screenshot. If the element is a scrollable container, only the currently scrolled content will be visible on the screenshot.

This method waits for the [actionability](../actionability.md) checks, then scrolls element into view before taking a
screenshot. If the element is detached from DOM, the method throws an error.

Returns the buffer with the captured screenshot.

### option: ElementHandle.screenshot.-inline- = %%-screenshot-options-common-list-v1.8-%%
> *Added in: v1.8*

### option: ElementHandle.screenshot.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.screenshot.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.screenshot.maskColor = %%-screenshot-option-mask-color-%%
> *Added in: v1.34*

### option: ElementHandle.screenshot.style = %%-screenshot-option-style-%%
> *Added in: v1.41*

## async method: ElementHandle.scrollIntoViewIfNeeded
* discouraged: Use locator-based **Locator.scrollIntoViewIfNeeded()** instead. Read more about [locators](../locators.md).
> *Added in: v1.8*

This method waits for [actionability](../actionability.md) checks, then tries to scroll element into view, unless it is
completely visible as defined by
[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)'s `ratio`.

Throws when `elementHandle` does not point to an element
[connected](https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected) to a Document or a ShadowRoot.

See [scrolling](../input.md#scrolling) for alternative ways to scroll.

### option: ElementHandle.scrollIntoViewIfNeeded.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.scrollIntoViewIfNeeded.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

## async method: ElementHandle.selectOption
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.selectOption()** instead. Read more about [locators](../locators.md).
**Returns:** `Array<string>`

This method waits for [actionability](../actionability.md) checks, waits until all specified options are present in the `<select>` element and selects these options.

If the target element is not a `<select>` element, this method throws an error. However, if the element is inside the `<label>` element that has an associated [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), the control will be used instead.

Returns the array of option values that have been successfully selected.

Triggers a `change` and `input` event once all the provided options have been selected.

**Usage**

```js
// Single selection matching the value or label
handle.selectOption('blue');

// single selection matching the label
handle.selectOption({ label: 'Blue' });

// multiple selection
handle.selectOption(['red', 'green', 'blue']);
```

```java
// Single selection matching the value or label
handle.selectOption("blue");
// single selection matching the label
handle.selectOption(new SelectOption().setLabel("Blue"));
// multiple selection
handle.selectOption(new String[] {"red", "green", "blue"});
```

```python async
# Single selection matching the value or label
await handle.select_option("blue")
# single selection matching the label
await handle.select_option(label="blue")
# multiple selection
await handle.select_option(value=["red", "green", "blue"])
```

```python sync
# Single selection matching the value or label
handle.select_option("blue")
# single selection matching both the label
handle.select_option(label="blue")
# multiple selection
handle.select_option(value=["red", "green", "blue"])
```

```csharp
// Single selection matching the value or label
await handle.SelectOptionAsync(new[] { "blue" });
// single selection matching the label
await handle.SelectOptionAsync(new[] { new SelectOptionValue() { Label = "blue" } });
// multiple selection
await handle.SelectOptionAsync(new[] { "red", "green", "blue" });
// multiple selection for blue, red and second option
await handle.SelectOptionAsync(new[] {
    new SelectOptionValue() { Label = "blue" },
    new SelectOptionValue() { Index = 2 },
    new SelectOptionValue() { Value = "red" }});
```

### param: ElementHandle.selectOption.values = %%-select-options-values-%%
> *Added in: v1.8*

### option: ElementHandle.selectOption.force = %%-input-force-%%
> *Added in: v1.13*

### option: ElementHandle.selectOption.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.selectOption.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.selectOption.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### param: ElementHandle.selectOption.element = %%-python-select-options-element-%%
> *Added in: v1.8*

### param: ElementHandle.selectOption.index = %%-python-select-options-index-%%
> *Added in: v1.8*

### param: ElementHandle.selectOption.value = %%-python-select-options-value-%%
> *Added in: v1.8*

### param: ElementHandle.selectOption.label = %%-python-select-options-label-%%
> *Added in: v1.8*

## async method: ElementHandle.selectText
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.selectText()** instead. Read more about [locators](../locators.md).

This method waits for [actionability](../actionability.md) checks, then focuses the element and selects all its text
content.

If the element is inside the `<label>` element that has an associated [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), focuses and selects text in the control instead.

### option: ElementHandle.selectText.force = %%-input-force-%%
> *Added in: v1.13*

### option: ElementHandle.selectText.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.selectText.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

## async method: ElementHandle.setChecked
* discouraged: Use locator-based **Locator.setChecked()** instead. Read more about [locators](../locators.md).
> *Added in: v1.15*

This method checks or unchecks an element by performing the following steps:
1. Ensure that element is a checkbox or a radio input. If not, this method throws.
1. If the element already has the right checked state, this method returns immediately.
1. Wait for [actionability](../actionability.md) checks on the matched element, unless **force** option is
   set. If the element is detached during the checks, the whole action is retried.
1. Scroll the element into view if needed.
1. Use **Page.mouse** to click in the center of the element.
1. Ensure that the element is now checked or unchecked. If not, this method throws.

When all steps combined have not finished during the specified **timeout**, this method throws a
`TimeoutError`. Passing zero timeout disables this.

### param: ElementHandle.setChecked.checked = %%-input-checked-%%
> *Added in: v1.15*

### option: ElementHandle.setChecked.force = %%-input-force-%%
> *Added in: v1.15*

### option: ElementHandle.setChecked.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.15*

### option: ElementHandle.setChecked.position = %%-input-position-%%
> *Added in: v1.15*

### option: ElementHandle.setChecked.timeout = %%-input-timeout-%%
> *Added in: v1.15*

### option: ElementHandle.setChecked.timeout = %%-input-timeout-js-%%
> *Added in: v1.15*

### option: ElementHandle.setChecked.trial = %%-input-trial-%%
> *Added in: v1.15*

## async method: ElementHandle.setInputFiles
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.setInputFiles()** instead. Read more about [locators](../locators.md).

Sets the value of the file input to these file paths or files. If some of the `filePaths` are relative paths, then they
are resolved relative to the current working directory. For empty array, clears the selected files.
For inputs with a `[webkitdirectory]` attribute, only a single directory path is supported.

This method expects `ElementHandle` to point to an
[input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input). However, if the element is inside the `<label>` element that has an associated [control](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/control), targets the control instead.

### param: ElementHandle.setInputFiles.files = %%-input-files-%%
> *Added in: v1.8*

### option: ElementHandle.setInputFiles.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.setInputFiles.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.setInputFiles.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

## async method: ElementHandle.tap
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.tap()** instead. Read more about [locators](../locators.md).

This method taps the element by performing the following steps:
1. Wait for [actionability](../actionability.md) checks on the element, unless **force** option is set.
1. Scroll the element into view if needed.
1. Use **Page.touchscreen** to tap the center of the element, or the specified **position**.

If the element is detached from the DOM at any moment during the action, this method throws.

When all steps combined have not finished during the specified **timeout**, this method throws a
`TimeoutError`. Passing zero timeout disables this.

:::note
`elementHandle.tap()` requires that the `hasTouch` option of the browser context be set to true.
:::

### option: ElementHandle.tap.position = %%-input-position-%%
> *Added in: v1.8*

### option: ElementHandle.tap.modifiers = %%-input-modifiers-%%
> *Added in: v1.8*

### option: ElementHandle.tap.force = %%-input-force-%%
> *Added in: v1.8*

### option: ElementHandle.tap.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.tap.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.tap.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.tap.trial = %%-input-trial-%%
> *Added in: v1.11*

## async method: ElementHandle.textContent
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.textContent()** instead. Read more about [locators](../locators.md).
**Returns:** `null|string`

Returns the `node.textContent`.

## async method: ElementHandle.type
> *Added in: v1.8*
>
> ⚠️ **Deprecated.** In most cases, you should use **Locator.fill()** instead. You only need to press keys one by one if there is special keyboard handling on the page - in this case use **Locator.pressSequentially()**.

Focuses the element, and then sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.

To press a special key, like `Control` or `ArrowDown`, use **ElementHandle.press()**.

**Usage**

### param: ElementHandle.type.text
> *Added in: v1.8*
- `text` <`string`>

A text to type into a focused element.

### option: ElementHandle.type.delay
> *Added in: v1.8*
- `delay` <`float`>

Time to wait between key presses in milliseconds. Defaults to 0.

### option: ElementHandle.type.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.type.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.type.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

## async method: ElementHandle.uncheck
> *Added in: v1.8*
* discouraged: Use locator-based **Locator.uncheck()** instead. Read more about [locators](../locators.md).

This method checks the element by performing the following steps:
1. Ensure that element is a checkbox or a radio input. If not, this method throws. If the element is already
   unchecked, this method returns immediately.
1. Wait for [actionability](../actionability.md) checks on the element, unless **force** option is set.
1. Scroll the element into view if needed.
1. Use **Page.mouse** to click in the center of the element.
1. Ensure that the element is now unchecked. If not, this method throws.

If the element is detached from the DOM at any moment during the action, this method throws.

When all steps combined have not finished during the specified **timeout**, this method throws a
`TimeoutError`. Passing zero timeout disables this.

### option: ElementHandle.uncheck.position = %%-input-position-%%
> *Added in: v1.11*

### option: ElementHandle.uncheck.force = %%-input-force-%%
> *Added in: v1.8*

### option: ElementHandle.uncheck.noWaitAfter = %%-input-no-wait-after-removed-%%
> *Added in: v1.8*

### option: ElementHandle.uncheck.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.uncheck.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.uncheck.trial = %%-input-trial-%%
> *Added in: v1.11*

## async method: ElementHandle.waitForElementState
> *Added in: v1.8*

Returns when the element satisfies the **state**.

Depending on the **state** parameter, this method waits for one of the [actionability](../actionability.md) checks
to pass. This method throws when the element is detached while waiting, unless waiting for the `"hidden"` state.
* `"visible"` Wait until the element is [visible](../actionability.md#visible).
* `"hidden"` Wait until the element is [not visible](../actionability.md#visible) or
  not attached. Note that waiting for hidden does not throw when the element detaches.
* `"stable"` Wait until the element is both [visible](../actionability.md#visible) and
  [stable](../actionability.md#stable).
* `"enabled"` Wait until the element is [enabled](../actionability.md#enabled).
* `"disabled"` Wait until the element is [not enabled](../actionability.md#enabled).
* `"editable"` Wait until the element is [editable](../actionability.md#editable).

If the element does not satisfy the condition for the **timeout** milliseconds, this method will throw.

### param: ElementHandle.waitForElementState.state
> *Added in: v1.8*
- `state` <`ElementState`<"visible"|"hidden"|"stable"|"enabled"|"disabled"|"editable">>

A state to wait for, see below for more details.

### option: ElementHandle.waitForElementState.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.waitForElementState.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

## async method: ElementHandle.waitForSelector
> *Added in: v1.8*
* discouraged: Use web assertions that assert visibility or a locator-based **Locator.waitFor()** instead.
**Returns:** `null|ElementHandle`

Returns element specified by selector when it satisfies **state** option. Returns `null` if waiting for `hidden`
or `detached`.

Wait for the **selector** relative to the element handle to satisfy **state** option (either
appear/disappear from dom, or become visible/hidden). If at the moment of calling the method **selector** already
satisfies the condition, the method will return immediately. If the selector doesn't satisfy the condition for the
**timeout** milliseconds, the function will throw.

**Usage**

```js
await page.setContent(`<div><span></span></div>`);
const div = await page.$('div');
// Waiting for the 'span' selector relative to the div.
const span = await div.waitForSelector('span', { state: 'attached' });
```

```java
page.setContent("<div><span></span></div>");
ElementHandle div = page.querySelector("div");
// Waiting for the "span" selector relative to the div.
ElementHandle span = div.waitForSelector("span", new ElementHandle.WaitForSelectorOptions()
  .setState(WaitForSelectorState.ATTACHED));
```

```python async
await page.set_content("<div><span></span></div>")
div = await page.query_selector("div")
# waiting for the "span" selector relative to the div.
span = await div.wait_for_selector("span", state="attached")
```

```python sync
page.set_content("<div><span></span></div>")
div = page.query_selector("div")
# waiting for the "span" selector relative to the div.
span = div.wait_for_selector("span", state="attached")
```

```csharp
await page.SetContentAsync("<div><span></span></div>");
var div = await page.QuerySelectorAsync("div");
// Waiting for the "span" selector relative to the div.
var span = await page.WaitForSelectorAsync("span", WaitForSelectorState.Attached);
```

:::note
This method does not work across navigations, use **Page.waitForSelector()** instead.
:::

### param: ElementHandle.waitForSelector.selector = %%-query-selector-%%
> *Added in: v1.8*

### option: ElementHandle.waitForSelector.state = %%-wait-for-selector-state-%%
> *Added in: v1.8*

### option: ElementHandle.waitForSelector.timeout = %%-input-timeout-%%
> *Added in: v1.8*

### option: ElementHandle.waitForSelector.timeout = %%-input-timeout-js-%%
> *Added in: v1.8*

### option: ElementHandle.waitForSelector.strict = %%-input-strict-%%
> *Added in: v1.15*
