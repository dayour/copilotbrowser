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
exports.Context = void 0;
const os_1 = __importDefault(require("os"));
const utilsBundle_1 = require("copilotbrowser-core/lib/utilsBundle");
const utils_1 = require("copilotbrowser-core/lib/utils");
const copilotbrowser_core_1 = require("copilotbrowser-core");
const url_1 = require("url");
const log_1 = require("../log");
const tab_1 = require("./tab");
const config_1 = require("./config");
const testDebug = (0, utilsBundle_1.debug)('pw:mcp:test');
class Context {
    config;
    sessionLog;
    options;
    _browserContextPromise;
    _browserContextFactory;
    _tabs = [];
    _currentTab;
    _clientInfo;
    _routes = [];
    _video;
    static _allContexts = new Set();
    _closeBrowserContextPromise;
    _runningToolName;
    _abortController = new AbortController();
    constructor(options) {
        this.config = options.config;
        this.sessionLog = options.sessionLog;
        this.options = options;
        this._browserContextFactory = options.browserContextFactory;
        this._clientInfo = options.clientInfo;
        testDebug('create context');
        Context._allContexts.add(this);
    }
    static async disposeAll() {
        await Promise.all([...Context._allContexts].map(context => context.dispose()));
    }
    tabs() {
        return this._tabs;
    }
    currentTab() {
        return this._currentTab;
    }
    currentTabOrDie() {
        if (!this._currentTab)
            throw new Error('No open pages available.');
        return this._currentTab;
    }
    async newTab() {
        const { browserContext } = await this._ensureBrowserContext();
        const page = await browserContext.newPage();
        this._currentTab = this._tabs.find(t => t.page === page);
        return this._currentTab;
    }
    async selectTab(index) {
        const tab = this._tabs[index];
        if (!tab)
            throw new Error(`Tab ${index} not found`);
        await tab.page.bringToFront();
        this._currentTab = tab;
        return tab;
    }
    async ensureTab() {
        const { browserContext } = await this._ensureBrowserContext();
        if (!this._currentTab)
            await browserContext.newPage();
        return this._currentTab;
    }
    async closeTab(index) {
        const tab = index === undefined ? this._currentTab : this._tabs[index];
        if (!tab)
            throw new Error(`Tab ${index} not found`);
        const url = tab.page.url();
        await tab.page.close();
        return url;
    }
    async workspaceFile(fileName, perCallWorkspaceDir) {
        return await (0, config_1.workspaceFile)(this.config, this._clientInfo, fileName, perCallWorkspaceDir);
    }
    async outputFile(template, options) {
        const baseName = template.suggestedFilename || `${template.prefix}-${(template.date ?? new Date()).toISOString().replace(/[:.]/g, '-')}${template.ext ? '.' + template.ext : ''}`;
        return await (0, config_1.outputFile)(this.config, this._clientInfo, baseName, options);
    }
    async startVideoRecording(params) {
        if (this._video)
            throw new Error('Video recording has already been started.');
        const listener = (page) => {
            this._video?.allVideos.add(page.video());
            page.video().start(params).catch(() => { });
        };
        this._video = { allVideos: new Set(), listener };
        const browserContext = await this.ensureBrowserContext();
        browserContext.pages().forEach(listener);
        browserContext.on('page', listener);
    }
    async stopVideoRecording() {
        if (!this._video)
            throw new Error('Video recording has not been started.');
        const video = this._video;
        if (this._browserContextPromise) {
            const { browserContext } = await this._browserContextPromise;
            browserContext.off('page', video.listener);
            for (const page of browserContext.pages())
                await page.video().stop().catch(() => { });
        }
        this._video = undefined;
        return video.allVideos;
    }
    _onPageCreated(page) {
        const tab = new tab_1.Tab(this, page, tab => this._onPageClosed(tab));
        this._tabs.push(tab);
        if (!this._currentTab)
            this._currentTab = tab;
    }
    _onPageClosed(tab) {
        const index = this._tabs.indexOf(tab);
        if (index === -1)
            return;
        this._tabs.splice(index, 1);
        if (this._currentTab === tab)
            this._currentTab = this._tabs[Math.min(index, this._tabs.length - 1)];
        if (!this._tabs.length)
            void this.closeBrowserContext();
    }
    async closeBrowserContext() {
        if (!this._closeBrowserContextPromise)
            this._closeBrowserContextPromise = this._closeBrowserContextImpl().catch(log_1.logUnhandledError);
        await this._closeBrowserContextPromise;
        this._closeBrowserContextPromise = undefined;
    }
    routes() {
        return this._routes;
    }
    async addRoute(entry) {
        const { browserContext } = await this._ensureBrowserContext();
        await browserContext.route(entry.pattern, entry.handler);
        this._routes.push(entry);
    }
    async removeRoute(pattern) {
        if (!this._browserContextPromise)
            return 0;
        const { browserContext } = await this._browserContextPromise;
        let removed = 0;
        if (pattern) {
            const toRemove = this._routes.filter(r => r.pattern === pattern);
            for (const route of toRemove)
                await browserContext.unroute(route.pattern, route.handler);
            this._routes = this._routes.filter(r => r.pattern !== pattern);
            removed = toRemove.length;
        }
        else {
            for (const route of this._routes)
                await browserContext.unroute(route.pattern, route.handler);
            removed = this._routes.length;
            this._routes = [];
        }
        return removed;
    }
    isRunningTool() {
        return this._runningToolName !== undefined;
    }
    setRunningTool(name) {
        this._runningToolName = name;
    }
    async _closeBrowserContextImpl() {
        if (!this._browserContextPromise)
            return;
        testDebug('close context');
        const promise = this._browserContextPromise;
        this._browserContextPromise = undefined;
        await promise.then(async ({ browserContext, close }) => {
            if (this.config.saveTrace)
                await browserContext.tracing.stop();
            await close();
        });
    }
    async dispose() {
        this._abortController.abort('MCP context disposed');
        await this.closeBrowserContext();
        Context._allContexts.delete(this);
    }
    async _setupRequestInterception(context) {
        if (this.config.network?.allowedOrigins?.length) {
            await context.route('**', route => route.abort('blockedbyclient'));
            for (const origin of this.config.network.allowedOrigins)
                await context.route(originOrHostGlob(origin), route => route.continue());
        }
        if (this.config.network?.blockedOrigins?.length) {
            for (const origin of this.config.network.blockedOrigins)
                await context.route(originOrHostGlob(origin), route => route.abort('blockedbyclient'));
        }
    }
    async ensureBrowserContext() {
        const { browserContext } = await this._ensureBrowserContext();
        return browserContext;
    }
    _ensureBrowserContext() {
        if (this._browserContextPromise)
            return this._browserContextPromise;
        this._browserContextPromise = this._setupBrowserContext();
        this._browserContextPromise.catch(() => {
            this._browserContextPromise = undefined;
        });
        return this._browserContextPromise;
    }
    async _setupBrowserContext() {
        if (this._closeBrowserContextPromise)
            throw new Error('Another browser context is being closed.');
        // TODO: move to the browser context factory to make it based on isolation mode.
        if (this.config.testIdAttribute)
            copilotbrowser_core_1.selectors.setTestIdAttribute(this.config.testIdAttribute);
        const result = await this._browserContextFactory.createContext(this._clientInfo, this._abortController.signal, { toolName: this._runningToolName });
        const { browserContext } = result;
        if (!this.config.allowUnrestrictedFileAccess) {
            browserContext._setAllowedProtocols(['http:', 'https:', 'about:', 'data:']);
            browserContext._setAllowedDirectories(allRootPaths(this._clientInfo));
        }
        await this._setupRequestInterception(browserContext);
        for (const page of browserContext.pages())
            this._onPageCreated(page);
        browserContext.on('page', page => this._onPageCreated(page));
        if (this.config.saveTrace) {
            await browserContext.tracing.start({
                name: 'trace-' + Date.now(),
                screenshots: true,
                snapshots: true,
                _live: true,
            });
        }
        return result;
    }
    lookupSecret(secretName) {
        if (!this.config.secrets?.[secretName])
            return { value: secretName, code: (0, utils_1.escapeWithQuotes)(secretName, '\'') };
        return {
            value: this.config.secrets[secretName],
            code: `process.env['${secretName}']`,
        };
    }
    firstRootPath() {
        return allRootPaths(this._clientInfo)[0];
    }
}
exports.Context = Context;
function allRootPaths(clientInfo) {
    const paths = [];
    for (const root of clientInfo.roots) {
        const url = new URL(root.uri);
        let rootPath;
        try {
            rootPath = (0, url_1.fileURLToPath)(url);
        }
        catch (e) {
            // Support WSL paths on Windows.
            if (e.code === 'ERR_INVALID_FILE_URL_PATH' && os_1.default.platform() === 'win32')
                rootPath = decodeURIComponent(url.pathname);
        }
        if (!rootPath)
            continue;
        paths.push(rootPath);
    }
    if (paths.length === 0)
        paths.push(process.cwd());
    return paths;
}
function originOrHostGlob(originOrHost) {
    // Support wildcard port patterns like "http://localhost:*" or "https://example.com:*"
    const wildcardPortMatch = originOrHost.match(/^(https?:\/\/[^/:]+):\*$/);
    if (wildcardPortMatch)
        return `${wildcardPortMatch[1]}:*/**`;
    try {
        const url = new URL(originOrHost);
        // localhost:1234 will parse as protocol 'localhost:' and 'null' origin.
        if (url.origin !== 'null')
            return `${url.origin}/**`;
    }
    catch {
    }
    // Support for legacy host-only mode.
    return `*://${originOrHost}/**`;
}
