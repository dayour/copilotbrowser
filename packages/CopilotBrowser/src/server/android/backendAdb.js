"use strict";
/**
 * Copyright Microsoft Corporation. All rights reserved.
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
exports.AdbBackend = void 0;
const events_1 = require("events");
const net_1 = __importDefault(require("net"));
const assert_1 = require("../../utils/isomorphic/assert");
const utilsBundle_1 = require("../../utilsBundle");
class AdbBackend {
    async devices(options = {}) {
        const result = await runCommand('host:devices', options.host, options.port);
        const lines = result.toString().trim().split('\n');
        return lines.map(line => {
            const [serial, status] = line.trim().split('\t');
            return new AdbDevice(serial, status, options.host, options.port);
        });
    }
}
exports.AdbBackend = AdbBackend;
class AdbDevice {
    serial;
    status;
    host;
    port;
    _closed = false;
    constructor(serial, status, host, port) {
        this.serial = serial;
        this.status = status;
        this.host = host;
        this.port = port;
    }
    async init() {
    }
    async close() {
        this._closed = true;
    }
    runCommand(command) {
        if (this._closed)
            throw new Error('Device is closed');
        return runCommand(command, this.host, this.port, this.serial);
    }
    async open(command) {
        if (this._closed)
            throw new Error('Device is closed');
        const result = await open(command, this.host, this.port, this.serial);
        result.becomeSocket();
        return result;
    }
}
async function runCommand(command, host = '127.0.0.1', port = 5037, serial) {
    (0, utilsBundle_1.debug)('pw:adb:runCommand')(command, serial);
    const socket = new BufferedSocketWrapper(command, net_1.default.createConnection({ host, port }));
    try {
        if (serial) {
            await socket.write(encodeMessage(`host:transport:${serial}`));
            const status = await socket.read(4);
            (0, assert_1.assert)(status.toString() === 'OKAY', status.toString());
        }
        await socket.write(encodeMessage(command));
        const status = await socket.read(4);
        (0, assert_1.assert)(status.toString() === 'OKAY', status.toString());
        let commandOutput;
        if (!command.startsWith('shell:')) {
            const remainingLength = parseInt((await socket.read(4)).toString(), 16);
            commandOutput = await socket.read(remainingLength);
        }
        else {
            commandOutput = await socket.readAll();
        }
        return commandOutput;
    }
    finally {
        socket.close();
    }
}
async function open(command, host = '127.0.0.1', port = 5037, serial) {
    const socket = new BufferedSocketWrapper(command, net_1.default.createConnection({ host, port }));
    if (serial) {
        await socket.write(encodeMessage(`host:transport:${serial}`));
        const status = await socket.read(4);
        (0, assert_1.assert)(status.toString() === 'OKAY', status.toString());
    }
    await socket.write(encodeMessage(command));
    const status = await socket.read(4);
    (0, assert_1.assert)(status.toString() === 'OKAY', status.toString());
    return socket;
}
function encodeMessage(message) {
    let lenHex = (message.length).toString(16);
    lenHex = '0'.repeat(4 - lenHex.length) + lenHex;
    return Buffer.from(lenHex + message);
}
class BufferedSocketWrapper extends events_1.EventEmitter {
    _socket;
    _buffer = Buffer.from([]);
    _isSocket = false;
    _notifyReader;
    _connectPromise;
    _isClosed = false;
    _command;
    constructor(command, socket) {
        super();
        this._command = command;
        this._socket = socket;
        this._connectPromise = new Promise(f => this._socket.on('connect', f));
        this._socket.on('data', data => {
            (0, utilsBundle_1.debug)('pw:adb:data')(data.toString());
            if (this._isSocket) {
                this.emit('data', data);
                return;
            }
            this._buffer = Buffer.concat([this._buffer, data]);
            if (this._notifyReader)
                this._notifyReader();
        });
        this._socket.on('close', () => {
            this._isClosed = true;
            if (this._notifyReader)
                this._notifyReader();
            this.close();
            this.emit('close');
        });
        this._socket.on('error', error => this.emit('error', error));
    }
    async write(data) {
        (0, utilsBundle_1.debug)('pw:adb:send')(data.toString().substring(0, 100) + '...');
        await this._connectPromise;
        await new Promise(f => this._socket.write(data, f));
    }
    close() {
        if (this._isClosed)
            return;
        (0, utilsBundle_1.debug)('pw:adb')('Close ' + this._command);
        this._socket.destroy();
    }
    async read(length) {
        await this._connectPromise;
        (0, assert_1.assert)(!this._isSocket, 'Can not read by length in socket mode');
        while (this._buffer.length < length)
            await new Promise(f => this._notifyReader = f);
        const result = this._buffer.slice(0, length);
        this._buffer = this._buffer.slice(length);
        (0, utilsBundle_1.debug)('pw:adb:recv')(result.toString().substring(0, 100) + '...');
        return result;
    }
    async readAll() {
        while (!this._isClosed)
            await new Promise(f => this._notifyReader = f);
        return this._buffer;
    }
    becomeSocket() {
        (0, assert_1.assert)(!this._buffer.length);
        this._isSocket = true;
    }
}
