"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
exports.LocalUtilsDispatcher = void 0;
const dispatcher_1 = require("./dispatcher");
const instrumentation_1 = require("../../server/instrumentation");
const localUtils = __importStar(require("../localUtils"));
const userAgent_1 = require("../utils/userAgent");
const deviceDescriptors_1 = require("../deviceDescriptors");
const jsonPipeDispatcher_1 = require("../dispatchers/jsonPipeDispatcher");
const socksInterceptor_1 = require("../socksInterceptor");
const transport_1 = require("../transport");
const network_1 = require("../utils/network");
const urlMatch_1 = require("../../utils/isomorphic/urlMatch");
class LocalUtilsDispatcher extends dispatcher_1.Dispatcher {
    _type_LocalUtils;
    _harBackends = new Map();
    _stackSessions = new Map();
    constructor(scope, copilotbrowser) {
        const localUtils = new instrumentation_1.SdkObject(copilotbrowser, 'localUtils', 'localUtils');
        localUtils.logName = 'browser';
        const deviceDescriptors = Object.entries(deviceDescriptors_1.deviceDescriptors)
            .map(([name, descriptor]) => ({ name, descriptor }));
        super(scope, localUtils, 'LocalUtils', {
            deviceDescriptors,
        });
        this._type_LocalUtils = true;
    }
    async zip(params, progress) {
        return await localUtils.zip(progress, this._stackSessions, params);
    }
    async harOpen(params, progress) {
        return await localUtils.harOpen(progress, this._harBackends, params);
    }
    async harLookup(params, progress) {
        return await localUtils.harLookup(progress, this._harBackends, params);
    }
    async harClose(params, progress) {
        localUtils.harClose(this._harBackends, params);
    }
    async harUnzip(params, progress) {
        return await localUtils.harUnzip(progress, params);
    }
    async tracingStarted(params, progress) {
        return await localUtils.tracingStarted(progress, this._stackSessions, params);
    }
    async traceDiscarded(params, progress) {
        return await localUtils.traceDiscarded(progress, this._stackSessions, params);
    }
    async addStackToTracingNoReply(params, progress) {
        localUtils.addStackToTracingNoReply(this._stackSessions, params);
    }
    async connect(params, progress) {
        const wsHeaders = {
            'User-Agent': (0, userAgent_1.getUserAgent)(),
            'x-copilotbrowser-proxy': params.exposeNetwork ?? '',
            ...params.headers,
        };
        const wsEndpoint = await urlToWSEndpoint(progress, params.wsEndpoint);
        const transport = await transport_1.WebSocketTransport.connect(progress, wsEndpoint, { headers: wsHeaders, followRedirects: true, debugLogHeader: 'x-copilotbrowser-debug-log' });
        const socksInterceptor = new socksInterceptor_1.SocksInterceptor(transport, params.exposeNetwork, params.socksProxyRedirectPortForTest);
        const pipe = new jsonPipeDispatcher_1.JsonPipeDispatcher(this);
        transport.onmessage = json => {
            if (socksInterceptor.interceptMessage(json))
                return;
            const cb = () => {
                try {
                    pipe.dispatch(json);
                }
                catch (e) {
                    transport.close();
                }
            };
            if (params.slowMo)
                setTimeout(cb, params.slowMo);
            else
                cb();
        };
        pipe.on('message', message => {
            transport.send(message);
        });
        transport.onclose = (reason) => {
            socksInterceptor?.cleanup();
            pipe.wasClosed(reason);
        };
        pipe.on('close', () => transport.close());
        return { pipe, headers: transport.headers };
    }
    async globToRegex(params, progress) {
        const regex = (0, urlMatch_1.resolveGlobToRegexPattern)(params.baseURL, params.glob, params.webSocketUrl);
        return { regex };
    }
}
exports.LocalUtilsDispatcher = LocalUtilsDispatcher;
async function urlToWSEndpoint(progress, endpointURL) {
    if (endpointURL.startsWith('ws'))
        return endpointURL;
    progress.log(`<ws preparing> retrieving websocket url from ${endpointURL}`);
    const fetchUrl = new URL(endpointURL);
    if (!fetchUrl.pathname.endsWith('/'))
        fetchUrl.pathname += '/';
    fetchUrl.pathname += 'json';
    const json = await (0, network_1.fetchData)(progress, {
        url: fetchUrl.toString(),
        method: 'GET',
        headers: { 'User-Agent': (0, userAgent_1.getUserAgent)() },
    }, async (params, response) => {
        return new Error(`Unexpected status ${response.statusCode} when connecting to ${fetchUrl.toString()}.\n` +
            `This does not look like a copilotbrowser server, try connecting via ws://.`);
    });
    const wsUrl = new URL(endpointURL);
    let wsEndpointPath = JSON.parse(json).wsEndpointPath;
    if (wsEndpointPath.startsWith('/'))
        wsEndpointPath = wsEndpointPath.substring(1);
    if (!wsUrl.pathname.endsWith('/'))
        wsUrl.pathname += '/';
    wsUrl.pathname += wsEndpointPath;
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return wsUrl.toString();
}
