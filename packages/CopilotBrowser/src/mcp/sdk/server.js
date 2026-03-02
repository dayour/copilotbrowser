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
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = connect;
exports.wrapInProcess = wrapInProcess;
exports.wrapInClient = wrapInClient;
exports.createServer = createServer;
exports.start = start;
exports.firstRootPath = firstRootPath;
exports.allRootPaths = allRootPaths;
const url_1 = require("url");
const utilsBundle_1 = require("copilotbrowser-core/lib/utilsBundle");
const mcpBundle = __importStar(require("copilotbrowser-core/lib/mcpBundle"));
const http_1 = require("./http");
const inProcessTransport_1 = require("./inProcessTransport");
const serverDebug = (0, utilsBundle_1.debug)('pw:mcp:server');
const serverDebugResponse = (0, utilsBundle_1.debug)('pw:mcp:server:response');
async function connect(factory, transport, runPulse) {
    const server = createServer(factory.name, factory.version, factory.create(), runPulse);
    await server.connect(transport);
}
function wrapInProcess(backend) {
    const server = createServer('Internal', '0.0.0', backend, false);
    return new inProcessTransport_1.InProcessTransport(server);
}
async function wrapInClient(backend, options) {
    const server = createServer('Internal', '0.0.0', backend, false);
    const transport = new inProcessTransport_1.InProcessTransport(server);
    const client = new mcpBundle.Client({ name: options.name, version: options.version });
    await client.connect(transport);
    await client.ping();
    return client;
}
function createServer(name, version, backend, runPulse) {
    const server = new mcpBundle.Server({ name, version }, {
        capabilities: {
            tools: {},
        }
    });
    server.setRequestHandler(mcpBundle.ListToolsRequestSchema, async () => {
        serverDebug('listTools');
        const tools = await backend.listTools();
        return { tools };
    });
    let initializePromise;
    server.setRequestHandler(mcpBundle.CallToolRequestSchema, async (request, extra) => {
        serverDebug('callTool', request);
        const progressToken = request.params._meta?.progressToken;
        let progressCounter = 0;
        const progress = progressToken ? (params) => {
            extra.sendNotification({
                method: 'notifications/progress',
                params: {
                    progressToken,
                    progress: params.progress ?? ++progressCounter,
                    total: params.total,
                    message: params.message,
                },
            }).catch(e => serverDebug('notification', e));
        } : () => { };
        try {
            if (!initializePromise)
                initializePromise = initializeServer(server, backend, runPulse);
            await initializePromise;
            const toolResult = await backend.callTool(request.params.name, request.params.arguments || {}, progress);
            const mergedResult = mergeTextParts(toolResult);
            serverDebugResponse('callResult', mergedResult);
            return mergedResult;
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: '### Result\n' + String(error) }],
                isError: true,
            };
        }
    });
    addServerListener(server, 'close', () => backend.serverClosed?.(server));
    return server;
}
const initializeServer = async (server, backend, runPulse) => {
    const capabilities = server.getClientCapabilities();
    let clientRoots = [];
    if (capabilities?.roots) {
        const { roots } = await server.listRoots().catch(e => {
            serverDebug(e);
            return { roots: [] };
        });
        clientRoots = roots;
    }
    const clientInfo = {
        name: server.getClientVersion()?.name ?? 'unknown',
        version: server.getClientVersion()?.version ?? 'unknown',
        roots: clientRoots,
        timestamp: Date.now(),
    };
    await backend.initialize?.(clientInfo);
    if (runPulse)
        startPulse(server);
};
const startPulse = (server) => {
    const beat = () => {
        Promise.race([
            server.ping(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('ping timeout')), 5000)),
        ]).then(() => {
            setTimeout(beat, 3000);
        }).catch(() => {
            void server.close();
        });
    };
    beat();
};
function addServerListener(server, event, listener) {
    const oldListener = server[`on${event}`];
    server[`on${event}`] = () => {
        oldListener?.();
        listener();
    };
}
async function start(serverBackendFactory, options) {
    if (options.port === undefined) {
        await connect(serverBackendFactory, new mcpBundle.StdioServerTransport(), false);
        return;
    }
    const url = await (0, http_1.startMcpHttpServer)(options, serverBackendFactory, options.allowedHosts);
    const mcpConfig = { mcpServers: {} };
    mcpConfig.mcpServers[serverBackendFactory.nameInConfig] = {
        url: `${url}/mcp`
    };
    const message = [
        `Listening on ${url}`,
        'Put this in your client config:',
        JSON.stringify(mcpConfig, undefined, 2),
        'For legacy SSE transport support, you can use the /sse endpoint instead.',
    ].join('\n');
    // eslint-disable-next-line no-console
    console.error(message);
}
function firstRootPath(clientInfo) {
    if (clientInfo.roots.length === 0)
        return undefined;
    const firstRootUri = clientInfo.roots[0]?.uri;
    const url = firstRootUri ? new URL(firstRootUri) : undefined;
    try {
        return url ? (0, url_1.fileURLToPath)(url) : undefined;
    }
    catch (error) {
        serverDebug(error);
        return undefined;
    }
}
function allRootPaths(clientInfo) {
    const paths = [];
    for (const root of clientInfo.roots) {
        try {
            const url = new URL(root.uri);
            const path = (0, url_1.fileURLToPath)(url);
            if (path)
                paths.push(path);
        }
        catch (error) {
            serverDebug(error);
        }
    }
    return paths;
}
function mergeTextParts(result) {
    const content = [];
    const testParts = [];
    for (const part of result.content) {
        if (part.type === 'text') {
            testParts.push(part.text);
            continue;
        }
        if (testParts.length > 0) {
            content.push({ type: 'text', text: testParts.join('\n') });
            testParts.length = 0;
        }
        content.push(part);
    }
    if (testParts.length > 0)
        content.push({ type: 'text', text: testParts.join('\n') });
    return {
        ...result,
        content,
    };
}
