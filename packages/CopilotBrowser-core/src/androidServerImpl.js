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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidServerLauncherImpl = void 0;
const copilotbrowserServer_1 = require("./remote/copilotbrowserServer");
const copilotbrowser_1 = require("./server/copilotbrowser");
const crypto_1 = require("./server/utils/crypto");
const utilsBundle_1 = require("./utilsBundle");
const progress_1 = require("./server/progress");
class AndroidServerLauncherImpl {
    async launchServer(options = {}) {
        const copilotbrowser = (0, copilotbrowser_1.createcopilotbrowser)({ sdkLanguage: 'javascript', isServer: true });
        // 1. Pre-connect to the device
        const controller = new progress_1.ProgressController();
        let devices = await controller.run(progress => copilotbrowser.android.devices(progress, {
            host: options.adbHost,
            port: options.adbPort,
            omitDriverInstall: options.omitDriverInstall,
        }));
        if (devices.length === 0)
            throw new Error('No devices found');
        if (options.deviceSerialNumber) {
            devices = devices.filter(d => d.serial === options.deviceSerialNumber);
            if (devices.length === 0)
                throw new Error(`No device with serial number '${options.deviceSerialNumber}' was found`);
        }
        if (devices.length > 1)
            throw new Error(`More than one device found. Please specify deviceSerialNumber`);
        const device = devices[0];
        const path = options.wsPath ? (options.wsPath.startsWith('/') ? options.wsPath : `/${options.wsPath}`) : `/${(0, crypto_1.createGuid)()}`;
        // 2. Start the server
        const server = new copilotbrowserServer_1.copilotbrowserServer({ mode: 'launchServer', path, maxConnections: 1, preLaunchedAndroidDevice: device });
        const wsEndpoint = await server.listen(options.port, options.host);
        // 3. Return the BrowserServer interface
        const browserServer = new utilsBundle_1.ws.EventEmitter();
        browserServer.wsEndpoint = () => wsEndpoint;
        browserServer.close = () => device.close();
        browserServer.kill = () => device.close();
        device.on('close', () => {
            server.close();
            browserServer.emit('close');
        });
        return browserServer;
    }
}
exports.AndroidServerLauncherImpl = AndroidServerLauncherImpl;
