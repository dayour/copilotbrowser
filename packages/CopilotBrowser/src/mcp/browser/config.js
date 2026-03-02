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
exports.defaultConfig = void 0;
exports.resolveConfig = resolveConfig;
exports.resolveCLIConfig = resolveCLIConfig;
exports.validateConfig = validateConfig;
exports.configFromCLIOptions = configFromCLIOptions;
exports.configFromEnv = configFromEnv;
exports.loadConfig = loadConfig;
exports.workspaceDir = workspaceDir;
exports.workspaceFile = workspaceFile;
exports.outputDir = outputDir;
exports.outputFile = outputFile;
exports.mergeConfig = mergeConfig;
exports.semicolonSeparatedList = semicolonSeparatedList;
exports.commaSeparatedList = commaSeparatedList;
exports.dotenvFileLoader = dotenvFileLoader;
exports.numberParser = numberParser;
exports.resolutionParser = resolutionParser;
exports.headerParser = headerParser;
exports.enumParser = enumParser;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const server_1 = require("copilotbrowser-core/lib/server");
const copilotbrowser_core_1 = require("copilotbrowser-core");
const utilsBundle_1 = require("copilotbrowser-core/lib/utilsBundle");
const configIni_1 = require("./configIni");
const util_1 = require("../../util");
const server_2 = require("../sdk/server");
exports.defaultConfig = {
    browser: {
        browserName: 'chromium',
        launchOptions: {
            channel: 'chrome',
            headless: os_1.default.platform() === 'linux' && !process.env.DISPLAY,
        },
        contextOptions: {
            viewport: null,
        },
        isolated: false,
    },
    console: {
        level: 'info',
    },
    network: {
        allowedOrigins: undefined,
        blockedOrigins: undefined,
    },
    server: {},
    saveTrace: false,
    snapshot: {
        mode: 'incremental',
        output: 'stdout',
    },
    timeouts: {
        action: 5000,
        navigation: 60000,
    },
};
async function resolveConfig(config) {
    return mergeConfig(exports.defaultConfig, config);
}
async function resolveCLIConfig(cliOptions) {
    const envOverrides = configFromEnv();
    const cliOverrides = configFromCLIOptions(cliOptions);
    const configFile = cliOverrides.configFile ?? envOverrides.configFile;
    const configInFile = await loadConfig(configFile);
    let result = exports.defaultConfig;
    result = mergeConfig(result, configInFile);
    result = mergeConfig(result, envOverrides);
    result = mergeConfig(result, cliOverrides);
    result.configFile = configFile;
    const browserExplicitlyConfigured = !!(cliOptions.browser ||
        configInFile.browser?.launchOptions?.channel ||
        envOverrides.browser?.launchOptions?.channel);
    if (!browserExplicitlyConfigured)
        autoDetectBrowserChannel(result);
    await validateConfig(result);
    return result;
}
async function validateConfig(config) {
    if (config.browser.browserName === 'chromium' && config.browser.launchOptions.chromiumSandbox === undefined) {
        if (process.platform === 'linux')
            config.browser.launchOptions.chromiumSandbox = config.browser.launchOptions.channel !== 'chromium';
        else
            config.browser.launchOptions.chromiumSandbox = true;
    }
    if (config.saveVideo && !checkFfmpeg()) {
        // eslint-disable-next-line no-console
        console.error(`\nError: ffmpeg required to save the video is not installed.`);
        // eslint-disable-next-line no-console
        console.error(`\nPlease run the command below. It will install a local copy of ffmpeg and will not change any system-wide settings.`);
        // eslint-disable-next-line no-console
        console.error(`\n    npx copilotbrowser install ffmpeg\n`);
        // eslint-disable-next-line no-restricted-properties
        process.exit(1);
    }
    if (config.browser.initScript) {
        for (const script of config.browser.initScript) {
            if (!await (0, util_1.fileExistsAsync)(script))
                throw new Error(`Init script file does not exist: ${script}`);
        }
    }
    if (config.browser.initPage) {
        for (const page of config.browser.initPage) {
            if (!await (0, util_1.fileExistsAsync)(page))
                throw new Error(`Init page file does not exist: ${page}`);
        }
    }
    if (config.sharedBrowserContext && config.saveVideo)
        throw new Error('saveVideo is not supported when sharedBrowserContext is true');
}
function configFromCLIOptions(cliOptions) {
    let browserName;
    let channel;
    switch (cliOptions.browser) {
        case 'chrome':
        case 'chrome-beta':
        case 'chrome-canary':
        case 'chrome-dev':
        case 'chromium':
        case 'msedge':
        case 'msedge-beta':
        case 'msedge-canary':
        case 'msedge-dev':
            browserName = 'chromium';
            channel = cliOptions.browser;
            break;
        case 'firefox':
            browserName = 'firefox';
            break;
        case 'webkit':
            browserName = 'webkit';
            break;
    }
    // Launch options
    const launchOptions = {
        channel,
        executablePath: cliOptions.executablePath,
        headless: cliOptions.headless,
    };
    // --sandbox was passed, enable the sandbox
    // --no-sandbox was passed, disable the sandbox
    if (cliOptions.sandbox !== undefined)
        launchOptions.chromiumSandbox = cliOptions.sandbox;
    if (cliOptions.proxyServer) {
        launchOptions.proxy = {
            server: cliOptions.proxyServer
        };
        if (cliOptions.proxyBypass)
            launchOptions.proxy.bypass = cliOptions.proxyBypass;
    }
    if (cliOptions.device && cliOptions.cdpEndpoint)
        throw new Error('Device emulation is not supported with cdpEndpoint.');
    // Context options
    const contextOptions = cliOptions.device ? copilotbrowser_core_1.devices[cliOptions.device] : {};
    if (cliOptions.storageState)
        contextOptions.storageState = cliOptions.storageState;
    if (cliOptions.userAgent)
        contextOptions.userAgent = cliOptions.userAgent;
    if (cliOptions.viewportSize)
        contextOptions.viewport = cliOptions.viewportSize;
    if (cliOptions.ignoreHttpsErrors)
        contextOptions.ignoreHTTPSErrors = true;
    if (cliOptions.blockServiceWorkers)
        contextOptions.serviceWorkers = 'block';
    if (cliOptions.grantPermissions)
        contextOptions.permissions = cliOptions.grantPermissions;
    const config = {
        browser: {
            browserName,
            isolated: cliOptions.isolated,
            userDataDir: cliOptions.userDataDir,
            launchOptions,
            contextOptions,
            cdpEndpoint: cliOptions.cdpEndpoint,
            cdpHeaders: cliOptions.cdpHeader,
            cdpTimeout: cliOptions.cdpTimeout,
            initPage: cliOptions.initPage,
            initScript: cliOptions.initScript,
        },
        extension: cliOptions.extension,
        server: {
            port: cliOptions.port,
            host: cliOptions.host,
            allowedHosts: cliOptions.allowedHosts,
        },
        capabilities: cliOptions.caps,
        console: {
            level: cliOptions.consoleLevel,
        },
        network: {
            allowedOrigins: cliOptions.allowedOrigins,
            blockedOrigins: cliOptions.blockedOrigins,
        },
        allowUnrestrictedFileAccess: cliOptions.allowUnrestrictedFileAccess,
        codegen: cliOptions.codegen,
        saveSession: cliOptions.saveSession,
        saveTrace: cliOptions.saveTrace,
        saveVideo: cliOptions.saveVideo,
        secrets: cliOptions.secrets,
        sharedBrowserContext: cliOptions.sharedBrowserContext,
        snapshot: cliOptions.snapshotMode ? { mode: cliOptions.snapshotMode } : undefined,
        outputMode: cliOptions.outputMode,
        outputDir: cliOptions.outputDir,
        imageResponses: cliOptions.imageResponses,
        testIdAttribute: cliOptions.testIdAttribute,
        timeouts: {
            action: cliOptions.timeoutAction,
            navigation: cliOptions.timeoutNavigation,
        },
    };
    return { ...config, configFile: cliOptions.config };
}
function configFromEnv() {
    const options = {};
    options.allowedHosts = commaSeparatedList(process.env.copilotbrowser_MCP_ALLOWED_HOSTNAMES);
    options.allowedOrigins = semicolonSeparatedList(process.env.copilotbrowser_MCP_ALLOWED_ORIGINS);
    options.allowUnrestrictedFileAccess = envToBoolean(process.env.copilotbrowser_MCP_ALLOW_UNRESTRICTED_FILE_ACCESS);
    options.blockedOrigins = semicolonSeparatedList(process.env.copilotbrowser_MCP_BLOCKED_ORIGINS);
    options.blockServiceWorkers = envToBoolean(process.env.copilotbrowser_MCP_BLOCK_SERVICE_WORKERS);
    options.browser = envToString(process.env.copilotbrowser_MCP_BROWSER);
    options.caps = commaSeparatedList(process.env.copilotbrowser_MCP_CAPS);
    options.cdpEndpoint = envToString(process.env.copilotbrowser_MCP_CDP_ENDPOINT);
    options.cdpHeader = headerParser(process.env.copilotbrowser_MCP_CDP_HEADERS, {});
    options.cdpTimeout = numberParser(process.env.copilotbrowser_MCP_CDP_TIMEOUT);
    options.config = envToString(process.env.copilotbrowser_MCP_CONFIG);
    if (process.env.copilotbrowser_MCP_CONSOLE_LEVEL)
        options.consoleLevel = enumParser('--console-level', ['error', 'warning', 'info', 'debug'], process.env.copilotbrowser_MCP_CONSOLE_LEVEL);
    options.device = envToString(process.env.copilotbrowser_MCP_DEVICE);
    options.executablePath = envToString(process.env.copilotbrowser_MCP_EXECUTABLE_PATH);
    options.extension = envToBoolean(process.env.copilotbrowser_MCP_EXTENSION);
    options.grantPermissions = commaSeparatedList(process.env.copilotbrowser_MCP_GRANT_PERMISSIONS);
    options.headless = envToBoolean(process.env.copilotbrowser_MCP_HEADLESS);
    options.host = envToString(process.env.copilotbrowser_MCP_HOST);
    options.ignoreHttpsErrors = envToBoolean(process.env.copilotbrowser_MCP_IGNORE_HTTPS_ERRORS);
    const initPage = envToString(process.env.copilotbrowser_MCP_INIT_PAGE);
    if (initPage)
        options.initPage = [initPage];
    const initScript = envToString(process.env.copilotbrowser_MCP_INIT_SCRIPT);
    if (initScript)
        options.initScript = [initScript];
    options.isolated = envToBoolean(process.env.copilotbrowser_MCP_ISOLATED);
    if (process.env.copilotbrowser_MCP_IMAGE_RESPONSES)
        options.imageResponses = enumParser('--image-responses', ['allow', 'omit'], process.env.copilotbrowser_MCP_IMAGE_RESPONSES);
    options.sandbox = envToBoolean(process.env.copilotbrowser_MCP_SANDBOX);
    options.outputDir = envToString(process.env.copilotbrowser_MCP_OUTPUT_DIR);
    options.port = numberParser(process.env.copilotbrowser_MCP_PORT);
    options.proxyBypass = envToString(process.env.copilotbrowser_MCP_PROXY_BYPASS);
    options.proxyServer = envToString(process.env.copilotbrowser_MCP_PROXY_SERVER);
    options.saveTrace = envToBoolean(process.env.copilotbrowser_MCP_SAVE_TRACE);
    options.saveVideo = resolutionParser('--save-video', process.env.copilotbrowser_MCP_SAVE_VIDEO);
    options.secrets = dotenvFileLoader(process.env.copilotbrowser_MCP_SECRETS_FILE);
    options.storageState = envToString(process.env.copilotbrowser_MCP_STORAGE_STATE);
    options.testIdAttribute = envToString(process.env.copilotbrowser_MCP_TEST_ID_ATTRIBUTE);
    options.timeoutAction = numberParser(process.env.copilotbrowser_MCP_TIMEOUT_ACTION);
    options.timeoutNavigation = numberParser(process.env.copilotbrowser_MCP_TIMEOUT_NAVIGATION);
    options.userAgent = envToString(process.env.copilotbrowser_MCP_USER_AGENT);
    options.userDataDir = envToString(process.env.copilotbrowser_MCP_USER_DATA_DIR);
    options.viewportSize = resolutionParser('--viewport-size', process.env.copilotbrowser_MCP_VIEWPORT_SIZE);
    return configFromCLIOptions(options);
}
async function loadConfig(configFile) {
    if (!configFile)
        return {};
    if (configFile.endsWith('.ini'))
        return (0, configIni_1.configFromIniFile)(configFile);
    try {
        return JSON.parse(await fs_1.default.promises.readFile(configFile, 'utf8'));
    }
    catch {
        return (0, configIni_1.configFromIniFile)(configFile);
    }
}
// These methods should return resolved absolute file names.
function workspaceDir(clientInfo) {
    return path_1.default.resolve((0, server_2.firstRootPath)(clientInfo) ?? process.cwd());
}
async function workspaceFile(config, clientInfo, fileName, perCallWorkspaceDir) {
    const workspace = perCallWorkspaceDir ?? workspaceDir(clientInfo);
    const resolvedName = path_1.default.resolve(workspace, fileName);
    await checkFile(config, clientInfo, resolvedName, { origin: 'code' });
    return resolvedName;
}
function outputDir(config, clientInfo) {
    if (config.outputDir)
        return path_1.default.resolve(config.outputDir);
    const rootPath = (0, server_2.firstRootPath)(clientInfo);
    if (rootPath)
        return path_1.default.resolve(rootPath, config.skillMode ? '.copilotbrowser-cli' : '.copilotbrowser-mcp');
    const tmpDir = process.env.PW_TMPDIR_FOR_TEST ?? os_1.default.tmpdir();
    return path_1.default.resolve(tmpDir, 'copilotbrowser-mcp-output', String(clientInfo.timestamp));
}
async function outputFile(config, clientInfo, fileName, options) {
    const resolvedFile = path_1.default.resolve(outputDir(config, clientInfo), fileName);
    await checkFile(config, clientInfo, resolvedFile, options);
    await fs_1.default.promises.mkdir(path_1.default.dirname(resolvedFile), { recursive: true });
    (0, utilsBundle_1.debug)('pw:mcp:file')(resolvedFile);
    return resolvedFile;
}
async function checkFile(config, clientInfo, resolvedFilename, options) {
    // Trust code.
    if (options.origin === 'code')
        return;
    // Trust llm to use valid characters in file names.
    const output = outputDir(config, clientInfo);
    const workspace = workspaceDir(clientInfo);
    if (!resolvedFilename.startsWith(output) && !resolvedFilename.startsWith(workspace))
        throw new Error(`Resolved file path ${resolvedFilename} is outside of the output directory ${output} and workspace directory ${workspace}. Use relative file names to stay within the output directory.`);
}
function pickDefined(obj) {
    return Object.fromEntries(Object.entries(obj ?? {}).filter(([_, v]) => v !== undefined));
}
function mergeConfig(base, overrides) {
    const browser = {
        ...pickDefined(base.browser),
        ...pickDefined(overrides.browser),
        browserName: overrides.browser?.browserName ?? base.browser?.browserName ?? 'chromium',
        isolated: overrides.browser?.isolated ?? base.browser?.isolated ?? false,
        launchOptions: {
            ...pickDefined(base.browser?.launchOptions),
            ...pickDefined(overrides.browser?.launchOptions),
            ...{ assistantMode: true },
        },
        contextOptions: {
            ...pickDefined(base.browser?.contextOptions),
            ...pickDefined(overrides.browser?.contextOptions),
        },
    };
    if (browser.browserName !== 'chromium' && browser.launchOptions)
        delete browser.launchOptions.channel;
    return {
        ...pickDefined(base),
        ...pickDefined(overrides),
        browser,
        console: {
            ...pickDefined(base.console),
            ...pickDefined(overrides.console),
        },
        network: {
            ...pickDefined(base.network),
            ...pickDefined(overrides.network),
        },
        server: {
            ...pickDefined(base.server),
            ...pickDefined(overrides.server),
        },
        snapshot: {
            ...pickDefined(base.snapshot),
            ...pickDefined(overrides.snapshot),
        },
        timeouts: {
            ...pickDefined(base.timeouts),
            ...pickDefined(overrides.timeouts),
        },
    };
}
function semicolonSeparatedList(value) {
    if (!value)
        return undefined;
    return value.split(';').map(v => v.trim());
}
function commaSeparatedList(value) {
    if (!value)
        return undefined;
    return value.split(',').map(v => v.trim());
}
function dotenvFileLoader(value) {
    if (!value)
        return undefined;
    return utilsBundle_1.dotenv.parse(fs_1.default.readFileSync(value, 'utf8'));
}
function numberParser(value) {
    if (!value)
        return undefined;
    return +value;
}
function resolutionParser(name, value) {
    if (!value)
        return undefined;
    if (value.includes('x')) {
        const [width, height] = value.split('x').map(v => +v);
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0)
            throw new Error(`Invalid resolution format: use ${name}="800x600"`);
        return { width, height };
    }
    // Legacy format
    if (value.includes(',')) {
        const [width, height] = value.split(',').map(v => +v);
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0)
            throw new Error(`Invalid resolution format: use ${name}="800x600"`);
        return { width, height };
    }
    throw new Error(`Invalid resolution format: use ${name}="800x600"`);
}
function headerParser(arg, previous) {
    if (!arg)
        return previous || {};
    const result = previous || {};
    const [name, value] = arg.split(':').map(v => v.trim());
    result[name] = value;
    return result;
}
function enumParser(name, options, value) {
    if (!options.includes(value))
        throw new Error(`Invalid ${name}: ${value}. Valid values are: ${options.join(', ')}`);
    return value;
}
function envToBoolean(value) {
    if (value === 'true' || value === '1')
        return true;
    if (value === 'false' || value === '0')
        return false;
    return undefined;
}
function envToString(value) {
    return value ? value.trim() : undefined;
}
function autoDetectBrowserChannel(config) {
    const candidateChannels = ['chrome', 'msedge', 'chromium'];
    const currentChannel = config.browser.launchOptions.channel ?? 'chrome';
    // Check if the current default channel has an executable available.
    const currentExecutable = server_1.registry.findExecutable(currentChannel);
    if (currentExecutable?.executablePath())
        return;
    for (const candidate of candidateChannels) {
        if (candidate === currentChannel)
            continue;
        const executable = server_1.registry.findExecutable(candidate);
        if (executable?.executablePath()) {
            // eslint-disable-next-line no-console
            console.error(`Browser "${currentChannel}" not found, using "${candidate}" instead.`);
            config.browser.launchOptions.channel = candidate;
            return;
        }
    }
}
function checkFfmpeg() {
    try {
        const executable = server_1.registry.findExecutable('ffmpeg');
        return fs_1.default.existsSync(executable.executablePath());
    }
    catch (error) {
        return false;
    }
}
