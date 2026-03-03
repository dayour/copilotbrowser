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
exports.Browser = void 0;
const artifact_1 = require("./artifact");
const browserContext_1 = require("./browserContext");
const download_1 = require("./download");
const instrumentation_1 = require("./instrumentation");
const socksClientCertificatesInterceptor_1 = require("./socksClientCertificatesInterceptor");
class Browser extends instrumentation_1.SdkObject {
    static Events = {
        Context: 'context',
        Disconnected: 'disconnected',
    };
    options;
    _downloads = new Map();
    _defaultContext = null;
    _startedClosing = false;
    _idToVideo = new Map();
    _contextForReuse;
    _closeReason;
    _isCollocatedWithServer = true;
    constructor(parent, options) {
        super(parent, 'browser');
        this.attribution.browser = this;
        this.options = options;
        this.instrumentation.onBrowserOpen(this);
    }
    sdkLanguage() {
        return this.options.sdkLanguage || this.attribution.copilotbrowser.options.sdkLanguage;
    }
    async newContext(progress, options) {
        (0, browserContext_1.validateBrowserContextOptions)(options, this.options);
        let clientCertificatesProxy;
        let context;
        try {
            if (options.clientCertificates?.length) {
                clientCertificatesProxy = await socksClientCertificatesInterceptor_1.ClientCertificatesProxy.create(progress, options);
                options = { ...options };
                options.proxyOverride = clientCertificatesProxy.proxySettings();
                options.internalIgnoreHTTPSErrors = true;
            }
            context = await progress.race(this.doCreateNewContext(options));
            context._clientCertificatesProxy = clientCertificatesProxy;
            if (options.__testHookBeforeSetStorageState)
                await progress.race(options.__testHookBeforeSetStorageState());
            await context.setStorageState(progress, options.storageState, 'initial');
            this.emit(Browser.Events.Context, context);
            return context;
        }
        catch (error) {
            await context?.close({ reason: 'Failed to create context' }).catch(() => { });
            await clientCertificatesProxy?.close().catch(() => { });
            throw error;
        }
    }
    async newContextForReuse(progress, params) {
        const hash = browserContext_1.BrowserContext.reusableContextHash(params);
        if (!this._contextForReuse || hash !== this._contextForReuse.hash || !this._contextForReuse.context.canResetForReuse()) {
            if (this._contextForReuse)
                await this._contextForReuse.context.close({ reason: 'Context reused' });
            this._contextForReuse = { context: await this.newContext(progress, params), hash };
            return this._contextForReuse.context;
        }
        await this._contextForReuse.context.resetForReuse(progress, params);
        return this._contextForReuse.context;
    }
    contextForReuse() {
        return this._contextForReuse?.context;
    }
    _downloadCreated(page, uuid, url, suggestedFilename) {
        const download = new download_1.Download(page, this.options.downloadsPath || '', uuid, url, suggestedFilename);
        this._downloads.set(uuid, download);
    }
    _downloadFilenameSuggested(uuid, suggestedFilename) {
        const download = this._downloads.get(uuid);
        if (!download)
            return;
        download._filenameSuggested(suggestedFilename);
    }
    _downloadFinished(uuid, error) {
        const download = this._downloads.get(uuid);
        if (!download)
            return;
        download.artifact.reportFinished(error ? new Error(error) : undefined);
        this._downloads.delete(uuid);
    }
    _videoStarted(page, videoId, path) {
        const artifact = new artifact_1.Artifact(page.browserContext, path);
        page.video = artifact;
        this._idToVideo.set(videoId, { context: page.browserContext, artifact });
        return artifact;
    }
    _takeVideo(videoId) {
        const video = this._idToVideo.get(videoId);
        this._idToVideo.delete(videoId);
        return video?.artifact;
    }
    _didClose() {
        for (const context of this.contexts())
            context._browserClosed();
        if (this._defaultContext)
            this._defaultContext._browserClosed();
        this.emit(Browser.Events.Disconnected);
        this.instrumentation.onBrowserClose(this);
    }
    async close(options) {
        if (!this._startedClosing) {
            if (options.reason)
                this._closeReason = options.reason;
            this._startedClosing = true;
            await this.options.browserProcess.close();
        }
        if (this.isConnected())
            await new Promise(x => this.once(Browser.Events.Disconnected, x));
    }
    async killForTests() {
        await this.options.browserProcess.kill();
    }
}
exports.Browser = Browser;
