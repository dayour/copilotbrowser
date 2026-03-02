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
exports.httpHappyEyeballsAgent = exports.httpsHappyEyeballsAgent = void 0;
exports.createSocket = createSocket;
exports.createTLSSocket = createTLSSocket;
exports.createConnectionAsync = createConnectionAsync;
exports.timingForSocket = timingForSocket;
const dns_1 = __importDefault(require("dns"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const net_1 = __importDefault(require("net"));
const tls_1 = __importDefault(require("tls"));
const assert_1 = require("../../utils/isomorphic/assert");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
const time_1 = require("../../utils/isomorphic/time");
// Implementation(partial) of Happy Eyeballs 2 algorithm described in
// https://www.rfc-editor.org/rfc/rfc8305
// Same as in Chromium (https://source.chromium.org/chromium/chromium/src/+/5666ff4f5077a7e2f72902f3a95f5d553ea0d88d:net/socket/transport_connect_job.cc;l=102)
const connectionAttemptDelayMs = 300;
const kDNSLookupAt = Symbol('kDNSLookupAt');
const kTCPConnectionAt = Symbol('kTCPConnectionAt');
class HttpHappyEyeballsAgent extends http_1.default.Agent {
    // @ts-ignore - return type intentionally differs for happy eyeballs
    createConnection(options, oncreate) {
        // There is no ambiguity in case of IP address.
        if (net_1.default.isIP(clientRequestArgsToHostName(options)))
            return net_1.default.createConnection(options);
        createConnectionAsync(options, oncreate, /* useTLS */ false).catch(err => oncreate?.(err));
    }
}
class HttpsHappyEyeballsAgent extends https_1.default.Agent {
    // @ts-ignore - return type intentionally differs for happy eyeballs
    createConnection(options, oncreate) {
        // There is no ambiguity in case of IP address.
        if (net_1.default.isIP(clientRequestArgsToHostName(options)))
            return tls_1.default.connect(options);
        createConnectionAsync(options, oncreate, /* useTLS */ true).catch(err => oncreate?.(err));
    }
}
// These options are aligned with the default Node.js globalAgent options.
exports.httpsHappyEyeballsAgent = new HttpsHappyEyeballsAgent({ keepAlive: true });
exports.httpHappyEyeballsAgent = new HttpHappyEyeballsAgent({ keepAlive: true });
async function createSocket(host, port) {
    return new Promise((resolve, reject) => {
        if (net_1.default.isIP(host)) {
            const socket = net_1.default.createConnection({ host, port });
            socket.on('connect', () => resolve(socket));
            socket.on('error', error => reject(error));
        }
        else {
            createConnectionAsync({ host, port }, (err, socket) => {
                if (err)
                    reject(err);
                if (socket)
                    resolve(socket);
            }, /* useTLS */ false).catch(err => reject(err));
        }
    });
}
async function createTLSSocket(options) {
    return new Promise((resolve, reject) => {
        (0, assert_1.assert)(options.host, 'host is required');
        if (net_1.default.isIP(options.host)) {
            const socket = tls_1.default.connect(options);
            socket.on('secureConnect', () => resolve(socket));
            socket.on('error', error => reject(error));
        }
        else {
            createConnectionAsync(options, (err, socket) => {
                if (err)
                    reject(err);
                if (socket) {
                    socket.on('secureConnect', () => resolve(socket));
                    socket.on('error', error => reject(error));
                }
            }, true).catch(err => reject(err));
        }
    });
}
async function createConnectionAsync(options, oncreate, useTLS) {
    const lookup = options.__testHookLookup || lookupAddresses;
    const hostname = clientRequestArgsToHostName(options);
    const addresses = await lookup(hostname);
    const dnsLookupAt = (0, time_1.monotonicTime)();
    const sockets = new Set();
    let firstError;
    let errorCount = 0;
    const handleError = (socket, err) => {
        if (!sockets.delete(socket))
            return;
        ++errorCount;
        firstError ??= err;
        if (errorCount === addresses.length)
            oncreate?.(firstError);
    };
    const connected = new manualPromise_1.ManualPromise();
    for (const { address } of addresses) {
        const socket = useTLS ?
            tls_1.default.connect({
                ...options,
                port: options.port,
                host: address,
                servername: hostname
            }) :
            net_1.default.createConnection({
                ...options,
                port: options.port,
                host: address
            });
        socket[kDNSLookupAt] = dnsLookupAt;
        // Each socket may fire only one of 'connect', 'timeout' or 'error' events.
        // None of these events are fired after socket.destroy() is called.
        socket.on('connect', () => {
            socket[kTCPConnectionAt] = (0, time_1.monotonicTime)();
            connected.resolve();
            oncreate?.(null, socket);
            // TODO: Cache the result?
            // Close other outstanding sockets.
            sockets.delete(socket);
            for (const s of sockets)
                s.destroy();
            sockets.clear();
        });
        socket.on('timeout', () => {
            // Timeout is not an error, so we have to manually close the socket.
            socket.destroy();
            handleError(socket, new Error('Connection timeout'));
        });
        socket.on('error', e => handleError(socket, e));
        sockets.add(socket);
        await Promise.race([
            connected,
            new Promise(f => setTimeout(f, connectionAttemptDelayMs))
        ]);
        if (connected.isDone())
            break;
    }
}
async function lookupAddresses(hostname) {
    const addresses = await dns_1.default.promises.lookup(hostname, { all: true, family: 0, verbatim: true });
    let firstFamily = addresses.filter(({ family }) => family === 6);
    let secondFamily = addresses.filter(({ family }) => family === 4);
    // Make sure first address in the list is the same as in the original order.
    if (firstFamily.length && firstFamily[0] !== addresses[0]) {
        const tmp = firstFamily;
        firstFamily = secondFamily;
        secondFamily = tmp;
    }
    const result = [];
    // Alternate ipv6 and ipv4 addresses.
    for (let i = 0; i < Math.max(firstFamily.length, secondFamily.length); i++) {
        if (firstFamily[i])
            result.push(firstFamily[i]);
        if (secondFamily[i])
            result.push(secondFamily[i]);
    }
    return result;
}
function clientRequestArgsToHostName(options) {
    if (options.hostname)
        return options.hostname;
    if (options.host)
        return options.host;
    throw new Error('Either options.hostname or options.host must be provided');
}
function timingForSocket(socket) {
    return {
        dnsLookupAt: socket[kDNSLookupAt],
        tcpConnectionAt: socket[kTCPConnectionAt],
    };
}
