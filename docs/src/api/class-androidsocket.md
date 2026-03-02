---
id: class-androidsocket
---

# class: AndroidSocket
> *Added in: v1.9*
>
> **Languages:** JavaScript

`AndroidSocket` is a way to communicate with a process launched on the `AndroidDevice`. Use **AndroidDevice.open()** to open a socket.

## event: AndroidSocket.close
> *Added in: v1.9*

Emitted when the socket is closed.

## event: AndroidSocket.data
> *Added in: v1.9*
- argument: <`Buffer`>

Emitted when data is available to read from the socket.

## async method: AndroidSocket.close
> *Added in: v1.9*

Closes the socket.

## async method: AndroidSocket.write
> *Added in: v1.9*

Writes some **data** to the socket.

### param: AndroidSocket.write.data
> *Added in: v1.9*
- `data` <`Buffer`>

Data to write.
