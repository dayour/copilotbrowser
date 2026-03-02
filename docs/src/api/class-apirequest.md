---
id: class-apirequest
---

# class: APIRequest
> *Added in: v1.16*

Exposes API that can be used for the Web API testing. This class is used for creating
`APIRequestContext` instance which in turn can be used for sending web requests. An instance
of this class can be obtained via **copilotbrowser.request**. For more information
see `APIRequestContext`.

## async method: APIRequest.newContext
> *Added in: v1.16*
**Returns:** `APIRequestContext`

Creates new instances of `APIRequestContext`.

### option: APIRequest.newContext.clientCertificates = %%-context-option-clientCertificates-%%
* since: 1.46

### option: APIRequest.newContext.useragent = %%-context-option-useragent-%%
> *Added in: v1.16*

### option: APIRequest.newContext.extraHTTPHeaders = %%-context-option-extrahttpheaders-%%
> *Added in: v1.16*

### option: APIRequest.newContext.failOnStatusCode
> *Added in: v1.51*
- `failOnStatusCode` <`boolean`>

Whether to throw on response codes other than 2xx and 3xx. By default response object is returned
for all status codes.

### option: APIRequest.newContext.httpCredentials = %%-context-option-httpcredentials-%%
> *Added in: v1.16*

### option: APIRequest.newContext.proxy = %%-browser-option-proxy-%%
> *Added in: v1.16*

### option: APIRequest.newContext.ignoreHTTPSErrors = %%-context-option-ignorehttpserrors-%%
> *Added in: v1.16*

### option: APIRequest.newContext.maxRedirects
> *Added in: v1.52*
- `maxRedirects` <`int`>

Maximum number of request redirects that will be followed automatically. An error will be thrown if the number is exceeded.
Defaults to `20`. Pass `0` to not follow redirects. This can be overwritten for each request individually.

### option: APIRequest.newContext.timeout
> *Added in: v1.16*
- `timeout` <`float`>

Maximum time in milliseconds to wait for the response. Defaults to
`30000` (30 seconds). Pass `0` to disable timeout.

### option: APIRequest.newContext.baseURL
> *Added in: v1.16*
- `baseURL` <`string`>

Methods like **APIRequestContext.get()** take the base URL into consideration by using the [`URL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) constructor for building the corresponding URL. Examples:
* baseURL: `http://localhost:3000` and sending request to `/bar.html` results in `http://localhost:3000/bar.html`
* baseURL: `http://localhost:3000/foo/` and sending request to `./bar.html` results in `http://localhost:3000/foo/bar.html`
* baseURL: `http://localhost:3000/foo` (without trailing slash) and navigating to `./bar.html` results in `http://localhost:3000/bar.html`

### option: APIRequest.newContext.storageState
> *Added in: v1.16*
>
> **Languages:** JavaScript, Python
- `storageState` <`path`|`Object`>
  - `cookies` <`Array`<`Object`>>
    - `name` <`string`>
    - `value` <`string`>
    - `domain` <`string`>
    - `path` <`string`>
    - `expires` <`float`> Unix time in seconds.
    - `httpOnly` <`boolean`>
    - `secure` <`boolean`>
    - `sameSite` <`SameSiteAttribute`<"Strict"|"Lax"|"None">>
  - `origins` <`Array`<`Object`>>
    - `origin` <`string`>
    - `localStorage` <`Array`<`Object`>>
      - `name` <`string`>
      - `value` <`string`>

Populates context with given storage state. This option can be used to initialize context with logged-in information
obtained via **BrowserContext.storageState()** or **APIRequestContext.storageState()**. Either a path to the
file with saved storage, or the value returned by one of **BrowserContext.storageState()** or
**APIRequestContext.storageState()** methods.

### option: APIRequest.newContext.storageState
> *Added in: v1.16*
>
> **Languages:** Java, C#
- `storageState` <`string`>

Populates context with given storage state. This option can be used to initialize context with logged-in information
obtained via **BrowserContext.storageState()** or **APIRequestContext.storageState()**. Either a path to the
file with saved storage, or the value returned by one of **BrowserContext.storageState()** or
**APIRequestContext.storageState()** methods.

### option: APIRequest.newContext.storageStatePath = %%-csharp-java-context-option-storage-state-path-%%
> *Added in: v1.18*
