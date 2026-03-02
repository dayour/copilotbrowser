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
exports.copilotbrowserConnection = void 0;
const server_1 = require("../server");
const android_1 = require("../server/android/android");
const browser_1 = require("../server/browser");
const debugControllerDispatcher_1 = require("../server/dispatchers/debugControllerDispatcher");
const profiler_1 = require("../server/utils/profiler");
const utils_1 = require("../utils");
const debugLogger_1 = require("../server/utils/debugLogger");
class copilotbrowserConnection {
    _ws;
    _semaphore;
    _dispatcherConnection;
    _cleanups = [];
    _id;
    _disconnected = false;
    _root;
    _profileName;
    constructor(semaphore, ws, controller, copilotbrowser, initialize, id) {
        this._ws = ws;
        this._semaphore = semaphore;
        this._id = id;
        this._profileName = new Date().toISOString();
        const lock = this._semaphore.acquire();
        this._dispatcherConnection = new server_1.DispatcherConnection();
        this._dispatcherConnection.onmessage = async (message) => {
            await lock;
            if (ws.readyState !== ws.CLOSING) {
                const messageString = JSON.stringify(message);
                if (debugLogger_1.debugLogger.isEnabled('server:channel'))
                    debugLogger_1.debugLogger.log('server:channel', `[${this._id}] ${(0, utils_1.monotonicTime)() * 1000} SEND ► ${messageString}`);
                if (debugLogger_1.debugLogger.isEnabled('server:metadata'))
                    this.logServerMetadata(message, messageString, 'SEND');
                ws.send(messageString);
            }
        };
        ws.on('message', async (message) => {
            await lock;
            const messageString = Buffer.from(message).toString();
            const jsonMessage = JSON.parse(messageString);
            if (debugLogger_1.debugLogger.isEnabled('server:channel'))
                debugLogger_1.debugLogger.log('server:channel', `[${this._id}] ${(0, utils_1.monotonicTime)() * 1000} ◀ RECV ${messageString}`);
            if (debugLogger_1.debugLogger.isEnabled('server:metadata'))
                this.logServerMetadata(jsonMessage, messageString, 'RECV');
            this._dispatcherConnection.dispatch(jsonMessage);
        });
        ws.on('close', () => this._onDisconnect());
        ws.on('error', (error) => this._onDisconnect(error));
        if (controller) {
            debugLogger_1.debugLogger.log('server', `[${this._id}] engaged reuse controller mode`);
            this._root = new debugControllerDispatcher_1.DebugControllerDispatcher(this._dispatcherConnection, copilotbrowser.debugController);
            return;
        }
        this._root = new server_1.RootDispatcher(this._dispatcherConnection, async (scope, params) => {
            await (0, profiler_1.startProfiling)();
            const options = await initialize();
            if (options.preLaunchedBrowser) {
                const browser = options.preLaunchedBrowser;
                browser.options.sdkLanguage = params.sdkLanguage;
                browser.on(browser_1.Browser.Events.Disconnected, () => {
                    // Underlying browser did close for some reason - force disconnect the client.
                    this.close({ code: 1001, reason: 'Browser closed' });
                });
            }
            if (options.preLaunchedAndroidDevice) {
                const androidDevice = options.preLaunchedAndroidDevice;
                androidDevice.on(android_1.AndroidDevice.Events.Close, () => {
                    // Underlying android device did close for some reason - force disconnect the client.
                    this.close({ code: 1001, reason: 'Android device disconnected' });
                });
            }
            if (options.dispose)
                this._cleanups.push(options.dispose);
            const dispatcher = new server_1.copilotbrowserDispatcher(scope, copilotbrowser, options);
            this._cleanups.push(() => dispatcher.cleanup());
            return dispatcher;
        });
    }
    async _onDisconnect(error) {
        this._disconnected = true;
        debugLogger_1.debugLogger.log('server', `[${this._id}] disconnected. error: ${error}`);
        await this._root.stopPendingOperations(new Error('Disconnected')).catch(() => { });
        this._root._dispose();
        debugLogger_1.debugLogger.log('server', `[${this._id}] starting cleanup`);
        for (const cleanup of this._cleanups)
            await cleanup().catch(() => { });
        await (0, profiler_1.stopProfiling)(this._profileName);
        this._semaphore.release();
        debugLogger_1.debugLogger.log('server', `[${this._id}] finished cleanup`);
    }
    logServerMetadata(message, messageString, direction) {
        const serverLogMetadata = {
            wallTime: Date.now(),
            id: message.id,
            guid: message.guid,
            method: message.method,
            payloadSizeInBytes: Buffer.byteLength(messageString, 'utf-8')
        };
        debugLogger_1.debugLogger.log('server:metadata', (direction === 'SEND' ? 'SEND ► ' : '◀ RECV ') + JSON.stringify(serverLogMetadata));
    }
    async close(reason) {
        if (this._disconnected)
            return;
        debugLogger_1.debugLogger.log('server', `[${this._id}] force closing connection: ${reason?.reason || ''} (${reason?.code || 0})`);
        try {
            this._ws.close(reason?.code, reason?.reason);
        }
        catch (e) {
        }
    }
}
exports.copilotbrowserConnection = copilotbrowserConnection;
