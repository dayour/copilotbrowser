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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocksInterceptor = void 0;
const events_1 = __importDefault(require("events"));
const socks = __importStar(require("./utils/socksProxy"));
const validator_1 = require("../protocol/validator");
const debug_1 = require("./utils/debug");
class SocksInterceptor {
    _handler;
    _channel;
    _socksSupportObjectGuid;
    _ids = new Set();
    constructor(transport, pattern, redirectPortForTest) {
        this._handler = new socks.SocksProxyHandler(pattern, redirectPortForTest);
        let lastId = -1;
        this._channel = new Proxy(new events_1.default(), {
            get: (obj, prop) => {
                if ((prop in obj) || obj[prop] !== undefined || typeof prop !== 'string')
                    return obj[prop];
                return (params) => {
                    try {
                        const id = --lastId;
                        this._ids.add(id);
                        const validator = (0, validator_1.findValidator)('SocksSupport', prop, 'Params');
                        params = validator(params, '', { tChannelImpl: tChannelForSocks, binary: 'toBase64', isUnderTest: debug_1.isUnderTest });
                        transport.send({ id, guid: this._socksSupportObjectGuid, method: prop, params, metadata: { stack: [], apiName: '', internal: true } });
                    }
                    catch (e) {
                    }
                };
            },
        });
        this._handler.on(socks.SocksProxyHandler.Events.SocksConnected, (payload) => this._channel.socksConnected(payload));
        this._handler.on(socks.SocksProxyHandler.Events.SocksData, (payload) => this._channel.socksData(payload));
        this._handler.on(socks.SocksProxyHandler.Events.SocksError, (payload) => this._channel.socksError(payload));
        this._handler.on(socks.SocksProxyHandler.Events.SocksFailed, (payload) => this._channel.socksFailed(payload));
        this._handler.on(socks.SocksProxyHandler.Events.SocksEnd, (payload) => this._channel.socksEnd(payload));
        this._channel.on('socksRequested', payload => this._handler.socketRequested(payload));
        this._channel.on('socksClosed', payload => this._handler.socketClosed(payload));
        this._channel.on('socksData', payload => this._handler.sendSocketData(payload));
    }
    cleanup() {
        this._handler.cleanup();
    }
    interceptMessage(message) {
        if (this._ids.has(message.id)) {
            this._ids.delete(message.id);
            return true;
        }
        if (message.method === '__create__' && message.params.type === 'SocksSupport') {
            this._socksSupportObjectGuid = message.params.guid;
            return false;
        }
        if (this._socksSupportObjectGuid && message.guid === this._socksSupportObjectGuid) {
            const validator = (0, validator_1.findValidator)('SocksSupport', message.method, 'Event');
            const params = validator(message.params, '', { tChannelImpl: tChannelForSocks, binary: 'fromBase64', isUnderTest: debug_1.isUnderTest });
            this._channel.emit(message.method, params);
            return true;
        }
        return false;
    }
}
exports.SocksInterceptor = SocksInterceptor;
function tChannelForSocks(names, arg, path, context) {
    throw new validator_1.ValidationError(`${path}: channels are not expected in SocksSupport`);
}
