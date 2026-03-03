"use strict";
/**
 * Copyright (c) Microsoft Corporation.
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
exports.startTraceViewerServer = startTraceViewerServer;
exports.installRootRedirect = installRootRedirect;
exports.runTraceViewerApp = runTraceViewerApp;
exports.runTraceInBrowser = runTraceInBrowser;
exports.openTraceViewerApp = openTraceViewerApp;
exports.openTraceInBrowser = openTraceInBrowser;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../../utils");
const utils_2 = require("../../../utils");
const httpServer_1 = require("../../utils/httpServer");
const utilsBundle_1 = require("../../../utilsBundle");
const launchApp_1 = require("../../launchApp");
const launchApp_2 = require("../../launchApp");
const copilotbrowser_1 = require("../../copilotbrowser");
const progress_1 = require("../../progress");
const tracesDirMarker = 'traces.dir';
function validateTraceUrlOrPath(traceFileOrUrl) {
    if (!traceFileOrUrl)
        return traceFileOrUrl;
    if (traceFileOrUrl.startsWith('http://') || traceFileOrUrl.startsWith('https://'))
        return traceFileOrUrl;
    let traceFile = traceFileOrUrl;
    // If .json is requested, we'll synthesize it.
    if (traceFile.endsWith('.json'))
        return toFilePathUrl(traceFile);
    try {
        const stat = fs_1.default.statSync(traceFile);
        // If the path is a directory, add 'trace.dir' which has a special handler.
        if (stat.isDirectory())
            traceFile = path_1.default.join(traceFile, tracesDirMarker);
        return toFilePathUrl(traceFile);
    }
    catch {
        throw new Error(`Trace file ${traceFileOrUrl} does not exist!`);
    }
}
async function startTraceViewerServer(options) {
    const server = new httpServer_1.HttpServer();
    server.routePrefix('/trace', (request, response) => {
        const url = new URL('http://localhost' + request.url);
        const relativePath = url.pathname.slice('/trace'.length);
        if (relativePath.startsWith('/file')) {
            try {
                const filePath = url.searchParams.get('path');
                if (fs_1.default.existsSync(filePath))
                    return server.serveFile(request, response, url.searchParams.get('path'));
                // If .json is requested, we'll synthesize it for zip-less operation.
                if (filePath.endsWith('.json')) {
                    const fullPrefix = filePath.substring(0, filePath.length - '.json'.length);
                    // Live traces are stored in the common artifacts directory. Trace files
                    // corresponding to a particular test, all have the same unique prefix.
                    return sendTraceDescriptor(response, path_1.default.dirname(fullPrefix), path_1.default.basename(fullPrefix));
                }
                // If 'trace.dir' is requested, return all trace files inside.
                if (filePath.endsWith(tracesDirMarker))
                    return sendTraceDescriptor(response, path_1.default.dirname(filePath));
            }
            catch {
            }
            response.statusCode = 404;
            response.end();
            return true;
        }
        const absolutePath = path_1.default.join(__dirname, '..', '..', '..', 'vite', 'traceViewer', ...relativePath.split('/'));
        return server.serveFile(request, response, absolutePath);
    });
    const transport = options?.transport || (options?.isServer ? new StdinServer() : undefined);
    if (transport)
        server.createWebSocket(() => transport);
    const { host, port } = options || {};
    await server.start({ preferredPort: port, host });
    return server;
}
async function installRootRedirect(server, traceUrl, options) {
    const params = new URLSearchParams();
    if (path_1.default.sep !== path_1.default.posix.sep)
        params.set('pathSeparator', path_1.default.sep);
    if (traceUrl)
        params.append('trace', traceUrl);
    if (server.wsGuid())
        params.append('ws', server.wsGuid());
    if (options?.isServer)
        params.append('isServer', '');
    if ((0, utils_2.isUnderTest)())
        params.append('isUnderTest', 'true');
    for (const arg of options.args || [])
        params.append('arg', arg);
    if (options.grep)
        params.append('grep', options.grep);
    if (options.grepInvert)
        params.append('grepInvert', options.grepInvert);
    for (const project of options.project || [])
        params.append('project', project);
    for (const reporter of options.reporter || [])
        params.append('reporter', reporter);
    const urlPath = `./trace/${options.webApp || 'index.html'}?${params.toString()}`;
    server.routePath('/', (_, response) => {
        response.statusCode = 302;
        response.setHeader('Location', urlPath);
        response.end();
        return true;
    });
}
async function runTraceViewerApp(traceUrl, browserName, options, exitOnClose) {
    traceUrl = validateTraceUrlOrPath(traceUrl);
    const server = await startTraceViewerServer(options);
    await installRootRedirect(server, traceUrl, options);
    const page = await openTraceViewerApp(server.urlPrefix('precise'), browserName, options);
    if (exitOnClose)
        page.on('close', () => (0, utils_1.gracefullyProcessExitDoNotHang)(0));
    return page;
}
async function runTraceInBrowser(traceUrl, options) {
    traceUrl = validateTraceUrlOrPath(traceUrl);
    const server = await startTraceViewerServer(options);
    await installRootRedirect(server, traceUrl, options);
    await openTraceInBrowser(server.urlPrefix('human-readable'));
}
async function openTraceViewerApp(url, browserName, options) {
    const traceViewercopilotbrowser = (0, copilotbrowser_1.createcopilotbrowser)({ sdkLanguage: 'javascript', isInternalcopilotbrowser: true });
    const traceViewerBrowser = (0, utils_2.isUnderTest)() ? 'chromium' : browserName;
    const { context, page } = await (0, launchApp_2.launchApp)(traceViewercopilotbrowser[traceViewerBrowser], {
        sdkLanguage: traceViewercopilotbrowser.options.sdkLanguage,
        windowSize: { width: 1280, height: 800 },
        persistentContextOptions: {
            ...options?.persistentContextOptions,
            cdpPort: (0, utils_2.isUnderTest)() ? 0 : undefined,
            headless: !!options?.headless,
            colorScheme: (0, utils_2.isUnderTest)() ? 'light' : undefined,
        },
    });
    const controller = new progress_1.ProgressController();
    await controller.run(async (progress) => {
        await context._browser._defaultContext._loadDefaultContextAsIs(progress);
        if (process.env.PWTEST_PRINT_WS_ENDPOINT) {
            // eslint-disable-next-line no-restricted-properties
            process.stderr.write('DevTools listening on: ' + context._browser.options.wsEndpoint + '\n');
        }
        if (!(0, utils_2.isUnderTest)())
            await (0, launchApp_1.syncLocalStorageWithSettings)(page, 'traceviewer');
        if ((0, utils_2.isUnderTest)())
            page.on('close', () => context.close({ reason: 'Trace viewer closed' }).catch(() => { }));
        await page.mainFrame().goto(progress, url);
    });
    return page;
}
async function openTraceInBrowser(url) {
    // eslint-disable-next-line no-console
    console.log('\nListening on ' + url);
    if (!(0, utils_2.isUnderTest)())
        await (0, utilsBundle_1.open)(url.replace('0.0.0.0', 'localhost')).catch(() => { });
}
class StdinServer {
    _pollTimer;
    _traceUrl;
    constructor() {
        process.stdin.on('data', data => {
            const url = validateTraceUrlOrPath(data.toString().trim());
            if (!url || url === this._traceUrl)
                return;
            if (url.endsWith('.json'))
                this._pollLoadTrace(url);
            else
                this._loadTrace(url);
        });
        process.stdin.on('close', () => (0, utils_1.gracefullyProcessExitDoNotHang)(0));
    }
    onconnect() {
    }
    async dispatch(method, params) {
        if (method === 'initialize') {
            if (this._traceUrl)
                this._loadTrace(this._traceUrl);
        }
    }
    onclose() {
    }
    sendEvent;
    close;
    _loadTrace(traceUrl) {
        this._traceUrl = traceUrl;
        clearTimeout(this._pollTimer);
        this.sendEvent?.('loadTraceRequested', { traceUrl });
    }
    _pollLoadTrace(url) {
        this._loadTrace(url);
        this._pollTimer = setTimeout(() => {
            this._pollLoadTrace(url);
        }, 500);
    }
}
function sendTraceDescriptor(response, traceDir, tracePrefix) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(traceDescriptor(traceDir, tracePrefix)));
    return true;
}
function traceDescriptor(traceDir, tracePrefix) {
    const result = {
        entries: []
    };
    for (const name of fs_1.default.readdirSync(traceDir)) {
        if (!tracePrefix || name.startsWith(tracePrefix))
            result.entries.push({ name, path: toFilePathUrl(path_1.default.join(traceDir, name)) });
    }
    const resourcesDir = path_1.default.join(traceDir, 'resources');
    if (fs_1.default.existsSync(resourcesDir)) {
        for (const name of fs_1.default.readdirSync(resourcesDir))
            result.entries.push({ name: 'resources/' + name, path: toFilePathUrl(path_1.default.join(resourcesDir, name)) });
    }
    return result;
}
function toFilePathUrl(filePath) {
    return `file?path=${encodeURIComponent(filePath)}`;
}
