---
id: class-androidwebview
---

# class: AndroidWebView
> *Added in: v1.9*
>
> **Languages:** JavaScript

`AndroidWebView` represents a WebView open on the `AndroidDevice`. WebView is usually obtained using **AndroidDevice.webView()**.

## event: AndroidWebView.close
> *Added in: v1.9*

Emitted when the WebView is closed.

## async method: AndroidWebView.page
> *Added in: v1.9*
**Returns:** `Page`

Connects to the WebView and returns a regular copilotbrowser `Page` to interact with.

## method: AndroidWebView.pid
> *Added in: v1.9*
**Returns:** `int`

WebView process PID.

## method: AndroidWebView.pkg
> *Added in: v1.9*
**Returns:** `string`

WebView package identifier.
