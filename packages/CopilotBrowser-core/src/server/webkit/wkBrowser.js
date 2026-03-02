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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WKBrowserContext = exports.WKBrowser = void 0;
const utils_1 = require("../../utils");
const browser_1 = require("../browser");
const browserContext_1 = require("../browserContext");
const network = __importStar(require("../network"));
const wkConnection_1 = require("./wkConnection");
const wkPage_1 = require("./wkPage");
const webkit_1 = require("./webkit");
const BROWSER_VERSION = '26.0';
const DEFAULT_USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${BROWSER_VERSION} Safari/605.1.15`;
class WKBrowser extends browser_1.Browser {
    _connection;
    _browserSession;
    _contexts = new Map();
    _wkPages = new Map();
    static async connect(parent, transport, options) {
        const browser = new WKBrowser(parent, transport, options);
        if (options.__testHookOnConnectToBrowser)
            await options.__testHookOnConnectToBrowser();
        const promises = [
            browser._browserSession.send('copilotbrowser.enable'),
        ];
        if (options.persistent) {
            options.persistent.userAgent ||= DEFAULT_USER_AGENT;
            browser._defaultContext = new WKBrowserContext(browser, undefined, options.persistent);
            promises.push(browser._defaultContext._initialize());
        }
        await Promise.all(promises);
        return browser;
    }
    constructor(parent, transport, options) {
        super(parent, options);
        this._connection = new wkConnection_1.WKConnection(transport, this._onDisconnect.bind(this), options.protocolLogger, options.browserLogsCollector);
        this._browserSession = this._connection.browserSession;
        this._browserSession.on('copilotbrowser.pageProxyCreated', this._onPageProxyCreated.bind(this));
        this._browserSession.on('copilotbrowser.pageProxyDestroyed', this._onPageProxyDestroyed.bind(this));
        this._browserSession.on('copilotbrowser.provisionalLoadFailed', event => this._onProvisionalLoadFailed(event));
        this._browserSession.on('copilotbrowser.windowOpen', event => this._onWindowOpen(event));
        this._browserSession.on('copilotbrowser.downloadCreated', this._onDownloadCreated.bind(this));
        this._browserSession.on('copilotbrowser.downloadFilenameSuggested', this._onDownloadFilenameSuggested.bind(this));
        this._browserSession.on('copilotbrowser.downloadFinished', this._onDownloadFinished.bind(this));
        this._browserSession.on(wkConnection_1.kPageProxyMessageReceived, this._onPageProxyMessageReceived.bind(this));
    }
    _onDisconnect() {
        for (const wkPage of this._wkPages.values())
            wkPage.didClose();
        this._wkPages.clear();
        this._didClose();
    }
    async doCreateNewContext(options) {
        const proxy = options.proxyOverride || options.proxy;
        const createOptions = proxy ? {
            // Enable socks5 hostname resolution on Windows.
            // See https://github.com/dayour/copilotbrowser/issues/20451
            proxyServer: process.platform === 'win32' && this.attribution.browser?.options.channel !== 'webkit-wsl' ? proxy.server.replace(/^socks5:\/\//, 'socks5h://') : proxy.server,
            proxyBypassList: proxy.bypass
        } : undefined;
        const { browserContextId } = await this._browserSession.send('copilotbrowser.createContext', createOptions);
        options.userAgent = options.userAgent || DEFAULT_USER_AGENT;
        const context = new WKBrowserContext(this, browserContextId, options);
        await context._initialize();
        this._contexts.set(browserContextId, context);
        return context;
    }
    contexts() {
        return Array.from(this._contexts.values());
    }
    version() {
        return BROWSER_VERSION;
    }
    userAgent() {
        return DEFAULT_USER_AGENT;
    }
    _onDownloadCreated(payload) {
        const page = this._wkPages.get(payload.pageProxyId);
        if (!page)
            return;
        // In some cases, e.g. blob url download, we receive only frameScheduledNavigation
        // but no signals that the navigation was canceled and replaced by download. Fix it
        // here by simulating cancelled provisional load which matches downloads from network.
        //
        // TODO: this is racy, because download might be unrelated any navigation, and we will
        // abort navigation that is still running. We should be able to fix this by
        // instrumenting policy decision start/proceed/cancel.
        //
        // Since https://commits.webkit.org/298732@main, WebKit doesn't provide frame id for
        // navigations converted into downloads and the download has a fake frameId. We map it
        // to the main frame.
        let frameId = payload.frameId;
        if (!page._page.frameManager.frame(frameId))
            frameId = page._page.mainFrame()._id;
        page._page.frameManager.frameAbortedNavigation(frameId, 'Download is starting');
        let originPage = page._page.initializedOrUndefined();
        // If it's a new window download, report it on the opener page.
        if (!originPage) {
            // Resume the page creation with an error. The page will automatically close right
            // after the download begins.
            page._firstNonInitialNavigationCommittedReject(new Error('Starting new page download'));
            if (page._opener)
                originPage = page._opener._page.initializedOrUndefined();
        }
        if (!originPage)
            return;
        this._downloadCreated(originPage, payload.uuid, payload.url);
    }
    _onDownloadFilenameSuggested(payload) {
        this._downloadFilenameSuggested(payload.uuid, payload.suggestedFilename);
    }
    _onDownloadFinished(payload) {
        this._downloadFinished(payload.uuid, payload.error);
    }
    _onPageProxyCreated(event) {
        const pageProxyId = event.pageProxyId;
        let context = null;
        if (event.browserContextId) {
            // FIXME: we don't know about the default context id, so assume that all targets from
            // unknown contexts are created in the 'default' context which can in practice be represented
            // by multiple actual contexts in WebKit. Solving this properly will require adding context
            // lifecycle events.
            context = this._contexts.get(event.browserContextId) || null;
        }
        if (!context)
            context = this._defaultContext;
        if (!context)
            return;
        const pageProxySession = new wkConnection_1.WKSession(this._connection, pageProxyId, (message) => {
            this._connection.rawSend({ ...message, pageProxyId });
        });
        const opener = event.openerId ? this._wkPages.get(event.openerId) : undefined;
        const wkPage = new wkPage_1.WKPage(context, pageProxySession, opener || null);
        this._wkPages.set(pageProxyId, wkPage);
    }
    _onPageProxyDestroyed(event) {
        const pageProxyId = event.pageProxyId;
        const wkPage = this._wkPages.get(pageProxyId);
        if (!wkPage)
            return;
        this._wkPages.delete(pageProxyId);
        wkPage.didClose();
    }
    _onPageProxyMessageReceived(event) {
        const wkPage = this._wkPages.get(event.pageProxyId);
        if (!wkPage)
            return;
        wkPage.dispatchMessageToSession(event.message);
    }
    _onProvisionalLoadFailed(event) {
        const wkPage = this._wkPages.get(event.pageProxyId);
        if (!wkPage)
            return;
        wkPage.handleProvisionalLoadFailed(event);
    }
    _onWindowOpen(event) {
        const wkPage = this._wkPages.get(event.pageProxyId);
        if (!wkPage)
            return;
        wkPage.handleWindowOpen(event);
    }
    isConnected() {
        return !this._connection.isClosed();
    }
}
exports.WKBrowser = WKBrowser;
class WKBrowserContext extends browserContext_1.BrowserContext {
    constructor(browser, browserContextId, options) {
        super(browser, options, browserContextId);
        this._validateEmulatedViewport(options.viewport);
        this._authenticateProxyViaHeader();
    }
    async _initialize() {
        (0, utils_1.assert)(!this._wkPages().length);
        const browserContextId = this._browserContextId;
        const promises = [super._initialize()];
        promises.push(this._browser._browserSession.send('copilotbrowser.setDownloadBehavior', {
            behavior: this._options.acceptDownloads === 'accept' ? 'allow' : 'deny',
            downloadPath: this._browser.options.channel === 'webkit-wsl' ? await (0, webkit_1.translatePathToWSL)(this._browser.options.downloadsPath) : this._browser.options.downloadsPath,
            browserContextId
        }));
        if (this._options.ignoreHTTPSErrors || this._options.internalIgnoreHTTPSErrors)
            promises.push(this._browser._browserSession.send('copilotbrowser.setIgnoreCertificateErrors', { browserContextId, ignore: true }));
        if (this._options.locale)
            promises.push(this._browser._browserSession.send('copilotbrowser.setLanguages', { browserContextId, languages: [this._options.locale] }));
        if (this._options.geolocation)
            promises.push(this.setGeolocation(this._options.geolocation));
        if (this._options.offline)
            promises.push(this.doUpdateOffline());
        if (this._options.httpCredentials)
            promises.push(this.setHTTPCredentials(this._options.httpCredentials));
        await Promise.all(promises);
    }
    _wkPages() {
        return Array.from(this._browser._wkPages.values()).filter(wkPage => wkPage._browserContext === this);
    }
    possiblyUninitializedPages() {
        return this._wkPages().map(wkPage => wkPage._page);
    }
    async doCreateNewPage() {
        const { pageProxyId } = await this._browser._browserSession.send('copilotbrowser.createPage', { browserContextId: this._browserContextId });
        return this._browser._wkPages.get(pageProxyId)._page;
    }
    async doGetCookies(urls) {
        const { cookies } = await this._browser._browserSession.send('copilotbrowser.getAllCookies', { browserContextId: this._browserContextId });
        return network.filterCookies(cookies.map((c) => {
            const { name, value, domain, path, expires, httpOnly, secure, sameSite } = c;
            const copy = {
                name,
                value,
                domain,
                path,
                expires: expires === -1 ? -1 : expires / 1000,
                httpOnly,
                secure,
                sameSite,
            };
            return copy;
        }), urls);
    }
    async addCookies(cookies) {
        const cc = network.rewriteCookies(cookies).map(c => {
            const { name, value, domain, path, expires, httpOnly, secure, sameSite } = c;
            const copy = {
                name,
                value,
                domain: domain,
                path: path,
                expires: expires && expires !== -1 ? expires * 1000 : expires,
                httpOnly,
                secure,
                sameSite,
                session: expires === -1 || expires === undefined,
            };
            return copy;
        });
        await this._browser._browserSession.send('copilotbrowser.setCookies', { cookies: cc, browserContextId: this._browserContextId });
    }
    async doClearCookies() {
        await this._browser._browserSession.send('copilotbrowser.deleteAllCookies', { browserContextId: this._browserContextId });
    }
    async doGrantPermissions(origin, permissions) {
        await Promise.all(this.pages().map(page => page.delegate._grantPermissions(origin, permissions)));
    }
    async doClearPermissions() {
        await Promise.all(this.pages().map(page => page.delegate._clearPermissions()));
    }
    async setGeolocation(geolocation) {
        (0, browserContext_1.verifyGeolocation)(geolocation);
        this._options.geolocation = geolocation;
        const payload = geolocation ? { ...geolocation, timestamp: Date.now() } : undefined;
        await this._browser._browserSession.send('copilotbrowser.setGeolocationOverride', { browserContextId: this._browserContextId, geolocation: payload });
    }
    async doUpdateExtraHTTPHeaders() {
        for (const page of this.pages())
            await page.delegate.updateExtraHTTPHeaders();
    }
    async setUserAgent(userAgent) {
        this._options.userAgent = userAgent;
        for (const page of this.pages())
            await page.delegate.updateUserAgent();
    }
    async doUpdateOffline() {
        for (const page of this.pages())
            await page.delegate.updateOffline();
    }
    async doSetHTTPCredentials(httpCredentials) {
        this._options.httpCredentials = httpCredentials;
        for (const page of this.pages())
            await page.delegate.updateHttpCredentials();
    }
    async doAddInitScript(initScript) {
        for (const page of this.pages())
            await page.delegate._updateBootstrapScript();
    }
    async doRemoveInitScripts(initScripts) {
        for (const page of this.pages())
            await page.delegate._updateBootstrapScript();
    }
    async doUpdateRequestInterception() {
        for (const page of this.pages())
            await page.delegate.updateRequestInterception();
    }
    async doUpdateDefaultViewport() {
        // No-op, because each page resets its own viewport.
    }
    async doUpdateDefaultEmulatedMedia() {
        // No-op, because each page resets its own color scheme.
    }
    async doExposecopilotbrowserBinding() {
        for (const page of this.pages())
            await page.delegate.exposecopilotbrowserBinding();
    }
    onClosePersistent() { }
    async clearCache() {
        // We use ephemeral contexts so there is no disk cache.
        await this._browser._browserSession.send('copilotbrowser.clearMemoryCache', {
            browserContextId: this._browserContextId
        });
    }
    async doClose(reason) {
        if (!this._browserContextId) {
            await Promise.all(this._wkPages().map(wkPage => wkPage._page.screencast.stopVideoRecording()));
            // Closing persistent context should close the browser.
            await this._browser.close({ reason });
        }
        else {
            await this._browser._browserSession.send('copilotbrowser.deleteContext', { browserContextId: this._browserContextId });
            this._browser._contexts.delete(this._browserContextId);
        }
    }
    async cancelDownload(uuid) {
        await this._browser._browserSession.send('copilotbrowser.cancelDownload', { uuid });
    }
    _validateEmulatedViewport(viewportSize) {
        if (!viewportSize)
            return;
        if (process.platform === 'win32' && this._browser.options.headful && (viewportSize.width < 250 || viewportSize.height < 240))
            throw new Error(`WebKit on Windows has a minimal viewport of 250x240.`);
    }
}
exports.WKBrowserContext = WKBrowserContext;
