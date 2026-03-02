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
exports.WebKit = void 0;
exports.translatePathToWSL = translatePathToWSL;
const path_1 = __importDefault(require("path"));
const wkConnection_1 = require("./wkConnection");
const ascii_1 = require("../utils/ascii");
const browserType_1 = require("../browserType");
const wkBrowser_1 = require("../webkit/wkBrowser");
const spawnAsync_1 = require("../utils/spawnAsync");
class WebKit extends browserType_1.BrowserType {
    constructor(parent) {
        super(parent, 'webkit');
    }
    connectToTransport(transport, options) {
        return wkBrowser_1.WKBrowser.connect(this.attribution.copilotbrowser, transport, options);
    }
    amendEnvironment(env, userDataDir, isPersistent, options) {
        return {
            ...env,
            CURL_COOKIE_JAR_PATH: process.platform === 'win32' && isPersistent ? path_1.default.join(userDataDir, 'cookiejar.db') : undefined,
        };
    }
    doRewriteStartupLog(logs) {
        if (logs.includes('Failed to open display') || logs.includes('cannot open display'))
            logs = '\n' + (0, ascii_1.wrapInASCIIBox)(browserType_1.kNoXServerRunningError, 1);
        return logs;
    }
    attemptToGracefullyCloseBrowser(transport) {
        // Note that it's fine to reuse the transport, since our connection ignores kBrowserCloseMessageId.
        transport.send({ method: 'copilotbrowser.close', params: {}, id: wkConnection_1.kBrowserCloseMessageId });
    }
    async defaultArgs(options, isPersistent, userDataDir) {
        const { args = [], headless } = options;
        const userDataDirArg = args.find(arg => arg.startsWith('--user-data-dir'));
        if (userDataDirArg)
            throw this._createUserDataDirArgMisuseError('--user-data-dir');
        if (args.find(arg => !arg.startsWith('-')))
            throw new Error('Arguments can not specify page to be opened');
        const webkitArguments = ['--inspector-pipe'];
        if (process.platform === 'win32' && options.channel !== 'webkit-wsl')
            webkitArguments.push('--disable-accelerated-compositing');
        if (headless)
            webkitArguments.push('--headless');
        if (isPersistent)
            webkitArguments.push(`--user-data-dir=${options.channel === 'webkit-wsl' ? await translatePathToWSL(userDataDir) : userDataDir}`);
        else
            webkitArguments.push(`--no-startup-window`);
        const proxy = options.proxyOverride || options.proxy;
        if (proxy) {
            if (process.platform === 'darwin') {
                webkitArguments.push(`--proxy=${proxy.server}`);
                if (proxy.bypass)
                    webkitArguments.push(`--proxy-bypass-list=${proxy.bypass}`);
            }
            else if (process.platform === 'linux' || (process.platform === 'win32' && options.channel === 'webkit-wsl')) {
                webkitArguments.push(`--proxy=${proxy.server}`);
                if (proxy.bypass)
                    webkitArguments.push(...proxy.bypass.split(',').map(t => `--ignore-host=${t}`));
            }
            else if (process.platform === 'win32') {
                // Enable socks5 hostname resolution on Windows. Workaround can be removed once fixed upstream.
                // See https://github.com/dayour/copilotbrowser/issues/20451
                webkitArguments.push(`--curl-proxy=${proxy.server.replace(/^socks5:\/\//, 'socks5h://')}`);
                if (proxy.bypass)
                    webkitArguments.push(`--curl-noproxy=${proxy.bypass}`);
            }
        }
        webkitArguments.push(...args);
        if (isPersistent)
            webkitArguments.push('about:blank');
        return webkitArguments;
    }
}
exports.WebKit = WebKit;
async function translatePathToWSL(path) {
    const { stdout } = await (0, spawnAsync_1.spawnAsync)('wsl.exe', ['-d', 'copilotbrowser', '--cd', '/home/pwuser', 'wslpath', path.replace(/\\/g, '\\\\')]);
    return stdout.toString().trim();
}
