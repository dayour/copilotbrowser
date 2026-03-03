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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Firefox = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ffBrowser_1 = require("./ffBrowser");
const ffConnection_1 = require("./ffConnection");
const ascii_1 = require("../utils/ascii");
const browserType_1 = require("../browserType");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
class Firefox extends browserType_1.BrowserType {
    _bidiFirefox;
    constructor(parent, bidiFirefox) {
        super(parent, 'firefox');
        this._bidiFirefox = bidiFirefox;
    }
    launch(progress, options, protocolLogger) {
        if (options.channel?.startsWith('moz-'))
            return this._bidiFirefox.launch(progress, options, protocolLogger);
        return super.launch(progress, options, protocolLogger);
    }
    async launchPersistentContext(progress, userDataDir, options) {
        if (options.channel?.startsWith('moz-'))
            return this._bidiFirefox.launchPersistentContext(progress, userDataDir, options);
        return super.launchPersistentContext(progress, userDataDir, options);
    }
    connectToTransport(transport, options) {
        return ffBrowser_1.FFBrowser.connect(this.attribution.copilotbrowser, transport, options);
    }
    doRewriteStartupLog(logs) {
        // https://github.com/dayour/copilotbrowser/issues/6500
        if (logs.includes(`as root in a regular user's session is not supported.`))
            logs = '\n' + (0, ascii_1.wrapInASCIIBox)(`Firefox is unable to launch if the $HOME folder isn't owned by the current user.\nWorkaround: Set the HOME=/root environment variable${process.env.GITHUB_ACTION ? ' in your GitHub Actions workflow file' : ''} when running copilotbrowser.`, 1);
        if (logs.includes('no DISPLAY environment variable specified'))
            logs = '\n' + (0, ascii_1.wrapInASCIIBox)(browserType_1.kNoXServerRunningError, 1);
        return logs;
    }
    amendEnvironment(env) {
        if (!path_1.default.isAbsolute(os_1.default.homedir()))
            throw new Error(`Cannot launch Firefox with relative home directory. Did you set ${os_1.default.platform() === 'win32' ? 'USERPROFILE' : 'HOME'} to a relative path?`);
        if (os_1.default.platform() === 'linux') {
            // Always remove SNAP_NAME and SNAP_INSTANCE_NAME env variables since they
            // confuse Firefox: in our case, builds never come from SNAP.
            // See https://github.com/dayour/copilotbrowser/issues/20555
            return { ...env, SNAP_NAME: undefined, SNAP_INSTANCE_NAME: undefined };
        }
        return env;
    }
    attemptToGracefullyCloseBrowser(transport) {
        // Note that it's fine to reuse the transport, since our connection ignores kBrowserCloseMessageId.
        const message = { method: 'Browser.close', params: {}, id: ffConnection_1.kBrowserCloseMessageId };
        transport.send(message);
    }
    async defaultArgs(options, isPersistent, userDataDir) {
        const { args = [], headless } = options;
        const userDataDirArg = args.find(arg => arg.startsWith('-profile') || arg.startsWith('--profile'));
        if (userDataDirArg)
            throw this._createUserDataDirArgMisuseError('--profile');
        if (args.find(arg => arg.startsWith('-juggler')))
            throw new Error('Use the port parameter instead of -juggler argument');
        const firefoxArguments = ['-no-remote'];
        if (headless) {
            firefoxArguments.push('-headless');
        }
        else {
            firefoxArguments.push('-wait-for-browser');
            firefoxArguments.push('-foreground');
        }
        firefoxArguments.push(`-profile`, userDataDir);
        firefoxArguments.push('-juggler-pipe');
        firefoxArguments.push(...args);
        if (isPersistent)
            firefoxArguments.push('about:blank');
        else
            firefoxArguments.push('-silent');
        return firefoxArguments;
    }
    waitForReadyState(options, browserLogsCollector) {
        const result = new manualPromise_1.ManualPromise();
        browserLogsCollector.onMessage(message => {
            if (message.includes('Juggler listening to the pipe'))
                result.resolve({});
        });
        return result;
    }
}
exports.Firefox = Firefox;
