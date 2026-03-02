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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevToolsController = void 0;
const utils_1 = require("../utils");
const httpServer_1 = require("./utils/httpServer");
const browserContext_1 = require("./browserContext");
const page_1 = require("./page");
const progress_1 = require("./progress");
const recorder_1 = require("./recorder");
const crPage_1 = require("./chromium/crPage");
const crConnection_1 = require("./chromium/crConnection");
class DevToolsController {
    _context;
    _url;
    _httpServer;
    constructor(context) {
        this._context = context;
    }
    async start(options) {
        if (!this._url) {
            const guid = (0, utils_1.createGuid)();
            this._httpServer = new httpServer_1.HttpServer();
            this._httpServer.createWebSocket(url => {
                if (url.searchParams.has('cdp'))
                    return new CDPConnection(this._context, url.searchParams.get('cdp'));
                return new DevToolsConnection(this._context, this._url);
            }, guid);
            await this._httpServer.start({ port: options.port, host: options.host });
            this._url = (this._httpServer.urlPrefix('human-readable') + `/${guid}`).replace('http://', 'ws://');
        }
        return this._url;
    }
    async dispose() {
        await this._httpServer?.stop();
    }
}
exports.DevToolsController = DevToolsController;
class DevToolsConnection {
    version = 1;
    sendEvent;
    close;
    selectedPage = null;
    _lastFrameData = null;
    _lastViewportSize = null;
    _pageListeners = [];
    _contextListeners = [];
    _recorderListeners = [];
    _context;
    _controllerUrl;
    _recorder = null;
    _eventListeners = new Map();
    constructor(context, controllerUrl) {
        this._context = context;
        this._controllerUrl = controllerUrl;
    }
    on(event, listener) {
        let set = this._eventListeners.get(event);
        if (!set) {
            set = new Set();
            this._eventListeners.set(event, set);
        }
        set.add(listener);
    }
    off(event, listener) {
        this._eventListeners.get(event)?.delete(listener);
    }
    _emit(event, params) {
        this.sendEvent?.(event, params);
        const set = this._eventListeners.get(event);
        if (set) {
            for (const fn of set)
                fn(params);
        }
    }
    onconnect() {
        const context = this._context;
        this._contextListeners.push(utils_1.eventsHelper.addEventListener(context, browserContext_1.BrowserContext.Events.Page, (page) => {
            this._sendTabList();
            if (!this.selectedPage)
                this._selectPage(page);
        }), utils_1.eventsHelper.addEventListener(context, browserContext_1.BrowserContext.Events.PageClosed, (page) => {
            if (this.selectedPage === page) {
                this._deselectPage();
                const pages = context.pages();
                if (pages.length > 0)
                    this._selectPage(pages[0]);
            }
            this._sendTabList();
        }), utils_1.eventsHelper.addEventListener(context, browserContext_1.BrowserContext.Events.InternalFrameNavigatedToNewDocument, (frame, page) => {
            if (frame === page.mainFrame())
                this._sendTabList();
        }));
        // Auto-select first page.
        const pages = context.pages();
        if (pages.length > 0)
            this._selectPage(pages[0]);
        this._sendCachedState();
    }
    onclose() {
        this._cancelPicking();
        this._deselectPage();
        utils_1.eventsHelper.removeEventListeners(this._contextListeners);
        this._contextListeners = [];
    }
    async dispatch(method, params) {
        return this[method]?.(params);
    }
    async selectTab(params) {
        const page = this._context.pages().find(p => p.guid === params.pageId);
        if (page)
            await this._selectPage(page);
    }
    async closeTab(params) {
        const page = this._context.pages().find(p => p.guid === params.pageId);
        if (page)
            await page.close({ reason: 'Closed from devtools' });
    }
    async newTab() {
        await progress_1.ProgressController.runInternalTask(async (progress) => {
            const page = await this._context.newPage(progress);
            await this._selectPage(page);
        });
    }
    async navigate(params) {
        if (!this.selectedPage || !params.url)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.mainFrame().goto(progress, params.url); });
    }
    async back() {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.goBack(progress, {}); });
    }
    async forward() {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.goForward(progress, {}); });
    }
    async reload() {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.reload(progress, {}); });
    }
    async mousemove(params) {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.mouse.move(progress, params.x, params.y); });
    }
    async mousedown(params) {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.mouse.move(progress, params.x, params.y); await page.mouse.down(progress, { button: params.button || 'left' }); });
    }
    async mouseup(params) {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.mouse.move(progress, params.x, params.y); await page.mouse.up(progress, { button: params.button || 'left' }); });
    }
    async wheel(params) {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.mouse.wheel(progress, params.deltaX, params.deltaY); });
    }
    async keydown(params) {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.keyboard.down(progress, params.key); });
    }
    async keyup(params) {
        if (!this.selectedPage)
            return;
        const page = this.selectedPage;
        await progress_1.ProgressController.runInternalTask(async (progress) => { await page.keyboard.up(progress, params.key); });
    }
    async _selectPage(page) {
        if (this.selectedPage === page)
            return;
        if (this.selectedPage) {
            utils_1.eventsHelper.removeEventListeners(this._pageListeners);
            this._pageListeners = [];
            await this.selectedPage.screencast.stopScreencast(this);
        }
        this.selectedPage = page;
        this._lastFrameData = null;
        this._lastViewportSize = null;
        this._sendTabList();
        this._pageListeners.push(utils_1.eventsHelper.addEventListener(page, page_1.Page.Events.ScreencastFrame, frame => this._writeFrame(frame.buffer, frame.width, frame.height)));
        await page.screencast.startScreencast(this, { width: 1280, height: 800, quality: 90 });
    }
    _deselectPage() {
        if (!this.selectedPage)
            return;
        this._cancelPicking();
        utils_1.eventsHelper.removeEventListeners(this._pageListeners);
        this._pageListeners = [];
        this.selectedPage.screencast.stopScreencast(this);
        this.selectedPage = null;
        this._lastFrameData = null;
        this._lastViewportSize = null;
    }
    async pickLocator() {
        this._cancelPicking();
        const recorder = await recorder_1.Recorder.forContext(this._context, { omitCallTracking: true });
        this._recorder = recorder;
        this._recorderListeners.push(utils_1.eventsHelper.addEventListener(recorder, recorder_1.RecorderEvent.ElementPicked, (elementInfo) => {
            this._emit('elementPicked', { selector: elementInfo.selector });
            this._cancelPicking();
        }));
        recorder.setMode('inspecting');
    }
    async cancelPickLocator() {
        this._cancelPicking();
    }
    _cancelPicking() {
        utils_1.eventsHelper.removeEventListeners(this._recorderListeners);
        this._recorderListeners = [];
        if (this._recorder) {
            this._recorder.setMode('none');
            this._recorder = null;
        }
    }
    _sendCachedState() {
        if (this._lastFrameData && this._lastViewportSize)
            this._emit('frame', { data: this._lastFrameData, viewportWidth: this._lastViewportSize.width, viewportHeight: this._lastViewportSize.height });
        this._sendTabList();
    }
    async tabs() {
        return { tabs: await this._tabList() };
    }
    async _tabList() {
        return await Promise.all(this._context.pages().map(async (page) => ({
            pageId: page.guid,
            title: await page.mainFrame().title().catch(() => '') || page.mainFrame().url(),
            url: page.mainFrame().url(),
            selected: page === this.selectedPage,
            inspectorUrl: this._inspectorUrl(page),
        })));
    }
    _devtoolsURL() {
        if (this._context._browser.options.wsEndpoint) {
            const url = new URL('/devtools/', this._context._browser.options.wsEndpoint);
            if (url.protocol === 'ws:')
                url.protocol = 'http:';
            if (url.protocol === 'wss:')
                url.protocol = 'https:';
            return url;
        }
        return new URL(`https://chrome-devtools-frontend.appspot.com/serve_rev/@${this._context._browser._revision}/`);
    }
    _inspectorUrl(page) {
        if (!(page.delegate instanceof crPage_1.CRPage))
            return;
        const inspector = new URL('./devtools_app.html', this._devtoolsURL());
        const cdp = new URL(this._controllerUrl);
        cdp.searchParams.set('cdp', page.guid);
        inspector.searchParams.set('ws', `${cdp.host}${cdp.pathname}${cdp.search}`);
        return inspector.toString();
    }
    _sendTabList() {
        this._tabList().then(tabs => this._emit('tabs', { tabs }));
    }
    _writeFrame(frame, viewportWidth, viewportHeight) {
        const data = frame.toString('base64');
        this._lastFrameData = data;
        this._lastViewportSize = { width: viewportWidth, height: viewportHeight };
        this._emit('frame', { data, viewportWidth, viewportHeight });
    }
}
class CDPConnection {
    sendEvent;
    close;
    _context;
    _pageId;
    _rawSession = null;
    _rawSessionListeners = [];
    _initializePromise;
    constructor(context, pageId) {
        this._context = context;
        this._pageId = pageId;
    }
    onconnect() {
        this._initializePromise = this._initializeRawSession(this._pageId);
    }
    async dispatch(method, params) {
        await this._initializePromise;
        if (!this._rawSession)
            throw new Error('CDP session is not initialized');
        return await this._rawSession.send(method, params);
    }
    onclose() {
        utils_1.eventsHelper.removeEventListeners(this._rawSessionListeners);
        if (this._rawSession)
            void this._rawSession.detach().catch(() => { });
        this._rawSession = null;
        this._initializePromise = undefined;
    }
    async _initializeRawSession(pageId) {
        const page = this._context.pages().find(p => p.guid === pageId);
        if (!page) {
            this.close?.();
            return;
        }
        const crContext = this._context;
        const session = await crContext.newCDPSession(page);
        this._rawSession = session;
        this._rawSessionListeners = [
            utils_1.eventsHelper.addEventListener(session, crConnection_1.CDPSession.Events.Event, (event) => {
                this.sendEvent?.(event.method, event.params);
            }),
            utils_1.eventsHelper.addEventListener(session, crConnection_1.CDPSession.Events.Closed, () => {
                this.close?.();
            }),
        ];
    }
}
