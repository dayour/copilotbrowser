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
import { BrowserContext } from '../browserContext';
import { APIRequestContext } from '../fetch';
import type { Page } from '../page';
import type * as har from '@trace/har';
export interface HarTracerDelegate {
    onEntryStarted(entry: har.Entry): void;
    onEntryFinished(entry: har.Entry): void;
    onContentBlob(sha1: string, buffer: Buffer): void;
}
type HarTracerOptions = {
    content: 'omit' | 'attach' | 'embed';
    includeTraceInfo: boolean;
    recordRequestOverrides: boolean;
    waitForContentOnStop: boolean;
    urlFilter?: string | RegExp;
    slimMode?: boolean;
    omitSecurityDetails?: boolean;
    omitCookies?: boolean;
    omitTiming?: boolean;
    omitServerIP?: boolean;
    omitPages?: boolean;
    omitSizes?: boolean;
    omitScripts?: boolean;
};
export declare class HarTracer {
    private _context;
    private _barrierPromises;
    private _delegate;
    private _options;
    private _pageEntries;
    private _eventListeners;
    private _started;
    private _entrySymbol;
    private _baseURL;
    private _page;
    constructor(context: BrowserContext | APIRequestContext, page: Page | null, delegate: HarTracerDelegate, options: HarTracerOptions);
    start(options: {
        omitScripts: boolean;
    }): void;
    private _shouldIncludeEntryWithUrl;
    private _entryForRequest;
    private _createPageEntryIfNeeded;
    private _onDOMContentLoaded;
    private _onLoad;
    private _addBarrier;
    private _onAPIRequest;
    private _onAPIRequestFinished;
    private _onRequest;
    private _recordRequestHeadersAndCookies;
    private _recordRequestOverrides;
    private _onRequestFinished;
    private _onRequestFailed;
    private _onRequestAborted;
    private _onRequestFulfilled;
    private _onRequestContinued;
    private _storeResponseContent;
    private _onResponse;
    private _recordResponseHeaders;
    private _computeHarEntryTotalTime;
    flush(): Promise<void>;
    stop(): har.Log;
    private _postDataForRequest;
    private _postDataForBuffer;
}
export {};
