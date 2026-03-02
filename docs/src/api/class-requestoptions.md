---
id: class-requestoptions
---

# class: RequestOptions
> *Added in: v1.18*
>
> **Languages:** Java

The `RequestOptions` allows to create form data to be sent via `APIRequestContext`. copilotbrowser will automatically
determine content type of the request.

```java
context.request().post(
  "https://example.com/submit",
  RequestOptions.create()
    .setQueryParam("page", 1)
    .setData("My data"));
```

**Uploading html form data**

`FormData` class can be used to send a form to the server, by default the request will use `application/x-www-form-urlencoded` encoding:

```java
context.request().post("https://example.com/signup", RequestOptions.create().setForm(
  FormData.create()
    .set("firstName", "John")
    .set("lastName", "Doe")));
```

You can also send files as fields of an html form. The data will be encoded using [`multipart/form-data`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST):

```java
Path path = Paths.get("members.csv");
APIResponse response = context.request().post("https://example.com/upload_members",
  RequestOptions.create().setMultipart(FormData.create().set("membersList", path)));
```

Alternatively, you can build the file payload manually:

```java
FilePayload filePayload = new FilePayload("members.csv", "text/csv",
  "Alice, 33\nJohn, 35\n".getBytes(StandardCharsets.UTF_8));
APIResponse response = context.request().post("https://example.com/upload_members",
  RequestOptions.create().setMultipart(FormData.create().set("membersList", filePayload)));
```

## method: RequestOptions.create
> *Added in: v1.18*
**Returns:** `RequestOptions`

Creates new instance of `RequestOptions`.

## method: RequestOptions.setData
> *Added in: v1.18*
**Returns:** `RequestOptions`

Sets the request's post data.

### param: RequestOptions.setData.data
> *Added in: v1.18*
- `data` <`string`|`Buffer`|`Serializable`>

Allows to set post data of the request. If the data parameter is an object, it will be serialized to json string
and `content-type` header will be set to `application/json` if not explicitly set. Otherwise the `content-type` header will be
set to `application/octet-stream` if not explicitly set.

## method: RequestOptions.setFailOnStatusCode
> *Added in: v1.18*
**Returns:** `RequestOptions`

### param: RequestOptions.setFailOnStatusCode.failOnStatusCode
> *Added in: v1.18*
- `failOnStatusCode` <`boolean`>

Whether to throw on response codes other than 2xx and 3xx. By default response object is returned
for all status codes.

## method: RequestOptions.setForm
> *Added in: v1.18*
**Returns:** `RequestOptions`

Provides `FormData` object that will be serialized as html form using `application/x-www-form-urlencoded` encoding and sent as
this request body. If this parameter is specified `content-type` header will be set to `application/x-www-form-urlencoded`
unless explicitly provided.

### param: RequestOptions.setForm.form
> *Added in: v1.18*
- `form` <`FormData`>

Form data to be serialized as html form using `application/x-www-form-urlencoded` encoding and sent as
this request body.

## method: RequestOptions.setHeader
> *Added in: v1.18*
**Returns:** `RequestOptions`

Sets an HTTP header to the request. This header will apply to the fetched request as well as any redirects initiated by it.

### param: RequestOptions.setHeader.name
> *Added in: v1.18*
- `name` <`string`>

Header name.

### param: RequestOptions.setHeader.value
> *Added in: v1.18*
- `value` <`string`>

Header value.

## method: RequestOptions.setIgnoreHTTPSErrors
> *Added in: v1.18*
**Returns:** `RequestOptions`

### param: RequestOptions.setIgnoreHTTPSErrors.ignoreHTTPSErrors
> *Added in: v1.18*
- `ignoreHTTPSErrors` <`boolean`>

Whether to ignore HTTPS errors when sending network requests.

## method: RequestOptions.setMaxRedirects
> *Added in: v1.26*
**Returns:** `RequestOptions`

### param: RequestOptions.setMaxRedirects.maxRedirects
> *Added in: v1.26*
- `maxRedirects` <`int`>

Maximum number of request redirects that will be followed automatically. An error will be thrown if the number is exceeded.
Defaults to `20`. Pass `0` to not follow redirects.

## method: RequestOptions.setMaxRetries
> *Added in: v1.46*
**Returns:** `RequestOptions`

### param: RequestOptions.setMaxRetries.maxRetries
> *Added in: v1.46*
- `maxRetries` <`int`>

Maximum number of times network errors should be retried. Currently only `ECONNRESET` error is retried. Does not retry based on HTTP response codes. An error will be thrown if the limit is exceeded. Defaults to `0` - no retries.

## method: RequestOptions.setMethod
> *Added in: v1.18*
**Returns:** `RequestOptions`

Changes the request method (e.g. [PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT) or
[POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)).

### param: RequestOptions.setMethod.method
> *Added in: v1.18*
- `method` <`string`>

Request method, e.g. [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST).

## method: RequestOptions.setMultipart
> *Added in: v1.18*
**Returns:** `RequestOptions`

Provides `FormData` object that will be serialized as html form using `multipart/form-data` encoding and sent as
this request body. If this parameter is specified `content-type` header will be set to `multipart/form-data`
unless explicitly provided.

### param: RequestOptions.setMultipart.form
> *Added in: v1.18*
- `form` <`FormData`>

Form data to be serialized as html form using `multipart/form-data` encoding and sent as
this request body.

## method: RequestOptions.setQueryParam
> *Added in: v1.18*
**Returns:** `RequestOptions`

Adds a query parameter to the request URL.

### param: RequestOptions.setQueryParam.name
> *Added in: v1.18*
- `name` <`string`>

Parameter name.

### param: RequestOptions.setQueryParam.value
> *Added in: v1.18*
- `value` <`string`|`boolean`|`int`>

Parameter value.

## method: RequestOptions.setTimeout
> *Added in: v1.18*
**Returns:** `RequestOptions`

Sets request timeout in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout.

### param: RequestOptions.setTimeout.timeout
> *Added in: v1.18*
- `timeout` <`float`>

Request timeout in milliseconds.
