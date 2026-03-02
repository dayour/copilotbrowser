"use strict";
/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WKSession = exports.WKConnection = exports.kPageProxyMessageReceived = exports.kBrowserCloseMessageId = void 0;
const events_1 = require("events");
const utils_1 = require("../../utils");
const debugLogger_1 = require("../utils/debugLogger");
const helper_1 = require("../helper");
const protocolError_1 = require("../protocolError");
// WKcopilotbrowser uses this special id to issue Browser.close command which we
// should ignore.
exports.kBrowserCloseMessageId = -9999;
// We emulate kPageProxyMessageReceived message to unify it with Browser.pageProxyCreated
// and Browser.pageProxyDestroyed for easier management.
exports.kPageProxyMessageReceived = Symbol('kPageProxyMessageReceived');
class WKConnection {
    _transport;
    _onDisconnect;
    _protocolLogger;
    _browserLogsCollector;
    _browserDisconnectedLogs;
    _lastId = 0;
    _closed = false;
    browserSession;
    constructor(transport, onDisconnect, protocolLogger, browserLogsCollector) {
        this._transport = transport;
        this._onDisconnect = onDisconnect;
        this._protocolLogger = protocolLogger;
        this._browserLogsCollector = browserLogsCollector;
        this.browserSession = new WKSession(this, '', (message) => {
            this.rawSend(message);
        });
        this._transport.onmessage = this._dispatchMessage.bind(this);
        // onclose should be set last, since it can be immediately called.
        this._transport.onclose = this._onClose.bind(this);
    }
    nextMessageId() {
        return ++this._lastId;
    }
    rawSend(message) {
        this._protocolLogger('send', message);
        this._transport.send(message);
    }
    _dispatchMessage(message) {
        this._protocolLogger('receive', message);
        if (message.id === exports.kBrowserCloseMessageId)
            return;
        if (message.pageProxyId) {
            const payload = { message: message, pageProxyId: message.pageProxyId };
            this.browserSession.dispatchMessage({ method: exports.kPageProxyMessageReceived, params: payload });
            return;
        }
        this.browserSession.dispatchMessage(message);
    }
    _onClose(reason) {
        this._closed = true;
        this._transport.onmessage = undefined;
        this._transport.onclose = undefined;
        this._browserDisconnectedLogs = helper_1.helper.formatBrowserLogs(this._browserLogsCollector.recentLogs(), reason);
        this.browserSession.dispose();
        this._onDisconnect();
    }
    isClosed() {
        return this._closed;
    }
    close() {
        if (!this._closed)
            this._transport.close();
    }
}
exports.WKConnection = WKConnection;
class WKSession extends events_1.EventEmitter {
    connection;
    sessionId;
    _disposed = false;
    _rawSend;
    _callbacks = new Map();
    _crashed = false;
    constructor(connection, sessionId, rawSend) {
        super();
        this.setMaxListeners(0);
        this.connection = connection;
        this.sessionId = sessionId;
        this._rawSend = rawSend;
    }
    async send(method, params) {
        if (this._crashed || this._disposed || this.connection._browserDisconnectedLogs)
            throw new protocolError_1.ProtocolError(this._crashed ? 'crashed' : 'closed', undefined, this.connection._browserDisconnectedLogs);
        const id = this.connection.nextMessageId();
        const messageObj = { id, method, params };
        this._rawSend(messageObj);
        return new Promise((resolve, reject) => {
            this._callbacks.set(id, { resolve, reject, error: new protocolError_1.ProtocolError('error', method) });
        });
    }
    sendMayFail(method, params) {
        return this.send(method, params).catch(error => debugLogger_1.debugLogger.log('error', error));
    }
    markAsCrashed() {
        this._crashed = true;
    }
    isDisposed() {
        return this._disposed;
    }
    dispose() {
        for (const callback of this._callbacks.values()) {
            callback.error.type = this._crashed ? 'crashed' : 'closed';
            callback.error.logs = this.connection._browserDisconnectedLogs;
            callback.reject(callback.error);
        }
        this._callbacks.clear();
        this._disposed = true;
    }
    dispatchMessage(object) {
        if (object.id && this._callbacks.has(object.id)) {
            const callback = this._callbacks.get(object.id);
            this._callbacks.delete(object.id);
            if (object.error) {
                callback.error.setMessage(object.error.message);
                callback.reject(callback.error);
            }
            else {
                callback.resolve(object.result);
            }
        }
        else if (object.id && !object.error) {
            // Response might come after session has been disposed and rejected all callbacks.
            (0, utils_1.assert)(this.isDisposed(), JSON.stringify(object));
        }
        else {
            Promise.resolve().then(() => this.emit(object.method, object.params));
        }
    }
}
exports.WKSession = WKSession;
