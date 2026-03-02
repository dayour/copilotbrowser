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
exports.nodePlatform = void 0;
exports.setBoxedStackPrefixes = setBoxedStackPrefixes;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util = __importStar(require("util"));
const stream_1 = require("stream");
const events_1 = require("events");
const utilsBundle_1 = require("../../utilsBundle");
const debugLogger_1 = require("./debugLogger");
const zones_1 = require("./zones");
const debug_1 = require("./debug");
const mcpBundle_1 = require("../../mcpBundle");
const pipelineAsync = util.promisify(stream_1.pipeline);
class NodeZone {
    _zone;
    constructor(zone) {
        this._zone = zone;
    }
    push(data) {
        return new NodeZone(this._zone.with('apiZone', data));
    }
    pop() {
        return new NodeZone(this._zone.without('apiZone'));
    }
    run(func) {
        return this._zone.run(func);
    }
    data() {
        return this._zone.data('apiZone');
    }
}
let boxedStackPrefixes = [];
function setBoxedStackPrefixes(prefixes) {
    boxedStackPrefixes = prefixes;
}
const coreDir = path_1.default.dirname(require.resolve('../../../package.json'));
exports.nodePlatform = {
    name: 'node',
    boxedStackPrefixes: () => {
        if (process.env.PWDEBUGIMPL)
            return [];
        return [coreDir, ...boxedStackPrefixes];
    },
    calculateSha1: (text) => {
        const sha1 = crypto_1.default.createHash('sha1');
        sha1.update(text);
        return Promise.resolve(sha1.digest('hex'));
    },
    colors: utilsBundle_1.colors,
    coreDir,
    createGuid: () => crypto_1.default.randomBytes(16).toString('hex'),
    defaultMaxListeners: () => events_1.EventEmitter.defaultMaxListeners,
    fs: () => fs_1.default,
    env: process.env,
    inspectCustom: util.inspect.custom,
    isDebugMode: () => (0, debug_1.debugMode)() === 'inspector',
    isJSDebuggerAttached: () => !!require('inspector').url(),
    isLogEnabled(name) {
        return debugLogger_1.debugLogger.isEnabled(name);
    },
    isUnderTest: () => (0, debug_1.isUnderTest)(),
    log(name, message) {
        debugLogger_1.debugLogger.log(name, message);
    },
    path: () => path_1.default,
    pathSeparator: path_1.default.sep,
    showInternalStackFrames: () => !!process.env.PWDEBUGIMPL,
    async streamFile(path, stream) {
        await pipelineAsync(fs_1.default.createReadStream(path), stream);
    },
    streamReadable: (channel) => {
        return new ReadableStreamImpl(channel);
    },
    streamWritable: (channel) => {
        return new WritableStreamImpl(channel);
    },
    zodToJsonSchema: (schema) => {
        // https://zod.dev/library-authors?id=how-to-support-zod-3-and-zod-4-simultaneously
        if ('_zod' in schema)
            return mcpBundle_1.z.toJSONSchema(schema);
        return (0, mcpBundle_1.zodToJsonSchema)(schema);
    },
    zones: {
        current: () => new NodeZone((0, zones_1.currentZone)()),
        empty: new NodeZone(zones_1.emptyZone),
    }
};
class ReadableStreamImpl extends stream_1.Readable {
    _channel;
    constructor(channel) {
        super();
        this._channel = channel;
    }
    async _read() {
        const result = await this._channel.read({ size: 1024 * 1024 });
        if (result.binary.byteLength)
            this.push(result.binary);
        else
            this.push(null);
    }
    _destroy(error, callback) {
        // Stream might be destroyed after the connection was closed.
        this._channel.close().catch(e => null);
        super._destroy(error, callback);
    }
}
class WritableStreamImpl extends stream_1.Writable {
    _channel;
    constructor(channel) {
        super();
        this._channel = channel;
    }
    async _write(chunk, encoding, callback) {
        const error = await this._channel.write({ binary: typeof chunk === 'string' ? Buffer.from(chunk) : chunk }).catch(e => e);
        callback(error || null);
    }
    async _final(callback) {
        // Stream might be destroyed after the connection was closed.
        const error = await this._channel.close().catch(e => e);
        callback(error || null);
    }
}
