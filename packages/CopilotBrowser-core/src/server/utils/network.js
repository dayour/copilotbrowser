"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NET_DEFAULT_TIMEOUT = void 0;
exports.httpRequest = httpRequest;
exports.fetchData = fetchData;
exports.createProxyAgent = createProxyAgent;
exports.createHttpServer = createHttpServer;
exports.createHttpsServer = createHttpsServer;
exports.createHttp2Server = createHttp2Server;
exports.startHttpServer = startHttpServer;
exports.isURLAvailable = isURLAvailable;
const http_1 = __importDefault(require("http"));
const http2_1 = __importDefault(require("http2"));
const https_1 = __importDefault(require("https"));
const utilsBundle_1 = require("../../utilsBundle");
const happyEyeballs_1 = require("./happyEyeballs");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
exports.NET_DEFAULT_TIMEOUT = 30_000;
function httpRequest(params, onResponse, onError) {
    let url = new URL(params.url);
    const options = {
        method: params.method || 'GET',
        headers: params.headers,
    };
    if (params.rejectUnauthorized !== undefined)
        options.rejectUnauthorized = params.rejectUnauthorized;
    const proxyURL = (0, utilsBundle_1.getProxyForUrl)(params.url);
    if (proxyURL) {
        const parsedProxyURL = normalizeProxyURL(proxyURL);
        if (params.url.startsWith('http:')) {
            parsedProxyURL.pathname = url.toString();
            url = parsedProxyURL;
        }
        else {
            options.agent = new utilsBundle_1.HttpsProxyAgent(parsedProxyURL);
            options.rejectUnauthorized = false;
        }
    }
    options.agent ??= (url.protocol === 'https:' ? happyEyeballs_1.httpsHappyEyeballsAgent : happyEyeballs_1.httpHappyEyeballsAgent);
    let cancelRequest;
    const requestCallback = (res) => {
        const statusCode = res.statusCode || 0;
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
            // Close the original socket before following the redirect. Otherwise
            // it may stay idle and cause a timeout error.
            request.destroy();
            cancelRequest = httpRequest({ ...params, url: new URL(res.headers.location, params.url).toString() }, onResponse, onError).cancel;
        }
        else {
            onResponse(res);
        }
    };
    const request = url.protocol === 'https:' ?
        https_1.default.request(url, options, requestCallback) :
        http_1.default.request(url, options, requestCallback);
    request.on('error', onError);
    if (params.socketTimeout !== undefined) {
        request.setTimeout(params.socketTimeout, () => {
            onError(new Error(`Request to ${params.url} timed out after ${params.socketTimeout}ms`));
            request.abort();
        });
    }
    cancelRequest = e => {
        try {
            request.destroy(e);
        }
        catch {
        }
    };
    request.end(params.data);
    return { cancel: e => cancelRequest(e) };
}
async function fetchData(progress, params, onError) {
    const promise = new manualPromise_1.ManualPromise();
    const { cancel } = httpRequest(params, async (response) => {
        if (response.statusCode !== 200) {
            const error = onError ? await onError(params, response) : new Error(`fetch failed: server returned code ${response.statusCode}. URL: ${params.url}`);
            promise.reject(error);
            return;
        }
        let body = '';
        response.on('data', (chunk) => body += chunk);
        response.on('error', (error) => promise.reject(error));
        response.on('end', () => promise.resolve(body));
    }, error => promise.reject(error));
    if (!progress)
        return promise;
    try {
        return await progress.race(promise);
    }
    catch (error) {
        cancel(error);
        throw error;
    }
}
function shouldBypassProxy(url, bypass) {
    if (!bypass)
        return false;
    const domains = bypass.split(',').map(s => {
        s = s.trim();
        if (!s.startsWith('.'))
            s = '.' + s;
        return s;
    });
    const domain = '.' + url.hostname;
    return domains.some(d => domain.endsWith(d));
}
function normalizeProxyURL(proxy) {
    proxy = proxy.trim();
    // Browsers allow to specify proxy without a protocol, defaulting to http.
    if (!/^\w+:\/\//.test(proxy))
        proxy = 'http://' + proxy;
    return new URL(proxy);
}
function createProxyAgent(proxy, forUrl) {
    if (!proxy)
        return;
    if (forUrl && proxy.bypass && shouldBypassProxy(forUrl, proxy.bypass))
        return;
    const proxyURL = normalizeProxyURL(proxy.server);
    if (proxyURL.protocol?.startsWith('socks')) {
        // SocksProxyAgent distinguishes between socks5 and socks5h.
        // socks5h is what we want, it means that hostnames are resolved by the proxy.
        // browsers behave the same way, even if socks5 is specified.
        if (proxyURL.protocol === 'socks5:')
            proxyURL.protocol = 'socks5h:';
        else if (proxyURL.protocol === 'socks4:')
            proxyURL.protocol = 'socks4a:';
        return new utilsBundle_1.SocksProxyAgent(proxyURL);
    }
    if (proxy.username) {
        proxyURL.username = proxy.username;
        proxyURL.password = proxy.password || '';
    }
    if (forUrl && ['ws:', 'wss:'].includes(forUrl.protocol)) {
        // Force CONNECT method for WebSockets.
        return new utilsBundle_1.HttpsProxyAgent(proxyURL);
    }
    // TODO: This branch should be different from above. We should use HttpProxyAgent conditional on proxyURL.protocol instead of always using CONNECT method.
    return new utilsBundle_1.HttpsProxyAgent(proxyURL);
}
function createHttpServer(...args) {
    const server = http_1.default.createServer(...args);
    decorateServer(server);
    return server;
}
function createHttpsServer(...args) {
    const server = https_1.default.createServer(...args);
    decorateServer(server);
    return server;
}
function createHttp2Server(...args) {
    const server = http2_1.default.createSecureServer(...args);
    decorateServer(server);
    return server;
}
async function startHttpServer(server, options) {
    const { host = 'localhost', port = 0 } = options;
    const errorPromise = new manualPromise_1.ManualPromise();
    const errorListener = (error) => errorPromise.reject(error);
    server.on('error', errorListener);
    try {
        server.listen(port, host);
        await Promise.race([
            new Promise(cb => server.once('listening', cb)),
            errorPromise,
        ]);
    }
    finally {
        server.removeListener('error', errorListener);
    }
}
async function isURLAvailable(url, ignoreHTTPSErrors, onLog, onStdErr) {
    let statusCode = await httpStatusCode(url, ignoreHTTPSErrors, onLog, onStdErr);
    if (statusCode === 404 && url.pathname === '/') {
        const indexUrl = new URL(url);
        indexUrl.pathname = '/index.html';
        statusCode = await httpStatusCode(indexUrl, ignoreHTTPSErrors, onLog, onStdErr);
    }
    return statusCode >= 200 && statusCode < 404;
}
async function httpStatusCode(url, ignoreHTTPSErrors, onLog, onStdErr) {
    return new Promise(resolve => {
        onLog?.(`HTTP GET: ${url}`);
        httpRequest({
            url: url.toString(),
            headers: { Accept: '*/*' },
            rejectUnauthorized: !ignoreHTTPSErrors
        }, res => {
            res.resume();
            const statusCode = res.statusCode ?? 0;
            onLog?.(`HTTP Status: ${statusCode}`);
            resolve(statusCode);
        }, error => {
            if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT')
                onStdErr?.(`[WebServer] Self-signed certificate detected. Try adding ignoreHTTPSErrors: true to config.webServer.`);
            onLog?.(`Error while checking if ${url} is available: ${error.message}`);
            resolve(0);
        });
    });
}
function decorateServer(server) {
    const sockets = new Set();
    server.on('connection', socket => {
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
    });
    const close = server.close;
    server.close = (callback) => {
        for (const socket of sockets)
            socket.destroy();
        sockets.clear();
        return close.call(server, callback);
    };
}
