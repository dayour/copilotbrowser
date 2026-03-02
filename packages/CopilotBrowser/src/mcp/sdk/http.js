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
exports.startMcpHttpServer = startMcpHttpServer;
exports.addressToString = addressToString;
const assert_1 = __importDefault(require("assert"));
const crypto_1 = __importDefault(require("crypto"));
const utilsBundle_1 = require("copilotbrowser-core/lib/utilsBundle");
const mcpBundle = __importStar(require("copilotbrowser-core/lib/mcpBundle"));
const utils_1 = require("copilotbrowser-core/lib/utils");
const mcpServer = __importStar(require("./server"));
const testDebug = (0, utilsBundle_1.debug)('pw:mcp:test');
async function startMcpHttpServer(config, serverBackendFactory, allowedHosts) {
    const httpServer = (0, utils_1.createHttpServer)();
    await (0, utils_1.startHttpServer)(httpServer, config);
    return await installHttpTransport(httpServer, serverBackendFactory, allowedHosts);
}
function addressToString(address, options) {
    (0, assert_1.default)(address, 'Could not bind server socket');
    if (typeof address === 'string')
        throw new Error('Unexpected address type: ' + address);
    let host = address.family === 'IPv4' ? address.address : `[${address.address}]`;
    if (options.normalizeLoopback && (host === '0.0.0.0' || host === '[::]' || host === '[::1]' || host === '127.0.0.1'))
        host = 'localhost';
    return `${options.protocol}://${host}:${address.port}`;
}
async function installHttpTransport(httpServer, serverBackendFactory, allowedHosts) {
    const url = addressToString(httpServer.address(), { protocol: 'http', normalizeLoopback: true });
    const host = new URL(url).host;
    allowedHosts = (allowedHosts || [host]).map(h => h.toLowerCase());
    const allowAnyHost = allowedHosts.includes('*');
    const sseSessions = new Map();
    const streamableSessions = new Map();
    httpServer.on('request', async (req, res) => {
        if (!allowAnyHost) {
            const host = req.headers.host?.toLowerCase();
            if (!host) {
                res.statusCode = 400;
                return res.end('Missing host');
            }
            // Prevent DNS evil.com -> localhost rebind.
            if (!allowedHosts.includes(host)) {
                // Access from the browser is forbidden.
                res.statusCode = 403;
                return res.end('Access is only allowed at ' + allowedHosts.join(', '));
            }
        }
        const url = new URL(`http://localhost${req.url}`);
        if (url.pathname === '/health' && req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'healthy', version: process.env.npm_package_version || 'unknown' }));
            return;
        }
        if (url.pathname === '/ready' && req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ready' }));
            return;
        }
        if (url.pathname === '/killkillkill' && req.method === 'GET') {
            res.statusCode = 200;
            res.end('Killing process');
            // Simulate Ctrl+C in a way that works on Windows too.
            process.emit('SIGINT');
            return;
        }
        if (url.pathname.startsWith('/sse'))
            await handleSSE(serverBackendFactory, req, res, url, sseSessions);
        else
            await handleStreamable(serverBackendFactory, req, res, streamableSessions);
    });
    return url;
}
async function handleSSE(serverBackendFactory, req, res, url, sessions) {
    if (req.method === 'POST') {
        const sessionId = url.searchParams.get('sessionId');
        if (!sessionId) {
            res.statusCode = 400;
            return res.end('Missing sessionId');
        }
        const transport = sessions.get(sessionId);
        if (!transport) {
            res.statusCode = 404;
            return res.end('Session not found');
        }
        return await transport.handlePostMessage(req, res);
    }
    else if (req.method === 'GET') {
        const transport = new mcpBundle.SSEServerTransport('/sse', res);
        sessions.set(transport.sessionId, transport);
        testDebug(`create SSE session: ${transport.sessionId}`);
        await mcpServer.connect(serverBackendFactory, transport, false);
        res.on('close', () => {
            testDebug(`delete SSE session: ${transport.sessionId}`);
            sessions.delete(transport.sessionId);
        });
        return;
    }
    res.statusCode = 405;
    res.end('Method not allowed');
}
async function handleStreamable(serverBackendFactory, req, res, sessions) {
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId) {
        const transport = sessions.get(sessionId);
        if (!transport) {
            res.statusCode = 404;
            res.end('Session not found');
            return;
        }
        return await transport.handleRequest(req, res);
    }
    if (req.method === 'POST') {
        const transport = new mcpBundle.StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto_1.default.randomUUID(),
            onsessioninitialized: async (sessionId) => {
                testDebug(`create http session: ${transport.sessionId}`);
                await mcpServer.connect(serverBackendFactory, transport, true);
                sessions.set(sessionId, transport);
            }
        });
        transport.onclose = () => {
            if (!transport.sessionId)
                return;
            sessions.delete(transport.sessionId);
            testDebug(`delete http session: ${transport.sessionId}`);
        };
        await transport.handleRequest(req, res);
        return;
    }
    res.statusCode = 400;
    res.end('Invalid request');
}
