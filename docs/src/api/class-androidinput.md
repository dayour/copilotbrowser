---
id: class-androidinput
---

# class: AndroidInput
> *Added in: v1.9*
>
> **Languages:** JavaScript

## async method: AndroidInput.drag
> *Added in: v1.9*

Performs a drag between **from** and **to** points.

### param: AndroidInput.drag.from
> *Added in: v1.9*
- `from` <`Object`>
  - `x` <`float`>
  - `y` <`float`>

The start point of the drag.

### param: AndroidInput.drag.to
> *Added in: v1.9*
- `to` <`Object`>
  - `x` <`float`>
  - `y` <`float`>

The end point of the drag.

### param: AndroidInput.drag.steps
> *Added in: v1.9*
- `steps` <`int`>

The number of steps in the drag. Each step takes 5 milliseconds to complete.

## async method: AndroidInput.press
> *Added in: v1.9*

Presses the **key**.

### param: AndroidInput.press.key
> *Added in: v1.9*
- `key` <`AndroidKey`>

Key to press.

## async method: AndroidInput.swipe
> *Added in: v1.9*

Swipes following the path defined by **segments**.

### param: AndroidInput.swipe.from
> *Added in: v1.9*
- `from` <`Object`>
  - `x` <`float`>
  - `y` <`float`>

The point to start swiping from.

### param: AndroidInput.swipe.segments
> *Added in: v1.9*
- `segments` <`Array`<`Object`>>
  - `x` <`float`>
  - `y` <`float`>

Points following the **from** point in the swipe gesture.

### param: AndroidInput.swipe.steps
> *Added in: v1.9*
- `steps` <`int`>

The number of steps for each segment. Each step takes 5 milliseconds to complete, so 100 steps means half a second per each segment.

## async method: AndroidInput.tap
> *Added in: v1.9*

Taps at the specified **point**.

### param: AndroidInput.tap.point
> *Added in: v1.9*
- `point` <`Object`>
  - `x` <`float`>
  - `y` <`float`>

The point to tap at.

## async method: AndroidInput.type
> *Added in: v1.9*

Types **text** into currently focused widget.

### param: AndroidInput.type.text
> *Added in: v1.9*
- `text` <`string`>

Text to type.
