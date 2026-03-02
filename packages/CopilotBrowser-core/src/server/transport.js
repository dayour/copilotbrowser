"use strict";
/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTransport = exports.perMessageDeflate = void 0;
const utils_1 = require("../utils");
const happyEyeballs_1 = require("./utils/happyEyeballs");
const utilsBundle_1 = require("../utilsBundle");
exports.perMessageDeflate = {
    clientNoContextTakeover: true,
    zlibDeflateOptions: {
        level: 3,
    },
    zlibInflateOptions: {
        chunkSize: 10 * 1024
    },
    threshold: 10 * 1024,
};
class WebSocketTransport {
    _ws;
    _progress;
    _logUrl;
    onmessage;
    onclose;
    wsEndpoint;
    headers = [];
    static async connect(progress, url, options = {}) {
        return await WebSocketTransport._connect(progress, url, options, false /* hadRedirects */);
    }
    static async _connect(progress, url, options, hadRedirects) {
        const logUrl = stripQueryParams(url);
        progress?.log(`<ws connecting> ${logUrl}`);
        const transport = new WebSocketTransport(progress, url, logUrl, { ...options, followRedirects: !!options.followRedirects && hadRedirects });
        const resultPromise = new Promise((fulfill, reject) => {
            transport._ws.on('open', async () => {
                progress?.log(`<ws connected> ${logUrl}`);
                fulfill({});
            });
            transport._ws.on('error', event => {
                progress?.log(`<ws connect error> ${logUrl} ${event.message}`);
                reject(new Error('WebSocket error: ' + event.message));
                transport._ws.close();
            });
            transport._ws.on('unexpected-response', (request, response) => {
                if (options.followRedirects && !hadRedirects && (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308)) {
                    fulfill({ redirect: response });
                    transport._ws.close();
                    return;
                }
                for (let i = 0; i < response.rawHeaders.length; i += 2) {
                    if (options.debugLogHeader && response.rawHeaders[i] === options.debugLogHeader)
                        progress?.log(response.rawHeaders[i + 1]);
                }
                const chunks = [];
                const errorPrefix = `${logUrl} ${response.statusCode} ${response.statusMessage}`;
                response.on('data', chunk => chunks.push(chunk));
                response.on('close', () => {
                    const error = chunks.length ? `${errorPrefix}\n${Buffer.concat(chunks)}` : errorPrefix;
                    progress?.log(`<ws unexpected response> ${error}`);
                    reject(new Error('WebSocket error: ' + error));
                    transport._ws.close();
                });
            });
        });
        try {
            const result = progress ? await progress.race(resultPromise) : await resultPromise;
            if (result.redirect) {
                // Strip authorization headers from the redirected request.
                const newHeaders = Object.fromEntries(Object.entries(options.headers || {}).filter(([name]) => {
                    return !name.includes('access-key') && name.toLowerCase() !== 'authorization';
                }));
                return WebSocketTransport._connect(progress, result.redirect.headers.location, { ...options, headers: newHeaders }, true /* hadRedirects */);
            }
            return transport;
        }
        catch (error) {
            await transport.closeAndWait();
            throw error;
        }
    }
    constructor(progress, url, logUrl, options) {
        this.wsEndpoint = url;
        this._logUrl = logUrl;
        this._ws = new utilsBundle_1.ws(url, [], {
            maxPayload: 256 * 1024 * 1024, // 256Mb,
            headers: options.headers,
            followRedirects: options.followRedirects,
            agent: ((/^(https|wss):\/\//.test(url)) ? happyEyeballs_1.httpsHappyEyeballsAgent : happyEyeballs_1.httpHappyEyeballsAgent),
            perMessageDeflate: exports.perMessageDeflate,
        });
        this._ws.on('upgrade', response => {
            for (let i = 0; i < response.rawHeaders.length; i += 2) {
                this.headers.push({ name: response.rawHeaders[i], value: response.rawHeaders[i + 1] });
                if (options.debugLogHeader && response.rawHeaders[i] === options.debugLogHeader)
                    progress?.log(response.rawHeaders[i + 1]);
            }
        });
        this._progress = progress;
        // The 'ws' module in node sometimes sends us multiple messages in a single task.
        // In Web, all IO callbacks (e.g. WebSocket callbacks)
        // are dispatched into separate tasks, so there's no need
        // to do anything extra.
        const messageWrap = (0, utils_1.makeWaitForNextTask)();
        this._ws.addEventListener('message', event => {
            messageWrap(() => {
                const eventData = event.data;
                let parsedJson;
                try {
                    parsedJson = JSON.parse(eventData);
                }
                catch (e) {
                    this._progress?.log(`<closing ws> Closing websocket due to malformed JSON. eventData=${eventData} e=${e?.message}`);
                    this._ws.close();
                    return;
                }
                try {
                    if (this.onmessage)
                        this.onmessage.call(null, parsedJson);
                }
                catch (e) {
                    this._progress?.log(`<closing ws> Closing websocket due to failed onmessage callback. eventData=${eventData} e=${e?.message}`);
                    this._ws.close();
                }
            });
        });
        this._ws.addEventListener('close', event => {
            this._progress?.log(`<ws disconnected> ${logUrl} code=${event.code} reason=${event.reason}`);
            if (this.onclose)
                this.onclose.call(null, event.reason);
        });
        // Prevent Error: read ECONNRESET.
        this._ws.addEventListener('error', error => this._progress?.log(`<ws error> ${logUrl} ${error.type} ${error.message}`));
    }
    send(message) {
        this._ws.send(JSON.stringify(message));
    }
    close() {
        this._progress?.log(`<ws disconnecting> ${this._logUrl}`);
        this._ws.close();
    }
    async closeAndWait() {
        if (this._ws.readyState === utilsBundle_1.ws.CLOSED)
            return;
        const promise = new Promise(f => this._ws.once('close', f));
        this.close();
        await promise; // Make sure to await the actual disconnect.
    }
}
exports.WebSocketTransport = WebSocketTransport;
function stripQueryParams(url) {
    try {
        const u = new URL(url);
        u.search = '';
        u.hash = '';
        return u.toString();
    }
    catch {
        return url;
    }
}
