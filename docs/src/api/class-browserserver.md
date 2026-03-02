---
id: class-browserserver
---

# class: BrowserServer
> *Added in: v1.8*
>
> **Languages:** JavaScript

## event: BrowserServer.close
> *Added in: v1.8*

Emitted when the browser server closes.

## async method: BrowserServer.close
> *Added in: v1.8*

Closes the browser gracefully and makes sure the process is terminated.

## async method: BrowserServer.kill
> *Added in: v1.8*

Kills the browser process and waits for the process to exit.

## method: BrowserServer.process
> *Added in: v1.8*
**Returns:** `ChildProcess`

Spawned browser application process.

## method: BrowserServer.wsEndpoint
> *Added in: v1.8*
**Returns:** `string`

Browser websocket url.

Browser websocket endpoint which can be used as an argument to **BrowserType.connect()** to establish connection
to the browser.

Note that if the listen `host` option in `launchServer` options is not specified, localhost will be output anyway, even if the actual listening address is an unspecified address.
