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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSServer = exports.perMessageDeflate = void 0;
const network_1 = require("./network");
const utilsBundle_1 = require("../../utilsBundle");
const debugLogger_1 = require("./debugLogger");
let lastConnectionId = 0;
const kConnectionSymbol = Symbol('kConnection');
exports.perMessageDeflate = {
    serverNoContextTakeover: true,
    zlibDeflateOptions: {
        level: 3,
    },
    zlibInflateOptions: {
        chunkSize: 10 * 1024
    },
    threshold: 10 * 1024,
};
class WSServer {
    _wsServer;
    server;
    _delegate;
    constructor(delegate) {
        this._delegate = delegate;
    }
    async listen(port = 0, hostname, path) {
        debugLogger_1.debugLogger.log('server', `Server started at ${new Date()}`);
        const server = (0, network_1.createHttpServer)(this._delegate.onRequest);
        server.on('error', error => debugLogger_1.debugLogger.log('server', String(error)));
        this.server = server;
        const wsEndpoint = await new Promise((resolve, reject) => {
            server.listen(port, hostname, () => {
                const address = server.address();
                if (!address) {
                    reject(new Error('Could not bind server socket'));
                    return;
                }
                const wsEndpoint = typeof address === 'string' ? `${address}${path}` : `ws://${hostname || 'localhost'}:${address.port}${path}`;
                resolve(wsEndpoint);
            }).on('error', reject);
        });
        debugLogger_1.debugLogger.log('server', 'Listening at ' + wsEndpoint);
        this._wsServer = new utilsBundle_1.wsServer({
            noServer: true,
            perMessageDeflate: exports.perMessageDeflate,
        });
        this._wsServer.on('headers', headers => this._delegate.onHeaders(headers));
        server.on('upgrade', (request, socket, head) => {
            const pathname = new URL('http://localhost' + request.url).pathname;
            if (pathname !== path) {
                socket.write(`HTTP/${request.httpVersion} 400 Bad Request\r\n\r\n`);
                socket.destroy();
                return;
            }
            const upgradeResult = this._delegate.onUpgrade(request, socket);
            if (upgradeResult) {
                socket.write(upgradeResult.error);
                socket.destroy();
                return;
            }
            this._wsServer.handleUpgrade(request, socket, head, ws => this._wsServer.emit('connection', ws, request));
        });
        this._wsServer.on('connection', (ws, request) => {
            debugLogger_1.debugLogger.log('server', 'Connected client ws.extension=' + ws.extensions);
            const url = new URL('http://localhost' + (request.url || ''));
            const id = String(++lastConnectionId);
            debugLogger_1.debugLogger.log('server', `[${id}] serving connection: ${request.url}`);
            const connection = this._delegate.onConnection(request, url, ws, id);
            ws[kConnectionSymbol] = connection;
        });
        return wsEndpoint;
    }
    async close() {
        const server = this._wsServer;
        if (!server)
            return;
        debugLogger_1.debugLogger.log('server', 'closing websocket server');
        const waitForClose = new Promise(f => server.close(f));
        // First disconnect all remaining clients.
        await Promise.all(Array.from(server.clients).map(async (ws) => {
            const connection = ws[kConnectionSymbol];
            if (connection)
                await connection.close();
            try {
                ws.terminate();
            }
            catch (e) {
            }
        }));
        await waitForClose;
        debugLogger_1.debugLogger.log('server', 'closing http server');
        if (this.server)
            await new Promise(f => this.server.close(f));
        this._wsServer = undefined;
        this.server = undefined;
        debugLogger_1.debugLogger.log('server', 'closed server');
    }
}
exports.WSServer = WSServer;
