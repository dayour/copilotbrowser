"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiFirefox = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ascii_1 = require("../utils/ascii");
const browserType_1 = require("../browserType");
const bidiBrowser_1 = require("./bidiBrowser");
const bidiConnection_1 = require("./bidiConnection");
const firefoxPrefs_1 = require("./third_party/firefoxPrefs");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
class BidiFirefox extends browserType_1.BrowserType {
    constructor(parent) {
        super(parent, 'firefox');
    }
    executablePath() {
        return '';
    }
    async connectToTransport(transport, options) {
        return bidiBrowser_1.BidiBrowser.connect(this.attribution.copilotbrowser, transport, options);
    }
    doRewriteStartupLog(logs) {
        if (logs.includes(`as root in a regular user's session is not supported.`))
            logs = '\n' + (0, ascii_1.wrapInASCIIBox)(`Firefox is unable to launch if the $HOME folder isn't owned by the current user.\nWorkaround: Set the HOME=/root environment variable${process.env.GITHUB_ACTION ? ' in your GitHub Actions workflow file' : ''} when running copilotbrowser.`, 1);
        if (logs.includes('no DISPLAY environment variable specified'))
            logs = '\n' + (0, ascii_1.wrapInASCIIBox)(browserType_1.kNoXServerRunningError, 1);
        return logs;
    }
    amendEnvironment(env) {
        if (!path_1.default.isAbsolute(os_1.default.homedir()))
            throw new Error(`Cannot launch Firefox with relative home directory. Did you set ${os_1.default.platform() === 'win32' ? 'USERPROFILE' : 'HOME'} to a relative path?`);
        env = {
            ...env,
            'MOZ_CRASHREPORTER': '1',
            'MOZ_CRASHREPORTER_NO_REPORT': '1',
            'MOZ_CRASHREPORTER_SHUTDOWN': '1',
        };
        if (os_1.default.platform() === 'linux') {
            // Always remove SNAP_NAME and SNAP_INSTANCE_NAME env variables since they
            // confuse Firefox: in our case, builds never come from SNAP.
            // See https://github.com/dayour/copilotbrowser/issues/20555
            return { ...env, SNAP_NAME: undefined, SNAP_INSTANCE_NAME: undefined };
        }
        return env;
    }
    attemptToGracefullyCloseBrowser(transport) {
        this._attemptToGracefullyCloseBrowser(transport).catch(() => { });
    }
    async _attemptToGracefullyCloseBrowser(transport) {
        // Note that it's fine to reuse the transport, since our connection ignores kBrowserCloseMessageId.
        if (!transport.onmessage) {
            // browser.close does not work without an active session. If there is no connection
            // created with the transport, make sure to create a new session first.
            transport.send({ method: 'session.new', params: { capabilities: {} }, id: bidiConnection_1.kShutdownSessionNewMessageId });
            await new Promise(resolve => {
                transport.onmessage = message => {
                    if (message.id === bidiConnection_1.kShutdownSessionNewMessageId)
                        resolve(true);
                };
            });
        }
        transport.send({ method: 'browser.close', params: {}, id: bidiConnection_1.kBrowserCloseMessageId });
    }
    supportsPipeTransport() {
        return false;
    }
    async prepareUserDataDir(options, userDataDir) {
        await (0, firefoxPrefs_1.createProfile)({
            path: userDataDir,
            preferences: options.firefoxUserPrefs || {},
        });
    }
    async defaultArgs(options, isPersistent, userDataDir) {
        const { args = [], headless } = options;
        const userDataDirArg = args.find(arg => arg.startsWith('-profile') || arg.startsWith('--profile'));
        if (userDataDirArg)
            throw this._createUserDataDirArgMisuseError('--profile');
        if (args.find(arg => !arg.startsWith('-')))
            throw new Error('Arguments can not specify page to be opened');
        const firefoxArguments = ['--remote-debugging-port=0'];
        if (headless)
            firefoxArguments.push('--headless');
        else
            firefoxArguments.push('--foreground');
        firefoxArguments.push(`--profile`, userDataDir);
        firefoxArguments.push(...args);
        return firefoxArguments;
    }
    async waitForReadyState(options, browserLogsCollector) {
        const result = new manualPromise_1.ManualPromise();
        browserLogsCollector.onMessage(message => {
            const match = message.match(/WebDriver BiDi listening on (ws:\/\/.*)$/);
            if (match)
                result.resolve({ wsEndpoint: match[1] + '/session' });
        });
        return result;
    }
}
exports.BidiFirefox = BidiFirefox;
