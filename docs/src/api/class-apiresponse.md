---
id: class-apiresponse
---

# class: APIResponse
> *Added in: v1.16*

`APIResponse` class represents responses returned by **APIRequestContext.get()** and similar methods.

```python async
import asyncio
from copilotbrowser.async_api import async_copilotbrowser, copilotbrowser

async def run(copilotbrowser: copilotbrowser):
    context = await copilotbrowser.request.new_context()
    response = await context.get("https://example.com/user/repos")
    assert response.ok
    assert response.status == 200
    assert response.headers["content-type"] == "application/json; charset=utf-8"
    json_data = await response.json()
    assert json_data["name"] == "foobar"
    assert await response.body() == '{"status": "ok"}'


async def main():
    async with async_copilotbrowser() as copilotbrowser:
        await run(copilotbrowser)

asyncio.run(main())
```

```python sync
from copilotbrowser.sync_api import sync_copilotbrowser

with sync_copilotbrowser() as p:
    context = copilotbrowser.request.new_context()
    response = context.get("https://example.com/user/repos")
    assert response.ok
    assert response.status == 200
    assert response.headers["content-type"] == "application/json; charset=utf-8"
    assert response.json()["name"] == "foobar"
    assert response.body() == '{"status": "ok"}'
```

## async method: APIResponse.body
> *Added in: v1.16*
**Returns:** `Buffer`

Returns the buffer with response body.

## async method: APIResponse.dispose
> *Added in: v1.16*

Disposes the body of this response. If not called then the body will stay in memory until the context closes.

## method: APIResponse.headers
> *Added in: v1.16*
**Returns:** `Object<string, string>`

An object with all the response HTTP headers associated with this response.

## method: APIResponse.headersArray
> *Added in: v1.16*
**Returns:** `Array<Object>`
  - `name` <`string`> Name of the header.
  - `value` <`string`> Value of the header.

An array with all the response HTTP headers associated with this response. Header names are not lower-cased.
Headers with multiple entries, such as `Set-Cookie`, appear in the array multiple times.

## async method: APIResponse.json
> *Added in: v1.16*
>
> **Languages:** JavaScript, Python
**Returns:** `Serializable`

Returns the JSON representation of response body.

This method will throw if the response body is not parsable via `JSON.parse`.

## async method: APIResponse.json
> *Added in: v1.16*
>
> **Languages:** C#
**Returns:** `null|JsonElement`

Returns the JSON representation of response body.

This method will throw if the response body is not parsable via `JSON.parse`.

## method: APIResponse.ok
> *Added in: v1.16*
**Returns:** `boolean`

Contains a boolean stating whether the response was successful (status in the range 200-299) or not.

## method: APIResponse.status
> *Added in: v1.16*
**Returns:** `int`

Contains the status code of the response (e.g., 200 for a success).

## method: APIResponse.statusText
> *Added in: v1.16*
**Returns:** `string`

Contains the status text of the response (e.g. usually an "OK" for a success).

## async method: APIResponse.text
> *Added in: v1.16*
**Returns:** `string`

Returns the text representation of response body.

## method: APIResponse.url
> *Added in: v1.16*
**Returns:** `string`

Contains the URL of the response.
