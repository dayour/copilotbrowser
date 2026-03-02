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
exports.BidiChromium = void 0;
const os_1 = __importDefault(require("os"));
const ascii_1 = require("../utils/ascii");
const browserType_1 = require("../browserType");
const bidiBrowser_1 = require("./bidiBrowser");
const bidiConnection_1 = require("./bidiConnection");
const chromiumSwitches_1 = require("../chromium/chromiumSwitches");
const chromium_1 = require("../chromium/chromium");
const hostPlatform_1 = require("../utils/hostPlatform");
class BidiChromium extends browserType_1.BrowserType {
    constructor(parent) {
        super(parent, 'chromium');
    }
    async connectToTransport(transport, options, browserLogsCollector) {
        // Chrome doesn't support Bidi, we create Bidi over CDP which is used by Chrome driver.
        // bidiOverCdp depends on chromium-bidi which we only have in devDependencies, so
        // we load bidiOverCdp dynamically.
        const bidiTransport = await require('./bidiOverCdp').connectBidiOverCdp(transport);
        transport[kBidiOverCdpWrapper] = bidiTransport;
        try {
            return bidiBrowser_1.BidiBrowser.connect(this.attribution.copilotbrowser, bidiTransport, options);
        }
        catch (e) {
            if (browserLogsCollector.recentLogs().some(log => log.includes('Failed to create a ProcessSingleton for your profile directory.'))) {
                throw new Error('Failed to create a ProcessSingleton for your profile directory. ' +
                    'This usually means that the profile is already in use by another instance of Chromium.');
            }
            throw e;
        }
    }
    doRewriteStartupLog(logs) {
        if (logs.includes('Missing X server'))
            logs = '\n' + (0, ascii_1.wrapInASCIIBox)(browserType_1.kNoXServerRunningError, 1);
        // These error messages are taken from Chromium source code as of July, 2020:
        // https://github.com/chromium/chromium/blob/70565f67e79f79e17663ad1337dc6e63ee207ce9/content/browser/zygote_host/zygote_host_impl_linux.cc
        if (!logs.includes('crbug.com/357670') && !logs.includes('No usable sandbox!') && !logs.includes('crbug.com/638180'))
            return logs;
        return [
            `Chromium sandboxing failed!`,
            `================================`,
            `To avoid the sandboxing issue, do either of the following:`,
            `  - (preferred): Configure your environment to support sandboxing`,
            `  - (alternative): Launch Chromium without sandbox using 'chromiumSandbox: false' option`,
            `================================`,
            ``,
        ].join('\n');
    }
    amendEnvironment(env) {
        return env;
    }
    attemptToGracefullyCloseBrowser(transport) {
        // Note that it's fine to reuse the transport, since our connection ignores kBrowserCloseMessageId.
        const bidiTransport = transport[kBidiOverCdpWrapper];
        if (bidiTransport)
            transport = bidiTransport;
        transport.send({ method: 'browser.close', params: {}, id: bidiConnection_1.kBrowserCloseMessageId });
    }
    supportsPipeTransport() {
        return false;
    }
    async defaultArgs(options, isPersistent, userDataDir) {
        const chromeArguments = this._innerDefaultArgs(options);
        chromeArguments.push(`--user-data-dir=${userDataDir}`);
        chromeArguments.push('--remote-debugging-port=0');
        if (isPersistent)
            chromeArguments.push('about:blank');
        else
            chromeArguments.push('--no-startup-window');
        return chromeArguments;
    }
    async waitForReadyState(options, browserLogsCollector) {
        return (0, chromium_1.waitForReadyState)({ ...options, cdpPort: 0 }, browserLogsCollector);
    }
    _innerDefaultArgs(options) {
        const { args = [] } = options;
        const userDataDirArg = args.find(arg => arg.startsWith('--user-data-dir'));
        if (userDataDirArg)
            throw this._createUserDataDirArgMisuseError('--user-data-dir');
        if (args.find(arg => arg.startsWith('--remote-debugging-pipe')))
            throw new Error('copilotbrowser manages remote debugging connection itself.');
        if (args.find(arg => !arg.startsWith('-')))
            throw new Error('Arguments can not specify page to be opened');
        const chromeArguments = [...(0, chromiumSwitches_1.chromiumSwitches)(options.assistantMode)];
        if (os_1.default.platform() !== 'darwin' || !(0, hostPlatform_1.hasGpuMac)()) {
            // See https://issues.chromium.org/issues/40277080
            chromeArguments.push('--enable-unsafe-swiftshader');
        }
        if (options.headless) {
            chromeArguments.push('--headless');
            chromeArguments.push('--hide-scrollbars', '--mute-audio', '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4');
        }
        if (options.chromiumSandbox !== true)
            chromeArguments.push('--no-sandbox');
        const proxy = options.proxyOverride || options.proxy;
        if (proxy) {
            const proxyURL = new URL(proxy.server);
            const isSocks = proxyURL.protocol === 'socks5:';
            // https://www.chromium.org/developers/design-documents/network-settings
            if (isSocks && !options.socksProxyPort) {
                // https://www.chromium.org/developers/design-documents/network-stack/socks-proxy
                chromeArguments.push(`--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE ${proxyURL.hostname}"`);
            }
            chromeArguments.push(`--proxy-server=${proxy.server}`);
            const proxyBypassRules = [];
            // https://source.chromium.org/chromium/chromium/src/+/master:net/docs/proxy.md;l=548;drc=71698e610121078e0d1a811054dcf9fd89b49578
            if (options.socksProxyPort)
                proxyBypassRules.push('<-loopback>');
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
    getExecutableName(options) {
        switch (options.channel) {
            case 'bidi-chromium':
                return 'chromium';
            case 'bidi-chrome':
                return 'chrome';
            case 'bidi-chrome-beta':
                return 'chrome-beta';
            case 'bidi-chrome-dev':
                return 'chrome-dev';
            case 'bidi-chrome-canary':
                return 'chrome-canary';
        }
        throw new Error(`Unsupported Bidi Chromium channel: ${options.channel}`);
    }
}
exports.BidiChromium = BidiChromium;
const kBidiOverCdpWrapper = Symbol('kBidiConnectionWrapper');
