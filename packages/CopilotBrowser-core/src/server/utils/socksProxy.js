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
exports.SocksProxyHandler = exports.SocksProxy = void 0;
exports.parsePattern = parsePattern;
const events_1 = __importDefault(require("events"));
const net_1 = __importDefault(require("net"));
const assert_1 = require("../../utils/isomorphic/assert");
const crypto_1 = require("./crypto");
const debugLogger_1 = require("./debugLogger");
const happyEyeballs_1 = require("./happyEyeballs");
// https://tools.ietf.org/html/rfc1928
var SocksAuth;
(function (SocksAuth) {
    SocksAuth[SocksAuth["NO_AUTHENTICATION_REQUIRED"] = 0] = "NO_AUTHENTICATION_REQUIRED";
    SocksAuth[SocksAuth["GSSAPI"] = 1] = "GSSAPI";
    SocksAuth[SocksAuth["USERNAME_PASSWORD"] = 2] = "USERNAME_PASSWORD";
    SocksAuth[SocksAuth["NO_ACCEPTABLE_METHODS"] = 255] = "NO_ACCEPTABLE_METHODS";
})(SocksAuth || (SocksAuth = {}));
var SocksAddressType;
(function (SocksAddressType) {
    SocksAddressType[SocksAddressType["IPv4"] = 1] = "IPv4";
    SocksAddressType[SocksAddressType["FqName"] = 3] = "FqName";
    SocksAddressType[SocksAddressType["IPv6"] = 4] = "IPv6";
})(SocksAddressType || (SocksAddressType = {}));
var SocksCommand;
(function (SocksCommand) {
    SocksCommand[SocksCommand["CONNECT"] = 1] = "CONNECT";
    SocksCommand[SocksCommand["BIND"] = 2] = "BIND";
    SocksCommand[SocksCommand["UDP_ASSOCIATE"] = 3] = "UDP_ASSOCIATE";
})(SocksCommand || (SocksCommand = {}));
var SocksReply;
(function (SocksReply) {
    SocksReply[SocksReply["Succeeded"] = 0] = "Succeeded";
    SocksReply[SocksReply["GeneralServerFailure"] = 1] = "GeneralServerFailure";
    SocksReply[SocksReply["NotAllowedByRuleSet"] = 2] = "NotAllowedByRuleSet";
    SocksReply[SocksReply["NetworkUnreachable"] = 3] = "NetworkUnreachable";
    SocksReply[SocksReply["HostUnreachable"] = 4] = "HostUnreachable";
    SocksReply[SocksReply["ConnectionRefused"] = 5] = "ConnectionRefused";
    SocksReply[SocksReply["TtlExpired"] = 6] = "TtlExpired";
    SocksReply[SocksReply["CommandNotSupported"] = 7] = "CommandNotSupported";
    SocksReply[SocksReply["AddressTypeNotSupported"] = 8] = "AddressTypeNotSupported";
})(SocksReply || (SocksReply = {}));
class SocksConnection {
    _buffer = Buffer.from([]);
    _offset = 0;
    _fence = 0;
    _fenceCallback;
    _socket;
    _boundOnData;
    _uid;
    _client;
    constructor(uid, socket, client) {
        this._uid = uid;
        this._socket = socket;
        this._client = client;
        this._boundOnData = this._onData.bind(this);
        socket.on('data', this._boundOnData);
        socket.on('close', () => this._onClose());
        socket.on('end', () => this._onClose());
        socket.on('error', () => this._onClose());
        this._run().catch(() => this._socket.end());
    }
    async _run() {
        (0, assert_1.assert)(await this._authenticate());
        const { command, host, port } = await this._parseRequest();
        if (command !== SocksCommand.CONNECT) {
            this._writeBytes(Buffer.from([
                0x05,
                SocksReply.CommandNotSupported,
                0x00, // RSV
                0x01, // IPv4
                0x00, 0x00, 0x00, 0x00, // Address
                0x00, 0x00 // Port
            ]));
            return;
        }
        this._socket.off('data', this._boundOnData);
        this._client.onSocketRequested({ uid: this._uid, host, port });
    }
    async _authenticate() {
        // Request:
        // +----+----------+----------+
        // |VER | NMETHODS | METHODS  |
        // +----+----------+----------+
        // | 1  |    1     | 1 to 255 |
        // +----+----------+----------+
        // Response:
        // +----+--------+
        // |VER | METHOD |
        // +----+--------+
        // | 1  |   1    |
        // +----+--------+
        const version = await this._readByte();
        (0, assert_1.assert)(version === 0x05, 'The VER field must be set to x05 for this version of the protocol, was ' + version);
        const nMethods = await this._readByte();
        (0, assert_1.assert)(nMethods, 'No authentication methods specified');
        const methods = await this._readBytes(nMethods);
        for (const method of methods) {
            if (method === 0) {
                this._writeBytes(Buffer.from([version, method]));
                return true;
            }
        }
        this._writeBytes(Buffer.from([version, SocksAuth.NO_ACCEPTABLE_METHODS]));
        return false;
    }
    async _parseRequest() {
        // Request.
        // +----+-----+-------+------+----------+----------+
        // |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
        // +----+-----+-------+------+----------+----------+
        // | 1  |  1  | X'00' |  1   | Variable |    2     |
        // +----+-----+-------+------+----------+----------+
        // Response.
        // +----+-----+-------+------+----------+----------+
        // |VER | REP |  RSV  | ATYP | BND.ADDR | BND.PORT |
        // +----+-----+-------+------+----------+----------+
        // | 1  |  1  | X'00' |  1   | Variable |    2     |
        // +----+-----+-------+------+----------+----------+
        const version = await this._readByte();
        (0, assert_1.assert)(version === 0x05, 'The VER field must be set to x05 for this version of the protocol, was ' + version);
        const command = await this._readByte();
        await this._readByte(); // skip reserved.
        const addressType = await this._readByte();
        let host = '';
        switch (addressType) {
            case SocksAddressType.IPv4:
                host = (await this._readBytes(4)).join('.');
                break;
            case SocksAddressType.FqName:
                const length = await this._readByte();
                host = (await this._readBytes(length)).toString();
                break;
            case SocksAddressType.IPv6:
                const bytes = await this._readBytes(16);
                const tokens = [];
                for (let i = 0; i < 8; ++i)
                    tokens.push(bytes.readUInt16BE(i * 2).toString(16));
                host = tokens.join(':');
                break;
        }
        const port = (await this._readBytes(2)).readUInt16BE(0);
        this._buffer = Buffer.from([]);
        this._offset = 0;
        this._fence = 0;
        return {
            command,
            host,
            port
        };
    }
    async _readByte() {
        const buffer = await this._readBytes(1);
        return buffer[0];
    }
    async _readBytes(length) {
        this._fence = this._offset + length;
        if (!this._buffer || this._buffer.length < this._fence)
            await new Promise(f => this._fenceCallback = f);
        this._offset += length;
        return this._buffer.slice(this._offset - length, this._offset);
    }
    _writeBytes(buffer) {
        if (this._socket.writable)
            this._socket.write(buffer);
    }
    _onClose() {
        this._client.onSocketClosed({ uid: this._uid });
    }
    _onData(buffer) {
        this._buffer = Buffer.concat([this._buffer, buffer]);
        if (this._fenceCallback && this._buffer.length >= this._fence) {
            const callback = this._fenceCallback;
            this._fenceCallback = undefined;
            callback();
        }
    }
    socketConnected(host, port) {
        this._writeBytes(Buffer.from([
            0x05,
            SocksReply.Succeeded,
            0x00, // RSV
            ...ipToSocksAddress(host), // ATYP, Address
            port >> 8, port & 0xFF // Port
        ]));
        this._socket.on('data', data => this._client.onSocketData({ uid: this._uid, data: data }));
    }
    socketFailed(errorCode) {
        const buffer = Buffer.from([
            0x05,
            0,
            0x00, // RSV
            ...ipToSocksAddress('0.0.0.0'), // ATYP, Address
            0, 0 // Port
        ]);
        switch (errorCode) {
            case 'ENOENT':
            case 'ENOTFOUND':
            case 'ETIMEDOUT':
            case 'EHOSTUNREACH':
                buffer[1] = SocksReply.HostUnreachable;
                break;
            case 'ENETUNREACH':
                buffer[1] = SocksReply.NetworkUnreachable;
                break;
            case 'ECONNREFUSED':
                buffer[1] = SocksReply.ConnectionRefused;
                break;
            case 'ERULESET':
                buffer[1] = SocksReply.NotAllowedByRuleSet;
                break;
        }
        this._writeBytes(buffer);
        this._socket.end();
    }
    sendData(data) {
        this._socket.write(data);
    }
    end() {
        this._socket.end();
    }
    error(error) {
        this._socket.destroy(new Error(error));
    }
}
function hexToNumber(hex) {
    // Note: parseInt has a few issues including ignoring trailing characters and allowing leading 0x.
    return [...hex].reduce((value, digit) => {
        const code = digit.charCodeAt(0);
        if (code >= 48 && code <= 57) // 0..9
            return value + code;
        if (code >= 97 && code <= 102) // a..f
            return value + (code - 97) + 10;
        if (code >= 65 && code <= 70) // A..F
            return value + (code - 65) + 10;
        throw new Error('Invalid IPv6 token ' + hex);
    }, 0);
}
function ipToSocksAddress(address) {
    if (net_1.default.isIPv4(address)) {
        return [
            0x01, // IPv4
            ...address.split('.', 4).map(t => (+t) & 0xFF), // Address
        ];
    }
    if (net_1.default.isIPv6(address)) {
        const result = [0x04]; // IPv6
        const tokens = address.split(':', 8);
        while (tokens.length < 8)
            tokens.unshift('');
        for (const token of tokens) {
            const value = hexToNumber(token);
            result.push((value >> 8) & 0xFF, value & 0xFF); // Big-endian
        }
        return result;
    }
    throw new Error('Only IPv4 and IPv6 addresses are supported');
}
function starMatchToRegex(pattern) {
    const source = pattern.split('*').map(s => {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('.*');
    return new RegExp('^' + source + '$');
}
// This follows "Proxy bypass rules" syntax without implicit and negative rules.
// https://source.chromium.org/chromium/chromium/src/+/main:net/docs/proxy.md;l=331
function parsePattern(pattern) {
    if (!pattern)
        return () => false;
    const matchers = pattern.split(',').map(token => {
        const match = token.match(/^(.*?)(?::(\d+))?$/);
        if (!match)
            throw new Error(`Unsupported token "${token}" in pattern "${pattern}"`);
        const tokenPort = match[2] ? +match[2] : undefined;
        const portMatches = (port) => tokenPort === undefined || tokenPort === port;
        let tokenHost = match[1];
        if (tokenHost === '<loopback>') {
            return (host, port) => {
                if (!portMatches(port))
                    return false;
                return host === 'localhost'
                    || host.endsWith('.localhost')
                    || host === '127.0.0.1'
                    || host === '[::1]';
            };
        }
        if (tokenHost === '*')
            return (host, port) => portMatches(port);
        if (net_1.default.isIPv4(tokenHost) || net_1.default.isIPv6(tokenHost))
            return (host, port) => host === tokenHost && portMatches(port);
        if (tokenHost[0] === '.')
            tokenHost = '*' + tokenHost;
        const tokenRegex = starMatchToRegex(tokenHost);
        return (host, port) => {
            if (!portMatches(port))
                return false;
            if (net_1.default.isIPv4(host) || net_1.default.isIPv6(host))
                return false;
            return !!host.match(tokenRegex);
        };
    });
    return (host, port) => matchers.some(matcher => matcher(host, port));
}
class SocksProxy extends events_1.default {
    static Events = {
        SocksRequested: 'socksRequested',
        SocksData: 'socksData',
        SocksClosed: 'socksClosed',
    };
    _server;
    _connections = new Map();
    _sockets = new Set();
    _closed = false;
    _port;
    _patternMatcher = () => false;
    _directSockets = new Map();
    constructor() {
        super();
        this._server = new net_1.default.Server((socket) => {
            const uid = (0, crypto_1.createGuid)();
            const connection = new SocksConnection(uid, socket, this);
            this._connections.set(uid, connection);
        });
        this._server.on('connection', socket => {
            if (this._closed) {
                socket.destroy();
                return;
            }
            this._sockets.add(socket);
            socket.once('close', () => this._sockets.delete(socket));
        });
    }
    setPattern(pattern) {
        try {
            this._patternMatcher = parsePattern(pattern);
        }
        catch (e) {
            this._patternMatcher = () => false;
        }
    }
    async _handleDirect(request) {
        try {
            const socket = await (0, happyEyeballs_1.createSocket)(request.host, request.port);
            socket.on('data', data => this._connections.get(request.uid)?.sendData(data));
            socket.on('error', error => {
                this._connections.get(request.uid)?.error(error.message);
                this._directSockets.delete(request.uid);
            });
            socket.on('end', () => {
                this._connections.get(request.uid)?.end();
                this._directSockets.delete(request.uid);
            });
            const localAddress = socket.localAddress;
            const localPort = socket.localPort;
            this._directSockets.set(request.uid, socket);
            this._connections.get(request.uid)?.socketConnected(localAddress, localPort);
        }
        catch (error) {
            this._connections.get(request.uid)?.socketFailed(error.code);
        }
    }
    port() {
        return this._port;
    }
    async listen(port, hostname) {
        return new Promise(f => {
            this._server.listen(port, hostname, () => {
                const port = this._server.address().port;
                this._port = port;
                f(port);
            });
        });
    }
    async close() {
        if (this._closed)
            return;
        this._closed = true;
        for (const socket of this._sockets)
            socket.destroy();
        this._sockets.clear();
        await new Promise(f => this._server.close(f));
    }
    onSocketRequested(payload) {
        if (!this._patternMatcher(payload.host, payload.port)) {
            this._handleDirect(payload);
            return;
        }
        this.emit(SocksProxy.Events.SocksRequested, payload);
    }
    onSocketData(payload) {
        const direct = this._directSockets.get(payload.uid);
        if (direct) {
            direct.write(payload.data);
            return;
        }
        this.emit(SocksProxy.Events.SocksData, payload);
    }
    onSocketClosed(payload) {
        const direct = this._directSockets.get(payload.uid);
        if (direct) {
            direct.destroy();
            this._directSockets.delete(payload.uid);
            return;
        }
        this.emit(SocksProxy.Events.SocksClosed, payload);
    }
    socketConnected({ uid, host, port }) {
        this._connections.get(uid)?.socketConnected(host, port);
    }
    socketFailed({ uid, errorCode }) {
        this._connections.get(uid)?.socketFailed(errorCode);
    }
    sendSocketData({ uid, data }) {
        this._connections.get(uid)?.sendData(data);
    }
    sendSocketEnd({ uid }) {
        this._connections.get(uid)?.end();
    }
    sendSocketError({ uid, error }) {
        this._connections.get(uid)?.error(error);
    }
}
exports.SocksProxy = SocksProxy;
class SocksProxyHandler extends events_1.default {
    static Events = {
        SocksConnected: 'socksConnected',
        SocksData: 'socksData',
        SocksError: 'socksError',
        SocksFailed: 'socksFailed',
        SocksEnd: 'socksEnd',
    };
    _sockets = new Map();
    _patternMatcher = () => false;
    _redirectPortForTest;
    constructor(pattern, redirectPortForTest) {
        super();
        this._patternMatcher = parsePattern(pattern);
        this._redirectPortForTest = redirectPortForTest;
    }
    cleanup() {
        for (const uid of this._sockets.keys())
            this.socketClosed({ uid });
    }
    async socketRequested({ uid, host, port }) {
        debugLogger_1.debugLogger.log('socks', `[${uid}] => request ${host}:${port}`);
        if (!this._patternMatcher(host, port)) {
            const payload = { uid, errorCode: 'ERULESET' };
            debugLogger_1.debugLogger.log('socks', `[${uid}] <= pattern error ${payload.errorCode}`);
            this.emit(SocksProxyHandler.Events.SocksFailed, payload);
            return;
        }
        if (host === 'local.copilotbrowser')
            host = 'localhost';
        try {
            if (this._redirectPortForTest)
                port = this._redirectPortForTest;
            const socket = await (0, happyEyeballs_1.createSocket)(host, port);
            socket.on('data', data => {
                const payload = { uid, data: data };
                this.emit(SocksProxyHandler.Events.SocksData, payload);
            });
            socket.on('error', error => {
                const payload = { uid, error: error.message };
                debugLogger_1.debugLogger.log('socks', `[${uid}] <= network socket error ${payload.error}`);
                this.emit(SocksProxyHandler.Events.SocksError, payload);
                this._sockets.delete(uid);
            });
            socket.on('end', () => {
                const payload = { uid };
                debugLogger_1.debugLogger.log('socks', `[${uid}] <= network socket closed`);
                this.emit(SocksProxyHandler.Events.SocksEnd, payload);
                this._sockets.delete(uid);
            });
            const localAddress = socket.localAddress;
            const localPort = socket.localPort;
            this._sockets.set(uid, socket);
            const payload = { uid, host: localAddress, port: localPort };
            debugLogger_1.debugLogger.log('socks', `[${uid}] <= connected to network ${payload.host}:${payload.port}`);
            this.emit(SocksProxyHandler.Events.SocksConnected, payload);
        }
        catch (error) {
            const payload = { uid, errorCode: error.code };
            debugLogger_1.debugLogger.log('socks', `[${uid}] <= connect error ${payload.errorCode}`);
            this.emit(SocksProxyHandler.Events.SocksFailed, payload);
        }
    }
    sendSocketData({ uid, data }) {
        this._sockets.get(uid)?.write(data);
    }
    socketClosed({ uid }) {
        debugLogger_1.debugLogger.log('socks', `[${uid}] <= browser socket closed`);
        this._sockets.get(uid)?.destroy();
        this._sockets.delete(uid);
    }
}
exports.SocksProxyHandler = SocksProxyHandler;
