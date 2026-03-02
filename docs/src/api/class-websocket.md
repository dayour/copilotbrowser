---
id: class-websocket
---

# class: WebSocket
> *Added in: v1.8*

The `WebSocket` class represents WebSocket connections within a page. It provides the ability to inspect and manipulate the data being transmitted and received.

If you want to intercept or modify WebSocket frames, consider using `WebSocketRoute`.

## event: WebSocket.close
> *Added in: v1.8*
- argument: <`WebSocket`>

Fired when the websocket closes.

## event: WebSocket.frameReceived
> *Added in: v1.9*
- argument: <`Object`>
  - `payload` <`string`|`Buffer`> frame payload

Fired when the websocket receives a frame.

## event: WebSocket.frameReceived
> *Added in: v1.9*
>
> **Languages:** Python
- argument: <`string`|`Buffer`> frame payload

## event: WebSocket.frameReceived
> *Added in: v1.9*
>
> **Languages:** C#, Java
- argument: <`WebSocketFrame`>

## event: WebSocket.frameSent
> *Added in: v1.9*
- argument: <`Object`>
  - `payload` <`string`|`Buffer`> frame payload

Fired when the websocket sends a frame.

## event: WebSocket.frameSent
> *Added in: v1.9*
>
> **Languages:** Python
- argument: <`string`|`Buffer`> frame payload

## event: WebSocket.frameSent
> *Added in: v1.9*
>
> **Languages:** C#, Java
- argument: <`WebSocketFrame`>

## event: WebSocket.socketError
> *Added in: v1.9*
- argument: <`string`>

Fired when the websocket has an error.

## method: WebSocket.isClosed
> *Added in: v1.8*
**Returns:** `boolean`

Indicates that the web socket has been closed.

## method: WebSocket.url
> *Added in: v1.8*
**Returns:** `string`

Contains the URL of the WebSocket.

## async method: WebSocket.waitForEvent
> *Added in: v1.8*
>
> **Languages:** JavaScript, Python
**Returns:** `any`

Waits for event to fire and passes its value into the predicate function. Returns when the predicate returns truthy
value. Will throw an error if the webSocket is closed before the event is fired. Returns the event data value.

## async method: WebSocket.waitForEvent
> *Added in: v1.8*
>
> **Languages:** Python
**Returns:** `EventContextManager`

### param: WebSocket.waitForEvent.event
> *Added in: v1.8*
- `event` <`string`>

Event name, same one would pass into `webSocket.on(event)`.

### param: WebSocket.waitForEvent.optionsOrPredicate
> *Added in: v1.8*
>
> **Languages:** JavaScript
- `optionsOrPredicate` ?<`function`|`Object`>
  - `predicate` <`function`> Receives the event data and resolves to truthy value when the waiting should resolve.
  - `timeout` ?<`float`> Maximum time to wait for in milliseconds. Defaults to `0` - no timeout. The default value can be changed via `actionTimeout` option in the config, or by using the **BrowserContext.setDefaultTimeout()** or **Page.setDefaultTimeout()** methods.

Either a predicate that receives an event or an options object. Optional.

### option: WebSocket.waitForEvent.predicate = %%-wait-for-event-predicate-%%
> *Added in: v1.8*

### option: WebSocket.waitForEvent.timeout = %%-wait-for-event-timeout-%%
> *Added in: v1.8*

## async method: WebSocket.waitForFrameReceived
> *Added in: v1.10*
>
> **Languages:** Java
**Returns:** `WebSocketFrame`

Performs action and waits for a frame to be sent. If predicate is provided, it passes
`WebSocketFrame` value into the `predicate` function and waits for `predicate(webSocketFrame)` to return a truthy value.
Will throw an error if the WebSocket or Page is closed before the frame is received.

### option: WebSocket.waitForFrameReceived.predicate
> *Added in: v1.9*
- `predicate` <`function`\(`WebSocketFrame`\):`boolean`>

Receives the `WebSocketFrame` object and resolves to truthy value when the waiting should resolve.

### option: WebSocket.waitForFrameReceived.timeout = %%-wait-for-event-timeout-%%
> *Added in: v1.9*

### param: WebSocket.waitForFrameReceived.callback = %%-java-wait-for-event-callback-%%
> *Added in: v1.9*

## async method: WebSocket.waitForFrameSent
> *Added in: v1.10*
>
> **Languages:** Java
**Returns:** `WebSocketFrame`

Performs action and waits for a frame to be sent. If predicate is provided, it passes
`WebSocketFrame` value into the `predicate` function and waits for `predicate(webSocketFrame)` to return a truthy value.
Will throw an error if the WebSocket or Page is closed before the frame is sent.

### option: WebSocket.waitForFrameSent.predicate
> *Added in: v1.9*
- `predicate` <`function`\(`WebSocketFrame`\):`boolean`>

Receives the `WebSocketFrame` object and resolves to truthy value when the waiting should resolve.

### option: WebSocket.waitForFrameSent.timeout = %%-wait-for-event-timeout-%%
> *Added in: v1.9*

### param: WebSocket.waitForFrameSent.callback = %%-java-wait-for-event-callback-%%
> *Added in: v1.9*

## async method: WebSocket.waitForEvent2
> *Added in: v1.8*
>
> **Languages:** Python
**Returns:** `any`

:::note
In most cases, you should use **WebSocket.waitForEvent()**.
:::

Waits for given `event` to fire. If predicate is provided, it passes
event's value into the `predicate` function and waits for `predicate(event)` to return a truthy value.
Will throw an error if the socket is closed before the `event` is fired.

### param: WebSocket.waitForEvent2.event = %%-wait-for-event-event-%%
> *Added in: v1.8*

### option: WebSocket.waitForEvent2.predicate = %%-wait-for-event-predicate-%%
> *Added in: v1.8*

### option: WebSocket.waitForEvent2.timeout = %%-wait-for-event-timeout-%%
> *Added in: v1.8*
