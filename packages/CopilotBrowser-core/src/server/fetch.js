"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalAPIRequestContext = exports.BrowserContextAPIRequestContext = exports.APIRequestContext = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const stream_1 = require("stream");
const tls_1 = require("tls");
const zlib = __importStar(require("zlib"));
const utils_1 = require("../utils");
const crypto_1 = require("./utils/crypto");
const userAgent_1 = require("./utils/userAgent");
const browserContext_1 = require("./browserContext");
const cookieStore_1 = require("./cookieStore");
const formData_1 = require("./formData");
const instrumentation_1 = require("./instrumentation");
const progress_1 = require("./progress");
const socksClientCertificatesInterceptor_1 = require("./socksClientCertificatesInterceptor");
const happyEyeballs_1 = require("./utils/happyEyeballs");
const tracing_1 = require("./trace/recorder/tracing");
class APIRequestContext extends instrumentation_1.SdkObject {
    static Events = {
        Dispose: 'dispose',
        Request: 'request',
        RequestFinished: 'requestfinished',
    };
    fetchResponses = new Map();
    fetchLog = new Map();
    static allInstances = new Set();
    _closeReason;
    static findResponseBody(guid) {
        for (const request of APIRequestContext.allInstances) {
            const body = request.fetchResponses.get(guid);
            if (body)
                return body;
        }
        return undefined;
    }
    constructor(parent) {
        super(parent, 'request-context');
        APIRequestContext.allInstances.add(this);
    }
    _disposeImpl() {
        APIRequestContext.allInstances.delete(this);
        this.fetchResponses.clear();
        this.fetchLog.clear();
        this.emit(APIRequestContext.Events.Dispose);
    }
    disposeResponse(fetchUid) {
        this.fetchResponses.delete(fetchUid);
        this.fetchLog.delete(fetchUid);
    }
    _storeResponseBody(body) {
        const uid = (0, crypto_1.createGuid)();
        this.fetchResponses.set(uid, body);
        return uid;
    }
    async fetch(progress, params) {
        const defaults = this._defaultOptions();
        const headers = {
            'user-agent': defaults.userAgent,
            'accept': '*/*',
            'accept-encoding': 'gzip,deflate,br',
        };
        if (defaults.extraHTTPHeaders) {
            for (const { name, value } of defaults.extraHTTPHeaders)
                setHeader(headers, name, value);
        }
        if (params.headers) {
            for (const { name, value } of params.headers)
                setHeader(headers, name, value);
        }
        const requestUrl = new URL((0, utils_1.constructURLBasedOnBaseURL)(defaults.baseURL, params.url));
        if (params.encodedParams) {
            requestUrl.search = params.encodedParams;
        }
        else if (params.params) {
            for (const { name, value } of params.params)
                requestUrl.searchParams.append(name, value);
        }
        const credentials = this._getHttpCredentials(requestUrl);
        if (credentials?.send === 'always')
            setBasicAuthorizationHeader(headers, credentials);
        const method = params.method?.toUpperCase() || 'GET';
        const proxy = defaults.proxy;
        let agent;
        // We skip 'per-context' in order to not break existing users. 'per-context' was previously used to
        // workaround an upstream Chromium bug. Can be removed in the future.
        if (proxy?.server !== 'per-context')
            agent = (0, utils_1.createProxyAgent)(proxy, requestUrl);
        let maxRedirects = params.maxRedirects ?? (defaults.maxRedirects ?? 20);
        maxRedirects = maxRedirects === 0 ? -1 : maxRedirects;
        const options = {
            method,
            headers,
            agent,
            maxRedirects,
            ...(0, socksClientCertificatesInterceptor_1.getMatchingTLSOptionsForOrigin)(this._defaultOptions().clientCertificates, requestUrl.origin),
            __testHookLookup: params.__testHookLookup,
        };
        // rejectUnauthorized = undefined is treated as true in Node.js 12.
        if (params.ignoreHTTPSErrors || defaults.ignoreHTTPSErrors)
            options.rejectUnauthorized = false;
        const postData = serializePostData(params, headers);
        if (postData)
            setHeader(headers, 'content-length', String(postData.byteLength));
        const fetchResponse = await this._sendRequestWithRetries(progress, requestUrl, options, postData, params.maxRetries);
        const fetchUid = this._storeResponseBody(fetchResponse.body);
        this.fetchLog.set(fetchUid, progress.metadata.log);
        const failOnStatusCode = params.failOnStatusCode !== undefined ? params.failOnStatusCode : !!defaults.failOnStatusCode;
        if (failOnStatusCode && (fetchResponse.status < 200 || fetchResponse.status >= 400)) {
            let responseText = '';
            if (fetchResponse.body.byteLength) {
                let text = fetchResponse.body.toString('utf8');
                if (text.length > 1000)
                    text = text.substring(0, 997) + '...';
                responseText = `\nResponse text:\n${text}`;
            }
            throw new Error(`${fetchResponse.status} ${fetchResponse.statusText}${responseText}`);
        }
        return { ...fetchResponse, fetchUid };
    }
    _parseSetCookieHeader(responseUrl, setCookie) {
        if (!setCookie)
            return [];
        const url = new URL(responseUrl);
        // https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.4
        const defaultPath = '/' + url.pathname.substr(1).split('/').slice(0, -1).join('/');
        const cookies = [];
        for (const header of setCookie) {
            // Decode cookie value?
            const cookie = parseCookie(header);
            if (!cookie)
                continue;
            // https://datatracker.ietf.org/doc/html/rfc6265#section-5.2.3
            if (!cookie.domain)
                cookie.domain = url.hostname;
            else
                (0, utils_1.assert)(cookie.domain.startsWith('.') || !cookie.domain.includes('.'));
            if (!(0, cookieStore_1.domainMatches)(url.hostname, cookie.domain))
                continue;
            // https://datatracker.ietf.org/doc/html/rfc6265#section-5.2.4
            if (!cookie.path || !cookie.path.startsWith('/'))
                cookie.path = defaultPath;
            cookies.push(cookie);
        }
        return cookies;
    }
    async _updateRequestCookieHeader(progress, url, headers) {
        if (getHeader(headers, 'cookie') !== undefined)
            return;
        const contextCookies = await progress.race(this._cookies(url));
        // Browser context returns cookies with domain matching both .example.com and
        // example.com. Those without leading dot are only sent when domain is strictly
        // matching example.com, but not for sub.example.com.
        const cookies = contextCookies.filter(c => new cookieStore_1.Cookie(c).matches(url));
        if (cookies.length) {
            const valueArray = cookies.map(c => `${c.name}=${c.value}`);
            setHeader(headers, 'cookie', valueArray.join('; '));
        }
    }
    async _sendRequestWithRetries(progress, url, options, postData, maxRetries) {
        maxRetries ??= 0;
        let backoff = 250;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await this._sendRequest(progress, url, options, postData);
            }
            catch (e) {
                if ((0, progress_1.isAbortError)(e))
                    throw e;
                e = (0, socksClientCertificatesInterceptor_1.rewriteOpenSSLErrorIfNeeded)(e);
                if (maxRetries === 0)
                    throw e;
                if (i === maxRetries)
                    throw new Error(`Failed after ${i + 1} attempt(s): ${e}`);
                // Retry on connection reset only.
                if (e.code !== 'ECONNRESET')
                    throw e;
                progress.log(`  Received ECONNRESET, will retry after ${backoff}ms.`);
                await progress.wait(backoff);
                backoff *= 2;
            }
        }
        throw new Error('Unreachable');
    }
    async _sendRequest(progress, url, options, postData) {
        await this._updateRequestCookieHeader(progress, url, options.headers);
        const requestCookies = getHeader(options.headers, 'cookie')?.split(';').map(p => {
            const [name, value] = p.split('=').map(v => v.trim());
            return { name, value };
        }) || [];
        const requestEvent = {
            url,
            method: options.method,
            headers: options.headers,
            cookies: requestCookies,
            postData
        };
        this.emit(APIRequestContext.Events.Request, requestEvent);
        let destroyRequest;
        const resultPromise = new Promise((fulfill, reject) => {
            const requestConstructor = (url.protocol === 'https:' ? https_1.default : http_1.default).request;
            // If we have a proxy agent already, do not override it.
            const agent = options.agent || (url.protocol === 'https:' ? happyEyeballs_1.httpsHappyEyeballsAgent : happyEyeballs_1.httpHappyEyeballsAgent);
            const requestOptions = { ...options, agent };
            const startAt = (0, utils_1.monotonicTime)();
            let reusedSocketAt;
            let dnsLookupAt;
            let tcpConnectionAt;
            let tlsHandshakeAt;
            let requestFinishAt;
            let serverIPAddress;
            let serverPort;
            let securityDetails;
            const listeners = [];
            const request = requestConstructor(url, requestOptions, async (response) => {
                const responseAt = (0, utils_1.monotonicTime)();
                const notifyRequestFinished = (body) => {
                    const endAt = (0, utils_1.monotonicTime)();
                    // spec: http://www.softwareishard.com/blog/har-12-spec/#timings
                    const connectEnd = tlsHandshakeAt ?? tcpConnectionAt;
                    const timings = {
                        send: requestFinishAt - startAt,
                        wait: responseAt - requestFinishAt,
                        receive: endAt - responseAt,
                        dns: dnsLookupAt ? dnsLookupAt - startAt : -1,
                        connect: connectEnd ? connectEnd - startAt : -1, // "If [ssl] is defined then the time is also included in the connect field "
                        ssl: tlsHandshakeAt ? tlsHandshakeAt - tcpConnectionAt : -1,
                        blocked: reusedSocketAt ? reusedSocketAt - startAt : -1,
                    };
                    const requestFinishedEvent = {
                        requestEvent,
                        httpVersion: response.httpVersion,
                        statusCode: response.statusCode || 0,
                        statusMessage: response.statusMessage || '',
                        headers: response.headers,
                        rawHeaders: response.rawHeaders,
                        cookies,
                        body,
                        timings,
                        serverIPAddress,
                        serverPort,
                        securityDetails,
                    };
                    this.emit(APIRequestContext.Events.RequestFinished, requestFinishedEvent);
                };
                progress.log(`← ${response.statusCode} ${response.statusMessage}`);
                for (const [name, value] of Object.entries(response.headers))
                    progress.log(`  ${name}: ${value}`);
                const cookies = this._parseSetCookieHeader(response.url || url.toString(), response.headers['set-cookie']);
                if (cookies.length) {
                    try {
                        await this._addCookies(cookies);
                    }
                    catch (e) {
                        // Cookie value is limited by 4096 characters in the browsers. If setCookies failed,
                        // we try setting each cookie individually just in case only some of them are bad.
                        await Promise.all(cookies.map(c => this._addCookies([c]).catch(() => { })));
                    }
                }
                if (redirectStatus.includes(response.statusCode) && options.maxRedirects >= 0) {
                    if (options.maxRedirects === 0) {
                        reject(new Error('Max redirect count exceeded'));
                        request.destroy();
                        return;
                    }
                    const headers = { ...options.headers };
                    removeHeader(headers, `cookie`);
                    // HTTP-redirect fetch step 13 (https://fetch.spec.whatwg.org/#http-redirect-fetch)
                    const status = response.statusCode;
                    let method = options.method;
                    if ((status === 301 || status === 302) && method === 'POST' ||
                        status === 303 && !['GET', 'HEAD'].includes(method)) {
                        method = 'GET';
                        postData = undefined;
                        removeHeader(headers, `content-encoding`);
                        removeHeader(headers, `content-language`);
                        removeHeader(headers, `content-length`);
                        removeHeader(headers, `content-location`);
                        removeHeader(headers, `content-type`);
                    }
                    const redirectOptions = {
                        method,
                        headers,
                        agent: options.agent,
                        maxRedirects: options.maxRedirects - 1,
                        ...(0, socksClientCertificatesInterceptor_1.getMatchingTLSOptionsForOrigin)(this._defaultOptions().clientCertificates, url.origin),
                        __testHookLookup: options.__testHookLookup,
                    };
                    // rejectUnauthorized = undefined is treated as true in node 12.
                    if (options.rejectUnauthorized === false)
                        redirectOptions.rejectUnauthorized = false;
                    // HTTP-redirect fetch step 4: If locationURL is null, then return response.
                    // Best-effort UTF-8 decoding, per spec it's US-ASCII only, but browsers are more lenient.
                    // Node.js parses it as Latin1 via std::v8::String, so we convert it to UTF-8.
                    const locationHeaderValue = Buffer.from(response.headers.location ?? '', 'latin1').toString('utf8');
                    if (locationHeaderValue) {
                        let locationURL;
                        try {
                            locationURL = new URL(locationHeaderValue, url);
                        }
                        catch (error) {
                            reject(new Error(`uri requested responds with an invalid redirect URL: ${locationHeaderValue}`));
                            request.destroy();
                            return;
                        }
                        if (headers['host'])
                            headers['host'] = locationURL.host;
                        notifyRequestFinished();
                        fulfill(this._sendRequest(progress, locationURL, redirectOptions, postData));
                        request.destroy();
                        return;
                    }
                }
                if (response.statusCode === 401 && !getHeader(options.headers, 'authorization')) {
                    const auth = response.headers['www-authenticate'];
                    const credentials = this._getHttpCredentials(url);
                    if (auth?.trim().startsWith('Basic') && credentials) {
                        setBasicAuthorizationHeader(options.headers, credentials);
                        notifyRequestFinished();
                        fulfill(this._sendRequest(progress, url, options, postData));
                        request.destroy();
                        return;
                    }
                }
                response.on('aborted', () => reject(new Error('aborted')));
                const chunks = [];
                const notifyBodyFinished = () => {
                    const body = Buffer.concat(chunks);
                    notifyRequestFinished(body);
                    fulfill({
                        url: response.url || url.toString(),
                        status: response.statusCode || 0,
                        statusText: response.statusMessage || '',
                        headers: toHeadersArray(response.rawHeaders),
                        body
                    });
                };
                let body = response;
                let transform;
                const encoding = response.headers['content-encoding'];
                if (encoding === 'gzip' || encoding === 'x-gzip') {
                    transform = zlib.createGunzip({
                        flush: zlib.constants.Z_SYNC_FLUSH,
                        finishFlush: zlib.constants.Z_SYNC_FLUSH
                    });
                }
                else if (encoding === 'br') {
                    transform = zlib.createBrotliDecompress({
                        flush: zlib.constants.BROTLI_OPERATION_FLUSH,
                        finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
                    });
                }
                else if (encoding === 'deflate') {
                    transform = zlib.createInflate();
                }
                if (transform) {
                    // Brotli and deflate decompressors throw if the input stream is empty.
                    const emptyStreamTransform = new SafeEmptyStreamTransform(notifyBodyFinished);
                    body = (0, stream_1.pipeline)(response, emptyStreamTransform, transform, e => {
                        if (e)
                            reject(new Error(`failed to decompress '${encoding}' encoding: ${e.message}`));
                    });
                    body.on('error', e => reject(new Error(`failed to decompress '${encoding}' encoding: ${e}`)));
                }
                else {
                    body.on('error', reject);
                }
                body.on('data', chunk => chunks.push(chunk));
                body.on('end', notifyBodyFinished);
            });
            request.on('error', reject);
            destroyRequest = () => request.destroy();
            listeners.push(utils_1.eventsHelper.addEventListener(this, APIRequestContext.Events.Dispose, () => {
                reject(new Error('Request context disposed.'));
                request.destroy();
            }));
            request.on('close', () => utils_1.eventsHelper.removeEventListeners(listeners));
            request.on('socket', socket => {
                if (request.reusedSocket) {
                    reusedSocketAt = (0, utils_1.monotonicTime)();
                    return;
                }
                // happy eyeballs don't emit lookup and connect events, so we use our custom ones
                const happyEyeBallsTimings = (0, happyEyeballs_1.timingForSocket)(socket);
                dnsLookupAt = happyEyeBallsTimings.dnsLookupAt;
                tcpConnectionAt = happyEyeBallsTimings.tcpConnectionAt;
                // non-happy-eyeballs sockets
                listeners.push(utils_1.eventsHelper.addEventListener(socket, 'lookup', () => { dnsLookupAt = (0, utils_1.monotonicTime)(); }), utils_1.eventsHelper.addEventListener(socket, 'connect', () => { tcpConnectionAt = (0, utils_1.monotonicTime)(); }), utils_1.eventsHelper.addEventListener(socket, 'secureConnect', () => {
                    tlsHandshakeAt = (0, utils_1.monotonicTime)();
                    if (socket instanceof tls_1.TLSSocket) {
                        const peerCertificate = socket.getPeerCertificate();
                        securityDetails = {
                            protocol: socket.getProtocol() ?? undefined,
                            subjectName: peerCertificate.subject.CN,
                            validFrom: new Date(peerCertificate.valid_from).getTime() / 1000,
                            validTo: new Date(peerCertificate.valid_to).getTime() / 1000,
                            issuer: peerCertificate.issuer.CN
                        };
                    }
                }));
                serverIPAddress = socket.remoteAddress;
                serverPort = socket.remotePort;
            });
            request.on('finish', () => { requestFinishAt = (0, utils_1.monotonicTime)(); });
            progress.log(`→ ${options.method} ${url.toString()}`);
            if (options.headers) {
                for (const [name, value] of Object.entries(options.headers))
                    progress.log(`  ${name}: ${value}`);
            }
            if (postData)
                request.write(postData);
            request.end();
        });
        return progress.race(resultPromise).catch(error => {
            destroyRequest?.();
            throw error;
        });
    }
    _getHttpCredentials(url) {
        if (!this._defaultOptions().httpCredentials?.origin || url.origin.toLowerCase() === this._defaultOptions().httpCredentials?.origin?.toLowerCase())
            return this._defaultOptions().httpCredentials;
        return undefined;
    }
}
exports.APIRequestContext = APIRequestContext;
class SafeEmptyStreamTransform extends stream_1.Transform {
    _receivedSomeData = false;
    _onEmptyStreamCallback;
    constructor(onEmptyStreamCallback) {
        super();
        this._onEmptyStreamCallback = onEmptyStreamCallback;
    }
    _transform(chunk, encoding, callback) {
        this._receivedSomeData = true;
        callback(null, chunk);
    }
    _flush(callback) {
        if (this._receivedSomeData)
            callback(null);
        else
            this._onEmptyStreamCallback();
    }
}
class BrowserContextAPIRequestContext extends APIRequestContext {
    _context;
    constructor(context) {
        super(context);
        this._context = context;
        context.once(browserContext_1.BrowserContext.Events.Close, () => this._disposeImpl());
    }
    tracing() {
        return this._context.tracing;
    }
    async dispose(options) {
        this._closeReason = options.reason;
        this.fetchResponses.clear();
    }
    _defaultOptions() {
        return {
            userAgent: this._context._options.userAgent || this._context._browser.userAgent(),
            extraHTTPHeaders: this._context._options.extraHTTPHeaders,
            failOnStatusCode: undefined,
            httpCredentials: this._context._options.httpCredentials,
            proxy: this._context._options.proxy || this._context._browser.options.proxy,
            ignoreHTTPSErrors: this._context._options.ignoreHTTPSErrors,
            baseURL: this._context._options.baseURL,
            clientCertificates: this._context._options.clientCertificates,
        };
    }
    async _addCookies(cookies) {
        await this._context.addCookies(cookies);
    }
    async _cookies(url) {
        return await this._context.cookies(url.toString());
    }
    async storageState(progress, indexedDB) {
        return this._context.storageState(progress, indexedDB);
    }
}
exports.BrowserContextAPIRequestContext = BrowserContextAPIRequestContext;
class GlobalAPIRequestContext extends APIRequestContext {
    _cookieStore = new cookieStore_1.CookieStore();
    _options;
    _origins;
    _tracing;
    constructor(copilotbrowser, options) {
        super(copilotbrowser);
        this.attribution.context = this;
        if (options.storageState) {
            this._origins = options.storageState.origins?.map(origin => ({ indexedDB: [], ...origin }));
            this._cookieStore.addCookies(options.storageState.cookies || []);
        }
        (0, browserContext_1.verifyClientCertificates)(options.clientCertificates);
        this._options = {
            baseURL: options.baseURL,
            userAgent: options.userAgent || (0, userAgent_1.getUserAgent)(),
            extraHTTPHeaders: options.extraHTTPHeaders,
            failOnStatusCode: !!options.failOnStatusCode,
            ignoreHTTPSErrors: !!options.ignoreHTTPSErrors,
            maxRedirects: options.maxRedirects,
            httpCredentials: options.httpCredentials,
            clientCertificates: options.clientCertificates,
            proxy: options.proxy,
        };
        this._tracing = new tracing_1.Tracing(this, options.tracesDir);
    }
    tracing() {
        return this._tracing;
    }
    async dispose(options) {
        this._closeReason = options.reason;
        await this._tracing.flush();
        await this._tracing.deleteTmpTracesDir();
        this._disposeImpl();
    }
    _defaultOptions() {
        return this._options;
    }
    async _addCookies(cookies) {
        this._cookieStore.addCookies(cookies);
    }
    async _cookies(url) {
        return this._cookieStore.cookies(url);
    }
    async storageState(progress, indexedDB = false) {
        return {
            cookies: this._cookieStore.allCookies(),
            origins: (this._origins || []).map(origin => ({ ...origin, indexedDB: indexedDB ? origin.indexedDB : [] })),
        };
    }
}
exports.GlobalAPIRequestContext = GlobalAPIRequestContext;
function toHeadersArray(rawHeaders) {
    const result = [];
    for (let i = 0; i < rawHeaders.length; i += 2)
        result.push({ name: rawHeaders[i], value: rawHeaders[i + 1] });
    return result;
}
const redirectStatus = [301, 302, 303, 307, 308];
function parseCookie(header) {
    const raw = (0, cookieStore_1.parseRawCookie)(header);
    if (!raw)
        return null;
    const cookie = {
        domain: '',
        path: '',
        expires: -1,
        httpOnly: false,
        secure: false,
        // From https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
        // The cookie-sending behavior if SameSite is not specified is SameSite=Lax.
        sameSite: 'Lax',
        ...raw
    };
    return cookie;
}
function serializePostData(params, headers) {
    (0, utils_1.assert)((params.postData ? 1 : 0) + (params.jsonData ? 1 : 0) + (params.formData ? 1 : 0) + (params.multipartData ? 1 : 0) <= 1, `Only one of 'data', 'form' or 'multipart' can be specified`);
    if (params.jsonData !== undefined) {
        setHeader(headers, 'content-type', 'application/json', true);
        return Buffer.from(params.jsonData, 'utf8');
    }
    else if (params.formData) {
        const searchParams = new URLSearchParams();
        for (const { name, value } of params.formData)
            searchParams.append(name, value);
        setHeader(headers, 'content-type', 'application/x-www-form-urlencoded', true);
        return Buffer.from(searchParams.toString(), 'utf8');
    }
    else if (params.multipartData) {
        const formData = new formData_1.MultipartFormData();
        for (const field of params.multipartData) {
            if (field.file)
                formData.addFileField(field.name, field.file);
            else if (field.value)
                formData.addField(field.name, field.value);
        }
        setHeader(headers, 'content-type', formData.contentTypeHeader(), true);
        return formData.finish();
    }
    else if (params.postData !== undefined) {
        setHeader(headers, 'content-type', 'application/octet-stream', true);
        return params.postData;
    }
    return undefined;
}
function setHeader(headers, name, value, keepExisting = false) {
    const existing = Object.entries(headers).find(pair => pair[0].toLowerCase() === name.toLowerCase());
    if (!existing)
        headers[name] = value;
    else if (!keepExisting)
        headers[existing[0]] = value;
}
function getHeader(headers, name) {
    const existing = Object.entries(headers).find(pair => pair[0].toLowerCase() === name.toLowerCase());
    return existing ? existing[1] : undefined;
}
function removeHeader(headers, name) {
    delete headers[name];
}
function setBasicAuthorizationHeader(headers, credentials) {
    const { username, password } = credentials;
    const encoded = Buffer.from(`${username || ''}:${password || ''}`).toString('base64');
    setHeader(headers, 'authorization', `Basic ${encoded}`);
}
