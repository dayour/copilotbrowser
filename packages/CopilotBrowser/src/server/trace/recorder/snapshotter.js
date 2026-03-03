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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snapshotter = void 0;
const snapshotterInjected_1 = require("./snapshotterInjected");
const time_1 = require("../../../utils/isomorphic/time");
const crypto_1 = require("../../utils/crypto");
const debugLogger_1 = require("../../utils/debugLogger");
const eventsHelper_1 = require("../../utils/eventsHelper");
const utilsBundle_1 = require("../../../utilsBundle");
const browserContext_1 = require("../../browserContext");
const page_1 = require("../../page");
class Snapshotter {
    _context;
    _delegate;
    _eventListeners = [];
    _snapshotStreamer;
    _initScript;
    _started = false;
    constructor(context, delegate) {
        this._context = context;
        this._delegate = delegate;
        const guid = (0, crypto_1.createGuid)();
        this._snapshotStreamer = '__copilotbrowser_snapshot_streamer_' + guid;
    }
    started() {
        return this._started;
    }
    async start() {
        this._started = true;
        if (!this._initScript)
            await this._initialize();
        await this.reset();
    }
    async reset() {
        if (this._started)
            await this._context.safeNonStallingEvaluateInAllFrames(`window["${this._snapshotStreamer}"].reset()`, 'main');
    }
    stop() {
        this._started = false;
    }
    async resetForReuse() {
        // Next time we start recording, we will call addInitScript again.
        if (this._initScript) {
            eventsHelper_1.eventsHelper.removeEventListeners(this._eventListeners);
            await this._context.removeInitScripts([this._initScript]);
            this._initScript = undefined;
        }
    }
    async _initialize() {
        for (const page of this._context.pages())
            this._onPage(page);
        this._eventListeners = [
            eventsHelper_1.eventsHelper.addEventListener(this._context, browserContext_1.BrowserContext.Events.Page, this._onPage.bind(this)),
        ];
        const { javaScriptEnabled } = this._context._options;
        const initScriptSource = `(${snapshotterInjected_1.frameSnapshotStreamer})("${this._snapshotStreamer}", ${javaScriptEnabled || javaScriptEnabled === undefined})`;
        this._initScript = await this._context.addInitScript(undefined, initScriptSource);
        await this._context.safeNonStallingEvaluateInAllFrames(initScriptSource, 'main');
    }
    dispose() {
        eventsHelper_1.eventsHelper.removeEventListeners(this._eventListeners);
    }
    async _captureFrameSnapshot(frame) {
        // Prepare expression synchronously.
        const needsReset = !!frame[kNeedsResetSymbol];
        frame[kNeedsResetSymbol] = false;
        const expression = `window["${this._snapshotStreamer}"].captureSnapshot(${needsReset ? 'true' : 'false'})`;
        try {
            return await frame.nonStallingRawEvaluateInExistingMainContext(expression);
        }
        catch (e) {
            // If we fail to capture snapshot in this frame, we cannot rely on the snapshot index
            // being the same here and in snapshotter injected script.
            // Therefore, next time force a reset to avoid using node references.
            frame[kNeedsResetSymbol] = true;
            debugLogger_1.debugLogger.log('error', e);
        }
    }
    async captureSnapshot(page, callId, snapshotName) {
        // In each frame, in a non-stalling manner, capture the snapshots.
        const snapshots = page.frames().map(async (frame) => {
            const data = await this._captureFrameSnapshot(frame);
            // Something went wrong -> bail out, our snapshots are best-efforty.
            if (!data || !this._started)
                return;
            const snapshot = {
                callId,
                snapshotName,
                pageId: page.guid,
                frameId: frame.guid,
                frameUrl: data.url,
                doctype: data.doctype,
                html: data.html,
                viewport: data.viewport,
                timestamp: (0, time_1.monotonicTime)(),
                wallTime: data.wallTime,
                collectionTime: data.collectionTime,
                resourceOverrides: [],
                isMainFrame: page.mainFrame() === frame
            };
            for (const { url, content, contentType } of data.resourceOverrides) {
                if (typeof content === 'string') {
                    const buffer = Buffer.from(content);
                    const sha1 = (0, crypto_1.calculateSha1)(buffer) + '.' + (utilsBundle_1.mime.getExtension(contentType) || 'dat');
                    this._delegate.onSnapshotterBlob({ sha1, buffer });
                    snapshot.resourceOverrides.push({ url, sha1 });
                }
                else {
                    snapshot.resourceOverrides.push({ url, ref: content });
                }
            }
            this._delegate.onFrameSnapshot(snapshot);
        });
        await Promise.all(snapshots);
    }
    _onPage(page) {
        // Annotate frame hierarchy so that snapshots could include frame ids.
        for (const frame of page.frames())
            this._annotateFrameHierarchy(frame);
        this._eventListeners.push(eventsHelper_1.eventsHelper.addEventListener(page, page_1.Page.Events.FrameAttached, frame => this._annotateFrameHierarchy(frame)));
    }
    async _annotateFrameHierarchy(frame) {
        try {
            const frameElement = await frame.frameElement();
            const parent = frame.parentFrame();
            if (!parent)
                return;
            const context = await parent._mainContext();
            await context?.evaluate(({ snapshotStreamer, frameElement, frameId }) => {
                window[snapshotStreamer].markIframe(frameElement, frameId);
            }, { snapshotStreamer: this._snapshotStreamer, frameElement, frameId: frame.guid });
            frameElement.dispose();
        }
        catch (e) {
        }
    }
}
exports.Snapshotter = Snapshotter;
const kNeedsResetSymbol = Symbol('kNeedsReset');
