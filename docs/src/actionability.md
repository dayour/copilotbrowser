---
id: actionability
title: "Auto-waiting"
---

## Introduction

copilotbrowser performs a range of actionability checks on the elements before making actions to ensure these actions
behave as expected. It auto-waits for all the relevant checks to pass and only then performs the requested action. If the required checks do not pass within the given `timeout`, action fails with the `TimeoutError`.

For example, for **Locator.click()**, copilotbrowser will ensure that:
- locator resolves to exactly one element
- element is `Visible`
- element is `Stable`, as in not animating or completed animation
- element [Receives Events], as in not obscured by other elements
- element is `Enabled`

Here is the complete list of actionability checks performed for each action:

| Action | `Visible` | `Stable` | [Receives Events] | `Enabled` | `Editable` |
| :- | :-: | :-: | :-: | :-: | :-: |
| **Locator.check()** | Yes | Yes | Yes | Yes | - |
| **Locator.click()** | Yes | Yes | Yes | Yes | - |
| **Locator.dblclick()** | Yes | Yes | Yes | Yes | - |
| **Locator.setChecked()** | Yes | Yes | Yes | Yes | - |
| **Locator.tap()** | Yes | Yes | Yes | Yes | - |
| **Locator.uncheck()** | Yes | Yes | Yes | Yes | - |
| **Locator.hover()** | Yes | Yes | Yes | - | - |
| **Locator.dragTo()** | Yes | Yes | Yes | - | - |
| **Locator.screenshot()** | Yes | Yes | - | - | - |
| **Locator.fill()** | Yes | - | - | Yes | Yes |
| **Locator.clear()** | Yes | - | - | Yes | Yes |
| **Locator.selectOption()** | Yes | - | - | Yes | - |
| **Locator.selectText()** | Yes | - | - | - | - |
| **Locator.scrollIntoViewIfNeeded()** | - | Yes | - | - | - |
| **Locator.blur()** | - | - | - | - | - |
| **Locator.dispatchEvent()** | - | - | - | - | - |
| **Locator.focus()** | - | - | - | - | - |
| **Locator.press()** | - | - | - | - | - |
| **Locator.pressSequentially()** | - | - | - | - | - |
| **Locator.setInputFiles()** | - | - | - | - | - |

## Forcing actions

Some actions like **Locator.click()** support `force` option that disables non-essential actionability checks,
for example passing truthy `force` to **Locator.click()** method will not check that the target element actually
receives click events.

## Assertions

copilotbrowser includes auto-retrying assertions that remove flakiness by waiting until the condition is met, similarly to auto-waiting before actions.

| Assertion | Description |
| :- | :- |
| **LocatorAssertions.toBeAttached()** | Element is attached |
| **LocatorAssertions.toBeChecked()** | Checkbox is checked |
| **LocatorAssertions.toBeDisabled()** | Element is disabled |
| **LocatorAssertions.toBeEditable()** | Element is editable |
| **LocatorAssertions.toBeEmpty()** | Container is empty |
| **LocatorAssertions.toBeEnabled()** | Element is enabled |
| **LocatorAssertions.toBeFocused()** | Element is focused |
| **LocatorAssertions.toBeHidden()** | Element is not visible |
| **LocatorAssertions.toBeInViewport()** | Element intersects viewport |
| **LocatorAssertions.toBeVisible()** | Element is visible |
| **LocatorAssertions.toContainText()** | Element contains text |
| **LocatorAssertions.toHaveAttribute()** | Element has a DOM attribute |
| **LocatorAssertions.toHaveClass()** | Element has a class property |
| **LocatorAssertions.toHaveCount()** | List has exact number of children |
| **LocatorAssertions.toHaveCSS()** | Element has CSS property |
| **LocatorAssertions.toHaveId()** | Element has an ID |
| **LocatorAssertions.toHaveJSProperty()** | Element has a JavaScript property |
| **LocatorAssertions.toHaveText()** | Element matches text |
| **LocatorAssertions.toHaveValue()** | Input has a value |
| **LocatorAssertions.toHaveValues()** | Select has options selected |
| **PageAssertions.toHaveTitle()** | Page has a title |
| **PageAssertions.toHaveURL()** | Page has a URL |
| **APIResponseAssertions.toBeOK()** | Response has an OK status |

Learn more in the [assertions guide](./test-assertions.md).

## Visible

Element is considered visible when it has non-empty bounding box and does not have `visibility:hidden` computed style.

Note that according to this definition:
* Elements of zero size **are not** considered visible.
* Elements with `display:none` **are not** considered visible.
* Elements with `opacity:0` **are** considered visible.

## Stable

Element is considered stable when it has maintained the same bounding box for at least two consecutive animation frames.

## Enabled

Element is considered enabled when it is **not disabled**.

Element is **disabled** when:
- it is a `<button>`, `<select>`, `<input>`, `<textarea>`, `<option>` or `<optgroup>` with a `[disabled]` attribute;
- it is a `<button>`, `<select>`, `<input>`, `<textarea>`, `<option>` or `<optgroup>` that is a part of a `<fieldset>` with a `[disabled]` attribute;
- it is a descendant of an element with `[aria-disabled=true]` attribute.

## Editable

Element is considered editable when it is `enabled` and is **not readonly**.

Element is **readonly** when:
- it is a `<select>`, `<input>` or `<textarea>` with a `[readonly]` attribute;
- it has an `[aria-readonly=true]` attribute and an aria role that [supports it](https://w3c.github.io/aria/#aria-readonly).

## Receives Events

Element is considered receiving pointer events when it is the hit target of the pointer event at the action point. For example, when clicking at the point `(10;10)`, copilotbrowser checks whether some other element (usually an overlay) will instead capture the click at `(10;10)`.


For example, consider a scenario where copilotbrowser will click `Sign Up` button regardless of when the **Locator.click()** call was made:
- page is checking that user name is unique and `Sign Up` button is disabled;
- after checking with the server, the disabled `Sign Up` button is replaced with another one that is now enabled.

`Visible`: #visible "Visible"
`Stable`: #stable "Stable"
`Enabled`: #enabled "Enabled"
`Editable`: #editable "Editable"
[Receives Events]: #receives-events "Receives Events"
