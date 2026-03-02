---
id: class-websocketframe
---

# class: WebSocketFrame
> *Added in: v1.9*
>
> **Languages:** C#, Java

The `WebSocketFrame` class represents frames sent over `WebSocket` connections in the page. Frame payload is returned by either **WebSocketFrame.text()** or **WebSocketFrame.binary()** method depending on the its type.

## method: WebSocketFrame.binary
> *Added in: v1.9*
**Returns:** `null|Buffer`

Returns binary payload.

## method: WebSocketFrame.text
> *Added in: v1.9*
**Returns:** `null|string`

Returns text payload.
