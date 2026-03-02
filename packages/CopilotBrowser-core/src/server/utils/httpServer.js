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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpServer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utilsBundle_1 = require("../../utilsBundle");
const crypto_1 = require("./crypto");
const assert_1 = require("../../utils/isomorphic/assert");
const network_1 = require("./network");
class HttpServer {
    _server;
    _urlPrefixPrecise = '';
    _urlPrefixHumanReadable = '';
    _port = 0;
    _started = false;
    _routes = [];
    _wsGuid;
    constructor() {
        this._server = (0, network_1.createHttpServer)(this._onRequest.bind(this));
    }
    server() {
        return this._server;
    }
    routePrefix(prefix, handler) {
        this._routes.push({ prefix, handler });
    }
    routePath(path, handler) {
        this._routes.push({ exact: path, handler });
    }
    port() {
        return this._port;
    }
    createWebSocket(transportFactory, guid) {
        (0, assert_1.assert)(!this._wsGuid, 'can only create one main websocket transport per server');
        this._wsGuid = guid || (0, crypto_1.createGuid)();
        const wss = new utilsBundle_1.wsServer({ server: this._server, path: '/' + this._wsGuid });
        wss.on('connection', (ws, request) => {
            const url = new URL(request.url ?? '/', 'http://localhost');
            const transport = transportFactory(url);
            transport.sendEvent = (method, params) => ws.send(JSON.stringify({ method, params }));
            transport.close = () => ws.close();
            transport.onconnect();
            ws.on('message', async (message) => {
                const { id, method, params } = JSON.parse(String(message));
                try {
                    const result = await transport.dispatch(method, params);
                    ws.send(JSON.stringify({ id, result }));
                }
                catch (e) {
                    ws.send(JSON.stringify({ id, error: String(e) }));
                }
            });
            ws.on('close', () => transport.onclose());
            ws.on('error', () => transport.onclose());
        });
    }
    wsGuid() {
        return this._wsGuid;
    }
    async start(options = {}) {
        (0, assert_1.assert)(!this._started, 'server already started');
        this._started = true;
        const host = options.host;
        if (options.preferredPort) {
            try {
                await (0, network_1.startHttpServer)(this._server, { port: options.preferredPort, host });
            }
            catch (e) {
                if (!e || !e.message || !e.message.includes('EADDRINUSE'))
                    throw e;
                await (0, network_1.startHttpServer)(this._server, { host });
            }
        }
        else {
            await (0, network_1.startHttpServer)(this._server, { port: options.port, host });
        }
        const address = this._server.address();
        (0, assert_1.assert)(address, 'Could not bind server socket');
        if (typeof address === 'string') {
            this._urlPrefixPrecise = address;
            this._urlPrefixHumanReadable = address;
        }
        else {
            this._port = address.port;
            const resolvedHost = address.family === 'IPv4' ? address.address : `[${address.address}]`;
            this._urlPrefixPrecise = `http://${resolvedHost}:${address.port}`;
            this._urlPrefixHumanReadable = `http://${host ?? 'localhost'}:${address.port}`;
        }
    }
    async stop() {
        await new Promise(cb => this._server.close(cb));
    }
    urlPrefix(purpose) {
        return purpose === 'human-readable' ? this._urlPrefixHumanReadable : this._urlPrefixPrecise;
    }
    serveFile(request, response, absoluteFilePath, headers) {
        try {
            for (const [name, value] of Object.entries(headers || {}))
                response.setHeader(name, value);
            if (request.headers.range)
                this._serveRangeFile(request, response, absoluteFilePath);
            else
                this._serveFile(response, absoluteFilePath);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    _serveFile(response, absoluteFilePath) {
        const content = fs_1.default.readFileSync(absoluteFilePath);
        response.statusCode = 200;
        const contentType = utilsBundle_1.mime.getType(path_1.default.extname(absoluteFilePath)) || 'application/octet-stream';
        response.setHeader('Content-Type', contentType);
        response.setHeader('Content-Length', content.byteLength);
        response.end(content);
    }
    _serveRangeFile(request, response, absoluteFilePath) {
        const range = request.headers.range;
        if (!range || !range.startsWith('bytes=') || range.includes(', ') || [...range].filter(char => char === '-').length !== 1) {
            response.statusCode = 400;
            return response.end('Bad request');
        }
        // Parse the range header: https://datatracker.ietf.org/doc/html/rfc7233#section-2.1
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        // Both start and end (when passing to fs.createReadStream) and the range header are inclusive and start counting at 0.
        let start;
        let end;
        const size = fs_1.default.statSync(absoluteFilePath).size;
        if (startStr !== '' && endStr === '') {
            // No end specified: use the whole file
            start = +startStr;
            end = size - 1;
        }
        else if (startStr === '' && endStr !== '') {
            // No start specified: calculate start manually
            start = size - +endStr;
            end = size - 1;
        }
        else {
            start = +startStr;
            end = +endStr;
        }
        // Handle unavailable range request
        if (Number.isNaN(start) || Number.isNaN(end) || start >= size || end >= size || start > end) {
            // Return the 416 Range Not Satisfiable: https://datatracker.ietf.org/doc/html/rfc7233#section-4.4
            response.writeHead(416, {
                'Content-Range': `bytes */${size}`
            });
            return response.end();
        }
        // Sending Partial Content: https://datatracker.ietf.org/doc/html/rfc7233#section-4.1
        response.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': utilsBundle_1.mime.getType(path_1.default.extname(absoluteFilePath)),
        });
        const readable = fs_1.default.createReadStream(absoluteFilePath, { start, end });
        readable.pipe(response);
    }
    _onRequest(request, response) {
        if (request.method === 'OPTIONS') {
            response.writeHead(200);
            response.end();
            return;
        }
        request.on('error', () => response.end());
        try {
            if (!request.url) {
                response.end();
                return;
            }
            const url = new URL('http://localhost' + request.url);
            for (const route of this._routes) {
                if (route.exact && url.pathname === route.exact && route.handler(request, response))
                    return;
                if (route.prefix && url.pathname.startsWith(route.prefix) && route.handler(request, response))
                    return;
            }
            response.statusCode = 404;
            response.end();
        }
        catch (e) {
            response.end();
        }
    }
}
exports.HttpServer = HttpServer;
