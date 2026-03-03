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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserType = exports.kNoXServerRunningError = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const browserContext_1 = require("./browserContext");
const debug_1 = require("./utils/debug");
const assert_1 = require("../utils/isomorphic/assert");
const manualPromise_1 = require("../utils/isomorphic/manualPromise");
const time_1 = require("../utils/isomorphic/time");
const fileUtils_1 = require("./utils/fileUtils");
const helper_1 = require("./helper");
const instrumentation_1 = require("./instrumentation");
const pipeTransport_1 = require("./pipeTransport");
const processLauncher_1 = require("./utils/processLauncher");
const protocolError_1 = require("./protocolError");
const registry_1 = require("./registry");
const socksClientCertificatesInterceptor_1 = require("./socksClientCertificatesInterceptor");
const transport_1 = require("./transport");
const debugLogger_1 = require("./utils/debugLogger");
exports.kNoXServerRunningError = 'Looks like you launched a headed browser without having a XServer running.\n' +
    'Set either \'headless: true\' or use \'xvfb-run <your-copilotbrowser-app>\' before running copilotbrowser.\n\n<3 copilotbrowser Team';
class BrowserType extends instrumentation_1.SdkObject {
    _name;
    constructor(parent, browserName) {
        super(parent, 'browser-type');
        this.attribution.browserType = this;
        this._name = browserName;
        this.logName = 'browser';
    }
    executablePath() {
        return registry_1.registry.findExecutable(this._name).executablePath() || '';
    }
    name() {
        return this._name;
    }
    async launch(progress, options, protocolLogger) {
        options = this._validateLaunchOptions(options);
        const seleniumHubUrl = options.__testHookSeleniumRemoteURL || process.env.SELENIUM_REMOTE_URL;
        if (seleniumHubUrl)
            return this._launchWithSeleniumHub(progress, seleniumHubUrl, options);
        return this._innerLaunchWithRetries(progress, options, undefined, helper_1.helper.debugProtocolLogger(protocolLogger)).catch(e => { throw this._rewriteStartupLog(e); });
    }
    async launchPersistentContext(progress, userDataDir, options) {
        const launchOptions = this._validateLaunchOptions(options);
        // Note: Any initial TLS requests will fail since we rely on the Page/Frames initialize which sets ignoreHTTPSErrors.
        let clientCertificatesProxy;
        if (options.clientCertificates?.length) {
            clientCertificatesProxy = await socksClientCertificatesInterceptor_1.ClientCertificatesProxy.create(progress, options);
            launchOptions.proxyOverride = clientCertificatesProxy.proxySettings();
            options = { ...options };
            options.internalIgnoreHTTPSErrors = true;
        }
        try {
            const browser = await this._innerLaunchWithRetries(progress, launchOptions, options, helper_1.helper.debugProtocolLogger(), userDataDir).catch(e => { throw this._rewriteStartupLog(e); });
            browser._defaultContext._clientCertificatesProxy = clientCertificatesProxy;
            return browser._defaultContext;
        }
        catch (error) {
            await clientCertificatesProxy?.close().catch(() => { });
            throw error;
        }
    }
    async _innerLaunchWithRetries(progress, options, persistent, protocolLogger, userDataDir) {
        try {
            return await this._innerLaunch(progress, options, persistent, protocolLogger, userDataDir);
        }
        catch (error) {
            // @see https://github.com/dayour/copilotbrowser/issues/5214
            const errorMessage = typeof error === 'object' && typeof error.message === 'string' ? error.message : '';
            if (errorMessage.includes('Inconsistency detected by ld.so')) {
                progress.log(`<restarting browser due to hitting race condition in glibc>`);
                return this._innerLaunch(progress, options, persistent, protocolLogger, userDataDir);
            }
            throw error;
        }
    }
    async _innerLaunch(progress, options, persistent, protocolLogger, maybeUserDataDir) {
        options.proxy = options.proxy ? (0, browserContext_1.normalizeProxySettings)(options.proxy) : undefined;
        const browserLogsCollector = new debugLogger_1.RecentLogsCollector();
        const { browserProcess, userDataDir, artifactsDir, transport } = await this._launchProcess(progress, options, !!persistent, browserLogsCollector, maybeUserDataDir);
        try {
            if (options.__testHookBeforeCreateBrowser)
                await progress.race(options.__testHookBeforeCreateBrowser());
            const browserOptions = {
                name: this._name,
                isChromium: this._name === 'chromium',
                channel: options.channel,
                slowMo: options.slowMo,
                persistent,
                headful: !options.headless,
                artifactsDir,
                downloadsPath: (options.downloadsPath || artifactsDir),
                tracesDir: (options.tracesDir || artifactsDir),
                browserProcess,
                customExecutablePath: options.executablePath,
                proxy: options.proxy,
                protocolLogger,
                browserLogsCollector,
                wsEndpoint: transport instanceof transport_1.WebSocketTransport ? transport.wsEndpoint : undefined,
                originalLaunchOptions: options,
            };
            if (persistent)
                (0, browserContext_1.validateBrowserContextOptions)(persistent, browserOptions);
            copyTestHooks(options, browserOptions);
            const browser = await progress.race(this.connectToTransport(transport, browserOptions, browserLogsCollector));
            browser._userDataDirForTest = userDataDir;
            // We assume no control when using custom arguments, and do not prepare the default context in that case.
            if (persistent && !options.ignoreAllDefaultArgs)
                await browser._defaultContext._loadDefaultContext(progress);
            return browser;
        }
        catch (error) {
            await browserProcess.close().catch(() => { });
            throw error;
        }
    }
    async _prepareToLaunch(options, isPersistent, userDataDir) {
        const { ignoreDefaultArgs, ignoreAllDefaultArgs, args = [], executablePath = null, } = options;
        const tempDirectories = [];
        const artifactsDir = await fs_1.default.promises.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'copilotbrowser-artifacts-'));
        tempDirectories.push(artifactsDir);
        if (userDataDir) {
            (0, assert_1.assert)(path_1.default.isAbsolute(userDataDir), 'userDataDir must be an absolute path');
            // Firefox bails if the profile directory does not exist, Chrome creates it. We ensure consistent behavior here.
            if (!await (0, fileUtils_1.existsAsync)(userDataDir))
                await fs_1.default.promises.mkdir(userDataDir, { recursive: true, mode: 0o700 });
        }
        else {
            userDataDir = await fs_1.default.promises.mkdtemp(path_1.default.join(os_1.default.tmpdir(), `copilotbrowser_${this._name}dev_profile-`));
            tempDirectories.push(userDataDir);
        }
        await this.prepareUserDataDir(options, userDataDir);
        const browserArguments = [];
        if (ignoreAllDefaultArgs)
            browserArguments.push(...args);
        else if (ignoreDefaultArgs)
            browserArguments.push(...(await this.defaultArgs(options, isPersistent, userDataDir)).filter(arg => ignoreDefaultArgs.indexOf(arg) === -1));
        else
            browserArguments.push(...await this.defaultArgs(options, isPersistent, userDataDir));
        let executable;
        if (executablePath) {
            if (!(await (0, fileUtils_1.existsAsync)(executablePath)))
                throw new Error(`Failed to launch ${this._name} because executable doesn't exist at ${executablePath}`);
            executable = executablePath;
        }
        else {
            const registryExecutable = registry_1.registry.findExecutable(this.getExecutableName(options));
            if (!registryExecutable || registryExecutable.browserName !== this._name)
                throw new Error(`Unsupported ${this._name} channel "${options.channel}"`);
            executable = registryExecutable.executablePathOrDie(this.attribution.copilotbrowser.options.sdkLanguage);
            await registry_1.registry.validateHostRequirementsForExecutablesIfNeeded([registryExecutable], this.attribution.copilotbrowser.options.sdkLanguage);
        }
        return { executable, browserArguments, userDataDir, artifactsDir, tempDirectories };
    }
    async _launchProcess(progress, options, isPersistent, browserLogsCollector, userDataDir) {
        const { handleSIGINT = true, handleSIGTERM = true, handleSIGHUP = true, } = options;
        const env = options.env ? (0, processLauncher_1.envArrayToObject)(options.env) : process.env;
        const prepared = await progress.race(this._prepareToLaunch(options, isPersistent, userDataDir));
        // Note: it is important to define these variables before launchProcess, so that we don't get
        // "Cannot access 'browserServer' before initialization" if something went wrong.
        let transport = undefined;
        let browserProcess = undefined;
        const exitPromise = new manualPromise_1.ManualPromise();
        const { launchedProcess, gracefullyClose, kill } = await (0, processLauncher_1.launchProcess)({
            command: prepared.executable,
            args: prepared.browserArguments,
            env: this.amendEnvironment(env, prepared.userDataDir, isPersistent, options),
            handleSIGINT,
            handleSIGTERM,
            handleSIGHUP,
            log: (message) => {
                progress.log(message);
                browserLogsCollector.log(message);
            },
            stdio: 'pipe',
            tempDirectories: prepared.tempDirectories,
            attemptToGracefullyClose: async () => {
                if (options.__testHookGracefullyClose)
                    await options.__testHookGracefullyClose();
                if (transport) {
                    // We try to gracefully close to prevent crash reporting and core dumps.
                    this.attemptToGracefullyCloseBrowser(transport);
                }
                else {
                    throw new Error('Force-killing the browser because no transport is available to gracefully close it.');
                }
            },
            onExit: (exitCode, signal) => {
                // Unblock launch when browser prematurely exits.
                exitPromise.resolve();
                if (browserProcess && browserProcess.onclose)
                    browserProcess.onclose(exitCode, signal);
            },
        });
        async function closeOrKill(timeout) {
            let timer;
            try {
                await Promise.race([
                    gracefullyClose(),
                    new Promise((resolve, reject) => timer = setTimeout(reject, timeout)),
                ]);
            }
            catch (ignored) {
                await kill().catch(ignored => { }); // Make sure to await actual process exit.
            }
            finally {
                clearTimeout(timer);
            }
        }
        browserProcess = {
            onclose: undefined,
            process: launchedProcess,
            close: () => closeOrKill(options.__testHookBrowserCloseTimeout || time_1.DEFAULT_copilotbrowser_TIMEOUT),
            kill
        };
        try {
            const { wsEndpoint } = await progress.race([
                this.waitForReadyState(options, browserLogsCollector),
                exitPromise.then(() => ({ wsEndpoint: undefined })),
            ]);
            if (exitPromise.isDone()) {
                const log = helper_1.helper.formatBrowserLogs(browserLogsCollector.recentLogs());
                const updatedLog = this.doRewriteStartupLog(log);
                throw new Error(`Failed to launch the browser process.\nBrowser logs:\n${updatedLog}`);
            }
            if (options.cdpPort !== undefined || !this.supportsPipeTransport()) {
                transport = await transport_1.WebSocketTransport.connect(progress, wsEndpoint);
            }
            else {
                const stdio = launchedProcess.stdio;
                transport = new pipeTransport_1.PipeTransport(stdio[3], stdio[4]);
            }
            return { browserProcess, artifactsDir: prepared.artifactsDir, userDataDir: prepared.userDataDir, transport };
        }
        catch (error) {
            await closeOrKill(time_1.DEFAULT_copilotbrowser_TIMEOUT).catch(() => { });
            throw error;
        }
    }
    async connectOverCDP(progress, endpointURL, options) {
        throw new Error('CDP connections are only supported by Chromium');
    }
    async connectOverCDPTransport(progress, transport) {
        throw new Error('CDP connections are only supported by Chromium');
    }
    async _launchWithSeleniumHub(progress, hubUrl, options) {
        throw new Error('Connecting to SELENIUM_REMOTE_URL is only supported by Chromium');
    }
    _validateLaunchOptions(options) {
        let { headless = true, downloadsPath, proxy } = options;
        if ((0, debug_1.debugMode)() === 'inspector')
            headless = false;
        if (downloadsPath && !path_1.default.isAbsolute(downloadsPath))
            downloadsPath = path_1.default.join(process.cwd(), downloadsPath);
        if (options.socksProxyPort)
            proxy = { server: `socks5://127.0.0.1:${options.socksProxyPort}` };
        return { ...options, headless, downloadsPath, proxy };
    }
    _createUserDataDirArgMisuseError(userDataDirArg) {
        switch (this.attribution.copilotbrowser.options.sdkLanguage) {
            case 'java':
                return new Error(`Pass userDataDir parameter to 'BrowserType.launchPersistentContext(userDataDir, options)' instead of specifying '${userDataDirArg}' argument`);
            case 'python':
                return new Error(`Pass user_data_dir parameter to 'browser_type.launch_persistent_context(user_data_dir, **kwargs)' instead of specifying '${userDataDirArg}' argument`);
            case 'csharp':
                return new Error(`Pass userDataDir parameter to 'BrowserType.LaunchPersistentContextAsync(userDataDir, options)' instead of specifying '${userDataDirArg}' argument`);
            default:
                return new Error(`Pass userDataDir parameter to 'browserType.launchPersistentContext(userDataDir, options)' instead of specifying '${userDataDirArg}' argument`);
        }
    }
    _rewriteStartupLog(error) {
        if (!(0, protocolError_1.isProtocolError)(error))
            return error;
        if (error.logs)
            error.logs = this.doRewriteStartupLog(error.logs);
        return error;
    }
    async waitForReadyState(options, browserLogsCollector) {
        return {};
    }
    async prepareUserDataDir(options, userDataDir) {
    }
    supportsPipeTransport() {
        return true;
    }
    getExecutableName(options) {
        return options.channel || this._name;
    }
}
exports.BrowserType = BrowserType;
function copyTestHooks(from, to) {
    for (const [key, value] of Object.entries(from)) {
        if (key.startsWith('__testHook'))
            to[key] = value;
    }
}
