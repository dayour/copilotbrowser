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
exports.AndroidDevice = exports.Android = void 0;
const events_1 = require("events");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const pipeTransport_1 = require("../utils/pipeTransport");
const crypto_1 = require("../utils/crypto");
const debug_1 = require("../utils/debug");
const env_1 = require("../utils/env");
const task_1 = require("../utils/task");
const debugLogger_1 = require("../utils/debugLogger");
const utilsBundle_1 = require("../../utilsBundle");
const utilsBundle_2 = require("../../utilsBundle");
const browserContext_1 = require("../browserContext");
const chromiumSwitches_1 = require("../chromium/chromiumSwitches");
const crBrowser_1 = require("../chromium/crBrowser");
const fileUtils_1 = require("../utils/fileUtils");
const helper_1 = require("../helper");
const instrumentation_1 = require("../instrumentation");
const processLauncher_1 = require("../utils/processLauncher");
const progress_1 = require("../progress");
const registry_1 = require("../registry");
const ARTIFACTS_FOLDER = path_1.default.join(os_1.default.tmpdir(), 'copilotbrowser-artifacts-');
class Android extends instrumentation_1.SdkObject {
    _backend;
    _devices = new Map();
    constructor(parent, backend) {
        super(parent, 'android');
        this._backend = backend;
    }
    async devices(progress, options) {
        const devices = (await progress.race(this._backend.devices(options))).filter(d => d.status === 'device');
        const newSerials = new Set();
        for (const d of devices) {
            newSerials.add(d.serial);
            if (this._devices.has(d.serial))
                continue;
            await progress.race(AndroidDevice.create(this, d, options).then(device => this._devices.set(d.serial, device)));
        }
        for (const d of this._devices.keys()) {
            if (!newSerials.has(d))
                this._devices.delete(d);
        }
        return [...this._devices.values()];
    }
    _deviceClosed(device) {
        this._devices.delete(device.serial);
    }
}
exports.Android = Android;
class AndroidDevice extends instrumentation_1.SdkObject {
    _backend;
    model;
    serial;
    _options;
    _driverPromise;
    _lastId = 0;
    _callbacks = new Map();
    _pollingWebViews;
    _webViews = new Map();
    static Events = {
        WebViewAdded: 'webViewAdded',
        WebViewRemoved: 'webViewRemoved',
        Close: 'close',
    };
    _browserConnections = new Set();
    _android;
    _isClosed = false;
    constructor(android, backend, model, options) {
        super(android, 'android-device');
        this._android = android;
        this._backend = backend;
        this.model = model;
        this.serial = backend.serial;
        this._options = options;
        this.logName = 'browser';
    }
    static async create(android, backend, options) {
        await backend.init();
        const model = await backend.runCommand('shell:getprop ro.product.model');
        const device = new AndroidDevice(android, backend, model.toString().trim(), options);
        await device._init();
        return device;
    }
    async _init() {
        await this._refreshWebViews();
        const poll = () => {
            this._pollingWebViews = setTimeout(() => this._refreshWebViews()
                .then(poll)
                .catch(() => {
                this.close().catch(() => { });
            }), 500);
        };
        poll();
    }
    async shell(command) {
        const result = await this._backend.runCommand(`shell:${command}`);
        await this._refreshWebViews();
        return result;
    }
    async open(progress, command) {
        return await this._open(progress, command);
    }
    async screenshot() {
        return await this._backend.runCommand(`shell:screencap -p`);
    }
    async _driver() {
        if (this._isClosed)
            return;
        if (!this._driverPromise) {
            const controller = new progress_1.ProgressController();
            this._driverPromise = controller.run(progress => this._installDriver(progress));
        }
        return this._driverPromise;
    }
    async _installDriver(progress) {
        (0, utilsBundle_1.debug)('pw:android')('Stopping the old driver');
        await progress.race(this.shell(`am force-stop com.microsoft.copilotbrowser.androiddriver`));
        // uninstall and install driver on every execution
        if (!this._options.omitDriverInstall) {
            (0, utilsBundle_1.debug)('pw:android')('Uninstalling the old driver');
            await progress.race(this.shell(`cmd package uninstall com.microsoft.copilotbrowser.androiddriver`));
            await progress.race(this.shell(`cmd package uninstall com.microsoft.copilotbrowser.androiddriver.test`));
            (0, utilsBundle_1.debug)('pw:android')('Installing the new driver');
            const executable = registry_1.registry.findExecutable('android');
            const packageManagerCommand = (0, env_1.getPackageManagerExecCommand)();
            for (const file of ['android-driver.apk', 'android-driver-target.apk']) {
                const fullName = path_1.default.join(executable.directory, file);
                if (!fs_1.default.existsSync(fullName))
                    throw new Error(`Please install Android driver apk using '${packageManagerCommand} copilotbrowser install android'`);
                await this.installApk(progress, await progress.race(fs_1.default.promises.readFile(fullName)));
            }
        }
        else {
            (0, utilsBundle_1.debug)('pw:android')('Skipping the driver installation');
        }
        (0, utilsBundle_1.debug)('pw:android')('Starting the new driver');
        this.shell('am instrument -w com.microsoft.copilotbrowser.androiddriver.test/androidx.test.runner.AndroidJUnitRunner').catch(e => (0, utilsBundle_1.debug)('pw:android')(e));
        const socket = await this._waitForLocalAbstract(progress, 'copilotbrowser_android_driver_socket');
        const transport = new pipeTransport_1.PipeTransport(socket, socket, socket, 'be');
        transport.onmessage = message => {
            const response = JSON.parse(message);
            const { id, result, error } = response;
            const callback = this._callbacks.get(id);
            if (!callback)
                return;
            if (error)
                callback.reject(new Error(error));
            else
                callback.fulfill(result);
            this._callbacks.delete(id);
        };
        return transport;
    }
    async _waitForLocalAbstract(progress, socketName) {
        let socket;
        (0, utilsBundle_1.debug)('pw:android')(`Polling the socket localabstract:${socketName}`);
        while (!socket) {
            try {
                socket = await this._open(progress, `localabstract:${socketName}`);
            }
            catch (e) {
                if ((0, progress_1.isAbortError)(e))
                    throw e;
                await progress.wait(250);
            }
        }
        (0, utilsBundle_1.debug)('pw:android')(`Connected to localabstract:${socketName}`);
        return socket;
    }
    async send(method, params = {}) {
        params = {
            ...params,
            // Patch the timeout in, just in case it's missing in one of the commands.
            timeout: params.timeout || 0,
        };
        if (params.androidSelector) {
            params.selector = params.androidSelector;
            delete params.androidSelector;
        }
        const driver = await this._driver();
        if (!driver)
            throw new Error('Device is closed');
        const id = ++this._lastId;
        const result = new Promise((fulfill, reject) => this._callbacks.set(id, { fulfill, reject }));
        driver.send(JSON.stringify({ id, method, params }));
        return result;
    }
    async close() {
        if (this._isClosed)
            return;
        this._isClosed = true;
        if (this._pollingWebViews)
            clearTimeout(this._pollingWebViews);
        for (const connection of this._browserConnections)
            await connection.close();
        if (this._driverPromise) {
            const driver = await this._driver();
            driver?.close();
        }
        await this._backend.close();
        this._android._deviceClosed(this);
        this.emit(AndroidDevice.Events.Close);
    }
    async launchBrowser(progress, pkg = 'com.android.chrome', options) {
        (0, utilsBundle_1.debug)('pw:android')('Force-stopping', pkg);
        await this._backend.runCommand(`shell:am force-stop ${pkg}`);
        const socketName = (0, debug_1.isUnderTest)() ? 'webview_devtools_remote_copilotbrowser_test' : ('copilotbrowser_' + (0, crypto_1.createGuid)() + '_devtools_remote');
        const commandLine = this._defaultArgs(options, socketName).join(' ');
        (0, utilsBundle_1.debug)('pw:android')('Starting', pkg, commandLine);
        // encode commandLine to base64 to avoid issues (bash encoding) with special characters
        await progress.race(this._backend.runCommand(`shell:echo "${Buffer.from(commandLine).toString('base64')}" | base64 -d > /data/local/tmp/chrome-command-line`));
        await progress.race(this._backend.runCommand(`shell:am start -a android.intent.action.VIEW -d about:blank ${pkg}`));
        const browserContext = await this._connectToBrowser(progress, socketName, options);
        try {
            await progress.race(this._backend.runCommand(`shell:rm /data/local/tmp/chrome-command-line`));
            return browserContext;
        }
        catch (error) {
            await browserContext.close({ reason: 'Failed to launch' }).catch(() => { });
            throw error;
        }
    }
    _defaultArgs(options, socketName) {
        const chromeArguments = [
            '_',
            '--disable-fre',
            '--no-default-browser-check',
            `--remote-debugging-socket-name=${socketName}`,
            ...(0, chromiumSwitches_1.chromiumSwitches)(undefined, undefined, true),
            ...this._innerDefaultArgs(options)
        ];
        return chromeArguments;
    }
    _innerDefaultArgs(options) {
        const { args = [], proxy } = options;
        const chromeArguments = [];
        if (proxy) {
            chromeArguments.push(`--proxy-server=${proxy.server}`);
            const proxyBypassRules = [];
            if (proxy.bypass)
                proxyBypassRules.push(...proxy.bypass.split(',').map(t => t.trim()).map(t => t.startsWith('.') ? '*' + t : t));
            if (!process.env.copilotbrowser_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK && !proxyBypassRules.includes('<-loopback>'))
                proxyBypassRules.push('<-loopback>');
            if (proxyBypassRules.length > 0)
                chromeArguments.push(`--proxy-bypass-list=${proxyBypassRules.join(';')}`);
        }
        chromeArguments.push(...args);
        return chromeArguments;
    }
    async connectToWebView(progress, socketName) {
        const webView = this._webViews.get(socketName);
        if (!webView)
            throw new Error('WebView has been closed');
        return await this._connectToBrowser(progress, socketName);
    }
    async _connectToBrowser(progress, socketName, options = {}) {
        const socket = await this._waitForLocalAbstract(progress, socketName);
        try {
            const androidBrowser = new AndroidBrowser(this, socket);
            await progress.race(androidBrowser._init());
            this._browserConnections.add(androidBrowser);
            const artifactsDir = await progress.race(fs_1.default.promises.mkdtemp(ARTIFACTS_FOLDER));
            const cleanupArtifactsDir = async () => {
                const errors = (await (0, fileUtils_1.removeFolders)([artifactsDir])).filter(Boolean);
                for (let i = 0; i < (errors || []).length; ++i)
                    (0, utilsBundle_1.debug)('pw:android')(`exception while removing ${artifactsDir}: ${errors[i]}`);
            };
            processLauncher_1.gracefullyCloseSet.add(cleanupArtifactsDir);
            socket.on('close', async () => {
                processLauncher_1.gracefullyCloseSet.delete(cleanupArtifactsDir);
                cleanupArtifactsDir().catch(e => (0, utilsBundle_1.debug)('pw:android')(`could not cleanup artifacts dir: ${e}`));
            });
            const browserOptions = {
                name: 'clank',
                isChromium: true,
                slowMo: 0,
                persistent: { ...options, noDefaultViewport: true },
                artifactsDir,
                downloadsPath: artifactsDir,
                tracesDir: artifactsDir,
                browserProcess: new ClankBrowserProcess(androidBrowser),
                proxy: options.proxy,
                protocolLogger: helper_1.helper.debugProtocolLogger(),
                browserLogsCollector: new debugLogger_1.RecentLogsCollector(),
                originalLaunchOptions: {},
            };
            (0, browserContext_1.validateBrowserContextOptions)(options, browserOptions);
            const browser = await progress.race(crBrowser_1.CRBrowser.connect(this.attribution.copilotbrowser, androidBrowser, browserOptions));
            const defaultContext = browser._defaultContext;
            await defaultContext._loadDefaultContextAsIs(progress);
            return defaultContext;
        }
        catch (error) {
            socket.close();
            throw error;
        }
    }
    _open(progress, command) {
        return (0, progress_1.raceUncancellableOperationWithCleanup)(progress, () => this._backend.open(command), socket => socket.close());
    }
    webViews() {
        return [...this._webViews.values()];
    }
    async installApk(progress, content, options) {
        const args = options && options.args ? options.args : ['-r', '-t', '-S'];
        (0, utilsBundle_1.debug)('pw:android')('Opening install socket');
        const installSocket = await this._open(progress, `shell:cmd package install ${args.join(' ')} ${content.length}`);
        (0, utilsBundle_1.debug)('pw:android')('Writing driver bytes: ' + content.length);
        await progress.race(installSocket.write(content));
        const success = await progress.race(new Promise(f => installSocket.on('data', f)));
        (0, utilsBundle_1.debug)('pw:android')('Written driver bytes: ' + success);
        installSocket.close();
    }
    async push(progress, content, path, mode = 0o644) {
        const socket = await this._open(progress, `sync:`);
        const sendHeader = async (command, length) => {
            const buffer = Buffer.alloc(command.length + 4);
            buffer.write(command, 0);
            buffer.writeUInt32LE(length, command.length);
            await progress.race(socket.write(buffer));
        };
        const send = async (command, data) => {
            await sendHeader(command, data.length);
            await progress.race(socket.write(data));
        };
        await send('SEND', Buffer.from(`${path},${mode}`));
        const maxChunk = 65535;
        for (let i = 0; i < content.length; i += maxChunk)
            await send('DATA', content.slice(i, i + maxChunk));
        await sendHeader('DONE', (Date.now() / 1000) | 0);
        const result = await progress.race(new Promise(f => socket.once('data', f)));
        const code = result.slice(0, 4).toString();
        if (code !== 'OKAY')
            throw new Error('Could not push: ' + code);
        socket.close();
    }
    async _refreshWebViews() {
        // possible socketName, eg: webview_devtools_remote_32327, webview_devtools_remote_32327_zeus, webview_devtools_remote_zeus
        const sockets = (await this._backend.runCommand(`shell:cat /proc/net/unix | grep webview_devtools_remote`)).toString().split('\n');
        if (this._isClosed)
            return;
        const socketNames = new Set();
        for (const line of sockets) {
            const matchSocketName = line.match(/[^@]+@(.*?webview_devtools_remote_?.*)/);
            if (!matchSocketName)
                continue;
            const socketName = matchSocketName[1];
            socketNames.add(socketName);
            if (this._webViews.has(socketName))
                continue;
            // possible line: 0000000000000000: 00000002 00000000 00010000 0001 01 5841881 @webview_devtools_remote_zeus
            // the result: match[1] = ''
            const match = line.match(/[^@]+@.*?webview_devtools_remote_?(\d*)/);
            let pid = -1;
            if (match && match[1])
                pid = +match[1];
            const pkg = await this._extractPkg(pid);
            if (this._isClosed)
                return;
            const webView = { pid, pkg, socketName };
            this._webViews.set(socketName, webView);
            this.emit(AndroidDevice.Events.WebViewAdded, webView);
        }
        for (const p of this._webViews.keys()) {
            if (!socketNames.has(p)) {
                this._webViews.delete(p);
                this.emit(AndroidDevice.Events.WebViewRemoved, p);
            }
        }
    }
    async _extractPkg(pid) {
        let pkg = '';
        if (pid === -1)
            return pkg;
        const procs = (await this._backend.runCommand(`shell:ps -A | grep ${pid}`)).toString().split('\n');
        for (const proc of procs) {
            const match = proc.match(/[^\s]+\s+(\d+).*$/);
            if (!match)
                continue;
            pkg = proc.substring(proc.lastIndexOf(' ') + 1);
        }
        return pkg;
    }
}
exports.AndroidDevice = AndroidDevice;
class AndroidBrowser extends events_1.EventEmitter {
    device;
    _socket;
    _receiver;
    _waitForNextTask = (0, task_1.makeWaitForNextTask)();
    onmessage;
    onclose;
    constructor(device, socket) {
        super();
        this.setMaxListeners(0);
        this.device = device;
        this._socket = socket;
        this._socket.on('close', () => {
            this._waitForNextTask(() => {
                if (this.onclose)
                    this.onclose();
            });
        });
        this._receiver = new utilsBundle_2.wsReceiver();
        this._receiver.on('message', message => {
            this._waitForNextTask(() => {
                if (this.onmessage)
                    this.onmessage(JSON.parse(message));
            });
        });
    }
    async _init() {
        await this._socket.write(Buffer.from(`GET /devtools/browser HTTP/1.1\r
Upgrade: WebSocket\r
Connection: Upgrade\r
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r
Sec-WebSocket-Version: 13\r
\r
`));
        // HTTP Upgrade response.
        await new Promise(f => this._socket.once('data', f));
        // Start sending web frame to receiver.
        this._socket.on('data', data => this._receiver._write(data, 'binary', () => { }));
    }
    async send(s) {
        await this._socket.write(encodeWebFrame(JSON.stringify(s)));
    }
    async close() {
        this._socket.close();
    }
}
function encodeWebFrame(data) {
    return utilsBundle_2.wsSender.frame(Buffer.from(data), {
        opcode: 1,
        mask: true,
        fin: true,
        readOnly: true
    })[0];
}
class ClankBrowserProcess {
    _browser;
    constructor(browser) {
        this._browser = browser;
    }
    onclose;
    async kill() {
    }
    async close() {
        await this._browser.close();
    }
}
